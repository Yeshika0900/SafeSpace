<h1 align="center">
  <picture>
    <source media="(max-width: 600px)" srcset="docs/media/safespace-banner-mobile.svg">
    <img src="docs/media/safespace-banner.svg" width="1600" alt="SafeSpace — personal privacy inspection tools">
  </picture>
</h1>

<p align="center">
  <strong>Inspect your space. Understand what you observe.</strong><br>
  <sub>Visual inspection · Bluetooth information · Local network context · Practical checks</sub>
</p>

SafeSpace brings four personal privacy tools into one workspace: a camera preview with common-object recognition, Bluetooth device information, this computer's recent network neighbours, and a saved room inspection checklist. It helps you review limited observations and decide what to inspect manually.

**Status:** experimental local web application with Android packaging. The review branch has automated software checks and a small generic-object benchmark. Physical-device acceptance and Android APK validation remain open. **SafeSpace does not detect hidden cameras, identify trackers, or certify that a room is safe.**

<p align="center">
  <a href="#the-workspace">See the workspace</a> ·
  <a href="docs/REVIEWER_GUIDE.md">Reviewer walkthrough</a> ·
  <a href="#run-locally">Run locally</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="#measured-evidence">Measured evidence</a>
</p>

## The workspace

<a href="docs/media/camera-workspace-desktop.png"><img src="docs/media/camera-workspace-desktop.png" width="1440" alt="Actual SafeSpace desktop camera workspace with preview off, frame-capture controls, empty object observations and visible model limitations"></a>

_Actual Chromium capture of the working application. Camera is off; no room imagery, Bluetooth identifiers or real network inventory was collected. This screen demonstrates the interface, not detection performance. [Capture provenance](docs/media/README.md)._

## Four tools, clear boundaries

| Tool                     | What you can do                                                                                        | What the observation means                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Camera inspection**    | Open a local preview, recognise ordinary COCO objects, download a frame                                | A common-object label and model confidence. It does not reveal whether an object contains a camera.                                             |
| **Bluetooth inspection** | Select one browser BLE device and inspect GATT capabilities; observe advertisements in the Android app | Device-supplied names and accessible capability metadata. Names can be spoofed; browser RSSI is unavailable. No characteristic values are read. |
| **Wi-Fi inventory**      | Read this computer's existing IPv4 neighbour cache through the optional loopback helper                | An incomplete record of recent communication. It is neither an active network scan nor a list of surveillance devices.                          |
| **Inspection checklist** | Work through six practical checks and save your progress locally                                       | A record of the steps you checked. Completion does not establish room safety.                                                                   |

### Follow an inspection

1. **Look at the space.** Open the camera preview if useful; capture a frame only when you have permission. Keep the model's ordinary-object scope in mind.
2. **Review device context.** Inspect a BLE device you select, or read the optional helper's partial neighbour inventory on the same computer.
3. **Use the checklist.** Follow the practical guidance and keep human judgement separate from model labels and unfamiliar device names.

[Walk through the existing controls and expected states →](docs/REVIEWER_GUIDE.md)

<details>
<summary><strong>See the checklist on a narrow screen</strong></summary>

<img src="docs/media/checklist-mobile.png" width="390" alt="Actual SafeSpace checklist in a 390-pixel Chromium viewport, with all six checks unchecked and the room-safety limitation visible">

_Responsive browser capture, not a physical-phone test. All checks are unchecked; no completed room inspection is implied._

</details>

## Engineering underneath

The React workspace owns four separate tools. Strict TypeScript contracts cover eight service/data modules; camera generations, cancellation, record validation and platform adapters sit behind those boundaries.

- **Camera ownership:** Stop remains usable during permission or model loading. Leaving the tool releases tracks; late results are ignored, and inference stays serialized across remounts. TensorFlow.js and COCO-SSD load when recognition is requested.
- **BLE privacy:** advertised names and friendly aliases remain separate. Changing an alias cannot change the name assessment. Inspection enumerates capabilities without reading characteristic values; legacy serial metadata is removed during migration when storage is writable.
- **Local helper:** exact Origin/Host checks, a required client header, fixed OS commands, subprocess limits and coalesced reads protect the loopback service. These are browser-request protections, not authentication against arbitrary local processes.
- **Recoverable state:** malformed saved data and invalid helper responses stay within the affected tool. History, strings, nested metadata and response sizes are bounded.

<sub>React 18 · Vite 6 · TensorFlow.js 4 / COCO-SSD 2.2.3 · TypeScript service contracts · Node.js helper · Capacitor 8</sub>

[Architecture and source map →](docs/ARCHITECTURE.md)

## Measured evidence

