// Run privately on the owner's computer after `npx wrangler login`.
// No secrets are written to Git or passed in process arguments.
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const shops=['rotallieta','bariba','hobbyset','apavi40plus','celotajs'];
const apiKey=process.env.OPENAI_API_KEY;
if(!apiKey){console.error('Set OPENAI_API_KEY privately in your terminal first. Nothing deployed.');process.exit(1);}
async function run(args,input){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{stdio:[input?'pipe':'inherit','inherit','inherit'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Wrangler failed: '+args[0])));if(input)child.stdin.end(input);});}
await import('./build-clients.mjs');
for(const shop of shops){
 const config='deploy/clients/'+shop+'.json';
 const password=randomBytes(18).toString('base64url'),session=randomBytes(48).toString('base64url');
 // Starts fail-closed: no password means no usable client application.
 await run(['deploy','--config',config,'--var','AI_ENABLED:false']);
 await run(['secret','bulk','--config',config],JSON.stringify({DEMO_PASSWORD:password,SESSION_SECRET:session,OPENAI_API_KEY:apiKey}));
 await run(['deploy','--config',config,'--var','AI_ENABLED:true']);
 console.log('\nPRIVATE — save in your password manager. Do not copy to GitHub:');
 console.log('Shop: '+shop+'\nDemo password: '+password+'\nUse the actual URL printed by Wrangler above.\n');
}
