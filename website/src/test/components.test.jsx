import React from "react";
import { test, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { Camera } from "../features/Camera";
import { Checklist } from "../features/Checklist";
import { BluetoothScan } from "../features/BluetoothScan";
import { NetworkScan } from "../features/NetworkScan";
import { ToolBoundary } from "../ToolBoundary";
import { App } from "../App";
import { KEYS } from "../services/records";
vi.mock("../services/inference", () => ({
  INFERENCE: {
    maxPredictions: 20,
    minScore: 0.55,
    displayCap: 8,
    intervalMs: 1200,
  },
  loadObjectModel: vi.fn(() => new Promise(() => {})),
}));
function media() {
  const track = { stop: vi.fn() };
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }),
    },
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  return track;
}
test("Stop remains available while camera permission is pending", () => {
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getUserMedia: () => new Promise(() => {}) },
  });
  render(<Camera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  const stop = screen.getByRole("button", { name: "Stop camera" });
  expect(stop).toBeEnabled();
  fireEvent.click(stop);
  expect(screen.getByRole("button", { name: "Enable camera" })).toBeEnabled();
});
test("tool unmount stops tracks during pending model loading", async () => {
  const track = media();
  const view = render(<Camera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Capture frame" })).toBeEnabled(),
  );
  view.unmount();
  expect(track.stop).toHaveBeenCalledOnce();
});
test("camera stops when document becomes hidden", async () => {
  const track = media();
  render(<Camera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Capture frame" })).toBeEnabled(),
  );
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(track.stop).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Enable camera" })).toBeEnabled();
});
test("capture with zero dimensions gives recoverable feedback", async () => {
  media();
  render(<Camera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Capture frame" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Capture frame" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Wait for a video frame");
});
test("valid saved checklist is preserved", () => {
  localStorage.setItem(KEYS.checklist, '{"0":true}');
  render(<Checklist />);
  expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  fireEvent.click(screen.getAllByRole("checkbox")[1]);
  expect(JSON.parse(localStorage.getItem(KEYS.checklist))).toEqual({
    0: true,
    1: true,
  });
});
test("tool boundary contains failure and keeps shell controls usable", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const preventExpected = (event) => {
    if (event.error?.message === "synthetic") event.preventDefault();
  };
  window.addEventListener("error", preventExpected);
  function Broken() {
    throw new Error("synthetic");
  }
  render(
    <>
      <button>Other tool</button>
      <ToolBoundary>
        <Broken />
      </ToolBoundary>
    </>,
  );
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByRole("button", { name: "Other tool" })).toBeVisible();
  window.removeEventListener("error", preventExpected);
});
test("clear remains available for aliases even when history was malformed", () => {
  localStorage.setItem(KEYS.history, "[null]");
  localStorage.setItem(KEYS.aliases, '{"fake":"alias"}');
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const v = render(<BluetoothScan />);
  fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
  expect(localStorage.getItem(KEYS.aliases)).toBeNull();
  expect(localStorage.getItem(KEYS.history)).toBeNull();
  v.unmount();
  render(<BluetoothScan />);
  expect(screen.getByText("No Bluetooth inspections saved yet.")).toBeVisible();
});
test("Start moves focus to the existing workspace even if camera is selected", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start inspection" }));
  expect(
    screen.getByRole("region", { name: "Inspection workspace" }),
  ).toHaveFocus();
});
test("network response after unmount cannot update tool", async () => {
  let resolve;
  const fetcher = vi.fn(() => new Promise((r) => (resolve = r)));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<NetworkScan />);
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh device inventory" }),
  );
  const signal = fetcher.mock.calls[0][1].signal;
  view.unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    resolve(new Response('{"devices":null}'));
  });
});

test("browser BLE timeout restores usable controls and suppresses late chooser", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", {
    bluetooth: { requestDevice: () => new Promise(() => {}) },
  });
  render(<BluetoothScan />);
  fireEvent.click(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  );
  expect(
    screen.getByRole("button", { name: "Choosing or inspecting device..." }),
  ).toBeDisabled();
  await act(async () => vi.advanceTimersByTimeAsync(20001));
  expect(screen.getByRole("alert")).toHaveTextContent("timed out");
  expect(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  ).toBeEnabled();
});
test("chooser cancellation and permission denial leave controls usable", async () => {
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", {
    bluetooth: {
      requestDevice: vi
        .fn()
        .mockRejectedValue(new DOMException("no device", "NotFoundError")),
    },
  });
  render(<BluetoothScan />);
  fireEvent.click(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("cancelled"),
  );
  expect(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  ).toBeEnabled();
  navigator.bluetooth.requestDevice.mockRejectedValue(
    new DOMException("denied", "NotAllowedError"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("permission denied"),
  );
});
test("pagehide cancels BLE and restores controls if the page is cached", async () => {
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", {
    bluetooth: { requestDevice: () => new Promise(() => {}) },
  });
  render(<BluetoothScan />);
  fireEvent.click(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  );
  await act(async () => fireEvent(window, new Event("pagehide")));
  expect(
    screen.getByRole("button", { name: "Choose and inspect a BLE device" }),
  ).toBeEnabled();
});
