
# SafeSpace Phase 2 (experimental)

## What works in this phase
- Browser camera preview.
- COCO-SSD general object recognition (common objects only; **not hidden-camera detection**).
- User-triggered Web Bluetooth device chooser in compatible browsers.
- Local network inventory from the laptop's ARP cache via a local Node helper.
- Room safety checklist.

## Important limitations
- AI labels ordinary objects. It is not trained or validated to detect hidden cameras, lens assemblies, infrared emitters or recording devices.
- Web Bluetooth only exposes user-selected BLE devices in supported browsers. It is not continuous scanning and does not reliably identify trackers.
- iPhone browsers do not provide the same Web Bluetooth support. Use built-in iOS unwanted-tracking alerts.
- The network helper only reads the laptop's existing ARP cache. It does not actively scan networks and its results are incomplete by design.
- No result means only that this limited check did not observe something. It does not certify a room as safe.

## Requirements
Node.js 18+ and internet access for initial npm package installation.

## Run the website
1. Open `website` folder in VS Code.
2. Terminal:
   `npm.cmd install`
3. Then:
   `npm.cmd run dev`
4. Open the Vite localhost URL printed in terminal.

Camera permission requires localhost or HTTPS.

## Run the local network helper (optional)
Open a **second VS Code terminal**.
1. Change directory into `network-agent`.
2. Run `npm.cmd start`.
3. Keep this terminal running.
4. In the website, open Wi-Fi device inventory and press Refresh.

The helper binds only to 127.0.0.1 and reads the local machine's ARP cache. Use it only on networks you own or are authorized to inspect.

## Bluetooth testing
- Try current desktop Chrome or Android Chrome.
- Use localhost or HTTPS.
- Click Bluetooth device discovery and select a device in the browser's chooser.
- The browser may require Bluetooth to be enabled and nearby devices to be discoverable.
- On iPhone, use Settings / built-in unwanted-tracking notifications; browser BLE scanning is not supported consistently.

## Test on your phone
The Vite server prints a Network URL, e.g. `http://192.168.x.x:5173`. On Android, use that address while the phone and laptop are on the same Wi-Fi. Camera/Bluetooth APIs may require HTTPS; localhost on the laptop is not localhost on the phone. For reliable phone testing, deploy over HTTPS. Do not expose the local network helper to the internet.

## Next engineering step for actual hidden-camera detection
A separate, purpose-built dataset and validated model are required. General object detection is not a hidden-camera detector. Any model must be evaluated on real cameras, decoys, lighting conditions and false-positive rates before making detection claims.
