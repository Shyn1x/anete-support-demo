// Offline only: historical results stay byte-for-byte untouched.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {CASES,VERSION,RUNNER_REVISION,sha256,summary} from './run-live-50.mjs';
export async function readReport(path){
 const bytes=await readFile(path);let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}catch{throw Error('Report is not valid UTF-8. Preserve it and its backup for inspection; do not overwrite it.');}
 const report=JSON.parse(text);if(report.version!==VERSION||!Array.isArray(report.rows))throw Error('Unsupported report structure.');
 return {path:resolve(path),sha256:sha256(bytes),report};
}
export function auditReport(report){
 const fatalIssues=[],reviews=[],seen=new Set();
 for(const row of report.rows){
  const c=CASES.find(c=>c.id===row.id);
  if(!c){fatalIssues.push({id:row.id,reason:'unknown_id'});continue;}
  if(seen.has(row.id)){fatalIssues.push({id:row.id,reason:'duplicate_id'});continue;}seen.add(row.id);
  const reasons=[];
  if(row.question!==c.message)reasons.push('question_differs_from_canonical_possible_encoding_or_edit');
  if(row.expectedLocale!==c.locale)reasons.push('locale_differs');
  if(row.tenant!==c.tenant)reasons.push('tenant_differs');
  if(!['complete','pending','ambiguous'].includes(row.state))fatalIssues.push({id:row.id,reason:'unknown_state'});
  if(row.state==='complete'&&(!row.assessment||typeof row.assessment.pass!=='boolean'||typeof row.answer?.text!=='string'))fatalIssues.push({id:row.id,reason:'incomplete_result'});
  if(row.answer?.fallbackReason)reasons.push('fallback_requires_review:'+row.answer.fallbackReason+(row.answer.validationReason?'/'+row.answer.validationReason:''));
  if(row.state!=='complete')reasons.push('possibly_sent_do_not_retry');
  if(row.requestProof?.messageSha256&&row.requestProof.messageSha256!==sha256(row.question||''))reasons.push('message_hash_mismatch');
  if(reasons.length)reviews.push({id:row.id,reasons,classification:'requires_review_not_auto_retested'});
 }
 const validRows=report.rows.filter(r=>r.state!=='complete'||r.assessment&&r.answer);
 const pending=CASES.filter(c=>!seen.has(c.id));
 return {runnerRevision:RUNNER_REVISION,summary:summary(validRows),historicalTransportProof:report.rows.some(r=>!r.requestProof)?'Older rows lack request-byte proof; report corruption alone does not prove what reached the server.':'Request hashes recorded locally; not a server receipt.',fatalIssues,reviews,pending:pending.map(c=>({id:c.id,locale:c.locale,expectsAI:!!c.ai})),remaining:pending.length,expectedAI:pending.filter(c=>c.ai).length,maxAdditionalReservationUSD:pending.length*0.01};
}
export async function forkReport(original,path,audit){
 const report=structuredClone(original.report);
 report.parentReport={path:original.path,sha256:original.sha256};report.runnerRevision=RUNNER_REVISION;report.audit=audit;report.forkedAt=new Date().toISOString();
 await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
}
