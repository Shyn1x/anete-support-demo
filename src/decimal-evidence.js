// Exact textual decimal equivalence, without floating point, rounding, unit
// conversion or accepting a value from another product. Keep identifiers intact.
export function canonicalDecimal(value){
 const text=String(value).replace(',','.');
 if(!/^\d+\.\d+$/u.test(text))return text;
 return text.replace(/0+$/u,'').replace(/\.$/u,'');
}
