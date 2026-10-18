import test from 'node:test';import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {productCoverageCases} from '../scripts/product-coverage-cases.mjs';
test('actual workerd: unverified product questions across all shops never call a provider, including exhausted budget',async()=>{
 let calls=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'product-coverage-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-test-secret-at-least-32-characters',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',DEMO_PASSWORD:'synthetic-runtime-password',TOTAL_BUDGET_MICRO_USD:'10000'},outboundService:async()=>{calls++;throw Error('Product evidence absent: no outbound request allowed');}}));
 const post=(path,body,ip,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':ip,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'},'192.0.2.1');assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));
  for(const exhausted of [false,true]){
   if(exhausted){const reserve=await stub.fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:'b'.repeat(64),kind:'chat',reserve:true})});assert.equal(reserve.status,200);}
   for(const [i,c]of productCoverageCases.filter(c=>c.kind==='unknown-model').entries()){
    const response=await post('/api/chat',{tenant:c.tenant,locale:c.locale,message:c.message},`192.0.${exhausted?4:3}.${i+1}`,cookie);assert.equal(response.status,200,c.id);const data=await response.json();assert.equal(data.providerUsed,false,c.id);assert.equal(data.locale,c.locale);assert.deepEqual(data.cardIds,[]);assert.equal(data.handoff,false);assert.equal(data.contact.email.endsWith('.invalid'),false);
   }
   const usage=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(usage.total.reservedMicroUSD,exhausted?10000:0);assert.equal(calls,0);
  }
 }finally{await mf.dispose();}
});
