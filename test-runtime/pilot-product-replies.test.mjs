import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const samples=JSON.parse(await readFile(new URL('../test/fixtures/pilot-products-20261025.json',import.meta.url),'utf8'));
const replies={ru:['Вес — 50 г, состав — 100% шерсть.','Вес — 100 г, состав — 75% шерсть и 25% полиамид.'],lv:['Svars ir 50 g, sastāvs ir 100% vilna.','Svars ir 100 g, sastāvs ir 75% vilna un 25% poliamīds.'],en:['It weighs 50 g and contains 100% wool.','It weighs 100 g and contains 75% wool and 25% polyamide.']};
const response=items=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({answers:items.map((reply,i)=>({id:'catalog:'+i,reply,evidence:['evidence_'+i+'_0','evidence_'+i+'_1']}))})}]}]});
function setup(id,budget,provider){
 const products=samples.filter(p=>p.tenant===id).slice(0,2);
 const mf=new Miniflare(convertV4MiniflareOptions({name:'scoped-product-'+id,modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{TENANT_ID:id,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-runtime-password',SESSION_SECRET:'runtime-test-secret-at-least-32-characters',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'synthetic-test-key',TOTAL_BUDGET_MICRO_USD:String(budget)},serviceBindings:{ASSETS:async()=>{throw Error('No catalogue search expected');}},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses')return provider(await req.json());
  const p=products.find(p=>p.url===req.url);assert(p);return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})+'</script>',{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.62',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 return {mf,post,products};
}
test('workerd/SQLite: explicit product IDs ground anonymous RU/LV/EN compositions once per request, never using the other product facts',async()=>{
 let calls=0;
 const {mf,post,products}=setup('dzijas',30000,body=>{
  calls++;assert.equal(body.max_output_tokens,450);assert.equal(body.store,false);assert.deepEqual(body.text.format.schema.required,['answers']);assert.equal(body.text.format.schema.properties.answers.items.properties.evidence.maxItems,3);
  const locale=body.instructions.match(/^Reply in (ru|lv|en),/u)[1];return response(replies[locale]);
 });
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const send=locale=>post('/api/chat',{tenant:'dzijas',locale,message:{ru:'Сравни материал и вес.',lv:'Salīdzini materiālu un svaru.',en:'Compare material and weight.'}[locale]+' '+products.map(p=>p.url).join(' and ')},cookie);
  for(const locale of ['ru','lv','en']){const r=await send(locale),a=await r.json();assert.equal(r.status,200);assert.equal(a.locale,locale);assert.equal(a.conversational,true,JSON.stringify(a));assert.equal(a.text,products.map((p,i)=>p.title+'\n'+replies[locale][i]).join('\n\n'));assert.deepEqual(a.sources.map(s=>s.url),products.map(p=>p.url));}
  const denied=await(await send('en')).json();assert.equal(denied.fallbackReason,'total_budget');assert.equal(denied.providerUsed,false);assert.equal(calls,3);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1')),state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,30000);assert.equal(state.total.limitMicroUSD,30000);
  assert.equal((await post('/api/chat',{tenant:'jig',locale:'en',message:'Compare'},cookie)).status,404);
 }finally{await mf.dispose();}
});
test('workerd/SQLite: scoped JIG casting-to-mass is still rejected; useful material fallback and a supported reply survive the same budget',async()=>{
 let calls=0;
 const good='The blank uses IM9 graphite from TORAY. The rod weight is unconfirmed.';
 const {mf,post,products}=setup('jig',20000,()=>response([++calls===1?'The rod weighs 18 g.':good,good]));
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const send=()=>post('/api/chat',{tenant:'jig',locale:'en',message:'Compare material and weight. '+products.map(p=>p.url).join(' and ')},cookie);
  const a=await(await send()).json();assert.equal(a.validationDetail,'measurement_role_mismatch');assert.equal(a.conversational,undefined);assert(a.text.includes('Blank material: IM9 graphite (TORAY).'));assert(a.text.includes('rod itself has no confirmed weight'));assert(!a.text.includes('weighs 18 g'));assert.equal(calls,1);
  const b=await(await send()).json();assert.equal(b.conversational,true);assert.equal(b.text,products.map(p=>p.title+'\n'+good).join('\n\n'));assert.equal(calls,2);
  const c=await(await send()).json();assert.equal(c.fallbackReason,'total_budget');assert.equal(c.providerUsed,false);assert.equal(calls,2);
 }finally{await mf.dispose();}
});
