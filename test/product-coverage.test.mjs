import test from 'node:test';import assert from 'node:assert/strict';
import {auditCoverage} from '../scripts/audit-product-coverage.mjs';
import {referenceRoute,render} from '../src/core.js';import {getTenant} from '../src/kb.js';
import {conversationRequest} from '../src/conversation.js';
import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
const report=auditCoverage();
const output=(ids,reply)=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids,handoff:false,reply})}]}]});
for(const c of report.results)test('held-out product coverage: '+c.id,async()=>{
 assert.equal(c.contractMet,true,JSON.stringify(c));assert.equal(c.sourcesValid,true);
 const {env}=environment();let calls=0;
 const res=await createWorker(()=>{calls++;throw Error('No network in offline audit');}).fetch(request('/api/chat',{tenant:c.tenant,locale:c.locale,message:c.message}),env);
 assert.equal(res.status,200);const data=await res.json();assert.equal(data.locale,c.locale);assert.deepEqual(data.cardIds,c.cardIds);assert.equal(data.handoff,c.outcome==='review');assert.equal(calls,0);
 if(c.expected==='clarify'){assert.deepEqual(data.cardIds,[]);assert.doesNotMatch(data.text,/Necon|CooKing|HE0545|42801|POP ART/iu);}
});
for(const c of report.results.filter(c=>c.expected==='clarify'))test('AI enabled without evidence stays truthful and reserves nothing: '+c.id,async()=>{
 const {env,storage}=environment({TENANT_ID:c.tenant,AI_ENABLED:'true',AI_CONVERSATIONAL:'true',DEMO_PASSWORD:'synthetic-test-password',OPENAI_API_KEY:'test-only-fake-key',TOTAL_BUDGET_MICRO_USD:'10000'});let calls=0;
 const worker=createWorker(()=>{calls++;throw Error('Unmatched product must not generate facts');});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const res=await worker.fetch(request('/api/chat',{tenant:c.tenant,locale:c.locale,message:c.message},{headers:{cookie}}),env);
 assert.equal(res.status,200);const data=await res.json();assert.equal(data.providerUsed,false);assert.equal(calls,0);assert.equal(storage.records.get('state').total,0);assert.equal(data.handoff,false);assert.deepEqual(data.cardIds,[]);assert(data.text.length>15);assert.doesNotMatch(data.text,/у нас нет|we don't sell|mums nav/iu);
});
for(const tenant of ['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs'])for(const [locale,bad]of [
 ['ru','У нас нет таких товаров. Что вас интересует?'],['en',"We don't sell that product. Which brand do you want?"],['lv','Mums nav tādu preču. Kādu preci vēlaties?']
])test('a question mark cannot validate invented catalogue absence: '+tenant+'/'+locale,async()=>{
 const route=await conversationRequest(getTenant(tenant),'zzzz',null,locale);assert.equal(route.parse(output([],bad)).validationReason,'unsupported_catalog_absence');
});
for(const c of report.results.filter(c=>c.kind==='unknown-model'))test('model cannot borrow policy evidence to invent product facts: '+c.id,async()=>{
 const route=await conversationRequest(getTenant(c.tenant),c.message,null,c.locale);
 const result=route.parse(output(['delivery'],{ru:'У этой модели сменный фильтр. Нужна доставка?',en:'This model has a replaceable filter. Want delivery?',lv:'Šim modelim ir maināms filtrs. Vajag piegādi?'}[c.locale]));
 assert.equal(result.reply,null);assert.equal(result.validationReason,'product_evidence_missing');assert.deepEqual(result.ids,[]);
});
for(const [locale,message]of [['ru','Какой корм лучше подойдет для щенков'],['en','Which dry food is suitable for puppies?'],['lv','Kādu barību izvēlēties kucēniem?']])test('puppy selection returns relevant evidence even at exhausted budget: '+locale,async()=>{
 const {env,storage,guard}=environment({TENANT_ID:'bariba',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'test-only-key',DEMO_PASSWORD:'synthetic-test-password',TOTAL_BUDGET_MICRO_USD:'10000'});
 await guard.fetch(new Request('https://guard/check',{method:'POST',body:JSON.stringify({ip:'b'.repeat(64),kind:'chat',reserve:true})}));let calls=0;
 const w=createWorker(()=>{calls++;throw Error('Budget exhausted');});const login=await w.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const res=await w.fetch(request('/api/chat',{tenant:'bariba',locale,message},{headers:{cookie}}),env);assert.equal(res.status,200);const data=await res.json();assert.deepEqual(data.cardIds,['puppy-necon','puppy-cooking']);assert.match(data.text,/Necon Atletic Puppy/);assert.match(data.text,/CooKing/);assert.equal(data.sources.length,2);assert.equal(data.providerUsed,false);assert.equal(calls,0);assert.equal(storage.records.get('state').total,10000);
});
for(const message of ['Which food is best for puppies?','Какой корм для щенков?','Kāda barība kucēniem?'])test('AI cannot omit all puppy evidence or replace it with adult food: '+message,async()=>{
 const r=await conversationRequest(getTenant('bariba'),message,null,'en');
 assert.equal(r.parse(output([],'Which brand do you mean?')).validationReason,'selection_evidence_missing');
 assert.equal(r.parse(output(['food-stage'],'CooKing Lamb is adult food.')).reply,null);
 const good='Bariba lists Necon Atletic Puppy in a 15 kg pack and CooKing Puppies in a 12 kg pack. These examples do not establish individual suitability. How old is your puppy?';
 assert.equal(r.parse(output(['puppy-necon','puppy-cooking'],good)).reply,good);
});
for(const message of ['Royal Canin puppy ingredients?','Какой корм для щенка без курицы?','Kāda barība kucēnam ar alerģiju?','Necon Puppy price today?','Which food for kittens?'])test('puppy examples cannot override another brand, constraint or live price: '+message,()=>{
 const r=referenceRoute(message,null,'bariba');assert(!r.ids.some(id=>id.startsWith('puppy-')));assert(!render('bariba','en',r,'reference').text.includes('Necon Atletic Puppy'));
});
for(const [tenant,previous,message]of [['bariba','food-stage','And Royal Canin ingredients?'],['hobbyset','art-beginner','And Example-X paint colours?'],['apavi40plus','shoe-width','And Acme insole?'],['rotallieta','toy-age','And Example-X batteries?'],['celotajs','sleep-ratings','And Example-X sleeping bag weight?']])test('a named new product never inherits the previous model: '+tenant,()=>assert.deepEqual(referenceRoute(message,previous,tenant).ids,[]));
test('coverage report separates useful facts from clarifications and never claims full catalogue coverage',()=>{
 assert.equal(report.modelCalls,0);assert.equal(report.totals.contractFailures,0);assert(report.totals.clarificationOnly>0);assert(report.shops.every(s=>s.fullCatalogueConnected===false));assert.equal(report.shops.find(s=>s.tenant==='anete').productEvidenceCards,0);
});
for(const tenant of ['anete','hobbyset','apavi40plus','rotallieta','celotajs'])test('new Bariba catalogue evidence cannot leak into '+tenant,async()=>{
 const route=await conversationRequest(getTenant(tenant),'Which food is best for puppies?',null,'en');
 assert(!JSON.stringify(route.body).includes('Necon Atletic Puppy'));
 assert.throws(()=>route.parse(output(['puppy-necon'],'Necon Atletic Puppy is puppy food.')),/schema/);
 assert(!getTenant(tenant).sources['puppy-necon']);
});
