import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalogMeasurementReason,catalogFibreReason,confirmedFibreComposition} from '../src/catalog-measurements.js';
import {catalogReplyRequest,catalogEvidenceReason} from '../src/catalog-reply.js';
import {knownCatalogDetails} from '../src/catalog-evidence.js';
import {retrievalFallback} from '../src/catalog-service.js';
import {createWorker} from '../src/worker.js';
import {getTenant} from '../src/kb.js';
import {environment,request} from './helpers.mjs';
const samples=JSON.parse(await readFile(new URL('./fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const products=id=>samples.filter(p=>p.tenant===id).slice(0,2).map(p=>({...p,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'}));
const yarn=products('dzijas'),music=products('musiclab'),rods=products('jig');
const response=out=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
const wire=reply=>response({ids:['catalog:0','catalog:1'],reply,evidence:['evidence_0_0','evidence_1_0']});
const sharedWeight={ru:'Оба монитора весят 8,5 кг.',lv:'Abi monitori sver 8,5 kg.',en:'Both monitors weigh 8.5 kg.'};
const sharedWool={ru:'Обе пряжи содержат шерсть.',lv:'Abas dzijas satur vilnu.',en:'Both yarns contain wool.'};
const compare={ru:'Сравните материал и вес.',lv:'Salīdziniet materiālu un svaru.',en:'Compare material and weight.'};

