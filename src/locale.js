// Conservative per-message language detection; ambiguous replies keep the UI language.
const words={
 en:new Set('hello hi hey bye goodbye great good perfect understood thx ty thanks thank please what how when where why can could do does is are i my you your the a an to for of on in with and but it this that return delivery deliver shipping warranty guarantee payment pay order item refund broken faulty changed mind outside latvia days'.split(' ')),
 lv:new Set('labdien sveiki labi skaidrs sapratu ata atā labvakar labrīt labrit paldies lūdzu ludzu kā ka kad kur vai cik kas es man mans mana jūs jus jūsu jusu ir var varu vēlos velos gribu par un bet ja preci prece preces atdot atgriezt atgriešana atgriesana atgriešanu piegāde piegade piegādi piegadi piegādes garantija garantiju apmaksa maksāt maksat pasūtījums pasutijums pasūtījumu nopirku salūza saluza pārdomāju pardomaju latvijā latvija dienas'.split(' '))
};
for(const word of 'size chart sizing insole leather material battery batteries ingredients food dog cat puppy adult grain gluten paint brush watercolour watercolor beginner tent sleeping bag weight stock availability'.split(' '))words.en.add(word);
for(const word of 'izmērs izmēri izmēru tabula pēda platums iekšzole sastāvs barība kucēns pieaugušiem bērns vecums baterijas krāsa ota papīrs telts guļammaiss noliktavā'.split(' '))words.lv.add(word);
export function detectLocale(message,fallback='ru'){
 const instruction=message.toLowerCase();
 if(/^(?:отвечай(?:те)?|перейди|говори(?:те)?).{0,15}английск|^(?:can you |could you |please )?(?:reply|respond|speak|answer).{0,15}english|^atbild(?:i|iet) angliski/.test(instruction))return 'en';
 if(/^(?:отвечай(?:те)?|перейди|говори(?:те)?).{0,15}латышск|^(?:can you |could you |please )?(?:reply|respond|speak|answer).{0,15}latvian|^atbild(?:i|iet) latviski/.test(instruction))return 'lv';
 if(/^(?:отвечай(?:те)?|перейди|говори(?:те)?).{0,15}русск|^(?:can you |could you |please )?(?:reply|respond|speak|answer).{0,15}russian|^atbild(?:i|iet) krieviski/.test(instruction))return 'ru';
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
