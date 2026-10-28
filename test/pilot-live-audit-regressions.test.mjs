import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalDecimal} from '../src/decimal-evidence.js';
import {getTenant,tenants} from '../src/kb.js';
import {referenceRoute,followupRoute,aiRoute,safeFallbackRoute,cardRequiresReview} from '../src/core.js';
import {conversationRequest,replyValidationReason} from '../src/conversation.js';
import {catalogReplyRequest,catalogEvidenceReason} from '../src/catalog-reply.js';
import {retrievalFallback} from '../src/catalog-service.js';
import {knownCatalogDetails} from '../src/catalog-evidence.js';
import {catalogMeasurementReason} from '../src/catalog-measurements.js';
import {assessPilotLive,pilotLivePlan} from '../scripts/run-pilot-live.mjs';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
const samples=JSON.parse(await readFile(new URL('./fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const model=out=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
const product=p=>({...p,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'});
const music=samples.filter(p=>p.tenant==='musiclab').slice(0,2).map(product);
const locales=['ru','lv','en'];
const weightReply={ru:'Указанный вес — 8,5 кг.',lv:'Norādītais svars: 8,5 kg.',en:'The listed weight is 8.5 kg.'};
const query={ru:'Какой вес указан?',lv:'Kāds ir norādītais svars?',en:'What weight is listed?'};

test('decimal equivalence removes only insignificant fractional zeros without floating point',()=>{
 for(const [a,b] of [['8.500000','8.5'],['8,5000','8.5'],['10.000','10'],['9007199254740993.10000','9007199254740993.1'],['0001','0001'],['12:30','12:30'],['1.2.3','1.2.3']])assert.equal(canonicalDecimal(a),b);
 assert.notEqual(canonicalDecimal('8.500001'),canonicalDecimal('8.5'));
 assert.notEqual(canonicalDecimal('8.499999'),canonicalDecimal('8.5'));
});
for(const locale of locales){
 test('MusicLab '+locale+': exact 8.500000 kg is accepted as 8.5 in the complete catalog parser',()=>{
  const route=catalogReplyRequest(getTenant('musiclab'),music.slice(0,1),query[locale],locale);
  assert.equal(route.parse(model({ids:['catalog:0'],reply:weightReply[locale],evidence:['evidence_0_0']})).text,weightReply[locale]);
  assert.equal(catalogMeasurementReason(weightReply[locale],music.slice(0,1)),null);
 });
 test('MusicLab '+locale+': changed value and changed unit are still rejected',()=>{
  const route=catalogReplyRequest(getTenant('musiclab'),music.slice(0,1),query[locale],locale);
  for(const reply of [weightReply[locale].replace(/8[,.]5/u,'8.6'),weightReply[locale].replace(/кг|kg/u,locale==='ru'?'г':'g')])assert.throws(()=>route.parse(model({ids:['catalog:0'],reply,evidence:['evidence_0_0']})),/unsupported_number|catalog_quantity_binding/u);
 });
 test('pilot shipping '+locale+': ordinary fees need no review but damage and human requests retain it',async()=>{
  for(const id of ['dzijas','musiclab','etextile','zummers']){
   const tenant=getTenant(id),card=tenant.cards.find(c=>c.id==='shipping-cost');
   const text={ru:'Сколько стоит доставка?',lv:'Cik maksā piegāde?',en:'How much is delivery?'}[locale];
   assert.equal(cardRequiresReview(tenant,'shipping-cost'),false);
   const route=await conversationRequest(tenant,text,null,locale);
   const out=route.parse(model({ids:['shipping-cost'],handoff:false,reply:card[locale]}));
   assert.equal(out.handoff,false,id);assert.equal(out.reply,card[locale],id);
   assert.equal(followupRoute({ru:'А сколько это стоит?',lv:'Cik tas maksā?',en:'How much is it?'}[locale],'delivery',id).handoff,false);
   assert.equal(safeFallbackRoute(tenant,{ids:['delivery'],kind:'answer',handoff:false},{ids:['shipping-cost'],handoff:false}).handoff,false);
   for(const message of [{ru:'Посылка пришла сломанной',lv:'Prece ir bojāta',en:'The parcel is damaged'}[locale],{ru:'Мне нужен сотрудник',lv:'Vajag darbinieku',en:'I need a human'}[locale]])assert.equal(referenceRoute(message,null,id).handoff,true);
  }
 });
}
test('original six shipping-review rules and numeric validation remain unchanged',()=>{
 for(const tenant of Object.values(tenants)){
  assert.equal(cardRequiresReview(tenant,'shipping-cost'),true);
  const virtual={...tenant,cards:[{id:'test',topic:'product',source:'catalog-read',ru:'Вес: 8.500000 кг',en:'Weight: 8.500000 kg',lv:'Svars: 8.500000 kg'}]};
  assert.equal(replyValidationReason('The weight is 8.5 kg.',{ids:['test']},virtual,'en'),'unsupported_number');
 }
});
test('two product comparison still cannot copy the other product weight or interpret casting test as rod mass',()=>{
 const heavier=product(samples.find(p=>p.tenant==='musiclab'&&p.lines[0].includes('10.440000')));
 const route=catalogReplyRequest(getTenant('musiclab'),[music[0],heavier],'Compare weight','en',{requireAll:true});
 const reply=music[0].title+' weighs 10.44 kg. '+heavier.title+' weighs 8.5 kg.';
 assert.throws(()=>route.parse(model({ids:['catalog:0','catalog:1'],reply,evidence:['evidence_0_0','evidence_1_0']})),/catalog_quantity_binding/);
 const rod=product(samples.find(p=>p.tenant==='jig'));
 const r=catalogReplyRequest(getTenant('jig'),[rod],'What is its weight?','en');
 assert.throws(()=>r.parse(model({ids:['catalog:0'],reply:'The rod weighs 18 g.',evidence:['evidence_0_0']})),/catalog_quantity_binding/);
});
test('catalog source references remain strict and excessive reference counts have a distinct safe diagnostic',()=>{
 const pair=samples.filter(p=>p.tenant==='dzijas').slice(0,2).map(product),route=catalogReplyRequest(getTenant('dzijas'),pair,'Compare material and weight','en',{requireAll:true});
 assert.equal(route.body.text.format.schema.properties.evidence.items.type,'string');
 const out={ids:['catalog:0','catalog:1'],reply:'The requested details are unconfirmed.',evidence:['evidence_999_0','evidence_1_0']};
 assert.throws(()=>route.parse(model(out)),e=>catalogEvidenceReason(e)==='unknown_reference');
 out.evidence=['evidence_0_0','evidence_0_1','evidence_0_2','evidence_0_3','evidence_1_0'];
 assert.throws(()=>route.parse(model(out)),e=>catalogEvidenceReason(e)==='too_many_references');
 out.evidence=['evidence_0_0','evidence_0_1'];
 assert.throws(()=>route.parse(model(out)),e=>catalogEvidenceReason(e)==='missing_for_product');
});
test('eTextile garment hardware is not mistranslated as furniture; genuine upholstery products stay possible',()=>{
 const press=product(samples.find(p=>p.tenant==='etextile')),tenant=getTenant('etextile');
 const r=catalogReplyRequest(tenant,[press],'What about the material?','en');
 assert(r.body.instructions.includes('garment hardware or findings, not furniture'));
 assert.throws(()=>r.parse(model({ids:['catalog:0'],reply:'The material of this furniture press is not specified.',evidence:['evidence_0_0']})),/catalog_unsupported_detail/);
 assert.equal(r.parse(model({ids:['catalog:0'],reply:'The material of this hardware-setting press is not specified.',evidence:['evidence_0_0']})).ids[0],'catalog:0');
 const upholstery=product(samples.find(p=>p.title==='Preses uzgaļi mēbeļu pogām'));
 assert.doesNotThrow(()=>catalogReplyRequest(tenant,[upholstery],'What is it?','en').parse(model({ids:['catalog:0'],reply:'These are press dies for furniture buttons.',evidence:['evidence_0_0']})));
});
test('assessment accepts exact policy aliases but preserves real handoff, missing topic and generation failures',async()=>{
 const plan=await pilotLivePlan(),c=plan.find(c=>c.id==='dzijas-live-01'),a={locale:'ru',text:'Доставка',cardIds:['shipping-cost'],handoff:false,providerUsed:true,conversational:true};
 assert.equal(assessPilotLive(c,a,200).pass,true);
 assert(assessPilotLive(c,{...a,handoff:true},200).issues.includes('unnecessary-shop-review'));
 assert(assessPilotLive(c,{...a,cardIds:['payment']},200).issues.includes('missing-topic:delivery'));
 const comparison=plan.find(c=>c.id==='dzijas-live-05');
 assert(assessPilotLive(comparison,{...a,locale:'en',fallbackReason:'answer_validation',validationReason:'catalog_evidence_quote'},200).issues.includes('generated-answer-required:catalog_evidence_quote'));
});
for(const valid of [true,false])test('real Worker: '+(valid?'compact decimal succeeds':'invented weight fails safely')+' with one provider call and one retained reservation',async()=>{
 const {env,storage}=environment({TENANT_ID:'musiclab',NEXT_BATCH_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'fake-unit-key',DEMO_PASSWORD:'synthetic-pilot-audit-password',TOTAL_BUDGET_MICRO_USD:'10000'});let calls=0;
 const p=music[0];const worker=createWorker(async url=>{
  if(url==='https://api.openai.com/v1/responses'){calls++;return Response.json(model({ids:['catalog:0'],reply:valid?weightReply.ru:'Вес — 999 кг.',evidence:['evidence_0_0']}));}
  assert.equal(url,p.url);return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:p.title,url:p.url,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});
 });
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=()=>worker.fetch(request('/api/chat',{tenant:'musiclab',locale:'ru',message:query.ru+' '+p.url},{headers:{cookie}}),env);
 const result=await(await send()).json();assert.equal(result.conversational,valid?true:undefined);assert.equal(result.providerUsed,true);assert.equal(calls,1);assert.equal(storage.records.get('state').total,10000);
 if(!valid){assert.equal(result.validationReason,'unsupported_number');assert(!result.text.includes('999'));}
 const denied=await(await send()).json();assert.equal(denied.fallbackReason,'total_budget');assert.equal(calls,1);assert.equal(storage.records.get('state').total,10000);
});

for(const locale of locales)test('pilot '+locale+': rejected generation retains a literal weight instead of discarding known facts',()=>{
 const loaded={products:music,candidates:[],readFailures:0},plan={index:{tenant:'musiclab'},requireAll:true,candidates:music};
 const answer=retrievalFallback(loaded,plan,'Compare material and weight',locale);
 assert.equal(answer.split('8.5').length,3);assert(answer.includes(music[0].title));assert(answer.includes(music[1].title));
 const noMass=product(samples.find(p=>p.tenant==='jig'));
 assert(!knownCatalogDetails(noMass,'weight',locale,{includeWeight:true}).some(d=>d.field==='weight'));
 const conflict={...music[0],lines:['Svars: 8.500000 kg','Svars: 9 kg']};
 assert(!knownCatalogDetails(conflict,'weight',locale,{includeWeight:true}).some(d=>d.field==='weight'));
 assert.equal(knownCatalogDetails(music[0],'weight',locale).length,0,'original six callers do not opt in');
});
