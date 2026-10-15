import test from 'node:test';import assert from 'node:assert/strict';
import {contactAction,mountContactChoices,contactUI} from '../public/contact.js';import {getTenant} from '../src/kb.js';import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
const contact=getTenant('anete').contact;
for(const locale of ['ru','lv','en']){
 test(`email draft encodes subject and category summary ${locale}`,()=>{
  const action=contactAction(contact,'email',locale,'DEMO: warranty & return? #fictional\nNo details');const url=new URL(action.href);
  assert.equal(url.protocol,'mailto:');assert.equal(url.pathname,'info@anete.lv');assert.equal(url.searchParams.get('subject'),contactUI[locale].subject);assert.ok(url.searchParams.get('body').includes('warranty & return? #fictional'));assert.equal(url.searchParams.size,2);assert.ok(!url.searchParams.has('cc'));assert.ok(!url.searchParams.has('bcc'));
 });
 test(`phone uses international number and published support hours ${locale}`,()=>{const action=contactAction(contact,'call',locale);assert.equal(action.href,'tel:+37120013727');assert.ok(action.preview.includes('09:00–17:00'));});
 test(`channel choice only reveals link and Back removes it ${locale}`,()=>{
  // Tiny DOM adapter exercises the actual event handlers without navigation or external apps.
  const elements=new Map();for(const id of ['contact-step','contact-open','contact-warning','choose-email','choose-call','contact-note','contact-preview','contact-back'])elements.set(id,{hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
  const root={querySelector:id=>elements.get(id.slice(1))},q=id=>elements.get(id);
  mountContactChoices(root,contact,locale,'DEMO — warranty');assert.equal(q('contact-step').hidden,true);assert.equal(q('contact-open').attrs.href,undefined);
  q('choose-call').onclick();assert.equal(q('contact-step').hidden,false);assert.equal(q('contact-open').attrs.href,'tel:+37120013727');assert.equal(q('contact-open').textContent,contactUI[locale].openCall);
  q('contact-back').onclick();assert.equal(q('contact-step').hidden,true);assert.equal(q('contact-open').attrs.href,undefined);
  q('choose-email').onclick();assert.ok(q('contact-open').attrs.href.startsWith('mailto:info@anete.lv?'));assert.ok(q('contact-preview').textContent.includes('DEMO — warranty'));
  mountContactChoices(root,contact,'ru','DEMO — status');assert.equal(q('contact-step').hidden,true);assert.equal(q('contact-open').attrs.href,undefined);
 });
}
for(const phone of ['javascript:alert(1)','+37120013727;123','+37120013727\n123','123','+123?body=hi'])test(`reject invalid phone ${JSON.stringify(phone)}`,()=>assert.equal(contactAction({...contact,phone},'call','en'),null));
for(const email of ['x@y.lv?bcc=other@example.invalid','x@y.lv\r\nBcc:test@example.invalid','javascript:alert(1)','a b@example.lv','<a>@example.lv'])test(`reject invalid email ${JSON.stringify(email)}`,()=>assert.equal(contactAction({...contact,email},'email','en'),null));
test('unsupported channel, missing contacts and invalid locale fail closed',()=>{assert.equal(contactAction(contact,'chat','en'),null);assert.equal(contactAction(null,'call','en'),null);assert.equal(contactAction(contact,'call','de'),null);});
test('public contact configuration is available without secrets',async()=>{const {env}=environment();const response=await createWorker().fetch(new Request('https://demo.example/api/config'),env);const data=await response.json();assert.deepEqual(data.contact,contact);assert.ok(!JSON.stringify(data).includes(env.SESSION_SECRET));});

for(const [locale,message]of [['ru','Дай сотрудника'],['ru','Хочу связаться с сотрудником'],['ru','Позови оператора'],['en','Give me an agent'],['en','I want a human'],['en','Contact staff'],['lv','Gribu runāt ar darbinieku'],['lv','Vēlos sazināties ar operatoru']])test(`direct human request ignores prior defect and skips provider: ${message}`,async()=>{
 const {env,storage}=environment({AI_ENABLED:'true',DEMO_PASSWORD:'synthetic-demo-password',OPENAI_API_KEY:'fake-test-key'});let calls=0;
 const worker=createWorker(async()=>{calls++;throw Error('Provider should not be called');});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);const cookie=login.headers.get('Set-Cookie').split(';')[0];
 const response=await worker.fetch(request('/api/chat',{tenant:'anete',locale,message,previousTopic:'defect'},{headers:{cookie}}),env);
 assert.equal(response.status,200);const data=await response.json();assert.deepEqual(data.cardIds,['contact']);assert.equal(data.handoff,true);assert.equal(data.locale,locale);assert.equal(calls,0);assert.equal(storage.records.get('state').total,0);
});
