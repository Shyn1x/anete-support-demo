import test from 'node:test';import assert from 'node:assert/strict';
import {selectCatalogLines,catalogFidelityReason,productMaterialFields,catalogMaterialReason} from '../src/catalog-evidence.js';
import {catalogReplyRequest} from '../src/catalog-reply.js';import {searchFallback} from '../src/catalog-index.js';import {reviewedCatalogSnapshot} from '../src/catalog-snapshots.js';
import {getTenant} from '../src/kb.js';import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
const product=(extra={})=>({title:'Example product',url:'https://www.bariba.lv/test-food.html',lines:['Sastāvs:','Svaiga putnu gaļa vismaz 25%, vistu tauki, vistas aknu hidrolizāts.'],variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified',checkedAt:'2026-10-18T16:04:30.397Z',...extra});
const card=text=>({id:'catalog:0',ru:text,lv:text,en:text});
const response=(reply,quote='Svaiga putnu gaļa vismaz 25%')=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0'],reply,evidence:[{id:'catalog:0',quote}]})}]}]});
test('live Bariba distortion is rejected despite valid numbers and exact supporting quote',()=>{
 const route=catalogReplyRequest(getTenant('bariba'),[product()],'Есть ли курица в составе?','ru');
 const actual='Свежая куриная грудка составляет около 25%, также используются куриные жиры и куриные печеночные гидролизаты.';
 assert.throws(()=>route.parse(response(actual)),/catalog_quantity_qualifier/);
 assert.equal(route.body.store,false);assert.equal(route.body.max_output_tokens,450);
});
for(const text of ['В корме есть куриная грудка.','The recipe contains chicken breast.','Barībā ir vistas krūtiņa.','The recipe contains fillet.'])test('specific cut requires its own source evidence: '+text,()=>assert.equal(catalogFidelityReason(text,[card(product().lines.join('\n'))]),'catalog_unsupported_detail'));
for(const text of ['Свежего мяса птицы не менее 25%.','Fresh poultry meat is at least 25%.','Svaiga putnu gaļa vismaz 25%.'])test('same minimum retained across languages: '+text,()=>assert.equal(catalogFidelityReason(text,[card(product().lines.join('\n'))]),null));
for(const text of ['Птицы около 25%.','Poultry is exactly 25%.','Putnu gaļa ir aptuveni 25%.','Мяса птицы не более 25%.'])test('same number cannot lose or reverse its bound: '+text,()=>assert.equal(catalogFidelityReason(text,[card(product().lines.join('\n'))]),'catalog_quantity_qualifier'));
test('percentage cannot borrow a number from a weight, and a real sourced cut remains allowed',()=>{
 assert.equal(catalogFidelityReason('Contains 25%.',[card('Pack weight 25 kg.')]),'catalog_quantity_binding');
 assert.equal(catalogFidelityReason('Chicken breast at least 25%.',[card('Chicken breast at least 25%.')]),null);
 for(const text of ['No more than 25%.','About 25%.'])assert.notEqual(catalogFidelityReason(text,[card('Minimum 25%.')]),null);
 assert.equal(catalogFidelityReason('Up to 25%.',[card('Maximum 25%.')]),null);
 assert.equal(catalogFidelityReason('Aptuveni 25%.',[card('About 25%.')]),null);
});
test('a percentage cannot migrate from poultry meat to chicken or fat elsewhere in the recipe',()=>{
 const evidence=card('Svaiga putnu gaļa vismaz 25%, vistu tauki, vistas aknu hidrolizāts.');
 for(const reply of ['Chicken is at least 25%.','Chicken fat is at least 25%.','Курицы не менее 25%.','Vistu tauki vismaz 25%.'])assert.equal(catalogFidelityReason(reply,[evidence]),'catalog_quantity_binding');
 assert.equal(catalogFidelityReason('Poultry is at least 25%.',[evidence]),null);
});
for(const [source,reply]of [['Olbaltumvielas: 30%. Kopšķiedra: 1,5%.','Protein is 30% and fibre is 1.5%.'],['Mitrums ne vairāk kā 80%.','Влажность не более 80%.'],['Maximum 25%.','No more than 25%.']])test('bound and field preserved: '+reply,()=>assert.equal(catalogFidelityReason(reply,[card(source)]),null));
const shoe=product({title:'Example Shoes',url:'https://apavi40plus.com/products/example-shoes',lines:[...Array.from({length:19},(_,i)=>'A long unrelated marketing sentence '+i), 'Materiāls: Dabīgā gludāda','Odere: Mīksta āda / Tekstils']});
test('technical material fields below row 12 reach the prompt intact and stay within bounds',()=>{
 const selected=selectCatalogLines(shoe,'What are the upper and lining materials?');assert(selected.includes(shoe.lines[19]));assert(selected.includes(shoe.lines[20]));assert(selected.length<=12);assert(selected.join('\n').length<=2400);assert(selected.every(x=>shoe.lines.includes(x)));
 const route=catalogReplyRequest(getTenant('apavi40plus'),[shoe],'Upper and lining materials?','en');assert(route.body.instructions.includes(shoe.lines[19]));assert(route.body.instructions.includes(shoe.lines[20]));
});
test('a relevant heading retains its following value, not just the label',()=>{
 const p=product({lines:[...Array(20).fill('Promotional text.'),'Sastāvs:','Putnu gaļa vismaz 25%.']});const lines=selectCatalogLines(p,'Состав');assert(lines.includes('Sastāvs:'));assert(lines.includes('Putnu gaļa vismaz 25%.'));
});
for(const [locale,expected]of [['ru',['натуральная гладкая кожа','мягкая кожа / текстиль']],['lv',['dabīgā gludāda','mīksta āda / tekstils']],['en',['natural smooth leather','soft leather / textile']]])test('fallback retains both technical materials without unverified marketing in '+locale,()=>{
 const text=searchFallback([shoe],'What are the material and lining? '+(locale==='ru'?'материал':locale==='lv'?'materiāls':''),locale,{});for(const v of expected)assert(text.includes(v));assert(!text.includes('marketing'));assert(!text.includes('Which option'));assert(!text.includes('original'));
});
for(const text of ['The lining is leather.','Подкладка из кожи.','Odere ir āda.'])test('mixed lining cannot become leather alone: '+text,()=>assert.equal(catalogMaterialReason(text,[shoe]),'catalog_material_qualification'));
for(const text of ['The lining is leather / textile.','Подкладка: кожа / текстиль.','Odere: āda / tekstils.'])test('mixed lining retained: '+text,()=>assert.equal(catalogMaterialReason(text,[shoe]),null));
test('unrecognized or conflicting material cannot be translated into a plausible replacement',()=>{
 assert.equal(productMaterialFields(product({lines:['Materiāls: Unknown-X']}),'en').material,undefined);
 assert.equal(productMaterialFields(product({lines:['Materiāls: āda','Materiāls: tekstils']}),'en').material,null);
 assert.equal(productMaterialFields(product({lines:['Odere: āda / Mystery']}),'en').lining,undefined);
});
for(const locale of ['ru','lv','en'])test('unknown fallback explains inability in '+locale+' without raw foreign prose or another question',()=>{
 const text=searchFallback([product({lines:['Invented marketing lorem ipsum.']})],'What material?',locale,{});assert(!text.includes('lorem'));assert(!text.includes('?'));assert(text.includes('Example product'));
});
for(const [locale,q,expected]of [['ru','Какой состав, есть ли курица?',['не менее 25%','куриный жир','часть состава']],['lv','Kāds ir sastāvs?',['vismaz 25%','vistu tauki','daļa no sastāva']],['en','What are the ingredients?',['at least 25%','Chicken fat','some ingredients']]])test('reviewed literal ingredient clauses produce a useful partial fallback in '+locale,()=>{
 const p=product({lines:['Sastāvs:','Gaļa un dzīvnieku izcelsmes produkti (svaiga putnu gaļa vismaz 25%), kartupeļu ciete, vistu tauki, vistas aknu hidrolizāts']});const text=searchFallback([p],q,locale,{});for(const v of expected)assert(text.includes(v));assert(!/грудк|breast|krūtiņ|около|around/iu.test(text));
});
test('ingredient fallback never strips a negation or treats an unsourced heading as ingredients',()=>{
 for(const lines of [['Sastāvs:','Bez vistu tauki, nesatur vistas aknu hidrolizāts'],['Marketing:','vistu tauki']])assert(!searchFallback([product({lines})],'What are the ingredients?','en',{}).includes('Chicken fat is listed'));
});
const hobbyURL='https://hobbyset.lv/products/lv/2372/150958/sort/1/filter/0_0_0_0/Akvare%C4%BCkr%C4%81su-komplekts-12-kr%C4%81sas.html';
const denied={catalogAttempts:[{format:'html',error:'http_403'}]},at=Date.parse('2026-10-18T18:00:00Z');
test('reviewed snapshot is bound to exact product, shop, refusal and fixed seven-day lifetime',()=>{
 const h=getTenant('hobbyset');assert(reviewedCatalogSnapshot(hobbyURL,h,denied,at));
 for(const error of [{catalogAttempts:[{format:'html',error:'http_404'}]},{catalogAttempts:[{format:'html',error:'redirect'}]},{}])assert.equal(reviewedCatalogSnapshot(hobbyURL,h,error,at),null);
 assert.equal(reviewedCatalogSnapshot(hobbyURL,getTenant('bariba'),denied,at),null);assert.equal(reviewedCatalogSnapshot(hobbyURL.replace('150958','150959'),h,denied,at),null);
 assert.equal(reviewedCatalogSnapshot(hobbyURL,h,denied,at+8*86400000),null);assert.equal(reviewedCatalogSnapshot(hobbyURL,h,denied,at-86400000),null);
});
for(const [locale,question,expected]of [['ru','Сколько цветов и какой состав?','12 цветов'],['lv','Cik krāsu un kāds sastāvs?','12 krāsas'],['en','How many colours and what ingredients?','12 colours']])test('snapshot fallback confirms only reviewed count with a visible historical date in '+locale,()=>{
 const p=reviewedCatalogSnapshot(hobbyURL,getTenant('hobbyset'),denied,at),text=searchFallback([p],question,locale,{});assert(text.includes(expected));assert(text.includes('2026-10-18'));assert(!text.includes('?'));assert.throws(()=>catalogReplyRequest(getTenant('hobbyset'),[p],question,locale),/catalog_snapshot_generation/);
});
async function workerSession({tenant,url,description,title='Example product',model=response('About 25% poultry.'),http=200}){
 const {env,storage,guard}=environment({TENANT_ID:tenant,DEMO_PASSWORD:'synthetic-fidelity-password',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true',OPENAI_API_KEY:'fake-test-key',TOTAL_BUDGET_MICRO_USD:'10000'}),calls=[];
 const worker=createWorker(async(target)=>{calls.push(target);if(target==='https://api.openai.com/v1/responses')return Response.json(model);return new Response(http===200?`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url,name:title,description})}</script>`:'Access denied',{status:http,headers:{'Content-Type':'text/html'}});});
 const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env),cookie=login.headers.get('Set-Cookie').split(';')[0];
 const send=async(message,locale='en')=>{const r=await worker.fetch(request('/api/chat',{tenant,locale,message:message+' '+url,history:[]},{headers:{cookie}}),env);return {status:r.status,data:await r.json()};};return {send,calls,storage,guard};
}
test('Worker rejects meaning distortion after one provider call, retaining detailed reason and one reserve',async()=>{
 const s=await workerSession({tenant:'bariba',url:product().url,description:'Svaiga putnu gaļa vismaz 25%, vistu tauki.'});const {data}=await s.send('What are the ingredients?');assert.equal(data.validationReason,'catalog_quantity_qualifier');assert.equal(data.conversational,undefined);assert(!data.text.includes('About 25%'));assert.equal(s.calls.filter(x=>x.includes('openai')).length,1);assert.equal(s.storage.records.get('state').total,10000);
});
test('quote rejection still rejects, but material fallback answers the original question in English',async()=>{
 const s=await workerSession({tenant:'apavi40plus',url:shoe.url,description:shoe.lines.join('\n'),title:shoe.title,model:response('The upper is leather.','Unverifiable copied excerpt.')});const {data}=await s.send('What are the upper and lining materials?');assert.equal(data.validationReason,'catalog_evidence_quote');assert(data.text.includes('natural smooth leather'));assert(data.text.includes('soft leather / textile'));assert(!data.text.includes('Dabīgā'));assert(!data.text.includes('?'));assert.equal(s.calls.filter(x=>x.includes('openai')).length,1);
});
test('HobbySet refusal gives dated reviewed fact, still reports failed live read, never calls or reserves AI',async()=>{
 const original=Date.now;Date.now=()=>at;try{
 const s=await workerSession({tenant:'hobbyset',url:hobbyURL,http:403});const {status,data}=await s.send('Cik krāsu ir komplektā un kāds ir sastāvs?','lv');assert.equal(status,200);assert.equal(data.productRead,false);assert.equal(data.catalogSnapshot,true);assert.equal(data.providerUsed,false);assert.equal(data.readFailures,1);assert.equal(data.catalogRevision,'buyer-v6');assert(data.text.includes('12 krāsas'));assert(data.text.includes('2026-10-18'));assert(data.text.includes('Ne visas pieprasītās īpašības'));assert.equal(data.sources[0].url,hobbyURL);assert.equal(data.checked,'2026-10-18T16:04:30.397Z');assert.equal(s.calls.length,1);assert.equal(s.storage.records.get('state').total,0);
 }finally{Date.now=original;}
});
test('another blocked HobbySet product has no invented snapshot',async()=>{
 const s=await workerSession({tenant:'hobbyset',url:hobbyURL.replace('150958','150959'),http:403});const {data}=await s.send('How many colours?');assert.equal(data.productRead,false);assert.equal(data.catalogSnapshot,false);assert.equal(data.sources.length,0);assert.equal(data.providerUsed,false);assert(!data.text.includes('12'));assert.equal(s.storage.records.get('state').total,0);
});
test('expired reviewed fact disappears from Worker response without making a model call',async()=>{
 const original=Date.now;Date.now=()=>at+8*86400000;try{const s=await workerSession({tenant:'hobbyset',url:hobbyURL,http:403}),{data}=await s.send('How many colours?');assert.equal(data.catalogSnapshot,false);assert.equal(data.sources.length,0);assert.equal(data.providerUsed,false);assert.equal(s.storage.records.get('state').total,0);}finally{Date.now=original;}
});
test('reviewed count is available at the exhausted lifetime cap without changing the cap or reserve',async()=>{
 const original=Date.now;Date.now=()=>at;try{
 const s=await workerSession({tenant:'hobbyset',url:hobbyURL,http:403});const reserved=await s.guard.fetch(new Request('https://guard/check',{method:'POST',body:JSON.stringify({ip:'f'.repeat(64),kind:'chat',reserve:true})}));assert.equal(reserved.status,200);
 const {data}=await s.send('How many colours?');assert.equal(data.catalogSnapshot,true);assert.equal(data.providerUsed,false);assert(data.text.includes('12 colours'));assert.equal(s.storage.records.get('state').total,10000);assert.equal(s.calls.length,1);
 }finally{Date.now=original;}
});
