import { BleClient, type ScanResult } from "@capacitor-community/bluetooth-le";
import { normalizeRecord, LIMITS, text, type BleRecord } from "./records";
import {
  optionalServices,
  shortUuid,
  serviceNames,
  characteristicNames,
  serviceContext,
} from "./ble-metadata";
import { cancelled, waitFor, delay } from "./async";
export interface GattCharacteristic {
  uuid: string;
  properties: Record<string, boolean>;
}
export interface GattService {
  uuid: string;
  getCharacteristics(): Promise<GattCharacteristic[]>;
}
export interface Gatt {
  connect(): Promise<{ getPrimaryServices(): Promise<GattService[]> }>;
  disconnect(): void;
}
export interface BleDevice {
  id: string;
  name?: string;
  gatt?: Gatt;
}
export interface BrowserBle {
  requestDevice(options: {
    acceptAllDevices: boolean;
    optionalServices: string[];
  }): Promise<BleDevice>;
}
export function disconnect(device: BleDevice) {
  try {
    device.gatt?.disconnect();
  } catch {
    /* Device may already be gone. */
  }
}
export function inspectBrowser(
  adapter: BrowserBle,
  signal: AbortSignal,
  aliasFor: (device: BleDevice) => string,
): Promise<BleRecord> {
  // Preserve chooser user activation: no await or import precedes requestDevice.
  try {
    return inspectRequest(
      adapter.requestDevice({ acceptAllDevices: true, optionalServices }),
      signal,
      aliasFor,
    );
  } catch (error) {
    return Promise.reject(error);
  }
}
async function inspectRequest(
  request: Promise<BleDevice>,
  signal: AbortSignal,
  aliasFor: (device: BleDevice) => string,
): Promise<BleRecord> {
  const device = await waitFor(request, signal, disconnect);
  cancelled(signal);
  const record = normalizeRecord({
    version: 2,
    id: device.id,
    advertisedName: device.name,
    alias: aliasFor(device),
    inspectedAt: new Date().toISOString(),
    gattStatus: "GATT not available",
    services: [],
    note: "Browser-selected GATT inspection. Only service and characteristic capabilities are enumerated; no characteristic values are read. Browser signal strength is not available.",
  });
  if (!record) throw new Error("Invalid device metadata.");
  if (!device.gatt) return record;
  const abort = () => disconnect(device);
  signal.addEventListener("abort", abort, { once: true });
  try {
    const server = await waitFor(device.gatt.connect(), signal, () =>
      disconnect(device),
    );
    cancelled(signal);
    const services = await waitFor(server.getPrimaryServices(), signal);
    for (const service of services.slice(0, LIMITS.services)) {
      cancelled(signal);
      const uuid = text(service.uuid).toLowerCase();
      const item = {
        uuid,
        shortUuid: shortUuid(uuid),
        label: serviceNames[uuid] || "Unrecognised or vendor-specific service",
        context: serviceContext(uuid),
        characteristics: [] as BleRecord["services"][number]["characteristics"],
        characteristicStatus: "Not inspected",
      };
      try {
        const chars = await waitFor(service.getCharacteristics(), signal);
        item.characteristics = chars
          .slice(0, LIMITS.characteristics)
          .map((c) => {
            const id = text(c.uuid).toLowerCase();
            return {
              uuid: id,
              shortUuid: shortUuid(id),
              label: characteristicNames[id] || "Unrecognised characteristic",
              properties: [
                ["read", "Read"],
                ["write", "Write"],
                ["writeWithoutResponse", "Write without response"],
                ["notify", "Notify"],
                ["indicate", "Indicate"],
              ]
                .filter(([key]) => c.properties[key])
                .map(([, label]) => label),
            };
          });
        item.characteristicStatus = "Capabilities inspected; values not read";
      } catch {
        cancelled(signal);
        item.characteristicStatus = "Capabilities restricted or unavailable";
      }
      record.services.push(item);
    }
    record.gattStatus = services.length
      ? `Accessible metadata inspected${services.length > LIMITS.services ? " (service limit reached)" : ""}`
      : "No accessible primary services returned";
  } catch {
    cancelled(signal);
    record.gattStatus =
      "GATT inspection incomplete; device disconnected, unavailable or access restricted";
  } finally {
    signal.removeEventListener("abort", abort);
    disconnect(device);
  }
  return record;
}
export interface NativeBle {
  initialize(): Promise<void>;
  requestLEScan(
    options: { allowDuplicates: boolean },
    callback: (result: ScanResult) => void,
  ): Promise<void>;
  stopLEScan(): Promise<void>;
}
export async function scanNative(
  signal: AbortSignal,
  adapter: NativeBle = BleClient,
  durationMs = 10000,
): Promise<BleRecord[]> {
  const found = new Map<string, BleRecord>();
  let active = true;
  const stop = () => {
    void adapter.stopLEScan().catch(() => {});
  };
  const abort = () => {
    active = false;
    stop();
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    await waitFor(adapter.initialize(), signal);
    cancelled(signal);
    await waitFor(
      adapter.requestLEScan({ allowDuplicates: false }, (result) => {
        if (!active || signal.aborted || found.size >= LIMITS.history) return;
        if (
          !result ||
          !result.device ||
          typeof result.device.deviceId !== "string"
        )
          return;
        const record = normalizeRecord({
          version: 2,
          id: result.device.deviceId,
          advertisedName: result.device.name,
          rssi: result.rssi,
          inspectedAt: new Date().toISOString(),
          gattStatus: "Advertisement observed; GATT not connected",
          services: [],
          note: "Native BLE advertisement scan. Names can be spoofed. RSSI is a signal measurement, not precise distance or a surveillance assessment.",
        });
        if (record) found.set(record.id, record);
      }),
      signal,
      stop,
    );
    await delay(durationMs, signal);
    cancelled(signal);
    return [...found.values()];
  } finally {
    active = false;
    signal.removeEventListener("abort", abort);
    stop();
  }
}
