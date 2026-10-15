// Conservative dictionary correction for the free reference router only.
// One insertion, deletion, substitution or adjacent transposition; no short tokens.
const vocabulary=[
 'гарантия','гарантии','гарантию','доставка','доставки','доставку','оплата','оплаты','оплату',
 'возврат','пакомат','пакомата','курьер','курьера','рассрочка',
 'самовывоз','оператор','сотрудник','компенсация','упаковка','упаковку',
 'garantija','garantijas','garantiju','piegāde','piegādes','piegādi','apmaksa','apmaksāt',
 'maksājums','atmaksa','atmaksas','atmaksāt','atgriešana','atgriezt','pakomāts','pakomāta','kurjers','rēķins','rēķinu',
 'darbinieks','sazināties','pasūtījums','bojāts',
 'warranty','delivery','payment','returns','return','refund','invoice','courier',
 'shipping','instalments','packaging','damaged','broken','contact','cancel'
];
const fold=s=>s.normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu,'$1').normalize('NFC').toLowerCase();
const entries=vocabulary.map(word=>({word,folded:fold(word)}));
function oneEdit(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
 if(i===a.length||i===b.length)return true;
 if(a.length===b.length)return a.slice(i+1)===b.slice(i+1)||
  (a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
 return a.length>b.length?a.slice(i+1)===b.slice(i):a.slice(i)===b.slice(i+1);
}
export function correctTypos(text){
 return text.replace(/\p{L}+/gu,token=>{
  if(token.length<5||token.length>24)return token;
  const value=fold(token),exact=entries.find(e=>e.folded===value);
  if(exact)return exact.word;
  const candidates=entries.filter(e=>oneEdit(value,e.folded));
  // Ambiguous matches are left untouched instead of guessing.
  return candidates.length===1?candidates[0].word:token;
 });
}
