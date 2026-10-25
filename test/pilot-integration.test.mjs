import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {tenants,getTenant} from '../src/kb.js';
import {pilotTenants} from '../src/pilots.js';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
import {parseProduct,productURL,fetchProduct,canContinueProduct} from '../src/catalog.js';
import {catalogReplyRequest} from '../src/catalog-reply.js';
import {catalogMeasurementReason,catalogFibreReason} from '../src/catalog-measurements.js';
import {replyValidationReason} from '../src/conversation.js';
import {cleanHistory} from '../src/conversation.js';
import {buildPilotClients} from '../scripts/build-pilot-clients.mjs';
import {searchIndexedProducts,loadCatalogIndex} from '../src/catalog-index.js';
import {isCatalogueListing} from '../src/catalog-service.js';
const samples=JSON.parse(await readFile(new URL('./fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const ids=['dzijas','jig','musiclab','etextile','zummers'];
const response=out=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
const escaped=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const productHTML=p=>`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})}</script>`;
async function login(worker,env){const r=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);assert.equal(r.status,200);return r.headers.get('Set-Cookie').split(';')[0];}
const setup=id=>environment({TENANT_ID:id,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-pilot-password',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'fake-unit-test-key',TOTAL_BUDGET_MICRO_USD:'10000'});
const grounded={
 dzijas:{ru:'Вес мотка — 50 г.',lv:'Svars: 50 g.',en:'The listed weight is 50 g.'},
 jig:{ru:'В описании указан графит TORAY.',lv:'Aprakstā minēts TORAY grafīts.',en:'The description mentions TORAY graphite.'},
 musiclab:{ru:'Указанный вес — 8.500000 кг.',lv:'Norādītais svars: 8.500000 kg.',en:'The listed weight is 8.500000 kg.'},
 etextile:{ru:'В описании упоминается установка заклёпок.',lv:'Aprakstā minēta kniežu uzstādīšana.',en:'The description mentions setting rivets.'},
 zummers:{ru:'Ширина верхнего порожка — 43 мм.',lv:'Augšējā slieksnīša platums: 43mm.',en:'The nut width is 43mm.'}
};
const assetsFor=id=>({fetch:async request=>{
 const path=new URL(request.url).pathname;
 try{return Response.json(JSON.parse(await readFile(new URL('../dist/pilots/'+id+path,import.meta.url),'utf8')));}catch{return new Response('not found',{status:404});}
}});

test('six production tenants remain separate from the five opt-in pilots',()=>{
 assert.equal(Object.keys(tenants).length,6);assert.equal(Object.keys(pilotTenants).length,5);assert.equal(samples.length,47);
 for(const id of ids){const t=getTenant(id),seen=new Set();assert.equal(t.release,'preview');assert.ok(!Object.hasOwn(tenants,id));
  for(const c of t.cards){assert.ok(!seen.has(c.id));seen.add(c.id);assert.ok(c.ru&&c.lv&&c.en);assert.ok(t.sources[c.source]);}
  for(const p of samples.filter(p=>p.tenant===id)){assert.equal(productURL(p.url,t),p.url);assert.ok(p.sourceSha256);assert.ok(p.lines.length);}
 }
});
for(const id of ids){
 for(const locale of ['ru','lv','en'])test(`${id}/${locale}: a supported real-source fact passes the shared evidence validator`,()=>{
  const sample=samples.find(p=>p.tenant===id),product={...sample,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'};
  const route=catalogReplyRequest(getTenant(id),[product],'weight material width',locale);
  const out=route.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply:grounded[id][locale],evidence:['evidence_0_0']})}]}]});assert.equal(out.text,grounded[id][locale]);
 });
 test(`${id}: inaccessible without explicit pinned opt-in`,async()=>{
  let calls=0;const worker=createWorker(async()=>{calls++;throw Error('no external call allowed');});
  for(const vars of [{},{NEXT_BATCH_ENABLED:'true'}]){
   const {env}=environment(vars);assert.equal((await worker.fetch(new Request('https://demo.example/api/config?tenant='+id),env)).status,404);
   assert.equal((await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'Hello'}),env)).status,404);
  }
  const {env}=environment({TENANT_ID:id,DEMO_PASSWORD:'synthetic-pilot-password'});assert.equal((await worker.fetch(new Request('https://demo.example/api/config'),env)).status,503);assert.equal(calls,0);
 });
 test(`${id}: password, tenant and raw-asset isolation precede paid routes`,async()=>{
  let calls=0;const worker=createWorker(async()=>{calls++;throw Error('no external call allowed');}),{env}=setup(id);
  assert.equal((await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'delivery'}),env)).status,401);
  const cookie=await login(worker,env),other=ids.find(x=>x!==id);
  assert.equal((await worker.fetch(request('/api/chat',{tenant:other,locale:'en',message:'delivery'},{headers:{cookie}}),env)).status,404);
  for(const path of ['/demos','/qa','/usage','/catalog-index.json','/catalog-data/rows/000.json'])assert.equal((await worker.fetch(new Request('https://demo.example'+path),env)).status,404);
  const config=await(await worker.fetch(new Request('https://demo.example/api/config',{headers:{cookie}}),env)).json();assert.equal(config.tenant,id);assert.equal(config.conversationRevision,'context-v2');assert.equal(config.catalogEnabled,true);assert.equal(calls,0);
 });
 test(`${id}: personal data hidden in a product query never reaches history or the provider`,async()=>{
  let calls=0;const {env}=setup(id),worker=createWorker(async()=>{calls++;throw Error('must not call');}),cookie=await login(worker,env),p=samples.find(p=>p.tenant===id);
  for(const suffix of ['?email=buyer%40example.test','?phone=20000000','?order_id=DEMO-123','#email=buyer%40example.test']){
   assert.deepEqual(cleanHistory([{role:'user',text:p.url+suffix}],id),[]);
   const out=await(await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'What material? '+p.url+suffix},{headers:{cookie}}),env)).json();assert.equal(out.providerUsed,false);
  }assert.equal(calls,0);
 });
 test(`${id}: even unrecognised URL parameter values are removed before external conversation history`,async()=>{
  const {env}=setup(id),p=samples.find(p=>p.tenant===id);env.CATALOG_ENABLED='false';let captured;
  const worker=createWorker(async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');captured=JSON.parse(options.body).input;return response({ids:['delivery'],handoff:false,reply:getTenant(id).cards.find(c=>c.id==='delivery').en});});
  const cookie=await login(worker,env);await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'Please explain delivery in detail',history:[{role:'user',text:'See '+p.url+'?note=buyer%40example.test#ref=synthetic-private-value'}]},{headers:{cookie}}),env);
  assert.ok(captured);assert.ok(!captured.includes('buyer'));assert.ok(!captured.includes('synthetic-private'));assert.ok(captured.includes(p.url));
 });
 for(const locale of ['ru','lv','en'])test(`${id}/${locale}: existing context-v2 answers policies, then respects the same lifetime reserve`,async()=>{
  const {env,storage}=setup(id),tenant=getTenant(id),sample=samples.find(p=>p.tenant===id);let calls=0;
  const worker=createWorker(async url=>{assert.equal(url,'https://api.openai.com/v1/responses');calls++;return response({ids:['delivery'],handoff:false,reply:tenant.cards.find(c=>c.id==='delivery')[locale]});});
  const cookie=await login(worker,env),message={ru:'Какие способы доставки доступны?',lv:'Kādi piegādes veidi ir pieejami?',en:'What delivery options are available?'}[locale]+' '+sample.url;
  const chat=()=>worker.fetch(request('/api/chat',{tenant:id,locale,message,history:[{role:'user',text:{ru:'Хочу узнать про доставку',lv:'Jautājums par piegādi',en:'I have a delivery question'}[locale]}]},{headers:{cookie}}),env);
  const first=await(await chat()).json();assert.equal(first.conversational,true,JSON.stringify(first));assert.equal(first.providerUsed,true);assert.ok(first.cardIds.includes('delivery'));assert.equal(calls,1);assert.equal(storage.records.get('state').total,10000);
  const second=await(await chat()).json();assert.equal(second.providerUsed,false);assert.equal(second.fallbackReason,'total_budget');assert.equal(calls,1);
 });
 test(`${id}: a real product URL reaches the shared retrieval, evidence and generation path`,async()=>{
  const {env,storage}=setup(id),p=samples.find(p=>p.tenant===id);let provider=0,merchant=0;
  const worker=createWorker(async url=>{
   if(url==='https://api.openai.com/v1/responses'){provider++;return response({ids:['catalog:0'],reply:'I cannot confirm that detail from the description.',evidence:['evidence_0_0']});}
   assert.equal(url,p.url);merchant++;return new Response(productHTML(p),{headers:{'Content-Type':'text/html'}});
  });const cookie=await login(worker,env);
  const r=await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'What material is it? '+p.url},{headers:{cookie}}),env),out=await r.json();
  assert.equal(r.status,200);assert.equal(out.mode,'catalog');assert.equal(out.productRead,true);assert.equal(out.conversational,true,JSON.stringify(out));assert.equal(out.providerUsed,true);assert.equal(out.sources[0].url,p.url);assert.equal(provider,1);assert.equal(merchant,1);assert.equal(storage.records.get('state').total,10000);
 });
 test(`${id}: failed product reads never spend a provider reservation`,async()=>{
  const {env,storage}=setup(id),p=samples.find(p=>p.tenant===id);let provider=0;
  const worker=createWorker(async url=>{if(url.includes('openai.com')){provider++;throw Error('must not call provider');}return new Response('missing',{status:404,headers:{'Content-Type':'text/html'}});});const cookie=await login(worker,env);
  const out=await(await worker.fetch(request('/api/chat',{tenant:id,locale:'en',message:'What material is it? '+p.url},{headers:{cookie}}),env)).json();
  assert.equal(out.providerUsed,false);assert.equal(out.productRead,false);assert.equal(provider,0);assert.equal(storage.records.get('state').total,0);
 });
}

