// Small verified catalogue snapshots, not a full catalogue or a suitability ranking.
// Source descriptions checked 2026-10-18. No prices, live stock or health claims.
export const selectionKnowledge={bariba:{
 sources:{
  'puppy-necon':{title:'Necon Atletic Puppy',url:'https://www.bariba.lv/necon-atletic-puppy-sausa-bariba-kuceniem-grusnam-un-laktejosam-kucem-15-kg.html'},
  'puppy-cooking':{title:'CooKing Puppies Recipe Daily Menu',url:'https://www.bariba.lv/cooking-grain-free-puppies-recipe-daily-menu-sausa-bariba-kuceniem12-kg.html'}
 },
 cards:[
  {id:'puppy-necon',topic:'product',source:'puppy-necon',checked:'2026-10-18',requiresReview:false,
   ru:'В описании Bariba.lv Necon Atletic Puppy указан как полнорационный сухой корм для щенков, фасовка 15 кг. Это пример из каталога, а не подтверждение наличия или индивидуальной пригодности.',
   lv:'Bariba.lv aprakstā Necon Atletic Puppy norādīta pilnvērtīga sausā barība kucēniem 15 kg iepakojumā. Tas ir piemērs no kataloga, nevis atlikuma vai individuālas piemērotības apstiprinājums.',
   en:'Bariba.lv describes Necon Atletic Puppy as complete dry food for puppies in a 15 kg pack. This is a catalogue example, not confirmation of stock or individual suitability.'},
  {id:'puppy-cooking',topic:'product',source:'puppy-cooking',checked:'2026-10-18',requiresReview:false,
   ru:'В каталоге Bariba.lv также указан CooKing Grain Free Puppies Recipe Daily Menu — сухой корм для щенков, фасовка 12 кг. По одному названию нельзя выбрать лучший корм для конкретного щенка.',
   lv:'Bariba.lv katalogā norādīta arī CooKing Grain Free Puppies Recipe Daily Menu sausā barība kucēniem 12 kg iepakojumā. Pēc nosaukuma vien nevar izvēlēties labāko barību konkrētam kucēnam.',
   en:'Bariba.lv also lists CooKing Grain Free Puppies Recipe Daily Menu dry food for puppies in a 12 kg pack. A product name alone cannot establish the best food for a particular puppy.'}
 ]
}};
const puppy=/щен|pupp|kuc[eē]n/iu;
// Consume the whole query so another brand, species, composition or constraint
// cannot be silently replaced with one of these examples.
const vocabulary=/^(?:како[йею]|какие|корм\p{L}*|лучше|лучший|подойд[её]т|подойдет|подходит|подобрать|посоветуйте|посоветуй|порекомендуй(?:те)?|пожалуйста|для|щен\p{L}*|сух\p{L}*|выбрать|есть|в|магазине|у|вас|what|which|food|foods|dry|is|are|the|a|for|puppy|puppies|best|better|suitable|recommend|recommended|can|you|please|do|have|choose|k[aā]d\p{L}*|bar[iī]b\p{L}*|kuc[eē]n\p{L}*|ieteikt\p{L}*|ieteic\p{L}*|izv[eē]l[eē]t\p{L}*|lab[aā]k\p{L}*|piem[eē]rot\p{L}*|sauso|saus[aā]|ir|vai|varat|man|l[uū]dzu)$/iu;
export function productSelectionRoute(text,tenantId){
 if(tenantId!=='bariba'||!puppy.test(text))return null;
 const tokens=text.normalize('NFKC').match(/\p{L}+/gu)||[];
 if(!tokens.length||tokens.some(token=>!vocabulary.test(token))||/\d|https?:/iu.test(text))return null;
 return {ids:['puppy-necon','puppy-cooking'],kind:'product-selection',handoff:false,selectionNeeds:true};
}
export const selectionQuestion={ru:'Сколько месяцев щенку и какая у него порода?',lv:'Cik mēnešu ir kucēnam un kāda ir viņa šķirne?',en:'How old is your puppy, and what breed is it?'};
