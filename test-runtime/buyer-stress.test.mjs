import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('workerd/SQLite: safety and courtesy are free; two links reserve once and cannot bypass the cap',async()=>{
 const urls=['https://www.bariba.lv/buyer-one.html','https://www.bariba.lv/buyer-two.html'];let provider=0,merchant=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'buyer-stress-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-test-secret-at-least-32-characters',TENANT_ID:'bariba',DEMO_PASSWORD:'synthetic-runtime-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>{throw Error('Explicit links must not read search index');}},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){provider++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0','catalog:1'],reply:'Both descriptions list complete food for adult cats. No further difference is confirmed.',evidence:[0,1].map(i=>({id:'catalog:'+i,quote:'Complete food for adult cats.'}))})}]}]});}
  merchant++;assert(urls.includes(req.url));return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url:req.url,name:'Buyer test food',description:'Complete food for adult cats.'})}</script>`,{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.15',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'});const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const chat=async message=>{const r=await post('/api/chat',{tenant:'bariba',locale:'en',message},cookie);assert.equal(r.status,200);return r.json();};
  const safety=await chat('My cat is vomiting after this food. '+urls[0]);assert.equal(safety.handoff,true);assert.equal(safety.mode,'reference');assert.equal(merchant,0);assert.equal(provider,0);
  const closing=await chat("OK, that's all. Thank you!");assert.equal(closing.mode,'social');assert(!closing.text.includes('?'));assert.equal(provider,0);
  const first=await chat('Compare these '+urls.join(' '));assert.equal(first.conversational,true);assert.equal(first.catalogRevision,'buyer-v8');assert.equal(provider,1);assert.equal(merchant,2);assert.deepEqual(first.sources.map(s=>s.url),urls);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));let state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,10000);
  const capped=await chat('Compare these '+urls.join(' '));assert.equal(capped.fallbackReason,'total_budget');assert.equal(capped.providerUsed,false);assert.equal(provider,1);
  state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,10000);
  assert.equal((await post('/api/chat',{tenant:'apavi40plus',locale:'en',message:'Hello'},cookie)).status,404);
  assert.equal((await mf.dispatchFetch('https://demo.example/catalog-index.json')).status,404);
 }finally{await mf.dispose();}
});
