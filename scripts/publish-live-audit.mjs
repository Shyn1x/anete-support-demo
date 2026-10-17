// Separate owner-operated action. Never invoked by the preparation script.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {gitBlobSha,runLocal} from './prepare-live-audit-update.mjs';
const shops=['rotallieta','bariba','hobbyset','apavi40plus','celotajs'];
const secretNames=['OPENAI_API_KEY','DEMO_PASSWORD','SESSION_SECRET'];
export function publicationConfig(config,file,root){
 if(!config||!config.keep_vars)throw Error('keep_vars must already be true: '+file);
 if(secretNames.some(k=>Object.hasOwn(config.vars||{},k)))throw Error('Plaintext secret in configuration. Move it to Worker secrets before publishing.');
 const owner=file==='wrangler.jsonc';const tenant=owner?null:shops.find(s=>file==='deploy/clients/'+s+'.json');
 if(!owner&&!tenant||config.name!==(owner?'anete-support-demo':'support-demo-'+tenant))throw Error('Unexpected Worker identity: '+file);
 const guard=config.durable_objects?.bindings?.find(b=>b.name==='GUARD');
 if(guard?.class_name!=='BudgetGuard'||(owner?!!guard.script_name:guard.script_name!=='anete-support-demo'))throw Error('Unexpected budget binding: '+file);
 if(config.main!==(owner?'src/worker.js':'../../src/client-worker.js')||config.assets?.directory!==(owner?'./public':'../../dist/clients/'+tenant))throw Error('Unexpected source/assets paths: '+file);
 if(!owner&&config.vars?.TENANT_ID!==tenant)throw Error('Unexpected tenant binding: '+file);
 if(owner&&JSON.stringify(config.migrations)!==JSON.stringify([{tag:'v1',new_sqlite_classes:['BudgetGuard']}]))throw Error('Unexpected Durable Object migrations. Stop for review.');
 const copy=structuredClone(config),base=dirname(join(root,file));
 copy.main=resolve(base,config.main);copy.assets={...config.assets,directory:resolve(base,config.assets.directory)};
 // Existing dashboard variables and secrets stay in place; do not redeclare budgets or flags.
 copy.vars=owner?{}:{TENANT_ID:tenant};copy.keep_vars=true;return copy;
}
export function assertExistingVersions(text){
 const versions=JSON.parse(text);if(!Array.isArray(versions)||!versions.length||!versions.every(v=>typeof v.id==='string'&&v.id))throw Error('No existing Worker versions found. Stop: do not create a new Worker or namespace.');
}
async function verifyExistingWorker(cli,config,root){
 const text=await new Promise((ok,fail)=>{let output='';const child=spawn(process.execPath,[cli,'versions','list','--json','--config',config],{cwd:root,stdio:['inherit','pipe','inherit'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});child.stdout.setEncoding('utf8');child.stdout.on('data',part=>{output+=part;if(output.length>1048576)child.kill();});child.once('error',fail);child.once('exit',code=>code===0?ok(output):fail(Error('Existing Worker check failed; no deployment performed.')));});
 assertExistingVersions(text);
}
export function publicationFiles(args){
 if(![3,4].includes(args.length)||args[0]!=='--receipt'||!args[1]||args[2]!=='--confirm-publish'||args.length===4&&args[3]!=='--owner-only')throw Error('Not deployed. After separate publication approval: --receipt PATH --confirm-publish [--owner-only]');
 return args.length===4?['wrangler.jsonc']:['wrangler.jsonc',...shops.map(s=>'deploy/clients/'+s+'.json')];
}
async function main(){
 const args=process.argv.slice(2),files=publicationFiles(args);
 const root=process.cwd(),receipt=JSON.parse(await readFile(args[1],'utf8'));
 for(const f of receipt.files)if(gitBlobSha(await readFile(join(root,f.path)))!==f.sha)throw Error('Source changed since validation: '+f.path);
 const area=join(root,'.audit-publish',new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(area,{recursive:true});
 await runLocal(process.execPath,['scripts/build-clients.mjs'],root);
 const configs=[];
 for(let i=0;i<files.length;i++){
  const config=publicationConfig(JSON.parse(await readFile(files[i],'utf8')),files[i],root),target=join(area,String(i)+'.json');
  await writeFile(target,JSON.stringify(config,null,2)+'\n',{flag:'wx'});configs.push(target);
 }
 const cli=join(root,'node_modules/wrangler/bin/wrangler.js');
 // All six dry runs must pass before the first live deployment.
 for(let i=0;i<configs.length;i++)await runLocal(process.execPath,[cli,'deploy','--dry-run','--config',configs[i],'--outdir',join(area,'dry-'+i)],root);
 // Fail rather than creating a fresh Worker/namespace in an unintended account.
 for(const config of configs)await verifyExistingWorker(cli,config,root);
 for(const config of configs)await runLocal(process.execPath,[cli,'deploy','--strict','--keep-vars','--config',config],root);
 console.log((files.length===1?'Owner Worker updated. Client Workers were not deployed.':'Six Workers updated.')+' No passwords, secrets, budget variables or counters were reset. No OpenAI test call was made.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
