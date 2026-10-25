// Bounded guard for the newly integrated catalogues. No unit conversions or
// inference of width from unordered dimensions, or rod mass from casting test.
const unitPattern='(?:millimet(?:res?|ers?)|centimet(?:res?|ers?)|kilograms?|grams?|met(?:res?|ers?)|миллиметр[а-я]*|сантиметр[а-я]*|килограмм[а-я]*|грамм[а-я]*|метр[а-я]*|mm|cm|kg|мл|см|мм|кг|ml|hz|khz|mhz|volts?|watts?|v|w|g|m|г|м)';
const canonical=value=>{const s=value.toLowerCase();if(/^(?:millimet|миллимет|mm|мм)/u.test(s))return 'mm';if(/^(?:centimet|сантиметр|cm|см)/u.test(s))return 'cm';if(/^(?:kilogram|килограмм|kg|кг)/u.test(s))return 'kg';if(/^(?:gram|грамм|g|г)$/u.test(s)||s.startsWith('gram')||s.startsWith('грамм'))return 'g';if(/^(?:met|метр|m|м)/u.test(s)&&!['ml','мл','mhz'].includes(s))return 'm';if(/^volts?$/u.test(s))return 'v';if(/^watts?$/u.test(s))return 'w';return s;};
const role=text=>/casting|lure weight|тест|приманк/iu.test(text)?'casting':/weight|weigh|\bmass\b|вес|svars|sver/iu.test(text)?'weight':/width|ширин|platums/iu.test(text)?'width':/length|\blong\b|длин|garums/iu.test(text)?'length':/dimension|габарит|dimensij/iu.test(text)?'dimensions':null;
function measures(text){
 const re=new RegExp('(?<![\\p{L}\\p{N}.,])([0-9]+(?:[.,][0-9]+)?)\\s*('+unitPattern+')(?![\\p{L}\\p{N}])','giu');
 return [...text.matchAll(re)].map(m=>({value:m[1].replace(',','.'),unit:canonical(m[2]),role:role(text)}));
}
const normalize=s=>s.normalize('NFKC').toLowerCase();
function activeSentences(reply,products){
 const rows=[];
 let active=products.length===1?0:null;
 // Do not split decimal numbers at their decimal point.
 for(const sentence of reply.split(/(?<!\d)[.!?]+|[.!?]+(?!\d)|\n/gu)){
  const text=normalize(sentence),named=products.flatMap((p,i)=>text.includes(normalize(p.title))?[i]:[]);
  const ordinal=[/\bfirst\b|перв\p{L}*|\bpirma\p{L}*/iu,/\bsecond\b|втор\p{L}*|\botra\p{L}*/iu].flatMap((re,i)=>i<products.length&&re.test(text)?[i]:[]);
  if(named.length===1)active=named[0];else if(ordinal.length===1)active=ordinal[0];else if(named.length>1)active=null;
  rows.push({sentence,active});
 }
 return rows;
}
export function catalogMeasurementReason(reply,products){
 const known=products.map(p=>[...p.lines,p.title].flatMap(measures));
 for(const {sentence,active} of activeSentences(reply,products)){
  for(const m of measures(sentence)){
   if(active===null)return 'catalog_quantity_binding';
   const candidates=known[active].filter(x=>x.value===m.value&&x.unit===m.unit);
   if(!candidates.length)return 'catalog_quantity_binding';
   if(m.role&&!candidates.some(x=>x.role===m.role))return 'catalog_quantity_binding';
  }
 }
 return null;
}
const fibres=[
 ['wool',/(?<!\p{L})(?:wool|viln\p{L}*|шерст\p{L}*)(?!\p{L})/iu],
 ['cotton',/(?<!\p{L})(?:cotton|kokviln\p{L}*|хлоп\p{L}*)(?!\p{L})/iu],
 ['alpaca',/alpaca|alpak|альпак/iu],['silk',/(?<!\p{L})(?:silk|zīd\p{L}*|ш[её]лк\p{L}*)(?!\p{L})/iu],
 ['polyamide',/polyamide|poliamīd|nylon|нейлон|полиамид/iu],['acrylic',/acrylic|akril|акрил/iu]
];
function fibrePercentages(text){
 const out=[];
 for(const line of text.split('\n'))for(const m of line.matchAll(/(\d+(?:[.,]\d+)?)\s*%/gu)){
  const before=line.slice(0,m.index).split(/[,;%]|\band\b|\bun\b|\bи\b/iu).at(-1);
  const after=line.slice(m.index+m[0].length).split(/[\d%;,]/u)[0];
  const id=(fibres.find(([,re])=>re.test(before))||fibres.find(([,re])=>re.test(after)))?.[0];
  if(id)out.push({id,value:m[1].replace(',','.')});
 }
 return out;
}
export function catalogFibreReason(reply,products){
 const sources=products.map(p=>p.lines.join('\n'));
 for(const {sentence,active} of activeSentences(reply,products)){
  const mentioned=fibres.filter(([,re])=>re.test(sentence));if(!mentioned.length)continue;
  if(active===null||mentioned.some(([,re])=>!re.test(sources[active])))return 'catalog_material_qualification';
  const allowed=fibrePercentages(sources[active]);
  if(fibrePercentages(sentence).some(p=>!allowed.some(a=>a.id===p.id&&a.value===p.value)))return 'catalog_quantity_binding';
 }
 return null;
}
