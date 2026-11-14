import React, {useEffect,useRef,useState} from 'react';
import {CameraSession} from '../services/camera';
export function Camera() {
  const video=useRef(null),canvas=useRef(null),controller=useRef(null);
  const [state,setState]=useState({active:false,pending:false,loading:false,pred:[],message:'Camera is off.',error:''});
  const {active:on,pending,loading,pred,message:msg,error:err}=state;
  useEffect(()=>{
    const session=new CameraSession(()=>video.current,setState);controller.current=session;
    const background=()=>{if(document.visibilityState==='hidden')session.stop();};
    const leave=()=>session.stop();
    document.addEventListener('visibilitychange',background);window.addEventListener('pagehide',leave);
    return ()=>{document.removeEventListener('visibilitychange',background);window.removeEventListener('pagehide',leave);session.destroy();};
  },[]);
  function start(){void controller.current?.start();}
  function stop(){controller.current?.stop();}
  function capture(){
    const v=video.current,c=canvas.current;
    if(!v||!c||!v.videoWidth||!v.videoHeight){setState(s=>({...s,error:'Wait for a video frame before capturing.'}));return;}
    try {
      c.width=v.videoWidth;c.height=v.videoHeight;
      const ctx=c.getContext('2d');if(!ctx)throw new Error('No canvas context');
      ctx.drawImage(v,0,0);const a=document.createElement('a');a.download='safespace-inspection.jpg';a.href=c.toDataURL('image/jpeg');a.click();
    }catch{setState(s=>({...s,error:'This frame could not be captured.'}));}
  }
    return (
      <section>
        <div className="heading">
          <span className="eyebrow">VISUAL CHECK</span>
          <h3>Camera inspection</h3>
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
              <button onClick={pending || on ? stop : start}>
                {pending || on ? "Stop camera" : "Enable camera"}
              </button>

              <button
                className="secondary"
                onClick={capture}
                disabled={!on}
              >
                Capture frame
              </button>
            </div>

            {msg && <p className="hint" role="status">{msg}</p>}
            {err && <p className="error" role="alert">{err}</p>}
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
                {loading ? "Loading object recognition..." : on ? "No current object observations. See camera status." : "No model observations yet. Start the camera."}
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

