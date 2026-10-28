// A comparison has explicit product ownership on the wire. These helpers do
// not infer facts, repair rejected prose, or make provider calls.
export function productRepliesSchema(ids,refs,{requireAll=false}={}){
 return {type:'object',properties:{answers:{type:'array',minItems:requireAll?ids.length:1,maxItems:ids.length,items:{type:'object',properties:{id:{type:'string',enum:ids},reply:{type:'string'},evidence:{type:'array',minItems:1,maxItems:3,items:{type:'string',enum:[...refs.keys()]}}},required:['id','reply','evidence'],additionalProperties:false}}},required:['answers'],additionalProperties:false};
}
const comparisonReference=/(?<!\p{L})(?:both|each|first|second|оба|обе|обоих|перв\p{L}*|втор\p{L}*|кажд\p{L}*|abi|abas|abiem|abām|pirm\p{L}*|otr\p{L}*|katrs|katra)(?!\p{L})|\bother\s+(?:product|model|yarn|rod|monitor)|друг\p{L}*\s+(?:товар|модел|пряж|удилищ)|cit\p{L}*\s+(?:prec|model|dzij|kāt)/iu;
const norm=s=>s.normalize('NFKC').toLowerCase();
function scopeError(){const e=Error('catalog_unsupported_detail');e.validationDetail='cross_product_reply';return e;}
export function parseProductReplies(out,{products,ids,references,requireAll,validate,evidenceError}){
 if(!out||Array.isArray(out)||typeof out!=='object'||Object.keys(out).join(',')!=='answers'||!Array.isArray(out.answers)||!out.answers.length||out.answers.length>ids.length)throw Error('schema');
 const seen=new Set(),validated=new Map();let replyLength=0;
 for(const entry of out.answers){
  if(!entry||Array.isArray(entry)||typeof entry!=='object'||Object.keys(entry).sort().join(',')!=='evidence,id,reply'||!ids.includes(entry.id)||seen.has(entry.id)||typeof entry.reply!=='string'||!Array.isArray(entry.evidence))throw Error('schema');
  seen.add(entry.id);
  replyLength+=entry.reply.length;if(replyLength>1400)throw Error('empty_or_long');
  if(!entry.evidence.length)throw evidenceError('missing_for_product');
  if(entry.evidence.length>3)throw evidenceError('too_many_references');
  if(entry.evidence.some(ref=>typeof ref!=='string'||!references.has(ref)))throw evidenceError('unknown_reference');
  if(new Set(entry.evidence).size!==entry.evidence.length)throw evidenceError('duplicate_reference');
  if(entry.evidence.some(ref=>references.get(ref).id!==entry.id))throw evidenceError('wrong_product');
  const index=ids.indexOf(entry.id),p=products[index];
  // The ID scopes the prose. Collective/ordinal prose would introduce a
  // different subject, so reject it instead of guessing across product facts.
  const text=norm(entry.reply),own=norm(p.title),withoutOwn=text.split(own).join('');
  if(comparisonReference.test(entry.reply)||products.some((other,i)=>i!==index&&norm(other.title)!==own&&withoutOwn.includes(norm(other.title))))throw scopeError();
  // Reuse every existing single-product check with ONLY this product's facts.
  // Literal excerpts retain their owner; no quote or generated text is edited.
  const evidence=entry.evidence.map(ref=>({id:'catalog:0',quote:references.get(ref).quote}));
  const result=validate(p,{ids:['catalog:0'],reply:entry.reply,evidence});
  validated.set(entry.id,p.title+'\n'+result.text);
 }
 if(requireAll&&seen.size!==ids.length)throw Error('catalog_comparison_omitted');
 const selected=ids.filter(id=>seen.has(id));
 return {text:selected.map(id=>validated.get(id)).join('\n\n'),ids:selected};
}
