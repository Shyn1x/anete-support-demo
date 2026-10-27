import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkExistingPilots,updatePilotCode} from '../scripts/update-pilot-code.mjs';
import {PILOT_IDS} from '../scripts/audit-pilot-buyers.mjs';
import {pilotCliEnvironment} from '../scripts/publish-pilots.mjs';
const account='a'.repeat(32),credentials={type:'oauth',token:'fake-local-token'};
const guard={name:'GUARD',type:'durable_object_namespace',class_name:'BudgetGuard',namespace_id:'same-existing-owner-namespace'};
const bindings=id=>[guard,...['DEMO_PASSWORD','SESSION_SECRET','OPENAI_API_KEY'].map(name=>({name,type:'secret_text'})),...Object.entries({TENANT_ID:id,NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true'}).map(([name,text])=>({name,type:'plain_text',text}))];
const fakeAPI=(mutate=()=>{})=>async(url,options)=>{
 assert(url.startsWith('https://api.cloudflare.com/client/v4/accounts/'+account));assert.equal(options.redirect,'error');assert.equal(options.method,undefined);assert.equal(options.headers.Authorization,'Bearer fake-local-token');
 let result=url.endsWith('/workers/subdomain')?{subdomain:'fshyn1x'}:url.includes('/anete-support-demo/settings')?{bindings:[guard]}:{bindings:structuredClone(bindings(url.match(/support-demo-([^/]+)/)[1]))};
 mutate(result,url);return Response.json({success:true,result});
};
test('code update verifies the same owner namespace and all five existing secrets without reading their values',async()=>{
 let count=0;assert.equal(await checkExistingPilots(account,credentials,async(...args)=>{count++;return fakeAPI()(...args);}),true);assert.equal(count,7);
});
for(const [name,change] of [
 ['different account',(r,u)=>{if(u.endsWith('/workers/subdomain'))r.subdomain='another-account';}],
 ['different guard',(r,u)=>{if(u.includes('/support-demo-'))r.bindings.find(b=>b.name==='GUARD').namespace_id='new-budget';}],
 ['budget override',(r,u)=>{if(u.includes('/support-demo-'))r.bindings.push({name:'TOTAL_BUDGET_MICRO_USD',type:'plain_text',text:'999999'});}],
 ['missing secret',(r,u)=>{if(u.includes('/support-demo-'))r.bindings=r.bindings.filter(b=>b.name!=='DEMO_PASSWORD');}],
 ['wrong tenant',(r,u)=>{if(u.includes('/support-demo-'))r.bindings.find(b=>b.name==='TENANT_ID').text='anete';}]
])test('code update refuses '+name+' before any mutation',async()=>{
 await assert.rejects(()=>checkExistingPilots(account,credentials,fakeAPI(change)));
});
test('code update dry-runs all five before deploying, preserves variables and never sends secrets or chat calls',async()=>{
 const calls=[],events=[];
 await updatePilotCode({run:async(args,options)=>{calls.push(args);assert.equal(options.input,undefined);},save:async(id,step)=>events.push([id,step])});
 assert.equal(calls.length,10);assert(calls.slice(0,5).every(a=>a.includes('--dry-run')));assert(calls.slice(5).every(a=>!a.includes('--dry-run')&&a.includes('--keep-vars')));
 for(const id of PILOT_IDS){assert(calls[5+PILOT_IDS.indexOf(id)].includes('deploy/pilots/'+id+'.json'));assert.deepEqual(events.filter(e=>e[0]===id),[[id,'starting'],[id,'deployed']]);}
 const text=JSON.stringify(calls);assert(!/secret|anete-support-demo|BUDGET|migration|\/api\/chat|run-pilot-live/iu.test(text));
});
test('a failed dry run publishes nothing and a failed deployment is never retried',async()=>{
 for(const failAt of [3,7]){
  const calls=[];await assert.rejects(()=>updatePilotCode({run:async args=>{calls.push(args);if(calls.length===failAt)throw Error('synthetic failure');},save:async()=>{}}));
  assert.equal(calls.length,failAt);if(failAt===3)assert(calls.every(a=>a.includes('--dry-run')));
 }
});
test('update entrypoints keep receipts, use a pinned clean folder and do not launch a paid run',async()=>{
 const js=await readFile(new URL('../scripts/update-pilot-code.mjs',import.meta.url),'utf8'),ps=await readFile(new URL('../scripts/start-pilot-code-update.ps1',import.meta.url),'utf8');
 assert(/^[\x00-\x7f]*$/u.test(ps));assert(ps.includes('/zipball/'));assert(ps.includes('npm.cmd test'));assert(ps.includes('npm.cmd run test:worker'));assert(ps.includes('--update-code-only'));
 assert(!/Read-Host|OPENAI_API_KEY|Remove-Item|--allow-paid|run-pilot-live/iu.test(ps));
 assert(!/\/api\/chat|secret.{0,4}bulk|unlink\(|rm\(/iu.test(js));assert(js.includes("open(receipt,'wx'"));
 const env=pilotCliEnvironment(true);assert.equal(env.WRANGLER_WRITE_LOGS,'false');assert.equal(env.WRANGLER_SEND_METRICS,'false');assert.equal(env.WRANGLER_LOG,'log');
});

test('v3 update preserves the v2 receipt and uses a separate nonfinancial audit receipt',async()=>{
 const js=await readFile(new URL('../scripts/update-pilot-code.mjs',import.meta.url),'utf8'),ps=await readFile(new URL('../scripts/start-pilot-code-update.ps1',import.meta.url),'utf8');
 assert(js.includes("UPDATE_RECEIPT='pilot-code-update-comparison-v3.json'"));assert(js.includes('priorUpdate.revision!==PREVIOUS_REVISION'));assert(js.includes("[PREVIOUS_REVISION,PILOT_BUYER_REVISION]"));
 assert(ps.includes('pilot-code-update-comparison-v3.json'));assert(ps.includes('Previous v2 update receipt missing'));
});
