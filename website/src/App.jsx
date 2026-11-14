import React, {useRef, useState} from 'react';
import {ShieldCheck, Camera as CameraIcon, Bluetooth, Wifi, ClipboardCheck, ArrowRight, LockKeyhole, ScanLine} from 'lucide-react';
import {Camera} from './features/Camera.jsx';
import {BluetoothScan} from './features/BluetoothScan.jsx';
import {NetworkScan} from './features/NetworkScan.jsx';
import {Checklist} from './features/Checklist.jsx';
import {ToolBoundary} from './ToolBoundary.jsx';
  export function App() {
    const [tab, setTab] = useState("camera");
    const workspace = useRef(null);
    function selectTool(id) {
      setTab(id);
      workspace.current?.scrollIntoView?.({block:'start'});
      workspace.current?.focus({preventScroll:true});
    }

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
        description: "Inspect selected BLE devices in the browser or advertisements on Android.",
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
                  onClick={() => selectTool("camera")}
                >
                  Start inspection
                  <ArrowRight size={17} />
                </button>

                <button
                  className="hero-secondary"
                  onClick={() => selectTool("checklist")}
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
                    aria-pressed={tab === feature.id}
                    className={`feature-card ${feature.color} ${
                      tab === feature.id ? "selected" : ""
                    }`}
                    onClick={() => selectTool(feature.id)}
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

          <section className="workspace-section" id="workspace" tabIndex={-1} ref={workspace} aria-label="Inspection workspace">

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
                    aria-pressed={tab === feature.id}
                  className={tab === feature.id ? "workspace-tab active" : "workspace-tab"}
                  onClick={() => selectTool(feature.id)}
                >
                  {feature.title}
                </button>
              ))}

            </div>

            <div className="workspace-content"><ToolBoundary key={tab}>
              {tab === "camera" && <Camera />}
              {tab === "bluetooth" && <BluetoothScan />}
              {tab === "network" && <NetworkScan />}
              {tab === "checklist" && <Checklist />}
            </ToolBoundary></div>

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

