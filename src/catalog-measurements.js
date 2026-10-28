import {canonicalDecimal} from './decimal-evidence.js';
// Bounded guard for the newly integrated catalogues. No unit conversions or
// inference of width from unordered dimensions, or rod mass from casting test.
const unitPattern='(?:millimet(?:res?|ers?)|centimet(?:res?|ers?)|kilograms?|grams?|met(?:res?|ers?)|миллиметр[а-я]*|сантиметр[а-я]*|килограмм[а-я]*|грамм[а-я]*|метр[а-я]*|mm|cm|kg|мл|см|мм|кг|ml|hz|khz|mhz|volts?|watts?|v|w|g|m|г|м)';
const canonical=value=>{const s=value.toLowerCase();if(/^(?:millimet|миллимет|mm|мм)/u.test(s))return 'mm';if(/^(?:centimet|сантиметр|cm|см)/u.test(s))return 'cm';if(/^(?:kilogram|килограмм|kg|кг)/u.test(s))return 'kg';if(/^(?:gram|грамм|g|г)$/u.test(s)||s.startsWith('gram')||s.startsWith('грамм'))return 'g';if(/^(?:met|метр|m|м)/u.test(s)&&!['ml','мл','mhz'].includes(s))return 'm';if(/^volts?$/u.test(s))return 'v';if(/^watts?$/u.test(s))return 'w';return s;};
const role=text=>/casting|lure weight|тест|приманк/iu.test(text)?'casting':/weight|weigh|\bmass\b|вес|svars|sver/iu.test(text)?'weight':/width|ширин|platums/iu.test(text)?'width':/length|\blong\b|длин|garums/iu.test(text)?'length':/dimension|габарит|dimensij/iu.test(text)?'dimensions':null;
function measures(text){
 const re=new RegExp('(?<![\\p{L}\\p{N}.,])([0-9]+(?:[.,][0-9]+)?)\\s*('+unitPattern+')(?![\\p{L}\\p{N}])','giu');
 const matches=[...text.matchAll(re)];
 return matches.map((m,i)=>{
  // Bind each measurement to its own clause. A whole sentence may contain
  // both weight and length; the first property must not relabel every number.
  const previous=matches[i-1],next=matches[i+1];
  const before=text.slice(previous?previous.index+previous[0].length:0,m.index).split(/[,;]|\band\b|\bun\b|(?<!\p{L})и(?!\p{L})/iu).at(-1);
  const after=text.slice(m.index+m[0].length,next?.index??text.length).split(/[,;]|\band\b|\bun\b|(?<!\p{L})и(?!\p{L})/iu)[0];
  return {value:canonicalDecimal(m[1]),unit:canonical(m[2]),role:role(before)||role(after)};
 });
}
const normalize=s=>s.normalize('NFKC').toLowerCase();
function activeSentences(reply,products){
 const rows=[];
 let targets=products.length===1?[0]:null;
 // A literal model name can itself contain length/casting-test numerals. It
 // identifies the product; those name fragments are not new specifications.
 // Use server-owned placeholders before clause splitting, never fuzzy names.
 const tokens=products.map((_,i)=>'\uE000'+String.fromCharCode(65+i)+'\uE001');
 let masked=String(reply);for(const token of tokens)masked=masked.split(token).join('');
 const names=products.map(p=>{
  if(!p.title||(p.title.match(/\p{L}/gu)||[]).length<3)return null;
  if(new RegExp('^\\d+(?:[.,]\\d+)?\\s*'+unitPattern+'$','iu').test(p.title.trim()))return null;
  const escaped=p.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(?<![\\p{L}\\p{N}])'+escaped+'(?![\\p{L}\\p{N}])','iu');
 });
 for(const {p,i}of products.map((p,i)=>({p,i})).sort((a,b)=>b.p.title.length-a.p.title.length)){
  if(names[i]&&measures(p.title).length)masked=masked.replace(new RegExp(names[i].source,'giu'),tokens[i]);
 }
 // Do not split decimal numbers at their decimal point.
 // A new explicit subject after a conjunction begins a different clause.
 const split=/(?<!\d)[.!?]+|[.!?]+(?!\d)|[\n;]|\s+(?:while|whereas|but|а|bet|savukārt)\s+(?=(?:the\s+)?(?:first\b|second\b|перв|втор|pirm[aā]|otr[aā]|\uE000))/giu;
 for(const sentence of masked.split(split)){
  const text=normalize(sentence),named=tokens.flatMap((token,i)=>sentence.includes(token)||names[i]?.test(sentence)?[i]:[]);
  const ordinal=[/\bfirst\b|перв\p{L}*|\bpirm[aā]\p{L}*/iu,/\bsecond\b|втор\p{L}*|\botr[aā]\p{L}*/iu].flatMap((re,i)=>i<products.length&&re.test(text)?[i]:[]);
  const collective=/(?<!\p{L})(?:both|each|оба|обе|обоих|каждый|каждая|abi|abas|abiem|abām|abos|abās)(?!\p{L})/iu.test(text);
  // A collective claim is valid only if independently supported by EVERY
  // product below. Never pool different values/fibres from different sources.
  if(collective&&products.length===2)targets=[0,1];
  else if(named.length===1&&(!ordinal.length||ordinal.length===1&&ordinal[0]===named[0]))targets=named;
  else if(!named.length&&ordinal.length===1)targets=ordinal;
  else if(named.length||ordinal.length)targets=null;
  rows.push({sentence,targets});
 }
 return rows;
}
export function catalogMeasurementCheck(reply,products){
 const known=products.map(p=>[...p.lines,p.title].flatMap(measures));
 for(const {sentence,targets} of activeSentences(reply,products)){
  for(const m of measures(sentence)){
   if(!targets)return {reason:'catalog_quantity_binding',detail:'product_subject_unbound'};
   if(targets.length>1&&!m.role)return {reason:'catalog_quantity_binding',detail:'measurement_role_mismatch'};
   for(const active of targets){
    const candidates=known[active].filter(x=>x.value===m.value&&x.unit===m.unit);
    if(!candidates.length)return {reason:'catalog_quantity_binding',detail:'measurement_not_in_product'};
    if(m.role&&!candidates.some(x=>x.role===m.role))return {reason:'catalog_quantity_binding',detail:'measurement_role_mismatch'};
   }
  }
 }
 return null;
}
export const catalogMeasurementReason=(reply,products)=>catalogMeasurementCheck(reply,products)?.reason||null;
const fibres=[
 ['wool',/(?<!\p{L})(?:wool|viln\p{L}*|шерст\p{L}*)(?!\p{L})/iu],
 ['cotton',/(?<!\p{L})(?:cotton|kokviln\p{L}*|хлоп\p{L}*)(?!\p{L})/iu],
 ['alpaca',/alpaca|alpak|альпак/iu],['silk',/(?<!\p{L})(?:silk|zīd\p{L}*|ш[её]лк\p{L}*)(?!\p{L})/iu],
 ['polyamide',/polyamide|poliamīd|nylon|нейлон|полиамид/iu],['acrylic',/acrylic|akril|акрил/iu]
];
function fibrePercentages(text){
 const out=[];
 for(const line of text.split('\n'))for(const m of line.matchAll(/(\d+(?:[.,]\d+)?)\s*%/gu)){
  const before=line.slice(0,m.index).split(/[,;%]|\band\b|\bun\b|(?<!\p{L})и(?!\p{L})/iu).at(-1);
  const after=line.slice(m.index+m[0].length).split(/[\d%;,]/u)[0];
  const id=(fibres.find(([,re])=>re.test(before))||fibres.find(([,re])=>re.test(after)))?.[0];
  if(id)out.push({id,value:canonicalDecimal(m[1])});
 }
 return out;
}
export function catalogFibreCheck(reply,products){
 const sources=products.map(p=>p.lines.join('\n'));
 for(const {sentence,targets} of activeSentences(reply,products)){
  const mentioned=fibres.filter(([,re])=>re.test(sentence));if(!mentioned.length)continue;
  if(!targets)return {reason:'catalog_material_qualification',detail:'product_subject_unbound'};
  for(const active of targets){
   if(mentioned.some(([,re])=>!re.test(sources[active])))return {reason:'catalog_material_qualification',detail:'fibre_not_in_product'};
   const allowed=fibrePercentages(sources[active]);
   if(fibrePercentages(sentence).some(p=>!allowed.some(a=>a.id===p.id&&a.value===p.value)))return {reason:'catalog_quantity_binding',detail:'fibre_percentage_mismatch'};
  }
 }
 return null;
}
export const catalogFibreReason=(reply,products)=>catalogFibreCheck(reply,products)?.reason||null;

