import test from 'node:test';import assert from 'node:assert/strict';
import {prospectTenants} from '../src/prospects.js';
import {getTenant} from '../src/kb.js';
import {referenceRoute,render,aiRoute} from '../src/core.js';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
import {contactAction} from '../public/contact.js';
import {prospectCases} from './prospect-cases.mjs';
assert.equal(prospectCases.length,50);
for(const tenant of Object.values(prospectTenants)){
 for(const [i,[locale,message,expected]] of prospectCases.entries())test(`${tenant.id}: scenario ${i+1}: ${message}`,async()=>{
  const {env}=environment();let calls=0;
  const res=await createWorker(()=>{calls++;throw Error('Provider forbidden in local tests');}).fetch(request('/api/chat',{tenant:tenant.id,locale,message}),env);
  assert.equal(res.status,200);assert.equal(calls,0);const out=await res.json();assert.ok(out.text.length>5);
  if(expected==='unknown')assert.equal(out.cardIds.length,0);else if(expected)assert.equal(out.cardIds[0],expected);
  const ownSources=new Set(Object.values(tenant.sources).map(s=>s.url));
  assert.ok(out.sources.every(s=>s&&ownSources.has(s.url)));assert.equal(out.contact.email,tenant.contact.email);
  assert.ok(!out.text.includes('Anete.lv'));assert.ok(!JSON.stringify(out).includes('anete.lv'));
  for(const id of out.cardIds){const c=tenant.cards.find(c=>c.id===id);assert.ok(c);if(c.requiresReview)assert.equal(out.handoff,true);}
  if(['contact','status','defect','payment-problem'].includes(expected))assert.equal(out.handoff,true);
 });
 test(`${tenant.id}: AI schema and mandatory review cover every policy card`,async()=>{
  const route=await aiRoute(tenant,'I changed my mind and want to return it',null);
  for(const c of tenant.cards.filter(c=>c.source!=='niche-product')){const result=route.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:[c.id],handoff:false})}]}]});for(const locale of ['ru','lv','en']){const out=render(tenant.id,locale,result,'ai');assert.ok(out.text.includes(c[locale]));assert.ok(out.sources.every(Boolean));if(c.requiresReview)assert.equal(out.handoff,true);}}
  assert.throws(()=>route.parse({status:'completed',output:[{content:[{type:'output_text',text:'{"ids":["invoice"],"handoff":false}'}]}]}));
  assert.ok(!JSON.stringify(route.body).includes('anete.lv'));
 });
 test(`${tenant.id}: public config and contact actions select this store`,async()=>{
  const {env}=environment();const res=await createWorker().fetch(new Request('https://demo.example/api/config?tenant='+tenant.id),env);const out=await res.json();assert.equal(out.name,tenant.name);assert.equal(out.tenant,tenant.id);assert.equal(out.contact.email,tenant.contact.email);assert.equal(contactAction(out.contact,'call','en').href,'tel:'+tenant.contact.phone);assert.ok(contactAction(out.contact,'email','ru').href.startsWith('mailto:'+tenant.contact.email));
 });
}
test('unknown tenants fail closed in both APIs',async()=>{const {env}=environment();assert.equal((await createWorker().fetch(new Request('https://demo.example/api/config?tenant=unknown'),env)).status,404);assert.equal((await createWorker().fetch(request('/api/chat',{tenant:'unknown',locale:'en',message:'delivery'}),env)).status,404);});
test('HobbySet outdated return terms always require review even with direct rendering',()=>{for(const id of ['return','return-process']){assert.equal(render('hobbyset','en',{ids:[id],handoff:false},'ai').handoff,true);assert.equal(referenceRoute('I changed my mind and want to return it',null,'hobbyset').handoff,true);}});
test('same question produces distinct shop policies and sources',()=>{const answers=Object.keys(prospectTenants).map(id=>render(id,'en',referenceRoute('delivery',null,id),'reference'));assert.equal(new Set(answers.map(a=>a.text)).size,5);assert.equal(new Set(answers.map(a=>a.sources[0].url)).size,5);});

test('gallery canonical and HTML routes reach assets',async()=>{const {env}=environment();for(const path of ['/demos','/demos/','/demos.html'])assert.equal((await createWorker().fetch(new Request('https://demo.example'+path),env)).status,200);});
