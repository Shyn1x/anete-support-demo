import test from 'node:test';
import assert from 'node:assert/strict';
import {pilotBuyerCases,assessPilotBuyer,auditPilotBuyers} from '../scripts/audit-pilot-buyers.mjs';
import {catalogMeasurementReason} from '../src/catalog-measurements.js';
import {referenceRoute,preflight} from '../src/core.js';
import {getTenant} from '../src/kb.js';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
test('100 customer requests use the actual Worker, keep source isolation and never call external services',async()=>{
 const report=await auditPilotBuyers();assert.equal(report.total,100);assert.equal(report.providerCalls,0);assert.equal(report.forbiddenNetworkAttempts,0);
 assert.deepEqual(report.rows.filter(r=>!r.assessment.pass).map(r=>({id:r.id,question:r.question,issues:r.assessment.issues,answer:r.answer})),[]);
});
test('audit cases and evaluator reject regressions instead of merely counting completed requests',()=>{
 const cases=pilotBuyerCases();assert.equal(new Set(cases.map(c=>c.id)).size,100);
 for(const c of cases){const clean={locale:c.locale,text:c.kind==='social'?'Bye 🙂':'Safe sample response',cardIds:c.cards,handoff:c.kind==='handoff',mode:c.kind==='privacy'?'safety':c.kind==='social'?'social':'reference',sources:[]};
  assert.equal(assessPilotBuyer(c,{...clean,text:''}).pass,false);assert.equal(assessPilotBuyer(c,clean,503).pass,false);
  assert.equal(assessPilotBuyer(c,{...clean,locale:'wrong'}).pass,false);
  if(c.cards.length)assert.equal(assessPilotBuyer(c,{...clean,cardIds:[]}).pass,false);
  if(c.kind==='handoff')assert.equal(assessPilotBuyer(c,{...clean,handoff:false}).pass,false);
  if(c.kind==='social')assert.equal(assessPilotBuyer(c,{...clean,text:'Bye! How can I help?'}).pass,false);
 }
});
for(const tenant of ['dzijas','jig','musiclab','etextile','zummers']){
 test(`${tenant}: human/status priority, negative requests and no speculative product facts`,()=>{
  for(const q of ['I want an employee to help','Please find an employee for me','Please get an employee'])assert.deepEqual(referenceRoute(q,null,tenant).ids,['contact']);
  assert.ok(!referenceRoute('I do not want an employee',null,tenant).ids.includes('contact'));
  for(const q of ['Kur ir mans pasūtījums ar mikrofonu?','Where is my order with the yarn?','Где мой заказ с пряжей?'])assert.deepEqual(referenceRoute(q,null,tenant).ids,['status']);
  assert.deepEqual(referenceRoute('Can I collect my yarn in Valmiera?',null,tenant).ids,['pickup']);
  assert.equal(preflight('password=not-a-real-password',tenant),'pii');
 });
 test(`${tenant}: rejected generation retains the matched niche clarification`,async()=>{
  const c=pilotBuyerCases().find(c=>c.tenant===tenant&&c.group==='niche');let provider=0;
  const {env}=environment({TENANT_ID:tenant,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-pilot-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-only-key'});
  env.ASSETS={fetch:async()=>Response.json({tenant,products:[],importedAt:'2026-10-25'})};
  const worker=createWorker(async()=>{provider++;return Response.json({status:'incomplete'});});
  const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('set-cookie').split(';')[0];
  const res=await worker.fetch(request('/api/chat',{tenant,locale:c.locale,message:c.message},{headers:{cookie}}),env),answer=await res.json();
  assert.equal(res.status,200);assert.equal(provider,1);assert.equal(answer.fallbackReason,'answer_validation');assert.equal(answer.validationReason,'incomplete');assert.deepEqual(answer.cardIds,c.cards);
  assert.equal(answer.text,getTenant(tenant).cards.find(card=>card.id===c.cards[0])[c.locale]);
 });
}
const yarn=[{title:'DROPS SAGA',lines:['Svars: 50 g','Garums: 100m']}];
for(const reply of ['Вес мотка — 50 г, длина нити — 100 м.','The weight is 50 g and the length is 100 m.','Svars ir 50 g, garums ir 100 m.'])test('valid weight and length in one sentence: '+reply,()=>assert.equal(catalogMeasurementReason(reply,yarn),null));
for(const reply of ['Вес мотка — 100 г, длина нити — 50 м.','The weight is 100 m and the length is 50 g.','Svars ir 100 g, garums ir 50 m.'])test('swapped measurement values or roles still fail: '+reply,()=>assert.equal(catalogMeasurementReason(reply,yarn),'catalog_quantity_binding'));
