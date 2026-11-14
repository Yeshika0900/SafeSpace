import React, {useEffect,useRef,useState} from 'react';
import {fetchInventory} from '../services/network';
import {Capacitor} from '@capacitor/core';
export function NetworkScan(){
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState('');
  const operation=useRef(null);
  useEffect(()=>()=>operation.current?.abort(),[]);
  async function scan(){
    operation.current?.abort();const controller=new AbortController();operation.current=controller;
    setBusy(true);setErr('');setData(null);
    try{
      if(Capacitor.isNativePlatform() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))throw new Error('Laptop inventory is unavailable on this phone. Localhost refers to the phone, not your laptop. Use the website and helper on the same computer.');
      const result=await fetchInventory(controller.signal);if(!controller.signal.aborted)setData(result);
    }catch(e){if(!controller.signal.aborted)setErr(e.message);}
    finally{if(!controller.signal.aborted)setBusy(false);}
  }
  return <section><div className="heading"><span className="eyebrow">AUTHORIZED LOCAL NETWORK</span><h3>Wi-Fi device inventory</h3><p>Reads this computer’s existing IPv4 neighbour table. It does not actively probe devices or scan networks.</p></div>
  <article className="panel"><div className="row"><h2>Devices recently observed by this computer</h2><span className="muted">LOCAL HELPER</span></div>
  <p className="hint">Only run this on a network you own or have permission to inspect. The incomplete list depends on recent communication. The helper must run on this same computer; localhost on a phone refers to the phone.</p>
  <button onClick={scan} disabled={busy}>{busy?'Reading local table…':'Refresh device inventory'}</button>
  {busy&&<p role="status" className="hint">Reading local IPv4 neighbours...</p>}
  {err&&<p className="error" role="alert">{err}</p>}
  {data&&<><p role="status" className="hint">Host: {data.hostname} · Retrieved: {new Date(data.retrievedAt).toLocaleString()}</p><ul className="results">{data.devices.map((d,i)=><li key={i}><b>{d.ip}</b><span>{d.mac} · {d.interface||'interface unknown'}</span></li>)}</ul><p className="hint">Found {data.devices.length} IPv4 neighbour entries. These are not classified as cameras or trackers.</p></>}
  <div className="warning">An unfamiliar IP/MAC address is not proof of a camera. Offline, isolated, guest-network and cellular devices will not appear here. IPv6 inventory is not supported.</div>
  </article></section>;
}
