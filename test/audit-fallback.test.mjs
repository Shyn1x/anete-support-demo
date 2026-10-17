import test from 'node:test';import assert from 'node:assert/strict';
import {createWorker} from '../src/worker.js';import {getTenant,tenants} from '../src/kb.js';
import {referenceRoute,safeFallbackRoute} from '../src/core.js';import {conversationRequest} from '../src/conversation.js';import {environment,request} from './helpers.mjs';
const cases={
 ru:{message:'Посылка пришла порванной, обувь мокрая',reply:'Сообщите о повреждении в течение 999 дней.',human:'Мне нужен сотрудник',vague:'Нужна помощь с полученным отправлением'},
 en:{message:'Parcel was torn and the shoes got wet',reply:'Please report the damage within 999 days.',human:'I need a human',vague:'I need help with the item I received'},
 lv:{message:'Saņēmu saplēstu sūtījumu',reply:'Par bojājumu ziņojiet 999 dienu laikā.',human:'Vēlos runāt ar darbinieku',vague:'Vajadzīga palīdzība ar saņemto preci'}
};
const output=(ids,reply,handoff=true)=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids,handoff,reply})}]}]});
async function invoke(tenant,locale,message,response,envVars={}){
 const {env,storage}=environment({TENANT_ID:tenant,DEMO_PASSWORD:'synthetic-password-for-tests',OPENAI_API_KEY:'test-only',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',...envVars});let calls=0;
 const worker=createWorker(async()=>{calls++;return response();});const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);const cookie=login.headers.get('set-cookie').split(';')[0];
 const res=await worker.fetch(request('/api/chat',{tenant,locale,message},{headers:{cookie}}),env);return {res,data:await res.json(),calls,storage};
}
for(const tenant of Object.keys(tenants))for(const locale of ['ru','lv','en']){
 test(`${tenant}/${locale}: rejected invented number preserves damage and human review`,async()=>{const c=cases[locale],r=await invoke(tenant,locale,c.message,()=>Response.json(output(['defect'],c.reply)));assert.equal(r.res.status,200);assert.equal(r.data.validationReason,'unsupported_number');assert.equal(r.data.handoff,true);assert(r.data.cardIds.includes('defect'));assert(!r.data.text.includes('999'));assert.equal(r.calls,1);assert.equal(r.storage.records.get('state').total,10000);const t=getTenant(tenant);assert(r.data.sources.every(s=>Object.values(t.sources).some(x=>x.url===s.url)));assert.equal(r.data.contact.email,t.contact.email);});
 test(`${tenant}/${locale}: malformed provider output still hands off known damage`,async()=>{const r=await invoke(tenant,locale,cases[locale].message,()=>Response.json({status:'incomplete'}));assert.equal(r.data.handoff,true);assert(r.data.cardIds.includes('defect'));assert.equal(r.data.validationReason,'incomplete');assert.equal(r.calls,1);});
 test(`${tenant}/${locale}: explicit human request is free`,async()=>{const r=await invoke(tenant,locale,cases[locale].human,()=>{throw Error('provider must not be called');});assert.equal(r.data.handoff,true);assert(r.data.cardIds.includes('contact'));assert.equal(r.calls,0);assert.equal(r.storage.records.get('state').total,0);});
 test(`${tenant}/${locale}: exhausted budget preserves damage without provider`,async()=>{const r=await invoke(tenant,locale,cases[locale].message,()=>{throw Error('must not call');},{TOTAL_BUDGET_MICRO_USD:'1'});assert.equal(r.data.handoff,true);assert(r.data.cardIds.includes('defect'));assert.equal(r.data.fallbackReason,'total_budget');assert.equal(r.calls,0);assert.equal(r.storage.records.get('state').total,0);});
}
for(const locale of ['ru','lv','en'])test(`${locale}: safe semantic defect survives unknown deterministic route`,async()=>{const r=await invoke('apavi40plus',locale,cases[locale].vague,()=>Response.json(output(['defect'],cases[locale].reply)));assert.equal(r.data.validationReason,'unsupported_number');assert(r.data.cardIds.includes('defect'));assert.equal(r.data.handoff,true);assert(!r.data.text.includes('999'));});
test('wrong model topic cannot override explicit damage',async()=>{const t=getTenant('apavi40plus'),r=await conversationRequest(t,'My parcel is damaged',null,'en');const result=r.parse(output(['delivery'],'Delivery options are available.',false));assert.equal(result.validationReason,'mandatory_topic_mismatch');assert.deepEqual(result.ids,['defect']);assert.equal(result.handoff,true);});
test('fallback filters foreign IDs and uses only own contact when escalation has no safe topic',()=>{const t=getTenant('bariba'),ref={ids:[],kind:'unknown',handoff:false};const result=safeFallbackRoute(t,ref,{ids:['not-a-card','toy-batteries'],handoff:true});assert.deepEqual(result.ids,['contact']);assert.equal(result.handoff,true);});
test('clear canonical Cyrillic complaint is already recognised on the baseline route',()=>{assert.equal(referenceRoute('Посылка пришла повреждённой, я очень недоволен. Что делать?',null,'apavi40plus').handoff,true);});
for(const [message,id] of [['My parcel is damaged','defect'],['Мне нужен сотрудник','contact'],['Vēlos runāt ar darbinieku','contact']])test('prior product sizing and pasted product link cannot hide support intent: '+message,()=>{const route=referenceRoute(message+' https://apavi40plus.com/products/unlisted-example','product-sizing','apavi40plus');assert.deepEqual(route.ids,[id]);assert.equal(route.handoff,true);});

const dispatchOffers={
 ru:'Если посылка пришла повреждённой, рекомендуется связаться напрямую с магазином Veikals Ceļotājs для обсуждения вашей ситуации и возможного гарантийного покрытия. Я могу помочь передать запрос специалистам магазина.',
 en:'I am sorry your parcel arrived damaged. I can help forward your request to the shop team.',
 lv:'Man žēl, ka sūtījums ir bojāts. Es varu palīdzēt nosūtīt pieprasījumu veikala darbiniekam.'
};
for(const tenant of Object.keys(tenants))for(const locale of ['ru','lv','en'])test(`${tenant}/${locale}: unimplemented dispatch offer is rejected and falls back to own shop`,async()=>{
 const r=await invoke(tenant,locale,cases[locale].message,()=>Response.json(output(['defect'],dispatchOffers[locale])));
 assert.equal(r.res.status,200);assert.equal(r.data.validationReason,'unsupported_handoff_action');assert.equal(r.data.mode,'reference');assert.equal(r.data.handoff,true);assert(r.data.cardIds.includes('defect'));assert.equal(r.data.contact.email,getTenant(tenant).contact.email);assert(!r.data.text.includes(dispatchOffers[locale]));assert.equal(r.calls,1);assert.equal(r.storage.records.get('state').total,10000);
});
