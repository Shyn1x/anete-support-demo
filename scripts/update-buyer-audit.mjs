// Run in the existing authorized project directory. No secret rotation, budget increase or reset.
import {writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const release=process.argv[2];if(!/^[a-f0-9]{40}$/.test(release||''))throw Error('Provide the 40-character release commit SHA.');
const paths=['src/core.js','src/worker.js','src/prospects.js','src/niche-data.js','src/niche-route.js','src/buyer-intents.js','src/locale.js','src/media.js','public/app.js','public/media.js','public/index.html','public/style.css'];
const files=await Promise.all(paths.map(async path=>{const r=await fetch('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/'+release+'/'+path);if(!r.ok)throw Error('Download failed: '+path+' HTTP '+r.status);return {path,content:await r.text()};}));
for(const f of files)await writeFile(f.path,f.content);
await import('./build-clients.mjs');
for(const shop of ['rotallieta','bariba','hobbyset','apavi40plus','celotajs'])await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','deploy/clients/'+shop+'.json','--var','AI_ENABLED:true'],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});c.once('error',reject);c.once('exit',code=>code===0?resolve():reject(Error('Stopped at '+shop+'; secrets unchanged.')));});
console.log('Buyer-flow fixes deployed to five demos. Existing passwords and shared budget unchanged.');
