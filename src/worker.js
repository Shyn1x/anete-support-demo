import {detectLocale} from './locale.js';
import {getTenant} from './kb.js';
import {preflight,referenceRoute,render,aiRoute} from './core.js';
export {BudgetGuard} from './guard.js';
const encoder=new TextEncoder();
export const security={
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow',
 'Strict-Transport-Security':'max-age=31536000'
};
const reply=(data,status=200,extra={})=>Response.json(data,{status,headers:{...security,...extra}});
async function mac(secret,value){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const equal=(a,b)=>{if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;};
async function authenticated(req,env){
 if(!env.DEMO_PASSWORD)return true;
 const token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('demo_session='))?.slice(13);
 if(!token)return false;
 const [expiry,nonce,sig,...rest]=token.split('.');
 if(rest.length||!/^\d{13}$/.test(expiry)||!/^\w{32}$/.test(nonce||'')||!/^[a-f0-9]{64}$/.test(sig||'')||Number(expiry)<Date.now()||Number(expiry)>Date.now()+7200000)return false;
 return equal(sig,await mac(env.SESSION_SECRET,`${expiry}.${nonce}`));
}
export async function readLimited(req,max=4096){
 if(!req.body)throw new Error('body');
 const reader=req.body.getReader();let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('too_large');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function gate(req,env,kind,reserve){
 if(!env.GUARD)throw new Error('guard_missing');
 // Only Cloudflare's managed client-IP header is trusted, never X-Forwarded-For.
 const address=req.headers.get('CF-Connecting-IP')||'unknown';
 const day=new Date().toISOString().slice(0,10);
 const ip=await mac(env.SESSION_SECRET,`${day}:${address}`);
 const id=env.GUARD.idFromName('experiment-v1'); // shared hard cap across all tenants
 const response=await env.GUARD.get(id).fetch('https://guard.internal/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip,kind,reserve})});
 if(!response.ok){const result=await response.json();return reply({error:result.error||'guard_unavailable'},response.status);}
 return null;
}
function configError(env){
 if(!env.SESSION_SECRET||env.SESSION_SECRET.length<32)return 'server_not_configured';
 if(env.DEMO_PASSWORD&&env.DEMO_PASSWORD.length<12)return 'server_not_configured';
 if(env.AI_ENABLED==='true'&&(!env.OPENAI_API_KEY||!env.DEMO_PASSWORD))return 'ai_not_configured';
 return null;
}
export function createWorker(fetcher=fetch){return {
 async fetch(request,env){
  const url=new URL(request.url),isApi=url.pathname.startsWith('/api/');
  try{
   if(url.pathname==='/api/config'&&request.method==='GET'){
    const error=configError(env);
    return reply({tenant:'anete',checked:getTenant('anete').checked,mode:env.AI_ENABLED==='true'?'ai':'reference',authenticated:!error&&await authenticated(request,env),locked:!!env.DEMO_PASSWORD,ready:!error,error});
   }
   if(isApi){
    if(request.method!=='POST')return reply({error:'method_not_allowed'},405,{'Allow':'POST'});
    if(!['/api/chat','/api/login','/api/logout'].includes(url.pathname))return reply({error:'not_found'},404);
    if(request.headers.get('Origin')!==url.origin)return reply({error:'origin_denied'},403);
    if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply({error:'content_type'},415);
    const configuration=configError(env);if(configuration)return reply({error:configuration},503);
    if(url.pathname==='/api/logout')return reply({ok:true},200,{'Set-Cookie':'demo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure'});
    if(url.pathname==='/api/login'){
     const denied=await gate(request,env,'auth',false);if(denied)return denied;
     const data=await readLimited(request,1024);
     if(typeof data.password!=='string'||data.password.length>128)return reply({error:'invalid_input'},400);
     if(!env.DEMO_PASSWORD||!equal(await mac(env.SESSION_SECRET,data.password),await mac(env.SESSION_SECRET,env.DEMO_PASSWORD)))return reply({error:'login_failed'},401);
     const nonce=crypto.randomUUID().replaceAll('-',''),value=`${Date.now()+7199000}.${nonce}`,sig=await mac(env.SESSION_SECRET,value);
     const secure=url.protocol==='https:'?'; Secure':'';
     return reply({ok:true},200,{'Set-Cookie':`demo_session=${value}.${sig}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7199${secure}`});
    }
    if(!await authenticated(request,env))return reply({error:'authentication_required'},401);
    const data=await readLimited(request);
    if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.message!=='string'||!data.message.trim()||data.message.length>1000||!['ru','lv','en'].includes(data.locale)||typeof data.tenant!=='string')return reply({error:'invalid_input'},400);
    const tenant=getTenant(data.tenant);if(!tenant)return reply({error:'unknown_tenant'},404);
    data.locale=detectLocale(data.message,data.locale);
    const previous=tenant.cards.some(c=>c.id===data.previousTopic)?data.previousTopic:null;
    const blocked=preflight(data.message);
    const ref=referenceRoute(data.message,previous);
    const useAI=env.AI_ENABLED==='true'&&!blocked&&!ref.social&&ref.kind!=='greeting';
    const denied=await gate(request,env,'chat',useAI);if(denied)return denied;
    if(blocked)return reply(render(data.tenant,data.locale,{ids:[],kind:blocked,handoff:false},'safety'));
    if(!useAI)return reply(render(data.tenant,data.locale,ref,ref.social?'social':'reference'));
    const route=await aiRoute(tenant,data.message,previous);
    // No provider retries: ambiguous failures retain budget reservation.
    const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(route.body),signal:AbortSignal.timeout(15000)});
    if(!response.ok)return reply({error:'ai_unavailable'},502);
    const result=route.parse(await response.json());
    return reply(render(data.tenant,data.locale,result,'ai'));
   }
   if(!['GET','HEAD'].includes(request.method))return reply({error:'method_not_allowed'},405);
   if(!['/','/index.html','/app.js','/style.css','/favicon.svg'].includes(url.pathname))return reply({error:'not_found'},404);
   const res=await env.ASSETS.fetch(request),headers=new Headers(res.headers);
   for(const [k,v] of Object.entries(security))headers.set(k,v);
   return new Response(res.body,{status:res.status,headers});
  }catch(error){
   const invalid=['body','too_large'].includes(error.message)||error instanceof SyntaxError||error instanceof TypeError;
   return reply({error:invalid?'invalid_input':'service_unavailable'},invalid?400:503);
  }
 }
};}
export default createWorker();
