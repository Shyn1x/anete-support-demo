import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {scenarios} from '../test/scenarios.mjs';
const options={name:'anete-runtime-test',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-test-secret-at-least-32-characters',AI_ENABLED:'false'}};
test('workerd resolves warranty typos in RU, LV and EN',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions(options));
 try{for(const [locale,message]of [['ru','Гарнтия'],['lv','garntija'],['en','warrnty']]){
  const response=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json'},body:JSON.stringify({tenant:'anete',locale,message})});
  assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.cardIds,['warranty']);assert.ok(body.sources.length);
 }}finally{await mf.dispose();}
});
test('all 108 synthetic scenarios execute inside workerd with a real SQLite Durable Object',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions(options));
 try{for(const [i,[locale,message,expected]] of scenarios.entries()){
  const response=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':`192.0.2.${i+1}`},body:JSON.stringify({tenant:'anete',locale,message})});
  assert.equal(response.status,200,`scenario ${i+1}`);const body=await response.json();assert.ok(body.text.length>5);if(body.cardIds.length)assert.equal(body.cardIds[0],expected,`scenario ${i+1}`);
 }}finally{await mf.dispose();}
});
test('real SQLite Durable Object serializes concurrent reservations and persists across restart',async()=>{
 const mf=new Miniflare({...convertV4MiniflareOptions({...options,bindings:{...options.bindings,TOTAL_BUDGET_MICRO_USD:'60000'}}),resourcePersistencePath:'.wrangler/test-budget'});
 const unique=crypto.randomUUID();let first;
 try{
  const namespace=await mf.getDurableObjectNamespace('GUARD'),stub=namespace.get(namespace.idFromName(unique));
  const responses=await Promise.all(Array.from({length:20},(_,i)=>stub.fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:i.toString(16).padStart(64,'0'),kind:'chat',reserve:true})})));
  assert.equal(responses.filter(r=>r.status===200).length,3);first=unique;
 }finally{await mf.dispose();}
 const second=new Miniflare({...convertV4MiniflareOptions({...options,bindings:{...options.bindings,TOTAL_BUDGET_MICRO_USD:'60000'}}),resourcePersistencePath:'.wrangler/test-budget'});
 try{const namespace=await second.getDurableObjectNamespace('GUARD');const response=await namespace.get(namespace.idFromName(first)).fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:'f'.repeat(64),kind:'chat',reserve:true})});assert.equal(response.status,429);}finally{await second.dispose();}
});
