import {productURL,fetchProduct,catalogAnswer,catalogError,canContinueProduct,isSizingQuestion} from './catalog.js';
import {shopLinks} from './shop-links.js';
import {validateMedia,visionRoute,mediaCopy,MEDIA_BODY_LIMIT} from './media.js';
import {dailyReservationLimit} from './guard.js';
import {detectLocale} from './locale.js';
import {getTenant} from './kb.js';
import {preflight,referenceRoute,render,aiRoute,RESERVE_MICRO_USD,clarificationTopics} from './core.js';
export {BudgetGuard} from './guard.js';
const encoder=new TextEncoder();
export const security={
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
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
 return equal(sig,await mac(env.SESSION_SECRET,`${new URL(req.url).origin}|${env.TENANT_ID||'owner'}|${expiry}.${nonce}`));
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
 if(!response.ok){const result=await response.json();const retry=Date.parse(result.retryAt),headers=Number.isFinite(retry)?{'Retry-After':String(Math.max(1,Math.ceil((retry-Date.now())/1000)))}:{};return reply({error:result.error||'guard_unavailable',reason:result.reason||null,retryAt:result.retryAt||null},response.status,headers);}
 return null;
}
function configError(env){
 if(env.TENANT_ID&&(!getTenant(env.TENANT_ID)||!env.DEMO_PASSWORD))return 'server_not_configured';
 if(!env.SESSION_SECRET||env.SESSION_SECRET.length<32)return 'server_not_configured';
 if(env.DEMO_PASSWORD&&env.DEMO_PASSWORD.length<12)return 'server_not_configured';
 if(env.AI_ENABLED==='true'&&(!env.OPENAI_API_KEY||!env.DEMO_PASSWORD))return 'ai_not_configured';
 return null;
}
export function createWorker(fetcher=fetch){return {
 async fetch(request,env){
  const url=new URL(request.url),isApi=url.pathname.startsWith('/api/');
  try{
   const locked=env.TENANT_ID||null;
   if(locked&&configError(env))return reply({error:'server_not_configured'},503);
   if(locked){
    const allowed=['/','/index.html','/api/config','/api/login','/api/logout','/api/chat','/api/media','/style.css','/brand.css','/favicon.svg'];
    if(!allowed.includes(url.pathname)&&!/^\/chat-ui\.[a-f0-9]{12}\.js$/.test(url.pathname))return reply({error:'not_found'},404);
    if(url.searchParams.getAll('shop').some(id=>id!==locked)||url.searchParams.getAll('tenant').some(id=>id!==locked))return reply({error:'not_found'},404);
   }
   if(url.pathname==='/api/config'&&request.method==='GET'){
    const tenant=getTenant(url.searchParams.get('tenant')||locked||'anete');if(!tenant)return reply({error:'unknown_tenant'},404);
    const error=configError(env);
    if(!locked&&env.DEMO_PASSWORD&&tenant.id!=='anete'&&!await authenticated(request,env))return reply({tenant:tenant.id,name:'Private demo',sources:[],contact:null,mode:'reference',locked:true,authenticated:false,ready:!error,error});
    return reply({perCallMicroUSD:RESERVE_MICRO_USD,dailyReservationMicroUSD:dailyReservationLimit(env,new Date().toISOString().slice(0,10)),tenant:tenant.id,name:tenant.name,sources:Object.values(tenant.sources),contact:tenant.contact,checked:tenant.checked,mode:env.AI_ENABLED==='true'?'ai':'reference',catalogEnabled:env.CATALOG_ENABLED==='true',authenticated:!error&&await authenticated(request,env),locked:!!env.DEMO_PASSWORD,ready:!error,error});
   }
   if(url.pathname==='/api/usage'&&request.method==='GET'){
    const error=configError(env);if(error||!env.DEMO_PASSWORD)return reply({error:'server_not_configured'},503);
    if(!await authenticated(request,env))return reply({error:'authentication_required'},401);
    if(!env.GUARD)return reply({error:'guard_unavailable'},503);
    const day=new Date().toISOString().slice(0,10),address=request.headers.get('CF-Connecting-IP')||'unknown';
    const client=await mac(env.SESSION_SECRET,`${day}:${address}`);
    const response=await env.GUARD.get(env.GUARD.idFromName('experiment-v1')).fetch('https://guard.internal/status',{headers:{'X-Demo-Client':client}});
    return reply(await response.json(),response.status);
   }
   if(isApi){
    if(request.method!=='POST')return reply({error:'method_not_allowed'},405,{'Allow':'POST'});
    if(!['/api/chat','/api/media','/api/login','/api/logout'].includes(url.pathname))return reply({error:'not_found'},404);
    if(request.headers.get('Origin')!==url.origin)return reply({error:'origin_denied'},403);
    if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return reply({error:'content_type'},415);
    const configuration=configError(env);if(configuration)return reply({error:configuration},503);
    if(url.pathname==='/api/logout')return reply({ok:true},200,{'Set-Cookie':'demo_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure'});
    if(url.pathname==='/api/login'){
     const denied=await gate(request,env,'auth',false);if(denied)return denied;
     const data=await readLimited(request,1024);
     if(typeof data.password!=='string'||data.password.length>128)return reply({error:'invalid_input'},400);
     if(!env.DEMO_PASSWORD||!equal(await mac(env.SESSION_SECRET,data.password),await mac(env.SESSION_SECRET,env.DEMO_PASSWORD)))return reply({error:'login_failed'},401);
     const nonce=crypto.randomUUID().replaceAll('-',''),value=`${Date.now()+7199000}.${nonce}`,sig=await mac(env.SESSION_SECRET,`${url.origin}|${env.TENANT_ID||'owner'}|${value}`);
     const secure=url.protocol==='https:'?'; Secure':'';
     return reply({ok:true},200,{'Set-Cookie':`demo_session=${value}.${sig}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7199${secure}`});
    }
    if(!await authenticated(request,env))return reply({error:'authentication_required'},401);
    if(url.pathname==='/api/media'){
     const data=await readLimited(request,MEDIA_BODY_LIMIT);
     if(!data||typeof data!=='object'||typeof data.tenant!=='string'||locked&&data.tenant!==locked)return reply({error:'unknown_tenant'},404);
     const tenant=getTenant(data.tenant);if(!tenant)return reply({error:'unknown_tenant'},404);
     if(!['ru','lv','en'].includes(data.locale)||typeof data.message!=='string'||data.message.length>1000)return reply({error:'invalid_input'},400);
     const media=validateMedia(data.media),locale=detectLocale(data.message,data.locale),copy=mediaCopy[locale];
     const blocked=preflight(data.message,tenant.id),enabled=env.AI_ENABLED==='true'&&!blocked;
     const denied=await gate(request,env,'chat',enabled);
     if(denied){const reason=await denied.clone().json();if(enabled&&reason.error==='budget_exhausted'){const rateDenied=await gate(request,env,'chat',false);if(rateDenied)return rateDenied;return reply({...render(tenant.id,locale,{ids:[],kind:'product-clarify',handoff:false},'reference'),text:copy.budget,providerUsed:false,mediaAnalysed:false});}return denied;}
     if(blocked)return reply({...render(tenant.id,locale,{ids:[],kind:blocked,handoff:false},'safety'),mediaAnalysed:false});
     if(!enabled)return reply({...render(tenant.id,locale,{ids:[],kind:'product-clarify',handoff:false},'reference'),text:copy.disabled,providerUsed:false,mediaAnalysed:false});
     const route=visionRoute(tenant,data.message,media);
     const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(route.body),signal:AbortSignal.timeout(15000)});
     if(!response.ok)return reply({error:'ai_unavailable'},502);
     const result=route.parse(await response.json()),out=render(tenant.id,locale,{ids:result.intent==='damage'?['defect']:[],kind:'product-clarify',handoff:result.intent==='damage'},'ai');
     const prefix=media.kind==='video'?copy.video:'';
     out.text=prefix+(result.intent==='private_data'?copy.private:result.intent==='damage'?copy.damage+out.text:result.model!=='unknown'?copy.confirm+result.model+copy.confirmEnd:copy.unknown);
     return reply({...out,providerUsed:true,mediaAnalysed:true});
    }
    const data=await readLimited(request);
    if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.message!=='string'||!data.message.trim()||data.message.length>1000||!['ru','lv','en'].includes(data.locale)||typeof data.tenant!=='string')return reply({error:'invalid_input'},400);
    if(locked&&data.tenant!==locked)return reply({error:'unknown_tenant'},404);
    const tenant=getTenant(data.tenant);if(!tenant)return reply({error:'unknown_tenant'},404);
    const linked=shopLinks(data.message,tenant);
    data.locale=detectLocale(linked.clean,data.locale);
    const previous=tenant.cards.some(c=>c.id===data.previousTopic)||clarificationTopics.includes(data.previousTopic)?data.previousTopic:null;
    const blocked=preflight(data.message,tenant.id);
    const ref=referenceRoute(data.message,previous,tenant.id);
    const contextURL=typeof data.productURL==='string'&&canContinueProduct(linked.clean)?productURL(data.productURL,tenant):null;
    const productLink=linked.links.length===1?productURL(linked.links[0].url,tenant):!linked.links.length?contextURL:null;
    const productQuery=!!linked.links.length||!!contextURL&&canContinueProduct(linked.clean)||/размер|сетк|стельк|состав|материал|вес|батар|налич|цен|сколько|size|chart|insole|ingredient|material|weight|batter|availab|stock|price|izmēr|sastāv|materiāl|svars|bater|pieejam/iu.test(linked.clean);
    if(env.CATALOG_ENABLED==='true'&&!blocked&&productLink&&productQuery&&!ref.handoff&&!ref.social&&!/достав|оплат|возврат|гарант|delivery|shipping|payment|return|warranty|piegād|apmaks|atgrie|garant/iu.test(linked.clean)){
     const denied=await gate(request,env,'chat',false);if(denied)return denied;
     const base=render(tenant.id,data.locale,{ids:[],kind:'product-clarify',handoff:false},'reference');
     try{const product=await fetchProduct(productLink,tenant,fetcher,typeof caches!=='undefined'?caches.default:null);return reply({...base,text:catalogAnswer(product,linked.clean,data.locale,previous),sources:[{title:product.title,url:product.url,kind:'product'}],checked:product.checkedAt,topic:isSizingQuestion(linked.clean,previous)?'product-sizing':null,productURL:product.url,productRead:true,cached:product.cached,providerUsed:false,mode:'catalog'});}catch{return reply({...base,text:catalogError(data.locale),productURL:productLink,productRead:false,providerUsed:false,mode:'catalog'});}
    }
    const useAI=env.AI_ENABLED==='true'&&!blocked&&!ref.social&&!ref.ids.includes('contact')&&!ref.ids.some(id=>tenant.cards.find(c=>c.id===id)?.source==='niche-product')&&!['product-live','product-clarify','product-sizing','product-help','product-safety','product-unverified','product-linked','product-linked-size','product-linked-size-chart','shop-link','link-unsupported'].includes(ref.kind)&&ref.kind!=='greeting';
    const route=useAI?await aiRoute(tenant,linked.query,previous):null;
    const denied=await gate(request,env,'chat',useAI);
    if(denied){
     const details=await denied.clone().json();
     if(useAI&&details.error==='budget_exhausted'){
      // Do not bypass message caps: the declined paid reservation counted no message.
      const rateDenied=await gate(request,env,'chat',false);if(rateDenied)return rateDenied;
      return reply({...render(data.tenant,data.locale,ref,'reference'),providerUsed:false,fallbackReason:details.reason||'budget_exhausted'});
     }
     return denied;
    }
    if(blocked)return reply(render(data.tenant,data.locale,{ids:[],kind:blocked,handoff:false},'safety'));
    if(!useAI)return reply(render(data.tenant,data.locale,ref,ref.social?'social':'reference'));
    // No provider retries: ambiguous failures retain budget reservation.
    const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(route.body),signal:AbortSignal.timeout(15000)});
    if(!response.ok)return reply({error:'ai_unavailable'},502);
    const result=route.parse(await response.json());
    return reply({...render(data.tenant,data.locale,result,result.social?'social':'ai'),providerUsed:true});
   }
   if(!locked&&env.DEMO_PASSWORD&&/^\/(demos|qa|usage)(?:[/.]|$)/.test(url.pathname)){
    if(!env.DEMO_PASSWORD||!await authenticated(request,env)){const target=url.pathname.split(/[/.]/)[1];return new Response(null,{status:302,headers:{...security,Location:'/?return='+target}});}
   }
   if(!['GET','HEAD'].includes(request.method))return reply({error:'method_not_allowed'},405);
   if(!/^\/chat-ui\.[a-f0-9]{12}\.js$/.test(url.pathname)&&!['/','/index.html','/app.js','/branding.js','/brand.css','/contact.js','/qa','/qa/','/qa.html','/qa.js','/qa-cases.js','/qa-core.js','/qa.css','/style.css','/favicon.svg','/usage','/usage/','/usage.html','/usage.js','/demos','/demos/','/demos.html'].includes(url.pathname))return reply({error:'not_found'},404);
   const res=await env.ASSETS.fetch(request),headers=new Headers(res.headers);
   for(const [k,v] of Object.entries(security))headers.set(k,v);
   return new Response(res.body,{status:res.status,headers});
  }catch(error){
   const invalid=['body','too_large','media_invalid'].includes(error.message)||error instanceof SyntaxError||error instanceof TypeError;
   return reply({error:invalid?'invalid_input':'service_unavailable'},invalid?400:503);
  }
 }
};}
export default createWorker();
