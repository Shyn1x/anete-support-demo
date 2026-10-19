import {ordinalSelection} from './product-context.js';
import {loadCatalogIndex,searchProducts,searchIndexedProducts,searchFallback,searchCopy,fold,queryParts} from './catalog-index.js';
import {fetchProduct,productURL,plain,readText,catalogDiagnostics,canContinueProduct} from './catalog.js';import {catalogReplyRequest} from './catalog-reply.js';
import {reviewedCatalogSnapshot} from './catalog-snapshots.js';
const failureReasons=new Set(['incomplete','refusal','schema','catalog_comparison_omitted','catalog_evidence_quote','catalog_quantity_binding','catalog_quantity_qualifier','catalog_unsupported_detail','catalog_material_qualification','catalog_snapshot_generation','unsupported_number','wrong_language','unsafe_content','unsupported_handoff_action','unverified_promise','pretended_action','links_contacts_or_internal_text','catalog_prompt_size','empty_or_long']);
export function catalogueContext(value,tenant){return Array.isArray(value)&&value.length<=3&&value.every(u=>typeof u==='string'&&productURL(u,tenant))?[...new Set(value)]:[];}
// Explicit links are already host-checked by shopLinks; validate product paths
// again and never silently drop the second item of a requested pair.
export function explicitProductPlan(linked,tenant){
 if(linked.rejected||linked.links.length!==2)return null;
 const urls=linked.links.map(l=>productURL(l.url,tenant));
 const candidates=urls.every(Boolean)&&urls[0]!==urls[1]?urls.map(u=>({u,t:''})):[];
 return {explicitContext:true,requireAll:true,index:{tenant:tenant.id,importedAt:null},candidates};
}
export function contextSelection(message,urls){
 if(!urls.length)return [];
 if(urls.length===1&&canContinueProduct(message))return urls;
 const ordinals=ordinalSelection(message,urls.length);if(ordinals.length)return ordinals.map(i=>urls[i]);
 if(/^(?:сравни(?:те)? (?:их|эти(?: варианты| товары)?)|compare (?:these|them)|salīdzini (?:tos|šos))[?.! ]*$/iu.test(message))return urls;
 return [];
}
function comparison(index,message){const stripped=message.replace(/^(?:сравни(?:те)?|compare|salīdzini)\s+/iu,'');const parts=stripped.split(/\s+(?:и|vs\.?|versus|and|un)\s+/iu);if(parts.length!==2)return [];const rows=parts.map(s=>searchProducts(index,s,{limit:1})[0]);return rows.every(Boolean)&&rows[0].u!==rows[1].u?rows:[];}
export async function retrievalPlan(env,tenant,message,reference,context){
 if(reference.handoff||reference.social||reference.ids.some(id=>tenant.cards.find(c=>c.id===id)?.topic!=='product'))return null;
 const remembered=contextSelection(message,catalogueContext(context,tenant));
 if(remembered.length){const requireAll=remembered.length>1||/сравн|compare|salīdzin/iu.test(message);return {explicitContext:true,requireAll,index:{tenant:tenant.id,importedAt:null},candidates:requireAll&&remembered.length!==2?[]:remembered.map(u=>({u,t:''}))};}
 if(tenant.id==='anete')return {native:true,index:{tenant:'anete',importedAt:null},candidates:[]};
 const index=await loadCatalogIndex(env,tenant);const stripped=message.replace(/^(?:сравни(?:те)?|compare|salīdzini)\s+/iu,'');const parts=stripped.split(/\s+(?:и|vs\.?|versus|and|un)\s+/iu);let candidates=[];if(parts.length===2){const both=await Promise.all(parts.map(p=>searchIndexedProducts(env,tenant,index,p,1)));if(both.every(x=>x.length)&&both[0][0].u!==both[1][0].u)candidates=both.flat();}if(!candidates.length)candidates=await searchIndexedProducts(env,tenant,index,message);return {index,candidates};
}
// Fixed own-shop endpoint, no arbitrary target, redirect, session, cookie or search service.
export async function nativeAneteSearch(message,tenant,fetcher){
 const queries=[[/пылесос|vacuum|putekļsūc/iu,'putekļsūcējs'],[/холодиль|fridge|refrigerator|ledusskap/iu,'ledusskapis'],[/микроволн|microwave/iu,'mikroviļņu']];
 const {terms}=queryParts(message),category=queries.find(([re])=>re.test(message))?.[1];
 const query=(terms.length?terms.join(' ')+(category?' '+category:''):category||message).slice(0,100);
 // This public JSON endpoint is the one used by Anete's observed storefront
 // search UI. No guessed authenticated API or huge full-page menu download.
 const u=new URL('https://anete.lv/index.php');u.searchParams.set('route','product/search/suggest');u.searchParams.set('search',query);
 const res=await fetcher(u.href,{redirect:'manual',headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500)});
 if(!res.ok||res.status>=300||!/application\/json/.test(res.headers.get('Content-Type')||''))throw Error('catalog_search');
 const data=JSON.parse(await readText(res,150000));if(!Array.isArray(data)||data.length>100)throw Error('catalog_search');const rows=[];
 for(const item of data){if(item?.type!=='product'||typeof item.href!=='string'||typeof item.name!=='string')continue;const url=productURL(item.href,tenant),title=plain(item.name);if(!url||title.length<4||title.length>700||rows.some(r=>fold(r.t)===fold(title)||r.u.match(/\/(\d+)\/\d+\/p$/)?.[1]===url.match(/\/(\d+)\/\d+\/p$/)?.[1]))continue;rows.push({u:url,t:title});}
 return searchProducts({products:rows},message);
}

