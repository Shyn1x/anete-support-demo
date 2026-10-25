// Bounded local rehearsal, NOT an AI/provider implementation or a production route.
// No fetch, storage, telemetry, orders, attachments or API/budget configuration.
import {detectLocale} from '../../src/locale.js';
import {socialRoute,socialText} from '../../src/social.js';

const copy={
 ru:{unknown:'Не могу подтвердить это по подготовленным сведениям. Уточните товар и вопрос, пожалуйста.',
  multi:'Здесь несколько разных вопросов. С какого начнём?',
  private:'Не отправляйте сюда персональные данные, реквизиты или данные заказа. Опишите вопрос без них.',
  blocked:'Я могу помочь с товарами и опубликованными условиями магазина. Пришлите обычный вопрос без служебных инструкций.',
  external:'Для товара используйте ссылку с сайта этого магазина. Я не открываю сторонние адреса.',
  product:'Ссылку на товар получил. В этой локальной версии карточки ещё не подключены. Какую характеристику нужно проверить?',
  handoff:'Это нужно проверить с магазином. Оператор здесь не подключён, заявка не создана. Можно самостоятельно написать на',
  damaged:'Очень неприятно получить повреждённый товар. Сохраните упаковку и фотографии повреждения. Дальнейшие действия и компенсацию должен подтвердить магазин.',
  faulty:'Жаль, что с товаром возникла проблема. Опишите магазину модель и что именно не работает. Решение по ремонту, замене или компенсации подтверждает магазин.',
  fulfilment:'Это нужно сверить с магазином: какой товар или деталь ожидались и что было получено. Не присылайте сюда данные заказа.',
  unsafe:'Не используйте товар, если он искрит или есть другие признаки опасной неисправности. Обратитесь в магазин для проверки конкретной модели.',
  inventory:'Остатки и возможность получить товар к конкретной дате здесь не подключены. Их должен подтвердить магазин.',
  status:'У меня нет доступа к вашему заказу или оплате. Не присылайте номер заказа в демо.',
  returns:'Условия зависят от товара и обстоятельств. Решение о возврате или гарантии здесь подтвердить нельзя.',
  greeting:'Здравствуйте! 🙂 Помогу разобраться в опубликованных условиях магазина и уточнить вопрос о товаре.'},
 lv:{unknown:'To nevaru apstiprināt sagatavotajā informācijā. Lūdzu, precizējiet preci un jautājumu.',
  multi:'Te ir vairāki atšķirīgi jautājumi. Ar kuru sāksim?',
  private:'Nesūtiet šeit personas, maksājumu vai pasūtījuma datus. Aprakstiet jautājumu bez tiem.',
  blocked:'Varu palīdzēt ar precēm un publicētajiem veikala nosacījumiem. Atsūtiet parastu jautājumu bez sistēmas norādēm.',
  external:'Precei izmantojiet šī veikala saiti. Ārējas adreses neatveru.',
  product:'Preces saite saņemta. Šajā lokālajā versijā preču kartītes vēl nav pieslēgtas. Kuru īpašību vēlaties pārbaudīt?',
  handoff:'Tas jāpārbauda ar veikalu. Operators šeit nav pieslēgts, pieteikums nav izveidots. Varat paši rakstīt uz',
  damaged:'Žēl, ka prece saņemta bojāta. Saglabājiet iepakojumu un bojājuma fotogrāfijas. Tālākās darbības un kompensāciju apstiprina veikals.',
  faulty:'Žēl, ka precei radusies problēma. Aprakstiet veikalam modeli un kas tieši nedarbojas. Remontu, maiņu vai kompensāciju apstiprina veikals.',
  fulfilment:'Tas jāsalīdzina ar veikalu: kāda prece vai detaļa gaidīta un kas saņemts. Nesūtiet šeit pasūtījuma datus.',
  unsafe:'Nelietojiet preci, ja tā dzirksteļo vai redzamas citas bīstama bojājuma pazīmes. Sazinieties ar veikalu par konkrētā modeļa pārbaudi.',
  inventory:'Atlikumi un iespēja saņemt preci konkrētā datumā šeit nav pieslēgti. To apstiprina veikals.',
  status:'Man nav piekļuves jūsu pasūtījumam vai maksājumam. Nesūtiet pasūtījuma numuru demonstrācijā.',
  returns:'Nosacījumi atkarīgi no preces un apstākļiem. Atgriešanu vai garantiju šeit apstiprināt nevaru.',
  greeting:'Labdien! 🙂 Palīdzēšu ar publicētajiem veikala nosacījumiem un precizēt jautājumu par preci.'},
 en:{unknown:'I cannot confirm that from the prepared information. Please clarify the product and your question.',
  multi:'There are several different questions here. Which one shall we start with?',
  private:'Do not send personal, payment or order details here. Describe the question without them.',
  blocked:'I can help with products and published shop terms. Please send a normal question without system instructions.',
  external:'For a product, use a link from this shop. I do not open external addresses.',
  product:'I received the product link. Product pages are not connected in this local version yet. Which detail should we check?',
  handoff:'The shop needs to check this. No operator is connected here and no ticket was created. You can contact the shop yourself at',
  damaged:'I’m sorry the item arrived damaged. Keep the packaging and photographs of the damage. The shop must confirm the next steps and compensation.',
  faulty:'I’m sorry there is a problem with the item. Tell the shop the model and exactly what is not working. The shop must confirm repair, replacement or compensation.',
  fulfilment:'The shop needs to compare what you expected with what you received, including any missing part. Do not send order details here.',
  unsafe:'Do not use an item that sparks or shows other signs of a dangerous fault. Contact the shop to check the particular model.',
  inventory:'Inventory and availability for a particular date are not connected here. The shop must confirm them.',
  status:'I do not have access to your order or payment. Do not send your order number in this demo.',
  returns:'The terms depend on the item and circumstances. I cannot approve a return or warranty claim here.',
  greeting:'Hello! 🙂 I can help with published shop terms and clarify your product question.'}
};
const topics={
 delivery:/достав|пересыл|shipping|delivery|deliver\b|piegād|piegad|pakomāt|pakomat|omniva/i,
 carriers:/перевозчик|служб.*достав|carrier|kurjer.*veid|piegādes uzņēm|omniva|\bdpd\b|latvijas past/i,
 pickup:/самовывоз|забрат|получ.*магазин|адрес|pick.?up|collect|address|saņemt.*veikal|saņemšan|izņemt|adrese/i,
 payment:/оплат|платить|счёт|счет|payment|how.*pay|invoice|apmak|maksāt|maksat|rēķin/i,
 opening:/работа[ею]т|время.*работ|график|открыт|opening|hours|open on|darba laik|atvērts/i,
 returns:/возврат|вернут|return|refund|atgrie|atteikum/i,
 minimum:/минималь|minimum|минимум|minimāl|15.*pasūt/i,
 service:/сервис|ремонт|обслужив|repair|service|remont|apkop/i,
 care:/уход|обслужив.*час|care|seal check|hermēt|kopšan/i
};
const complaint=/поврежд|помят|брак|сломал|сломан|не работа[ею]т|разбит|протек|defect|damaged|broken|faulty|not working|bojāt|salūz|nedarbojas/i;
const human=/(?:^|[^\p{L}])(?:сотрудник|оператор|человек|менеджер|специалист|human\b|employee\b|operator\b|person\b|live agent\b|darbiniek|cilvēk|operator|konsultant)/iu;
const status=/где.*(?:заказ|посылк)|проверь.*(?:заказ|посылк)|оплатил|оплатила|where (?:is|are|was) (?:my|the) (?:order|parcel)|track my order|(?:already|have) paid|paid already|kur (?:ir|atrodas|palicis).*pasūtīj|jau samaks|esmu apmaksāj/i;
const sensitive=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+\d[\d ()-]{7,}|\b(?:\d[ -]?){13,19}\b|\b(?:sk-proj-|sk-live-)[\w-]+|(?:пароль|password|parole)\s*[:=]|(?:телефон|phone(?: number)?|tālrunis)\s*(?:is|ir)?\s*[:=]?\s*\d[\d ()-]{6,}|personas kods\s*[:=]?\s*\d{6}-?\d{5}|(?:номер заказа|order (?:number|id)|pasūtījuma numurs)\s*[:#№]?\s*[\p{L}\p{N}][\p{L}\p{N}-]{3,}/iu;
const injection=/ignore.*(?:instructions|rules)|system prompt|developer message|игнорируй.*(?:инструк|правил)|покажи.*(?:парол|ключ|промпт)|reveal.*(?:secret|password|key)|ignorē.*(?:noteikum|instrukc)/i;
const guarantee=/гарант|warrant|guarantee|garantij/i;
const stock=/в наличии|на складе|остат(?:ок|ки)|in stock|stock availability|pieejama noliktavā|noliktavā pieejam|vai.*noliktavā/i;
const wrongItem=/прислали.*друг|не тот товар|не хватает.*детал|missing (?:part|item)|wrong (?:item|product)|trūkst.*detaļ|nepareiz[āa].*prece/i;
const danger=/искрит|гарью|sparks|burning smell|dzirksteļ|deguma sm/i;
const parcelDamage=/поврежд|помят|разбит|протек|damaged|bojāt/i;
const cancellation=/отменить заказ|отмен[ау].*заказ|cancel (?:my |the )?order|atcelt pasūtījum/i;
export const normalizeText=text=>text.normalize('NFKC').replace(/\p{Cf}/gu,'').replace(/\s+/gu,' ').trim();
function matches(card,text){
 // Prefix boundaries prevent “нит” matching “фурнитура” and “auga” matching Daugavpils.
 return (topics[card.topic]?.test(text)??false)||card.patterns.some(s=>new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${s})`,'iu').test(text));
}
function safeURLs(text,profile){
 const urls=text.match(/(?:https?:\/\/|www\.|(?<!:)\/\/)[^\s<>]+/gi)||[];
 const allowed=new URL(profile.home).hostname.replace(/^www\./,'');
 let privateQuery=false;
 return {present:urls.length>0,valid:urls.every(raw=>{
  try{const clean=raw.replace(/[.,!?;]+$/u,'');const u=new URL(/^www\./i.test(clean)?'https://'+clean:clean);
   for(const [key,value] of [...u.searchParams,...new URLSearchParams(u.hash.slice(1))])if(value&&/^(?:token|access_token|api_key|key|password|secret|signature|email|phone|order_id|customer_id|auth)$/i.test(key))privateQuery=true;
   return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&u.hostname.replace(/^www\./,'')===allowed;}
  catch{return false;}
 }),get privateQuery(){return privateQuery;}};
}
export function preparedAnswer(profile,card,locale='ru'){
 if(!profile.cards.includes(card))throw new Error('Prepared card belongs to another draft');
 if(!['ru','lv','en'].includes(locale))locale='ru';
 const answer=card.kind==='handoff'?`${card.answer[locale]}\n\n${copy[locale].handoff} ${profile.contact}.`:card.answer[locale];
 return {shop:profile.id,locale,kind:card.kind,answer,cardId:card.id,sources:[...card.sources],providerUsed:false,ticketCreated:false};
}
export function reply(profile,text,previousLocale='ru'){
 if(!profile?.id||!Array.isArray(profile.cards))throw new Error('Unknown draft: no default tenant');
 if(typeof text!=='string'||text.length>1000)throw new Error('Message must be text, at most 1000 characters');
 text=normalizeText(text);
 // URL paths, IDs and email addresses are data, not evidence of a language switch.
 const languageText=text.replace(/(?:https?:\/\/|www\.|\/\/)[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'');
 const locale=detectLocale(languageText,previousLocale),t=copy[locale];
 const result=(kind,answer,card=null)=>({shop:profile.id,locale,kind,answer,cardId:card?.id??null,sources:[...(card?.sources??[])],providerUsed:false,ticketCreated:false});
 const handoff=(body,card=null)=>result('handoff',`${body}\n\n${t.handoff} ${profile.contact}.`,card);
 if(injection.test(text))return result('blocked',t.blocked);
 const urls=safeURLs(text,profile);
 if(/javascript:|data:|file:|<script|<iframe/i.test(text)||!urls.valid)return result('external-link',t.external);
 if(sensitive.test(text)||urls.privateQuery)return result('privacy',t.private);
 if(danger.test(text))return handoff(t.unsafe);
 if(wrongItem.test(text))return handoff(t.fulfilment);
 const complaintText=text.replace(/не (?:поврежд[её]н[аоы]?|сломан[аоы]?)|not (?:broken|damaged|faulty)|nav bojāt\p{L}*/giu,'');
 if(complaint.test(complaintText))return handoff(parcelDamage.test(complaintText)?t.damaged:t.faulty);
 const humanText=text.replace(/\bin person\b|не (?:нужен|нужна|надо) (?:оператор|сотрудник|человек)\p{L}*|no (?:human|operator|employee) (?:needed|required)|nevajag (?:operator|darbiniek)\p{L}*/giu,'');
 if(human.test(humanText))return handoff('');
 if(status.test(text))return handoff(t.status);
 if(cancellation.test(text))return handoff(t.status);
 // Preserve the merchant-specific branch-stock response where it is prepared.
 if(stock.test(text)){
  const card=profile.cards.find(c=>c.topic==='branch-stock'&&matches(c,text));
  return handoff(card?.answer[locale]??t.inventory,card);
 }
 const social=socialRoute(text.replace(/^вс[её] понятно[,!. ]+/iu,'понял ').replace(/^вс[её][,!. ]+/iu,''));
 if(social)return result('social',social.kind==='greeting'?t.greeting:socialText[locale][social.kind]);
 if(/^\s*(?:hi|hello|привет|здравствуйте|sveiki)\s*[!.🙂]*\s*$/iu.test(text))return result('social',t.greeting);
 if(!text.trim())return result('clarify',t.unknown);
 // Do not turn a customer-supplied product URL into a fabricated product lookup.
 if(urls.present)return result('product-pending',t.product);
 let found=profile.cards.filter(c=>matches(c,text));
 const policyKinds=['delivery','carriers','pickup','payment','opening','returns','minimum','service','care'];
 const askedPolicy=policyKinds.filter(topic=>topics[topic].test(text)&&(topic!=='carriers'||profile.cards.some(c=>c.topic==='carriers')));
 // A product noun in a delivery question is not automatically a second question.
 // An explicit carrier question is narrower than the generic delivery intent.
 if(askedPolicy.includes('carriers')&&profile.cards.some(c=>c.topic==='carriers')){
  found=found.filter(c=>c.topic!=='delivery');
  askedPolicy.splice(askedPolicy.indexOf('delivery'),askedPolicy.includes('delivery')?1:0);
 }
 const policy=found.filter(c=>policyKinds.includes(c.topic));
 const explicitProduct=/как(?:ой|ая|ие|ую|ое)|подойд|совмест|подобра|выбра|сколько (?:мот|метр)|which (?!carrier)|suitab|fit\b|what.*(?:choose|size)|how (?:many|much)|kuru|kāda (?!piegād)|cik (?:kamol|metr)|derēs|piemērot|и (?:когда|сколько)|un (?:kad|cik)|and (?:when|how)/iu.test(text);
 if(policy.length===1&&!explicitProduct)found=policy;
 if(guarantee.test(text)&&found.some(c=>policyKinds.includes(c.topic)))return result('clarify',t.multi);
 // A child/baby noun in a quantity question is not a separate allergy question.
 if(found.some(c=>c.topic==='quantity')&&!/аллерг|колет|itch|allerg|jutīg/iu.test(text))found=found.filter(c=>c.topic!=='sensitivity');
 const knownPolicy=new Set(found.filter(c=>policyKinds.includes(c.topic)).map(c=>c.topic));
 if(found.length&&askedPolicy.some(topic=>!knownPolicy.has(topic)))return result('clarify',t.multi);
 if(found.length>1)return result('clarify',t.multi);
 if(found.length===1){
  const card=found[0];
  return preparedAnswer(profile,card,locale);
 }
 if(topics.returns.test(text)||guarantee.test(text))return handoff(t.returns);
 return result('clarify',t.unknown);
}
