import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {checkedAccount,checkedPilotConfig,checkNewTargets,publishNewPilots} from '../scripts/publish-pilots.mjs';
import {PILOT_STATE_DIRECTORY,validatePilotPasswords} from '../scripts/run-pilot-live.mjs';
import {PILOT_IDS} from '../scripts/audit-pilot-buyers.mjs';
const account='a'.repeat(32),credentials={type:'oauth',token:'synthetic-test-token'};
const localPasswords=()=>({schema:'pilot-passwords-v1',clients:PILOT_IDS.map(id=>({id,url:`https://support-demo-${id}.fshyn1x.workers.dev`,password:'synthetic-private-password-'+id}))});
const response=(result,status=200)=>Response.json({success:status===200,result},{status});
function fixture(changes={}){const calls=[];return {calls,fetcher:async(url,options)=>{
 assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer synthetic-test-token');assert.ok(url.startsWith('https://api.cloudflare.com/client/v4/accounts/'+account+'/'));assert.equal(options.method,undefined);calls.push(url);
 if(url.endsWith('/workers/subdomain'))return response({subdomain:changes.subdomain??'fshyn1x'});
 if(url.endsWith('/workers/scripts/anete-support-demo/settings'))return response({bindings:changes.bindings??[{name:'GUARD',type:'durable_object_namespace',class_name:'BudgetGuard',namespace_id:'synthetic-existing-namespace'}]});
 assert.ok(PILOT_IDS.some(id=>url.endsWith('/workers/scripts/support-demo-'+id+'/settings')));return response(null,changes.targetStatus??404);
 }};}
