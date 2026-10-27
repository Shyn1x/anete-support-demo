// Standalone owner-run control batch authorised on 28 October: at most 15 chat
// POSTs / $0.15 retained reservation. Uses existing passwords and BudgetGuard.
// No dependencies, deployments, budget edits, retries or historical writes.
import {readFile,writeFile,open,rename,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
export const IDS=['dzijas','jig','musiclab','etextile','zummers'];
export const PRIOR_FILE='pilot-live-50-2026-10-27T17-22-29-407Z.json';
export const PRIOR_SHA='f0a6e31245f48153a537ce1ac1cd245a0af6c7772d275c0314153daaf3af7d02';
export const STATE_DIRECTORY=resolve(homedir(),'Lomenti-private','pilot-batch-20261026');
export const MARKER='.pilot-control-15-v2.json';
export const MAX_REQUESTS=15,MAX_RESERVATION_MICRO_USD=150000;
const sha=value=>createHash('sha256').update(value).digest('hex');
const origin=id=>'https://support-demo-'+id+'.fshyn1x.workers.dev';
const sourceHosts={dzijas:['dzijas.lv'],jig:['www.jig.lv','jig.lv'],musiclab:['musiclab.lv'],etextile:['www.etextile.lv','etextile.lv'],zummers:['www.zummers.lv','zummers.lv']};
const repeats=['dzijas-live-01','dzijas-live-05','jig-live-05','musiclab-live-01','musiclab-live-03','musiclab-live-05','etextile-live-01','etextile-live-04','etextile-live-05','zummers-live-01'];
const lvQueries={dzijas:'Kāds ir norādītais kamola svars?',jig:'Kāds materiāls norādīts šai makšķerei?',musiclab:'Kāds ir norādītais svars?',etextile:'Kam paredzēta šī prese?',zummers:'Kāds ir augšējā slieksnīša platums?'};
export function validatePrior(bytes){
 if(sha(bytes)!==PRIOR_SHA)throw Error('prior_report_hash');
 const prior=JSON.parse(bytes);
 if(prior.schema!=='pilot-live-buyer-v1'||prior.rows?.length!==50||prior.summary?.completed!==50||prior.summary.attempted!==50||prior.summary.ambiguous!==0||prior.rows.some(r=>r.state!=='complete'))throw Error('prior_report_incomplete');
 return prior;
}
export function controlPlan(prior){
 const cases=repeats.map(id=>{
  const c=prior.plan.find(c=>c.id===id);if(!c)throw Error('prior_case_missing');
  const entry={...c,id:id.replace('-live-','-control-'),priorCaseId:id,generated:true};
  delete entry.thread;
  if(id==='etextile-live-04'){
   const earlier=prior.rows.find(r=>r.id==='etextile-live-03');
   if(!earlier?.answer?.productRead||earlier.answer.productURL!==c.product)throw Error('prior_context_missing');
   entry.seed={caseId:earlier.id,history:[{role:'user',text:earlier.question.slice(0,400)},{role:'assistant',text:earlier.answer.text.slice(0,400)}],previousTopic:earlier.answer.topic,productURL:earlier.answer.productURL};
  }
  return entry;
 });
 for(const id of IDS){
  const product=prior.plan.find(c=>c.id===id+'-live-03')?.product;
  if(!product)throw Error('prior_product_missing');
  cases.push({id:id+'-control-lv',tenant:id,message:lvQueries[id]+' '+product,locale:'lv',kind:'product',cards:[],generated:true,product});
 }
 return cases;
}
export function controlSummary(rows){return {attempted:rows.length,completed:rows.filter(r=>r.state==='complete').length,autoAccepted:rows.filter(r=>r.assessment?.pass).length,providerReported:rows.filter(r=>r.answer?.providerUsed===true).length,ambiguous:rows.filter(r=>['pending','ambiguous'].includes(r.state)).length};}
export function assessControl(c,a,status){
 const issues=[];
 if(status!==200)issues.push('http:'+status);
 if(a.locale!==c.locale)issues.push('language');
 if(typeof a.text!=='string'||!a.text.trim())issues.push('empty-answer');
 if(a.handoff)issues.push('unexpected-shop-review');
 if(a.providerUsed!==true||a.conversational!==true||a.fallbackReason)issues.push('generated-answer-required');
 if(c.kind==='fact'&&!(a.cardIds||[]).some(id=>['delivery','shipping-cost','timing'].includes(id)))issues.push('missing-delivery-topic');
 const sources=Array.isArray(a.sources)?a.sources:[];
 if(!sources.length)issues.push('missing-source');
 for(const s of sources)try{const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!sourceHosts[c.tenant].includes(u.hostname))issues.push('foreign-or-private-source');}catch{issues.push('invalid-source');}
 if((c.product||c.products)&&a.productRead!==true)issues.push('product-not-read');
 for(const url of c.products||[c.product].filter(Boolean))if(!sources.some(s=>s.url===url))issues.push('missing-product-evidence');
 if(c.tenant==='etextile'&&c.priorCaseId==='etextile-live-04'&&/furniture|мебельн|mēbeļu/iu.test(a.text||''))issues.push('incorrect-hardware-translation');
 return {pass:issues.length===0,issues,requiresHumanReview:true};
}
export async function preflight(fetcher=fetch){
 const result=[];
 for(const id of IDS){const r=await fetcher(origin(id)+'/api/config',{redirect:'error',signal:AbortSignal.timeout(15000)}),c=await r.json();
  if(!r.ok||c.tenant!==id||c.ready!==true||c.locked!==true||c.mode!=='ai'||c.conversationRevision!=='context-v2'||c.conversationEnabled!==true||c.catalogEnabled!==true||c.catalogRevision!=='buyer-v8'||c.pilotBuyerRevision!=='pilot-buyer-v2'||c.perCallMicroUSD!==10000)throw Error('configuration_not_verified');
  result.push({id,revision:c.pilotBuyerRevision,perCallMicroUSD:c.perCallMicroUSD});
 }return result;
}
export async function executeControl({plan,cookies,checkpoint,fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}){
 // A fixed reviewed plan, not a caller-supplied arbitrary request list.
 if(plan.length!==MAX_REQUESTS||sha(JSON.stringify(plan))!==CONTROL_PLAN_SHA)throw Error('plan_not_verified');
 const rows=[];
 for(const c of plan){
  const cookie=cookies.get(c.tenant);if(!cookie)throw Error('session_missing');
  await wait(7000);
  const body=JSON.stringify({tenant:c.tenant,locale:c.locale,message:c.message,history:c.seed?.history||[],previousTopic:c.seed?.previousTopic||null,...(c.seed?.productURL?{productURL:c.seed.productURL}:{})});
  const row={id:c.id,priorCaseId:c.priorCaseId||null,tenant:c.tenant,question:c.message,expectedLocale:c.locale,requestSha256:sha(body),state:'pending',startedAt:new Date().toISOString()};
  rows.push(row);await checkpoint(rows);
  let response,answer;
  try{response=await fetcher(origin(c.tenant)+'/api/chat',{method:'POST',headers:{Origin:origin(c.tenant),Cookie:cookie,'Content-Type':'application/json'},body,redirect:'error',signal:AbortSignal.timeout(30000)});answer=await response.json();if(!answer||typeof answer!=='object'||Array.isArray(answer))throw Error('invalid_response');}
  catch{row.state='ambiguous';await checkpoint(rows,{stop:'ambiguous-response'});return rows;}
  row.httpStatus=response.status;row.answer=Object.fromEntries(['locale','text','cardIds','sources','handoff','mode','topic','providerUsed','conversational','fallbackReason','validationReason','validationDetail','productRead','productURL','catalogURLs','readFailures'].filter(k=>answer[k]!==undefined).map(k=>[k,answer[k]]));
  row.state=response.ok?'complete':'blocked';row.assessment=assessControl(c,row.answer,response.status);await checkpoint(rows);
  if(!response.ok||/budget|rate|reservation/iu.test(answer.fallbackReason||'')){await checkpoint(rows,{stop:'server-denied-request',httpStatus:response.status});return rows;}
 }return rows;
}
export async function loginSessions(passwords,fetcher=fetch){
 if(passwords?.schema!=='pilot-passwords-v1'||passwords.clients?.length!==5)throw Error('local_credentials_invalid');
 const seen=new Set(),secrets=new Set();
 for(const c of passwords.clients){if(!IDS.includes(c.id)||seen.has(c.id)||c.url!==origin(c.id)||typeof c.password!=='string'||c.password.length<20||c.password.length>128||secrets.has(c.password))throw Error('local_credentials_invalid');seen.add(c.id);secrets.add(c.password);}
 const cookies=new Map();
 for(const c of passwords.clients){const r=await fetcher(origin(c.id)+'/api/login',{method:'POST',headers:{Origin:origin(c.id),'Content-Type':'application/json'},body:JSON.stringify({password:c.password}),redirect:'error',signal:AbortSignal.timeout(15000)});const cookie=(r.headers.get('set-cookie')||'').split(';')[0];if(!r.ok||!/^demo_session=.+$/u.test(cookie))throw Error('login_failed');cookies.set(c.id,cookie);}
 return cookies;
}
export async function runControl({base=STATE_DIRECTORY,args=[],fetcher=fetch,wait,log=console.log}={}){
 const priorBytes=await readFile(resolve(base,PRIOR_FILE)),prior=validatePrior(priorBytes),plan=controlPlan(prior);
 if(sha(JSON.stringify(plan))!==CONTROL_PLAN_SHA)throw Error('plan_not_verified');
 if(!args.length){log(JSON.stringify({planned:15,maximumReservationUSD:0.15,paidCalls:0,revision:'pilot-buyer-v2',plan},null,2));return;}
 if(args.join(' ')!=='--run --allow-paid --max-requests 15')throw Error('explicit_authorization_required');
 const update=JSON.parse(await readFile(resolve(base,'pilot-code-update-20261027.json'),'utf8'));
 if(update.schema!=='pilot-code-update-v1'||update.revision!=='pilot-buyer-v2'||IDS.some(id=>!update.events?.some(e=>e.id===id&&e.step==='public-config-verified')))throw Error('update_receipt_missing');
 const protectedNames=[PRIOR_FILE,'.pilot-live-50-20261026.json','.pilot-zero-request-resume-20261026.json'];
 const protectedHashes=Object.fromEntries(await Promise.all(protectedNames.map(async name=>[name,sha(await readFile(resolve(base,name)))])));
 const lock=await open(resolve(base,'.live-50.lock'),'wx',0o600);let output;
 try{
  const marker=await open(resolve(base,MARKER),'wx',0o600);
  output=resolve(base,'pilot-control-15-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
  await marker.writeFile(JSON.stringify({output,planSha256:CONTROL_PLAN_SHA,maximumRequests:15,maximumReservationMicroUSD:150000,priorSha256:PRIOR_SHA})+'\n');await marker.close();
  const report={schema:'pilot-control-15-v1',createdAt:new Date().toISOString(),revision:'pilot-buyer-v2',maximumRequests:15,maximumReservationMicroUSD:150000,priorReport:{file:PRIOR_FILE,sha256:PRIOR_SHA},protectedHashes,plan,rows:[],summary:controlSummary([]),requiresHumanReview:true};
  await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  const checkpoint=async(rows,event)=>{report.rows=rows;report.summary=controlSummary(rows);report.updatedAt=new Date().toISOString();if(event)(report.events??=[]).push(event);await writeFile(output+'.tmp',JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});await rename(output+'.tmp',output);};
  try{
   report.preflight=await preflight(fetcher);await checkpoint([]);
   const cookies=await loginSessions(JSON.parse(await readFile(resolve(base,'demo-passwords.json'),'utf8')),fetcher);
   let shown=0;
   await executeControl({plan,cookies,fetcher,wait,checkpoint:async(rows,event)=>{await checkpoint(rows,event);if(rows.length>shown&&rows.at(-1)?.state!=='pending'){shown=rows.length;log(`${shown}/15 ${rows.at(-1).tenant}: ${rows.at(-1).assessment?.pass?'OK':'REVIEW'}`);}}});
  }catch(error){await checkpoint(report.rows,{stop:'local-preflight-or-session-error'});throw error;}
  finally{for(const [name,hash] of Object.entries(protectedHashes))if(sha(await readFile(resolve(base,name)))!==hash)throw Error('historical_file_changed');}
  log(JSON.stringify({report:output,summary:report.summary,events:report.events},null,2));return report;
 }finally{await lock.close();await unlink(resolve(base,'.live-50.lock'));if(output)log('Separate report: '+output);}
}
// Exact plan hash binds the ten reviewed repetitions plus five LV questions.
// It is an audit identity only; it does not change server budget namespaces.
export const CONTROL_PLAN_SHA='344b10fc8c55f23307aa33d34c4931ff01f63811f53a0f8c551cfe2c5b2beddc';
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(Number(process.versions.node.split('.')[0])<22){console.error('Node.js 22 or newer required');process.exitCode=1;}
 else runControl({args:process.argv.slice(2)}).then(r=>{if(r&&r.summary.completed!==15)process.exitCode=2;}).catch(error=>{const allowed=new Set(['prior_report_hash','prior_report_incomplete','prior_case_missing','prior_context_missing','prior_product_missing','plan_not_verified','explicit_authorization_required','update_receipt_missing','configuration_not_verified','local_credentials_invalid','login_failed','session_missing','historical_file_changed']);const reason=allowed.has(error?.message)?error.message:['EEXIST','ENOENT'].includes(error?.code)?error.code:'local_or_network_error';console.error('Stopped: '+reason+'. No retries. Preserve report and receipts. No credentials were printed.');process.exitCode=1;});
}
