import test from 'node:test';import assert from 'node:assert/strict';
import {render} from '../src/core.js';import {getTenant} from '../src/kb.js';import {policyNextStep} from '../src/policy-next-step.js';
import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
for(const locale of ['ru','lv','en'])for(const id of ['return','return-process'])test(`Ceļotājs ${locale}/${id}: return instructions include verified contact without requesting PII in chat`,()=>{
 const result={ids:[id],kind:'answer',handoff:false},tenant=getTenant('celotajs'),step=policyNextStep(tenant,locale,result),out=render('celotajs',locale,result,'reference');
 assert(step.includes(tenant.contact.email));assert(out.text.includes(step));assert(out.text.includes(tenant.cards.find(c=>c.id===id)[locale]));assert.equal(out.text.split(tenant.contact.email).length,2);
 assert(out.sources.some(s=>s.url===tenant.sources.returns.url));assert.match(step,/исключени|izņēm|exceptions/u);assert.match(step,/демо-чат|demonstrācijas čat|demo chat/u);
});
test('return instructions never leak between tenants or into unrelated topics',()=>{
 for(const shop of ['anete','bariba','hobbyset','rotallieta','apavi40plus'])assert.equal(policyNextStep(getTenant(shop),'en',{ids:['return']}),'');
 for(const id of ['payment','delivery','defect','contact'])assert.equal(policyNextStep(getTenant('celotajs'),'en',{ids:[id]}),'');
});
for(const valid of [true,false])test('Ceļotājs server-owned next step survives '+(valid?'accepted prose':'rejected prose')+' without extra API calls',async()=>{
 const {env,storage}=environment({TENANT_ID:'celotajs',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-local-only',DEMO_PASSWORD:'return-steps-test-password'});let calls=0;
 const worker=createWorker(()=>{calls++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['return-process'],handoff:false,reply:valid?'Notify the shop within 14 calendar days after receiving the item. Return it within 14 days after notification.':'Return it within 999 days.'})}]}]});});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const r=await worker.fetch(request('/api/chat',{tenant:'celotajs',locale:'en',message:'Please explain how to return a purchase that I no longer need.'},{headers:{cookie}}),env),out=await r.json();
 assert.equal(r.status,200);assert.equal(out.providerUsed,true);assert.equal(calls,1);assert.equal(storage.records.get('state').total,10000);
 assert.equal(out.text.split('celotajs@veikalscelotajs.lv').length,2);assert(!out.text.includes('999'));
 if(valid)assert.equal(out.conversational,true);else assert.equal(out.validationReason,'unsupported_number');
});
