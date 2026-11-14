import {KEYS} from '../services/records';
import {loadChecklist,writeStored} from '../services/storage';
import React, {useEffect,useState} from 'react';
  const items=["Inspect objects facing beds, showers or changing areas.","Look for unfamiliar holes, wiring or misplaced electronics.","Check your belongings and luggage for unfamiliar attached devices.","Review built-in unknown-tracker alerts on your phone.","If you control the Wi-Fi, review the router's device list.","If concerned, move to safety and report the concern; do not dismantle fixtures."];
  export function Checklist() {
    const [checked, setChecked] = useState(loadChecklist);
    const [storageError,setStorageError] = useState(false);
    useEffect(() => {setStorageError(!writeStored(KEYS.checklist,checked));},[checked]);

    return (
      <section>
        <div className="heading">
          <span className="eyebrow">ROOM SAFETY</span>
          <h3>Inspection checklist</h3>
          <p>Guided checks for hotels, PGs, trial rooms and rented flats.</p>
        </div>

        <article className="panel">{storageError && <p role="status" className="hint">Checklist works, but changes could not be saved on this device.</p>}
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
