import { KEYS, LIMITS, normalizeAliases, normalizeChecklist, normalizeHistory } from './records';
export function readStored(key:string): unknown {
  try { const raw=localStorage.getItem(key); return raw && raw.length<=LIMITS.payload ? JSON.parse(raw) : null; } catch { return null; }
}
export function writeStored(key:string,value:unknown):boolean {
  try { const raw=JSON.stringify(value); if(raw.length>LIMITS.payload) return false; localStorage.setItem(key,raw); return true; } catch { return false; }
}
export const loadHistory = () => normalizeHistory(readStored(KEYS.history));
export const loadChecklist = () => normalizeChecklist(readStored(KEYS.checklist));
export const loadAliases = () => normalizeAliases(readStored(KEYS.aliases));
export function clearBleStorage():boolean {
  let ok=true;
  for(const key of [KEYS.history,KEYS.aliases]) try {localStorage.removeItem(key);} catch {ok=false;}
  return ok;
}
