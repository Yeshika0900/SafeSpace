export const LIMITS = {
  history: 30,
  text: 256,
  services: 32,
  characteristics: 64,
  payload: 262144,
  devices: 512,
} as const;
export const KEYS = {
  checklist: "safespace_checklist_v1",
  history: "safespace_ble_history",
  aliases: "safespace_device_names",
} as const;
export const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const text = (value: unknown, fallback = ""): string =>
  typeof value === "string"
    ? Array.from(value.slice(0, LIMITS.text))
        .filter(
          (char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127,
        )
        .join("")
        .replace(/[\u202a-\u202e\u2066-\u2069]/g, "")
        .trim()
    : fallback;
export function assessName(value: unknown) {
  const name = text(value).normalize("NFKC");
  if (!name)
    return {
      label: "Name unknown",
      detail:
        "No readable advertised name was recorded. Unnamed devices are common; this is not evidence of surveillance.",
    };
  if (/\b(camera|tracker|airtag|smart\s?tag|tile|gps|spy)\b/i.test(name))
    return {
      label: "Name needs manual verification",
      detail:
        "The advertised name contains a camera/tracker-related keyword. Names can be spoofed or misleading; this is not proof of surveillance.",
    };
  return {
    label: "No obvious name indicator",
    detail:
      "No known keyword was found in the advertised name. This does not establish that the device or room is safe.",
  };
}
export type Characteristic = {
  uuid: string;
  shortUuid: string;
  label: string;
  properties: string[];
};
export type Service = {
  uuid: string;
  shortUuid: string;
  label: string;
  context: string;
  characteristics: Characteristic[];
  characteristicStatus: string;
};
export type BleRecord = {
  version: 2;
  id: string;
  name: string;
  advertisedName: string;
  alias: string;
  inspectedAt: string;
  gattStatus: string;
  services: Service[];
  assessment: ReturnType<typeof assessName>;
  note: string;
  rssi?: number;
};
export function normalizeRecord(value: unknown): BleRecord | null {
  if (!object(value) || !text(value.id)) return null;
  // Legacy names may be aliases or characteristic values. Keep the display label,
  // but never promote it into advertised evidence. Drop deviceDetails entirely.
  const advertisedName = value.version === 2 ? text(value.advertisedName) : "";
  const alias = text(value.alias) || (!advertisedName ? text(value.name) : "");
  const services: Service[] = Array.isArray(value.services)
    ? value.services
        .slice(0, LIMITS.services)
        .filter(object)
        .map((s) => ({
          uuid: text(s.uuid),
          shortUuid: text(s.shortUuid),
          label: text(s.label),
          context: text(s.context),
          characteristicStatus: text(s.characteristicStatus),
          characteristics: Array.isArray(s.characteristics)
            ? s.characteristics
                .slice(0, LIMITS.characteristics)
                .filter(object)
                .map((c) => ({
                  uuid: text(c.uuid),
                  shortUuid: text(c.shortUuid),
                  label: text(c.label),
                  properties: Array.isArray(c.properties)
                    ? c.properties
                        .filter((x) => typeof x === "string")
                        .slice(0, 5)
                        .map((x) => text(x))
                    : [],
                }))
            : [],
        }))
    : [];
  return {
    version: 2,
    id: text(value.id),
    advertisedName,
    alias,
    name: alias || advertisedName || "Name not advertised",
    inspectedAt: text(value.inspectedAt || value.time),
    gattStatus: text(value.gattStatus, "Not inspected"),
    services,
    assessment: assessName(advertisedName),
    note: text(value.note),
    ...(typeof value.rssi === "number" &&
    Number.isFinite(value.rssi) &&
    value.rssi >= -127 &&
    value.rssi <= 20
      ? { rssi: value.rssi }
      : {}),
  };
}
export function normalizeHistory(value: unknown): BleRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .slice(0, LIMITS.history)
    .map(normalizeRecord)
    .filter((r): r is BleRecord => !!r && !seen.has(r.id) && !!seen.add(r.id));
}
export function normalizeChecklist(value: unknown): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  if (object(value))
    for (let i = 0; i < 6; i++) {
      const entry = value[i];
      if (typeof entry === "boolean") result[i] = entry;
    }
  return result;
}
export function normalizeAliases(value: unknown): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  if (object(value))
    for (const [id, name] of Object.entries(value).slice(0, LIMITS.history))
      if (text(id) && text(name)) result[text(id)] = text(name);
  return result;
}
