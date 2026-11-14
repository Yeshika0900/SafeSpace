# SafeSpace setup and verification

This guide describes the review branch in [draft PR #1](https://github.com/Yeshika0900/SafeSpace/pull/1). Run commands from the repository root unless a step changes directory. The root forwards web and native commands to `website/`.

## Install and run

Use Node **24.22.1 LTS** (tested), npm 11.9.0; tooling requires Node >=22.13. Internet is needed for initial packages and on-demand model loading. From the repository root:

```sh
npm ci
npm --prefix website ci
npm --prefix network-agent ci
npm run dev
```

Open `http://localhost:5173` or `http://127.0.0.1:5173`. Camera and browser Bluetooth require a secure context and user permission. Other tools remain usable if model loading fails. Images are processed locally by the model; frame capture downloads to your device. Optional second terminal:

```sh
npm run helper
```

The helper binds **127.0.0.1:4174 only**. Use it only on a computer/network you own or are authorized to inspect. It runs fixed OS commands: Windows `arp -a`, Linux `ip -4 neigh show` (fallback `arp -an` only if `ip` is missing), macOS `arp -an`. Unknown output, absent commands and timeouts produce an error, not a successful empty result. It rejects multicast/broadcast and malformed addresses; directed-broadcast handling is conservative because subnet masks are not available.

Default browser origins are exactly `http://localhost:5173`, `http://127.0.0.1:5173`, and the same hosts on preview port 4173. To use another desktop frontend, set `SAFESPACE_ALLOWED_ORIGINS` to a comma-separated list of exact HTTP(S) origins. Wildcards, paths, trailing slashes, credentials, missing Origin and `Origin: null` are rejected. Requests require `X-SafeSpace-Client: inventory-v1`; the website supplies it and preflight is supported. Private/local-network browser policies may still block access; HTTPS deployment is not a guarantee of helper compatibility. Origin/Host/header checks protect browser requests; **they are not authentication against arbitrary local processes or forged non-browser requests**. No pairing or account workflow is provided.

## Phone and BLE checks

The browser chooser exposes only a device you select and permitted GATT service/characteristic capabilities. **No characteristic values are read**, including serial numbers. Android native scanning observes advertisements for ten seconds and stops on tool change/background. Camera permission/model loading and GATT operations can be cancelled by stopping/leaving the tool. Neither mode guarantees tracker detection. iOS browser Bluetooth support is limited; use the OS's built-in unwanted-tracking alerts.

On a phone, localhost means the **phone**, not your laptop. Laptop network inventory is unsupported on the phone. Never expose the helper to the LAN/internet to work around this. HTTPS/device provisioning for camera/BLE must be tested separately; a laptop LAN HTTP URL is not a secure context on a phone.

## Validation

From the repository root:

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run bundle:check
cd website
npx playwright install chromium
npm run test:browser
```

Unit/component/helper/browser suites use synthetic media, GATT and network fixtures. No physical sensing is allowed in CI. TypeScript strictly checks **all eight service/data modules**, including model configuration, records, persistence, cancellation and BLE/network boundaries. React JSX, Node helper and benchmark scripts are linted/tested but are not type-checked. Browser tests use Chromium; hardware behavior and other browsers still need physical checks. See [implementation status](quality/implementation-status.md) and [benchmark reproduction](quality/benchmark.md).

## Android

`website/` owns Capacitor, its configuration and Android project. Root scripts only forward to it; run Capacitor commands from `website`, never from the repository root. Root duplicate Capacitor packages/configuration were removed. Install JDK 21, Android SDK platform 36, compatible build tools, platform tools and an emulator or authorized device; set `ANDROID_HOME` and configure `website/android/local.properties` locally if needed. Existing Gradle wrapper: 8.14.3; AGP: 8.13.0; min SDK: 24.

```sh
npm run build
npm run android:sync
cd website/android
bash gradlew :app:assembleDebug :app:lintDebug :app:testDebugUnitTest
bash gradlew :app:connectedDebugAndroidTest
```

On Windows use `gradlew.bat`. `cap sync` copies assets and configures plugins; it does **not** validate an APK. The BLE plugin already contributes Bluetooth/scan/connect/location permissions. Inspect the **merged** manifest after a native build before drawing permission conclusions. The instrumented application ID assertion is `com.safespace.app`.

## Local storage and privacy

Checklist, the latest 30 sanitized BLE records, and friendly aliases are saved locally in browser/WebView storage. This is not encrypted app storage. Version-2 records separate advertised names from aliases; changing an alias cannot change name review. Legacy display names are retained as aliases with advertised evidence marked unknown, because their provenance cannot be recovered. Legacy characteristic values (`deviceDetails`, including serial metadata) are dropped and the sanitized history is rewritten when BLE opens. Migration limits nested arrays, strings and payload size. Valid checklist booleans survive malformed storage. Storage failures produce usable in-memory tools and visible feedback.

Clear history removes the BLE history **and aliases**, and clears the visible current record. Export contains only the current sanitized record. Downloaded JSON and captured frames remain in your downloads after clearing app history. Android `allowBackup=false` reduces backup of WebView identifiers; OEM/device-transfer behavior still requires physical verification. No automatic cloud sync, diagnostic identifier logging, account or retention feature was added.
