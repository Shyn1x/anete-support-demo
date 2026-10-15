// Update existing five Workers without reading or rotating secrets or changing budgets.
// Run from the existing project directory: node scripts/update-niche-answers.mjs <release SHA>
import {writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const release=process.argv[2];if(!/^[a-f0-9]{40}$/.test(release||''))throw Error('Provide the 40-character release commit SHA.');
const paths=['src/core.js','src/worker.js','src/prospects.js','src/niche-data.js','src/niche-route.js'];
const files=await Promise.all(paths.map(async path=>{const res=await fetch('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/'+release+'/'+path);if(!res.ok)throw Error('Download failed: '+path+' HTTP '+res.status);return {path,content:await res.text()};}));
for(const f of files)await writeFile(f.path,f.content);
await import('./build-clients.mjs');
for(const shop of ['rotallieta','bariba','hobbyset','apavi40plus','celotajs'])await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','deploy/clients/'+shop+'.json','--var','AI_ENABLED:true'],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});c.once('error',reject);c.once('exit',code=>code===0?resolve():reject(Error('Stopped at '+shop+'; passwords unchanged.')));});
console.log('Five demos updated. Existing secrets and shared budget counters preserved.');
