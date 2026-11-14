import { isIP } from "node:net";
import { execFile } from "node:child_process";
export class InventoryError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
export function validIPv4(ip) {
  if (isIP(ip) !== 4) return false;
  const parts = ip.split(".").map(Number);
  return parts[0] > 0 && parts[0] < 224 && parts[0] !== 127 && parts[3] !== 255;
}
export function normalizeMac(value, abbreviated = false) {
  const pattern = abbreviated
    ? /^[\da-f]{1,2}(?::[\da-f]{1,2}){5}$/i
    : /^(?:[\da-f]{2}:){5}[\da-f]{2}$|^(?:[\da-f]{2}-){5}[\da-f]{2}$/i;
  if (!pattern.test(value)) return null;
  const parts = value
    .toLowerCase()
    .split(/[:-]/)
    .map((x) => x.padStart(2, "0"));
  if (parseInt(parts[0], 16) & 1 || parts.every((x) => x === "00")) return null;
  return parts.join(":");
}
/** Parse IPv4 neighbours only. Unknown output is an error, never a clean empty result. */
export function parseNeighbours(output, format) {
  if (typeof output !== "string" || output.length > 262144)
    throw new InventoryError("invalid_output");
  const devices = [],
    seen = new Set();
  let parseNeighboursInterface;
  let recognized = format === "linux-ip" && !output.trim();
  for (const line of output.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    let ip, mac, iface;
    if (format === "windows") {
      const header = row.match(
        /^.*?:\s*(\d+\.\d+\.\d+\.\d+)\s+---\s+(0x[\da-f]+)$/i,
      );
      if (header) {
        recognized = true;
        parseNeighboursInterface = `${header[1]} (${header[2]})`;
        continue;
      }
      const match = row.match(/^(\S+)\s+(\S+)\s+(dynamic|static|\p{L}+)$/u);
      if (match && /^\d+\./.test(match[1])) {
        recognized = true;
        [, ip, mac] = match;
        iface = parseNeighboursInterface;
      } else if (
        /Internet Address\s+Physical Address\s+Type|No ARP Entries Found\.?/i.test(
          row,
        )
      )
        recognized = true;
    } else if (format === "linux-ip") {
      const match = row.match(/^(\S+)\s+dev\s+(\S+)(?:\s+.*)?$/);
      if (match) {
        recognized = true;
        ip = match[1];
        iface = match[2];
        mac = row.match(/\blladdr\s+(\S+)/)?.[1];
      }
    } else if (format === "linux-arp" || format === "macos") {
      const match = row.match(/^.*?\(([^)]+)\)\s+at\s+(\S+).*?\s+on\s+(\S+)/);
      const table = row.match(
        /^(\S+)\s+ether\s+(\S+)\s+\S+\s+(?:\S+\s+)?(\S+)$/,
      );
      if (match) {
        recognized = true;
        [, ip, mac, iface] = match;
      } else if (table) {
        recognized = true;
        [, ip, mac, iface] = table;
      } else if (
        /Address\s+HWtype\s+HWaddress|no match found|no entries/i.test(row)
      )
        recognized = true;
    } else throw new InventoryError("unsupported_platform");
    const normalized = mac && normalizeMac(mac, format === "macos");
    if (!ip || !validIPv4(ip) || !normalized) continue;
    const networkInterface = iface || "Interface not reported";
    const key = `${ip}|${normalized}|${networkInterface}`;
    if (seen.has(key)) continue;
    seen.add(key);
    devices.push({ ip, mac: normalized, interface: networkInterface });
    if (devices.length >= 512) break;
  }
  if (!recognized) throw new InventoryError("unsupported_output");
  return devices;
}
export function execute(command, args, runner = execFile) {
  return new Promise((resolve, reject) => {
    runner(
      command,
      args,
      { timeout: 5000, maxBuffer: 262144, encoding: "utf8", windowsHide: true },
      (error, stdout) => {
        if (error) {
          const code =
            error.code === "ENOENT"
              ? "missing_command"
              : error.killed
                ? "command_timeout"
                : "command_failed";
          reject(new InventoryError(code));
        } else resolve(stdout);
      },
    );
  });
}
export async function readInventory(
  platform = process.platform,
  run = execute,
) {
  if (platform === "win32")
    return parseNeighbours(await run("arp", ["-a"]), "windows");
  if (platform === "darwin")
    return parseNeighbours(await run("arp", ["-an"]), "macos");
  if (platform === "linux") {
    try {
      return parseNeighbours(
        await run("ip", ["-4", "neigh", "show"]),
        "linux-ip",
      );
    } catch (error) {
      if (error.code !== "missing_command") throw error;
      return parseNeighbours(await run("arp", ["-an"]), "linux-arp");
    }
  }
  throw new InventoryError("unsupported_platform");
}