Recorded on **14 November 2026** during the quality work at [d3af967](https://github.com/Yeshika0900/SafeSpace/commit/d3af9676840c8e3006067e80887ca75645244981). These are separate software and generic-object measurements, not an overall SafeSpace accuracy score. This presentation pass does not add a new model evaluation.

| Measurement             | Recorded result                                                         | Scope                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Software regressions    | **59** unit/component + **52** parser/helper checks pass                | Synthetic media, GATT, storage and network fixtures; includes a harmless subprocess timeout check                         |
| Browser verification    | **7** Chromium checks pass                                              | 320/390/768/1440 px, malformed state, export/clear, zoom, reduced motion and two axe states; not physical-device coverage |
| Initial JavaScript      | **2,059,548 → 203,164 bytes**; 90.14% smaller                           | Production entry bundle; model code is deferred. Gzip: 358.19 kB → 64,927 bytes                                           |
| Generic-object baseline | **26.79% AP50:95** on validation; **29.14%** on holdout                 | 16 + 16 COCO2017 images; TensorFlow.js pure-JS CPU; exact checkpoint training membership is not independently attested    |
| Candidate comparison    | Validation AP50:95 **26.79% → 28.58%**, precision50 **94.59% → 88.89%** | Candidate changed score filtering and NMS IoU together. False positives rose 2 → 5; **candidate not adopted**             |
| Reproducibility         | Identical labels, scores and boxes across two runs                      | Same checksum-frozen 32-image engineering subset; no phone runtime or hidden-camera accuracy claim                        |

The original model settings remain in place. The subset is small, per-class support is sparse, and timing varied with shared-host contention. The eight-observation display cap did not alter these particular subset results; broader behaviour remains unproved.

[Implementation status and CI evidence](docs/quality/implementation-status.md) · [Benchmark method and limits](docs/quality/benchmark.md) · [Raw predictions](docs/quality/benchmark-run2.json) · [Quality workflow](https://github.com/Yeshika0900/SafeSpace/actions/workflows/quality.yml)

## Run locally

This README describes the **review branch in [draft PR #1](https://github.com/Yeshika0900/SafeSpace/pull/1)**. Until that work is merged, use the branch explicitly. There is no hosted demo or verified APK linked here.

Use **Node 24.22.1 LTS** and npm 11.9.0 for the recorded setup; tooling requires Node >=22.13.

```sh
git clone --branch codex/improve-existing-feature-quality https://github.com/Yeshika0900/SafeSpace.git
cd SafeSpace
npm ci
npm --prefix website ci
npm --prefix network-agent ci
npm run dev
```

Open **http://localhost:5173**. Camera and browser Bluetooth require a secure context and permission. No application API key is required; model assets download on demand. For the optional inventory helper, run `npm run helper` in a second terminal on the **same computer**. It binds only to `127.0.0.1:4174`.

On a phone, localhost refers to the phone. Laptop inventory is unsupported there; keep the helper on loopback.

[Full setup, validation commands, Android prerequisites and troubleshooting →](docs/SETUP.md)

## Find your next step

| You want to…                                              | Start here                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Review the working product and its four tools             | [Reviewer walkthrough](docs/REVIEWER_GUIDE.md)                                               |
| Install, run or verify the web/native project             | [Setup and verification](docs/SETUP.md)                                                      |
| Understand module ownership, data flow and storage        | [Architecture](docs/ARCHITECTURE.md)                                                         |
| Audit software checks and unfinished acceptance work      | [Implementation status](docs/quality/implementation-status.md)                               |
| Reproduce the model comparison or inspect its assumptions | [Benchmark reproduction](docs/quality/benchmark.md)                                          |
| Check visual and claim sources for this presentation      | [Media provenance](docs/media/README.md) · [Presentation notes](docs/presentation/README.md) |
| Contribute or report a security issue                     | [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md)                          |

## Responsible use and current limits

Use the camera and optional neighbour helper only where you have permission. Images are processed locally; exports and captured frames download to your device. Checklist progress, a bounded BLE history and friendly aliases are stored in browser/WebView storage. Clear history removes saved BLE records and aliases; downloaded files remain in your downloads. [Storage details](docs/SETUP.md#local-storage-and-privacy).

Android asset sync has passed; APK/lint/native tests were blocked by Gradle download and SDK/device availability. Physical camera/BLE behaviour, actual mobile permission policies, other browsers, larger independent evaluation and phone timings remain unverified. [Exact acceptance status](docs/quality/implementation-status.md).

No repository-wide source license is currently declared. Dependencies, model weights and evaluation data retain their own terms; the benchmark notes record the redistribution limits. If an observation concerns you, move to safety and seek appropriate help rather than treating an empty result as clearance.
