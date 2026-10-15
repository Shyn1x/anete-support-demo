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

test('language changes per message without resetting conversation',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions(options));
 try{for(const [message,expected]of [['Какая гарантия?','ru'],['What is the warranty?','en'],['Kāda ir garantija?','lv'],['Какая гарантия?','ru']]){
 const response=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json'},body:JSON.stringify({tenant:'anete',locale:'ru',message,previousTopic:'warranty'})});
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.locale,expected);assert.deepEqual(body.cardIds,['warranty']);assert.equal(body.handoff,false);
 }}finally{await mf.dispose();}
});

test('five prospect tenants run all 250 scenarios inside workerd without cross-store sources',async()=>{
 const {prospectCases}=await import('../test/prospect-cases.mjs');
 const {prospectTenants}=await import('../src/prospects.js');
 const mf=new Miniflare(convertV4MiniflareOptions(options));
 try{let i=0;for(const tenant of Object.values(prospectTenants)){for(const [locale,message,expected]of prospectCases){
  const res=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':`198.51.${Math.floor(i/200)}.${i++%200+1}`},body:JSON.stringify({tenant:tenant.id,locale,message})});
  assert.equal(res.status,200,tenant.id+': '+message);const out=await res.json();
  if(expected==='unknown')assert.equal(out.cardIds.length,0);else if(expected)assert.equal(out.cardIds[0],expected);
  assert.equal(out.contact.email,tenant.contact.email);assert.ok(!JSON.stringify(out).includes('anete.lv'));
  const own=new Set(Object.values(tenant.sources).map(s=>s.url));assert.ok(out.sources.every(s=>own.has(s.url)));
 }}}finally{await mf.dispose();}
});