for(const locale of ['ru','lv','en']){
 test(locale+': shared monitor weight is checked independently for both sources',()=>{
  const route=catalogReplyRequest(getTenant('musiclab'),music,compare[locale],locale,{requireAll:true});
  assert.equal(route.parse(wire(sharedWeight[locale])).text,sharedWeight[locale]);
  const changed=[music[0],{...music[1],lines:['Svars: 10.440000 kg']}];
  assert.equal(catalogMeasurementReason(sharedWeight[locale],changed),'catalog_quantity_binding');
  assert.equal(catalogMeasurementReason(sharedWeight[locale].replace(/кг|kg/u,locale==='ru'?'г':'g'),music),'catalog_quantity_binding');
 });
 test(locale+': a shared fibre must appear in every product and percentages cannot be pooled',()=>{
  assert.equal(catalogReplyRequest(getTenant('dzijas'),yarn,compare[locale],locale,{requireAll:true}).parse(wire(sharedWool[locale])).text,sharedWool[locale]);
  const other=[yarn[0],{title:'Cotton model',lines:['100% kokvilna']}];
  assert.equal(catalogFibreReason(sharedWool[locale],other),'catalog_material_qualification');
  const percentage=sharedWool[locale].replace(/шерсть|vilnu|wool/u,'100% '+{ru:'шерсть',lv:'vilnu',en:'wool'}[locale]);
  assert.equal(catalogFibreReason(percentage,yarn),'catalog_quantity_binding');
 });
 test(locale+': complete literal yarn composition survives a rejected generation without using rejected prose',()=>{
  const fallback=retrievalFallback({products:yarn,candidates:[],readFailures:0},{requireAll:true,candidates:yarn,index:{tenant:'dzijas'}},compare[locale],locale);
  for(const value of ['100%','75%','25%',locale==='ru'?'50 г':'50 g',locale==='ru'?'100 г':'100 g'])assert(fallback.includes(value),value);
  assert.match(fallback,/шерсть|vilna|wool/u);assert.match(fallback,/полиамид|poliamīds|polyamide/u);
  assert.equal(knownCatalogDetails(yarn[0],'material',locale).length,0,'old callers do not opt in');
 });
}
test('verbatim numeric model names identify rods without becoming invented mass or dimensions',()=>{
 const reply='Both '+rods[0].title+' and '+rods[1].title+' use TORAY graphite. Their product weights are not specified.';
 assert.equal(catalogReplyRequest(getTenant('jig'),rods,compare.en,'en',{requireAll:true}).parse(wire(reply)).text,reply);
 assert.equal(catalogMeasurementReason('The first rod weighs 18 g. The second rod weighs 30 g.',rods),'catalog_quantity_binding');
 assert.equal(catalogMeasurementReason('Both rods: 18 g.',[rods[0],rods[0]]),'catalog_quantity_binding','a casting number without a property label cannot become shared mass');
 const names=[music[0],{...music[1],lines:['Svars: 10.440000 kg']}];
 assert.equal(catalogMeasurementReason('Both '+names[0].title+' and '+names[1].title+' weigh 8.5 kg.',names),'catalog_quantity_binding');
});
test('bare unit labels and material words cannot hide unsupported scalar or fibre claims',()=>{
 assert.equal(catalogMeasurementReason('The second product weighs 50 g.',[{title:'50 g',lines:['Svars: 50 g']},{title:'Other model',lines:['Svars: 100 g']}]),'catalog_quantity_binding');
 assert.equal(catalogFibreReason('Both products contain wool.',[{title:'Wool',lines:['100% vilna']},{title:'Cotton',lines:['100% kokvilna']}]),'catalog_material_qualification');
 assert.equal(catalogMeasurementReason('The weight is 8.5 kg.',music),'catalog_quantity_binding','an unnamed noncollective pair stays ambiguous');
});
test('model name and ordinal conflicts fail closed and no measurements can move between products',()=>{
 assert.equal(catalogMeasurementReason('The first '+yarn[1].title+' weighs 50 g.',yarn),'catalog_quantity_binding');
 assert.equal(catalogMeasurementReason('The first yarn weighs 100 g; the second yarn weighs 50 g.',yarn),'catalog_quantity_binding');
 assert.equal(catalogMeasurementReason('The first yarn weighs 50 g; the second yarn weighs 100 g.',yarn),null);
 assert.equal(catalogFibreReason('Both yarns contain polyamide.',yarn),'catalog_material_qualification');
});
test('safe diagnostics distinguish subject, value/unit, role and fibre failures without returning model text',()=>{
 const m=catalogReplyRequest(getTenant('musiclab'),music,compare.en,'en',{requireAll:true});
 assert.throws(()=>m.parse(wire('The weight is 8.5 kg.')),e=>catalogEvidenceReason(e)==='product_subject_unbound');
 assert.throws(()=>m.parse(wire('Both monitors weigh 8.5 g.')),e=>catalogEvidenceReason(e)==='measurement_not_in_product');
 const r=catalogReplyRequest(getTenant('jig'),rods,compare.en,'en',{requireAll:true});
 assert.throws(()=>r.parse(wire('The first rod weighs 18 g.')),e=>catalogEvidenceReason(e)==='measurement_role_mismatch');
 const y=catalogReplyRequest(getTenant('dzijas'),yarn,compare.en,'en',{requireAll:true});
 assert.throws(()=>y.parse(wire('Both yarns contain polyamide.')),e=>catalogEvidenceReason(e)==='fibre_not_in_product');
 assert.throws(()=>y.parse(wire('Both yarns contain 100% wool.')),e=>catalogEvidenceReason(e)==='fibre_percentage_mismatch');
 assert.equal(catalogEvidenceReason({validationDetail:'private or arbitrary model text'}),null);
});
test('fallback composition rejects missing qualifiers, unknown fibres, conflicts and incomplete totals',()=>{
 for(const lines of [['Sastāvs: vismaz 75% vilna, 25% poliamīds'],['Sastāvs: 60% vilna, 40% unknown'],['100% vilna','100% kokvilna'],['100% vilna','Material: cotton'],['75% vilna, 20% poliamīds'],['Sastāvs: 75% vilna, 25% poliamīds','Sastāvs: 100% unknown']])assert.equal(confirmedFibreComposition({lines},'en'),null);
 assert.equal(confirmedFibreComposition({lines:['Sastāvs: 75.00% vilna, 25% poliamīds']},'en'),'Composition: 75% wool, 25% polyamide.');
});
for(const id of ['musiclab','dzijas','jig'])test(id+': full Worker accepts a supported comparison with one unchanged reserve and denies the next paid attempt',async()=>{
 const pair=products(id),reply=id==='musiclab'?sharedWeight.en:id==='dzijas'?sharedWool.en:'Both '+pair[0].title+' and '+pair[1].title+' use TORAY graphite. Product weights are not specified.';
 const {env,storage}=environment({TENANT_ID:id,NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'synthetic-test-key',DEMO_PASSWORD:'synthetic-comparison-password',TOTAL_BUDGET_MICRO_USD:'10000'});let provider=0;
 const worker=createWorker(async url=>{if(url==='https://api.openai.com/v1/responses'){provider++;return Response.json(wire(reply));}const p=pair.find(p=>p.url===url);assert(p);return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=()=>worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'Compare material and weight: '+pair.map(p=>p.url).join(' and ')},{headers:{cookie}}),env);
 const a=await(await send()).json();assert.equal(a.conversational,true,JSON.stringify(a));assert.equal(a.text,reply);assert.equal(a.sources.length,2);assert.equal(provider,1);assert.equal(storage.records.get('state').total,10000);
 const b=await(await send()).json();assert.equal(b.fallbackReason,'total_budget');assert.equal(provider,1);assert.equal(storage.records.get('state').total,10000);
});
