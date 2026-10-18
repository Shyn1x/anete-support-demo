import test from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const publicJwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
const bundle=await build({stdin:{contents:"import {studioChat} from './src/studio.js';export {BudgetGuard} from './src/guard.js';export default {fetch(r,env){return studioChat(r,env,fetch,JSON.parse(env.TEST_PUBLIC_KEY));}}",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',write:false});
for(const status of [200,307])test('studio provider uses real workerd fetch, one attempt and no redirects: '+status,async()=>{
 let calls=0;const mf=new Miniflare(convertV4MiniflareOptions({name:'studio-transport',modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-01',bindings:{TEST_PUBLIC_KEY:JSON.stringify(publicJwk),OPENAI_API_KEY:'fake-test-only',AI_ENABLED:'true',AI_CONVERSATIONAL:'true'},durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},outboundService:async req=>{calls++;assert.equal(req.url,'https://api.openai.com/v1/responses');assert.equal(req.headers.get('Authorization'),'Bearer fake-test-only');const data=await req.json();assert.equal(data.store,false);if(status===307)return new Response(null,{status,headers:{Location:'https://never-follow.example.test/'}});return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['about'],reply:'Lomenti builds websites and chatbots. What would you like to build?'})}]}]});}}));
 try{const raw=JSON.stringify({message:'What is this website?',locale:'en',history:[],client:'a'.repeat(64),nonce:'a'.repeat(32)}),time=String(Date.now());const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(time+'\n'+raw))).toString('hex');const r=await mf.dispatchFetch('https://owner.test/api/lomenti-chat',{method:'POST',headers:{'X-Lomenti-Time':time,'X-Lomenti-Signature':signature},body:raw});assert.equal(r.status,200);assert.equal(calls,1);assert.equal((await r.json()).mode,status===200?'ai':'fallback');const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));const usage=await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();assert.equal(usage.total.reservedMicroUSD,10000);}finally{await mf.dispose();}
});

test('studio farewell regression in real workerd: zero provider calls, normal resumption and unchanged exhausted reserve',async()=>{
 let calls=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'studio-farewell',modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-01',bindings:{TEST_PUBLIC_KEY:JSON.stringify(publicJwk),OPENAI_API_KEY:'fake-test-only',AI_ENABLED:'true',AI_CONVERSATIONAL:'true',DAILY_BUDGET_MICRO_USD:'10000',TOTAL_BUDGET_MICRO_USD:'10000'},durableObjects:{GUARD:{className:'BudgetGuard',useSQLite:true}},outboundService:async req=>{
  calls++;assert.equal(req.url,'https://api.openai.com/v1/responses');const body=await req.json();assert.equal(body.store,false);
  return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:['website'],reply:'A website costs approximately 350–900 €.'})}]}]});
 }}));
 const closing='You’re welcome! Have a lovely day too 🙂';
 async function signedRequest(message,locale='en',history=[]){
  const body=JSON.stringify({message,locale,history,client:'a'.repeat(64),nonce:crypto.randomUUID().replaceAll('-','')}),time=String(Date.now());
  const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(time+'\n'+body))).toString('hex');
  return {method:'POST',headers:{'X-Lomenti-Time':time,'X-Lomenti-Signature':signature},body};
 }
 try{
  const ns=await mf.getDurableObjectNamespace('GUARD'),stub=ns.get(ns.idFromName('experiment-v1'));
  const usage=async()=>await(await stub.fetch('https://guard/status',{headers:{'X-Demo-Client':'a'.repeat(64)}})).json();
  for(const [locale,message]of [['en','Thank you! Have a nice day.'],['ru','Спасибо. Хорошего дня!'],['lv','Paldies! Jauku dienu!']]){
   const r=await mf.dispatchFetch('https://owner.test/api/lomenti-chat',await signedRequest(message,locale));assert.equal(r.status,200);const data=await r.json();assert.equal(data.mode,'social');assert.equal(data.locale,locale);assert.equal(data.providerUsed,false);assert.doesNotMatch(data.text,/\?|website|проект|projekt/iu);
  }
  assert.equal(calls,0);assert.equal((await usage()).total.reservedMicroUSD,0);
  const follow=await mf.dispatchFetch('https://owner.test/api/lomenti-chat',await signedRequest('Actually, how much does a website cost?','en',[{role:'user',text:'Thank you! Have a nice day.'},{role:'assistant',text:closing}]));
  assert.equal(follow.status,200);assert.equal((await follow.json()).mode,'ai');assert.equal(calls,1);assert.equal((await usage()).total.reservedMicroUSD,10000);
  const ending=await signedRequest('Thank you! Have a nice day.');
  const last=await mf.dispatchFetch('https://owner.test/api/lomenti-chat',ending);assert.equal(last.status,200);assert.equal((await last.json()).text,closing);assert.equal(calls,1);assert.equal((await usage()).total.reservedMicroUSD,10000);
  assert.equal((await mf.dispatchFetch('https://owner.test/api/lomenti-chat',ending)).status,409);assert.equal(calls,1);
 }finally{await mf.dispose();}
});
