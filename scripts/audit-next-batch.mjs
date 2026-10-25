// No live endpoint, credentials or provider calls. Reports are separate from live-50.
import {profiles} from '../staging/next-batch/profiles.mjs';
import {buyerCases} from '../staging/next-batch/buyer-cases.mjs';
import {sharedProbes,nicheProbes,urlProbes,variants} from '../staging/next-batch/audit-cases.mjs';
import {reply} from '../staging/next-batch/dialogue.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function checks(){const list=[];
 for(const profile of profiles){
  for(const [q,card,kind,locale] of buyerCases[profile.id])for(const variant of variants)list.push({profile,group:'text-variants',id:`${profile.id}:${q}:${variant.id}`,q:variant.apply(q),kinds:[kind],locale,card});
  for(const [group,rows] of [['shopper-probes',sharedProbes],['niche-probes',nicheProbes[profile.id]],['url-probes',urlProbes(profile)]])for(const row of rows)list.push({profile,group,...row,id:`${profile.id}:${row.id}`});
 }
 return list;
}
export function checkOne(check,engine=reply){
 let got,errors=[];
 try{got=engine(check.profile,check.q,check.previousLocale??'ru');
  if(!check.kinds.includes(got.kind))errors.push(`kind:${got.kind}`);
  if(check.notKinds?.includes(got.kind))errors.push('disallowed-kind');
  if(check.locale!==got.locale)errors.push(`locale:${got.locale}`);
  if(Object.hasOwn(check,'card')&&check.card!==got.cardId)errors.push(`card:${got.cardId}`);
  if(check.containsContact&&!got.answer.includes(check.profile.contact))errors.push('missing-contact');
  if(check.notText?.test(got.answer))errors.push('wrong-advice');
  if(got.kind==='social'&&/[?？]/u.test(got.answer))errors.push('social-followup');
  if(got.providerUsed!==false||got.ticketCreated!==false||got.shop!==check.profile.id)errors.push('contract');
 }catch(error){errors.push('exception:'+error.message);}
 return {id:check.id,shop:check.profile.id,group:check.group,question:check.q,passed:errors.length===0,errors,actual:got?{kind:got.kind,card:got.cardId,locale:got.locale}:null};
}
export function runAudit(){
 const results=checks().map(c=>checkOne(c)),byGroup={};
 for(const r of results){const g=byGroup[r.group]??={total:0,passed:0};g.total++;g.passed+=Number(r.passed);}
 return {schema:'next-batch-offline-audit-v1',createdAt:new Date().toISOString(),scope:'10 offline drafts; variants and shared cases are repeated checks, not unique live AI conversations',providerCalls:0,apiCostUsd:0,total:results.length,passed:results.filter(r=>r.passed).length,byGroup,results};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const output=process.argv[2];if(!output)throw new Error('Provide a NEW report path; existing reports are never overwritten.');
 const report=runAudit();await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',encoding:'utf8'});
 console.log(JSON.stringify({total:report.total,passed:report.passed,byGroup:report.byGroup,report:output},null,2));
 if(report.passed!==report.total)process.exitCode=1;
}
