// Conservative per-message language detection; ambiguous replies keep the UI language.
const words={
 en:new Set('hello hi thanks thank please what how when where why can could do does is are i my you your the a an to for of on in with and but it this that return delivery deliver shipping warranty guarantee payment pay order item refund broken faulty changed mind outside latvia days'.split(' ')),
 lv:new Set('labdien sveiki paldies lūdzu ludzu kā ka kad kur vai cik kas es man mans mana jūs jus jūsu jusu ir var varu vēlos velos gribu par un bet ja preci prece preces atdot atgriezt atgriešana atgriesana atgriešanu piegāde piegade piegādi piegadi piegādes garantija garantiju apmaksa maksāt maksat pasūtījums pasutijums pasūtījumu nopirku salūza saluza pārdomāju pardomaju latvijā latvija dienas'.split(' '))
};
export function detectLocale(message,fallback='ru'){
 const tokens=message.normalize('NFKC').toLowerCase().match(/\p{L}+/gu)||[];
 const counts={ru:0,lv:0,en:0};
 for(const word of tokens){
  if(/[а-яё]/u.test(word))counts.ru++;
  if(words.en.has(word))counts.en++;
  if(words.lv.has(word)||/[āčēģīķļņšūž]/u.test(word))counts.lv++;
 }
 const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
 const [language,score]=ranked[0],runner=ranked[1][1];
 return score>0&&score>runner?language:(['ru','lv','en'].includes(fallback)?fallback:'ru');
}
