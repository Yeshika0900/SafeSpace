import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseNeighbours,
  readInventory,
  execute,
  InventoryError,
} from "./inventory.js";
const win =
  "Interface: 10.0.0.1 --- 0xb\n  Internet Address      Physical Address      Type\n";
const cases = [
  ["Windows dynamic", win + "10.0.0.2 02-aa-bb-cc-dd-ee dynamic", "windows", 1],
  ["Windows static", win + "10.0.0.2 02-aa-bb-cc-dd-ee static", "windows", 1],
  [
    "duplicate rows",
    win +
      "10.0.0.2 02-aa-bb-cc-dd-ee dynamic\n10.0.0.2 02-aa-bb-cc-dd-ee dynamic",
    "windows",
    1,
  ],
  [
    "Linux ip",
    "10.0.0.2 dev eth0 lladdr 02:aa:bb:cc:dd:ee REACHABLE",
    "linux-ip",
    1,
  ],
  [
    "Linux arp",
    "? (10.0.0.2) at 02:aa:bb:cc:dd:ee [ether] on eth0",
    "linux-arp",
    1,
  ],
  [
    "Linux table",
    "Address HWtype HWaddress Flags Mask Iface\n10.0.0.2 ether 02:aa:bb:cc:dd:ee C eth0",
    "linux-arp",
    1,
  ],
  [
    "macOS abbreviated",
    "? (10.0.0.2) at 2:a:b:c:d:e on en0 ifscope [ethernet]",
    "macos",
    1,
  ],
  ["multicast IP", win + "224.0.0.1 02-aa-bb-cc-dd-ee static", "windows", 0],
  ["multicast MAC", win + "10.0.0.2 01-aa-bb-cc-dd-ee static", "windows", 0],
  ["broadcast", win + "10.0.0.255 ff-ff-ff-ff-ff-ff static", "windows", 0],
  ["bad IP", win + "999.999.999.999 02-aa-bb-cc-dd-ee dynamic", "windows", 0],
  ["bad MAC", win + "10.0.0.2 02-aa-bb-cc-dd-gg dynamic", "windows", 0],
  [
    "mixed separators",
    win + "10.0.0.2 02-aa:bb-cc-dd-ee dynamic",
    "windows",
    0,
  ],
  ["incomplete", "10.0.0.2 dev eth0 INCOMPLETE", "linux-ip", 0],
  [
    "macOS incomplete",
    "? (10.0.0.2) at (incomplete) on en0 ifscope [ethernet]",
    "macos",
    0,
  ],
  [
    "multiple interfaces",
    win +
      "10.0.0.2 02-aa-bb-cc-dd-ee static\nInterface: 10.0.1.1 --- 0xc\n10.0.0.2 02-aa-bb-cc-dd-ee static",
    "windows",
    2,
  ],
  ["empty Linux cache", "", "linux-ip", 0],
  ["empty Windows cache", "No ARP Entries Found.", "windows", 0],
  [
    "localized rows",
    "Schnittstelle: 10.0.0.1 --- 0xb\n10.0.0.2 02-aa-bb-cc-dd-ee dynamisch",
    "windows",
    1,
  ],
  [
    "IPv6 excluded",
    "fe80::1 dev eth0 lladdr 02:aa:bb:cc:dd:ee STALE",
    "linux-ip",
    0,
  ],
];
for (const [name, input, format, count] of cases)
  test(name, () => assert.equal(parseNeighbours(input, format).length, count));
test("retains interface and normalizes MAC", () =>
  assert.deepEqual(
    parseNeighbours("? (10.0.0.2) at 2:a:b:c:d:e on en0 ifscope", "macos"),
    [{ ip: "10.0.0.2", mac: "02:0a:0b:0c:0d:0e", interface: "en0" }],
  ));
for (const input of ["unknown localized error", "definitely invalid", ""])
  test(`unsupported output ${JSON.stringify(input)}`, () =>
    assert.throws(
      () => parseNeighbours(input, "windows"),
      /unsupported_output/,
    ));
test("no interface state leaks between reads", () => {
  parseNeighbours(win, "windows");
  assert.equal(
    parseNeighbours("10.0.0.2 02-aa-bb-cc-dd-ee static", "windows")[0]
      .interface,
    "Interface not reported",
  );
});
test("Linux fixed command and missing executable fallback", async () => {
  const calls = [];
  const result = await readInventory("linux", async (cmd, args) => {
    calls.push([cmd, args]);
    if (cmd === "ip") throw new InventoryError("missing_command");
    return "? (10.0.0.2) at 02:aa:bb:cc:dd:ee [ether] on eth0";
  });
  assert.equal(result.length, 1);
  assert.deepEqual(calls, [
    ["ip", ["-4", "neigh", "show"]],
    ["arp", ["-an"]],
  ]);
});
test("missing command is deliberate failure", async () =>
  assert.rejects(
    readInventory("win32", async () => {
      throw new InventoryError("missing_command");
    }),
    /missing_command/,
  ));
test("unsupported platform", async () =>
  assert.rejects(readInventory("other"), /unsupported_platform/));
test("subprocess bounds and timeout classification", async () => {
  await assert.rejects(
    execute("arp", ["-a"], (cmd, args, opts, cb) => {
      assert.equal(opts.timeout, 5000);
      assert.equal(opts.maxBuffer, 262144);
      cb({ killed: true }, "");
    }),
    /command_timeout/,
  );
});
test("real subprocess timeout kills a harmless synthetic child", async () => {
  const start = Date.now();
  await assert.rejects(
    execute(process.execPath, ["-e", "setTimeout(()=>{},30000)"]),
    /command_timeout/,
  );
  assert.ok(Date.now() - start < 10000);
});
