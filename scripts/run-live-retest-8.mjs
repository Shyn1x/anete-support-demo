// Eight explicitly approved historical retests. Never edits or rescores the live-50 report.
import {readFile,writeFile,rename,mkdir,open,unlink} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CASES,SHOPS,assertCaseIntegrity,sha256,configCompatible,assess,safeAnswer,stopReason} from './run-live-50.mjs';
import {readReport,auditReport} from './live-50-audit.mjs';
import {replyValidationReason} from '../src/conversation.js';
import {getTenant} from '../src/kb.js';
export const BASELINE_SHA256='82972e79662d09f6017f73db4c2fb812a9ad211e296fe791013f49855bd843ae';
export const RETEST_IDS=['hobbyset-02','apavi40plus-05','apavi40plus-06','apavi40plus-07','rotallieta-04','bariba-05','hobbyset-05','celotajs-07'];
export function retestPlan(original){
 assertCaseIntegrity();
 if(original.sha256!==BASELINE_SHA256||auditReport(original.report).fatalIssues.length||original.report.rows.length!==50||original.report.rows.some(r=>r.state!=='complete'))throw Error('Expected the reviewed immutable 50-row baseline. No chat request sent.');
 return RETEST_IDS.map(id=>{
  const c=CASES.find(c=>c.id===id),old=original.report.rows.find(r=>r.id===id);
  if(!c||!old)throw Error('Retest selection mismatch.');
  return {id,tenant:c.tenant,locale:c.locale,question:c.message,correctedInput:old.question!==c.message};
 });
}
export function retestBody(c,original){
 // Reconstruct only the one necessary follow-up context; it consumes no API request.
 const prior=c.id==='hobbyset-02'?original.report.rows.find(r=>r.id==='hobbyset-01'):null;
 if(prior&&(prior.state!=='complete'||prior.question!==CASES.find(c=>c.id==='hobbyset-01').message||!prior.assessment?.pass))throw Error('Unverified delivery context.');
 return JSON.stringify({tenant:c.tenant,locale:c.locale,message:c.message,previousTopic:prior?.answer.topic||null,history:prior?[{role:'user',text:prior.question.slice(0,400)},{role:'assistant',text:prior.answer.text.slice(0,400)}]:[]});
}
export function assessRetest(c,answer,hosts){
 const result=assess(c,answer,hosts);
 if(result.generated){const reason=replyValidationReason(answer.text,{ids:answer.cardIds||[],social:false},getTenant(c.tenant),c.locale);if(reason)result.notes.push('manual-review regression: '+reason);}
 result.pass=result.notes.length===0;return result;
}
function password(label){
 if(!process.stdin.isTTY)throw Error('Use an interactive PowerShell window. Passwords are entered locally, never in chat.');
 return new Promise((ok,fail)=>{let value='';const input=process.stdin,wasRaw=input.isRaw;
 process.stdout.write(label);input.setRawMode(true);input.resume();input.setEncoding('utf8');
 const finish=()=>{input.removeListener('data',onData);input.setRawMode(!!wasRaw);input.pause();process.stdout.write('\n');};
 const onData=chunk=>{for(const c of chunk){if(c==='\u0003'){finish();fail(Error('Stopped'));return;}if(c==='\r'||c==='\n'){finish();ok(value);return;}if(c==='\u007f'||c==='\b')value=value.slice(0,-1);else if(c>=' '&&c!=='\u001b')value+=c;}};input.on('data',onData);
 });
}
export function options(args){
 const out={run:false,allowPaid:false,report:null,maxRequests:null};
 for(let i=0;i<args.length;i++){const a=args[i];if(a==='--run')out.run=true;else if(a==='--allow-paid')out.allowPaid=true;else if(['--report','--max-requests'].includes(a)){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing value');out[a==='--report'?'report':'maxRequests']=args[++i];}else throw Error('Unknown option: '+a);}
 if(!out.report)throw Error('--report is required');
 if(out.run&&(!out.allowPaid||out.maxRequests!=='8'))throw Error('Approved scope requires --run --allow-paid --max-requests 8');return out;
}
const publicRequest=(url,init={})=>fetch(url,{...init,signal:AbortSignal.timeout(30000),redirect:'error'});
async function main(){
 const opts=options(process.argv.slice(2)),original=await readReport(opts.report),plan=retestPlan(original);
 console.log(JSON.stringify({separateHistoricalRetest:true,plan,maximumRequests:8,maximumReservationUSD:0.08,originalReportUnchanged:true},null,2));
 if(!opts.run){console.log('Offline plan only. No network or paid request.');return;}
 // Stable marker for this approved batch: do not restart it after interruption or completion.
 const lockPath=resolve('reports/.live-50.lock'),marker=resolve('reports/.live-retest-8-'+original.sha256+'.json');await mkdir(dirname(lockPath),{recursive:true});
 const lock=await open(lockPath,'wx').catch(()=>{throw Error('Another live run may be active. No request sent.');});
 let output;
 try{
  const configs=new Map();
  for(const shop of SHOPS.filter(s=>plan.some(c=>c.tenant===s.id))){const res=await publicRequest(shop.url+'/api/config');if(!res.ok)throw Error(shop.name+': configuration unavailable');const cfg=await res.json();if(!configCompatible(cfg,shop)||cfg.perCallMicroUSD!==10000)throw Error(shop.name+': configuration or reservation mismatch');configs.set(shop.id,cfg);}
  output=resolve('reports/live-retest-8-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
  const claim=await open(marker,'wx').catch(()=>{throw Error('This approved retest batch already has a marker. Do not repeat it; inspect the saved report first.');});
  await claim.writeFile(JSON.stringify({output,parentSha256:original.sha256,maximumRequests:8,createdAt:new Date().toISOString()}));await claim.close();
  const report={version:'live-retest-8-v1',parentReport:{sha256:original.sha256,path:original.path},plan,maximumRequests:8,maximumReservationUSD:0.08,rows:[],requiresHumanReview:true};
  const save=async()=>{report.updatedAt=new Date().toISOString();report.summary={planned:8,attempted:report.rows.length,completed:report.rows.filter(r=>r.state==='complete').length,passed:report.rows.filter(r=>r.assessment?.pass).length,providerAttempts:report.rows.filter(r=>r.answer?.providerUsed===true).length,ambiguous:report.rows.filter(r=>['pending','ambiguous'].includes(r.state)).length};await writeFile(output+'.tmp',JSON.stringify(report,null,2)+'\n',{flag:'wx'});await rename(output+'.tmp',output);};
  await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log('New independent report: '+output);
  const cookies=new Map();
  for(const item of plan){
   const c=CASES.find(c=>c.id===item.id),shop=SHOPS.find(s=>s.id===c.tenant),config=configs.get(shop.id);
   if(!cookies.has(shop.id)){const secret=await password('Demo password '+shop.name+': ');const res=await publicRequest(shop.url+'/api/login',{method:'POST',headers:{Origin:shop.url,'Content-Type':'application/json'},body:JSON.stringify({password:secret})});if(!res.ok)throw Error('Login failed: '+shop.name);const cookie=(res.headers.get('set-cookie')||'').split(';')[0];if(!cookie.startsWith('demo_session='))throw Error('No demo session');cookies.set(shop.id,cookie);}
   await new Promise(r=>setTimeout(r,7000));
   const body=retestBody(c,original),row={id:c.id,tenant:c.tenant,question:c.message,expectedLocale:c.locale,correctedInput:item.correctedInput,state:'pending',startedAt:new Date().toISOString(),requestProof:{algorithm:'sha256-utf8-json',bodySha256:sha256(body),messageSha256:sha256(c.message)}};
   report.rows.push(row);await save();
   let response,data;
   try{response=await publicRequest(shop.url+'/api/chat',{method:'POST',headers:{Origin:shop.url,'Content-Type':'application/json',Cookie:cookies.get(shop.id)},body});data=await response.json();}catch{row.state='ambiguous';row.note='Request may have been charged; never retried automatically.';await save();break;}
   row.httpStatus=response.status;row.answer=safeAnswer(data);
   const stopped=stopReason(response.status,data);
   if(response.status<200||response.status>=300||/budget/.test(data.fallbackReason||'')||data.error==='budget_exhausted'){row.state='blocked';row.note=stopped||'Server denied request';await save();console.log(row.note);break;}
   row.state='complete';row.assessment=assessRetest(c,data,[...new Set((config.sources||[]).map(s=>new URL(s.url).hostname))]);await save();
   // Known validation fallbacks remain failures but do not trigger paid retries.
   console.log(`${report.rows.length}/8 ${c.id}: ${row.assessment.pass?'OK':'REVIEW'}${data.validationReason?' / '+data.validationReason:''}`);
  }
  await save();if(sha256(await readFile(original.path))!==original.sha256)throw Error('Baseline changed concurrently. Preserve both files for inspection.');console.log(JSON.stringify(report.summary,null,2));console.log('Saved: '+output+'\nOriginal 50-row report was not edited or rescored. No automatic retries.');
 }finally{await lock.close();await unlink(lockPath);if(output)console.log('Retest report: '+output);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('Retest stopped. Preserve the report/marker and share the report for inspection; do not repeat the command. No secrets are logged.');process.exitCode=1;});
