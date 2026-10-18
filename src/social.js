// Whole-message allowlists keep courtesy handling from swallowing real support questions.
const groups={
 thanks:new Set(['thanks for your help','thank you for your help','thanks for the help','thank you for the help','спасибо за помощь','благодарю за помощь','спасибо за ответ','paldies par palīdzību','paldies par palidzibu','paldies par atbildi','thanks','thank you','thank u','thx','ty','good thank u','good thank you','ok thanks','okay thanks','great thanks','thanks a lot','thank you very much','спасибо','спс','благодарю','спасибо большое','большое спасибо','ок спасибо','хорошо спасибо','понял спасибо','все понятно спасибо','всё понятно спасибо','paldies','liels paldies','paldies jums','labi paldies','skaidrs paldies']),
 goodbye:new Set(['have a good day','have a great day','have a lovely day','have a nice evening','have a good evening','take care','see you later','see you soon','всего доброго','всего хорошего','удачного дня','хорошего вечера','до скорого','jauku vakaru','veiksmīgu dienu','veiksmigu dienu','visu labu','bye','goodbye','bye bye','see you','have a nice day','good night','пока','до свидания','до встречи','хорошего дня','спокойной ночи','atā','ata','uz redzēšanos','uz redzesanos','jauku dienu','ar labu nakti']),
 acknowledge:new Set(['ok','okay','okey','all right','alright','got it','understood','great','good','perfect','sure','ок','окей','хорошо','понял','поняла','понятно','ясно','отлично','супер','labi','skaidrs','sapratu','lieliski']),
 greeting:new Set(['hey','hey there','good morning','good afternoon','good evening','добрый день','доброе утро','добрый вечер','labvakar','labrīt','labrit'])
};
export function socialRoute(text){
 const normalized=text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 // Parse combinations of known social phrases, consuming EVERY token.
 // “Thanks, have a nice day” is social; “Thanks, item broken” is not.
 const tokens=normalized.split(' ');if(tokens.length>32)return null;
 const entries=Object.entries(groups).flatMap(([kind,phrases])=>[...phrases].map(phrase=>({kind,tokens:phrase.split(' ')})));
 const paths=new Map([[0,[]]]);
 for(let i=0;i<tokens.length;i++){
  const previous=paths.get(i);if(!previous)continue;
  for(const entry of entries){
   if(entry.tokens.every((word,j)=>tokens[i+j]===word)){
    const end=i+entry.tokens.length,kinds=[...previous,entry.kind];
    if(!paths.has(end))paths.set(end,kinds);
    if(end<tokens.length-1&&['and','и','un'].includes(tokens[end])&&!paths.has(end+1))paths.set(end+1,kinds);
   }
  }
 }
 const kinds=paths.get(tokens.length);
 if(kinds){const kind=kinds.includes('goodbye')?(kinds.includes('thanks')?'closing':'goodbye'):kinds.includes('thanks')?'thanks':kinds.includes('greeting')?'greeting':'acknowledge';return {ids:[],kind,handoff:false,social:true};}
 return null;
}
export const socialText={
 ru:{closing:'Пожалуйста, и вам хорошего дня! 🙂',clarify:'Уточните, пожалуйста, что вас интересует: доставка, оплата, возврат или гарантия?',notHelpful:'Давайте уточним: какой момент остался непонятным? Можно описать ситуацию другими словами, без персональных данных.',thanks:'Пожалуйста! 🙂',goodbye:'Хорошего дня! 🙂',acknowledge:'Хорошо 🙂 Если появятся ещё вопросы, спрашивайте.',greeting:'Здравствуйте! 🙂 Чем помочь: доставка, оплата, возврат или гарантия?'},
 lv:{closing:'Lūdzu, arī jums jauku dienu! 🙂',clarify:'Lūdzu, precizējiet: vai jautājums ir par piegādi, apmaksu, atgriešanu vai garantiju?',notHelpful:'Precizēsim: kas palika neskaidrs? Varat aprakstīt situāciju citiem vārdiem, neiekļaujot personas datus.',thanks:'Lūdzu, prieks palīdzēt! 🙂',goodbye:'Jauku dienu! 🙂',acknowledge:'Labi 🙂 Ja rodas vēl kādi jautājumi, droši jautājiet.',greeting:'Labdien! 🙂 Kā varu palīdzēt: piegāde, apmaksa, atgriešana vai garantija?'},
 en:{closing:'You’re welcome, and have a lovely day too! 🙂',clarify:'Could you clarify what you need help with: delivery, payment, returns or warranty?',notHelpful:'Let’s clarify: which part is still unclear? You can describe the situation in other words, without personal details.',thanks:'You’re welcome! 🙂',goodbye:'Have a nice day! 🙂',acknowledge:'Got it 🙂 Feel free to ask if you have any more questions.',greeting:'Hello! 🙂 How can I help: delivery, payment, returns or warranty?'}
};

export const dialogueIntents={
 thanks:'Courtesy only: gratitude in any wording, abbreviations or minor typos; no unresolved support request.',
 goodbye:'Courtesy only: farewell or good wishes, without gratitude or unresolved request.',
 closing:'Courtesy only: gratitude combined with farewell/good wishes, including “Спасибо, хорошего дня!”.',
 acknowledge:'Courtesy only: confirmation, understanding or a positive acknowledgement.',
 greeting:'Greeting only, without a substantive question.',
 clarify:'Unclear, incomplete or off-topic request: ask one focused clarification instead of escalating.',
 notHelpful:'User says answer was unclear or unhelpful, with no new specific issue: ask what remains unclear.'
};
