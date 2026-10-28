import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {runControl,validatePrior,controlPlan,executeControl,preflight,loginSessions,assessControl,CONTROL_PLAN_SHA,MAX_REQUESTS,MAX_RESERVATION_MICRO_USD,IDS} from '../scripts/run-pilot-comparison-2.mjs';
const plan=JSON.parse(await readFile(new URL('./fixtures/pilot-comparison-two-plan-20261028.json',import.meta.url),'utf8'));
const previous=JSON.parse(await readFile(new URL('./fixtures/pilot-comparison-result-v3-20261028.json',import.meta.url),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const cookies=new Map(IDS.map(id=>[id,'demo_session=synthetic-private-cookie']));
const cfg=id=>({tenant:id,ready:true,locked:true,mode:'ai',conversationRevision:'context-v2',conversationEnabled:true,catalogEnabled:true,catalogRevision:'buyer-v8',pilotBuyerRevision:'pilot-buyer-v4',perCallMicroUSD:10000});
const answer=c=>({locale:'en',text:'Synthetic comparison.',cardIds:[],sources:c.products.map(url=>({url})),handoff:false,mode:'catalog',providerUsed:true,conversational:true,productRead:true});
test('two comparison control is an exact subset with original provenance and an independent $0.02 cap',()=>{
 assert.equal(MAX_REQUESTS,2);assert.equal(MAX_RESERVATION_MICRO_USD,20000);assert.equal(hash(JSON.stringify(plan)),CONTROL_PLAN_SHA);
 assert.equal(hash(JSON.stringify(controlPlan(previous))),CONTROL_PLAN_SHA);
 assert.deepEqual(plan.map(c=>c.tenant),['dzijas','jig']);assert(plan.every(c=>c.kind==='comparison'&&c.products.length===2&&c.generated&&c.priorCaseId.endsWith('-comparison-v3')&&c.originalCaseId.endsWith('-live-05')));
});
test('two GET checks require v4, locked pilots and the existing per-call reserve',async()=>{
 let calls=0;await preflight(async url=>{calls++;assert(url.endsWith('/api/config'));return Response.json(cfg(url.match(/support-demo-([^.]+)/)[1]));});assert.equal(calls,2);
 for(const change of [{pilotBuyerRevision:'pilot-buyer-v3'},{perCallMicroUSD:5000},{locked:false}])await assert.rejects(()=>preflight(async url=>Response.json({...cfg(url.match(/support-demo-([^.]+)/)[1]),...change})));
});
test('the full original private credentials file is validated but only two target sessions are opened',async()=>{
 const file={schema:'pilot-passwords-v1',clients:['dzijas','jig','musiclab','etextile','zummers'].map(id=>({id,url:'https://support-demo-'+id+'.fshyn1x.workers.dev',password:'synthetic-password-'+id+'-long-enough'}))};
 const calls=[];const sessions=await loginSessions(file,async(url,options)=>{calls.push(url);assert.equal(options.method,'POST');return new Response('{}',{headers:{'set-cookie':'demo_session=synthetic; HttpOnly'}});});
 assert.equal(sessions.size,2);assert.equal(calls.length,2);assert(calls.every(u=>!u.includes('musiclab')&&!u.includes('etextile')&&!u.includes('zummers')));
 const bad=structuredClone(file);bad.clients[4].password=bad.clients[0].password;await assert.rejects(()=>loginSessions(bad,async()=>{throw Error('must not call');}));
});
test('at most two uniquely identified POSTs, checkpointed before sending, with response allowlist and no cookies in reports',async()=>{
 let calls=0;const snapshots=[];const rows=await executeControl({plan,cookies,checkpoint:async r=>snapshots.push(structuredClone(r)),wait:async ms=>assert.equal(ms,7000),fetcher:async(url,options)=>{
  const c=plan[calls++];assert(url.endsWith('/api/chat'));assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).tenant,c.tenant);assert.equal(snapshots.at(-1).at(-1).state,'pending');return Response.json({...answer(c),cookie:'MUST-NOT-BE-SAVED'});
 }});assert.equal(calls,2);assert(rows.every(r=>r.assessment.pass));assert(!JSON.stringify(rows).includes('synthetic-private-cookie'));assert(!JSON.stringify(rows).includes('MUST-NOT-BE-SAVED'));
});
for(const kind of ['network','json','budget','http'])test('two-case '+kind+' stop is never retried',async()=>{
 let calls=0;const events=[];const rows=await executeControl({plan,cookies,checkpoint:async(r,e)=>{if(e)events.push(e);},wait:async()=>{},fetcher:async()=>{
  calls++;if(kind==='network')throw Error('synthetic loss');if(kind==='json')return new Response('bad json');if(kind==='http')return Response.json({error:'budget_exhausted'},{status:429});return Response.json({...answer(plan[0]),providerUsed:false,conversational:false,fallbackReason:'total_budget'});
 }});assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(events.length,1);assert.notEqual(rows[0].assessment?.pass,true);
});
test('mutated/expanded plans never reach a paid request and fallback remains REVIEW',async()=>{
 for(const bad of [[...plan,plan[0]],plan.slice(1),plan.map((c,i)=>i?c:{...c,message:'changed'})])await assert.rejects(()=>executeControl({plan:bad,cookies,checkpoint:async()=>{},fetcher:async()=>{assert.fail('must not send');}}));
 assert.equal(assessControl(plan[0],{...answer(plan[0]),fallbackReason:'answer_validation',validationReason:'catalog_quantity_binding'},200).pass,false);
});
test('past 15-run tool stays byte-identical; new entrypoint has a fixed receipt, explicit two-request arguments, v4 proof and historical hash checks',async()=>{
 const old=await readFile(new URL('../scripts/run-pilot-control-15.mjs',import.meta.url)),source=await readFile(new URL('../scripts/run-pilot-comparison-2.mjs',import.meta.url),'utf8');
 assert.equal(hash(old),'aac1af8ef220b4879d12845cc3674b564cf5809cb678488e9b3ef60ee0b67341');
 assert.equal(hash(await readFile(new URL('../scripts/run-pilot-comparison-3.mjs',import.meta.url))),'c27f0573598a443309107ab99393f0fa721c895675b42ab1ee349b8493b88218');
 assert(source.includes("MARKER='.pilot-comparison-2-v4.json'"));assert(source.includes("open(resolve(base,MARKER),'wx'"));assert(source.includes('--run --allow-paid --max-requests 2'));assert(source.includes('pilot-code-update-evidence-v4.json'));assert(source.includes('historical_file_changed'));
 assert(!/wrangler|api\.openai\.com|spawn\(|child_process|\/api\/usage/iu.test(source));
});
test('the exact prior report hash is verified and prior automated acceptance is not manual acceptance',async()=>{
 const bytes=await readFile(new URL('./fixtures/pilot-comparison-result-v3-20261028.json',import.meta.url));
 assert.equal(validatePrior(bytes).summary.autoAccepted,2);
 assert.throws(()=>validatePrior(Buffer.concat([bytes,Buffer.from(' ')])),/prior_report_hash/u);
 const c=plan[1],a={...answer(c),text:"Both rods use graphite, ensuring a high-quality blank material."};
 assert(assessControl(c,a,200).issues.includes('quality-assurance-needs-review'));
});
const passwords={schema:'pilot-passwords-v1',clients:['dzijas','jig','musiclab','etextile','zummers'].map(id=>({id,url:'https://support-demo-'+id+'.fshyn1x.workers.dev',password:'synthetic-password-'+id+'-long-enough'}))};
const oldNames=['pilot-control-15-2026-10-27T20-19-23-090Z.json','pilot-live-50-2026-10-27T17-22-29-407Z.json','.pilot-live-50-20261026.json','.pilot-zero-request-resume-20261026.json','.pilot-control-15-v2.json','.pilot-comparison-3-v3.json','pilot-code-update-comparison-v3.json'];
async function localState(){
 const base=await mkdtemp(join(tmpdir(),'pilot-two-offline-'));
 await writeFile(join(base,'pilot-comparison-3-2026-10-28T07-39-20-177Z.json'),await readFile(new URL('./fixtures/pilot-comparison-result-v3-20261028.json',import.meta.url)));
 for(const name of oldNames)await writeFile(join(base,name),'synthetic historical bytes for '+name);
 await writeFile(join(base,'pilot-code-update-evidence-v4.json'),JSON.stringify({schema:'pilot-code-update-v1',revision:'pilot-buyer-v4',events:passwords.clients.map(c=>({id:c.id,step:'public-config-verified'}))}));
 await writeFile(join(base,'demo-passwords.json'),JSON.stringify(passwords));
 const hashes=Object.fromEntries(await Promise.all((await readdir(base)).map(async name=>[name,hash(await readFile(join(base,name)))])));
 return {base,async unchanged(){for(const [name,old]of Object.entries(hashes))assert.equal(hash(await readFile(join(base,name))),old,name);}};
}
for(const mode of ['success','budget','network'])test('offline file lifecycle '+mode+': prior bytes preserved, separate report and no paid rerun',async()=>{
 const {base,unchanged}=await localState();let count=0,chat=0;
 const fetcher=async(url,options)=>{
  count++;if(url.endsWith('/api/config'))return Response.json(cfg(url.match(/support-demo-([^.]+)/)[1]));
  if(url.endsWith('/api/login'))return new Response('{}',{headers:{'set-cookie':'demo_session=synthetic; HttpOnly'}});
  assert(url.endsWith('/api/chat'));const c=plan[chat++];
  assert.equal(JSON.parse(options.body).tenant,c.tenant);
  if(mode==='network')throw Error('synthetic lost reply');
  return Response.json(mode==='budget'?{...answer(c),providerUsed:false,conversational:false,fallbackReason:'total_budget'}:answer(c));
 };
 try{
  const r=await runControl({base,args:['--run','--allow-paid','--max-requests','2'],fetcher,wait:async()=>{},log:()=>{}});
  assert.equal(chat,mode==='success'?2:1);assert.equal(r.summary.attempted,chat);assert.equal(r.maximumReservationMicroUSD,20000);
  if(mode==='success')assert.equal(r.summary.completed,2);else assert.notEqual(r.summary.autoAccepted,2);
  await unchanged();assert(!(await readdir(base)).includes('.live-50.lock'));
  const reports=(await readdir(base)).filter(n=>/^pilot-comparison-2-.*\.json$/u.test(n));assert.equal(reports.length,1);
  const text=await readFile(join(base,reports[0]),'utf8');assert(!text.includes('synthetic-password'));assert(!text.includes('demo_session'));
  const before=count;await assert.rejects(()=>runControl({base,args:['--run','--allow-paid','--max-requests','2'],fetcher,wait:async()=>{},log:()=>{}}),{code:'EEXIST'});assert.equal(count,before);await unchanged();
 }finally{await rm(base,{recursive:true,force:true});}
});
test('no arguments are a free local plan and an existing lock is never removed',async()=>{
 const {base,unchanged}=await localState();let count=0;
 const fetcher=async()=>{count++;assert.fail('no network allowed');};
 try{
  await runControl({base,fetcher,log:()=>{}});assert.equal(count,0);assert.equal((await readdir(base)).some(n=>n.startsWith('pilot-comparison-2-')),false);
  await writeFile(join(base,'.live-50.lock'),'another active process');
  await assert.rejects(()=>runControl({base,args:['--run','--allow-paid','--max-requests','2'],fetcher,log:()=>{}}),{code:'EEXIST'});
  assert.equal(await readFile(join(base,'.live-50.lock'),'utf8'),'another active process');assert.equal(count,0);await unchanged();
 }finally{await rm(base,{recursive:true,force:true});}
});
