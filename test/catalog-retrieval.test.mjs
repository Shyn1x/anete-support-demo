import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {getTenant} from '../src/kb.js';import {searchProducts,validateIndex} from '../src/catalog-index.js';import {contextSelection,nativeAneteSearch} from '../src/catalog-service.js';import {catalogReplyRequest} from '../src/catalog-reply.js';
import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';import {sitemapEntries,sitemapChildren} from '../scripts/import-catalog-index.mjs';
const indices={};for(const id of ['bariba','hobbyset','rotallieta','apavi40plus','celotajs']){const root='public/catalog-index/'+id,m=JSON.parse(await readFile(root+'/manifest.json','utf8'));const products=[];for(const s of m.shards)products.push(...JSON.parse(await readFile(root+'/'+s,'utf8')));indices[id]={...m,products};}
const all=(id,query)=>searchProducts(indices[id],query);
for(const [id,queries,match,avoid]of [
 ['bariba',['Какой корм лучше подойдет для щенков','What food is best for puppies?','Kāda barība ir piemērota kucēniem?'],/pupp|kucēn/iu,/vitamin|papildbar|preparāt/iu],
 ['bariba',['Корм для кошек','Which cat food should I choose?','Kādu barību izvēlēties kaķim?'],/cat|kaķ/iu,/papildbar|vitamin/iu],
 ['hobbyset',['Какие акварельные краски выбрать?','Which watercolor paints should I choose?','Kādas akvareļkrāsas izvēlēties?'],/akvare|watercol/iu,/paper|papīr|brush|sponge|gumiar|maskējoš|šķīdums/iu],
 ['celotajs',['Какую палатку выбрать?','Which tent should I choose?','Kādu telti izvēlēties?'],/telt|tent/iu,/survival|shelter/iu],
 ['apavi40plus',['Josef Seibel 42801 материал','Josef Seibel 42801 material','Josef Seibel 42801 materiāls'],/42801/iu,/lloyd/iu]
])for(const q of queries)test('real imported catalogue: '+id+' '+q,()=>{const rows=all(id,q);assert(rows.length>0);assert(rows.length<=3);assert(rows.every(r=>match.test(r.t)));assert(rows.every(r=>!avoid.test(r.t)));});
for(const id of Object.keys(indices))test(id+': missing invented model never substitutes another product',()=>assert.deepEqual(all(id,'Example-X999-fictional-product material'),[]));
for(const id of Object.keys(indices))test(id+': manifest, all URLs and source identity validate',()=>assert.equal(validateIndex(indices[id],getTenant(id)).tenant,id));
test('index rejects other shop, private path, excess length and external host',()=>{for(const p of [{u:'https://rotallieta.lv/prece/toy/',t:'Toy'},{u:'https://www.bariba.lv/account',t:'Private'},{u:'https://evil.invalid/a.html',t:'Food'}])assert.throws(()=>validateIndex({...indices.bariba,products:[p]},getTenant('bariba')));assert.throws(()=>validateIndex({...indices.bariba,tenant:'hobbyset'},getTenant('bariba')));});
test('sitemap parser rejects entity declarations and ignores private, cross-origin and non-product addresses',()=>{
 const xml='<urlset><url><loc>https://www.bariba.lv/a.html</loc><image:title><![CDATA[Puppy &amp; food]]></image:title></url><url><loc>https://evil.invalid/b.html</loc></url><url><loc>https://www.bariba.lv/account</loc></url></urlset>';
 assert.deepEqual(sitemapEntries(xml,getTenant('bariba')),[{u:'https://www.bariba.lv/a.html',t:'Puppy & food'}]);assert.throws(()=>sitemapEntries('<!DOCTYPE a>'+xml,getTenant('bariba')));
 assert.deepEqual(sitemapChildren('<sitemap><loc>https://evil.invalid/product-sitemap.xml</loc></sitemap>','https://rotallieta.lv/sitemap.xml'),[]);
});
test('context ordinal and comparison references are bounded and explicit',()=>{const urls=['a','b'];assert.deepEqual(contextSelection('А у второго какие батарейки?',urls),['b']);assert.deepEqual(contextSelection('Compare these',urls),urls);assert.deepEqual(contextSelection('Actually a different product',urls),[]);assert.deepEqual(contextSelection('А у второго?',[]),[]);});
const sample={title:'Example Toy 123',url:'https://rotallieta.lv/prece/example-toy/',lines:['For ages 3 years and up. Batteries are not included.'],variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified',checkedAt:'2026-10-18T09:00:00Z'};
const provider=(reply='The product description says batteries are not included.',ids=['catalog:0'],evidence=[{id:'catalog:0',quote:'Batteries are not included.'}])=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids,reply,evidence})}]}]});
for(const [reply,reason]of [['Delivery takes 999 days.','unsupported_number'],['I can forward your request.','unsupported_handoff_action'],['It is in stock.','unverified_promise'],['Write to test@example.invalid','links_contacts_or_internal_text']])test('retrieved facts cannot permit '+reason,()=>{const r=catalogReplyRequest(getTenant('rotallieta'),[sample],'Are batteries included?','en');assert.throws(()=>r.parse(provider(reply)),new RegExp(reason));});
test('retrieved answer must provide exact source excerpts, identifiers and complete comparison',()=>{
 const r=catalogReplyRequest(getTenant('rotallieta'),[sample],'Are batteries included?','en');assert.equal(r.parse(provider()).text,'The product description says batteries are not included.');assert.throws(()=>r.parse(provider('They are included.',['catalog:0'],[{id:'catalog:0',quote:'They are included.'}])),/catalog_evidence_quote/);
 assert.throws(()=>r.parse(provider('Okay',['other'],[])),/schema/);
 const compare=catalogReplyRequest(getTenant('rotallieta'),[sample,{...sample,title:'Example Toy 456'}],'Compare these','en');assert.throws(()=>compare.parse(provider()),/catalog_comparison_omitted/);
});
const html=(title,description,url)=>`<h1>${title}</h1><script type="application/ld+json">${JSON.stringify({'@type':'Product',url,name:title,description})}</script>`;
async function session({budget=false,reply=provider(),failRead=false}={}){
 const first={u:'https://www.bariba.lv/necon-puppy-test.html',t:'Necon Puppy food'},second={u:'https://www.bariba.lv/cooking-puppy-test.html',t:'CooKing Puppy food'};
 const index={schema:'shop-catalog-index-v1',tenant:'bariba',importedAt:'2026-10-18T09:00:00Z',products:[first,second]};
 const {env,storage,guard}=environment({TENANT_ID:'bariba',DEMO_PASSWORD:'synthetic-session-password',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'fake-key',TOTAL_BUDGET_MICRO_USD:'10000',ASSETS:{fetch:async()=>Response.json(index)}});if(budget)await guard.fetch(new Request('https://guard/check',{method:'POST',body:JSON.stringify({ip:'b'.repeat(64),kind:'chat',reserve:true})}));
 const calls=[];const worker=createWorker(async(url,options)=>{calls.push(url);if(url==='https://api.openai.com/v1/responses')return Response.json(reply);if(failRead)return new Response('unavailable',{status:503});return new Response(html(url===first.u?'Necon Puppy food':'CooKing Puppy food','Complete dry food for puppies. Pack weight 12 kg.',url),{headers:{'Content-Type':'text/html'}});});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=async(message,extra={})=>{const r=await worker.fetch(request('/api/chat',{tenant:'bariba',locale:'en',message,...extra},{headers:{cookie}}),env);return {status:r.status,data:await r.json()};};return {send,calls,storage,env,guard,worker,cookie};
}
test('retrieval uses one admission, one paid reservation and source-validated prose',async()=>{
 const r=await session({reply:provider('The page describes complete dry food for puppies. What breed is your puppy?',['catalog:0'],[{id:'catalog:0',quote:'Complete dry food for puppies.'}])});
 const {status,data}=await r.send('What are the ingredients of puppy food?');assert.equal(status,200);assert.equal(data.conversational,true);assert.equal(data.providerUsed,true);assert.equal(r.calls.filter(u=>u.includes('openai')).length,1);assert.equal(r.storage.records.get('state').total,10000);assert.equal(Object.values(r.storage.records.get('state').ips).reduce((s,v)=>s+v.chat,0),1);assert(data.sources.every(s=>s.url.startsWith('https://www.bariba.lv/')));assert.equal(data.catalogURLs.length,2);
});
test('read failure and no-match never reserve or call OpenAI; no false absence',async()=>{
 for(const failRead of [false,true]){const r=await session({failRead});const {data}=await r.send(failRead?'What are the ingredients of puppy food?':'What food is Example-X999?');assert.equal(data.providerUsed,false);assert.equal(r.storage.records.get('state').total,0);assert.equal(r.calls.filter(u=>u.includes('openai')).length,0);assert.doesNotMatch(data.text,/does not exist|we don't sell/iu);}
});
test('exhausted budget retains actual source-based product answer, zero provider calls and unchanged reserve',async()=>{
 const r=await session({budget:true}),{data}=await r.send('What are the ingredients of puppy food?');assert.equal(data.fallbackReason,'total_budget');assert.equal(data.providerUsed,false);assert(data.text.includes('Necon Puppy food'));assert.equal(r.calls.filter(u=>u.includes('openai')).length,0);assert.equal(r.storage.records.get('state').total,10000);
});
test('rejected provider answer preserves source excerpts and detailed diagnostic, no retry',async()=>{
 const r=await session({reply:provider('It costs 999 euros.',['catalog:0'],[{id:'catalog:0',quote:'Complete dry food for puppies.'}])});const {data}=await r.send('What are the ingredients of puppy food?');assert.equal(data.validationReason,'unsupported_number');assert(!data.text.includes('999'));assert.equal(r.calls.filter(u=>u.includes('openai')).length,1);
});
test('policy, damaged item and human request cannot be hijacked by previous product list',async()=>{
 const r=await session({budget:true});for(const message of ['I want to speak to a human','My parcel is damaged','What delivery options are available?']){const {data}=await r.send(message,{catalogURLs:['https://www.bariba.lv/necon-puppy-test.html']});assert.notEqual(data.catalogSearch,true);}assert(!r.calls.some(u=>u.startsWith('https://www.bariba.lv')));
});
test('PII and cross-shop targets never reach catalogue fetch',async()=>{
 const r=await session();for(const message of ['my email test@example.invalid','https://rotallieta.lv/prece/example-toy/']){const {data}=await r.send(message);assert.equal(data.providerUsed,false);}assert.equal(r.calls.length,0);
});
test('public routes cannot expose a catalogue file or another tenant data',async()=>{const r=await session();for(const path of ['/catalog-index.json','/catalog-hobbyset.json','/catalog-index/bariba/000.json'])assert.equal((await r.worker.fetch(new Request('https://demo.example'+path),r.env)).status,404);assert.equal((await r.worker.fetch(request('/api/chat',{tenant:'hobbyset',locale:'en',message:'paint'},{headers:{cookie:r.cookie}}),r.env)).status,404);});
test('broad catalogue selection is immediate metadata-only and makes no merchant or model request',async()=>{
 const r=await session();const {data}=await r.send('Which puppy food should I choose?');assert.equal(data.catalogMetadataOnly,true);assert.equal(data.productRead,false);assert.equal(data.providerUsed,false);assert.equal(r.calls.length,0);assert.equal(r.storage.records.get('state').total,0);assert(data.text.includes('Necon Puppy food'));assert(data.text.includes('Current stock'));assert.equal(data.catalogURLs.length,2);
});
test('single-product follow-up keeps the confirmed context but a new model does not inherit it',()=>{
 const urls=['https://rotallieta.lv/prece/example/'];assert.deepEqual(contextSelection('Are batteries included?',urls),urls);assert.deepEqual(contextSelection('What about Example-X999 batteries?',urls),[]);
});
test('an explicit own-shop product link uses the same grounded conversational pipeline',async()=>{
 const r=await session({reply:provider('The description does not confirm the ingredients.',['catalog:0'],[{id:'catalog:0',quote:'Complete dry food for puppies.'}])});const {data}=await r.send('What are the ingredients? https://www.bariba.lv/necon-puppy-test.html');assert.equal(data.mode,'catalog');assert.equal(data.conversational,true);assert.equal(data.providerUsed,true);assert.equal(data.productURL,'https://www.bariba.lv/necon-puppy-test.html');assert.equal(r.calls.filter(u=>u.includes('openai')).length,1);assert.equal(r.storage.records.get('state').total,10000);
});
test('Anete native suggestions accept only public product identities, drop unrelated sections and duplicate aliases',async()=>{
 const a='https://anete.lv/shop/vacuum-example/12345/1/p',alias='https://anete.lv/other/vacuum-example/12345/1/p';let calls=0;
 const rows=await nativeAneteSearch('Which vacuum should I choose?',getTenant('anete'),async(url,options)=>{calls++;assert.equal(new URL(url).origin,'https://anete.lv');assert.equal(new URL(url).searchParams.get('route'),'product/search/suggest');assert.equal(options.redirect,'manual');assert.equal(options.headers.Accept,'application/json');return Response.json([{type:'category',href:'https://anete.lv/cat',name:'Vacuum'},{type:'product',href:a,name:'Vacuum Example'},{type:'product',href:alias,name:'Vacuum Example'},{type:'product',href:'https://evil.invalid/a/1/1/p',name:'Vacuum'},{type:'product',href:'https://anete.lv/account',name:'Vacuum'}]);});assert.equal(calls,1);assert.deepEqual(rows.map(r=>r.u),[a]);
});
test('Anete search never follows redirects or parses HTML challenges as successful data',async()=>{
 for(const response of [new Response('',{status:302,headers:{Location:'https://evil.invalid/'}}),new Response('<html>challenge</html>',{headers:{'Content-Type':'text/html'}})])await assert.rejects(()=>nativeAneteSearch('vacuum',getTenant('anete'),async()=>response),/catalog_search/);
});
