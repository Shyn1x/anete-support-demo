import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {getTenant} from '../src/kb.js';
import {PILOT_BUYER_REVISION} from '../src/pilot-routing.js';
const nicheQuestions={dzijas:['Сколько мотков заказать на кардиган?','pilot-quantity'],jig:['Какое удилище взять?','pilot-rod'],musiclab:['Аудиоинтерфейс будет работать с моим ноутбуком?','pilot-interface'],etextile:['Какой бегунок подойдёт к этой молнии?','pilot-slider'],zummers:['Какую гитару выбрать новичку?','pilot-guitar']};
for(const id of ['dzijas','jig','musiclab','etextile','zummers'])test(`workerd pilot ${id}: explicit enablement, isolated auth and unchanged SQLite budget`,async()=>{
 let provider=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'pilot-'+id,modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{TENANT_ID:id,NEXT_BATCH_ENABLED:'true',SESSION_SECRET:'runtime-synthetic-pilot-secret-over-32-characters',DEMO_PASSWORD:'runtime-synthetic-pilot-password',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-runtime-key',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>new Response('unused')},outboundService:async req=>{
  assert.equal(req.url,'https://api.openai.com/v1/responses');provider++;
  return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['delivery'],handoff:false,reply:getTenant(id).cards.find(c=>c.id==='delivery').en})}]}]});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://pilot.example'+path,{method:'POST',headers:{Origin:'https://pilot.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.77',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const unauthorized=await post('/api/chat',{tenant:id,locale:'en',message:'Explain delivery in detail'});assert.equal(unauthorized.status,401);
  const login=await post('/api/login',{password:'runtime-synthetic-pilot-password'});assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const config=await(await mf.dispatchFetch('https://pilot.example/api/config',{headers:{Cookie:cookie}})).json();assert.equal(config.tenant,id);assert.equal(config.conversationRevision,'context-v2');
  assert.equal(config.pilotBuyerRevision,PILOT_BUYER_REVISION);
  const another=id==='dzijas'?'jig':'dzijas';assert.equal((await post('/api/chat',{tenant:another,locale:'en',message:'delivery'},cookie)).status,404);
  const body={tenant:id,locale:'en',message:'Please explain the delivery options in detail'};
  const first=await(await post('/api/chat',body,cookie)).json();assert.equal(first.conversational,true,JSON.stringify(first));assert.equal(first.providerUsed,true);
  const second=await(await post('/api/chat',body,cookie)).json();assert.equal(second.providerUsed,false);assert.equal(second.fallbackReason,'total_budget');assert.equal(provider,1);
  for(const [message,locale,card,handoff] of [['Please find an employee for me','en','contact',true],['Kur ir mans pasūtījums ar mikrofonu?','lv','status',true],['Can I collect my yarn in Valmiera?','en','pickup',false]]){
   const out=await(await post('/api/chat',{tenant:id,locale,message},cookie)).json();assert.ok(out.cardIds.includes(card),JSON.stringify(out));assert.equal(out.locale,locale);assert.equal(out.handoff,handoff);assert.equal(out.providerUsed,false);
  }
  const [question,card]=nicheQuestions[id],clarification=await(await post('/api/chat',{tenant:id,locale:'ru',message:question},cookie)).json();assert.ok(clarification.cardIds.includes(card),JSON.stringify(clarification));assert.equal(clarification.fallbackReason,'total_budget');assert.equal(provider,1);
  const privateReply=await(await post('/api/chat',{tenant:id,locale:'en',message:'password=synthetic-private-value'},cookie)).json();assert.equal(privateReply.mode,'safety');assert.equal(privateReply.providerUsed,false);
  const ns=await mf.getDurableObjectNamespace('GUARD'),guard=ns.get(ns.idFromName('experiment-v1'));
  const state=await(await guard.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,10000);
 }finally{await mf.dispose();}
});
