
import React, {useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./styles.css";

function App(){
 const [tab,setTab]=useState("camera");
 return <div className="shell">
  <header><div className="logo">🛡️ <b>SafeSpace</b><small>PHASE 2 · LIVE TEST TOOLS</small></div><span className="badge">Laptop + mobile web</span></header>
  <nav>{[["camera","Camera inspection"],["bluetooth","Bluetooth discovery"],["network","Wi-Fi inventory"],["checklist","Safety checklist"]].map(([id,t])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{t}</button>)}</nav>
  <main>
   {tab==="camera"&&<Camera/>}
   {tab==="bluetooth"&&<BluetoothScan/>}
   {tab==="network"&&<NetworkScan/>}
   {tab==="checklist"&&<Checklist/>}
  </main>
  <footer>SafeSpace provides inspection assistance, not a guarantee that a room or device is safe.</footer>
 </div>
}

function Camera(){
 const video=useRef(null), canvas=useRef(null), stream=useRef(null), model=useRef(null), timer=useRef(null);
 const [on,setOn]=useState(false),[loading,setLoading]=useState(false),[pred,setPred]=useState([]),[msg,setMsg]=useState("Camera is off."),[err,setErr]=useState("");
 async function start(){
  setErr("");setLoading(true);
  try{
   if(!navigator.mediaDevices?.getUserMedia) throw new Error("Camera requires HTTPS or localhost and a supported browser.");
   const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
   stream.current=s; video.current.srcObject=s; await video.current.play(); setOn(true); setMsg("Camera active. Loading general object-recognition model…");
   if(!model.current) model.current=await cocoSsd.load();
   setMsg("Model ready. It recognizes common objects only—not hidden-camera lenses.");
   timer.current=setInterval(async()=>{
    if(!video.current||video.current.readyState<2||!model.current)return;
    try{const p=await model.current.detect(video.current);setPred(p.slice(0,8));}catch(e){console.error(e);}
   },1800);
  }catch(e){setErr(e.message||"Could not start camera. Check permission.");stop();}
  finally{setLoading(false);}
 }
 function stop(){
  if(timer.current)clearInterval(timer.current);
  if(stream.current)stream.current.getTracks().forEach(t=>t.stop());
  stream.current=null;if(video.current)video.current.srcObject=null;setOn(false);setPred([]);setMsg("Camera is off.");
 }
 function capture(){
  if(!video.current||!canvas.current)return;
  const v=video.current,c=canvas.current;c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);
  const a=document.createElement("a");a.download="safespace-inspection.jpg";a.href=c.toDataURL("image/jpeg");a.click();
 }
 useEffect(()=>()=>stop(),[]);
 return <section><div className="heading"><label>VISUAL CHECK</label><h1>Camera inspection</h1><p>Live preview plus general object recognition. This model is not trained to identify hidden cameras.</p></div>
 <div className="grid two"><article className="panel">
  <div className="row"><h2>Live camera</h2><span className={on?"green":"muted"}>{on?"● ACTIVE":"● OFF"}</span></div>
  <div className="video"><video ref={video} playsInline muted/><canvas ref={canvas} hidden/>{!on&&<div className="placeholder">📷<b>Camera preview is off</b><small>Enable the camera to begin.</small></div>}</div>
  <div className="row wrap"><button onClick={on?stop:start} disabled={loading}>{loading?"Loading…":on?"Stop camera":"Enable camera"}</button><button className="secondary" onClick={capture} disabled={!on}>Capture frame</button></div>
  {msg&&<p className="hint">{msg}</p>}{err&&<p className="error">{err}</p>}
 </article><article className="panel">
  <h2>AI object observations</h2><p className="hint">COCO-SSD labels everyday objects such as person, chair, laptop or bottle. It cannot determine whether an object contains a camera.</p>
  {pred.length?<ul className="results">{pred.map((p,i)=><li key={i}><b>{p.class}</b><span>{Math.round(p.score*100)}% model confidence</span></li>)}</ul>:<div className="empty">No model observations yet. Start the camera.</div>}
  <div className="warning">A high confidence label is not proof of a hidden camera. Use careful visual inspection and report concerns safely.</div>
 </article></div></section>
}

