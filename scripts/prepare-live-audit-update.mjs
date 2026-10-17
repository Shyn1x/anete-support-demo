// Byte-preserving ZIP-copy updater. NO deployment, provider calls or secret operations.
import {access,readFile,writeFile,mkdir,copyFile,rename,rm,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const repo='Shyn1x/anete-support-demo';
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
export function gitBlobSha(bytes){return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');}
export function allowedPath(path){return typeof path==='string'&&!path.split('/').some(p=>p==='..'||p==='.'||!p)&&!path.includes('\\')&&/^(?:(?:src|public|scripts|test|test-runtime|docs|deploy\/clients)\/[^\0]+\.(?:js|mjs|json|html|css|svg|md|txt)|package(?:-lock)?\.json|wrangler\.jsonc)$/.test(path);}
export function installPath(path){return allowedPath(path)&&!path.startsWith('deploy/')&&path!=='wrangler.jsonc'&&path!=='package.json'&&path!=='package-lock.json';}
async function download(url,fetcher=fetch){
 const response=await fetcher(url,{headers:{'User-Agent':'support-demo-safe-updater','Accept':'application/vnd.github+json'},signal:AbortSignal.timeout(30000),redirect:'error'});
 if(!response.ok)throw Error('Download failed: HTTP '+response.status);return Buffer.from(await response.arrayBuffer());
}
export async function releaseFiles(release,fetcher=fetch){
 if(!/^[a-f0-9]{40}$/.test(release||''))throw Error('Use an immutable 40-character release SHA.');
 const commit=JSON.parse(await download('https://api.github.com/repos/'+repo+'/git/commits/'+release,fetcher));
 if(commit.sha!==release||!/^[a-f0-9]{40}$/.test(commit.tree?.sha||''))throw Error('Commit identity mismatch.');
 const tree=JSON.parse(await download('https://api.github.com/repos/'+repo+'/git/trees/'+commit.tree.sha+'?recursive=1',fetcher));
 if(tree.sha!==commit.tree.sha||tree.truncated||!Array.isArray(tree.tree))throw Error('Incomplete release tree.');
 const entries=tree.tree.filter(e=>e.type==='blob'&&e.mode==='100644'&&allowedPath(e.path));
 for(const required of ['src/worker.js','src/core.js','src/conversation.js','scripts/run-live-50.mjs','scripts/live-50-audit.mjs','scripts/publish-live-audit.mjs','package.json','package-lock.json','wrangler.jsonc'])if(!entries.some(e=>e.path===required))throw Error('Release is incomplete: '+required);
 let next=0;const files=[];
 await Promise.all(Array.from({length:6},async()=>{while(next<entries.length){const entry=entries[next++];const bytes=await download('https://raw.githubusercontent.com/'+repo+'/'+release+'/'+entry.path,fetcher);if(gitBlobSha(bytes)!==entry.sha)throw Error('Byte integrity mismatch: '+entry.path);files.push({path:entry.path,sha:entry.sha,bytes});}}));
 return {release,treeSha:tree.sha,files:files.sort((a,b)=>a.path.localeCompare(b.path))};
}
export async function reportHashes(root){
 const reports=join(root,'reports'),out={};
 async function walk(dir,prefix=''){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const name=prefix+entry.name;if(entry.isDirectory())await walk(join(dir,entry.name),name+'/');else if(entry.isFile())out[name]=hash(await readFile(join(dir,entry.name)));}}
 try{await walk(reports);}catch(e){if(e.code!=='ENOENT')throw e;}return out;
}
export async function installFiles(root,backup,files){
 // Source only. Reports, all deployment configs, dependencies and secrets are excluded.
 const applied=[];
 try{for(const file of files.filter(f=>installPath(f.path))){const target=join(root,file.path),saved=join(backup,file.path);let existed=true;try{await access(target);}catch(e){if(e.code!=='ENOENT')throw e;existed=false;}
 if(existed){await mkdir(dirname(saved),{recursive:true});await copyFile(target,saved,constants.COPYFILE_EXCL);}
 applied.push({path:file.path,existed});await mkdir(dirname(target),{recursive:true});const temporary=target+'.safe-update.tmp';await writeFile(temporary,file.bytes,{flag:'wx'});await rename(temporary,target);
 }}catch(error){for(const file of applied.reverse()){const target=join(root,file.path);await rm(target+'.safe-update.tmp',{force:true});if(file.existed)await copyFile(join(backup,file.path),target);else await rm(target,{force:true});}throw error;}
 return applied;
}
export async function runLocal(command,args,cwd){
 await new Promise((ok,fail)=>{const child=spawn(command,args,{cwd,stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});child.once('error',fail);child.once('exit',code=>code===0?ok():fail(Error('Local validation failed: '+args.join(' '))));});
}
async function main(){
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--release')throw Error('Usage: node prepare-live-audit-update.mjs --release COMMIT_SHA');
 const root=process.cwd();await access(join(root,'wrangler.jsonc'));await access(join(root,'node_modules/wrangler/bin/wrangler.js'));
 const before=await reportHashes(root),release=await releaseFiles(args[1]);
 const currentPackage=JSON.parse(await readFile('package.json','utf8')),nextPackage=JSON.parse(release.files.find(f=>f.path==='package.json').bytes.toString('utf8'));
 const sorted=value=>JSON.stringify(Object.entries(value||{}).sort(([a],[b])=>a.localeCompare(b)));
 for(const key of ['dependencies','devDependencies'])if(sorted(currentPackage[key])!==sorted(nextPackage[key]))throw Error('Dependencies differ. No files changed. A reviewed dependency update is required first.');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const area=join(root,'.audit-updates',stamp),stage=join(area,'stage'),backup=join(area,'backup');await mkdir(stage,{recursive:true});
 for(const file of release.files){const target=join(stage,file.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,file.bytes,{flag:'wx'});}
 // Node module resolution reaches the existing root node_modules; no npm install.
 const tests=(await readdir(join(stage,'test'))).filter(n=>n.endsWith('.test.mjs')).map(n=>'test/'+n);
 await runLocal(process.execPath,['--test',...tests],stage);
 await runLocal(process.execPath,['scripts/build-clients.mjs'],stage);
 await runLocal(process.execPath,[join(root,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config','wrangler.jsonc','--outdir','worker-build'],stage);
 const runtimeTests=(await readdir(join(stage,'test-runtime'))).filter(n=>n.endsWith('.test.mjs')).map(n=>'test-runtime/'+n);
 await runLocal(process.execPath,['--test',...runtimeTests],stage);
 if(JSON.stringify(before)!==JSON.stringify(await reportHashes(root)))throw Error('Reports changed concurrently. Update stopped before installing files.');
 const applied=await installFiles(root,backup,release.files);
 const receipt={release:release.release,treeSha:release.treeSha,preparedAt:new Date().toISOString(),files:release.files.filter(f=>installPath(f.path)).map(({path,sha})=>({path,sha})),backup,reportHashes:before};
 await writeFile(join(area,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log('Local update prepared and checked. No Cloudflare deployment or paid test was made.');
 console.log('Receipt: '+join(area,'receipt.json'));console.log('Backups: '+backup);console.log('Original reports and Worker configurations were not changed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
