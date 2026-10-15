// Whole-message allowlists keep courtesy handling from swallowing real support questions.
const groups={
 thanks:new Set(['thanks','thank you','thank u','thx','ty','good thank u','good thank you','ok thanks','okay thanks','great thanks','thanks a lot','thank you very much','спасибо','спс','благодарю','спасибо большое','большое спасибо','ок спасибо','хорошо спасибо','понял спасибо','все понятно спасибо','всё понятно спасибо','paldies','liels paldies','paldies jums','labi paldies','skaidrs paldies']),
 goodbye:new Set(['bye','goodbye','bye bye','see you','have a nice day','good night','пока','до свидания','до встречи','хорошего дня','спокойной ночи','atā','ata','uz redzēšanos','uz redzesanos','jauku dienu','ar labu nakti']),
 acknowledge:new Set(['ok','okay','okey','all right','alright','got it','understood','great','good','perfect','sure','ок','окей','хорошо','понял','поняла','понятно','ясно','отлично','супер','labi','skaidrs','sapratu','lieliski']),
 greeting:new Set(['hey','hey there','good morning','good afternoon','good evening','добрый день','доброе утро','добрый вечер','labvakar','labrīt','labrit'])
};
export function socialRoute(text){
 const normalized=text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
 for(const [kind,phrases]of Object.entries(groups))if(phrases.has(normalized))return {ids:[],kind,handoff:false,social:true};
 return null;
}
export const socialText={
 ru:{thanks:'Пожалуйста! 🙂 Если появятся вопросы о доставке, оплате, возврате или гарантии — обращайтесь.',goodbye:'Хорошего дня! 🙂 Если понадобится помощь с правилами магазина, я здесь.',acknowledge:'Хорошо 🙂 Если появятся ещё вопросы, спрашивайте.',greeting:'Здравствуйте! 🙂 Чем помочь: доставка, оплата, возврат или гарантия?'},
 lv:{thanks:'Lūdzu! 🙂 Ja rodas jautājumi par piegādi, apmaksu, atgriešanu vai garantiju, droši jautājiet.',goodbye:'Jauku dienu! 🙂 Ja vajadzēs palīdzību ar veikala noteikumiem, esmu šeit.',acknowledge:'Labi 🙂 Ja rodas vēl kādi jautājumi, droši jautājiet.',greeting:'Labdien! 🙂 Kā varu palīdzēt: piegāde, apmaksa, atgriešana vai garantija?'},
 en:{thanks:'You’re welcome! 🙂 If you have any questions about delivery, payment, returns or warranty, just ask.',goodbye:'Have a nice day! 🙂 I’m here if you need help with the shop’s policies.',acknowledge:'Got it 🙂 Feel free to ask if you have any more questions.',greeting:'Hello! 🙂 How can I help: delivery, payment, returns or warranty?'}
};
