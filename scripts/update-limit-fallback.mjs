// Update five existing client deployments without reading or rotating any secrets.
// Usage: node scripts/update-limit-fallback.mjs <verified Git commit SHA>
import {writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const release=process.argv[2];if(!/^[a-f0-9]{40}$/.test(release||''))throw Error('Provide the 40-character release commit SHA.');
const files=['src/guard.js','src/worker.js','public/app.js','public/limits.js'];
const downloaded=await Promise.all(files.map(async path=>{const r=await fetch('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/'+release+'/'+path);if(!r.ok)throw Error('Download failed: '+path+' HTTP '+r.status);return {path,text:await r.text()};}));
for(const file of downloaded)await writeFile(file.path,file.text);
await import('./build-clients.mjs');
async function deploy(shop){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','deploy/clients/'+shop+'.json','--var','AI_ENABLED:true'],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Deployment stopped at '+shop+'. No passwords changed.')));});}
for(const shop of ['rotallieta','bariba','hobbyset','apavi40plus','celotajs'])await deploy(shop);
console.log('Updated five existing demos. Passwords, API keys and budget counters were preserved.');
