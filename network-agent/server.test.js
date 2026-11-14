import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createHelper,approvedOrigins} from './server.js';
async function setup(t,options={}) {
 const server=createHelper({read:async()=>[],...options});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 return {server,port:server.address().port};
}
function request(port,headers={},method='GET',path='/api/network-devices'){
 const actualHeaders={Origin:'http://localhost:5173','X-SafeSpace-Client':'inventory-v1',...headers};for(const key of Object.keys(actualHeaders))if(actualHeaders[key]===undefined)delete actualHeaders[key];
 return new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path,method,headers:actualHeaders},res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);req.end();});
}
test('approved client succeeds with no-store',async t=>{const {port}=await setup(t);const r=await request(port);assert.equal(r.status,200);assert.deepEqual(JSON.parse(r.body).devices,[]);assert.equal(r.headers['cache-control'],'no-store');assert.equal(r.headers['access-control-allow-origin'],'http://localhost:5173');});
for(const headers of [{Origin:'https://hostile.example'},{Origin:'null'},{Origin:''},{Host:'attacker.example:4174'},{Host:'127.0.0.1.evil:4174'},{'X-SafeSpace-Client':'wrong'}])test(`rejects ${JSON.stringify(headers)}`,async t=>{const {port}=await setup(t);const r=await request(port,headers);assert.ok(r.status===400||r.status===403);});
test('missing Origin rejected',async t=>{const {port}=await setup(t);assert.equal((await request(port,{Origin:undefined})).status,403);});
test('preflight only allows correct method and header',async t=>{
 const {port}=await setup(t);const r=await request(port,{'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'x-safespace-client','Access-Control-Request-Private-Network':'true'},'OPTIONS');assert.equal(r.status,204);assert.equal(r.headers['access-control-allow-private-network'],'true');
 assert.equal((await request(port,{'Access-Control-Request-Method':'POST'},'OPTIONS')).status,403);
});
test('method and route restrictions',async t=>{const {port}=await setup(t);assert.equal((await request(port,{},'POST')).status,405);assert.equal((await request(port,{},'GET','/wrong')).status,404);});
test('errors exclude filesystem paths and command details',async t=>{const {port}=await setup(t,{read:async()=>{throw new Error('/private/path secret command');}});const r=await request(port);assert.equal(r.status,503);assert.deepEqual(JSON.parse(r.body),{error:'inventory_unavailable'});});
test('concurrent reads and immediate bursts share one subprocess',async t=>{let count=0,resolve;const promise=new Promise(r=>resolve=r);const {port}=await setup(t,{read:()=>{count++;return promise;}});const requests=Array.from({length:20},()=>request(port));await new Promise(r=>setTimeout(r,30));assert.equal(count,1);resolve([]);const results=await Promise.all(requests);assert.ok(results.every(r=>r.status===200));await request(port);assert.equal(count,1);});
test('failure bursts also coalesced',async t=>{let count=0;const {port}=await setup(t,{read:async()=>{count++;throw new Error('private');}});await Promise.all(Array.from({length:10},()=>request(port)));assert.equal(count,1);});
for(const input of ['*','https://*.example','null','https://example/path','https://example/','http://user:pass@localhost:5173',''])test(`unsafe origin config ${input}`,()=>assert.throws(()=>approvedOrigins(input)));
