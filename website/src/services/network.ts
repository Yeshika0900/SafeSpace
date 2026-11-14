import {object,text,LIMITS} from './records';
export type Inventory = {hostname:string;retrievedAt:string;devices:{ip:string;mac:string;interface:string}[]};
export function validateInventory(value:unknown):Inventory {
  if(!object(value)||!Array.isArray(value.devices)||value.devices.length>LIMITS.devices||typeof value.hostname!=='string'||value.hostname.length>256||typeof value.retrievedAt!=='string'||!Number.isFinite(Date.parse(value.retrievedAt)))throw new Error('Invalid response from local helper.');
  const devices=value.devices.map(d=>{
    if(!object(d)||typeof d.ip!=='string'||!/^\d{1,3}(\.\d{1,3}){3}$/.test(d.ip)||d.ip.split('.').some(x=>Number(x)>255)||typeof d.mac!=='string'||!/^([\da-f]{2}:){5}[\da-f]{2}$/i.test(d.mac)||typeof d.interface!=='string'||d.interface.length>256)throw new Error('Invalid response from local helper.');
    return {ip:d.ip,mac:d.mac,interface:text(d.interface)};
  });
  return {hostname:text(value.hostname),retrievedAt:value.retrievedAt,devices};
}
export async function fetchInventory(signal:AbortSignal,fetcher:typeof fetch=fetch,timeoutMs=6000):Promise<Inventory> {
  const abort=new AbortController();let timedOut=false;
  const cancel=()=>abort.abort();signal.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(()=>{timedOut=true;abort.abort();},timeoutMs);
  if(signal.aborted)abort.abort();
  try {
    const response=await fetcher('http://127.0.0.1:4174/api/network-devices',{headers:{'X-SafeSpace-Client':'inventory-v1'},signal:abort.signal,cache:'no-store'});
    if(!response.ok)throw new Error('Local helper rejected the request or could not read this operating system’s IPv4 neighbour table.');
    // Bound streaming input before parsing JSON, including missing Content-Length.
    const reader=response.body?.getReader();if(!reader)throw new Error('Invalid response from local helper.');
    const chunks:Uint8Array[]=[];let size=0;
    try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>LIMITS.payload)throw new Error('Invalid response from local helper.');chunks.push(value);}}finally{await reader.cancel();}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let value:unknown;try{value=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('Invalid response from local helper.');}
    return validateInventory(value);
  }catch(error){
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    if(timedOut)throw new Error('Local helper timed out. Check that it is running on this computer.',{cause:error});
    if(error instanceof TypeError)throw new Error('Helper unavailable or local-network access blocked. Start the helper on this computer and allow local-network access if prompted.',{cause:error});
    throw error;
  }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
