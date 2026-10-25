// Bounded rehearsal state, deliberately separate from production context-v2.
// Stores a prepared card ID and language only, never raw messages, links or PII.
import {reply,normalizeText,preparedAnswer} from './dialogue.mjs';
const price=/^(?:а )?(?:сколько(?: это)? стоит|а сколько|какая цена|how much(?: does it cost)?|what is the cost|cik maksā|cik tas maksā)[?.!]*$/iu;
const duration=/^(?:а )?(?:какой срок|сколько ждать|когда привезут|how long(?: does it take)?|cik ilgi|kad piegādās)[?.!]*$/iu;
const missingPrice={ru:'Стоимость этого варианта в подготовленных сведениях не указана. Уточните её при оформлении заказа или у магазина.',lv:'Šī varianta cena sagatavotajā informācijā nav norādīta. Precizējiet to pasūtījuma noformēšanā vai veikalā.',en:'The prepared information does not state a price for this option. Check it at checkout or with the shop.'};
const languageOnly=/^(?:(?:please )?(?:answer|reply|respond|speak)(?: to me)? in (?:english|latvian|russian)|отвечай(?:те)?(?: мне)? (?:на (?:английском|латышском|русском)|по-русски)|atbild(?:i|iet) (?:latviski|angliski|krieviski))[.!?]*$/iu;
export function createConversation(profile,initialLocale='ru'){
 let locale=['ru','lv','en'].includes(initialLocale)?initialLocale:'ru',lastCardId=null;
 const snapshot=()=>({shop:profile.id,locale,lastCardId});
 return Object.freeze({
  snapshot,
  reset(){locale=['ru','lv','en'].includes(initialLocale)?initialLocale:'ru';lastCardId=null;return snapshot();},
  next(text){
   let result=reply(profile,text,locale),used=false;
   const normalized=normalizeText(text),card=profile.cards.find(c=>c.id===lastCardId);
   if(card&&languageOnly.test(normalized)&&result.kind==='clarify'){
    result=preparedAnswer(profile,card,result.locale);used=true;
   }
   if(result.kind==='clarify'&&!result.cardId&&card&&['fact','conflict'].includes(card.kind)){
    const isPrice=price.test(normalized),isDuration=duration.test(normalized);
    const priceTopic=['delivery','pickup','payment','minimum'].includes(card.topic);
    const durationTopic=['delivery','opening','returns'].includes(card.topic);
    const hasPrice=/€|cost|free/i.test(card.answer.en),hasDuration=/days|hours|time|estimate/i.test(card.answer.en);
    if((isPrice&&priceTopic&&hasPrice)||(isDuration&&durationTopic&&hasDuration)){
     result={...result,kind:card.kind,answer:card.answer[result.locale],cardId:card.id,sources:[...card.sources]};used=true;
    }else if(isPrice&&priceTopic){
     result={...result,answer:missingPrice[result.locale]};used=true;
    }
   }
   locale=result.locale;
   lastCardId=used&&card?card.id:result.cardId;
   // In particular, social closing, rejected links and PII never retain a stale card.
   return {...result,contextUsed:used};
  }
 });
}
