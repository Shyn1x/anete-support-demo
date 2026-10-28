// Update the already-published five pilots only. No secret rotation, owner
// deployment, budget changes, paid chat requests or automatic retries.
import {readFile,writeFile,open} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {checkedAccount,checkedPilotConfig,cli} from './publish-pilots.mjs';
import {buildPilotClients} from './build-pilot-clients.mjs';
import {PILOT_IDS} from './audit-pilot-buyers.mjs';
import {PILOT_STATE_DIRECTORY} from './run-pilot-live.mjs';
import {PILOT_BUYER_REVISION} from '../src/pilot-routing.js';
export const UPDATE_RECEIPT='pilot-code-update-scoped-v5.json';
const PREVIOUS_REVISION='pilot-buyer-v4';
export async function checkExistingPilots(account,credentials,fetcher=fetch){
 if(!/^[a-f0-9]{32}$/i.test(account))throw Error('Invalid account');
 const auth=credentials.type==='api_key'&&credentials.key&&credentials.email?{'X-Auth-Key':credentials.key,'X-Auth-Email':credentials.email}:['oauth','api_token'].includes(credentials.type)&&credentials.token?{Authorization:'Bearer '+credentials.token}:null;
 if(!auth)throw Error('Unsupported local authentication');
 const get=async path=>{const r=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+account+path,{headers:auth,redirect:'error',signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok||d.success!==true)throw Error('Cannot verify existing deployment');return d.result;};
 if((await get('/workers/subdomain')).subdomain!=='fshyn1x')throw Error('Unexpected account subdomain');
 const owner=await get('/workers/scripts/anete-support-demo/settings');
 const namespace=owner.bindings?.find(b=>b.name==='GUARD'&&b.type==='durable_object_namespace'&&b.class_name==='BudgetGuard')?.namespace_id;
 if(!namespace)throw Error('Existing owner guard missing');
 for(const id of PILOT_IDS){
  const settings=await get('/workers/scripts/support-demo-'+id+'/settings'),bindings=settings.bindings||[];
  const guard=bindings.find(b=>b.name==='GUARD');
  if(guard?.type!=='durable_object_namespace'||guard.namespace_id!==namespace||guard.class_name!=='BudgetGuard')throw Error('Shared budget identity differs');
  if(bindings.some(b=>/BUDGET|EXTRA|NAMESPACE/i.test(b.name||'')))throw Error('Unexpected financial override; nothing changed');
  for(const name of ['DEMO_PASSWORD','SESSION_SECRET','OPENAI_API_KEY'])if(!bindings.some(b=>b.name===name&&b.type==='secret_text'))throw Error('Existing secret binding missing');
  for(const [name,value] of Object.entries({TENANT_ID:id,NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true'}))if(!bindings.some(b=>b.name===name&&b.type==='plain_text'&&b.text===value))throw Error('Existing pilot configuration differs');
 }
 return true;
}
export async function updatePilotCode({run=cli,save,extraEnv={}}){
 // Validate and bundle ALL five before the first deployment mutation.
 for(const id of PILOT_IDS){const config='deploy/pilots/'+id+'.json';checkedPilotConfig(JSON.parse(await readFile(config,'utf8')),id);await run(['deploy','--dry-run','--config',config,'--var','AI_ENABLED:true','--outdir','worker-build/pilot-update/'+id],{extraEnv});}
 for(const id of PILOT_IDS){
  await save(id,'starting');
  await run(['deploy','--config','deploy/pilots/'+id+'.json','--keep-vars','--var','AI_ENABLED:true'],{extraEnv});
  await save(id,'deployed');
 }
}
async function publicCheck(id,after){
 const r=await fetch('https://support-demo-'+id+'.fshyn1x.workers.dev/api/config',{redirect:'error',signal:AbortSignal.timeout(15000)}),c=await r.json();
 if(!r.ok||c.tenant!==id||c.ready!==true||c.locked!==true||c.mode!=='ai'||c.perCallMicroUSD!==10000||c.conversationRevision!=='context-v2'||!c.catalogEnabled||(after?c.pilotBuyerRevision!==PILOT_BUYER_REVISION:![PREVIOUS_REVISION,PILOT_BUYER_REVISION].includes(c.pilotBuyerRevision)))throw Error('Public pilot configuration not verified');
 return {id,revision:c.pilotBuyerRevision};
}
async function main(){
 if(process.argv.slice(2).join(' ')!=='--update-code-only')throw Error('Explicit code-only update required');
 const publication=JSON.parse(await readFile(resolve(PILOT_STATE_DIRECTORY,'publication.json'),'utf8'));
 for(const id of PILOT_IDS)if(!publication.events?.some(e=>e.id===id&&e.step==='ai-enabled'))throw Error('Original publication receipt missing');
 const priorUpdate=JSON.parse(await readFile(resolve(PILOT_STATE_DIRECTORY,'pilot-code-update-evidence-v4.json'),'utf8'));
 if(priorUpdate.schema!=='pilot-code-update-v1'||priorUpdate.revision!==PREVIOUS_REVISION||PILOT_IDS.some(id=>!priorUpdate.events?.some(e=>e.id===id&&e.step==='public-config-verified')))throw Error('Previous v4 update not confirmed');
 const receipt=resolve(PILOT_STATE_DIRECTORY,UPDATE_RECEIPT);
 try{await readFile(receipt);throw Error('Update already started. Keep receipt and inspect; do not retry');}catch(e){if(e.code!=='ENOENT')throw e;}
 let who;try{who=JSON.parse(await cli(['whoami','--json'],{capture:true}));checkedAccount(who,process.env.CLOUDFLARE_ACCOUNT_ID);}catch{await cli(['login']);who=JSON.parse(await cli(['whoami','--json'],{capture:true}));}
 const account=checkedAccount(who,process.env.CLOUDFLARE_ACCOUNT_ID);if(publication.account!==account)throw Error('Account differs from original publication');
 const credentials=JSON.parse(await cli(['auth','token','--json'],{capture:true}));
 await checkExistingPilots(account,credentials);
 for(const id of PILOT_IDS)await publicCheck(id,false);
 await buildPilotClients();
 const state={schema:'pilot-code-update-v1',revision:PILOT_BUYER_REVISION,createdAt:new Date().toISOString(),events:[],paidCalls:0};
 const handle=await open(receipt,'wx',0o600);await handle.writeFile(JSON.stringify(state,null,2)+'\n');await handle.close();
 const save=async(id,step)=>{state.events.push({id,step,at:new Date().toISOString()});await writeFile(receipt,JSON.stringify(state,null,2)+'\n');};
 await updatePilotCode({save,extraEnv:{CLOUDFLARE_ACCOUNT_ID:account}});
 for(const id of PILOT_IDS){const config=await publicCheck(id,true);console.log(JSON.stringify(config));await save(id,'public-config-verified');}
 console.log('Five pilots updated. Paid requests: 0. Existing reports and passwords preserved.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('Code update stopped. Preserve receipts; no automatic retry. No credentials were printed.');process.exitCode=1;});