export function isCatalogueListing(message){return !/состав|ингреди|материал|кож|стельк|ширин|полн[оы]т|вес|размер|сетк|батар|комплект|возраст|сравн|цен|стоим|ingredient|material|leather|insole|width|weight|size|chart|batter|contents|included|(?<!\p{L})age(?!\p{L})|compare|difference|price|cost|sast[aā]v|materi[aā]l|(?<!\p{L})ādas(?!\p{L})|iekšzol|platums|svars|izm[eē]r|bater|komplekt|vecum|salīdzin|cena/iu.test(message);}
const listingQuestion={ru:{bariba:'Сколько лет питомцу и какой корм ищете: сухой или влажный?',hobbyset:'Что хотите сделать и с каким материалом будете работать?',rotallieta:'Для какого возраста и чем интересуется ребёнок?',apavi40plus:'Для какого сезона и случая нужна обувь?',celotajs:'На сколько человек и для какого времени года выбираете снаряжение?',anete:'Для каких задач выбираете технику и какие параметры важнее?'},lv:{bariba:'Cik vecs ir mājdzīvnieks, un vai meklējat sauso vai mitro barību?',hobbyset:'Ko vēlaties izgatavot un ar kādu materiālu strādāsiet?',rotallieta:'Kāds ir bērna vecums un intereses?',apavi40plus:'Kādai sezonai un situācijai vajadzīgi apavi?',celotajs:'Cik cilvēkiem un kādam gadalaikam izvēlaties ekipējumu?',anete:'Kādiem darbiem meklējat tehniku un kuras īpašības ir svarīgākās?'},en:{bariba:'How old is your pet, and are you looking for dry or wet food?',hobbyset:'What would you like to make, and what material will you work with?',rotallieta:'How old is the child, and what do they enjoy?',apavi40plus:'What season and occasion are the shoes for?',celotajs:'For how many people and which season are you choosing equipment?',anete:'What tasks do you need the appliance for, and which features matter most?'}};
export async function readCandidates(plan,tenant,message,fetcher,forceRead=false){
 const deadline=AbortSignal.timeout(10000),bounded=(url,options)=>fetcher(url,{...options,signal:AbortSignal.any([deadline,options.signal].filter(Boolean))});
 const candidates=plan.native?await nativeAneteSearch(message,tenant,bounded):plan.candidates;
 if(!forceRead&&!plan.explicitContext&&isCatalogueListing(message))return {candidates,products:[],readFailures:0,metadataOnly:true,diagnostics:[]};
 const results=await Promise.allSettled(candidates.slice(0,2).map(c=>fetchProduct(c.u,tenant,bounded,typeof caches!=='undefined'?caches.default:null,!/цен|стоим|price|cost|cena/iu.test(message))));
 return {candidates,products:results.flatMap((r,i)=>{if(r.status==='fulfilled')return [r.value];const snapshot=reviewedCatalogSnapshot(candidates[i].u,tenant,r.reason);return snapshot?[snapshot]:[];}),readFailures:results.filter(r=>r.status==='rejected').length,diagnostics:results.flatMap((r,i)=>r.status==='rejected'?[{url:candidates[i].u,...catalogDiagnostics(r.reason)}]:[])};
}
export async function generateCatalogReply(tenant,products,message,locale,env,fetcher,prepared){
 const route=prepared||catalogReplyRequest(tenant,products,message,locale);
 const res=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(route.body),signal:AbortSignal.timeout(8000),redirect:'manual'});
 if(!res.ok||res.status>=300)throw Error('catalog_provider');return route.parse(await res.json());
}
export function retrievalFallback(loaded,plan,message,locale){if(plan.requireAll&&(!plan.candidates.length||loaded.readFailures||loaded.products.length!==2))return {ru:'Для сравнения нужны две разные ссылки на товары этого магазина и доступные описания обоих товаров. Сейчас оба описания не подтверждены; сравнивать по одному не буду.',lv:'Salīdzinājumam vajadzīgas divas atšķirīgas šī veikala preču saites un abu preču apraksti. Pašlaik abi apraksti nav apstiprināti; pēc vienas preces nesalīdzināšu.',en:'A comparison needs two distinct product links from this shop and both descriptions. Both descriptions could not be confirmed; I will not compare using just one.'}[locale];if(loaded.metadataOnly&&loaded.candidates.length){const t=searchCopy[locale];const caveat={ru:'Это названия из каталога. Актуальное наличие и пригодность для конкретного случая ещё не проверены.',lv:'Tie ir katalogā atrodamie nosaukumi. Aktuālais atlikums un piemērotība konkrētam gadījumam vēl nav pārbaudīti.',en:'These are catalogue names. Current stock and suitability for your situation have not yet been checked.'}[locale];return t.matches+'\n'+loaded.candidates.map((p,i)=>(i+1)+'. '+p.t).join('\n')+'\n\n'+caveat+' '+listingQuestion[locale][plan.index.tenant];}const text=loaded.products.length?searchFallback(loaded.products,message,locale,plan.index):loaded.candidates.length||loaded.readFailures?searchCopy[locale].unavailable:searchCopy[locale].none;return text+(loaded.products.length&&loaded.readFailures>loaded.products.filter(p=>p.reviewedSnapshot).length?'\n\n'+searchCopy[locale].unavailable:'');}
export const catalogReason=error=>failureReasons.has(error?.message)?error.message:error instanceof SyntaxError?'invalid_json':'catalog_unavailable';
