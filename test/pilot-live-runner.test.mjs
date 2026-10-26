import test from 'node:test';
import assert from 'node:assert/strict';
import {pilotLivePlan,pilotPreflight,compatiblePilotConfig,executePilotCases,assessPilotLive} from '../scripts/run-pilot-live.mjs';
import {PILOT_BUYER_REVISION} from '../src/pilot-routing.js';
import {PILOT_IDS} from '../scripts/audit-pilot-buyers.mjs';
const cookies=new Map(PILOT_IDS.map(id=>[id,'demo_session=synthetic-local-test']));
const available={kind:'reservation_estimate_not_invoice',scope:'all_shops',perCallMicroUSD:10000,callsAvailableNow:5};
test('50 bounded new-shop cases include real product links, comparisons, employee, privacy and farewell checks',async()=>{
 const plan=await pilotLivePlan();assert.equal(plan.length,50);assert.equal(new Set(plan.map(c=>c.id)).size,50);
 for(const id of PILOT_IDS){const cases=plan.filter(c=>c.tenant===id);assert.equal(cases.length,10);for(const kind of ['product','comparison','handoff','privacy','social','blocked'])assert.ok(cases.some(c=>c.kind===kind));}
});
test('public preflight makes five configuration GETs and no paid/chat/auth requests',async()=>{
 const urls=[];const result=await pilotPreflight(async(url,init)=>{urls.push(url);assert.equal(init.method,undefined);assert.equal(init.redirect,'error');return new Response('not published',{status:404});});
 assert.equal(result.ready,false);assert.equal(result.providerCalls,0);assert.equal(urls.length,5);assert.ok(urls.every(u=>u.endsWith('/api/config')));
});
test('live runner refuses old deployments and incorrect reservation settings',()=>{
 const cfg={tenant:'jig',ready:true,locked:true,mode:'ai',conversationEnabled:true,conversationRevision:'context-v2',catalogEnabled:true,catalogRevision:'buyer-v8',pilotBuyerRevision:PILOT_BUYER_REVISION,perCallMicroUSD:10000};
 assert.ok(compatiblePilotConfig(cfg,'jig'));
 for(const change of [{tenant:'anete'},{ready:false},{mode:'reference'},{locked:false},{pilotBuyerRevision:null},{perCallMicroUSD:1},{catalogEnabled:false}])assert.equal(compatiblePilotConfig({...cfg,...change},'jig'),false);
});
test('budget/rate refusal stops before any chat and without altering budget',async()=>{
 const plan=await pilotLivePlan(),events=[];let calls=0;
 const rows=await executePilotCases({plan,cookies,wait:async()=>{},checkpoint:async(r,e)=>events.push(e),fetcher:async url=>{calls++;assert.ok(url.endsWith('/api/usage'));return Response.json({...available,callsAvailableNow:0});}});
 assert.equal(rows.length,0);assert.equal(calls,1);assert.equal(events.at(-1).stop,'server-budget-or-rate-unavailable');
});
test('an ambiguous paid response is checkpointed once and never retried',async()=>{
 const plan=await pilotLivePlan(),snapshots=[];let chats=0;
 const rows=await executePilotCases({plan,cookies,wait:async()=>{},checkpoint:async r=>snapshots.push(structuredClone(r)),fetcher:async url=>{if(url.endsWith('/api/usage'))return Response.json(available);chats++;throw Error('synthetic network loss');}});
 assert.equal(chats,1);assert.equal(rows[0].state,'ambiguous');assert.equal(snapshots[0][0].state,'pending');assert.equal(snapshots.at(-1)[0].state,'ambiguous');assert.ok(!JSON.stringify(rows).includes('demo_session'));
});
test('the batch stops at 50 chat requests and records failures without retries or silent success',async()=>{
 const plan=await pilotLivePlan();let chats=0,usage=0,failures=[];
 const rows=await executePilotCases({plan,cookies,wait:async ms=>assert.equal(ms,7000),checkpoint:async r=>{failures=r.filter(x=>x.assessment&&!x.assessment.pass);},fetcher:async(url,init)=>{
  if(url.endsWith('/api/usage')){usage++;return Response.json(available);}
  assert.ok(url.endsWith('/api/chat'));assert.equal(init.redirect,'error');assert.equal(init.method,'POST');chats++;
  return Response.json({locale:'ru',text:'Synthetic incomplete response',cardIds:[],mode:'reference',fallbackReason:'answer_validation',validationReason:'incomplete',providerUsed:true});
 }});
 assert.equal(chats,50);assert.equal(usage,50);assert.equal(rows.length,50);assert.ok(failures.length>0);assert.ok(rows.every(r=>r.answer.validationReason==='incomplete'));assert.ok(!JSON.stringify(rows).includes('demo_session'));
});
test('HTTP denial never causes a paid retry',async()=>{
 let chats=0;const rows=await executePilotCases({plan:await pilotLivePlan(),cookies,wait:async()=>{},checkpoint:async()=>{},fetcher:async url=>url.endsWith('/api/usage')?Response.json(available):(chats++,Response.json({error:'budget_exhausted'},{status:429}))});
 assert.equal(chats,1);assert.equal(rows[0].state,'blocked');assert.equal(rows[0].assessment.pass,false);
});
test('generated product checks reject deterministic fallbacks and missing evidence',async()=>{
 const c=(await pilotLivePlan()).find(c=>c.kind==='product'),base={locale:c.locale,text:'Synthetic answer',cardIds:[],sources:[],mode:'catalog',providerUsed:false};
 const a=assessPilotLive(c,base,200);assert.equal(a.pass,false);assert.ok(a.issues.some(s=>s.startsWith('generated-answer-required')));assert.ok(a.issues.includes('missing-product-evidence'));
});
