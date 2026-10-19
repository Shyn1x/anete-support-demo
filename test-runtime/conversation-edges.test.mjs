import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {getTenant} from '../src/kb.js';
test('workerd/SQLite: corrected category search is free; linked delivery reserves once; conflict and cap stay safe',async()=>{
 let provider=0,merchant=0;const urls=['https://www.bariba.lv/adult-cat-food.html','https://www.bariba.lv/kitten-food.html'];
 const index={schema:'shop-catalog-index-v1',tenant:'bariba',importedAt:'2026-10-18T12:00:00Z',products:[{u:urls[0],t:'Adult cat food'},{u:urls[1],t:'Kitten cat food'}]};
 const mf=new Miniflare(convertV4MiniflareOptions({name:'conversation-edges',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-test-secret-at-least-32-characters',TENANT_ID:'bariba',DEMO_PASSWORD:'synthetic-runtime-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>Response.json(index)},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){provider++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['delivery'],handoff:false,reply:getTenant('bariba').cards.find(c=>c.id==='delivery').en})}]}]});}merchant++;throw Error('A delivery-policy question must not fetch a product page');
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.16',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'});const cookie=login.headers.get('Set-Cookie').split(';')[0];const chat=async message=>{const r=await post('/api/chat',{tenant:'bariba',locale:'en',message},cookie);assert.equal(r.status,200);return r.json();};
  const selected=await chat('I do not want kitten food, I need adult cat food');assert(selected.text.includes('Adult cat food'));assert(!selected.text.includes('Kitten cat food'));assert.equal(selected.providerUsed,false);assert.equal(provider,0);assert.equal(merchant,0);
  const delivery=await chat('What are the delivery options? '+urls[0]);assert(delivery.cardIds.includes('delivery'));assert.equal(delivery.catalogSearch,undefined);assert.equal(provider,1);assert.equal(merchant,0);
  const conflict=await chat('The label says something different from your answer. '+urls[0]);assert(conflict.handoff);assert(conflict.text.includes('earlier answer'));assert.equal(provider,1);assert.equal(merchant,0);
  const capped=await chat('What are the delivery options? '+urls[0]);assert.equal(capped.fallbackReason,'total_budget');assert.equal(capped.providerUsed,false);assert.equal(provider,1);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));const state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,10000);
 }finally{await mf.dispose();}
});
