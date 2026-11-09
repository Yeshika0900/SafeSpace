
  import React, {useEffect,useRef,useState} from "react";
  import {createRoot} from "react-dom/client";
  import * as cocoSsd from "@tensorflow-models/coco-ssd";
  import "@tensorflow/tfjs";
  import { BleClient } from "@capacitor-community/bluetooth-le";
  import { Capacitor } from "@capacitor/core";
  import "./styles.css";
  import {
    ShieldCheck,
    Camera as CameraIcon,
    Bluetooth,
    Wifi,
    ClipboardCheck,
    ArrowRight,
    Menu,
    X,
    LockKeyhole,
    ScanLine,
    CheckCircle2
  } from "lucide-react";

  function App() {
    const [tab, setTab] = useState("camera");

    const features = [
      {
        id: "camera",
        title: "Camera Inspection",
        description: "Inspect your surroundings using live camera preview and AI object recognition.",
        icon: CameraIcon,
        color: "violet",
        status: "AI object recognition"
      },
      {
        id: "bluetooth",
        title: "Bluetooth Discovery",
        description: "Explore nearby Bluetooth Low Energy devices and their signal strength.",
        icon: Bluetooth,
        color: "cyan",
        status: "Nearby BLE devices"
      },
      {
        id: "network",
        title: "Wi-Fi Inventory",
        description: "Review devices visible to your supported local network scanner.",
        icon: Wifi,
        color: "blue",
        status: "Network inventory"
      },
      {
        id: "checklist",
        title: "Safety Checklist",
        description: "Follow practical inspection steps and track your safety progress.",
        icon: ClipboardCheck,
        color: "pink",
        status: "Personal inspection"
      }
    ];

    const activeFeature = features.find(item => item.id === tab);

    return (
      <div className="shell">

        <header className="site-header">
          <div className="brand">
            <div className="brand-icon">
              <ShieldCheck size={25} />
            </div>

            <div>
              <div className="brand-name">SafeSpace</div>
              <small>YOUR PRIVACY. YOUR SAFETY.</small>
            </div>
          </div>

          <div className="header-right">
            <span className="secure-indicator">
              <span className="status-dot"></span>
              PRIVACY ASSISTANT
            </span>
          </div>
        </header>

        <main className="home-main">

          {/* HERO SECTION */}

          <section className="hero-section">

            <div className="hero-content">

              <div className="hero-label">
                <LockKeyhole size={14} />
                SMART SPACE INSPECTION
              </div>

              <h1>
                Your Space.
                <br />
                <span>Your Privacy.</span>
                <br />
                Your Safety.
              </h1>

              <p>
                Take a more informed approach to personal safety.
                Inspect your surroundings, review nearby device
                information and follow practical safety guidance.
              </p>

              <div className="hero-actions">
                <button
                  className="hero-button"
                  onClick={() => setTab("camera")}
                >
                  Start inspection
                  <ArrowRight size={17} />
                </button>

                <button
                  className="hero-secondary"
                  onClick={() => setTab("checklist")}
                >
                  View safety checklist
                </button>
              </div>

              <div className="hero-note">
                <ShieldCheck size={16} />
                Inspection assistance, with transparent limitations.
              </div>

            </div>

            <div className="hero-visual">

              <div className="visual-glow"></div>

              <div className="visual-card">

                <div className="visual-card-top">
                  <span>SAFESPACE MONITOR</span>
                  <span className="visual-live">
                    <span className="status-dot"></span>
                    READY
                  </span>
                </div>

                <div className="radar-area">
                  <div className="radar-circle radar-one"></div>
                  <div className="radar-circle radar-two"></div>
                  <div className="radar-circle radar-three"></div>

                  <div className="radar-center">
                    <ShieldCheck size={54} />
                  </div>

                  <div className="radar-sweep"></div>
                </div>

                <div className="visual-card-bottom">
                  <div>
                    <strong>Personal safety tools</strong>
                    <small>Choose a scanner to begin</small>
                  </div>

                  <ScanLine size={25} />
                </div>

              </div>

              <div className="floating-tag tag-one">
                <CameraIcon size={17} />
                Visual inspection
              </div>

              <div className="floating-tag tag-two">
                <Bluetooth size={17} />
                Device discovery
              </div>

            </div>

          </section>


          {/* FEATURE SECTION */}

          <section className="features-section">

            <div className="section-heading">
              <div>
                <span className="section-eyebrow">YOUR SAFETY TOOLKIT</span>
                <h2>Explore SafeSpace</h2>
                <p>
                  Choose a tool to begin your personal space inspection.
                </p>
              </div>

              <span className="feature-count">04 TOOLS</span>
            </div>

            <div className="feature-grid">

              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <button
                    key={feature.id}
                    className={`feature-card ${feature.color} ${
                      tab === feature.id ? "selected" : ""
                    }`}
                    onClick={() => setTab(feature.id)}
                  >

                    <div className="feature-card-top">
                      <div className="feature-icon">
                        <Icon size={25} />
                      </div>

                      <span className="feature-number">
                        0{index + 1}
                      </span>
                    </div>

                    <h3>{feature.title}</h3>

                    <p>{feature.description}</p>

                    <div className="feature-card-bottom">
                      <span>{feature.status}</span>
                      <ArrowRight size={18} />
                    </div>

                  </button>
                );
              })}

            </div>

          </section>


          {/* INSPECTION WORKSPACE */}

          <section className="workspace-section" id="workspace">

            <div className="workspace-heading">
              <div>
                <span className="section-eyebrow">INSPECTION WORKSPACE</span>
                <h2>{activeFeature.title}</h2>
                <p>Use the selected tool to continue your inspection.</p>
              </div>

              <div className="workspace-badge">
                <span className="status-dot"></span>
                TOOL SELECTED
              </div>
            </div>

            <div className="workspace-tabs">

              {features.map(feature => (
                <button
                  key={feature.id}
                  className={tab === feature.id ? "workspace-tab active" : "workspace-tab"}
                  onClick={() => setTab(feature.id)}
                >
                  {feature.title}
                </button>
              ))}

            </div>

            <div className="workspace-content">
              {tab === "camera" && <Camera />}
              {tab === "bluetooth" && <BluetoothScan />}
              {tab === "network" && <NetworkScan />}
              {tab === "checklist" && <Checklist />}
            </div>

          </section>


          {/* SAFETY INFORMATION */}

          <section className="safety-banner">
            <div className="safety-banner-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h3>Your safety comes first.</h3>
              <p>
                SafeSpace provides inspection assistance, not a guarantee
                that a room or device is safe. AI object recognition,
                Bluetooth discovery and network inventory have limitations.
                Always use careful visual inspection and seek help when needed.
              </p>
            </div>
          </section>

        </main>

        <footer className="site-footer">
          <div className="footer-brand">
            <ShieldCheck size={19} />
            SafeSpace
          </div>

          <span>Privacy awareness starts with informed inspection.</span>

          <span>© 2026 SafeSpace</span>
        </footer>

      </div>
    );
  }

  function Camera() {
    const video = useRef(null);
    const canvas = useRef(null);
    const stream = useRef(null);
    const model = useRef(null);
    const timer = useRef(null);
    const loopActive = useRef(false);

    const [on, setOn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pred, setPred] = useState([]);
    const [msg, setMsg] = useState("Camera is off.");
    const [err, setErr] = useState("");

    async function start() {
      setErr("");
      setLoading(true);
      setPred([]);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera requires HTTPS or localhost.");
        }

        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        stream.current = s;
        video.current.srcObject = s;

        await video.current.play();

        setOn(true);
        setMsg("Loading object recognition model...");

        if (!model.current) {
          model.current = await cocoSsd.load({
    base: "lite_mobilenet_v2"
  });
        }
        setMsg("Model ready. Scanning for common objects...");

        loopActive.current = true;

        async function detectFrame() {
          if (!loopActive.current) return;

          try {
            if (
              video.current &&
              video.current.readyState >= 2 &&
              model.current
            ) {
              const predictions = await model.current.detect(
    video.current,
    20,
    0.55
  );

              if (loopActive.current) {
                setPred(predictions.slice(0, 8));
                setErr("");

                if (predictions.length > 0) {
                  setMsg(
                    `Detected ${predictions.length} object(s). Scanning continuously...`
                  );
                } else {
                  setMsg("Scanning... No common objects recognised in this frame.");
                }
              }
            }
          } catch (e) {
            console.error("Detection error:", e);
            if (loopActive.current) {
              setErr(e?.message || String(e));
            }
          } finally {
            if (loopActive.current) {
              timer.current = setTimeout(detectFrame, 1200);
            }
          }
        }

        detectFrame();

      } catch (e) {
        setErr(e.message || "Could not start camera.");
        stop();
      } finally {
        setLoading(false);
      }
    }

    function stop() {
      loopActive.current = false;

      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      if (stream.current) {
        stream.current.getTracks().forEach(track => track.stop());
      }

      stream.current = null;

      if (video.current) {
        video.current.srcObject = null;
      }

      setOn(false);
      setPred([]);
      setMsg("Camera is off.");
    }

    function capture() {
      if (!video.current || !canvas.current) return;

      const v = video.current;
      const c = canvas.current;

      c.width = v.videoWidth;
      c.height = v.videoHeight;

      c.getContext("2d").drawImage(v, 0, 0);

      const a = document.createElement("a");
      a.download = "safespace-inspection.jpg";
      a.href = c.toDataURL("image/jpeg");
      a.click();
    }

    useEffect(() => {
      return () => {
        loopActive.current = false;

        if (timer.current) {
          clearTimeout(timer.current);
        }

        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
        }
      };
    }, []);

    return (
      <section>
        <div className="heading">
          <label>VISUAL CHECK</label>
          <h1>Camera inspection</h1>
          <p>
            Live preview plus general object recognition.
            This model is not trained to identify hidden cameras.
          </p>
        </div>

        <div className="grid two">
          <article className="panel">
            <div className="row">
              <h2>Live camera</h2>
              <span className={on ? "green" : "muted"}>
                {on ? "● ACTIVE" : "● OFF"}
              </span>
            </div>

            <div className="video">
              <video ref={video} playsInline muted />
              <canvas ref={canvas} hidden />

              {!on && (
                <div className="placeholder">
                  📷
                  <b>Camera preview is off</b>
                  <small>Enable the camera to begin.</small>
                </div>
              )}
            </div>

            <div className="row wrap">
              <button onClick={on ? stop : start} disabled={loading}>
                {loading ? "Loading..." : on ? "Stop camera" : "Enable camera"}
              </button>

              <button
                className="secondary"
                onClick={capture}
                disabled={!on}
              >
                Capture frame
              </button>
            </div>

            {msg && <p className="hint">{msg}</p>}
            {err && <p className="error">{err}</p>}
          </article>

          <article className="panel">
            <h2>AI object observations</h2>

            <p className="hint">
              COCO-SSD recognises common objects such as people,
              chairs, laptops and bottles. It cannot determine
              whether an object contains a hidden camera.
            </p>

            {pred.length ? (
              <ul className="results">
                {pred.map((p, i) => (
                  <li key={`${p.class}-${i}`}>
                    <b>{p.class}</b>
                    <span>
                      {Math.round(p.score * 100)}% model confidence
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                {on ? "Scanning for common objects..." : "No model observations yet. Start the camera."}
              </div>
            )}

            <div className="warning">
              A high confidence label is not proof of a hidden camera.
              Use careful visual inspection and report concerns safely.
            </div>
          </article>
        </div>
      </section>
    );
  }

  function BluetoothScan() {
    const supported =
    Capacitor.isNativePlatform() ||
    (typeof navigator !== "undefined" && !!navigator.bluetooth);

    const [busy, setBusy] = useState(false);
    const [available, setAvailable] = useState(null);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("Ready to inspect one BLE device.");
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("safespace_ble_history") || "[]"
        );
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    });

    // Web Bluetooth only exposes services explicitly allowed in this request.
    // These assigned numbers are expanded to the Bluetooth Base UUID.
    const optionalServices = [
      "1800", "1801", "180A", "180F", "180D", "1812", "181A",
      "1802", "1803", "1804", "1805", "1806", "1807", "1808",
      "1809", "1810", "1811", "1814", "1816", "1818", "1819",
      "181D", "1825", "1826", "1828"
    ].map((shortUuid) =>
      `0000${shortUuid.toLowerCase()}-0000-1000-8000-00805f9b34fb`
    );

    const serviceNames = {
      "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
      "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
      "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
      "0000180f-0000-1000-8000-00805f9b34fb": "Battery Service",
      "0000180d-0000-1000-8000-00805f9b34fb": "Heart Rate",
      "00001812-0000-1000-8000-00805f9b34fb": "Human Interface Device",
      "0000181a-0000-1000-8000-00805f9b34fb": "Environmental Sensing",
      "00001802-0000-1000-8000-00805f9b34fb": "Immediate Alert",
      "00001803-0000-1000-8000-00805f9b34fb": "Link Loss",
      "00001804-0000-1000-8000-00805f9b34fb": "Tx Power"
    };

    const characteristicNames = {
      "00002a00-0000-1000-8000-00805f9b34fb": "Device Name",
      "00002a01-0000-1000-8000-00805f9b34fb": "Appearance",
      "00002a02-0000-1000-8000-00805f9b34fb": "Peripheral Privacy Flag",
      "00002a04-0000-1000-8000-00805f9b34fb": "Peripheral Preferred Connection Parameters",
      "00002a05-0000-1000-8000-00805f9b34fb": "Service Changed",
      "00002aa6-0000-1000-8000-00805f9b34fb": "Central Address Resolution",   
      "00002a19-0000-1000-8000-00805f9b34fb": "Battery Level",
      "00002a23-0000-1000-8000-00805f9b34fb": "System ID",
      "00002a24-0000-1000-8000-00805f9b34fb": "Model Number String",
      "00002a25-0000-1000-8000-00805f9b34fb": "Serial Number String",
      "00002a26-0000-1000-8000-00805f9b34fb": "Firmware Revision String",
      "00002a27-0000-1000-8000-00805f9b34fb": "Hardware Revision String",
      "00002a28-0000-1000-8000-00805f9b34fb": "Software Revision String",
      "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer Name String",
      "00002a37-0000-1000-8000-00805f9b34fb": "Heart Rate Measurement",
      "00002a38-0000-1000-8000-00805f9b34fb": "Body Sensor Location",
      "00002a6e-0000-1000-8000-00805f9b34fb": "Temperature",
      "00002a6f-0000-1000-8000-00805f9b34fb": "Humidity"
    };

    function shortUuid(uuid) {
      const match = uuid.match(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/i);
      return match ? `0x${match[1].toUpperCase()}` : uuid;
    }

    function serviceContext(uuid) {
      const contexts = {
        "00001800-0000-1000-8000-00805f9b34fb": "Core Bluetooth access information; commonly present on BLE devices.",
        "00001801-0000-1000-8000-00805f9b34fb": "Core GATT service management; commonly present on BLE devices.",
        "0000180a-0000-1000-8000-00805f9b34fb": "May expose manufacturer, model or firmware metadata.",
        "0000180f-0000-1000-8000-00805f9b34fb": "Battery status profile used by many ordinary devices.",
        "0000180d-0000-1000-8000-00805f9b34fb": "Common fitness and heart-rate monitor profile.",
        "00001812-0000-1000-8000-00805f9b34fb": "Human-interface peripherals such as keyboards or pointing devices.",
        "0000181a-0000-1000-8000-00805f9b34fb": "Environmental sensor profile.",
        "00001802-0000-1000-8000-00805f9b34fb": "Standard alert profile; not a tracker verdict.",
        "00001803-0000-1000-8000-00805f9b34fb": "Standard link-loss alert profile; not a tracker verdict.",
        "00001804-0000-1000-8000-00805f9b34fb": "Transmit-power information profile."
      };
      return contexts[uuid] || "No standard interpretation is included in this version; it may be a vendor-specific or less common service.";
    }

    useEffect(() => {
      let active = true;
      if (
    !Capacitor.isNativePlatform() &&
    typeof navigator.bluetooth?.getAvailability === "function"
  ) {
        navigator.bluetooth.getAvailability()
          .then((value) => {
            if (active) setAvailable(value);
          })
          .catch(() => {
            if (active) setAvailable(null);
          });
      }
      return () => {
        active = false;
      };
    }, [supported]);

    useEffect(() => {
      try {
        localStorage.setItem("safespace_ble_history", JSON.stringify(history));
      } catch {
        setStatus("Inspection works, but browser storage is unavailable.");
      }
    }, [history]);

    function getSavedDeviceNames() {
  try {
    return JSON.parse(
      localStorage.getItem("safespace_device_names") || "{}"
    );
  } catch {
    return {};
  }
}

