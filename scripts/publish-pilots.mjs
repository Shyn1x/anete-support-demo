// Owner-run, explicitly authorised first publication of NEW five demos only.
// Existing six Workers, budget configuration and namespaces are never deployed.
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PILOT_IDS} from './audit-pilot-buyers.mjs';
import {PILOT_STATE_DIRECTORY,validatePilotPasswords,pilotPreflight} from './run-pilot-live.mjs';
import {buildPilotClients} from './build-pilot-clients.mjs';
export function checkedAccount(who,selected){
 if(who?.loggedIn!==true||!Array.isArray(who.accounts))throw Error('Cloudflare login required');
 const choices=who.accounts.filter(a=>/^[a-f0-9]{32}$/i.test(a.id));
 const account=selected?choices.find(a=>a.id===selected):choices.length===1?choices[0]:null;
 if(!account)throw Error('Account selection is ambiguous; nothing published');return account.id;
}
export function checkedPilotConfig(config,id){
 const binding=config?.durable_objects?.bindings;
 if(!PILOT_IDS.includes(id)||config.name!=='support-demo-'+id||config.main!=='../../src/client-worker.js'||config.assets?.directory!=='../../dist/pilots/'+id||config.assets?.binding!=='ASSETS'||config.assets?.run_worker_first!==true||config.vars?.TENANT_ID!==id||config.vars.NEXT_BATCH_ENABLED!=='true'||config.vars.AI_ENABLED!=='false'||!config.keep_vars||config.migrations||binding?.length!==1||binding[0].name!=='GUARD'||binding[0].class_name!=='BudgetGuard'||binding[0].script_name!=='anete-support-demo')throw Error('Unsafe pilot deployment configuration');
 if(Object.keys(config.vars).some(k=>/BUDGET|SECRET|PASSWORD|KEY|EXTRA|NAMESPACE/i.test(k)))throw Error('Forbidden budget or secret variable');return true;
}
export async function checkNewTargets(account,credentials,fetcher=fetch){
 if(!/^[a-f0-9]{32}$/i.test(account))throw Error('Invalid account identity');
 const auth=credentials.type==='api_key'&&credentials.key&&credentials.email?{'X-Auth-Key':credentials.key,'X-Auth-Email':credentials.email}:['oauth','api_token'].includes(credentials.type)&&credentials.token?{Authorization:'Bearer '+credentials.token}:null;
 if(!auth)throw Error('Unsupported Cloudflare credentials');
 const get=async path=>{const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+account+path,{headers:auth,redirect:'error',signal:AbortSignal.timeout(15000)});let data;try{data=await r.json();}catch{}return {status:r.status,ok:r.ok&&data?.success===true,data};};
 const subdomain=await get('/workers/subdomain');if(!subdomain.ok||subdomain.data.result?.subdomain!=='fshyn1x')throw Error('Unexpected workers.dev account; nothing published');
 const owner=await get('/workers/scripts/anete-support-demo/settings');
 if(!owner.ok||!owner.data.result?.bindings?.some(b=>b.name==='GUARD'&&b.type==='durable_object_namespace'&&b.class_name==='BudgetGuard'&&b.namespace_id))throw Error('Existing shared BudgetGuard was not verified');
 for(const id of PILOT_IDS){const r=await get('/workers/scripts/support-demo-'+id+'/settings');if(r.status!==404)throw Error('A pilot Worker already exists or access is uncertain; stop without changing it');}
}
function cli(args,{input,capture=false,extraEnv={}}={}){
 return new Promise((ok,fail)=>{let output='';const child=spawn(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),...args],{stdio:[input?'pipe':'inherit',capture?'pipe':'inherit',capture?'pipe':'inherit'],env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG:'error',...extraEnv}});
  if(capture){child.stdout.setEncoding('utf8');child.stdout.on('data',s=>{output+=s;if(output.length>1048576)child.kill();});child.stderr.resume();}
  child.once('error',()=>fail(Error('Wrangler could not start')));child.once('exit',code=>code===0?ok(output):fail(Error('Wrangler '+args[0]+' failed; no automatic retry')));if(input){child.stdin.on('error',()=>{});child.stdin.end(input);}
 });
}
export async function publishNewPilots({passwords,apiKey,extraEnv,save,run=cli,onShop=id=>console.log('Publishing NEW demo: '+id)}){
 validatePilotPasswords(passwords);if(typeof apiKey!=='string'||!apiKey.startsWith('sk-'))throw Error('Local API key missing');
 for(const client of passwords.clients){const config='deploy/pilots/'+client.id+'.json';onShop(client.id);await save(client.id,'starting-disabled');
  await run(['deploy','--config',config,'--var','AI_ENABLED:false'],{extraEnv});await save(client.id,'disabled-published');
  await run(['secret','bulk','--config',config],{input:JSON.stringify({DEMO_PASSWORD:client.password,SESSION_SECRET:randomBytes(48).toString('base64url'),OPENAI_API_KEY:apiKey}),extraEnv});await save(client.id,'secrets-configured');
  await run(['deploy','--config',config,'--var','AI_ENABLED:true'],{extraEnv});await save(client.id,'ai-enabled');
 }
}
async function main(){
 if(process.argv.slice(2).join(' ')!=='--publish-and-test')throw Error('Use --publish-and-test only for the approved five-shop batch');
 const apiKey=process.env.OPENAI_API_KEY;if(!apiKey||!apiKey.startsWith('sk-'))throw Error('Enter the existing OpenAI key locally first');
 await mkdir(PILOT_STATE_DIRECTORY,{recursive:true,mode:0o700});
 for(const name of ['publication.json','.pilot-live-50-20261026.json']){try{await access(resolve(PILOT_STATE_DIRECTORY,name));throw Error('Batch already started; preserve local state, do not repeat');}catch(e){if(e.code!=='ENOENT')throw e;}}
 let who;try{who=JSON.parse(await cli(['whoami','--json'],{capture:true}));}catch{console.log('Cloudflare login will open in YOUR normal browser.');await cli(['login']);who=JSON.parse(await cli(['whoami','--json'],{capture:true}));}
 const account=checkedAccount(who,process.env.CLOUDFLARE_ACCOUNT_ID),extraEnv={CLOUDFLARE_ACCOUNT_ID:account};
 let credentials;try{credentials=JSON.parse(await cli(['auth','token','--json'],{capture:true}));}catch{throw Error('Could not read local Wrangler authentication safely');}await checkNewTargets(account,credentials);
 await buildPilotClients();
 for(const id of PILOT_IDS){const path='deploy/pilots/'+id+'.json';checkedPilotConfig(JSON.parse(await readFile(path,'utf8')),id);await cli(['deploy','--dry-run','--config',path,'--outdir','worker-build/pilots/'+id],{extraEnv});}
 const state={schema:'pilot-publication-v1',createdAt:new Date().toISOString(),account,events:[]};
 const stateFile=resolve(PILOT_STATE_DIRECTORY,'publication.json');await writeFile(stateFile,JSON.stringify(state,null,2)+'\n',{flag:'wx',mode:0o600});
 const passwords={schema:'pilot-passwords-v1',clients:PILOT_IDS.map(id=>({id,url:`https://support-demo-${id}.fshyn1x.workers.dev`,password:randomBytes(24).toString('base64url')}))};validatePilotPasswords(passwords);
 await writeFile(resolve(PILOT_STATE_DIRECTORY,'demo-passwords.json'),JSON.stringify(passwords,null,2)+'\n',{flag:'wx',mode:0o600});
 const save=async(id,step)=>{state.events.push({id,step,at:new Date().toISOString()});await writeFile(stateFile,JSON.stringify(state,null,2)+'\n',{mode:0o600});};
 await publishNewPilots({passwords,apiKey,extraEnv,save});
 const preflight=await pilotPreflight();await writeFile(resolve(PILOT_STATE_DIRECTORY,'preflight.json'),JSON.stringify(preflight,null,2)+'\n',{flag:'wx'});if(!preflight.ready)throw Error('Publication not verified; no paid tests started. Keep local state');
 console.log('Five demos verified. Starting the approved 50-request run. Maximum internal reserve: $0.50.');
 console.log('Private demo passwords: '+resolve(PILOT_STATE_DIRECTORY,'demo-passwords.json'));
 await new Promise((ok,fail)=>{const child=spawn(process.execPath,['scripts/run-pilot-live.mjs','--run','--allow-paid','--max-requests','50'],{stdio:'inherit',env:{...process.env,LOMENTI_PILOT_AUTO_CREDENTIALS:'1'}});child.once('error',fail);child.once('exit',code=>code===0?ok():fail(Error('Live run stopped; preserve the report and marker')));});
 await save('all','live-run-finished');console.log('Reports: '+PILOT_STATE_DIRECTORY);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);console.error('Stop. Do not repeat the command or delete batch markers. No old Workers were deployed by this script.');process.exitCode=1;});
