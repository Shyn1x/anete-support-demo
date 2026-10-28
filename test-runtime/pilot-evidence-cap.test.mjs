import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const samples=JSON.parse(await readFile(new URL('../test/fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const pair=id=>samples.filter(p=>p.tenant===id).slice(0,2);
const replies={en:'The first yarn weighs 50 g and contains 100% wool. The second yarn weighs 100 g and contains 75% wool and 25% polyamide.',ru:'Первая пряжа весит 50 г и содержит 100% шерсти. Вторая пряжа весит 100 г и содержит 75% шерсти и 25% полиамида.',lv:'Pirmā dzija sver 50 g un satur 100% vilnas. Otrā dzija sver 100 g un satur 75% vilnas un 25% poliamīda.'};
const response=(reply,evidence)=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0','catalog:1'],reply,evidence})}]}]});
function runtime(id,budget,provider){
 const products=pair(id),mf=new Miniflare(convertV4MiniflareOptions({name:'pilot-evidence-'+id,modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{TENANT_ID:id,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-runtime-password',SESSION_SECRET:'runtime-test-secret-at-least-32-characters',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'synthetic-test-key',TOTAL_BUDGET_MICRO_USD:String(budget)},serviceBindings:{ASSETS:async()=>{throw Error('No catalogue search expected');}},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses')return provider(await req.json());
  const p=products.find(p=>p.url===req.url);assert(p,'only same-shop explicit product pages');
  return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.61',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 return {mf,post,products};
}
test('workerd/SQLite: four owned yarn refs cover weight and composition in RU/LV/EN, retaining the existing budget',async()=>{
 let calls=0;
 const {mf,post,products}=runtime('dzijas',30000,body=>{
  calls++;assert.equal(body.max_output_tokens,450);assert.equal(body.store,false);assert.equal(body.text.format.schema.properties.answers.items.properties.evidence.maxItems,3);
  const locale=body.instructions.match(/^Reply in (ru|lv|en),/u)[1];return response(replies[locale],['evidence_0_0','evidence_0_1','evidence_1_0','evidence_1_1']);
 });
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const send=locale=>post('/api/chat',{tenant:'dzijas',locale,message:{ru:'Сравни материал и вес.',lv:'Salīdzini materiālu un svaru.',en:'Compare material and weight.'}[locale]+' '+products.map(p=>p.url).join(' and ')},cookie);
  for(const locale of ['ru','lv','en']){const r=await send(locale),a=await r.json();assert.equal(r.status,200);assert.equal(a.locale,locale);assert.equal(a.conversational,true,JSON.stringify(a));assert.equal(a.text,replies[locale]);assert.equal(a.validationReason,undefined);assert.deepEqual(a.sources.map(s=>s.url),products.map(p=>p.url));}
  const denied=await(await send('en')).json();assert.equal(denied.fallbackReason,'total_budget');assert.equal(denied.providerUsed,false);assert.equal(calls,3);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1')),state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,30000);assert.equal(state.total.limitMicroUSD,30000);
  assert.equal((await post('/api/chat',{tenant:'jig',locale:'en',message:'Compare products'},cookie)).status,404);
 }finally{await mf.dispose();}
});
test('workerd/SQLite: captured quality assurance is rejected without retry and a qualified JIG comparison is accepted',async()=>{
 let calls=0;
 const bad="Both fishing rods are made from IM9 graphite produced by Japan's TORAY, ensuring a high-quality blank material. However, the exact weight of each rod is not specified in the available information, so a weight comparison cannot be provided.",good='Both rods use IM9 graphite from TORAY. Their exact weights are not specified.';
 const {mf,post,products}=runtime('jig',20000,()=>response(++calls===1?bad:good,['evidence_0_0','evidence_1_0']));
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const send=()=>post('/api/chat',{tenant:'jig',locale:'en',message:'Compare material and weight. '+products.map(p=>p.url).join(' and ')},cookie);
  const a=await(await send()).json();assert.equal(a.fallbackReason,'answer_validation');assert.equal(a.validationReason,'catalog_unsupported_detail');assert.equal(a.validationDetail,'unverified_quality_inference');assert.equal(a.conversational,undefined);assert(!a.text.includes('high-quality'));assert.equal(calls,1);
  const b=await(await send()).json();assert.equal(b.conversational,true);assert.equal(b.text,good);assert.equal(calls,2);
  const capped=await(await send()).json();assert.equal(capped.fallbackReason,'total_budget');assert.equal(capped.providerUsed,false);assert.equal(calls,2);
 }finally{await mf.dispose();}
});
