// Run only in the existing Cloudflare project directory on the owner's computer.
// Reuses existing secrets, sessions, BudgetGuard namespace and reservation counters.
import {writeFile,mkdir,access} from 'node:fs/promises';import {spawn} from 'node:child_process';import path from 'node:path';
const release=process.argv[2];if(!/^[a-f0-9]{40}$/.test(release||''))throw Error('Provide an immutable 40-character release commit SHA.');
await access('wrangler.jsonc');await access('node_modules/wrangler/bin/wrangler.js');
const paths=['src/worker.js','src/client-worker.js','src/conversation.js','src/core.js','src/catalog.js','src/shop-links.js','src/guard.js','src/kb.js','src/prospects.js','src/niche-data.js','src/niche-route.js','src/buyer-intents.js','src/locale.js','src/media.js','src/social.js','src/typos.js','public/app.js','public/catalog.js','public/branding.js','public/contact.js','public/limits.js','public/media.js','public/index.html','public/style.css','public/brand.css','public/favicon.svg','public/demos.html','public/usage.html','public/usage.js','public/qa.html','public/qa.js','public/qa-cases.js','public/qa-core.js','public/qa.css','scripts/build.mjs','scripts/browser-bundle.mjs','scripts/build-clients.mjs'];
// Fetch everything successfully before changing local source; never print server bodies.
const files=await Promise.all(paths.map(async file=>{const r=await fetch('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/'+release+'/'+file,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Download failed: '+file+' HTTP '+r.status);return {file,content:await r.text()};}));
for(const {file,content}of files){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,content);}
await import('./build-clients.mjs');
async function deploy(config){await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config',config,'--var','AI_ENABLED:true','--var','CATALOG_ENABLED:true','--var','AI_CONVERSATIONAL:true'],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});c.once('error',reject);c.once('exit',code=>code===0?resolve():reject(Error('Stopped at '+config+'. Existing secrets and counters were not reset.')));});}
await deploy('wrangler.jsonc');
for(const shop of ['rotallieta','bariba','hobbyset','apavi40plus','celotajs'])await deploy('deploy/clients/'+shop+'.json');
console.log('Conversational replies deployed to Anete and five client demos. Existing passwords and shared budget retained. No provider test call was made by this script.');
