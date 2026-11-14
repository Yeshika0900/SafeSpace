import {test,expect,vi} from 'vitest';
import {normalizeRecord,normalizeHistory,normalizeChecklist,normalizeAliases,assessName,KEYS,LIMITS} from '../services/records';
import {loadHistory,loadChecklist,writeStored,clearBleStorage} from '../services/storage';
for(const value of [null,[],3,'x',true])test(`invalid persisted shapes ${JSON.stringify(value)}`,()=>{expect(normalizeChecklist(value)).toEqual({});expect(normalizeHistory(value)).toEqual([]);expect(normalizeAliases(value)).toEqual({});});
test('valid checklist booleans survive; other values removed',()=>expect(normalizeChecklist({'0':true,'1':'yes','2':false,'999':true})).toEqual({'0':true,'2':false}));
test('history strips values and uncertain legacy evidence',()=>{
 const records=normalizeHistory([null,{id:'fake',name:'My camera',deviceDetails:[{label:'Serial number',value:'synthetic-secret'}],services:[null,{characteristics:[null,{properties:null}]}]}]);
 expect(records).toHaveLength(1);expect(records[0].assessment).toEqual(assessName(''));expect(JSON.stringify(records)).not.toContain('synthetic-secret');expect(records[0].alias).toBe('My camera');
});
test('changing alias cannot change advertised assessment',()=>{
 const a=normalizeRecord({version:2,id:'fake',advertisedName:'',alias:'My lamp'});const b=normalizeRecord({...a,alias:'Camera tracker'});
 expect(a?.assessment).toEqual(b?.assessment);expect(a?.assessment.label).toBe('Name unknown');
});
test('history bounded and deduplicated',()=>{expect(normalizeHistory(Array.from({length:100},(_,i)=>({id:String(i)})))).toHaveLength(LIMITS.history);expect(normalizeHistory([{id:'x'},{id:'x'}])).toHaveLength(1);});
test('long Unicode and spoofed names bounded',()=>{const r=normalizeRecord({version:2,id:'fake',advertisedName:'\u202eＣＡＭＥＲＡ'+'a'.repeat(900),services:Array(90).fill({characteristics:Array(90).fill({uuid:'fake',properties:['Read']})})});expect(r!.name.length).toBeLessThanOrEqual(256);expect(r!.services).toHaveLength(32);expect(r!.services[0].characteristics).toHaveLength(64);expect(assessName('ＣＡＭＥＲＡ').label).toContain('verification');});
test('unavailable storage and quota do not fail inspection',()=>{
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('denied');});expect(loadHistory()).toEqual([]);expect(loadChecklist()).toEqual({});
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});expect(writeStored('test',{})).toBe(false);
});
test('clear removes history AND aliases even when malformed',()=>{localStorage.setItem(KEYS.history,'[null]');localStorage.setItem(KEYS.aliases,'null');expect(clearBleStorage()).toBe(true);expect(localStorage.getItem(KEYS.history)).toBeNull();expect(localStorage.getItem(KEYS.aliases)).toBeNull();expect(loadHistory()).toEqual([]);});
test('oversized data rejected before parse',()=>{localStorage.setItem(KEYS.history,' '.repeat(LIMITS.payload+1));expect(loadHistory()).toEqual([]);});
