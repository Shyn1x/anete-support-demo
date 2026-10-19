import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('workerd/SQLite rejects a semantically changed percentage, counts one attempt, and respects the unchanged cap',async()=>{
 const url='https://www.bariba.lv/fidelity-food.html';let providerCalls=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'catalog-fidelity-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'synthetic-runtime-secret-at-least-32-characters',TENANT_ID:'bariba',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',DEMO_PASSWORD:'synthetic-runtime-password',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>new Response('',{status:404})},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){providerCalls++;const body=await req.json();assert.equal(body.store,false);assert.equal(body.max_output_tokens,450);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply:'Свежая куриная грудка составляет около 25%.',evidence:[{id:'catalog:0',quote:'Svaiga putnu gaļa vismaz 25%'}]})}]}]});}
  assert.equal(req.url,url);return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url,name:'Example food',description:'Svaiga putnu gaļa vismaz 25%, vistu tauki.'})}</script>`,{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.20',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const query={tenant:'bariba',locale:'ru',message:'Какой состав корма? '+url};
  let response=await post('/api/chat',query,cookie);assert.equal(response.status,200);let data=await response.json();assert.equal(data.validationReason,'catalog_quantity_qualifier');assert.equal(data.conversational,undefined);assert.equal(data.catalogRevision,'buyer-v5');assert(!data.text.includes('грудка'));assert(!data.text.includes('около 25'));assert.equal(providerCalls,1);
  response=await post('/api/chat',query,cookie);data=await response.json();assert.equal(data.fallbackReason,'total_budget');assert.equal(data.providerUsed,false);assert.equal(providerCalls,1);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1')),status=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'b'.repeat(64)}})).json();assert.equal(status.total.reservedMicroUSD,10000);assert.equal(status.total.limitMicroUSD,10000);
 }finally{await mf.dispose();}
});