test('real storefront layouts: Shopify rich text, Woo attributes, Webador, Wix Offer identity and JIG table',()=>{
 const p=id=>samples.find(p=>p.tenant===id);
 const saga=p('dzijas'),music=p('musiclab'),textile=p('etextile'),wix=p('zummers'),jig=p('jig');
 const node=(s,description='')=>`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url:s.url,name:s.title,description})}</script>`;
 const a=parseProduct(node(saga,'collapsed')+'<div class="product__description rte"><p>100% vilna<br>Svars: 50 g<br>Garums: 100m</p></div>',saga.url,getTenant('dzijas'));assert.deepEqual(a.lines,['100% vilna','Svars: 50 g','Garums: 100m']);
 const b=parseProduct(node(music)+'<div id="tab-additional_information"><table><tr><th>Svars</th><td>8.500000 kg</td></tr></table></div>',music.url,getTenant('musiclab'));assert.deepEqual(b.lines,['Svars: 8.500000 kg']);
 const c=parseProduct(`<h1 itemprop="name">${textile.title}</h1><div class="product-page__description"><p>Furnitūras prese pogām.</p></div>`,textile.url,getTenant('etextile'));assert.match(c.lines[0],/prese pogām/);
 const d=parseProduct(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:wix.title,description:'Augšējā slieksnīša platums: 43mm',offers:{url:wix.url}})}</script>`,wix.url,getTenant('zummers'));assert.equal(d.lines[0],'Augšējā slieksnīša platums: 43mm');
 const e=parseProduct(`<td class="products_name">${jig.title}</td><form name="add_cart_form"><td colspan="2">Blanka no IM9 japāņu TORAY grafīta.</td></form>`,jig.url,getTenant('jig'));assert.match(e.lines[0],/TORAY/);
 assert.throws(()=>parseProduct(node(music)+'<div id="related"><table><tr><th>Svars</th><td>999 kg</td></tr></table></div>',music.url,getTenant('musiclab')),/catalog_parse/);
 assert.throws(()=>parseProduct(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:wix.title,description:'Wrong item details',offers:{url:'https://www.zummers.lv/product-page/another-item'}})}</script>`,wix.url,getTenant('zummers')),/catalog_parse/);
 const variants=parseProduct(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',name:saga.title,url:saga.url,description:'Svars: 50 g',offers:[{price:3,priceCurrency:'EUR',availability:'https://schema.org/InStock'},{price:4,priceCurrency:'EUR',availability:'https://schema.org/OutOfStock'}]})}</script>`,saga.url,getTenant('dzijas'));assert.equal(variants.summary.state,'unknown');assert.equal(variants.summary.price,null);
});
test('large Wix pages remain byte-bounded; other product readers retain their original bound',async()=>{
 const p=samples.find(p=>p.tenant==='zummers'),large='<!--'+'x'.repeat(810000)+'-->'+productHTML(p);
 const parsed=await fetchProduct(p.url,getTenant('zummers'),async()=>new Response(large,{headers:{'Content-Type':'text/html'}}));assert.equal(parsed.title,p.title);
 const old=samples.find(p=>p.tenant==='etextile');await assert.rejects(()=>fetchProduct(old.url,getTenant('etextile'),async()=>new Response(large,{headers:{'Content-Type':'text/html'}})),e=>e.catalogAttempts?.[0]?.error==='size');
});
test('specific questions about yarn, audio connections and use cases read descriptions instead of only titles',()=>{
 for(const q of ['DROPS SAGA: сколько метров в мотке?','How many metres?','Kāda ir metrāža?','What is this press used for?','Сколько входов у интерфейса?','Does it support phantom power?'])assert.equal(isCatalogueListing(q),false);
 assert.equal(isCatalogueListing('Show some guitars'),true);
});
test('units and attributes cannot be swapped even when all digits are in the source',()=>{
 const p={title:'DROPS SAGA',lines:['Svars: 50 g','Garums: 100m']};
 for(const q of ['The yarn weighs 100 g.','The yarn is 50 metres long.','Вес мотка 100 г.','Длина нити 50 м.','Dzija sver 100g.'])assert.equal(catalogMeasurementReason(q,[p]),'catalog_quantity_binding');
 for(const q of ['The yarn weighs 50 g.','The yarn is 100 metres long.','Вес мотка 50 г.','Garums: 100m'])assert.equal(catalogMeasurementReason(q,[p]),null);
 const rod={title:'Rod',lines:['Casting test: 3–18g']};assert.equal(catalogMeasurementReason('The rod weighs 18g.',[rod]),'catalog_quantity_binding');
 assert.equal(catalogMeasurementReason('DROPS SAGA is 170 m long.',[p,{title:'DROPS NORD',lines:['Garums: 170m']}]),'catalog_quantity_binding');
 const t=getTenant('dzijas'),r=catalogReplyRequest(t,[{...p,url:samples[0].url,variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'}],'How much does it weigh?','en');
 assert.throws(()=>r.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply:'The yarn weighs 100 g.',evidence:['evidence_0_0']})}]}]}),/catalog_quantity_binding/);
 for(const q of ['А метров в мотке сколько?','How many metres?','Cik metrāža?'])assert.equal(canContinueProduct(q),true);
});
test('new yarn replies cannot invent a fibre or move a percentage to another fibre/product',()=>{
 const a={title:'DROPS SAGA',lines:['100% vilna']},b={title:'Cotton model',lines:['100% kokvilna']};
 assert.equal(catalogFibreReason('This yarn is 100% wool.',[a]),null);
 assert.equal(catalogFibreReason('This yarn is 100% cotton.',[a]),'catalog_material_qualification');
 assert.equal(catalogFibreReason('DROPS SAGA is 100% cotton.',[a,b]),'catalog_material_qualification');
 const blend={title:'Blend',lines:['75% vilna, 25% poliamīds']};
 assert.equal(catalogFibreReason('It is 75% wool and 25% polyamide.',[blend]),null);
 assert.equal(catalogFibreReason('It is 25% wool and 75% polyamide.',[blend]),'catalog_quantity_binding');
 assert.equal(catalogFibreReason('Wool: 25%; polyamide: 75%.',[blend]),'catalog_quantity_binding');
});
test('approved conditional availability is not a stock promise, but never excuses another stock assertion',()=>{
 const tenant=getTenant('musiclab'),result={ids:['delivery'],handoff:false};
 assert.equal(replyValidationReason(tenant.cards.find(c=>c.id==='delivery').lv,result,tenant,'lv'),null);
 for(const text of ['Prece ir noliktavā.','Prece ir noliktavā, ja prece ir noliktavā.','Prece noteikti ir noliktavā. Norādītas 1–3 darba dienas, ja prece ir noliktavā.'])assert.equal(replyValidationReason(text,result,tenant,'lv'),'unverified_promise');
 const virtual={...tenant,cards:[{id:'catalog:0',topic:'product',source:'catalog-read',lv:'Ja prece ir noliktavā, termiņš 1–3 darba dienas.',ru:'',en:''}]};
 assert.equal(replyValidationReason('Ja prece ir noliktavā, termiņš 1–3 darba dienas.',{ids:['catalog:0'],handoff:false},virtual,'lv'),'unverified_promise');
});
test('all five client builds retain the original budget binding, separate assets and disabled paid mode',async()=>{
 assert.equal((await buildPilotClients()).length,5);
 for(const id of ids){const root=new URL('../dist/pilots/'+id+'/',import.meta.url),files=await readdir(root),bundle=files.find(f=>/^chat-ui\.[a-f0-9]{12}\.js$/u.test(f));assert.ok(bundle);
  const config=JSON.parse(await readFile(new URL('../deploy/pilots/'+id+'.json',import.meta.url),'utf8'));assert.equal(config.vars.TENANT_ID,id);assert.equal(config.vars.NEXT_BATCH_ENABLED,'true');assert.equal(config.vars.AI_ENABLED,'false');assert.equal(config.durable_objects.bindings[0].script_name,'anete-support-demo');assert.equal(config.migrations,undefined);
  assert.equal(config.vars.TOTAL_BUDGET_MICRO_USD,undefined);assert.equal(config.vars.DAILY_BUDGET_MICRO_USD,undefined);
  const script=await readFile(new URL(bundle,root),'utf8');for(const other of ids.filter(x=>x!==id))assert.ok(!script.includes(getTenant(other).name),`foreign brand in ${id}`);
  const html=await readFile(new URL('index.html',root),'utf8');assert.ok(html.includes(getTenant(id).name));assert.doesNotMatch(html,/href="\/(?:demos|usage|qa)/u);
  const env={TENANT_ID:id,ASSETS:assetsFor(id)},index=await loadCatalogIndex(env,getTenant(id));
  for(const p of samples.filter(p=>p.tenant===id)){
   const found=await searchIndexedProducts(env,getTenant(id),index,p.title,3);
   assert.ok(found.some(x=>x.u===p.url),`exact-title lookup lost ${id}: ${p.title}`);
  }
 }
});
