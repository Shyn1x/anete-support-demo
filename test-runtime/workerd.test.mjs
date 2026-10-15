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
  assert.equal(responses.filter(r=>r.status===200).length,6);first=unique;
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

test('usage endpoint reads persisted SQLite counters only after login and consumes no provider reserve',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({...options,bindings:{...options.bindings,DEMO_PASSWORD:'synthetic-usage-password'}}));
 try{
  assert.equal((await mf.dispatchFetch('https://demo.example/api/usage')).status,401);
  const login=await mf.dispatchFetch('https://demo.example/api/login',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json'},body:JSON.stringify({password:'synthetic-usage-password'})});assert.equal(login.status,200);
  const cookie=login.headers.get('Set-Cookie').split(';')[0];for(let i=0;i<2;i++){const response=await mf.dispatchFetch('https://demo.example/api/usage',{headers:{cookie}});assert.equal(response.status,200);const data=await response.json();assert.equal(data.total.reservedMicroUSD,0);assert.equal(data.budgetCallsRemaining,50);assert.equal(data.callsAvailableNow,10);}
 }finally{await mf.dispose();}
});

test('isolated client Workers bind to the existing shared SQLite budget instead of multiplying caps',async()=>{
 const client=id=>({...options,name:'client-'+id,bindings:{...options.bindings,TENANT_ID:id,DEMO_PASSWORD:'runtime-client-pass-123'},durableObjects:{GUARD:{className:'BudgetGuard',scriptName:'owner-runtime'}}});
 const mf=new Miniflare(convertV4MiniflareOptions({workers:[{...options,name:'owner-runtime'},client('bariba'),client('hobbyset')]}));
 try{
  const clientWorker=await mf.getWorker('client-bariba');
  const cfg=await clientWorker.fetch('https://bariba.example/api/config');assert.equal((await cfg.json()).tenant,'bariba');
  assert.equal((await clientWorker.fetch('https://bariba.example/demos')).status,404);
  assert.equal((await clientWorker.fetch('https://bariba.example/api/config?tenant=hobbyset')).status,404);
  const namespace=await mf.getDurableObjectNamespace('GUARD','owner-runtime'),stub=namespace.get(namespace.idFromName('experiment-v1'));
  const stateBefore=await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}});assert.equal((await stateBefore.json()).total.reservedMicroUSD,0);
  // Both exported client bindings must resolve to the owner's exact object ID.
  for(const id of ['bariba','hobbyset']){const ns=await mf.getDurableObjectNamespace('GUARD','client-'+id);assert.equal(ns.idFromName('experiment-v1').toString(),namespace.idFromName('experiment-v1').toString());const r=await ns.get(ns.idFromName('experiment-v1')).fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:(id==='bariba'?'b':'c').repeat(64),kind:'chat',reserve:true})});assert.equal(r.status,200);}
  const after=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(after.total.reservedMicroUSD,20000);
 }finally{await mf.dispose();}
});

test('exhausted AI reserve still answers verified policies inside workerd without outbound requests',async()=>{
 let outbound=0;const mf=new Miniflare(convertV4MiniflareOptions({...options,bindings:{...options.bindings,TENANT_ID:'bariba',DEMO_PASSWORD:'runtime-fallback-pass-123',OPENAI_API_KEY:'fake-not-a-real-key',AI_ENABLED:'true',DAILY_BUDGET_MICRO_USD:'10000'},outboundService:()=>{outbound++;return new Response('Unexpected outbound call',{status:503});}}));
 try{
  const namespace=await mf.getDurableObjectNamespace('GUARD'),stub=namespace.get(namespace.idFromName('experiment-v1'));
  assert.equal((await stub.fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:'a'.repeat(64),kind:'chat',reserve:true})})).status,200);
  const login=await mf.dispatchFetch('https://demo.example/api/login',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json'},body:JSON.stringify({password:'runtime-fallback-pass-123'})});assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const r=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json',cookie},body:JSON.stringify({tenant:'bariba',locale:'ru',message:'Как вернуть товар?'})});assert.equal(r.status,200);const data=await r.json();assert.equal(data.mode,'reference');assert.equal(data.providerUsed,false);assert.equal(data.fallbackReason,'daily_budget');assert.ok(data.cardIds.includes('return-process'));assert.equal(outbound,0);
  const status=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(status.total.reservedMicroUSD,10000);
 }finally{await mf.dispose();}
});

test('product page read works in workerd, uses cache and does not reserve OpenAI budget',async()=>{
 const productURL='https://apavi40plus.com/ru/products/runtime-shoe';let outbound=0;
 const page='<script type="application/ld+json">'+JSON.stringify({'@type':'ProductGroup',url:productURL,name:'Runtime Shoe',description:'Material: leather',hasVariant:[{name:'Runtime Shoe - 48.5',offers:{availability:'https://schema.org/InStock',price:'50',priceCurrency:'EUR'}}]})+'</script>';
 const mf=new Miniflare(convertV4MiniflareOptions({...options,bindings:{...options.bindings,CATALOG_ENABLED:'true'},outboundService:req=>{outbound++;assert.equal(req.url,productURL);return new Response(page,{headers:{'Content-Type':'text/html'}});}}));
 try{for(let i=0;i<2;i++){const response=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json'},body:JSON.stringify({tenant:'apavi40plus',locale:'ru',message:'Размер 48.5, что по сетке? '+productURL})});assert.equal(response.status,200);const data=await response.json();assert.equal(data.productRead,true);assert.equal(data.mode,'catalog');assert.equal(data.providerUsed,false);assert.equal(data.sources[0].url,productURL);assert.equal(data.cached,i===1);assert.match(data.text,/нет соответствия/);}assert.equal(outbound,1);const namespace=await mf.getDurableObjectNamespace('GUARD');const data=await(await namespace.get(namespace.idFromName('experiment-v1')).fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(data.total.reservedMicroUSD,0);}finally{await mf.dispose();}
});
