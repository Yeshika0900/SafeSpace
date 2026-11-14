export function cancelled(signal:AbortSignal) {if(signal.aborted)throw new DOMException('Cancelled','AbortError');}
export function waitFor<T>(promise:Promise<T>,signal:AbortSignal,late?:(value:T)=>void):Promise<T> {
  return new Promise((resolve,reject)=>{
    const abort=()=>{signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
    promise.then(value=>{signal.removeEventListener('abort',abort);if(signal.aborted){late?.(value);return;}resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});
  });
}
export function delay(ms:number,signal:AbortSignal):Promise<void> {
  return new Promise((resolve,reject)=>{
    const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  });
}