function saveFriendlyName(deviceId, name) {
  const savedNames = getSavedDeviceNames();

  savedNames[deviceId] = name;

  localStorage.setItem(
    "safespace_device_names",
    JSON.stringify(savedNames)
  );
}

    function assessName(name) {
      if (!name) {
        return {
          label: "Manual review recommended",
          detail: "This device did not provide a readable name. Unnamed devices are common; this is not proof of a tracker."
        };
      }
      if (/\b(camera|tracker|airtag|smart\s?tag|tile|gps|spy)\b/i.test(name)) {
        return {
          label: "Name needs manual verification",
          detail: "The advertised name contains a camera/tracker-related keyword. Names can be changed or misleading; this is not proof of surveillance."
        };
      }
      return {
        label: "No obvious name indicator",
        detail: "No camera/tracker-related keyword was found in the advertised name. This does not establish that the device or room is safe."
      };
    }

    async function inspectSelectedDevice(device) {
        const savedNames = getSavedDeviceNames();

  const knownName =
    device.name || savedNames[device.id] || "";

  let displayName = knownName || "Name not advertised";

  if (!knownName) {
    const enteredName = window.prompt(
      "Device name is unavailable. Enter a friendly name (e.g. My Laptop, My Phone):"
    );

    if (enteredName && enteredName.trim()) {
      displayName = enteredName.trim();
      saveFriendlyName(device.id, displayName);
    }
  }
    const record = {
      id: device.id,
      name: displayName,
      inspectedAt: new Date().toLocaleString(),
      gattStatus: "GATT not available",
      services: [],
      deviceDetails: [],
      assessment: assessName(device.name || displayName),
      note: "Only readable standard Bluetooth information and accessible metadata are inspected."
    };

    if (!device.gatt) {
      return record;
    }

    try {
      const server = await device.gatt.connect();
      record.gattStatus = "Connected; reading device information";

      const services = await server.getPrimaryServices();

      const readableDetails = {
        "00002a00-0000-1000-8000-00805f9b34fb": "Device name",
        "00002a24-0000-1000-8000-00805f9b34fb": "Model number",
        "00002a25-0000-1000-8000-00805f9b34fb": "Serial number",
        "00002a26-0000-1000-8000-00805f9b34fb": "Firmware version",
        "00002a27-0000-1000-8000-00805f9b34fb": "Hardware version",
        "00002a28-0000-1000-8000-00805f9b34fb": "Software version",
        "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer"
      };

      for (const service of services) {
        const uuid = service.uuid.toLowerCase();

        const serviceRecord = {
          uuid,
          shortUuid: shortUuid(uuid),
          label: serviceNames[uuid] || "Unrecognised or vendor-specific service",
          context: serviceContext(uuid),
          characteristics: [],
          characteristicStatus: "Not inspected"
        };

        try {
          const characteristics = await service.getCharacteristics();

          for (const characteristic of characteristics) {
            const charUuid = characteristic.uuid.toLowerCase();
            const props = characteristic.properties;

            const capabilities = [
              ["read", "Read"],
              ["write", "Write"],
              ["writeWithoutResponse", "Write without response"],
              ["notify", "Notify"],
              ["indicate", "Indicate"]
            ].filter(([key]) => props[key]).map(([, label]) => label);

            serviceRecord.characteristics.push({
              uuid: charUuid,
              shortUuid: shortUuid(charUuid),
              label: characteristicNames[charUuid] || "Unrecognised characteristic",
              properties: capabilities
            });

            if (readableDetails[charUuid] && props.read) {
              try {
                const value = await characteristic.readValue();
                const bytes = new Uint8Array(
                  value.buffer,
                  value.byteOffset,
                  value.byteLength
                );

                const textValue = new TextDecoder()
                  .decode(bytes)
                  .replace(/\0/g, "")
                  .trim();

                if (textValue) {
                  record.deviceDetails.push({
                    label: readableDetails[charUuid],
                    value: textValue
                  });

                  if (charUuid === "00002a00-0000-1000-8000-00805f9b34fb") {
                    record.name = textValue;
                  }
                }
              } catch (readError) {
                console.log("Could not read", charUuid, readError);
              }
            }
          }

          serviceRecord.characteristicStatus = "Metadata inspected";
        } catch (error) {
          serviceRecord.characteristicStatus =
            `Metadata restricted: ${error.message}`;
        }

        record.services.push(serviceRecord);
      }

      record.gattStatus = services.length
        ? "Device information inspection completed"
        : "No accessible primary services returned";

      record.assessment = assessName(record.name);

    } catch (error) {
      record.gattStatus = `Could not inspect device: ${error.message}`;
    } finally {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    }

    return record;
  }

    async function scan() {
    const browserDevicePromise =
        !Capacitor.isNativePlatform() &&
        navigator.bluetooth &&
        window.isSecureContext
            ? navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices
              })
            : null;

    setError("");
    setCurrent(null);
    setBusy(true);

    try {
      // Native Android Bluetooth scanning
      if (Capacitor.isNativePlatform()) {
        setStatus("Initializing Android Bluetooth...");

        await BleClient.initialize();

        const foundDevices = new Map();

        setStatus("Scanning nearby Bluetooth devices for 10 seconds...");

        await BleClient.requestLEScan(
          { allowDuplicates: false },
          (result) => {
            const device = result.device;
            const id = device.deviceId;

            if (!id) return;

            foundDevices.set(id, {
              id,
              name: device.name || "Unnamed BLE device",
              rssi: result.rssi ?? null,
              inspectedAt: new Date().toLocaleString(),
              gattStatus: "Advertisement detected; GATT not connected",
              services: [],
              assessment: assessName(device.name),
              note: "Native BLE advertisement scan. Device was not connected or fully inspected."
            });
          }
        );

        await new Promise(resolve => setTimeout(resolve, 10000));

        await BleClient.stopLEScan();

        const records = Array.from(foundDevices.values());

        if (records.length === 0) {
          setStatus("Scan completed. No BLE advertisements were detected.");
          return;
        }

        setCurrent(records[0]);

        setHistory(previous =>
          [
            ...records,
            ...previous.filter(
              old => !records.some(item => item.id === old.id)
            )
          ].slice(0, 30)
        );

        setStatus(
          `Scan completed. Found ${records.length} nearby BLE device(s).`
        );

        return;
      }

      // Existing browser Bluetooth functionality
      setStatus("Opening browser Bluetooth chooser...");

      if (!navigator.bluetooth) {
        throw new Error("Bluetooth is not supported in this browser.");
      }

      if (!window.isSecureContext) {
        throw new Error("Bluetooth requires HTTPS or localhost.");
      }

      if (!browserDevicePromise) {
  throw new Error("Bluetooth requires a supported browser and HTTPS or localhost.");
}

const device = await browserDevicePromise;

      setStatus("Inspecting selected device...");

      const record = await inspectSelectedDevice(device);

      setCurrent(record);

      setHistory(previous =>
        [
          record,
          ...previous.filter(item => item.id !== record.id)
        ].slice(0, 30)
      );

      setStatus("Device inspection completed.");

    } catch (scanError) {
      console.error("Bluetooth scan error:", scanError);

      setError(scanError.message || "Bluetooth scanning failed.");

      setStatus("Bluetooth scan did not complete.");

      if (Capacitor.isNativePlatform()) {
        try {
          await BleClient.stopLEScan();
        } catch {}
      }

    } finally {
      setBusy(false);
    }
  }

    function exportReport() {
      if (!current) return;
      const blob = new Blob([JSON.stringify(current, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "safespace-ble-inspection.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function clearHistory() {
      if (window.confirm("Clear all saved Bluetooth inspection history?")) {
        setHistory([]);
        setCurrent(null);
        setStatus("Saved Bluetooth history cleared.");
      }
    }

    return (
      <section>
        <div className="heading">
          <label>BLUETOOTH INTELLIGENCE</label>
          <h1>BLE device inspection</h1>
          <p>
            Select one nearby Bluetooth Low Energy device, inspect accessible
            GATT services and characteristic capabilities, and save a local report.
          </p>
        </div>

        <article className="panel">
          <div className="row">
            <h2>Device discovery and inspection</h2>
            <span className={supported ? "green" : "muted"}>
              {supported ? "● WEB BLUETOOTH AVAILABLE" : "● NOT SUPPORTED"}
            </span>
          </div>

          <p className="hint">
            Bluetooth availability: {available === null ? "Not confirmed by browser" : available ? "Available" : "Bluetooth may be turned off or unavailable"}
          </p>
          <p className="hint">
            Choose a device from the system chooser. This browser interface cannot
            silently scan every nearby device, read all vendor-specific services,
            or guarantee tracker detection.
          </p>

          <button onClick={scan} disabled={busy || !supported}>
            {busy ? "Inspecting selected device..." : "Choose and inspect a BLE device"}
          </button>

          <p className="hint">Status: {status}</p>
          {error && <div className="error">{error}</div>}

          {current && (
            <div className="panel">
              <div className="row wrap">
                <h3>Latest inspection</h3>
                <span className="muted">{current.inspectedAt}</span>
              </div>
              <p><b>Device:</b> {current.name}</p>
              <p className="hint"><b>GATT result:</b> {current.gattStatus}</p>
              <p><b>Name review:</b> {current.assessment.label}</p>
              <p className="hint">{current.assessment.detail}</p>

              <h3>Accessible services and characteristics</h3>
              {current.services.length ? (
                <ul className="results">
                  {current.services.map((service) => (
                    <li key={service.uuid}>
                      <div>
                        <b>{service.label}</b>
                        <p className="hint">Service UUID: {service.shortUuid} ({service.uuid})</p>
                        <p className="hint">{service.context}</p>
                        <p className="hint">
                          Characteristics: {service.characteristics.length}
                        </p>
                        {service.characteristics.length > 0 && (
                          <ul className="results">
                            {service.characteristics.map((characteristic) => (
                              <li key={characteristic.uuid}>
                                <div>
                                  <b>{characteristic.label}</b>
                                  <p className="hint">{characteristic.shortUuid} · {characteristic.uuid}</p>
                                  <p className="hint">
                                    Capabilities: {characteristic.properties.length
                                      ? characteristic.properties.join(", ")
                                      : "No standard access capability reported"}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">
                  No accessible service metadata was returned. This can happen
                  with devices that do not expose connectable GATT services or restrict access.
                </p>
              )}

              <p className="hint">{current.note}</p>
              <button className="secondary" onClick={exportReport}>Export inspection report (JSON)</button>
            </div>
          )}

          <div className="row wrap">
            <h3>Saved inspection history</h3>
            <button className="secondary" onClick={clearHistory} disabled={!history.length}>
              Clear history
            </button>
          </div>

          {history.length ? (
            <ul className="results">
              {history.map((item, index) => (
                <li key={item.id || `${item.name}-${index}`}>
                  <div>
                    <b>{item.name}</b>
                    <p className="hint">Inspected: {item.inspectedAt || item.time || "Date not recorded"}</p>
                    <p className="hint">GATT: {item.gattStatus || (item.gatt ? "Interface available; not inspected" : "Not available")}</p>
                    <p className="hint">Services recorded: {Array.isArray(item.services) ? item.services.length : 0}</p>
                  </div>
                  <span>#{index + 1}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">No Bluetooth inspections saved yet.</div>
          )}

          <div className="warning">
            This feature reports only the user-selected BLE device and the GATT
            metadata exposed to this website. It does not read characteristic
            values. Device names and service profiles do not prove that a device
            is a hidden camera or tracker. Some trackers use rotating identifiers,
            proprietary protocols, or non-connectable advertisements and may not
            appear here. A clean result is not a room-safety clearance.
          </div>
        </article>
      </section>
    );
  }

  function NetworkScan(){
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState("");
  async function scan(){
    setBusy(true);setErr("");setData(null);
    try{const r=await fetch("http://localhost:4174/api/network-devices");if(!r.ok)throw new Error("Local network helper returned an error.");setData(await r.json());}
    catch(e){setErr("Cannot reach the SafeSpace local network helper. Start it in a second terminal using the instructions in the README. "+e.message);}
    finally{setBusy(false);}
  }
  return <section><div className="heading"><label>AUTHORIZED LOCAL NETWORK</label><h1>Wi-Fi device inventory</h1><p>Reads your laptop's existing ARP neighbour table. It does not actively probe devices or scan networks.</p></div>
  <article className="panel"><div className="row"><h2>Devices recently observed by this laptop</h2><span className="muted">LOCAL HELPER</span></div>
  <p className="hint">Only run this on a network you own or have permission to inspect. The list may be incomplete because it depends on devices your laptop has recently communicated with.</p>
  <button onClick={scan} disabled={busy}>{busy?"Reading local table…":"Refresh device inventory"}</button>
  {err&&<p className="error">{err}</p>}
  {data&&<><p className="hint">Host: {data.hostname} · Retrieved: {new Date(data.retrievedAt).toLocaleString()}</p><ul className="results">{data.devices.map((d,i)=><li key={i}><b>{d.ip}</b><span>{d.mac||"MAC not available"} · {d.interface||"interface unknown"}</span></li>)}</ul><p className="hint">Found {data.devices.length} ARP entries. These are not classified as cameras or trackers.</p></>}
  <div className="warning">An unfamiliar IP/MAC address is not proof of a camera. Offline, isolated, guest-network and cellular devices will not appear here.</div>
  </article></section>
  }

  const items=["Inspect objects facing beds, showers or changing areas.","Look for unfamiliar holes, wiring or misplaced electronics.","Check your belongings and luggage for unfamiliar attached devices.","Review built-in unknown-tracker alerts on your phone.","If you control the Wi-Fi, review the router's device list.","If concerned, move to safety and report the concern; do not dismantle fixtures."];
  function Checklist() {
    const [checked, setChecked] = useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem("safespace_checklist_v1") || "{}"
        );
      } catch {
        return {};
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem(
          "safespace_checklist_v1",
          JSON.stringify(checked)
        );
      } catch (error) {
        console.error("Could not save checklist:", error);
      }
    }, [checked]);

    return (
      <section>
        <div className="heading">
          <label>ROOM SAFETY</label>
          <h1>Inspection checklist</h1>
          <p>Guided checks for hotels, PGs, trial rooms and rented flats.</p>
        </div>

        <article className="panel">
          <h2>
            {items.filter((x, i) => checked[i]).length} / {items.length} completed
          </h2>

          {items.map((x, i) => (
            <label className="check" key={i}>
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={(e) =>
                  setChecked((previous) => ({
                    ...previous,
                    [i]: e.target.checked
                  }))
                }
              />
              {x}
            </label>
          ))}

          <div className="warning">
            Completing this checklist does not certify a room as safe.
          </div>
        </article>
      </section>
    );
  }
  createRoot(document.getElementById("root")).render(<App/>);
