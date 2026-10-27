import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {controlPlan,validatePrior,executeControl,assessControl,preflight,loginSessions,IDS,CONTROL_PLAN_SHA,MAX_REQUESTS,MAX_RESERVATION_MICRO_USD} from '../scripts/run-pilot-control-15.mjs';
import {pilotLivePlan} from '../scripts/run-pilot-live.mjs';
const plan=JSON.parse(await readFile(new URL('./fixtures/pilot-control-plan-20261028.json',import.meta.url),'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const cookies=new Map(IDS.map(id=>[id,'demo_session=synthetic-private-session-'+id]));
const cfg=id=>({tenant:id,ready:true,locked:true,mode:'ai',conversationRevision:'context-v2',conversationEnabled:true,catalogEnabled:true,catalogRevision:'buyer-v8',pilotBuyerRevision:'pilot-buyer-v2',perCallMicroUSD:10000});
const answer=c=>({locale:c.locale,text:'Synthetic product information.',cardIds:c.kind==='fact'?['shipping-cost']:[],sources:c.kind==='fact'?[{url:'https://'+({dzijas:'dzijas.lv',jig:'www.jig.lv',musiclab:'musiclab.lv',etextile:'www.etextile.lv',zummers:'www.zummers.lv'}[c.tenant])+'/'}]:(c.products||[c.product].filter(Boolean)).map(url=>({url})),handoff:false,mode:'catalog',providerUsed:true,conversational:true,productRead:true});
const privateFile={schema:'pilot-passwords-v1',clients:IDS.map(id=>({id,url:'https://support-demo-'+id+'.fshyn1x.workers.dev',password:'synthetic-private-password-'+id}))};

test('control plan has exactly ten reviewed repetitions and five substantive LV questions, bounded to $0.15',()=>{
 assert.equal(plan.length,15);assert.equal(new Set(plan.map(c=>c.id)).size,15);assert.equal(MAX_REQUESTS,15);assert.equal(MAX_RESERVATION_MICRO_USD,150000);assert.equal(hash(JSON.stringify(plan)),CONTROL_PLAN_SHA);
 assert.equal(plan.filter(c=>c.priorCaseId).length,10);assert.equal(plan.filter(c=>c.locale==='lv').length,5);assert(plan.every(c=>c.generated));
 for(const id of IDS)assert(plan.some(c=>c.tenant===id&&c.locale==='lv'&&c.product&&c.message.includes(c.product)));
 const context=plan.find(c=>c.priorCaseId==='etextile-live-04');assert.equal(context.seed.caseId,'etextile-live-03');assert.equal(context.seed.productURL,context.product);assert.equal(context.seed.history.length,2);
});
test('reviewed plan is rebuilt unchanged from the original plan and historical product context',async()=>{
 const original=await pilotLivePlan(),seed=plan.find(c=>c.seed).seed;
 const prior={plan:original,rows:[{id:seed.caseId,question:seed.history[0].text,answer:{productRead:true,text:seed.history[1].text,topic:seed.previousTopic,productURL:seed.productURL}}]};
 assert.equal(hash(JSON.stringify(controlPlan(prior))),CONTROL_PLAN_SHA);
 assert.throws(()=>controlPlan({...prior,rows:[]}));
 assert.throws(()=>validatePrior(Buffer.from(JSON.stringify(prior))),/prior_report_hash/);
});
test('free preflight rejects stale revisions and changed reserve before paid calls',async()=>{
 for(const change of [{pilotBuyerRevision:'pilot-buyer-v1'},{perCallMicroUSD:5000},{locked:false},{tenant:'anete'}])await assert.rejects(()=>preflight(async url=>Response.json({...cfg(url.match(/support-demo-([^.]+)/)[1]),...change})));
 let calls=0;const rows=await preflight(async(url,options)=>{calls++;assert(url.endsWith('/api/config'));assert.equal(options.method,undefined);return Response.json(cfg(url.match(/support-demo-([^.]+)/)[1]));});assert.equal(rows.length,5);assert.equal(calls,5);
});
test('changed, duplicated or oversized plans are rejected before any request',async()=>{
 for(const change of [p=>p.pop(),p=>p.push(p[0]),p=>p[0].message+=' changed',p=>p[0].tenant='anete',p=>p[0].id='changed']){
  const bad=structuredClone(plan);change(bad);let requests=0;
  await assert.rejects(()=>executeControl({plan:bad,cookies,checkpoint:async()=>{},wait:async()=>{},fetcher:async()=>{requests++;}}),/plan_not_verified/);assert.equal(requests,0);
 }
});
test('fifteen unique POSTs are checkpointed before sending with no retries, hidden credentials or cross-case history',async()=>{
 let calls=0;const checkpoints=[];
 const rows=await executeControl({plan,cookies,wait:async ms=>assert.equal(ms,7000),checkpoint:async r=>checkpoints.push(structuredClone(r)),fetcher:async(url,options)=>{
  const c=plan[calls++],body=JSON.parse(options.body);assert.equal(options.method,'POST');assert(url.endsWith('/api/chat'));assert.equal(body.message,c.message);assert.equal(body.tenant,c.tenant);assert.equal(options.redirect,'error');assert.equal(checkpoints.at(-1).at(-1).state,'pending');
  assert.deepEqual(body.history,c.seed?.history||[]);assert.equal(body.productURL,c.seed?.productURL);
  return Response.json({...answer(c),extraSecret:'MUST-NOT-BE-SAVED'});
 }});
 assert.equal(calls,15);assert.equal(rows.length,15);assert.equal(rows.filter(r=>r.assessment.pass).length,15);
 assert(!JSON.stringify(rows).includes('synthetic-private-session'));assert(!JSON.stringify(rows).includes('MUST-NOT-BE-SAVED'));
});
for(const kind of ['network','json','http','budget'])test(kind+' refusal stops once without paid retries',async()=>{
 let calls=0;const events=[];const rows=await executeControl({plan,cookies,checkpoint:async(r,e)=>{if(e)events.push(e);},wait:async()=>{},fetcher:async()=>{
  calls++;if(kind==='network')throw Error('fake network loss');if(kind==='json')return new Response('bad json');if(kind==='http')return Response.json({error:'budget_exhausted'},{status:429});return Response.json({...answer(plan[0]),fallbackReason:'total_budget',providerUsed:false,conversational:false});
 }});assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(events.length,1);assert.equal(rows[0].state,['network','json'].includes(kind)?'ambiguous':kind==='http'?'blocked':'complete');
 assert.equal(rows[0].assessment?.pass===true,false);
});
test('validation fallbacks remain failures and are not silently retried or declared generated',async()=>{
 let calls=0;const rows=await executeControl({plan,cookies,wait:async()=>{},checkpoint:async()=>{},fetcher:async()=>{const c=plan[calls++];return Response.json({...answer(c),conversational:false,fallbackReason:'answer_validation',validationReason:'unsupported_number'});}});
 assert.equal(calls,15);assert(rows.every(r=>!r.assessment.pass&&r.answer.validationReason==='unsupported_number'));
});
test('translation, handoff and wrong product evidence cannot be accepted',()=>{
 const c=plan.find(c=>c.priorCaseId==='etextile-live-04');assert(assessControl(c,{...answer(c),text:'The material of this furniture press is unconfirmed.'},200).issues.includes('incorrect-hardware-translation'));
 assert(assessControl(c,{...answer(c),handoff:true},200).issues.includes('unexpected-shop-review'));
 assert(assessControl(c,{...answer(c),sources:[{url:'https://another-shop.example/'}]},200).issues.includes('missing-product-evidence'));
});
test('private sessions use only fixed demo login endpoints, never print/store credentials and reject duplicate secrets',async()=>{
 let count=0;const sessions=await loginSessions(privateFile,async(url,options)=>{count++;assert(url.endsWith('/api/login'));assert.equal(options.method,'POST');return new Response('{}',{headers:{'set-cookie':'demo_session=synthetic; HttpOnly; Secure'}});});assert.equal(sessions.size,5);assert.equal(count,5);
 const bad=structuredClone(privateFile);bad.clients[1].password=bad.clients[0].password;await assert.rejects(()=>loginSessions(bad,async()=>{throw Error('must not call');}));
});
test('standalone entrypoint requires explicit paid args, preserves old evidence and cannot deploy or modify server budgets',async()=>{
 const source=await readFile(new URL('../scripts/run-pilot-control-15.mjs',import.meta.url),'utf8');assert(source.includes("args.join(' ')!=='--run --allow-paid --max-requests 15'"));assert(source.includes("open(resolve(base,MARKER),'wx'"));assert(source.includes("open(resolve(base,'.live-50.lock'),'wx'"));
 assert(source.includes('historical_file_changed'));assert(!/wrangler|spawn\(|child_process|\/api\/usage|api\.openai\.com|secret bulk/iu.test(source));
 for(const line of source.split('\n').filter(l=>/^import /u.test(l)))assert(line.includes("'node:"));
});
