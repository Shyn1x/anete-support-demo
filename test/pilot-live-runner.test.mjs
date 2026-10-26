import test from 'node:test';
import assert from 'node:assert/strict';
import {pilotLivePlan,pilotPreflight,compatiblePilotConfig,executePilotCases,assessPilotLive,validateZeroRequestResume,PILOT_STATE_DIRECTORY} from '../scripts/run-pilot-live.mjs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createWorker} from '../src/worker.js';
import {environment} from './helpers.mjs';
import {readFile} from 'node:fs/promises';
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
test('server budget/rate refusal stops the batch after one denied chat without retries',async()=>{
 const plan=await pilotLivePlan(),events=[];let calls=0;
 const rows=await executePilotCases({plan,cookies,wait:async()=>{},checkpoint:async(r,e)=>events.push(e),fetcher:async url=>{calls++;assert.ok(url.endsWith('/api/chat'));return Response.json({error:'budget_exhausted',reason:'total_budget'},{status:429});}});
 assert.equal(rows.length,1);assert.equal(calls,1);assert.equal(events.at(-1).reason,'total_budget');assert.equal(rows[0].state,'blocked');
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
 assert.equal(chats,50);assert.equal(usage,0);assert.equal(rows.length,50);assert.ok(failures.length>0);assert.ok(rows.every(r=>r.answer.validationReason==='incomplete'));assert.ok(!JSON.stringify(rows).includes('demo_session'));
});
test('HTTP denial never causes a paid retry',async()=>{
 let chats=0;const rows=await executePilotCases({plan:await pilotLivePlan(),cookies,wait:async()=>{},checkpoint:async()=>{},fetcher:async url=>url.endsWith('/api/usage')?Response.json(available):(chats++,Response.json({error:'budget_exhausted'},{status:429}))});
 assert.equal(chats,1);assert.equal(rows[0].state,'blocked');assert.equal(rows[0].assessment.pass,false);
});
test('generated product checks reject deterministic fallbacks and missing evidence',async()=>{
 const c=(await pilotLivePlan()).find(c=>c.kind==='product'),base={locale:c.locale,text:'Synthetic answer',cardIds:[],sources:[],mode:'catalog',providerUsed:false};
 const a=assessPilotLive(c,base,200);assert.equal(a.pass,false);assert.ok(a.issues.some(s=>s.startsWith('generated-answer-required')));assert.ok(a.issues.includes('missing-product-evidence'));
});
test('zero-request resume proves the same complete plan, rejects any pending/attempted work and leaves evidence unchanged',async()=>{
 const plan=await pilotLivePlan(),hash=s=>createHash('sha256').update(s).digest('hex');
 const marker={output:resolve(PILOT_STATE_DIRECTORY,'pilot-live-50-2026-10-26T19-59-16-318Z.json'),planSha256:hash(JSON.stringify(plan)),maximumRequests:50,maximumReservationUSD:0.50};
 const report={schema:'pilot-live-buyer-v1',plan,maximumRequests:50,maximumReservationUSD:0.50,rows:[],summary:{attempted:0,completed:0,autoAccepted:0,providerReported:0,ambiguous:0},events:[{stop:'server-budget-or-rate-unavailable'}]};
 const before=JSON.stringify({marker,report});assert.equal(validateZeroRequestResume(marker,report,plan),true);assert.equal(JSON.stringify({marker,report}),before);
 for(const change of [r=>r.rows.push({state:'pending'}),r=>r.rows.push({state:'complete'}),r=>r.summary.providerReported=1,r=>r.summary.attempted=1,r=>r.summary.ambiguous=1,r=>r.plan[0].message+=' changed',r=>r.events[0].stop='ambiguous-response',r=>r.maximumRequests=51]){const bad=structuredClone(report);change(bad);assert.throws(()=>validateZeroRequestResume(marker,bad,plan));}
 assert.throws(()=>validateZeroRequestResume({...marker,output:resolve(PILOT_STATE_DIRECTORY,'../outside.json')},report,plan));assert.throws(()=>validateZeroRequestResume({...marker,planSha256:'wrong'},report,plan));
});
test('actual pinned Worker rejects owner usage but the runner reaches chat and respects the real shared guard before any provider call',async()=>{
 let provider=0;const {env:owner,guard,storage}=environment({TOTAL_BUDGET_MICRO_USD:'10000'});let clock=Date.now();guard.now=()=>clock;
 storage.records.set('state',{total:10000,daily:0,day:new Date(clock).toISOString().slice(0,10),ips:{}});
 const servers=new Map(),sessions=new Map(),events=[];const workers=createWorker(async()=>{provider++;throw Error('No provider calls permitted');});
 for(const id of PILOT_IDS){const {env}=environment({TENANT_ID:id,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-runtime-password',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'fake-test-key'});env.GUARD=owner.GUARD;servers.set(id,env);
  const url=`https://support-demo-${id}.fshyn1x.workers.dev`,res=await workers.fetch(new Request(url+'/api/login',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({password:env.DEMO_PASSWORD})}),env);assert.equal(res.status,200);sessions.set(id,res.headers.get('Set-Cookie').split(';')[0]);
  assert.equal((await workers.fetch(new Request(url+'/api/usage',{headers:{Cookie:sessions.get(id)}}),env)).status,404);
 }
 const rows=await executePilotCases({plan:await pilotLivePlan(),cookies:sessions,wait:async()=>{clock+=8000;},checkpoint:async(r,e)=>{if(e)events.push(e);},fetcher:async(url,init)=>{
  assert.ok(url.endsWith('/api/chat'));const id=new URL(url).hostname.match(/^support-demo-([^.]+)/)[1];return workers.fetch(new Request(url,init),servers.get(id));
 }});
 assert.equal(rows.length,1);assert.equal(rows[0].answer.providerUsed,false);assert.equal(rows[0].answer.fallbackReason,'total_budget');assert.equal(events.at(-1).reason,'total_budget');assert.equal(provider,0);assert.equal(storage.records.get('state').total,10000);
});
test('continuation replaces only the exact old local runner and never republishes, deletes evidence or requests an API key',async()=>{
 const ps=await readFile(new URL('../scripts/continue-pilot-run.ps1',import.meta.url),'utf8');assert.ok(/^[\x00-\x7f]*$/.test(ps));assert.ok(ps.includes('7d4015bfc4df3915bebe5748df28883d9b982dd787c5526d82b5fb23af0f654b'));assert.ok(ps.includes('--check-zero-request-resume'));assert.ok(ps.includes('--resume-before-first-request'));assert.ok(ps.includes('.pilot-zero-request-resume-20261026.json'));assert.ok(ps.includes('runner-before-client-preflight-fix.mjs'));assert.ok(!/wrangler|publish-pilots\.mjs|npm |npm\.cmd|Read-Host|OPENAI_API_KEY|Remove-Item.*(?:json|lock|report)/iu.test(ps));
});
