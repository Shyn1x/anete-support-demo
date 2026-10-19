// Interpret references to a bounded, already validated list. No source facts
// or arbitrary model names may be inferred from the ordinal itself.
export function ordinalSelection(message,count){
 const text=message.normalize('NFKC').toLowerCase();
 if(/\b(?:first aid|first[- ]time|second[- ]hand|third[- ]party)\b/iu.test(text)||/(?:\p{L}\d{3,}|\b\d{4,}\b)/u.test(text))return [];
 const mentions=[...text.matchAll(/(?<!\p{L})(перв(?:ый|ого|ой|ом|ому|ую)|втор(?:ой|ого|ом|ому|ую)|трет(?:ий|ьего|ьей|ьем|ьему|ью)|first|second|third|pirm(?:ais|o|ā|am|ajam|ajā|ajai|ās)|otr(?:ais|o|ā|am|ajam|ajā|ajai|ās)|treš(?:ais|o|ā|am|ajam|ajā|ajai|ās))(?!\p{L})/giu)].map(m=>{
  const before=text.slice(Math.max(0,m.index-24),m.index),after=text.slice(m.index+m[0].length,m.index+m[0].length+24);
  const negative=/(?<!\p{L})(?:не|not|nevis)\s+(?:(?:the|a)\s+)?$/iu.test(before)||/^\s+(?:не (?:подходит|нужен)|(?:doesn.t|does not) (?:fit|work)|neder)(?!\p{L})/iu.test(after);
  const id=/^(?:перв|first|pirm)/u.test(m[0])?0:/^(?:втор|second|otr)/u.test(m[0])?1:2;return {id,negative};
 });
 const chosen=[...new Set(mentions.filter(m=>!m.negative).map(m=>m.id))];
 if(chosen.some(i=>i>=count))return [];
 if(chosen.length===1)return chosen;
 return chosen.length===2&&/сравн|разниц|отлич|compare|difference|salīdzin|atšķir/iu.test(text)?chosen:[];
}
