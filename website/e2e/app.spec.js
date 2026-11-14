import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia() {
          throw new Error("Real sensing prohibited in tests");
        },
      },
    });
    localStorage.setItem("safespace_checklist_v1", "null");
    localStorage.setItem("safespace_ble_history", "[null]");
  });
  await page.route("http://127.0.0.1:4174/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"devices":null}',
    }),
  );
});
for (const width of [320, 390, 768, 1440])
  test(`existing tools and malformed data remain usable at ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Start inspection" }).click();
    await expect(
      page.getByRole("region", { name: "Inspection workspace" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "View safety checklist" }).click();
    await expect(page.getByRole("checkbox")).toHaveCount(6);
    await page.getByRole("checkbox").first().check();
    await page
      .getByRole("button", { name: "Bluetooth Discovery", exact: true })
      .click();
    await expect(
      page.getByText("No Bluetooth inspections saved yet."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Wi-Fi Inventory", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Refresh device inventory" })
      .click();
    await expect(page.getByRole("alert")).toContainText("Invalid response");
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    expect(errors).toEqual([]);
  });
test("checklist use requests no TensorFlow or model artifacts", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  await page.getByRole("button", { name: "View safety checklist" }).click();
  await page.getByRole("checkbox").first().check();
  expect(
    requests.some((url) =>
      /coco-ssd|storage.googleapis.com|\/dist-|\/version-/.test(url),
    ),
  ).toBe(false);
});
test("BLE export, clear and long names use synthetic capability data only", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "bluetooth", {
      value: {
        requestDevice: async () => ({
          id: "synthetic-id",
          name: "ＣＡＭＥＲＡ" + "測".repeat(350),
          gatt: {
            connect: async () => ({
              getPrimaryServices: async () => [
                {
                  uuid: "0000180a-0000-1000-8000-00805f9b34fb",
                  getCharacteristics: async () => [
                    {
                      uuid: "00002a25-0000-1000-8000-00805f9b34fb",
                      properties: { read: true },
                      readValue() {
                        throw new Error(
                          "Characteristic values must not be read",
                        );
                      },
                    },
                  ],
                },
              ],
            }),
            disconnect() {},
          },
        }),
      },
    });
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Bluetooth Discovery", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose and inspect a BLE device" })
    .click();
  await expect(page.getByText("Latest inspection")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export inspection report (JSON)" })
    .click();
  const report = await download;
  expect(report.suggestedFilename()).toBe("safespace-ble-inspection.json");
  const stream = await report.createReadStream();
  let json = "";
  for await (const chunk of stream) json += chunk;
  const value = JSON.parse(json);
  expect(value.advertisedName.length).toBeLessThanOrEqual(256);
  expect(value.deviceDetails).toBeUndefined();
  expect(value.assessment.label).toContain("verification");
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 320);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByText("Latest inspection")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("safespace_device_names")),
  ).toBeNull();
});
test("axe existing checklist and network error states, reduced motion and zoom", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "View safety checklist" }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Wi-Fi Inventory", exact: true })
    .click();
  await page.getByRole("button", { name: "Refresh device inventory" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  const network = await new AxeBuilder({ page }).analyze();
  expect(network.violations).toEqual([]);
});
