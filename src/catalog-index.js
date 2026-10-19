import {productURL,catalogAnswer} from './catalog.js';
import {knownCatalogDetails,requestedCatalogFields} from './catalog-evidence.js';
const memo=new Map();
export const fold=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ё/g,'е');
export function validateIndex(value,tenant){
 if(value?.schema!=='shop-catalog-index-v1'||value.tenant!==tenant.id||!Array.isArray(value.products)||value.products.length>30000||!Number.isFinite(Date.parse(value.importedAt)))throw Error('catalog_index');
 if(value.products.some(p=>!p||typeof p.t!=='string'||p.t.length>700||p.c!==undefined&&(typeof p.c!=='string'||p.c.length>700)||productURL(p.u,tenant)!==p.u))throw Error('catalog_index');return value;
}
export async function loadCatalogIndex(env,tenant){
 const path=env.TENANT_ID?'/catalog-index.json':'/catalog-'+tenant.id+'.json';
 const key=tenant.id+':'+path,old=memo.get(key);if(old&&old.assets===env.ASSETS&&Date.now()-old.at<600000)return old.value;
 const response=await env.ASSETS.fetch(new Request('https://catalog-assets.invalid'+path));if(!response.ok)throw Error('catalog_index');
 const text=await response.text();if(text.length>12000000)throw Error('catalog_index');const parsed=JSON.parse(text),value=parsed.schema==='shop-catalog-search-v1'?validateSearchIndex(parsed,tenant):validateIndex(parsed,tenant);memo.set(key,{assets:env.ASSETS,at:Date.now(),value});return value;
}
export const concepts=[
 ['puppy',/щен|pupp|kuc[eē]n/iu,/pupp|kucen/],['kitten',/кот[её]н|котят|kitten|kaķ[eē]n/iu,/kitten|kaken/],
 ['cat',/кош|кот(?:а|у|ов|ам)?(?!\p{L})|\bcat[s]?\b|kaķ|kak/iu,/cat|kak/],['dog',/собак|\bdogs?\b|suņ|sunu/iu,/dog|sun/],
 ['adult',/взросл|\badult\b|pieauguš/iu,/adult|pieaugus/],
 ['food',/корм|\bfood\b|bar[iī]b/iu,/food|barib|recipe|necon|cooking|konserv/],
 ['hiking',/\bhiking\b|походн|pārgājien/iu,/hiking|pargaj/],
 ['winter',/зимн|\bwinter\b|ziemas|\bzimnie\b/iu,/winter|ziemas|ziema/],
 ['dry',/сух|\bdry\b|saus/iu,/dry|saus/],['wet',/влажн|консерв|\bwet\b|mitr|konserv/iu,/wet|mitr|konserv/],
 ['watercolour',/акварел|watercolou?r|akvarel/iu,/akvarel|watercol/],
 ['acrylic',/акрил|acrylic|akril/iu,/akril|acryl/],
 ['paint',/краск|акварел|акрил|\bpaint|watercolou?r|acrylic|kr[aā]s/iu,/kras|\bpaints?\b|akvarel|watercol|acryl|akril/],
 ['brush',/кист|\bbrush|\botas?\b/iu,/ot[au]|brush/],['toy',/игруш|\btoys?\b|rotaļ/iu,/rotal|toy|sp[eē]l|board|lelle|lego|figurin/],
 ['doll',/кукл|\bdolls?\b|lell/iu,/lell|doll/],['puzzle',/пазл|puzzl|puzl/iu,/puzzl|puzl/],
 ['shoe',/обув|туфл|\bshoes?\b|apav/iu,/apav|kurp|sand|boot|shoe|slipper|zabak|seibel|rieker|lloyd/],
 ['boot',/ботин|сапог|\bboots?\b|zābak|\bbotinki\b/iu,/boot|zabak/],['insole',/стельк|insole|iekšzol/iu,/insole|iekszol/],
 ['tent',/палат|\btents?\b|telt/iu,/tent|telt/],['sleep',/спальн|sleeping bag|guļammais/iu,/sleep|gulammais/],
 ['backpack',/рюкзак|backpack|mugursom/iu,/backpack|mugursom/],['vacuum',/пылесос|vacuum|putekļsūc/iu,/vacuum|puteklsuc/],
 ['fridge',/холодиль|fridge|refrigerator|ledusskap/iu,/fridge|refrigerator|ledusskap/]
];
const stop=new Set(fold('nuzhni vajag kaut pieaugušam коту котом какой какая какое какие лучше лучший подойдет подходит выбрать выбери подбери подбор посоветуй посоветуйте нужен нужна нужно нужны для у в на из с и или мне меня мой этого этой этот товар товары модель модели есть ли цена сколько стоит состав материал какие характеристики размер вес ширина батарейки комплект входит чем отличается сравни сравнить сравнение разница между а как что пожалуйста хочу щенка щенков щенкам собак кошек кота котов корм корма щенок котенок сухой влажный ребёнка ребенка девочки мальчика похода прогулок ткани рисования options any looking suggest offer можете предложить var apskatīt meklēju dāvanai piedāvājat what which how made from listed list is are the a an for to of with in my i me you can could please want need should would best better recommend choose compare comparison difference between does do has have it its this that these price cost available availability stock size weight material ingredients contents included battery batteries width puppy puppies kitten kittens cat cats dog dogs food dry wet paint paints brush brushes toy toys doll dolls shoe shoes boot boots tent tents sleeping bag backpack vacuum fridge what kind kādu kāds kāda kādi ko kā cik ir vai man es gribu lūdzu izvēlēties izvēleties labāk labak piemērota piemerota piemērots ieteikt salīdzini salidzināt atšķiras ar un par no uz cena maksā pieejams izmērs svars sastāvs materiāls baterijas komplekts kucēniem kucēnam kaķim sunim barību barība sauso sausā mitro rotaļlietu rotaļlietas bērnam bērnu krāsas audumam apavus pastaigām telti teltis pārgājienam putekļsūcēju ledusskapja modelim').split(/\s+/));
// Limited negative category clauses: reject the excluded category rather than
// treating “not kitten food” as a positive kitten search. Unknown constraints
// remain in the query; they are never silently dropped or certified as safe.
function categoryClauses(message){
 const positive=[],excluded=[];let impliedFood=false;
 for(const clause of message.split(/(?<!\d)[,;](?!\d)|\s+(?:а|но|but|bet)\s+/iu)){
  const m=clause.trim().match(/^(?:(?:мне|нам|я)\s+)?не\s+(?:(?:нужен|нужна|нужно|нужны|хочу)\s+)?(.+)$/iu)
   ||clause.trim().match(/^(?:(?:i|we)\s+)?(?:do not|don't|don’t)\s+(?:want|need)\s+(.+)$/iu)
   ||clause.trim().match(/^not\s+(?:(?:a|an|for)\s+)?(.+)$/iu)
   ||clause.trim().match(/^(?:man\s+)?(?:nevajag|negribu|nevis)\s+(.+)$/iu);
  if(m){
   const groups=concepts.filter(([,re])=>re.test(m[1])||re.test(fold(m[1])));
   const residual=(fold(m[1]).match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>!stop.has(t)&&!concepts.some(([,re])=>re.test(t)));
   const leaves=groups.filter(([id])=>['kitten','puppy','adult','winter','dry','wet','acrylic','watercolour'].includes(id));
   if(leaves.length&&!residual.length){excluded.push(...leaves);impliedFood ||= groups.some(([id])=>id==='food');continue;}
  }
  positive.push(clause);
 }
 const text=positive.join(' ');const anotherCategory=concepts.some(([id,re])=>['toy','doll','puzzle','paint','brush','shoe','boot','tent','sleep','backpack','vacuum','fridge'].includes(id)&&re.test(text));
 return {positive:text+(impliedFood&&concepts.some(([,re])=>re.test(text))&&!anotherCategory?' food':''),excluded};
}
// English negative 'no' must not disappear as Latvian filler. Unknown
// exclusions remain restrictive instead of finding the excluded ingredient.
stop.delete('no');
export function queryParts(message){ const {positive,excluded}=categoryClauses(message),query=fold(positive),groups=concepts.filter(([,re])=>re.test(positive)||re.test(query));
 // Puppy/kitten already identify species, so do not require a redundant dog/cat label.
 const required=groups.filter(([id])=>!(id==='dog'&&groups.some(g=>g[0]==='puppy')||id==='cat'&&groups.some(g=>g[0]==='kitten')));
 const raw=(query.match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>t.length>1&&!stop.has(t)&&!/^(?:kads|kada|kadas|kadu|kadi|kadus|kadam|kadiem)$/u.test(t)&&!/^ребенк[ауе]$/u.test(t)&&!/^как(?:ой|ая|ое|ие|ую|их|ого|ому|им|ими|ом)$/u.test(t));
 const terms=raw.filter(t=>!concepts.some(([,re])=>re.test(t))&&!/^\d{1,2}$/.test(t)).slice(0,10);
 return {required,terms,excluded,conflict:required.some(([id])=>excluded.some(([other])=>id===other))};
}
export function searchProducts(index,message,{limit=3}={}){
 const {required,terms,excluded,conflict}=queryParts(message);if(conflict||!required.length&&!terms.length)return [];
 const scored=[];for(const p of index.products){const text=fold(p.t+' '+decodeURIComponent(new URL(p.u).pathname));
  if(required.some(([, ,match])=>!match.test(text)))continue;
  if(excluded.some(([,,match])=>match.test(fold(p.t))))continue;
  // Old SEO paths can contradict the current title (kitten URL, adult food title).
  if(required.some(([key,,match])=>['kitten','puppy','adult'].includes(key)&&!match.test(fold(p.t))))continue;
  if(index.tenant==='hobbyset'&&required.some(g=>g[0]==='paint')&&!/kras|paints?\b/iu.test(fold(p.c||p.t)))continue;
  if(index.tenant==='hobbyset'&&required.some(g=>g[0]==='paint')&&/lidzek|palig|medium|medij|lak/iu.test(fold(p.c||'')))continue;
  if(required.some(g=>g[0]==='paint')&&/paper|papir|brush|sponge|palett|easel|\botas?\b/iu.test(text))continue;
  if(required.some(g=>g[0]==='tent')&&!/survival|emergency|экстр|авар|ārkārt|repair|pole|ремонт|miet|remont/iu.test(message)&&/survival|shelter|arkartas|repair|pole|pegs|footprint|groundsheet|remont|mietin/iu.test(text))continue;
  if(required.some(g=>g[0]==='food')&&/papildbar|vitamin|preparat|piedev|supplement|dietiska|лечеб/iu.test(text))continue;
  if(required.some(g=>['boot','shoe'].includes(g[0]))&&/laces|aukl|šn[oō]r|shoe.?care|apavu.kop/iu.test(text))continue;
  if(required.some(g=>g[0]==='backpack')&&!/cover|rain.?cover|pārvalk|чехол/iu.test(message)&&/cover|parvalk/iu.test(text))continue;
  if(terms.some(t=>!text.includes(t)))continue;
  const score=terms.reduce((n,t)=>n+(text.includes(t)?t.length:0),0)+required.length*5;
  scored.push({...p,score});
 }return scored.sort((a,b)=>b.score-a.score||a.u.localeCompare(b.u)).slice(0,Math.min(3,limit));
}
export function catalogueQuery(message,reference,tenant){
 if(reference.handoff||reference.social||reference.ids.some(id=>tenant.cards.find(c=>c.id===id)?.topic!=='product'))return false;
 return reference.kind.startsWith('product-')||concepts.some(([,re])=>re.test(message))||/сравн|compare|salīdzin/iu.test(message)||tenant.id!=='anete'&&/^[\p{L}\p{N}][\p{L}\p{N} -]{2,80}$/u.test(message);
}
export const searchCopy={
 ru:{matches:'Нашёл такие варианты в каталоге:',none:'По этому запросу не удалось надёжно подобрать товары. Это не означает, что их нет в магазине. Уточните название, модель или пришлите ссылку.',unavailable:'Сейчас не удалось прочитать описание найденного товара. Можно попробовать позже или прислать другую ссылку.',choose:'Какой вариант хотите разобрать подробнее?',snapshot:'Список товаров обновлён',missing:'Этот параметр в прочитанном описании не подтверждён.',source:'Из описания магазина',unknown:'По названию нельзя подтвердить совместимость, безопасность или подходящий размер.'},
 lv:{matches:'Katalogā atradu šādus variantus:',none:'Šim vaicājumam nevarēju droši atlasīt preces. Tas nenozīmē, ka veikalā to nav. Precizējiet nosaukumu, modeli vai atsūtiet saiti.',unavailable:'Šobrīd atrastās preces aprakstu nevarēja nolasīt. Mēģiniet vēlāk vai atsūtiet citu saiti.',choose:'Kuru variantu vēlaties apskatīt sīkāk?',snapshot:'Preču saraksts atjaunots',missing:'Šis parametrs nolasītajā aprakstā nav apstiprināts.',source:'No veikala apraksta',unknown:'Nosaukums vien neapstiprina saderību, drošību vai piemērotu izmēru.'},
 en:{matches:'I found these catalogue matches:',none:'I could not reliably match products to this request. That does not mean the shop has none. Please clarify the name or model, or share a product link.',unavailable:'I could not read the matched product description right now. Try later or share another link.',choose:'Which option would you like to look at more closely?',snapshot:'Product list updated',missing:'This detail is not confirmed in the description I read.',source:'From the shop description',unknown:'A name alone cannot confirm compatibility, safety or a suitable size.'}
};
export function searchFallback(products,message,locale,index){
 const t=searchCopy[locale];if(!products.length)return t.none;
 const wanted=requestedCatalogFields(message);
 const unconfirmed={ru:'Не все запрошенные характеристики удалось надёжно подтвердить. Проверьте подробности на странице товара по ссылке ниже.',lv:'Ne visas pieprasītās īpašības varēju droši apstiprināt. Pārbaudiet informāciju preces lapā, izmantojot saiti zemāk.',en:'I could not reliably confirm all the requested details. Please check the linked product page.'}[locale];
 return products.map(p=>{
  const prefix=p.title+'\n',snapshot=p.reviewedSnapshot?{ru:`Использую проверенное название от ${p.checkedAt.slice(0,10)}. Сейчас магазин не разрешил прочитать страницу; актуальное наличие и цены не проверены.`,lv:`Izmantoju ${p.checkedAt.slice(0,10)} pārbaudīto nosaukumu. Veikals šobrīd neļāva nolasīt lapu; aktuālais atlikums un cenas nav pārbaudītas.`,en:`This uses the name checked on ${p.checkedAt.slice(0,10)}. The shop refused a current page read; current stock and prices are unverified.`}[locale]+'\n':'';
  if(!p.reviewedSnapshot&&!wanted.length&&/налич|доступ|цен|стоим|размер|сетк|price|cost|stock|availab|size|sizing|cena|pieejam|izm[eē]r/iu.test(message))return prefix+catalogAnswer(p,message,locale);
  const details=knownCatalogDetails(p,message,locale),missing=!wanted.length||wanted.some(k=>!details.some(d=>d.field===k));
  return prefix+snapshot+details.map(d=>d.text).join(' ')+(missing?'\n'+unconfirmed:'');
 }).join('\n\n');
}

// Runtime lookup uses small, build-generated posting lists and row shards. It
// never parses or validates an entire merchant catalogue on a customer request.
export const prefixBucket=word=>[...word.slice(0,2)].map(c=>c.codePointAt(0).toString(16)).join('-');
export function validateSearchIndex(value,tenant){
 if(value?.schema!=='shop-catalog-search-v1'||value.tenant!==tenant.id||!Number.isInteger(value.entries)||value.entries<1||value.entries>30000||!Number.isFinite(Date.parse(value.importedAt))||!value.groups||typeof value.groups!=='object')throw Error('catalog_index');
 for(const [key,ids]of [...Object.entries(value.groups),...Object.entries(value.safeGroups||{})])if(!concepts.some(c=>c[0]===key)||!Array.isArray(ids)||ids.length>30000||ids.some(i=>!Number.isInteger(i)||i<0||i>=value.entries))throw Error('catalog_index');
 return value;
}
export async function searchIndexedProducts(env,tenant,index,message,limit=3){
 if(Array.isArray(index.products))return searchProducts(index,message,{limit});
 const root=env.TENANT_ID?'/catalog-data':'/catalog-data/'+tenant.id;
 const read=async (path,optional=false)=>{const response=await env.ASSETS.fetch(new Request('https://catalog-assets.invalid'+root+'/'+path));if(response.status===404&&optional)return {};if(!response.ok)throw Error('catalog_index');const text=await response.text();if(text.length>350000)throw Error('catalog_index');return JSON.parse(text);};
 const {required,terms,conflict}=queryParts(message);if(conflict)return [];const lists=required.map(([key])=>(!/survival|emergency|экстр|авар|ārkārt|repair|pole|ремонт|miet|remont/iu.test(message)&&index.safeGroups?.[key])||index.groups[key]||[]);
 const buckets=new Map();for(const word of terms){const bucket=prefixBucket(word);if(!buckets.has(bucket))buckets.set(bucket,await read('terms/'+bucket+'.json',true));const ids=buckets.get(bucket)?.[word.slice(0,4)]||[];if(!Array.isArray(ids)||ids.some(i=>!Number.isInteger(i)||i<0||i>=index.entries))throw Error('catalog_index');lists.push(ids);}
 if(!lists.length||lists.some(l=>!l.length))return [];lists.sort((a,b)=>a.length-b.length);
 let possible=[...new Set(lists[0])];for(const list of lists.slice(1)){const set=new Set(list);possible=possible.filter(id=>set.has(id));}
 const rows=new Map(),out=[];for(const id of possible.slice(0,60)){const key=String(Math.floor(id/150)).padStart(3,'0');if(!rows.has(key))rows.set(key,await read('rows/'+key+'.json'));const row=rows.get(key)?.[id%150];if(!row||productURL(row.u,tenant)!==row.u||typeof row.t!=='string'||row.t.length>700)throw Error('catalog_index');if(searchProducts({tenant:tenant.id,products:[row]},message,{limit:1}).length)out.push(row);if(out.length>=limit)break;}
 return out;
}
