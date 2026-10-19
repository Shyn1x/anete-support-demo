import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../src/worker.js';
import {environment,request} from './helpers.mjs';
import {referenceRoute} from '../src/core.js';
import {isCatalogueListing} from '../src/catalog-service.js';
import {ordinalSelection} from '../src/product-context.js';
import {detectLocale} from '../src/locale.js';
import {searchFallback} from '../src/catalog-index.js';
import {catalogReplyRequest} from '../src/catalog-reply.js';
import {getTenant} from '../src/kb.js';
import {correctTypos} from '../src/typos.js';

for(const q of ['Kādas akrila krāsas var apskatīt?','Kādas krāsas piedāvājat?','Which luggage can I browse?'])test('a catalogue listing is not a substring of a technical field: '+q,()=>assert.equal(isCatalogueListing(q),true));
for(const q of ['Vai šie ir ādas apavi?','What age is this puzzle for?','Kāds ir materiāls?'])test('an actual technical question still reads facts: '+q,()=>assert.equal(isCatalogueListing(q),false));
for(const [q,n] of [['А у третьих ботинок какая подкладка?',2],['Не первые, а вторые. Какая подкладка?',1],['У первых какой материал?',0],['Сравни вторые и третьи',[1,2]],['А третья краска для ткани?',2],['Не третьими, а первыми',0]])test('plural and feminine references use only the selected bounded item: '+q,()=>assert.deepEqual(ordinalSelection(q,3),Array.isArray(n)?n:[n]));
test('a missing third plural reference never reuses the second item',()=>assert.deepEqual(ordinalSelection('У третьих какая подкладка?',2),[]));
for(const fallback of ['ru','lv'])test('an English comparison switches away from '+fallback,()=>assert.equal(detectLocale('Compare these two products. Only use confirmed differences.',fallback),'en'));
test('an ambiguous model name still retains the language',()=>assert.equal(detectLocale('AM6002','lv'),'lv'));
test('valid Latvian order inflections are not rewritten as spelling mistakes',()=>assert.equal(correctTypos('kā varu saņemt pasūtījumu?'),'kā varu saņemt pasūtījumu?'));

const urls={anete:'https://anete.lv/example/123/1/p',bariba:'https://www.bariba.lv/example-food.html',hobbyset:'https://hobbyset.lv/products/lv/1/2/sort/1/filter/0/example.html',apavi40plus:'https://apavi40plus.com/products/example-shoes',rotallieta:'https://rotallieta.lv/prece/example-toy/',celotajs:'https://veikalscelotajs.lv/products/example-backpack'};
const receiving=[['ru','Как получить заказ?'],['en','How can I receive my order?'],['lv','Kā varu saņemt pasūtījumu?']];
for(const [shop,url] of Object.entries(urls))for(const [locale,q] of receiving)test(shop+' linked receiving policy takes precedence: '+locale,()=>{const ref=referenceRoute(q+' '+url,'product-sizing',shop);assert(ref.ids.includes('delivery'));assert(!ref.kind.startsWith('product-'));});

async function login(w,env){const res=await w.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);return res.headers.get('Set-Cookie').split(';')[0];}
test('actual Worker returns Latvian paint choices without merchant reads or model reserve',async()=>{
 const {env,storage}=environment({TENANT_ID:'hobbyset',DEMO_PASSWORD:'synthetic-test-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-key'});
 const u=urls.hobbyset;env.ASSETS={fetch:async()=>Response.json({schema:'shop-catalog-index-v1',tenant:'hobbyset',importedAt:'2026-10-19T00:00:00Z',products:[{u,t:'Akrila krāsa'}]})};
 let calls=0;const w=createWorker(async()=>{calls++;return new Response('denied',{status:403});}),cookie=await login(w,env);
 const res=await w.fetch(request('/api/chat',{tenant:'hobbyset',locale:'ru',message:'Kādas akrila krāsas var apskatīt?'},{headers:{cookie}}),env),d=await res.json();
 assert.equal(res.status,200);assert.equal(d.locale,'lv');assert.equal(d.catalogMetadataOnly,true);assert.deepEqual(d.catalogURLs,[u]);assert.equal(d.readFailures,0);assert.equal(calls,0);assert.equal(storage.records.get('state').total,0);
});
test('actual Worker reads the third shoe, preserving identity even when source is unavailable',async()=>{
 const {env,storage}=environment({TENANT_ID:'apavi40plus',DEMO_PASSWORD:'synthetic-test-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-key'}),choices=['one','two','three'].map(n=>'https://apavi40plus.com/products/'+n),calls=[];
 const w=createWorker(async u=>{calls.push(u);return new Response('missing',{status:404});}),cookie=await login(w,env);
 const res=await w.fetch(request('/api/chat',{tenant:'apavi40plus',locale:'ru',message:'А у третьих ботинок какая подкладка?',catalogURLs:choices,productURL:choices[0]},{headers:{cookie}}),env),d=await res.json();
 assert.equal(res.status,200);assert.equal(d.productURL,choices[2]);assert.deepEqual([...calls].sort(),[choices[2],choices[2]+'.js'].sort());assert.equal(d.providerUsed,false);assert.equal(storage.records.get('state').total,0);
});
test('actual Worker never reads a blocked product for receiving-policy question',async()=>{
 const {env,storage}=environment({TENANT_ID:'hobbyset',DEMO_PASSWORD:'synthetic-test-password',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-key'}),calls=[];
 const w=createWorker(async u=>{calls.push(u);assert.equal(u,'https://api.openai.com/v1/responses');return new Response('unavailable',{status:503});}),cookie=await login(w,env);
 const res=await w.fetch(request('/api/chat',{tenant:'hobbyset',locale:'ru',message:'Как получить заказ? '+urls.hobbyset},{headers:{cookie}}),env),d=await res.json();
 assert.equal(res.status,200);assert(d.cardIds.includes('delivery'));assert.equal(d.catalogSearch,undefined);assert.equal(calls.length,1);assert.equal(storage.records.get('state').total,10000);
});

const toy={title:'3D puzzle globuss 49 pcs',url:urls.rotallieta,lines:['Vecums: 3+ gadi','Detaļu skaits: 49 gab.'],variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified'};
for(const locale of ['ru','lv','en'])test('age fallback reports the explicit source label, never the user age: '+locale,()=>{const text=searchFallback([toy],'What age is this puzzle for? Ребёнку 8 лет.',locale,{tenant:'rotallieta'});assert(text.includes('3+'));assert(!text.includes('8'));});
test('unsupported age copied from a buyer still fails generation validation',()=>{
 const route=catalogReplyRequest(getTenant('rotallieta'),[toy],'Ребёнку 8 лет. Для какого возраста?', 'ru');
 const data={status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply:'Для детей 8 лет.',evidence:[{id:'catalog:0',quote:'Vecums: 3+ gadi'}]})}]}]};
 assert.throws(()=>route.parse(data),/unsupported_number/);
});
test('a title numeral alone cannot become a verified age',()=>{const text=searchFallback([{...toy,lines:['Detaļu skaits: 49 gab.']}],'Для какого возраста?', 'ru',{tenant:'rotallieta'});assert(!text.includes('3+'));});
test('conflicting source age labels remain unconfirmed',()=>{const text=searchFallback([{...toy,lines:['Vecums: 3+ gadi','Age: 8+ years']}],'Для какого возраста?', 'ru',{tenant:'rotallieta'});assert(!text.includes('3+'));assert(!text.includes('8+'));});
