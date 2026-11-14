# A short SafeSpace walkthrough

Start with the [README](../README.md) and [local setup](SETUP.md). SafeSpace is an experimental four-tool privacy assistant. Review observations alongside their limitations; none of the tools certifies room safety.

## 1. Enter the workspace

Select **Start inspection**. It scrolls to and focuses the existing camera workspace, including when Camera Inspection is already selected. The feature buttons and workspace controls select the same four tools. The [desktop capture](media/camera-workspace-desktop.png) shows this actual state with the camera off; [provenance](media/README.md) explains its scope.

## 2. Camera inspection

If you have permission to use the camera in that space, choose **Enable camera**. Stop remains available during permission and model work. Once a stream opens, preview and frame capture can remain usable even if recognition cannot load. **Stop camera**, leaving the tool or hiding the page releases tracks. Results from an old inspection cannot populate the current view.

A chair or laptop label does not indicate a hidden camera. Confidence concerns the ordinary-object label, not room safety. **Capture frame** downloads a frame when valid video dimensions and a canvas context are available; before that, it can give a tool-local error. Physical camera acceptance is still open; automated lifecycle tests use fake streams/models.

## 3. Bluetooth inspection

In a compatible secure browser, **Choose and inspect a BLE device** opens the system chooser from the click. Cancellation or denied permission leaves controls usable. The selected device can expose permitted services and characteristic capabilities. Restricted services and disconnects produce partial results.

No characteristic values are read, including serial numbers. Friendly aliases remain separate from advertised names; an unnamed device remains unknown even after you name it. Browser RSSI is unavailable.

The Android application instead observes advertisements for ten seconds. Native RSSI is signal information, not distance or a surveillance verdict. Stop/background/tool-change behaviour is covered by fake-adapter tests; physical radio/permission acceptance remains unverified.

Export the latest sanitized record as JSON if needed. **Clear history** removes the visible current record, saved history and aliases. Downloaded exports remain outside app clearing. Documentation capture never invokes a chooser or observes real advertisements.

## 4. Wi-Fi inventory

Run the optional helper on the same authorized computer using the [setup instructions](SETUP.md), then choose **Refresh device inventory**. It reads the existing IPv4 neighbour cache with fixed OS commands. It neither probes devices nor inventories IPv6.

An empty cache is a valid empty result. Unknown output, missing executables, denied local-network access and timeouts stay errors. An unfamiliar address is not evidence of surveillance. Keep the helper on loopback; localhost on a phone refers to the phone, so laptop inventory is unsupported there. Documentation capture does not run the helper.

## 5. Checklist and storage

The checklist contains six practical checks. Toggle one only when it represents your own progress; state is saved locally when storage is writable. The count records steps, not room safety. The [narrow-screen capture](media/checklist-mobile.png) shows all six unchecked in an emulated browser viewport, not a physical-phone test.

Storage/quota errors leave tools usable in memory with feedback. Checklist null, BLE history containing a null record and a helper response with null devices are covered by recovery regressions. A tool boundary contains render failures.

## 6. Read the evidence

The [implementation record](quality/implementation-status.md) separates 59 unit/component, 52 helper and 7 Chromium checks from unexecuted hardware/native work. The [model comparison](quality/benchmark.md) retains the rejected candidate and the reason for preserving the baseline.

This presentation changes documentation and its assets. Screenshot controls, observations and limitations come from the existing app; it adds no demo-data mode, sensing workflow or model.
