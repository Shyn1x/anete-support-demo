import test from 'node:test';import assert from 'node:assert/strict';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {getTenant} from '../src/kb.js';
const options={name:'fast-faq-runtime',modules:true,scriptPath:'worker-build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},bindings:{SESSION_SECRET:'runtime-fast-faq-signing-secret-at-least-32',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',DEMO_PASSWORD:'runtime-fast-faq-password',OPENAI_API_KEY:'fake-no-real-key'}};
const headers={Origin:'https://demo.example','Content-Type':'application/json'};
test('workerd/SQLite: six shops, three languages, free FAQ remains rate-limited at exhausted budget',async()=>{
 let outbound=0;const mf=new Miniflare(convertV4MiniflareOptions({...options,outboundService:()=>{outbound++;throw Error('No outbound allowed');}}));
 try{
  const cfg=await(await mf.dispatchFetch('https://demo.example/api/config')).json();assert.equal(cfg.fastFaqRevision,'fast-faq-v1');
  const login=await mf.dispatchFetch('https://demo.example/api/login',{method:'POST',headers,body:JSON.stringify({password:options.bindings.DEMO_PASSWORD})}),cookie=login.headers.get('Set-Cookie').split(';')[0];
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));
  // Exhaust only this ephemeral test namespace using its ordinary reservation
  // API. No production namespace, credentials or counters are accessed.
  for(let i=0;i<50;i++){const r=await stub.fetch('https://guard/check',{method:'POST',body:JSON.stringify({ip:i.toString(16).padStart(64,'0'),kind:'chat',reserve:true})});assert.equal(r.status,200);}
  const getStatus=async()=>await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();
  const before=await getStatus();assert.equal(before.blockedBy,'daily_budget');let i=0;
  for(const shop of ['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs'])for(const [locale,message,id]of [['ru','Какие способы доставки есть?','delivery'],['lv','Kā apmaksāt pasūtījumu?','payment'],['en','Can I collect in person?','pickup']]){
   const r=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{...headers,cookie,'CF-Connecting-IP':'192.0.2.'+(++i)},body:JSON.stringify({tenant:shop,locale,message})}),out=await r.json();
   assert.equal(r.status,200);assert.equal(out.fastReply,true);assert.equal(out.providerUsed,false);assert.deepEqual(out.cardIds,[id]);assert.equal(out.locale,locale);assert.equal(out.contact.email,getTenant(shop).contact.email);
  }
  const r=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{...headers,cookie,'CF-Connecting-IP':'192.0.2.200'},body:JSON.stringify({tenant:'celotajs',locale:'ru',message:'Как вернуть товар?'})}),out=await r.json();assert.equal(out.fastReply,true);assert(out.text.includes('celotajs@veikalscelotajs.lv'));assert(out.text.includes('исключения'));
  for(let n=0;n<11;n++){const res=await mf.dispatchFetch('https://demo.example/api/chat',{method:'POST',headers:{...headers,cookie,'CF-Connecting-IP':'192.0.2.201'},body:JSON.stringify({tenant:'bariba',locale:'en',message:'Delivery'})});assert.equal(res.status,n<10?200:429);}
  const after=await getStatus();assert.equal(after.total.reservedMicroUSD,before.total.reservedMicroUSD);assert.equal(after.daily.reservedMicroUSD,before.daily.reservedMicroUSD);assert.equal(outbound,0);
 }finally{await mf.dispose();}
});