test('first publication validates the correct account, existing owner guard and five absent targets using GET only',async()=>{
 const f=fixture();await checkNewTargets(account,credentials,f.fetcher);assert.equal(f.calls.length,7);
});
test('wrong account, absent owner binding and existing or inaccessible targets stop before publication',async()=>{
 for(const change of [{subdomain:'somebody-else'},{bindings:[]},{bindings:[{name:'GUARD',type:'durable_object_namespace',class_name:'Other',namespace_id:'different'}]},{targetStatus:200},{targetStatus:403},{targetStatus:500}]){const f=fixture(change);await assert.rejects(()=>checkNewTargets(account,credentials,f.fetcher));assert.ok(f.calls.length<=3);}
 let calls=0;await assert.rejects(()=>checkNewTargets('../wrong',credentials,async()=>{calls++;}));await assert.rejects(()=>checkNewTargets(account,{type:'api_key'},async()=>{calls++;}));assert.equal(calls,0);
});
test('account selection refuses an ambiguous membership instead of guessing',()=>{
 const first={id:account},second={id:'b'.repeat(32)};assert.equal(checkedAccount({loggedIn:true,accounts:[first]}),account);assert.throws(()=>checkedAccount({loggedIn:true,accounts:[first,second]}));assert.equal(checkedAccount({loggedIn:true,accounts:[first,second]},second.id),second.id);assert.throws(()=>checkedAccount({loggedIn:false,accounts:[first]}));
});
test('only pinned new-shop configs with the existing owner BudgetGuard are accepted',async()=>{
 for(const id of PILOT_IDS){const c=JSON.parse(await readFile(new URL('../deploy/pilots/'+id+'.json',import.meta.url),'utf8'));assert.equal(checkedPilotConfig(c,id),true);
  for(const change of [{name:'anete-support-demo'},{migrations:[]},{main:'../../src/worker.js'},{vars:{...c.vars,AI_ENABLED:'true'}},{vars:{...c.vars,TOTAL_BUDGET_MICRO_USD:'9000000'}},{vars:{...c.vars,OPENAI_API_KEY:'synthetic'}},{durable_objects:{bindings:[{name:'GUARD',class_name:'BudgetGuard',script_name:'new-budget'}]}}])assert.throws(()=>checkedPilotConfig({...c,...change},id));
 }assert.throws(()=>checkedPilotConfig({},'anete'));
});
test('private passwords differ, target only fixed demo origins and use a persistent home state across ZIP copies',()=>{
 const p={schema:'pilot-passwords-v1',clients:PILOT_IDS.map(id=>({id,url:`https://support-demo-${id}.fshyn1x.workers.dev`,password:'synthetic-private-password-'+id}))};assert.equal(validatePilotPasswords(p).size,5);
 for(const change of [x=>x.clients.pop(),x=>x.clients[0].url='https://foreign.example',x=>x.clients[0].id='anete',x=>x.clients[0].password=x.clients[1].password,x=>x.clients[0].password='short']){const bad=structuredClone(p);change(bad);assert.throws(()=>validatePilotPasswords(bad));}
 assert.equal(PILOT_STATE_DIRECTORY,resolve(homedir(),'Lomenti-private','pilot-batch-20261026'));
});
test('Windows bootstrap is ASCII-only, uses a pinned SHA/new folder, guards prior runs and hides the API key',async()=>{
 const ps=await readFile(new URL('../scripts/start-pilots.ps1',import.meta.url),'utf8');assert.ok(/^[\x00-\x7f]*$/.test(ps));assert.ok(ps.includes("ValidatePattern('^[a-f0-9]{40}$')"));assert.ok(ps.includes('Read-Host \'Existing OpenAI API key\' -AsSecureString'));assert.ok(ps.includes('ZeroFreeBSTR'));assert.ok(ps.includes('npm.cmd ci'));assert.ok(ps.includes('npm.cmd run test:worker'));assert.ok(ps.includes('.pilot-live-50-20261026.json'));assert.ok(!/Set-ExecutionPolicy|Invoke-Expression|\biex\b|Remove-Item.*reports/iu.test(ps));
});
test('publication orders fail-closed creation, stdin-only secrets and activation for exactly the five approved Workers',async()=>{
 const commands=[],steps=[],sessions=[];
 await publishNewPilots({passwords:localPasswords(),apiKey:'sk-synthetic-unit-test',extraEnv:{CLOUDFLARE_ACCOUNT_ID:account},onShop:()=>{},save:async(id,step)=>steps.push({id,step}),run:async(args,options)=>commands.push({args,options})});
 assert.equal(commands.length,15);assert.equal(steps.length,20);
 for(let i=0;i<5;i++){
  const trio=commands.slice(i*3,i*3+3),config='deploy/pilots/'+PILOT_IDS[i]+'.json';assert.deepEqual(trio[0].args,['deploy','--config',config,'--var','AI_ENABLED:false']);assert.deepEqual(trio[1].args,['secret','bulk','--config',config]);assert.deepEqual(trio[2].args,['deploy','--config',config,'--var','AI_ENABLED:true']);
  const values=JSON.parse(trio[1].options.input);assert.equal(values.OPENAI_API_KEY,'sk-synthetic-unit-test');assert.equal(values.DEMO_PASSWORD,localPasswords().clients[i].password);assert.ok(values.SESSION_SECRET.length>=32);sessions.push(values.SESSION_SECRET);
 }
 assert.equal(new Set(sessions).size,5);assert.ok(!JSON.stringify(commands.map(c=>c.args)).includes('synthetic'));assert.ok(commands.every(c=>!c.args.includes('wrangler.jsonc')&&!c.args.some(a=>a.includes('deploy/clients'))));
});
test('failed secret upload leaves the current demo disabled and stops without a retry or later publication',async()=>{
 const commands=[],steps=[];
 await assert.rejects(()=>publishNewPilots({passwords:localPasswords(),apiKey:'sk-synthetic-unit-test',onShop:()=>{},save:async(id,step)=>steps.push({id,step}),run:async args=>{commands.push(args);if(args[0]==='secret')throw Error('synthetic failure');}}));
 assert.equal(commands.length,2);assert.ok(!commands.some(c=>c.includes('AI_ENABLED:true')));assert.equal(steps.at(-1).step,'disabled-published');assert.ok(steps.every(s=>s.id===PILOT_IDS[0]));
});
