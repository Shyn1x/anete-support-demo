import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {controlPlan,executeControl,preflight,loginSessions,assessControl,CONTROL_PLAN_SHA,MAX_REQUESTS,MAX_RESERVATION_MICRO_USD,IDS} from '../scripts/run-pilot-comparison-3.mjs';
const plan=JSON.parse(await readFile(new URL('./fixtures/pilot-comparison-three-plan-20261028.json',import.meta.url),'utf8'));
const previous=JSON.parse(await readFile(new URL('./fixtures/pilot-control-plan-20261028.json',import.meta.url),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const cookies=new Map(IDS.map(id=>[id,'demo_session=synthetic-private-cookie']));
const cfg=id=>({tenant:id,ready:true,locked:true,mode:'ai',conversationRevision:'context-v2',conversationEnabled:true,catalogEnabled:true,catalogRevision:'buyer-v8',pilotBuyerRevision:'pilot-buyer-v3',perCallMicroUSD:10000});
const answer=c=>({locale:'en',text:'Synthetic comparison.',cardIds:[],sources:c.products.map(url=>({url})),handoff:false,mode:'catalog',providerUsed:true,conversational:true,productRead:true});
test('three comparison control is an exact subset with original provenance and an independent $0.03 cap',()=>{
 assert.equal(MAX_REQUESTS,3);assert.equal(MAX_RESERVATION_MICRO_USD,30000);assert.equal(hash(JSON.stringify(plan)),CONTROL_PLAN_SHA);
 assert.equal(hash(JSON.stringify(controlPlan({plan:previous}))),CONTROL_PLAN_SHA);
 assert.deepEqual(plan.map(c=>c.tenant),['dzijas','jig','musiclab']);assert(plan.every(c=>c.kind==='comparison'&&c.products.length===2&&c.generated&&c.priorCaseId.endsWith('-control-05')&&c.originalCaseId.endsWith('-live-05')));
});
test('three GET checks require v3, locked pilots and the existing per-call reserve',async()=>{
 let calls=0;await preflight(async url=>{calls++;assert(url.endsWith('/api/config'));return Response.json(cfg(url.match(/support-demo-([^.]+)/)[1]));});assert.equal(calls,3);
 for(const change of [{pilotBuyerRevision:'pilot-buyer-v2'},{perCallMicroUSD:5000},{locked:false}])await assert.rejects(()=>preflight(async url=>Response.json({...cfg(url.match(/support-demo-([^.]+)/)[1]),...change})));
});
test('the full original private credentials file is validated but only three target sessions are opened',async()=>{
 const file={schema:'pilot-passwords-v1',clients:['dzijas','jig','musiclab','etextile','zummers'].map(id=>({id,url:'https://support-demo-'+id+'.fshyn1x.workers.dev',password:'synthetic-password-'+id+'-long-enough'}))};
 const calls=[];const sessions=await loginSessions(file,async(url,options)=>{calls.push(url);assert.equal(options.method,'POST');return new Response('{}',{headers:{'set-cookie':'demo_session=synthetic; HttpOnly'}});});
 assert.equal(sessions.size,3);assert.equal(calls.length,3);assert(calls.every(u=>!u.includes('etextile')&&!u.includes('zummers')));
 const bad=structuredClone(file);bad.clients[4].password=bad.clients[0].password;await assert.rejects(()=>loginSessions(bad,async()=>{throw Error('must not call');}));
});
test('at most three uniquely identified POSTs, checkpointed before sending, with response allowlist and no cookies in reports',async()=>{
 let calls=0;const snapshots=[];const rows=await executeControl({plan,cookies,checkpoint:async r=>snapshots.push(structuredClone(r)),wait:async ms=>assert.equal(ms,7000),fetcher:async(url,options)=>{
  const c=plan[calls++];assert(url.endsWith('/api/chat'));assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).tenant,c.tenant);assert.equal(snapshots.at(-1).at(-1).state,'pending');return Response.json({...answer(c),cookie:'MUST-NOT-BE-SAVED'});
 }});assert.equal(calls,3);assert(rows.every(r=>r.assessment.pass));assert(!JSON.stringify(rows).includes('synthetic-private-cookie'));assert(!JSON.stringify(rows).includes('MUST-NOT-BE-SAVED'));
});
for(const kind of ['network','json','budget','http'])test('three-case '+kind+' stop is never retried',async()=>{
 let calls=0;const events=[];const rows=await executeControl({plan,cookies,checkpoint:async(r,e)=>{if(e)events.push(e);},wait:async()=>{},fetcher:async()=>{
  calls++;if(kind==='network')throw Error('synthetic loss');if(kind==='json')return new Response('bad json');if(kind==='http')return Response.json({error:'budget_exhausted'},{status:429});return Response.json({...answer(plan[0]),providerUsed:false,conversational:false,fallbackReason:'total_budget'});
 }});assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(events.length,1);assert.notEqual(rows[0].assessment?.pass,true);
});
test('mutated/expanded plans never reach a paid request and fallback remains REVIEW',async()=>{
 for(const bad of [[...plan,plan[0]],plan.slice(1),plan.map((c,i)=>i?c:{...c,message:'changed'})])await assert.rejects(()=>executeControl({plan:bad,cookies,checkpoint:async()=>{},fetcher:async()=>{assert.fail('must not send');}}));
 assert.equal(assessControl(plan[0],{...answer(plan[0]),fallbackReason:'answer_validation',validationReason:'catalog_quantity_binding'},200).pass,false);
});
test('past 15-run tool stays byte-identical; new entrypoint has a fixed receipt, explicit three-request arguments, v3 proof and historical hash checks',async()=>{
 const old=await readFile(new URL('../scripts/run-pilot-control-15.mjs',import.meta.url)),source=await readFile(new URL('../scripts/run-pilot-comparison-3.mjs',import.meta.url),'utf8');
 assert.equal(hash(old),'aac1af8ef220b4879d12845cc3674b564cf5809cb678488e9b3ef60ee0b67341');
 assert(source.includes("MARKER='.pilot-comparison-3-v3.json'"));assert(source.includes("open(resolve(base,MARKER),'wx'"));assert(source.includes('--run --allow-paid --max-requests 3'));assert(source.includes('pilot-code-update-comparison-v3.json'));assert(source.includes('historical_file_changed'));
 assert(!/wrangler|api\.openai\.com|spawn\(|child_process|\/api\/usage/iu.test(source));
});
