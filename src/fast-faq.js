// A whole-message FAQ recognizer, not a keyword router. Any extra condition,
// product, link, complaint or request to rephrase stays on the existing path.
export const FAST_FAQ_REVISION='fast-faq-v1';
const questions={
 delivery:[
  /^(?:доставка|какие способы доставки(?: есть)?|как получить заказ|как осуществляется доставка)$/u,
  /^(?:piegāde|kādi piegādes veidi(?: ir pieejami)?|kā saņemt pasūtījumu)$/u,
  /^(?:delivery|delivery options|what delivery options are available|what are (?:the |your )?delivery options|how do you deliver)$/u
 ],
 payment:[
  /^(?:оплата|как (?:можно )?оплатить(?: заказ)?|какие способы оплаты(?: есть)?)$/u,
  /^(?:apmaksa|kā (?:var )?apmaksāt(?: pasūtījumu)?|kādi (?:ir )?maksāšanas veidi)$/u,
  /^(?:payment|how (?:can|do) i pay|what payment methods (?:are available|do you accept))$/u
 ],
 pickup:[
  /^(?:самовывоз|есть ли самовывоз|можно (?:ли )?забрать (?:заказ )?(?:самому|самостоятельно)|где (?:можно )?забрать заказ)$/u,
  /^(?:pašizvešana|vai (?:pasūtījumu )?var saņemt uz vietas(?:,? un kur)?|kur var saņemt pasūtījumu)$/u,
  /^(?:pickup|self-pickup|can i (?:collect|pick up)(?: my order)? in person|where can i (?:collect|pick up)(?: my order)?)$/u
 ],
 'return-process':[
  /^как вернуть (?:товар|покупку)$/u,/^kā atgriezt preci$/u,/^how (?:do|can) i return (?:an item|a product|my purchase)$/u
 ],
 return:[/^возврат(?: товара)?$/u,/^atgriešana$/u,/^returns?(?: policy)?$/u],
 timing:[/^какие сроки доставки$/u,/^kādi (?:ir )?piegādes termiņi$/u,/^what are (?:the |your )?delivery times$/u],
 warranty:[/^какая гарантия$/u,/^kāda (?:ir )?garantija$/u,/^what is the warranty period$/u]
};
export function fastFaqRoute(text,tenant,reference){
 if(typeof text!=='string'||text.length>160||reference?.kind!=='answer'||reference.handoff||reference.social||reference.clarificationKind||reference.ids?.length!==1)return null;
 const id=reference.ids[0],card=tenant.cards.find(c=>c.id===id);
 if(!card||card.requiresReview||card.topic==='product'||!questions[id])return null;
 const query=text.normalize('NFKC').toLowerCase().trim().replace(/[?!…]+$/gu,'').trim();
 return questions[id].some(re=>re.test(query))?{ids:[id],kind:'answer',handoff:false}:null;
}
