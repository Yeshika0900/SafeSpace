import { test, expect, vi } from "vitest";
import { fetchInventory, validateInventory } from "../services/network";
const valid = {
  hostname: "synthetic-host",
  retrievedAt: "2026-11-14T00:00:00.000Z",
  devices: [{ ip: "10.0.0.2", mac: "02:aa:bb:cc:dd:ee", interface: "eth0" }],
};
for (const value of [
  null,
  { devices: null },
  { ...valid, devices: [null] },
  { ...valid, devices: [{ ip: "999.2.3.4" }] },
  { ...valid, retrievedAt: "bad" },
])
  test(`reject invalid response ${JSON.stringify(value)}`, () =>
    expect(() => validateInventory(value)).toThrow("Invalid response"));
test("valid inventory and custom header contract", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(valid)));
  expect(await fetchInventory(new AbortController().signal, fetcher)).toEqual(
    valid,
  );
  expect(fetcher.mock.calls[0][1].headers).toEqual({
    "X-SafeSpace-Client": "inventory-v1",
  });
});
test("offline helper has actionable local-network error", async () => {
  await expect(
    fetchInventory(
      new AbortController().signal,
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    ),
  ).rejects.toThrow("local-network access blocked");
});
test("JSON null and invalid JSON remain tool errors", async () => {
  for (const body of ["null", '{"devices":null}', "not json"])
    await expect(
      fetchInventory(
        new AbortController().signal,
        vi.fn().mockResolvedValue(new Response(body)),
      ),
    ).rejects.toThrow("Invalid response");
});
test("request deadline aborts slow helper", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(
    (_, opts) =>
      new Promise((_, reject) =>
        opts.signal.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        ),
      ),
  );
  const result = fetchInventory(new AbortController().signal, fetcher, 100);
  const assertion = expect(result).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(101);
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
test("leaving tool aborts fetch and clears deadline", async () => {
  vi.useFakeTimers();
  const c = new AbortController();
  const fetcher = vi.fn(
    (_, opts) =>
      new Promise((_, reject) =>
        opts.signal.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        ),
      ),
  );
  const result = fetchInventory(c.signal, fetcher);
  c.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(vi.getTimerCount()).toBe(0);
});
test("response size bounded without Content-Length", async () => {
  await expect(
    fetchInventory(
      new AbortController().signal,
      vi.fn().mockResolvedValue(new Response("x".repeat(262145))),
    ),
  ).rejects.toThrow("Invalid response");
});
test("helper failure is distinct from offline", async () => {
  await expect(
    fetchInventory(
      new AbortController().signal,
      vi.fn().mockResolvedValue(new Response("{}", { status: 503 })),
    ),
  ).rejects.toThrow("rejected");
});
