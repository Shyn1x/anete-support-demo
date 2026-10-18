// Offline routes + actual imported metadata only. No provider/merchant network calls.
import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {shopperCases} from './shopper-scenarios.mjs';import {catalogueAsset} from './build-catalog-index.mjs';
import {getTenant} from '../src/kb.js';import {preflight,referenceRoute} from '../src/core.js';import {searchProducts} from '../src/catalog-index.js';
export async function shopperReport(){
 const indices={};for(const id of ['bariba','hobbyset','rotallieta','apavi40plus','celotajs'])indices[id]=JSON.parse(await catalogueAsset(id));
 const results=shopperCases.map(c=>{const blocked=preflight(c.message,c.tenant),r=referenceRoute(c.message,null,c.tenant);let matches=[];if(!blocked&&!r.handoff&&indices[c.tenant])matches=searchProducts(indices[c.tenant],c.message);
 const outcome=blocked?'blocked':r.handoff?'review':c.expected==='search'&&c.tenant==='anete'?'needs_live_search':matches.length?'metadata_match':r.ids.length?'policy_or_snapshot':'clarify';
 const pass=c.expected==='blocked'?!!blocked:c.expected==='review'?r.handoff:c.expected==='policy'?r.ids.length>0:c.expected==='unknown'?matches.length===0:c.tenant==='anete'?null:matches.length>0;
 return {...c,outcome,contractMet:pass,matched:matches.map(p=>({title:p.t,url:p.u})),route:r.kind,cardIds:r.ids,liveAIQuality:'not_tested'};});
 return {schema:'shopper-scenarios-v1',scope:'Customer goals in RU/LV/EN. Offline routing and metadata matching only. A matching title is not a correct product answer. Anete requires live search; live model wording and individual suitability remain untested.',paidOpenAICalls:0,totals:{variants:results.length,goals:results.length/3,contractFailures:results.filter(r=>r.contractMet===false).length,needsLiveSearch:results.filter(r=>r.contractMet===null).length,metadataMatches:results.filter(r=>r.outcome==='metadata_match').length,clarifications:results.filter(r=>r.outcome==='clarify').length},results};
}
async function main(){const report=await shopperReport();if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report.totals));for(const r of report.results.filter(r=>r.contractMet===false))console.log(r.id,r.message,r.outcome);if(report.totals.contractFailures)process.exitCode=1;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
