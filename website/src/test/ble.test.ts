import { test, expect, vi } from "vitest";
import { inspectBrowser, scanNative, type BleDevice } from "../services/ble";
import { delay } from "../services/async";
import type { ScanResult } from "@capacitor-community/bluetooth-le";
function device() {
  const readValue = vi.fn();
  const characteristic = {
    uuid: "00002a25-0000-1000-8000-00805f9b34fb",
    properties: { read: true },
    readValue,
  };
  const getCharacteristics = vi.fn().mockResolvedValue([characteristic]);
  const getPrimaryServices = vi
    .fn()
    .mockResolvedValue([
      { uuid: "0000180a-0000-1000-8000-00805f9b34fb", getCharacteristics },
    ]);
  const d = {
    id: "synthetic",
    name: "",
    gatt: {
      connect: vi.fn().mockResolvedValue({ getPrimaryServices }),
      disconnect: vi.fn(),
    },
  };
  return { d, readValue, getCharacteristics, getPrimaryServices };
}
test("chooser is invoked synchronously; alias is not evidence; serial value never read", async () => {
  const { d, readValue } = device();
  const requestDevice = vi.fn().mockResolvedValue(d);
  const promise = inspectBrowser(
    { requestDevice },
    new AbortController().signal,
    () => "My camera",
  );
  expect(requestDevice).toHaveBeenCalledOnce();
  const r = await promise;
  expect(readValue).not.toHaveBeenCalled();
  expect(r.alias).toBe("My camera");
  expect(r.advertisedName).toBe("");
  expect(r.assessment.label).toBe("Name unknown");
  expect(d.gatt.disconnect).toHaveBeenCalled();
  expect(JSON.stringify(r)).not.toContain("deviceDetails");
});
test("synchronous chooser exception becomes a handled rejection", async () => {
  await expect(
    inspectBrowser(
      {
        requestDevice() {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
      new AbortController().signal,
      () => "",
    ),
  ).rejects.toThrow("denied");
});
test("cancel while chooser is pending ignores late selection", async () => {
  let resolve!: (d: BleDevice) => void;
  const promise = new Promise<BleDevice>((r) => (resolve = r)),
    c = new AbortController();
  const { d } = device();
  const result = inspectBrowser(
    { requestDevice: () => promise },
    c.signal,
    () => "",
  );
  c.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  resolve(d);
  await Promise.resolve();
  expect(d.gatt.connect).not.toHaveBeenCalled();
  expect(d.gatt.disconnect).toHaveBeenCalled();
});
test("bounded connect cancellation disconnects both immediately and late", async () => {
  const { d } = device();
  let resolve!: (v: unknown) => void;
  d.gatt.connect.mockReturnValue(new Promise((r) => (resolve = r)));
  const c = new AbortController();
  const p = inspectBrowser(
    { requestDevice: async () => d },
    c.signal,
    () => "",
  );
  await Promise.resolve();
  await Promise.resolve();
  c.abort();
  await expect(p).rejects.toMatchObject({ name: "AbortError" });
  resolve({ getPrimaryServices: vi.fn() });
  await Promise.resolve();
  expect(d.gatt.disconnect.mock.calls.length).toBeGreaterThanOrEqual(2);
});
test("restricted service produces partial truthful metadata and disconnects", async () => {
  const { d, getCharacteristics } = device();
  getCharacteristics.mockRejectedValue(new Error("restricted"));
  const r = await inspectBrowser(
    { requestDevice: async () => d },
    new AbortController().signal,
    () => "",
  );
  expect(r.services[0].characteristicStatus).toContain("restricted");
  expect(d.gatt.disconnect).toHaveBeenCalled();
});
test("native scan abort stops scanning and ignores late callback", async () => {
  vi.useFakeTimers();
  let callback!: (r: ScanResult) => void;
  const adapter = {
    initialize: vi.fn().mockResolvedValue(undefined),
    requestLEScan: vi.fn((_, cb) => {
      callback = cb;
      return Promise.resolve();
    }),
    stopLEScan: vi.fn().mockResolvedValue(undefined),
  };
  const c = new AbortController();
  const p = scanNative(c.signal, adapter);
  await Promise.resolve();
  await Promise.resolve();
  c.abort();
  await expect(p).rejects.toMatchObject({ name: "AbortError" });
  callback({ device: { deviceId: "late", name: "camera" } } as ScanResult);
  expect(adapter.stopLEScan).toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
test("native delayed scan startup is stopped when it resolves after cancellation", async () => {
  let resolve!: () => void;
  const adapter = {
    initialize: async () => {},
    requestLEScan: () => new Promise<void>((r) => (resolve = r)),
    stopLEScan: vi.fn().mockResolvedValue(undefined),
  };
  const c = new AbortController();
  const p = scanNative(c.signal, adapter);
  await Promise.resolve();
  await Promise.resolve();
  c.abort();
  await expect(p).rejects.toThrow();
  resolve();
  await Promise.resolve();
  expect(adapter.stopLEScan.mock.calls.length).toBeGreaterThanOrEqual(2);
});
test("native empty scan succeeds; RSSI is data only", async () => {
  vi.useFakeTimers();
  const adapter = {
    initialize: async () => {},
    requestLEScan: async () => {},
    stopLEScan: vi.fn().mockResolvedValue(undefined),
  };
  const p = scanNative(new AbortController().signal, adapter, 100);
  await vi.advanceTimersByTimeAsync(100);
  expect(await p).toEqual([]);
  expect(adapter.stopLEScan).toHaveBeenCalledOnce();
});
test("abortable delay removes timer on timeout or tool teardown", async () => {
  vi.useFakeTimers();
  const c = new AbortController();
  const p = delay(10000, c.signal);
  c.abort();
  await expect(p).rejects.toThrow();
  expect(vi.getTimerCount()).toBe(0);
});
test("native initialization failure still releases scanning state", async () => {
  const adapter = {
    initialize: vi.fn().mockRejectedValue(new Error("Bluetooth off")),
    requestLEScan: vi.fn(),
    stopLEScan: vi.fn().mockResolvedValue(undefined),
  };
  await expect(
    scanNative(new AbortController().signal, adapter),
  ).rejects.toThrow("Bluetooth off");
  expect(adapter.requestLEScan).not.toHaveBeenCalled();
  expect(adapter.stopLEScan).toHaveBeenCalled();
});
test("malformed native callback is ignored without an uncaught event error", async () => {
  vi.useFakeTimers();
  const adapter = {
    initialize: async () => {},
    requestLEScan: async (_, cb) => {
      cb(null);
      cb({});
      cb({ device: null });
    },
    stopLEScan: vi.fn().mockResolvedValue(undefined),
  };
  const p = scanNative(new AbortController().signal, adapter, 1);
  await vi.advanceTimersByTimeAsync(1);
  expect(await p).toEqual([]);
});