// A small exact reader for complete labelled yarn compositions. This is used
// only by preview fallback callers; unknown fibres/qualifiers stay unconfirmed.
export function confirmedFibreComposition(product,locale){
 if(product.lines.some(line=>/^(?:Materiāls|Material|Материал)\s*:/iu.test(line.trim())))return null;
 const names={vilna:['шерсть','vilna','wool'],kokvilna:['хлопок','kokvilna','cotton'],alpaka:['альпака','alpaka','alpaca'],'zīds':['шёлк','zīds','silk'],'poliamīds':['полиамид','poliamīds','polyamide'],akrils:['акрил','akrils','acrylic']};
 const candidates=product.lines.filter(line=>/^(?:(?:sast[aā]vs|composition|состав)\s*:|\d+(?:[.,]\d+)?\s*%)/iu.test(line.trim()));
 if(!candidates.length)return null;
 const parsed=[];
 for(const line of candidates){
  const value=line.trim().replace(/^(?:sast[aā]vs|composition|состав)\s*:\s*/iu,'').replace(/\s*\/\s*\d+\s+kārtīga\s*$/iu,'');
  const parts=value.split(/[,;]\s+(?=\d)/u);if(!parts.length||parts.length>4)return null;
  const entries=[];
  for(const part of parts){
   const m=part.match(/^(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s*(\p{L}+)\s*$/iu),key=m?.[2].toLowerCase();
   if(!m||!Object.hasOwn(names,key)||entries.some(e=>e.key===key))return null;
   const number=canonicalDecimal(m[1]),[whole,fraction='']=number.split('.');
   const hundredths=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
   if(hundredths<=0n||hundredths>10000n)return null;
   entries.push({key,number,hundredths});
  }
  if(entries.reduce((sum,e)=>sum+e.hundredths,0n)!==10000n)return null;
  parsed.push(entries);
 }
 const signature=entries=>entries.map(e=>e.key+':'+e.number).sort().join('|');
 if(new Set(parsed.map(signature)).size!==1)return null;
 const index={ru:0,lv:1,en:2}[locale];if(index===undefined)return null;
 return {ru:'Состав: ',lv:'Sastāvs: ',en:'Composition: '}[locale]+parsed[0].map(e=>e.number+'% '+names[e.key][index]).join(', ')+'.';
}
