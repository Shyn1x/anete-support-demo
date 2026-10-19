// Bounded, deterministic product facts. Unknown prose is never auto-translated.
const fold=s=>String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ё/g,'е');
const fields=[
 ['composition',/состав|ингреди|ingredient|composition|sast[aā]v/iu,/состав|ингреди|ingredient|composition|sast[aā]v/iu],
 ['material',/материал|подклад|верх|material|leather|lining|upper|materi[aā]l|odere|virsm/iu,/материал|подклад|верх|material|leather|lining|upper|materi[aā]l|odere|virsm|āda/iu],
 ['colours',/цвет|красок|краски|colou?r|kr[aā]su/iu,/цвет|красок|краски|colou?r|kr[aā]s/iu],
 ['batteries',/батар|battery|batteries|bater/iu,/батар|battery|batteries|bater/iu],
 ['weight',/вес|weight|svars/iu,/вес|weight|svars/iu],
 ['capacity',/вместим|человек|people|persons|capacity|cilv[eē]k|person[aā]m/iu,/вместим|человек|people|persons|capacity|cilv[eē]k|person[aā]m/iu],
 ['age',/возраст|\bage\b|vecum/iu,/возраст|\bage\b|vecum|mēneš|month/iu]
];
export const requestedCatalogFields=message=>fields.filter(([,q])=>q.test(message)).map(([key])=>key);
const technical=/^(?:материал|подкладка|верх|вес|состав|батарейки|material|lining|upper|weight|ingredients|composition|batteries|materiāls|odere|virsmateriāls|svars|sastāvs|baterijas)\s*:/iu;
export function selectCatalogLines(product,message){
 const wanted=fields.filter(([,q])=>q.test(message)),lines=product.lines.slice(0,120);
 const ranked=lines.map((text,index)=>({text,index,score:(technical.test(text)?30:0)+wanted.reduce((n,[,,match])=>n+(match.test(text)?10:0),0)}));
 // A short heading may carry its actual value on the next line.
 for(let i=0;i<ranked.length-1;i++)if(/:\s*$/u.test(ranked[i].text)&&ranked[i].score)ranked[i+1].score=Math.max(ranked[i+1].score,ranked[i].score-1);
 let used=0;const selected=[];
 for(const row of ranked.sort((a,b)=>b.score-a.score||a.index-b.index)){
  if(selected.length===12)break;if(used+row.text.length+1>2400)continue;
  selected.push(row);used+=row.text.length+1;
 }
 return selected.sort((a,b)=>a.index-b.index).map(r=>r.text);
}
const materialValues=[
 [/^(?:dabiga gludada|natural smooth leather)$/u,{ru:'натуральная гладкая кожа',lv:'dabīgā gludāda',en:'natural smooth leather'}],
 [/^(?:miksta ada|soft leather)$/u,{ru:'мягкая кожа',lv:'mīksta āda',en:'soft leather'}],
 [/^(?:dabiga ada|natural leather)$/u,{ru:'натуральная кожа',lv:'dabīgā āda',en:'natural leather'}],
 [/^(?:ada|leather)$/u,{ru:'кожа',lv:'āda',en:'leather'}],
 [/^(?:tekstils|textile)$/u,{ru:'текстиль',lv:'tekstils',en:'textile'}]
];
function translateMaterial(value,locale){
 const parts=value.trim().split(/\s*\/\s*/u);if(!parts.length||parts.length>4)return null;
 const translated=parts.map(p=>materialValues.find(([re])=>re.test(fold(p)))?.[1][locale]);return translated.every(Boolean)?translated.join(' / '):null;
}
export function productMaterialFields(product,locale){
 const result={};for(const line of product.lines){const m=line.match(/^(Materiāls|Virsmateriāls|Upper|Material|Материал|Верх|Odere|Lining|Подкладка)\s*:\s*(.+)$/iu);if(!m)continue;
  const key=/odere|lining|подклад/iu.test(m[1])?'lining':/upper|верх|virsmateriāls/iu.test(m[1])?'upper':'material',value=translateMaterial(m[2],locale);if(value){if(result[key]&&result[key]!==value)result[key]=null;else if(result[key]!==null)result[key]=value;}
 }return result;
}
const labels={ru:{material:'Материал',upper:'Верх',lining:'Подкладка'},lv:{material:'Materiāls',upper:'Virsējais materiāls',lining:'Odere'},en:{material:'Material',upper:'Upper',lining:'Lining'}};
function knownComposition(product,locale){
 const at=product.lines.findIndex(l=>/^(?:sastāvs|ingredients|composition|состав)\s*:/iu.test(l));if(at<0)return [];
 const inline=product.lines[at].replace(/^[^:]+:\s*/u,''),text=inline||product.lines[at+1]||'',parts=text.split(/,(?!\d)|;/u).map(p=>p.trim()),found=[];
 for(const part of parts){
  const poultry=part.match(/^(?:Gaļa un dzīvnieku izcelsmes produkti \()?svaiga putnu gaļa vismaz (\d+(?:[.,]\d+)?)\s*%\)?$/iu);
  if(poultry)found.push({ru:`Свежего мяса птицы — не менее ${poultry[1]}%.`,lv:`Svaiga putnu gaļa — vismaz ${poultry[1]}%.`,en:`Fresh poultry meat: at least ${poultry[1]}%.`}[locale]);
  if(/^vistu tauki$/iu.test(part))found.push({ru:'Указан куриный жир.',lv:'Norādīti vistu tauki.',en:'Chicken fat is listed.'}[locale]);
  if(/^vistas aknu hidrolizāts$/iu.test(part))found.push({ru:'Указан гидролизат куриной печени.',lv:'Norādīts vistas aknu hidrolizāts.',en:'Chicken liver hydrolysate is listed.'}[locale]);
 }
 if(found.length)found.push({ru:'Это часть состава; полный список смотрите на странице товара.',lv:'Tā ir daļa no sastāva; pilnu sarakstu skatiet preces lapā.',en:'These are some ingredients; see the product page for the full list.'}[locale]);
 return found;
}
export function knownCatalogDetails(product,message,locale){
 const wanted=requestedCatalogFields(message),out=[];
 if(wanted.includes('age')){
  // Only an explicit technical label, never a model/title numeral or the
  // buyer's age. Conflicting labels remain unconfirmed.
  const ages=[...new Set(product.lines.flatMap(line=>{const m=line.match(/^(?:Vecums|Age|Возраст)\s*:\s*(\d{1,2})\+\s*(?:gadi|years?|лет)\s*[.!]?$/iu);return m?[m[1]]:[];}))];
  if(ages.length===1){const age=ages[0]+'+';out.push({field:'age',text:{ru:`На странице указан возраст: ${age}.`,lv:`Lapā norādītais vecums: ${age}.`,en:`The page lists an age rating of ${age}.`}[locale]});}
 }
 if(wanted.includes('composition'))for(const text of knownComposition(product,locale))out.push({field:'composition',text});
 if(wanted.includes('material'))for(const [key,value]of Object.entries(productMaterialFields(product,locale)))if(value)out.push({field:'material',text:labels[locale][key]+': '+value+'.'});
 if(wanted.includes('colours')){
  const m=product.title.match(/(?:^|[^\d])([1-9]\d{0,2})\s*(?:krāsas|krāsu|colou?rs|цветов|цвета)(?!\p{L})/iu);
  if(m)out.push({field:'colours',text:{ru:`В наборе ${m[1]} цветов.`,lv:`Komplektā ir ${m[1]} krāsas.`,en:`The set contains ${m[1]} colours.`}[locale]});
 }return out;
}
const bounds=[['min',/(?:at least|minimum|min\.?|no less than|vismaz|ne maz[aā]k k[aā]|не менее|минимум|не меньше)\s*$/iu],['max',/(?:at most|maximum|max\.?|up to|no more than|ne vair[aā]k k[aā]|l[iī]dz|не более|максимум|до)\s*$/iu],['approx',/(?:about|around|approximately|approx\.?|apm[eē]ram|aptuveni|около|примерно|приблизительно)\s*$/iu]];
const percentageSubjects=[['poultry',/птиц\p{L}*|poultry|putnu/giu],['chicken',/курин\p{L}*|куриц\p{L}*|chicken|vist\p{L}*/giu],['protein',/белк\p{L}*|protein\p{L}*|olbaltum\p{L}*/giu],['fat',/жир\p{L}*|\bfats?\b|tauki\p{L}*/giu],['fibre',/клетчат\p{L}*|\bfib(?:re|er)\b|šķiedr\p{L}*/giu],['moisture',/влажност\p{L}*|moisture|mitrums/giu]];
function percentageSubject(before,after){
 const prior=percentageSubjects.flatMap(([id,re])=>[...before.matchAll(re)].map(m=>({id,at:m.index})));
 if(prior.length)return prior.sort((a,b)=>b.at-a.at)[0].id;
 return percentageSubjects.flatMap(([id,re])=>[...after.matchAll(re)].map(m=>({id,at:m.index}))).sort((a,b)=>a.at-b.at)[0]?.id||null;
}
function percentages(text){
 return [...String(text).matchAll(/\d+(?:[.,]\d+)?\s*%/gu)].map(m=>{
  const before=text.slice(Math.max(0,m.index-45),m.index),after=text.slice(m.index+m[0].length,m.index+m[0].length+25);
  const bound=bounds.find(([,re])=>re.test(before))?.[0]||(/^\s*(?:or more|and up|и более|или больше|vai vair[aā]k)(?!\p{L})/iu.test(after)?'min':/^\s*(?:or less|или меньше|vai maz[aā]k)(?!\p{L})/iu.test(after)?'max':'exact');
  return {number:m[0].replace(/\s|%/g,'').replace(',','.'),bound,subject:percentageSubject(before,after.split(/[,;.!\n]/u)[0])};
 });
}
// Additional conservative checks, not a general semantic proof of free prose.
export function catalogFidelityReason(reply,selectedCards){
 const source=selectedCards.map(c=>c.ru).join('\n'),sourcePercentages=percentages(source);
 for(const p of percentages(reply)){
  const allowed=sourcePercentages.filter(s=>s.number===p.number);
  if(!allowed.length)return 'catalog_quantity_binding';
  if(allowed.some(s=>s.bound!==p.bound))return 'catalog_quantity_qualifier';
  if(p.subject&&allowed.some(s=>s.subject!==p.subject))return 'catalog_quantity_binding';
 }
 // A broad ingredient category cannot justify an invented specific cut.
 for(const re of [/грудк|\bbreast\b|krūtiņ|krūts/iu,/\bfillet\b|филе|filej/iu])if(re.test(reply)&&!re.test(source))return 'catalog_unsupported_detail';
 return null;
}
export function catalogMaterialReason(reply,products){
 const mixed=products.some(p=>/textile/iu.test(productMaterialFields(p,'en').lining||''));
 if(!mixed)return null;
 for(const sentence of reply.split(/[.!?\n]/u)){
  if(/lining|подклад|odere/iu.test(sentence)&&/leather|кож|āda/iu.test(sentence)&&!/textil|текстил|tekst/iu.test(sentence)&&!/not confirmed|cannot confirm|не подтвержд|не могу подтверд|nav apstiprin|nevar.{0,15}apstiprin/iu.test(sentence))return 'catalog_material_qualification';
 }return null;
}
