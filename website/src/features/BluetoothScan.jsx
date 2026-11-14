import React, {useEffect,useRef,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {inspectBrowser,scanNative} from '../services/ble';
import {KEYS,LIMITS,normalizeHistory,text} from '../services/records';
import {loadHistory,loadAliases,writeStored,clearBleStorage} from '../services/storage';
export function BluetoothScan(){
  const native=Capacitor.isNativePlatform(),supported=native || !!navigator.bluetooth;
  const [busy,setBusy]=useState(false),[available,setAvailable]=useState(null),[error,setError]=useState('');
  const [status,setStatus]=useState(native?'Ready to observe BLE advertisements.':'Ready to inspect one selected BLE device.');
  const [current,setCurrent]=useState(null),[history,setHistory]=useState(loadHistory);
  const operation=useRef(null);
  useEffect(()=>{
    let active=true;
    if(!writeStored(KEYS.history,loadHistory()))setStatus('Inspection works, but saved history could not be updated.');
    writeStored(KEYS.aliases,loadAliases());
    if(!native && navigator.bluetooth?.getAvailability){
      try{Promise.resolve(navigator.bluetooth.getAvailability()).then(v=>{if(active)setAvailable(v);},()=>{});}catch{/* Availability is advisory. */}
    }
    const stop=()=>{operation.current?.abort();operation.current=null;};
    const background=()=>{if(document.visibilityState==='hidden'){operation.current?.abort('background');setBusy(false);setStatus('Bluetooth operation stopped while app was in background.');}};
    document.addEventListener('visibilitychange',background);window.addEventListener('pagehide',stop);
    return ()=>{active=false;stop();document.removeEventListener('visibilitychange',background);window.removeEventListener('pagehide',stop);};
  },[native]);
  function aliasFor(device){
    const aliases=loadAliases();let alias=aliases[device.id]||'';
    if(!text(device.name)&&!alias){
      alias=text(window.prompt('Device name is unavailable. Enter a friendly name (optional):'));
      if(alias){aliases[device.id]=alias;if(!writeStored(KEYS.aliases,aliases))setStatus('Alias could not be saved.');}
    }
    return alias;
  }
  async function scan(){
    operation.current?.abort();const controller=new AbortController();operation.current=controller;
    const timer=setTimeout(()=>controller.abort('timeout'),20000);
    setError('');setCurrent(null);setBusy(true);
    setStatus(native?'Observing BLE advertisements for ten seconds...':'Opening browser chooser; then inspecting accessible capabilities...');
    try{
      if(!native && !window.isSecureContext)throw new Error('Bluetooth requires HTTPS or localhost.');
      const records=native ? await scanNative(controller.signal) : [await inspectBrowser(navigator.bluetooth,controller.signal,aliasFor)];
      if(controller.signal.aborted)return;
      setCurrent(records[0]||null);
      setHistory(previous=>{
        const merged=normalizeHistory([...records,...previous.filter(old=>!records.some(r=>r.id===old.id))]).slice(0,LIMITS.history);
        if(!writeStored(KEYS.history,merged))setError('Inspection works, but history could not be saved on this device.');
        return merged;
      });
      setStatus(records.length ? (native?`Observed ${records.length} BLE advertisement(s).`:'Selected-device inspection finished; see GATT result for restrictions.') : 'Scan completed. No BLE advertisements observed; this does not establish room safety.');
    }catch(e){
      if(operation.current!==controller)return;
      if(controller.signal.aborted){if(controller.signal.reason==='timeout'){setError('Bluetooth operation timed out. You can try again.');setStatus('Bluetooth operation timed out.');}return;}
      setError(e.name==='NotFoundError'?'Device chooser cancelled or no device selected.': e.name==='NotAllowedError'?'Bluetooth permission denied. Check browser or system permissions.':e.message || 'Bluetooth unavailable, off or inspection failed.');
      setStatus('Bluetooth inspection did not complete.');
    }finally{clearTimeout(timer);if(operation.current===controller){setBusy(false);}}
  }
  function exportReport(){
    if(!current)return;
    const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='safespace-ble-inspection.json';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function clearHistory(){
    if(window.confirm('Clear all saved Bluetooth history and friendly names?')){
      const cleared=clearBleStorage();setHistory([]);setCurrent(null);setError('');
      setStatus(cleared?'Saved Bluetooth history and friendly names cleared.':'Visible history cleared. Device storage is unavailable; saved data could not be removed.');
    }
  }
    return (
      <section>
        <div className="heading">
          <span className="eyebrow">BLUETOOTH INSPECTION</span>
          <h3>BLE device inspection</h3>
          <p>
            {native ? "Observe nearby BLE advertisements for ten seconds on Android. Devices are not connected." : "Select one BLE device and inspect accessible GATT service and characteristic capabilities."}
          </p>
        </div>

        <article className="panel">
          <div className="row">
            <h2>Device discovery and inspection</h2>
            <span className={supported ? "green" : "muted"}>
              {supported ? (native ? "● NATIVE BLE" : "● WEB BLUETOOTH AVAILABLE") : "● NOT SUPPORTED"}
            </span>
          </div>

          <p className="hint">
            Bluetooth availability: {available === null ? "Not confirmed by browser" : available ? "Available" : "Bluetooth may be turned off or unavailable"}
          </p>
          <p className="hint">
            {native ? "Native scanning observes advertisements. Permission and Bluetooth availability depend on the device." : "Choose a device from the system chooser. This browser cannot silently scan every nearby device or measure signal strength."} Neither mode guarantees tracker detection.
          </p>

          <button onClick={scan} disabled={busy || !supported}>
            {busy ? (native ? "Observing advertisements..." : "Choosing or inspecting device...") : (native ? "Scan BLE advertisements" : "Choose and inspect a BLE device")}
          </button>

          <p className="hint" role="status">Status: {status}</p>
          {error && <div className="error" role="alert">{error}</div>}

          {current && (
            <div className="panel">
              <div className="row wrap">
                <h3>Latest inspection</h3>
                <span className="muted">{current.inspectedAt}</span>
              </div>
              <p><b>Device:</b> {current.name}</p><p className="hint">Advertised name: {current.advertisedName || "Unknown"}{current.alias ? ` · Your alias: ${current.alias}` : ""}</p>{current.rssi !== undefined && <p className="hint">Measured RSSI: {current.rssi} dBm. This is not a distance estimate.</p>}
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
            <button className="secondary" onClick={clearHistory} disabled={busy}>
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
            This feature reports browser-selected GATT metadata or native BLE advertisements, depending on the platform. It does not read characteristic
            values. Device names and service profiles do not prove that a device
            is a hidden camera or tracker. Some trackers use rotating identifiers,
            proprietary protocols, or non-connectable advertisements and may not
            appear here. A clean result is not a room-safety clearance.
          </div>
        </article>
      </section>
    );
  }

