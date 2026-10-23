// Conservative checks for observed source-qualification errors. These are
// bounded guards, not a general semantic verifier of generated prose.
const fold=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ё/g,'е');
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const uncertain=/not confirmed|unconfirmed|cannot confirm|не подтвержд|не могу подтверд|nav apstiprin|nevaru apstiprin/iu;
const wool=/sheep.?s? wool|овечь\p{L}* шерст|aitas viln/iu;
const skin=/sheepskin|овчин|aitad/iu;
const silverColour=/silver[ -]colou?red|серебрист|серебрян\p{L}* цвет|sudraba kras/iu;
const goldColour=/gold[ -]colou?red|золотист|золот\p{L}* цвет|zelta kras/iu;
const silverHardware=/\bsilver(?:[ -][\p{L}-]+){0,2}\s+(?:rivets?|studs?|buckles?|buttons?)|серебрян\p{L}*\s+(?:заклеп|кноп|пряж|пугов)|sudraba\s+(?:knied|spradz|pog)/iu;
const goldHardware=/\bgold(?:[ -][\p{L}-]+){0,2}\s+(?:rivets?|studs?|buckles?|buttons?)|золот\p{L}*\s+(?:заклеп|кноп|пряж|пугов)|zelta\s+(?:knied|spradz|pog)/iu;
const noWinter=/(?:no|without|lacks?)\s+(?:any\s+)?(?:special\s+)?winter\s+(?:features?|functions?|protection)|без\s+(?:специальн\p{L}*\s+)?зимн\p{L}*\s+(?:функц|свойств|защит)|nav\s+(?:ipasu\s+)?ziemas\s+(?:funkcij|ipasib|aizsardz)/iu;
const decorativeZip=/decorative\s+(?:zipper|zip\b)|декоративн\p{L}*\s+молни|dekorativ\p{L}*\s+ravejsledz/iu;
const ordinals=[/\bfirst\b|перв\p{L}*|\bpirma\p{L}*/iu,/\bsecond\b|втор\p{L}*|\botra\p{L}*/iu];

export function catalogPrecisionReason(reply,products){
 const sources=products.map(p=>fold(p.lines.join('\n')));
 const codes=products.map(p=>[...p.title.matchAll(/(?<![\p{L}\p{N}])[A-Za-z]{0,5}\d{3,}(?![\p{L}\p{N}])/gu)].map(m=>fold(m[0])));
 let active=products.length===1?0:null;
 for(const raw of String(reply).split(/[.!?\n]+/u)){
  const sentence=fold(raw);if(!sentence.trim())continue;
  const named=codes.flatMap((cs,i)=>cs.some(code=>new RegExp('(?<![\\p{L}\\p{N}])'+escape(code)+'(?![\\p{L}\\p{N}])','u').test(sentence))?[i]:[]);
  const ordinal=ordinals.flatMap((re,i)=>i<products.length&&re.test(sentence)?[i]:[]);
  const selected=named.length?named:ordinal;
  if(selected.length===1)active=selected[0];
  // Do not transfer qualifications across two products in a shared sentence.
  if(selected.length>1){active=null;continue;}
  if(active===null||uncertain.test(sentence))continue;
  const source=sources[active];
  if(wool.test(source)&&skin.test(sentence)&&!skin.test(source)&&!/not sheepskin|не овчин|nav aitad/iu.test(sentence))return 'catalog_material_qualification';
  if(silverColour.test(source)&&silverHardware.test(sentence)&&!silverColour.test(sentence)&&!/sterling silver|solid silver|серебро\s*925|sudrabs\s*925/iu.test(source))return 'catalog_material_qualification';
  if(goldColour.test(source)&&goldHardware.test(sentence)&&!goldColour.test(sentence)&&!/solid gold|золото\s*(?:585|750)|zelts\s*(?:585|750)/iu.test(source))return 'catalog_material_qualification';
  // Missing information cannot establish absence, and a decorative strap
  // cannot establish that an otherwise functional zip is decorative.
  if(noWinter.test(sentence)&&!noWinter.test(source))return 'catalog_unsupported_detail';
  if(decorativeZip.test(sentence)&&!decorativeZip.test(source))return 'catalog_unsupported_detail';
 }
 return null;
}
