// Clarification and control intents. No unverified catalog facts or stock claims.
import {nicheRoute} from './niche-route.js';
import {pilotDomains,pilotHelp} from './pilots.js';
import {canContinueProduct} from './catalog.js';
const policy=/достав|пакомат|курьер|возврат|вернуть|оплат|гарант|самовывоз|посылк|pieg[aā]d|pakom[aā]t|kurjer|atgrie|apmaks|garant|delivery|shipping|return|payment|warranty|courier/iu;
const anchors={'toy-age':'HE0545','toy-batteries':'HE0545','toy-dimensions':'HE0545','food-composition':'CooKing Lamb','food-stage':'CooKing Lamb','food-pack':'CooKing Lamb','art-beginner':'POP ART','art-pack':'POP ART','art-colours':'POP ART','shoe-width':'42801','shoe-material':'42801','shoe-insole':'42801','sleep-ratings':'sleeping bag','sleep-factors':'sleeping bag','sleep-guide':'sleeping bag'};
const result=(kind,handoff=false)=>({ids:[],kind,handoff});
export function productHelpIntent(s){
 if(/сравн|разниц|compare|difference|salīdzin|atšķir/iu.test(s))return 'compare';
 if(/подобра|подбер|посовет|выбра|выбор|лучше|подойд|recommend|choose|best|suit|izvēl|ieteik|piemērot/iu.test(s))return 'selection';
 return 'details';
}
const helpResult=s=>({...result('product-help'),productIntent:productHelpIntent(s)});
// Safety has priority even when the customer supplies a valid product URL.
// These signals select a specialist review; they never diagnose or certify fit.
export function productSafetyRoute(s,tenant){
 if(Object.hasOwn(pilotDomains,tenant)&&/аллерг|allerg|alerģ|безопас|\bsafe\b|droš|бь[её]т ток|искрит|пахнет гарью|electric shock|sparking|smoke|dzirksteļ/iu.test(s))return result('product-safety',true);
 const signals={
  bariba:/аллерг|болезн|лечит|лечени|лечеб|ветеринар|veterinar|allerg|alerģ|alerg|disease|treat|ārst|slim|рв[её]т|рвот|понос|диаре|vomit|diarrh|vemj|vemšan|caurej/iu,
  hobbyset:/на теле|на коже|(?:рисова|нанес|наноси|красить|раскрас).{0,35}(?:лиц|губ|глаз)|(?:лицо|лице|губы).{0,30}(?:реб[её]н|краск)|безопас.{0,20}реб[её]н|реб[её]н.{0,20}безопас|skin|body paint|(?:paint|apply).{0,25}(?:on (?:a |the |my |their )?(?:child.s )?face|face painting)|face paint|(?:krās|uzklā).{0,25}(?<!\p{L})(?:sej|ād)|droš.{0,15}bērn/iu,
  apavi40plus:/ортопед|болезн|диабет|нейропат|medical|orthop|diab[eē]t|neuropath|ārst/iu,
  rotallieta:/(?:(?:ему|ей|малышу|реб[её]нку|viņam|viņai|bērnam).{0,24}(?:месяц|месяцев|mēneš)|^(?:ошибся[, ]*|ошиблась[, ]*|sorry[, ]*)?(?:\d{1,2}|восемь|eight|astoņi)\s*(?:месяц\p{L}*|months? old|mēneš\p{L}*)[.!? ]*$)|безопас|младен|новорожд|safe|newborn|droš|jaundzim|(?:реб[её]н|малыш).{0,30}(?:месяц|месяцев)|(?:baby|infant|months? old)|(?:bērn|zīdai).{0,30}mēneš/iu,
  celotajs:/безопас|safe|droš|[−-]\s*\d+.{0,20}(спать|спаль|sleep)|спаль.{0,30}[−-]\s*\d+|горелк|баллон|страхов|burner|gas canister|belay|gas stove|gāzes degl/iu,
  anete:/пораж.{0,15}ток|бь[её]т ток|дымит|задым|искрит|перегрев|electric shock|sparking|overheat|smoke|dūmo|dzirksteļ|pārkar/iu
 };
 return signals[tenant]?.test(s)?result('product-safety',true):null;
}
export function buyerControl(s,tenant){
 if(/^(?:can you |could you |please )?(?:reply|respond|speak|answer) (?:to me )?in (?:english|russian|latvian)[?.! ]*$|^(?:отвечай(?:те)?|перейди|говори(?:те)?) (?:мне )?(?:на|по)[ -]?(?:английск|русск|латышск)\p{L}*[?.! ]*$|^atbild(?:i|iet) (?:angliski|krieviski|latviski)[?.! ]*$/iu.test(s))return {...result('language'),social:true};
 if(/^(?:мне )?(?:ничего не понял|не помог(?:ло)?(?: ответ)?|непонятно|не понял(?: ответ)?|это не то|не это)|^(?:that.s not helpful|not helpful|i don.t understand|nesapratu|nepalīdz)/iu.test(s)&&!policy.test(s))return {...result('notHelpful'),social:true};
 if(/живой|живого|консультант|менеджер|живу.{0,8}человек|real person|live agent|someone real|konsultant/iu.test(s))return {ids:['contact'],kind:'answer',handoff:true};
 if(/поменять.{0,10}(адрес|заказ)|change.{0,15}(address|order)/iu.test(s))return {ids:['status'],kind:'answer',handoff:true};
 if(/не работает.{0,15}(?:оплат|карта)|(?:оплат|карта).{0,15}не работает/iu.test(s))return {ids:['payment-problem'],kind:'answer',handoff:true};
 if(/не работает|не включается|не запускается|не заряжается|слом(?:ан|алась|алось)|broken|damaged|faulty|doesn.t work|nestrād|bojāt/iu.test(s))return {ids:['defect'],kind:'answer',handoff:true};
 if(/срок гарантии|гарантийн.{0,10}срок|warranty period|garantijas termiņ/iu.test(s))return {ids:['warranty'],kind:'answer',handoff:false};
 const returnIntent=/вернуть|верн[её]те.{0,8}деньг|возврат|обмен|поменять.{0,10}размер|return|exchange|atgrie|mainīt.{0,10}izmēr/iu.test(s);
 const opened=/открыл|открыт|упаковк|использ|натира|opened|packaging|used|atvērt|iepakojum|lietot/iu.test(s);
 if(returnIntent&&opened)return {ids:['return'],kind:'answer',handoff:true};
 if(returnIntent&&/обмен|поменять.{0,10}размер|exchange|mainīt.{0,10}izmēr/iu.test(s))return {ids:['return-process'],kind:'answer',handoff:tenant==='hobbyset'};
 if(/пахнет странно|необычн.{0,8}запах|молнию заело|молния заела|smells (?:strange|bad)|zipper.{0,8}(stuck|jammed)|rāvējslēdz.{0,8}iestrē/iu.test(s))return {ids:['defect'],kind:'answer',handoff:true};
 if(/(?:вариант|способ).{0,20}получени|как (?:можно )?получить (?:мой |свой |этот )?заказ|(?:receiv|collection).{0,15}options|ways to (?:receive|collect)|how can i (?:receive|get) (?:my|the) order|saņemšanas (?:veid|iespēj)|kā (?:varu |var )?saņemt pasūtījumu/iu.test(s)&&!/не получил|не приш|missing|not received|nav saņem|спис|refund|вернуть|слом|damage/iu.test(s))return {ids:['delivery'],kind:'answer',handoff:false};
 if(/побыстрее|поскорее|побыстрей|as soon as possible|faster delivery|ātrāk/iu.test(s))return {ids:['timing'],kind:'answer',handoff:false};
 const delivery=/достав|pieg[aā]d|delivery|shipping/iu.test(s),pay=/оплат|платить|apmaks|maksāt|payment|pay(?:ment)? methods/iu.test(s);
 if(delivery&&pay&&!/спис|слом|damage|charge|refund|atmaks|вернут/iu.test(s))return {ids:[/стоим|стоить|цен|бесплат|cost|price|free|pieg[aā]d.{0,15}(?:cen|izmaks)|bezmaksas pieg/iu.test(s)?'shipping-cost':'delivery','payment'],kind:'answer',handoff:/стоим|стоить|цен|бесплат|cost|price|free|pieg[aā]d.{0,15}(?:cen|izmaks)|bezmaksas pieg/iu.test(s)};
 return null;
}
export function buyerProduct(s,tenant,previous){
 if(!['anete','rotallieta','bariba','hobbyset','apavi40plus','celotajs'].includes(tenant)&&!Object.hasOwn(pilotDomains,tenant)||policy.test(s))return null;
 if(tenant==='anete'&&!/модел|пылесос|холодиль|телевиз|микроволн|стираль|product|model|vacuum|fridge|refrigerator|television|microwave|washing machine|modelis|putekļsūc|ledusskap|televizor/iu.test(s))return null;
 const switching=/друг(?:ая|ой|ие|ого|ую)|другой|another|other|citu|cits|cita|теперь|now about/iu.test(s);
 // Only short follow-ups with a referent may reuse a verified model. A new model cancels this.
 if(anchors[previous]&&/^(а(?=\s|[?.!]|$)|and\b|what about|un\b|bet\b)/iu.test(s)&&s.length<100&&canContinueProduct(s)&&!switching&&!/(?:[a-z]{1,5}\d{3,}|\b\d{4,}\b)/iu.test(s)){
  const match=nicheRoute(anchors[previous]+' '+s,tenant);if(match?.ids.length)return match;
 }
 const safety=productSafetyRoute(s,tenant);if(safety)return safety;
 const sizing=tenant==='apavi40plus'&&/размер|рамзер|разме|сетк|таблиц|\bsize|sizing|izm[eē]r|п[её]с?т.{0,5}стоп|\d+\s*см/iu.test(s);
 if(sizing&&!/налич|есть|available|stock|noliktav|pieejam/iu.test(s))return result('product-sizing');
 const live=/налич|сейчас|сегодня|цен[аыуе]|стоим|срок.{0,8}годност|годност.{0,8}парт|\bstock\b|in stock|availab|price|today|expir|pieejam|noliktav|šodien|derīg/iu.test(s)||/^(?:а )?есть\b/iu.test(s)||/есть.{0,35}(?:ботин|оттен|акв[а-я]*рел|пробник|корм|туф)/iu.test(s)||/(?:без куриц|без мелк).{0,8}есть/iu.test(s);
 if(live)return /без куриц/iu.test(s)?helpResult(s):result('product-live');
 const domains={...pilotDomains,
 anete:/товар|модел|пылесос|холодиль|телевиз|микроволн|стираль|product|model|vacuum|fridge|refrigerator|television|microwave|washing machine|prece|modelis|putekļsūc|ledusskap|televizor/iu,
 rotallieta:/игруш|реб[её]н|малыш|дочк|сын|подар|детал|бат[а-я]*рей|батре|аккумулятор|комплект|коробк|мыть|toy|child|toddler|gift|batter|parts|box|bērn|vecum|bater|rotaļ|dāvan/iu,
 bariba:/корм|собак|кот[ау]?\b|куриц|с[ао]став|ингреди|грамм|меш(?:ок|ка|ки|ков)|беззерн|безглют|пробник|food|dog|cat\b|ingredient|grain|gluten|chicken|barīb|barib|sastāv|sastav|kucēn|vist/iu,
 hobbyset:/рисов|краск|акв[а-я]*рел|ткани|дерев|кист|набор|глин|запек|разбав|белый|укрыва|тюбик|paint|brush|watercolou?r|acrylic|clay|paper|fabric|beginner|krās|kras|ot[au]|papīr|iesāc/iu,
 apavi40plus:/обув|туф|ботин|сапог|стоп|стельк|кож|замш|широк|ухажив|пары|shoe|foot|insole|leather|suede|wide|apav|pēd|iekšzol|ādas|plat/iu,
 celotajs:/палат|спаль|рюкзак|поход|коврик|матрас|куртк|дожд|стирать|вес|объ[её]м|tent|sleeping|backpack|hiking|rain|wash|weight|telt|guļammais|mugursom|paklāj/iu
 };
 if(domains[tenant].test(s)||switching&&anchors[previous])return helpResult(s);
 return null;
}
export const productSelectionCopy={
 ru:{anete:'Что подбираете и какие характеристики для вас важнее? Если есть конкретные модели, пришлите названия или ссылки. Полный каталог магазина к демо пока не подключён.',bariba:'Сколько лет питомцу и какой корм ищете: сухой или влажный? Если уже присмотрели варианты, пришлите названия или ссылки. Полный каталог магазина к демо пока не подключён.',rotallieta:'Для какого возраста и чем интересуется ребёнок? Если уже присмотрели игрушки, пришлите названия или ссылки.',hobbyset:'Что хотите сделать и с каким материалом будете работать? Это поможет сузить выбор. Можно прислать ссылки на понравившиеся товары.',apavi40plus:'Для какого сезона и случая нужна обувь? Напишите размер и пожелания по ширине, а если уже выбрали модели — пришлите ссылки.',celotajs:'Куда и в какое время года планируете идти? Напишите, какое снаряжение ищете. Конкретные модели можно прислать ссылками.'},
 lv:{anete:'Kādu preci meklējat un kuras īpašības ir svarīgākās? Ja jau apsverat modeļus, atsūtiet nosaukumus vai saites. Pilns veikala katalogs demonstrācijai vēl nav pieslēgts.',bariba:'Cik vecs ir mājdzīvnieks, un vai meklējat sauso vai mitro barību? Ja jau apsverat preces, atsūtiet to nosaukumus vai saites. Pilns veikala katalogs demonstrācijai vēl nav pieslēgts.',rotallieta:'Kāds ir bērna vecums un intereses? Ja jau apsverat rotaļlietas, atsūtiet to nosaukumus vai saites.',hobbyset:'Ko vēlaties izgatavot un ar kādu materiālu strādāsiet? Varat atsūtīt arī iepatikušos preču saites.',apavi40plus:'Kādai sezonai un situācijai vajadzīgi apavi? Norādiet izmēru un vēlamo platumu. Ja modeļi jau izvēlēti, atsūtiet saites.',celotajs:'Kur un kurā gadalaikā plānojat doties? Kāds ekipējums vajadzīgs? Konkrētus modeļus varat atsūtīt ar saitēm.'},
 en:{anete:'What product are you looking for, and which features matter most? If you have models in mind, share their names or links. The full shop catalogue is not connected to this demo yet.',bariba:'How old is your pet, and are you looking for dry or wet food? If you have products in mind, share their names or links. The full shop catalogue is not connected to this demo yet.',rotallieta:'How old is the child, and what do they enjoy? If you already have toys in mind, share their names or links.',hobbyset:'What would you like to make, and what material will you work with? You can also share links to products you are considering.',apavi40plus:'What season and occasion are the shoes for? Tell me the size and preferred width. If you have models in mind, share their links.',celotajs:'Where and in what season are you going? What equipment do you need? You can share links to specific models.'}
};
export const productCompareCopy={ru:'Какие товары хотите сравнить? Пришлите их точные названия или ссылки и укажите, что для вас важнее. Сравнение возможно только по подтверждённым характеристикам.',lv:'Kuras preces vēlaties salīdzināt? Atsūtiet precīzus nosaukumus vai saites un norādiet svarīgāko. Salīdzināt var tikai pārbaudītas īpašības.',en:'Which products would you like to compare? Share their exact names or links and what matters most to you. Only verified specifications can be compared.'};
export const buyerCopy={
 ru:{language:'Конечно. Чем помочь?',productSafety:'Не могу подтвердить безопасность, лечебный эффект или пригодность в конкретных условиях. Нужны точная модель и проверка специалиста; по свойствам товара можно обратиться в магазин.',help:{anete:'Укажите точное название товара или ссылку и что хотите узнать. Характеристики неизвестной модели не подтверждаю; полный каталог пока не подключён.',rotallieta:'Какую игрушку рассматриваете? Напишите название или артикул и возраст ребёнка. Проверю только сведения, которые есть в базе; полный каталог пока не подключён.',bariba:'Уточните название корма и что хотите проверить: состав, возраст питомца, фасовку или хранение. Для конкретного ответа нужна проверенная карточка; полный каталог пока не подключён.',hobbyset:'Для какой задачи и какого материала подбираете товар? Укажите название или артикул, если он есть. Без описания конкретного продукта совместимость и способ применения не подтверждаю.',apavi40plus:'Укажите модель обуви и нужный параметр: размер, ширину, материал, стельку или уход. Характеристики разных моделей отличаются; полный каталог пока не подключён.',celotajs:'Какое снаряжение и для каких условий рассматриваете? Напишите модель и нужный параметр. Без проверенной карточки не подтверждаю вес, совместимость или подходящие условия использования.'}},
 lv:{language:'Protams. Kā varu palīdzēt?',productSafety:'Nevaru apstiprināt drošību, ārstniecisku iedarbību vai piemērotību konkrētiem apstākļiem. Vajadzīgs precīzs modelis un speciālista izvērtējums; par preces īpašībām var jautāt veikalam.',help:{anete:'Norādiet precīzu preces nosaukumu vai saiti un jautājumu. Nezināma modeļa īpašības neapstiprinu; pilns katalogs vēl nav pieslēgts.',rotallieta:'Kuru rotaļlietu apsverat? Uzrakstiet nosaukumu vai artikulu un bērna vecumu. Pārbaudīšu tikai datubāzē esošo informāciju; pilns katalogs vēl nav pieslēgts.',bariba:'Precizējiet barības nosaukumu un jautājumu: sastāvs, dzīvnieka vecums, iepakojums vai glabāšana. Vajadzīgs pārbaudīts preces apraksts; pilns katalogs vēl nav pieslēgts.',hobbyset:'Kādam darbam un materiālam vajadzīga prece? Norādiet nosaukumu vai artikulu, ja tas zināms. Bez konkrētā apraksta saderību un lietošanu neapstiprinu.',apavi40plus:'Norādiet apavu modeli un interesējošo parametru: izmērs, platums, materiāls, iekšzole vai kopšana. Modeļu īpašības atšķiras; pilns katalogs vēl nav pieslēgts.',celotajs:'Kādu ekipējumu un kādiem apstākļiem apsverat? Uzrakstiet modeli un vajadzīgo parametru. Bez pārbaudīta apraksta svaru, saderību vai piemērotus apstākļus neapstiprinu.'}},
 en:{language:'Of course. How can I help?',productSafety:'I cannot confirm safety, therapeutic effects or suitability for specific conditions. The exact model and a specialist’s assessment are needed; ask the shop about product specifications.',help:{anete:'Please give the exact product name or link and your question. I cannot confirm an unknown model’s specifications; the full catalogue is not connected yet.',rotallieta:'Which toy are you considering? Please give its name or code and the child’s age. I can check only verified information in the knowledge base; the full catalogue is not connected yet.',bariba:'Please clarify which food you mean and what you want to check: ingredients, pet age, pack size or storage. A verified product description is needed; the full catalogue is not connected yet.',hobbyset:'What task and material is the product for? Please give its name or code if known. I cannot confirm compatibility or use without that product’s verified description.',apavi40plus:'Please give the shoe model and the detail you need: size, width, material, insole or care. Specifications vary by model; the full catalogue is not connected yet.',celotajs:'Which equipment and conditions are you considering? Please give the model and the detail you need. I cannot confirm weight, compatibility or suitable conditions without a verified description.'}}
};

// Shared engine copy for the opt-in preview shops.
for(const locale of ['ru','lv','en']){Object.assign(buyerCopy[locale].help,pilotHelp[locale]);Object.assign(productSelectionCopy[locale],pilotHelp[locale]);}
