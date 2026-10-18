// Offline evidence/routing audit only. Does not import the Worker or call fetch.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {getTenant,tenants} from '../src/kb.js';
import {referenceRoute,render,preflight} from '../src/core.js';
import {productCoverageCases} from './product-coverage-cases.mjs';
export function auditCoverage(){
 const results=productCoverageCases.map(c=>{
  const blocked=preflight(c.message,c.tenant),route=blocked?{ids:[],kind:blocked,handoff:false}:referenceRoute(c.message,null,c.tenant);
  const answer=render(c.tenant,c.locale,route,'reference');
  const outcome=answer.handoff?'review':answer.cardIds.length?'answer':'clarify';
  const own=new Set(Object.values(getTenant(c.tenant).sources).map(s=>s.url));
  return {...c,outcome,contractMet:outcome===c.expected,sourcesValid:answer.sources.every(s=>own.has(s.url)),cardIds:answer.cardIds,route:route.kind,text:answer.text};
 });
 return {revision:'product-coverage-v1',scope:'Offline routing and evidence coverage. Does not test live model phrasing, completeness of the shop catalogue, runtime deployment, or current prices/stock.',modelCalls:0,
 shops:Object.values(tenants).map(t=>({tenant:t.id,productEvidenceCards:t.cards.filter(c=>c.topic==='product').length,productEvidenceSources:new Set(t.cards.filter(c=>c.topic==='product').map(c=>c.source)).size,fullCatalogueConnected:false})),
 totals:{cases:results.length,answeredFromEvidence:results.filter(r=>r.outcome==='answer').length,clarificationOnly:results.filter(r=>r.outcome==='clarify').length,humanReview:results.filter(r=>r.outcome==='review').length,contractFailures:results.filter(r=>!r.contractMet||!r.sourcesValid).length},results};
}
async function main(){
const report=auditCoverage(),args=process.argv.slice(2);
if(args.length){if(args.length!==2||args[0]!=='--output')throw Error('Usage: node scripts/audit-product-coverage.mjs [--output NEW_JSON_PATH]');await writeFile(args[1],JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({scope:report.scope,shops:report.shops,totals:report.totals},null,2));
if(report.totals.contractFailures)process.exitCode=1;

}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