function BluetoothScan(){

 const [supported] = useState(
   typeof navigator !== "undefined" &&
   !!navigator.bluetooth
 );

 const [busy,setBusy] = useState(false);
 const [devices,setDevices] = useState(()=>{
   try {
     return JSON.parse(
       localStorage.getItem("safespace_ble_history") || "[]"
     );
   } catch {
     return [];
   }
 });

 const [err,setErr] = useState("");
 const [status,setStatus] = useState("Ready to scan.");

 useEffect(()=>{
   localStorage.setItem(
     "safespace_ble_history",
     JSON.stringify(devices)
   );
 },[devices]);

 async function scan(){

   setErr("");
   setBusy(true);
   setStatus("Waiting for Bluetooth device selection...");

   try{

     if(!navigator.bluetooth){
       throw new Error(
         "Web Bluetooth is unavailable. Try Android Chrome or desktop Chrome."
       );
     }

     if(!window.isSecureContext){
       throw new Error(
         "Bluetooth requires HTTPS or localhost."
       );
     }

     const device =
       await navigator.bluetooth.requestDevice({
         acceptAllDevices:true
       });

     const newDevice = {
       id:device.id,
       name:device.name || "Unnamed BLE device",
       time:new Date().toLocaleString(),
       gatt:!!device.gatt
     };

     setDevices(previous=>{

       const exists = previous.some(
         item=>item.id===newDevice.id
       );

       if(exists){

         return previous.map(item=>
           item.id===newDevice.id
           ? {...item,time:newDevice.time}
           : item
         );

       }

       return [newDevice,...previous].slice(0,50);

     });

     setStatus(
       "Device selected successfully. It has not been classified as a tracker."
     );

   }

   catch(e){

     if(e.name==="NotFoundError"){

       setErr("No device selected. You closed the Bluetooth picker.");

     }

     else if(e.name==="SecurityError"){

       setErr("Bluetooth permission denied. Check browser permissions.");

     }

     else{

       setErr(e.message || "Bluetooth discovery failed.");

     }

     setStatus("Discovery unsuccessful.");

   }

   finally{

     setBusy(false);

   }

 }

 function clearHistory(){

   if(window.confirm("Clear all saved Bluetooth history?")){

     setDevices([]);
     setStatus("Bluetooth history cleared.");

   }

 }

 return (

 <section>

   <div className="heading">

     <label>NEARBY BLUETOOTH</label>

     <h1>Bluetooth device discovery</h1>

     <p>
       Discover user-selected Bluetooth Low Energy devices
       and maintain a local inspection history.
     </p>

   </div>

   <article className="panel">

     <div className="row">

       <h2>Nearby BLE discovery</h2>

       <span className={supported?"green":"muted"}>

         {supported
           ?"● API AVAILABLE"
           :"● API NOT AVAILABLE"}

       </span>

     </div>

     <p className="hint">

       Start discovery and select a device from your
       browser's Bluetooth chooser.

     </p>

     <button
       onClick={scan}
       disabled={busy || !supported}
     >

       {busy
         ?"Waiting for selection..."
         :"Scan for Bluetooth devices"}

     </button>

     <p className="hint">
       Status: {status}
     </p>

     {err && (
       <div className="error">
         {err}
       </div>
     )}

     <div className="row wrap">

       <h3>Device inspection history</h3>

       <button
         className="secondary"
         onClick={clearHistory}
         disabled={!devices.length}
       >
         Clear history
       </button>

     </div>

     {devices.length>0 ? (

       <ul className="results">

         {devices.map((device,index)=>(

           <li key={device.id}>

             <div>

               <b>{device.name}</b>

               <p className="hint">
                 Selected: {device.time}
               </p>

               <p className="hint">
                 GATT interface: {
                   device.gatt
                     ?"Available"
                     :"Unavailable"
                 }
               </p>

             </div>

             <span>
               Device {index+1}
             </span>

           </li>

         ))}

       </ul>

     ) : (

       <div className="empty">

         No Bluetooth devices selected yet.

       </div>

     )}

     <div className="warning">

       Bluetooth discovery is not universal tracker detection.
       An unfamiliar device is not proof of surveillance.
       Some trackers use rotating identifiers or GPS/cellular
       connectivity and may not appear in this list.

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
function Checklist(){const [checked,setChecked]=useState({});return <section><div className="heading"><label>ROOM SAFETY</label><h1>Inspection checklist</h1><p>Guided checks for hotels, PGs, trial rooms and rented flats.</p></div><article className="panel"><h2>{items.filter((x,i)=>checked[i]).length} / {items.length} completed</h2>{items.map((x,i)=><label className="check" key={i}><input type="checkbox" checked={!!checked[i]} onChange={e=>setChecked(p=>({...p,[i]:e.target.checked}))}/>{x}</label>)}<div className="warning">Completing this checklist does not certify a room as safe.</div></article></section>}
createRoot(document.getElementById("root")).render(<App/>);
