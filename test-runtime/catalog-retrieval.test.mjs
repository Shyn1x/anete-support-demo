import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const url='https://www.bariba.lv/necon-puppy-test.html';
test('real workerd: retrieved catalogue answer uses one message and one SQLite reservation, then respects the lifetime cap',async()=>{
 let providerCalls=0,merchantReads=0;
 const index={schema:'shop-catalog-index-v1',tenant:'bariba',importedAt:'2026-10-18T12:00:00Z',products:[{u:url,t:'Necon Puppy food'}]};
 const mf=new Miniflare(convertV4MiniflareOptions({name:'catalogue-real-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-test-secret-at-least-32-characters',TENANT_ID:'bariba',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',DEMO_PASSWORD:'synthetic-runtime-password',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>Response.json(index)},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){providerCalls++;const body=await req.json();assert.equal(body.store,false);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply:'The page describes complete dry food for puppies. How old is your puppy?',evidence:[{id:'catalog:0',quote:'Complete dry food for puppies.'}]})}]}]});}
  assert.equal(req.url,url);merchantReads++;return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url,name:'Necon Puppy food',description:'Complete dry food for puppies. Pack weight 12 kg.'})}</script>`,{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'});assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const q={tenant:'bariba',locale:'en',message:'What are the ingredients of puppy food?'};
  let response=await post('/api/chat',q,cookie);assert.equal(response.status,200);let data=await response.json();assert.equal(data.conversational,true);assert.equal(data.providerUsed,true);assert.equal(providerCalls,1);assert.equal(merchantReads,1);assert.deepEqual(data.sources.map(s=>s.url),[url]);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));let status=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(status.total.reservedMicroUSD,10000);
  response=await post('/api/chat',q,cookie);assert.equal(response.status,200);data=await response.json();assert.equal(data.providerUsed,false);assert.equal(data.fallbackReason,'total_budget');assert(data.text.includes('Necon Puppy food'));assert.equal(providerCalls,1);
  status=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(status.total.reservedMicroUSD,10000);
  assert.equal((await post('/api/chat',{...q,tenant:'hobbyset'},cookie)).status,404);assert.equal((await mf.dispatchFetch('https://demo.example/catalog-index.json')).status,404);
 }finally{await mf.dispose();}
});
