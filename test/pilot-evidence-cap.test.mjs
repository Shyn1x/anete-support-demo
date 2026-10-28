import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getTenant} from '../src/kb.js';
import {catalogReplyRequest,catalogEvidenceReason} from '../src/catalog-reply.js';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
const samples=JSON.parse(await readFile(new URL('./fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const pair=id=>samples.filter(p=>p.tenant===id).slice(0,2).map(p=>({...p,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'}));
const yarn=pair('dzijas'),rods=pair('jig');
const model=out=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
const ids=['catalog:0','catalog:1'];
const query={en:'Compare material and weight.',ru:'Сравни материал и вес.',lv:'Salīdzini materiālu un svaru.'};
const replies={
 en:'The first yarn weighs 50 g and contains 100% wool. The second yarn weighs 100 g and contains 75% wool and 25% polyamide.',
 ru:'Первая пряжа весит 50 г и содержит 100% шерсти. Вторая пряжа весит 100 г и содержит 75% шерсти и 25% полиамида.',
 lv:'Pirmā dzija sver 50 g un satur 100% vilnas. Otrā dzija sver 100 g un satur 75% vilnas un 25% poliamīda.'
};
const four=['evidence_0_0','evidence_0_1','evidence_1_0','evidence_1_1'];
const facts=r=>JSON.parse(r.body.instructions.split('Retrieved facts: ')[1]);
const wire=(reply,evidence=four,selected=ids)=>model({ids:selected,reply,evidence});

