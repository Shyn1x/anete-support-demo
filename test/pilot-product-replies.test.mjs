import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getTenant} from '../src/kb.js';
import {catalogReplyRequest,catalogEvidenceReason} from '../src/catalog-reply.js';
import {knownCatalogDetails} from '../src/catalog-evidence.js';
import {retrievalFallback} from '../src/catalog-service.js';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
const samples=JSON.parse(await readFile(new URL('./fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const products=id=>samples.filter(p=>p.tenant===id).slice(0,2).map(p=>({...p,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'}));
const queries={ru:'Сравни материал и вес.',lv:'Salīdzini materiālu un svaru.',en:'Compare material and weight.'};
const yarnReplies={ru:['Вес — 50 г, состав — 100% шерсть.','Вес — 100 г, состав — 75% шерсть и 25% полиамид.'],lv:['Svars ir 50 g, sastāvs ir 100% vilna.','Svars ir 100 g, sastāvs ir 75% vilna un 25% poliamīds.'],en:['It weighs 50 g and contains 100% wool.','It weighs 100 g and contains 75% wool and 25% polyamide.']};
const rodReply={ru:'Материал бланка — графит IM9 от TORAY. Масса удилища не подтверждена.',lv:'Blankas materiāls ir IM9 grafīts no TORAY. Kāta svars nav apstiprināts.',en:'The blank uses IM9 graphite from TORAY. The rod weight is unconfirmed.'};
const unknown={ru:'Материал и вес не подтверждены в описании.',lv:'Materiāls un svars aprakstā nav apstiprināti.',en:'The material and weight are unconfirmed in the description.'};
const wire=replies=>({answers:replies.map((reply,i)=>({id:'catalog:'+i,reply,evidence:['evidence_'+i+'_0','evidence_'+i+'_1']}))});
const response=out=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
const route=(id,locale='en',ps=products(id))=>catalogReplyRequest(getTenant(id),ps,queries[locale],locale,{requireAll:true});
for(const locale of ['ru','lv','en']){
 test(locale+': explicit product IDs ground short yarn replies without relying on model-name or ordinal matching',()=>{
  const r=route('dzijas',locale),ps=products('dzijas'),out=r.parse(response(wire(yarnReplies[locale])));
  assert.deepEqual(out.ids,['catalog:0','catalog:1']);
  assert.equal(out.text,ps.map((p,i)=>p.title+'\n'+yarnReplies[locale][i]).join('\n\n'));
  const schema=r.body.text.format.schema;assert.deepEqual(schema.required,['answers']);assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.answers.maxItems,2);assert.equal(schema.properties.answers.items.additionalProperties,false);
  assert.equal(schema.properties.answers.minItems,2,'the provider schema must cover both products for a comparison');
  assert.equal(schema.properties.answers.items.properties.evidence.maxItems,3);assert.equal(r.body.store,false);assert.equal(r.body.max_output_tokens,450);
  assert.match(r.body.instructions,/Each reply describes ONLY its own product ID/u);
  assert(!r.body.instructions.includes('Refer consistently to the first product'));
 });
 test(locale+': rods retain a verified material without turning casting-test title numbers into rod mass',()=>{
  const r=route('jig',locale),out=wire([rodReply[locale],rodReply[locale]]);assert(r.parse(response(out)).text.includes(rodReply[locale]));
 });
 test(locale+': a rejected or capped JIG comparison preserves exact verified blank material and states unknown rod weight',()=>{
  const ps=products('jig'),text=retrievalFallback({products:ps,readFailures:0},{requireAll:true,candidates:ps,index:{tenant:'jig'}},queries[locale],locale);
  assert.equal((text.match(/IM9/g)||[]).length,4,'two literal titles and two independently confirmed descriptions');
  assert.equal((text.match(/TORAY/g)||[]).length,4);
  assert.match(text,/Масса самого удилища|Paša kāta svars|rod itself has no confirmed weight/u);
  assert(!/The rod weighs|Вес удилища:|Kāta svars:/u.test(text));
 });
}
for(const id of ['dzijas','jig','musiclab','etextile','zummers'])for(const locale of ['ru','lv','en'])test(id+'/'+locale+': the same explicit ownership protocol accepts a bounded unknown answer',()=>{
 const ps=products(id),r=route(id,locale),out=wire([unknown[locale],unknown[locale]]);
 out.answers.forEach(a=>a.evidence=a.evidence.slice(0,1));
 assert.equal(r.parse(response(out)).ids.length,2);
 assert.equal(new TextEncoder().encode(JSON.stringify(r.body)).length<=22000,true);
});
for(const [name,mutate,reason]of [
 ['missing model',o=>o.answers.pop(),'catalog_comparison_omitted'],
 ['unknown model',o=>o.answers[0].id='catalog:99','schema'],
 ['duplicate model',o=>o.answers[1].id='catalog:0','schema'],
 ['extra root key',o=>o.extra='ignored?','schema'],
 ['extra item key',o=>o.answers[0].extra='ignored?','schema'],
 ['missing ref',o=>o.answers[0].evidence=[],'missing_for_product'],
 ['foreign ref',o=>o.answers[0].evidence=['evidence_1_0'],'wrong_product'],
 ['unknown ref',o=>o.answers[0].evidence=['evidence_99_0'],'unknown_reference'],
 ['duplicate ref',o=>o.answers[0].evidence=['evidence_0_0','evidence_0_0'],'duplicate_reference'],
 ['too many refs',o=>o.answers[0].evidence=['evidence_0_0','evidence_0_1','evidence_0_2','evidence_0_3'],'too_many_references'],
 ['swapped weight',o=>o.answers[0].reply='It weighs 100 g.','catalog_quantity_binding'],
 ['swapped fibre',o=>o.answers[0].reply='It contains polyamide.','catalog_material_qualification'],
 ['invented number',o=>o.answers[0].reply='It weighs 999 g.','unsupported_number'],
 ['unit change',o=>o.answers[0].reply='It weighs 50 kg.','catalog_quantity_binding'],
 ['percentage change',o=>o.answers[1].reply='It contains 25% wool and 75% polyamide.','catalog_quantity_binding'],
 ['false action',o=>o.answers[0].reply='I have forwarded your request.','pretended_action'],
 ['contact leak',o=>o.answers[0].reply='Write to private@example.invalid.','links_contacts_or_internal_text'],
 ['quality assurance',o=>o.answers[0].reply='The wool ensures high quality.','unverified_quality_inference'],
 ['collective ownership',o=>o.answers[0].reply='Both yarns contain 100% wool.','cross_product_reply'],
 ['ordinal ownership',o=>o.answers[0].reply='The second yarn contains 100% wool.','cross_product_reply'],
 ['named other model',o=>o.answers[0].reply=products('dzijas')[1].title+' contains 100% wool.','cross_product_reply']
])test('product-scoped reply still rejects '+name,()=>{
 const r=route('dzijas'),out=wire(yarnReplies.en);mutate(out);
 assert.throws(()=>r.parse(response(out)),e=>e.message===reason||catalogEvidenceReason(e)===reason);
});
test('reordering entries never changes ownership or source display order',()=>{
 const out=wire(yarnReplies.en);out.answers.reverse();const result=route('dzijas').parse(response(out));
 assert.deepEqual(result.ids,['catalog:0','catalog:1']);assert(result.text.indexOf('DROPS SAGA')<result.text.indexOf('Grundl'));
});
test('casting range remains a role mismatch in a product-scoped reply',()=>{
 const out=wire(['The rod weighs 18 g.',rodReply.en]);
 assert.throws(()=>route('jig').parse(response(out)),e=>catalogEvidenceReason(e)==='measurement_role_mismatch');
});
test('single-product preview and the six original clients keep the previous wire shape',()=>{
 const ps=products('dzijas');assert.equal(catalogReplyRequest(getTenant('dzijas'),ps.slice(0,1),'weight','en').body.text.format.schema.properties.answers,undefined);
 for(const id of ['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs']){const r=catalogReplyRequest(getTenant(id),ps,'Compare','en');assert.equal(r.body.text.format.schema.properties.answers,undefined);assert.throws(()=>r.parse(response(wire(yarnReplies.en))),/schema/u);}
});
test('rod fallback reader opts in and rejects missing, negated, conflicting or title-only specifications',()=>{
 const p=products('jig')[0],opts={includeRodBlank:true};
 assert.equal(knownCatalogDetails(p,'material','en').length,0);
 assert.equal(knownCatalogDetails(p,'material','en',opts).length,1);
 for(const lines of [[],['Blanka nav no IM9 japāņu ražotāja TORAY grafīta.'],['Blanka no IM9 japāņu ražotāja TORAY grafīta.','Blanka no stiklšķiedras.'],['Blanka no IM9 japāņu ražotāja TORAY grafīta.','Materiāls: stiklšķiedra']])assert.equal(knownCatalogDetails({...p,lines},'material','en',opts).length,0);
});
for(const locale of ['ru','lv','en'])test(locale+': Worker sends one scoped generation, preserves two sources and respects the existing exhausted budget',async()=>{
 const ps=products('dzijas'),{env,storage}=environment({TENANT_ID:'dzijas',NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'synthetic-test-key',DEMO_PASSWORD:'synthetic-scoped-password',TOTAL_BUDGET_MICRO_USD:'10000'});let calls=0;
 const worker=createWorker(async(url,options)=>{
  if(url==='https://api.openai.com/v1/responses'){calls++;const body=JSON.parse(options.body);assert.deepEqual(body.text.format.schema.required,['answers']);return Response.json(response(wire(yarnReplies[locale])));}
  const p=ps.find(p=>p.url===url);assert(p);return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});
 });
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=()=>worker.fetch(request('/api/chat',{tenant:'dzijas',locale,message:queries[locale]+' '+ps.map(p=>p.url).join(' and ')},{headers:{cookie}}),env);
 const a=await(await send()).json();assert.equal(a.conversational,true,JSON.stringify(a));assert.equal(a.sources.length,2);assert.equal(calls,1);assert.equal(storage.records.get('state').total,10000);
 const b=await(await send()).json();assert.equal(b.fallbackReason,'total_budget');assert.equal(b.providerUsed,false);assert.equal(calls,1);
 assert.equal((await worker.fetch(request('/api/chat',{tenant:'jig',locale,message:'Compare'},{headers:{cookie}}),env)).status,404);
});
