// Read-only product pages. No arbitrary origins, scripts, account data, AI prose or stock guarantees.
import {shopLinks} from './shop-links.js';
export const CATALOG_TTL=300,CATALOG_MAX_BYTES=800000;
const shopifyTenants=new Set(['apavi40plus','celotajs']);
const patterns={apavi40plus:/^\/(?:ru\/|lv\/|en\/|et\/|de\/)?products\/[\p{L}\p{N}-]+\/?$/iu,celotajs:/^\/(?:en\/|lv\/)?products\/[\p{L}\p{N}-]+\/?$/iu,rotallieta:/^\/prece\/[\p{L}\p{N}-]+\/?$/iu,bariba:/^\/[\p{L}\p{N}_.-]+\.html$/iu,hobbyset:/^\/products\/(?:lv|ru|en)\/\d+\/\d+\/[\p{L}\p{N}_.,%/×“”„–— -]+\.html$/iu};
export function productURL(value,tenant){
 if(typeof value!=='string'||value.length>1500||/[\s\\]/u.test(value))return null;
 const parsed=shopLinks(value,tenant);if(parsed.rejected||parsed.links.length!==1||parsed.clean)return null;
 const u=new URL(parsed.links[0].url);let path;try{path=decodeURIComponent(u.pathname);}catch{return null;}
 if(!patterns[tenant.id]?.test(path)||path.includes('..')||/\/\//.test(path))return null;
 return u.href;
}
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',times:'×',ndash:'–',mdash:'—'};
export function plain(html){return String(html||'').slice(0,150000).replace(/<!--[\s\S]*?-->|<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/giu,'').replace(/<\/?(?:p|li|h[1-6]|tr|div|br)\b[^>]*>/giu,'\n').replace(/<[^>]*>/gu,' ').replace(/\\n|\\r/gu,'\n').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu,(all,key)=>{if(key[0]!=='#')return entities[key.toLowerCase()]??all;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);return n>0&&n<=1114111?String.fromCodePoint(n):'';}).replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
function block(html,pattern){const match=pattern.exec(html);if(!match)return '';const start=match.index,tag=match[1]||'div';const re=new RegExp('<(/?)'+tag+'\\b[^>]*>','gi');re.lastIndex=start;let depth=0,m;while((m=re.exec(html))){depth+=m[1]?-1:1;if(depth===0)return html.slice(start,re.lastIndex);if(re.lastIndex-start>100000)return '';}return '';}
function productNodes(html,url){const nodes=[];const walk=(x,depth=0)=>{if(depth>6||!x||typeof x!=='object'||nodes.length>100)return;if(Array.isArray(x)){for(const v of x.slice(0,300))walk(v,depth+1);return;}const types=Array.isArray(x['@type'])?x['@type']:[x['@type']];if(types.some(t=>['Product','ProductGroup'].includes(t)))nodes.push(x);if(x['@graph'])walk(x['@graph'],depth+1);};for(const m of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu)){if(m[1].length>250000)continue;try{walk(JSON.parse(m[1]));}catch{}}
 const normalized=v=>{try{const u=new URL(v,url);u.search='';u.hash='';u.pathname=u.pathname.replace(/^\/(ru|lv|en|et|de)(?=\/)/,'');return u.href.replace(/\/$/,'');}catch{return null;}};
 return nodes.find(x=>normalized(x.url||x['@id'])===normalized(url))||null;
}
const arr=x=>Array.isArray(x)?x:x?[x]:[];
function offer(raw){const o=arr(raw)[0];if(!o||typeof o!=='object')return {state:'unknown'};const p=arr(o.priceSpecification)[0]||o;const rawPrice=o.price??p.price,n=Number(rawPrice);const currency=o.priceCurrency||p.priceCurrency;const price=rawPrice!==null&&rawPrice!==undefined&&String(rawPrice).trim()!==''&&Number.isFinite(n)&&n>=0&&n<100000&&/^[A-Z]{3}$/.test(currency||'')?{amount:n,currency}:null;const status=String(o.availability||'').split('/').at(-1);return {state:status==='InStock'?'in_stock':status==='OutOfStock'?'out_of_stock':/PreOrder|BackOrder/.test(status)?'preorder':'unknown',price};}
const productIdentity=value=>{const u=new URL(value);return decodeURIComponent(u.pathname).replace(/^\/(ru|lv|en|et|de)(?=\/)/,'').replace(/\/$/,'');};
export function parseProduct(html,url,tenant){
 let title='',description='',variants=[],summary={state:'unknown'};
 const node=productNodes(html,url);
 if(node){title=plain(node.name);description=plain(node.description);summary=offer(node.offers);variants=arr(node.hasVariant).slice(0,250).map(v=>{const name=plain(v.name);return {label:plain(typeof v.size==='string'?v.size:name.startsWith(title+' - ')?name.slice(title.length+3):'').slice(0,60),...offer(v.offers)};}).filter(x=>x.label);}
 else if(tenant.id==='bariba'){title=plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1]);description=plain(block(html,/<(div)\b[^>]*\bid=["']tab-description["'][^>]*>/iu));}
 else if(tenant.id==='hobbyset'){title=plain(block(html,/<(div)\b[^>]*class=["'][^"']*inner_product_name[^"']*["'][^>]*>/iu));description=plain(block(html,/<(div)\b[^>]*class=["'][^"']*inner_product_description[^"']*["'][^>]*>/iu));}
 return productFacts(title,description,variants,summary,url,'html');
}
function productFacts(title,description,variants,summary,url,format){
 if(!title||title.length>240||description.length<5||/access denied|just a moment|captcha|attention required/i.test(title))throw Error('catalog_parse');
 const lines=description.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>2&&!/ignore.{0,30}instruction|system prompt|api.?key|игнориру|системн.{0,10}инструк|ignorē.{0,15}instruk/i.test(x));
 const chart=[];for(const line of lines){const m=line.match(/^(\d{2}(?:[.,]\d)?)(?:\.?\s*(?:izm[eē]rs|размер|size))?\s*[-–—:]\s*(\d{2}(?:[.,]\d{1,2})?)\s*(?:cm|см)(?=\s|[.,;:]|$)/iu);if(m)chart.push({size:m[1].replace(',','.'),cm:m[2].replace(',','.')});}
 const measure=/iekšzolei|длин.{0,8}стельк|insole length/iu.test(description)?'insole':/pēdas garum|длин.{0,8}стоп|foot length/iu.test(description)?'foot':'unspecified';
 return {title,url,lines:lines.slice(0,120).map(x=>x.slice(0,2200)),variants,summary,chart:chart.slice(0,40),measure,format,checkedAt:new Date().toISOString()};
}
export function parseShopifyProduct(json,url,tenant){
 if(!shopifyTenants.has(tenant.id)||!productURL(url,tenant)||!json||typeof json!=='object'||Array.isArray(json)||typeof json.title!=='string'||typeof json.description!=='string'||json.handle!==productIdentity(url).split('/').at(-1)||!Array.isArray(json.variants))throw Error('catalog_parse');
 if(json.url){const own=productURL(new URL(json.url,url).href,tenant);if(!own||productIdentity(own)!==productIdentity(url))throw Error('catalog_parse');}
 const state=value=>value===true?'in_stock':value===false?'out_of_stock':'unknown';
 const variants=json.variants.slice(0,250).filter(v=>v&&typeof v.title==='string'&&v.title!=='Default Title').map(v=>({label:plain(v.title).slice(0,60),state:state(v.available),price:null})).filter(v=>v.label);
 // Ajax prices have no verified presentment currency here. Never assume EUR or read a cart.
 return productFacts(plain(json.title),plain(json.description),variants,{state:state(json.available),price:null},url,'shopify-json');
}
async function readText(res){const size=Number(res.headers.get('content-length'));if(size>CATALOG_MAX_BYTES)throw Error('catalog_size');const reader=res.body?.getReader();if(!reader)throw Error('catalog_body');let count=0,chunks=[];while(true){const x=await reader.read();if(x.done)break;count+=x.value.length;if(count>CATALOG_MAX_BYTES){await reader.cancel();throw Error('catalog_size');}chunks.push(x.value);}const b=new Uint8Array(count);let at=0;for(const x of chunks){b.set(x,at);at+=x.length;}return new TextDecoder('utf-8',{fatal:true}).decode(b);}
export async function fetchProduct(url,tenant,fetcher=fetch,cache=null){
 let target=productURL(url,tenant);if(!target)throw Error('catalog_url');const key=new Request('https://catalog-cache.invalid/'+tenant.id+'?url='+encodeURIComponent(target));
 if(cache){try{const hit=await cache.match(key);if(hit){const data=await hit.json();if(data.url===target&&Date.now()-Date.parse(data.checkedAt)>=0&&Date.now()-Date.parse(data.checkedAt)<CATALOG_TTL*1000)return {...data,cached:true};}}catch{}}
 const original=target,signal=AbortSignal.timeout(18000),attempts=[];
 const options=(accept,timeout=6500)=>({method:'GET',redirect:'manual',signal:AbortSignal.any([signal,AbortSignal.timeout(timeout)]),headers:{Accept:accept}});
 const success=async data=>{if(cache){try{await cache.put(key,Response.json({...data,url:original},{headers:{'Cache-Control':'public,max-age='+CATALOG_TTL}}));}catch{}}return {...data,url:original,cached:false};};
 try{for(let attempt=0;attempt<2;attempt++){
  const res=await fetcher(target,options('text/html'));
  if(res.status>=300&&res.status<400){const next=new URL(res.headers.get('Location')||'',target).href;target=productURL(next,tenant);if(!target||attempt===1||productIdentity(target)!==productIdentity(original))throw Error('catalog_redirect');continue;}
  if(!res.ok)throw Error('catalog_http_'+res.status);
  if(!/^text\/html\b/i.test(res.headers.get('Content-Type')||''))throw Error('catalog_mime');
  return await success(parseProduct(await readText(res),target,tenant));
 }}catch(error){attempts.push({format:'html',error:failureReason(error)});if(error.message==='catalog_redirect')throw catalogFailure(attempts);}
 if(shopifyTenants.has(tenant.id)&&!signal.aborted){
  try{const endpoint=new URL(original);endpoint.pathname=endpoint.pathname.replace(/\/$/,'')+'.js';
   const res=await fetcher(endpoint.href,options('application/json',10000));
   if(res.status>=300&&res.status<400)throw Error('catalog_redirect');
   if(!res.ok)throw Error('catalog_http_'+res.status);
   if(!/^(?:application\/json|text\/javascript|application\/javascript)\b/i.test(res.headers.get('Content-Type')||''))throw Error('catalog_mime');
   let json;try{json=JSON.parse(await readText(res));}catch(error){if(error instanceof SyntaxError)throw Error('catalog_parse');throw error;}
   return await success(parseShopifyProduct(json,original,tenant));
  }catch(error){attempts.push({format:'shopify-json',error:failureReason(error)});}
 }
 throw catalogFailure(attempts);
}
function failureReason(error){const m=String(error?.message||'');return /^catalog_(?:http_\d{3}|url|redirect|mime|parse|size|body)$/.test(m)?m.slice(8):['AbortError','TimeoutError'].includes(error?.name)?'timeout':'network';}
function catalogFailure(attempts){const error=Error('catalog_failed');error.catalogAttempts=attempts;return error;}
export function catalogDiagnostics(error){return {attempts:(error?.catalogAttempts||[]).slice(0,2).filter(x=>['html','shopify-json'].includes(x?.format)&&/^(?:http_\d{3}|url|redirect|mime|parse|size|body|timeout|network)$/.test(x?.error)).map(x=>({format:x.format,error:x.error}))};}
const words={
 ru:{read:'Прочитана карточка',snapshot:'Данные страницы на',notWarehouse:'Это сведения страницы, не подтверждение физического остатка или резервирование.',variants:'Варианты, указанные в карточке',found:'Указан вариант',notFound:'Запрошенный вариант не найден в полученных данных. Это не доказательство отсутствия товара.',noChart:'В полученном описании нет соответствия этого размера длине в сантиметрах. Пересчитывать по универсальной таблице не буду; уточните у магазина.',chart:'В таблице этой карточки',insole:'длина стельки',foot:'длина стопы',measurement:'указанный замер',noFit:'Это данные конкретной модели, а не гарантия подходящей посадки.',price:'Цена, указанная на странице',noPrice:'Подтверждённая цена для этого варианта не найдена; проверьте оформление заказа.',states:{in_stock:'страница отмечает как доступный',out_of_stock:'страница отмечает как недоступный',preorder:'на странице указан предзаказ/ожидание',unknown:'доступность не подтверждена'},excerpt:'Из описания магазина (язык источника)',missing:'Этот параметр в прочитанных данных не найден. Уточните его у магазина.',error:'Не удалось надёжно прочитать карточку. Попробуйте позже или уточните параметр у магазина. Я не буду подставлять сведения другого товара.'},
 lv:{read:'Nolasīta preces lapa',snapshot:'Lapas dati uz',notWarehouse:'Tie ir lapas dati, nevis fiziskā atlikuma apstiprinājums vai rezervācija.',variants:'Lapā norādītie varianti',found:'Norādīts variants',notFound:'Pieprasītais variants saņemtajos datos nav atrasts. Tas nepierāda preces neesamību.',noChart:'Saņemtajā aprakstā šim izmēram nav atbilstības centimetros. Universālu tabulu nepiemērošu; jautājiet veikalam.',chart:'Šīs preces tabulā',insole:'iekšzoles garums',foot:'pēdas garums',measurement:'norādītais mērījums',noFit:'Tie ir konkrētā modeļa dati, nevis piemērota pieguluma garantija.',price:'Lapā norādītā cena',noPrice:'Šī varianta cena nav apstiprināta; pārbaudiet pasūtījuma noformēšanu.',states:{in_stock:'lapā atzīmēts kā pieejams',out_of_stock:'lapā atzīmēts kā nepieejams',preorder:'lapā norādīta iepriekšpasūtīšana/gaidīšana',unknown:'pieejamība nav apstiprināta'},excerpt:'No veikala apraksta (avota valodā)',missing:'Šis parametrs nolasītajos datos nav atrasts. Precizējiet veikalā.',error:'Preces lapu nevarēja droši nolasīt. Mēģiniet vēlāk vai jautājiet veikalam. Citas preces datus nepiemērošu.'},
 en:{read:'Product page read',snapshot:'Page data checked at',notWarehouse:'This is page information, not confirmation of physical stock or a reservation.',variants:'Variants listed on the page',found:'Listed variant',notFound:'The requested variant was not found in the received data. This does not prove it is out of stock.',noChart:'The received description does not map this size to a length in centimetres. I will not use a universal chart; ask the shop.',chart:'This product’s size table',insole:'insole length',foot:'foot length',measurement:'listed measurement',noFit:'These are model-specific figures, not a fit guarantee.',price:'Price listed on the page',noPrice:'A verified price for this variant was not found; check checkout.',states:{in_stock:'the page marks it as available',out_of_stock:'the page marks it as unavailable',preorder:'the page indicates preorder/backorder',unknown:'availability is unconfirmed'},excerpt:'From the shop description (source language)',missing:'That specification was not found in the read data. Please ask the shop.',error:'I could not reliably read the product page. Try later or ask the shop. I will not substitute another product’s details.'}
};
export function catalogAnswer(product,message,locale,previous=null){
 const t=words[locale],query=message.toLowerCase();const size=message.match(/(?:размер|size|izm[eē]r[su]?)\s*[:=]?\s*(\d{2}(?:[.,]\d{1,2})?)/iu)?.[1]?.replace(',','.');
 const sizing=isSizingQuestion(query,previous);
 const stock=/налич|доступ|есть|availab|stock|pieejam|noliktav/iu.test(query),price=/цен|стоим|price|cost|cena/iu.test(query);
 const out=[t.read+': '+product.title];const variant=size?product.variants.find(v=>v.label.replace(',','.')===size):null;
 if(sizing){const chart=size?product.chart.filter(row=>row.size===size):product.chart;if(chart.length)out.push(t.chart+': '+chart.map(row=>row.size+' → '+row.cm+' cm ('+t[product.measure==='unspecified'?'measurement':product.measure]+')').join('; ')+'. '+t.noFit);else out.push(t.noChart);}
 if(size||!sizing&&product.variants.length)out.push(variant?t.found+' '+variant.label+(stock?' — '+t.states[variant.state]:'')+'.':size?t.notFound:t.variants+': '+product.variants.slice(0,20).map(v=>v.label).join(', ')+'.');
 if(stock&&!size)out.push(t.states[product.summary.state]+'.');
 if(price){const p=size?variant?.price:product.summary.price||(product.variants.length===1?product.variants[0].price:null);out.push(p?t.price+': '+p.amount.toFixed(2)+' '+p.currency+'.':t.noPrice);}
 if(!sizing&&!stock&&!price){let re=/материал|material|кож|ādas|materiāl/iu.test(query)?/материал|кож|material|ādas|odere/iu:/батар|batter|bater/iu.test(query)?/батар|batter|bater/iu:/возраст|age|vecum/iu.test(query)?/возраст|месяц|лет|age|month|vecum|mēne/iu:/состав|ingredient|sastāv/iu.test(query)?/состав|ingredient|sastāv|gaļa|vistas|protein/iu:/вес|weight|svars/iu.test(query)?/вес|weight|svars/iu:/стельк|insole|iekšzol/iu.test(query)?/стельк|insole|iekšzol/iu:/ширин|width|platums/iu.test(query)?/ширин|width|platums/iu:/комплект|детал|contents|included|komplekt/iu.test(query)?/комплект|детал|contents|included|komplekt/iu:/температур|comfort|limit|temperat/iu.test(query)?/температур|comfort|limit|temperat/iu:null;const overview=!query.trim()||/характерист|описани|что это|specification|details|aprakst/iu.test(query);const lines=(re?product.lines.filter(line=>re.test(line)):overview?product.lines:[]).slice(0,3);out.push(lines.length?t.excerpt+':\n'+lines.join('\n').slice(0,600):t.missing);}
 out.push(t.snapshot+' '+product.checkedAt.replace('T',' ').replace(/\.\d{3}Z$/,' UTC')+'. '+t.notWarehouse);
 return out.join('\n\n');
}
export const catalogError=locale=>words[locale].error;
// Follow-ups may reuse a page only when they contain no new product name or article code.
export function canContinueProduct(message){
 const tokens=message.normalize('NFKC').toLowerCase().match(/\p{L}+/gu)||[];
 const allowed=new Set(('нём нем ней тюбиков от коврика зависит а и у него нее этой это этого там есть нет какой какая какие как сколько размер размера размеры сетка сетке таблица таблице см сантиметров стелька стельки длина стопа стопы наличие наличии доступен цена цене стоит материал материалы вес состав курица батарейки комплект входит съемная съёмная ширина ширины цвет и что по для в на and what about it its this that which how many much size sizes chart table cm insole length foot available availability stock price cost material weight ingredients batteries included contents removable width colour color is are does the of for in at un bet kā kāds kāda cik tas tā šī izmērs izmēri tabula cm iekšzole garums pēda pieejams pieejamība cena materiāls svars sastāvs baterijas komplekts krāsa').split(' '));
 return message.length<=180&&tokens.every(t=>allowed.has(t))&&tokens.length<=20;
}
export function isSizingQuestion(message,previous){return /сетк|таблиц|длин.{0,10}(?:стоп|стельк)|сантим|\bcm\b|\bсм\b|size chart|sizing|insole length|foot length|izm[eē]ru tabul|pēdas garum/iu.test(message)||previous==='product-sizing'&&!/налич|доступ|есть|цен|стоим|stock|availab|price|cost|cena|pieejam|материал|material/iu.test(message);}