for(const locale of ['ru','lv','en'])test(locale+': two yarns can cite separate composition and weight excerpts without changing a fact',()=>{
 const r=catalogReplyRequest(getTenant('dzijas'),yarn,query[locale],locale,{requireAll:true});
 assert.equal(r.parse(wire(replies[locale])).text,replies[locale]);
 const schema=r.body.text.format.schema.properties.answers.items.properties.evidence;
 assert.equal(schema.minItems,1);assert.equal(schema.maxItems,3);
 assert.equal(r.body.store,false);assert.equal(r.body.max_output_tokens,450);assert.equal(r.body.text.format.strict,true);
 for(const ref of four)assert(schema.items.enum.includes(ref));
 assert.match(r.body.instructions,/up to 3 distinct supporting refs per selected product/u);
});
test('preview schema and parser bound reference counts by product count and available literal choices',()=>{
 for(const n of [1,2,3]){
  const products=Array.from({length:n},(_,i)=>({...yarn[i%2],title:'Yarn '+i}));
  const r=catalogReplyRequest(getTenant('dzijas'),products,'Compare weight','en',{requireAll:true});
  const properties=r.body.text.format.schema.properties;
  assert.equal(properties.answers?properties.answers.items.properties.evidence.maxItems:properties.evidence.maxItems,n>1?3:n*3);
  const all=facts(r).flatMap(f=>f.evidenceChoices.slice(0,3).map(c=>c.ref));
  assert.equal(r.parse(model({ids:products.map((_,i)=>'catalog:'+i),reply:'The requested detail is unconfirmed.',evidence:all})).ids.length,n);
 }
 const p={...yarn[0],title:'Yarn',lines:['Weight: 50 g']},r=catalogReplyRequest(getTenant('dzijas'),[p],'weight','en');
 assert.equal(r.body.text.format.schema.properties.evidence.maxItems,1);
});
for(const [evidence,reason]of [
 [['evidence_0_0','evidence_0_1','evidence_0_2','evidence_0_3','evidence_1_0'],'too_many_references'],
 [['evidence_0_0','evidence_0_1','evidence_0_2','evidence_1_0','evidence_1_1','evidence_1_2','evidence_1_3'],'too_many_references'],
 [['evidence_0_0','evidence_0_1','evidence_1_0','evidence_999_0'],'unknown_reference'],
 [['evidence_0_0','evidence_0_1','evidence_1_0','evidence_1_0'],'duplicate_reference'],
 [['evidence_0_0','evidence_0_1','evidence_0_2'],'missing_for_product']
])test('expanded references do not excuse '+reason,()=>{
 const r=catalogReplyRequest(getTenant('dzijas'),yarn,query.en,'en',{requireAll:true});
 assert.throws(()=>r.parse(wire(replies.en,evidence)),e=>catalogEvidenceReason(e)===reason);
});
test('expanded refs cannot cite an unselected product or silently repair legacy quote records',()=>{
 const r=catalogReplyRequest(getTenant('dzijas'),yarn,'What is the weight?','en');
 assert.throws(()=>r.parse(wire('The first weighs 50 g.',four,['catalog:0'])),e=>catalogEvidenceReason(e)==='wrong_product');
 const legacy=facts(r).flatMap(f=>f.evidenceChoices.slice(0,2).map(c=>({id:f.id,quote:c.quote})));
 assert.throws(()=>r.parse(wire(replies.en,legacy)),/schema/u);
});
for(const [reply,reason]of [
 [replies.en.replace('weighs 50 g','weighs 100 g').replace('weighs 100 g and contains 75%','weighs 50 g and contains 75%'),'catalog_quantity_binding'],
 ['Both yarns contain 100% wool.','catalog_quantity_binding'],
 ['The first yarn contains polyamide.','catalog_material_qualification'],
 ['The first yarn weighs 999 g.','unsupported_number'],
 ['Write to secret@example.invalid.','links_contacts_or_internal_text'],
 ['I have forwarded your request.','pretended_action']
])test('four valid literal refs still reject '+reason+' '+reply.slice(0,35),()=>{
 const r=catalogReplyRequest(getTenant('dzijas'),yarn,query.en,'en',{requireAll:true});
 assert.throws(()=>r.parse(wire(reply)),new RegExp(reason));
});
test('the original six retain their three-reference parser and wire schema',()=>{
 for(const id of ['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs']){
  const r=catalogReplyRequest(getTenant(id),yarn,query.en,'en',{requireAll:true});
  assert.equal(r.body.text.format.schema.properties.evidence.maxItems,undefined);
  assert.throws(()=>r.parse(wire(replies.en)),e=>catalogEvidenceReason(e)==='too_many_references');
 }
});
const quality={
 en:'Both fishing rods are made from IM9 graphite produced by Japan\'s TORAY, ensuring a high-quality blank material. However, the exact weight of each rod is not specified in the available information, so a weight comparison cannot be provided.',
 ru:'Оба удилища изготовлены из графита TORAY, что обеспечивает высокое качество бланка. Вес не указан.',
 lv:'Abi kāti izgatavoti no TORAY grafīta, kas nodrošina augstu kvalitāti. Svars nav norādīts.'
};
for(const locale of ['ru','lv','en'])test(locale+': literal refs and correct material do not justify a quality assurance inferred from material',()=>{
 const r=catalogReplyRequest(getTenant('jig'),rods,query[locale],locale,{requireAll:true});
 assert.throws(()=>r.parse(wire(quality[locale],['evidence_0_0','evidence_1_0'])),e=>e.message==='catalog_unsupported_detail'&&catalogEvidenceReason(e)==='unverified_quality_inference');
});
test('a plain supported material comparison remains accepted after removing the sales assurance',()=>{
 const r=catalogReplyRequest(getTenant('jig'),rods,query.en,'en',{requireAll:true});
 const text='Both fishing rods use IM9 graphite from TORAY. Their exact weights are not specified.';
 assert.equal(r.parse(wire(text,['evidence_0_0','evidence_1_0'])).text,text);
 assert.match(r.body.instructions,/Do not infer quality/u);
});
test('quality uncertainty does not hide a later affirmative quality assurance',()=>{
 const r=catalogReplyRequest(getTenant('jig'),rods,query.en,'en',{requireAll:true});
 for(const reply of ['Quality is not confirmed. Both rods use graphite, ensuring high quality.','Quality is not confirmed, but both rods are high-quality.'])assert.throws(()=>r.parse(wire(reply,['evidence_0_0','evidence_1_0'])),/catalog_unsupported_detail/u);
 for(const reply of ['Both rods use graphite. High quality is unconfirmed.','Both rods use graphite; this does not guarantee high quality.'])assert.doesNotThrow(()=>r.parse(wire(reply,['evidence_0_0','evidence_1_0'])));
});
for(const [locale,negative,positive]of [
 ['ru','Графит TORAY не гарантирует высокое качество.','Качество не подтверждено, но графит TORAY обеспечивает высокое качество.'],
 ['lv','TORAY grafīts nevar garantēt augstu kvalitāti.','Kvalitāte nav apstiprināta, bet TORAY grafīts nodrošina augstu kvalitāti.']
])test(locale+': an explicit quality disclaimer is allowed without hiding a later assurance',()=>{
 const r=catalogReplyRequest(getTenant('jig'),rods,query[locale],locale,{requireAll:true});
 assert.doesNotThrow(()=>r.parse(wire(negative,['evidence_0_0','evidence_1_0'])));
 assert.throws(()=>r.parse(wire(positive,['evidence_0_0','evidence_1_0'])),e=>catalogEvidenceReason(e)==='unverified_quality_inference');
});
for(const locale of ['ru','lv'])test(locale+': conjunction and ordinal fixes never allow swapped fibre percentages',()=>{
 const r=catalogReplyRequest(getTenant('dzijas'),yarn,query[locale],locale,{requireAll:true});
 const wrong=replies[locale].replace('75%','25%').replace(/25% (полиамида|poliamīda)/u,'75% $1');
 assert.throws(()=>r.parse(wire(wrong)),/catalog_quantity_binding/u);
});
for(const locale of ['ru','lv','en'])test(locale+': full Worker accepts four refs once and the existing budget stops the next attempt',async()=>{
 const {env,storage}=environment({TENANT_ID:'dzijas',NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'synthetic-test-key',DEMO_PASSWORD:'synthetic-evidence-password',TOTAL_BUDGET_MICRO_USD:'10000'});let paid=0;
 const worker=createWorker(async(url,options)=>{
  if(url==='https://api.openai.com/v1/responses'){paid++;const body=JSON.parse(options.body);assert.equal(body.text.format.schema.properties.answers.items.properties.evidence.maxItems,3);return Response.json(wire(replies[locale]));}
  const p=yarn.find(p=>p.url===url);assert(p,'only the two requested shop pages may be read');
  return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});
 });
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=()=>worker.fetch(request('/api/chat',{tenant:'dzijas',locale,message:query[locale]+' '+yarn.map(p=>p.url).join(' and ')},{headers:{cookie}}),env);
 const result=await(await send()).json();assert.equal(result.conversational,true,JSON.stringify(result));assert.equal(result.text,replies[locale]);assert.equal(result.sources.length,2);assert.equal(paid,1);assert.equal(storage.records.get('state').total,10000);
 const denied=await(await send()).json();assert.equal(denied.fallbackReason,'total_budget');assert.equal(denied.providerUsed,false);assert.equal(paid,1);assert.equal(storage.records.get('state').total,10000);
 assert.equal((await worker.fetch(request('/api/chat',{tenant:'jig',locale,message:'Compare products'},{headers:{cookie}}),env)).status,404);
});
