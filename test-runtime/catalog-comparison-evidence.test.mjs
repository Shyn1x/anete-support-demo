import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('workerd/SQLite: exact quote choices, useful rejection fallback and capped comparison retain one reservation',async()=>{
 const {products}=JSON.parse(await readFile(new URL('../test/fixtures/apavi-comparison-20261019.json',import.meta.url),'utf8'));let provider=0,merchant=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'comparison-evidence-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{TENANT_ID:'apavi40plus',DEMO_PASSWORD:'synthetic-runtime-password',SESSION_SECRET:'runtime-test-secret-at-least-32-characters',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',TOTAL_BUDGET_MICRO_USD:'10000'},serviceBindings:{ASSETS:async()=>{throw Error('Explicit pair must not read search assets');}},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){
   provider++;const body=await req.json();assert.equal(body.store,false);assert.equal(body.max_output_tokens,450);const evidence=body.text.format.schema.properties.evidence;assert.equal(evidence.type,'array');assert.equal(evidence.items.type,'string');
   for(const i of [0,1])assert(evidence.items.enum.includes('evidence_'+i+'_0'));
   // A deliberately nonconforming provider still cannot bypass the server.
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0','catalog:1'],reply:'REJECTED RAW MODEL TEXT',evidence:[{id:'catalog:0',quote:'INVENTED SOURCE EXCERPT'},{id:'catalog:1',quote:products[1].lines[0]}]})}]}]});
  }
  merchant++;const p=products.find(p=>p.url===req.url||p.url+'.js'===req.url);assert(p);
  if(req.url.endsWith('.js'))return Response.json({title:p.title,handle:new URL(p.url).pathname.split('/').at(-1),description:p.lines.join('\n'),variants:[]});
  return new Response(`<script type="application/ld+json">${JSON.stringify({'@type':'Product',url:p.url,name:p.title,description:p.lines.join('\n')})}</script>`,{headers:{'Content-Type':'text/html'}});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.22',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];const chat=async()=>{const r=await post('/api/chat',{tenant:'apavi40plus',locale:'en',message:'Compare these two products. Only use confirmed differences. '+products.map(p=>p.url).join(' ')},cookie);assert.equal(r.status,200);return r.json();};
  const first=await chat();assert.equal(first.catalogRevision,'buyer-v8');assert.equal(first.validationReason,'catalog_evidence_quote');assert.equal(first.validationDetail,'not_in_selected_source');assert(first.text.includes('natural suede'));assert(first.text.includes('artificial suede'));assert(!JSON.stringify(first).includes('REJECTED RAW MODEL TEXT'));assert(!JSON.stringify(first).includes('INVENTED SOURCE EXCERPT'));assert.deepEqual(first.sources.map(s=>s.url),products.map(p=>p.url));assert.equal(provider,1);assert.equal(merchant,2);
  const capped=await chat();assert.equal(capped.providerUsed,false);assert.equal(capped.fallbackReason,'total_budget');assert(capped.text.includes('natural suede'));assert(capped.text.includes('artificial suede'));assert.equal(provider,1);
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1')),state=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(state.total.reservedMicroUSD,10000);assert.equal(state.total.limitMicroUSD,10000);
  assert.equal((await post('/api/chat',{tenant:'bariba',locale:'en',message:'Compare'},cookie)).status,404);
 }finally{await mf.dispose();}
});

test('workerd/SQLite: reference protocol accepts three languages and stops at the existing cap',async()=>{
 const {products}=JSON.parse(await readFile(new URL('../test/fixtures/apavi-comparison-20261019.json',import.meta.url),'utf8'));let provider=0;
 const replies={ru:'У первой модели указана натуральная замша, у второй — искусственная замша.',lv:'Pirmajam modelim norādīta dabīgā zamšāda, otrajam — mākslīgā zamšāda.',en:'The first model lists natural suede; the second lists artificial suede.'};
 const mf=new Miniflare(convertV4MiniflareOptions({name:'comparison-reference-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{TENANT_ID:'apavi40plus',DEMO_PASSWORD:'synthetic-runtime-password',SESSION_SECRET:'runtime-test-secret-at-least-32-characters',CATALOG_ENABLED:'true',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',OPENAI_API_KEY:'fake-test-key',TOTAL_BUDGET_MICRO_USD:'30000'},serviceBindings:{ASSETS:async()=>{throw Error('No search');}},outboundService:async req=>{
  if(req.url==='https://api.openai.com/v1/responses'){
   provider++;const body=await req.json(),locale=body.instructions.match(/^Reply in (ru|lv|en),/)[1];assert.equal(body.text.format.schema.properties.evidence.items.type,'string');
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['catalog:0','catalog:1'],reply:replies[locale],evidence:['evidence_0_0','evidence_1_0']})}]}]});
  }
  const p=products.find(p=>p.url===req.url||p.url+'.js'===req.url);assert(p);
  return Response.json({title:p.title,handle:new URL(p.url).pathname.split('/').at(-1),description:p.lines.join('\n'),variants:[]});
 }}));
 const post=(path,body,cookie)=>mf.dispatchFetch('https://demo.example'+path,{method:'POST',headers:{Origin:'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.23',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 try{
  const login=await post('/api/login',{password:'synthetic-runtime-password'}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  for(const locale of ['ru','lv','en']){
   const message={ru:'Сравни эти два товара.',lv:'Salīdzini šīs divas preces.',en:'Compare these two products.'}[locale];
   const response=await post('/api/chat',{tenant:'apavi40plus',locale,message:message+' '+products.map(p=>p.url).join(' ')},cookie),data=await response.json();
   assert.equal(response.status,200);assert.equal(data.catalogRevision,'buyer-v8');assert.equal(data.conversational,true);assert.equal(data.text,replies[locale]);assert.equal(data.validationReason,undefined);
  }
  const capped=await(await post('/api/chat',{tenant:'apavi40plus',locale:'en',message:'Compare '+products.map(p=>p.url).join(' ')},cookie)).json();assert.equal(capped.fallbackReason,'total_budget');assert.equal(capped.providerUsed,false);assert.equal(provider,3);
 }finally{await mf.dispose();}
});
