import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { test, expect, vi } from "vitest";
vi.mock("@tensorflow/tfjs", () => ({}));
vi.mock("@tensorflow-models/coco-ssd", () => ({
  load: vi.fn(() => new Promise(() => {})),
}));
import { App } from "../App.jsx";

test("null checklist storage remains usable", () => {
  localStorage.setItem("safespace_checklist_v1", "null");
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "View safety checklist" }),
  );
  expect(screen.getAllByRole("checkbox")).toHaveLength(6);
});
test("null BLE history record remains usable", () => {
  localStorage.setItem("safespace_ble_history", "[null]");
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Bluetooth Discovery" }));
  expect(screen.getByText("No Bluetooth inspections saved yet.")).toBeVisible();
});
test("malformed helper response is a recoverable tool error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ devices: null }))),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Wi-Fi Inventory" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh device inventory" }),
  );
  await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
  expect(
    screen.getByRole("button", { name: "View safety checklist" }),
  ).toBeVisible();
});
