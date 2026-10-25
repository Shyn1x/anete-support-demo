import {prospectTenants} from './prospects.js';
import {pilotTenants} from './pilots.js';
// Public policy summaries checked 2026-10-15. These are not a legal assessment.
export const sources = {
 delivery: {title:'Piegāde',url:'https://anete.lv/piegades-informacija/6/1/i'},
 payment: {title:'Maksājuma veidi',url:'https://anete.lv/maksajuma-veidi/13/1/i'},
 returns: {title:'Preču atgriešana',url:'https://anete.lv/precu-atgriesana/17/1/i'},
 terms: {title:'Pirkuma noteikumi',url:'https://anete.lv/noteikumi-un-nosacijumi/3/1/i'},
 warranty: {title:'Garantija',url:'https://anete.lv/garantija/7/1/i'},
 faq: {title:'BUJ',url:'https://anete.lv/buj-biezak-uzdotie-jautajumi/16/1/i'},
 contact: {title:'Kontakti',url:'https://anete.lv/kontakti'},
 order: {title:'Kā iepirkties?',url:'https://anete.lv/ka-iepirkties/5/1/i'}
};
const english={
 delivery:'Courier delivery, collection in Riga and Omniva/DPD parcel lockers are listed. Parcel lockers require prepayment; available methods depend on the size of the item.',
 timing:'The shop emails the confirmed delivery estimate after processing the order, together with the invoice. The estimate on a product page is provisional.',
 'shipping-cost':'I cannot confirm a single shipping price. Oversized items and international delivery require an individual quote from the shop.',
 'locker-size':'Listed parcel locker limits: Omniva 39×39×64 cm, DPD 36×43×61 cm; weight up to 30 kg.',
 unclaimed:'The delivery page states a 7-day parcel locker storage period. Additional return and resending fees may apply. An employee must confirm the amount for a specific case.',
 stairs:'Standard courier delivery is to the outside door of the building. The page mentions carrying items upstairs for an extra charge, but availability must be confirmed.',
 payment:'Listed payment methods include bank transfer, card payment through Stripe and ESTO instalments. Availability is checked during checkout.',
 invoice:'The invoice must be paid within 2 working days; an unpaid order may be cancelled. Dispatch takes place after payment is received.',
 cash:'Payment on receipt is available only for eligible items in the Riga warehouse. The page lists a €3 courier cash-on-delivery fee in Latvia. I cannot confirm eligibility for a particular order.',
 'payment-problem':'I cannot see payments, confirm a charge or issue a refund. Please contact the shop about payment issues. Do not enter card details here.',
 return:'For consumer distance purchases, the terms state a 14-day withdrawal period from delivery. Some categories have exceptions; an employee must review disputed cases.',
 'return-process':'The returns page explains the withdrawal process. Goods should be sent or handed back within 14 days after the withdrawal notice. Buyers generally pay direct return costs, subject to the exceptions listed on the page.',
 refund:'The site states that payments are refunded within 14 days of receiving a withdrawal notice. The shop may wait for the goods or proof of dispatch. I cannot see the date of an individual refund.',
 opened:'Inspecting an item differs from using it extensively. The site describes a possible reduction in value if use exceeds what is necessary for inspection. I cannot independently reject a return.',
 warranty:'The manufacturer warranty period depends on the product and is listed in its description. The page separately mentions consumer claims for non-conformity within two years. These are different grounds for a claim.',
 defect:'For a faulty item, contact the shop or the service centre specified by the manufacturer. Prepare proof of purchase and the warranty card, if one was supplied. An employee must assess coverage.',
 'business-warranty':'The FAQ and warranty pages describe business purchases differently. I cannot confirm one universal warranty period; the product terms and confirmation from the shop are needed.',
 pickup:'You cannot simply buy an item on the spot: place an order first and wait for a message confirming that it is ready for collection.',
 hours:'Support hours: Monday–Friday, 09:00–17:00. Collection hours differ across pages; confirm before travelling. Address: Aleksandra Čaka iela 81, Riga.',
 contact:'Public shop contacts: info@anete.lv, +371 2001 3727. This demo does not automatically send a message to the shop.',
 order:'Choose an item, add it to your basket, select delivery and payment, then confirm the order. Confirmation is sent by email.',
 status:'This demo is not connected to shop orders. I cannot check an order, change an address, cancel a purchase or award compensation. An employee must handle these requests.'
};
const c=(id,topic,source,ru,lv)=>({id,topic,source,ru,lv,en:english[id]});
export const cards = [
 c('delivery','delivery','delivery','Доступны курьер, самовывоз в Риге и пакоматы Omniva/DPD. Пакоматы требуют предоплаты; способ зависит от размера товара.','Pieejams kurjers, saņemšana Rīgā un Omniva/DPD pakomāti. Pakomātiem vajadzīga priekšapmaksa; veids atkarīgs no preces izmēra.'),
 c('timing','delivery','faq','Точную дату магазин сообщает после обработки заказа по электронной почте вместе со счётом. Срок в карточке товара предварительный.','Precīzu termiņu veikals paziņo pēc pasūtījuma apstrādes e-pastā kopā ar rēķinu. Preces lapā termiņš ir provizorisks.'),
 c('shipping-cost','delivery','delivery','Единую цену доставки подтвердить нельзя. Для крупногабаритных товаров и доставки за границу условия уточняются индивидуально.','Vienotu piegādes cenu nevar apstiprināt. Lielgabarīta precēm un piegādei ārvalstīs nosacījumus precizē individuāli.'),
 c('locker-size','delivery','delivery','Лимиты пакомата: Omniva 39×39×64 см, DPD 36×43×61 см; вес до 30 кг.','Pakomātu ierobežojumi: Omniva 39×39×64 cm, DPD 36×43×61 cm; svars līdz 30 kg.'),
 c('unclaimed','delivery','delivery','На странице доставки указан срок хранения в пакомате 7 дней; возможны дополнительные сборы за возврат и повторную отправку. Сумму конкретного случая уточняет сотрудник.','Piegādes lapā norādītas 7 glabāšanas dienas pakomātā; iespējamas papildu maksas par atgriešanu un atkārtotu nosūtīšanu. Konkrēto summu precizē darbinieks.'),
 c('stairs','delivery','delivery','Обычная курьерская доставка — до наружной двери здания. На странице упомянут подъём за доплату, но доступность нужно подтвердить.','Parasta kurjerpiegāde ir līdz ēkas ārdurvīm. Lapā minēta uznešana par piemaksu, taču pieejamība jāapstiprina.'),
 c('payment','payment','payment','Указаны банковский перевод, карта через Stripe и рассрочка ESTO. Доступность способов проверяется при оформлении.','Norādīts bankas pārskaitījums, karte ar Stripe un ESTO nomaksa. Metožu pieejamību pārbauda noformējot pasūtījumu.'),
 c('invoice','payment','payment','Счёт нужно оплатить в течение 2 рабочих дней; неоплаченный заказ может быть отменён. Отправка — после поступления оплаты.','Rēķins jāapmaksā 2 darba dienās; neapmaksātu pasūtījumu var atcelt. Nosūtīšana notiek pēc maksājuma saņemšanas.'),
 c('cash','payment','payment','Оплата при получении доступна лишь для подходящих товаров рижского склада. Для курьера в Латвии указана доплата 3 €. Не обещаю доступность для конкретного заказа.','Samaksa saņemot pieejama tikai atbilstošām Rīgas noliktavas precēm. Kurjeram Latvijā norādīta 3 € piemaksa. Konkrētam pasūtījumam pieejamību neapsolu.'),
 c('payment-problem','payment','contact','Я не вижу платежи и не могу подтвердить списание или вернуть деньги. С вопросом оплаты нужно обратиться в магазин. Не вводите здесь реквизиты карты.','Es neredzu maksājumus un nevaru apstiprināt naudas ieturēšanu vai veikt atmaksu. Par maksājumu jāsazinās ar veikalu. Šeit neievadiet kartes datus.'),
 c('return','returns','terms','Для потребительской дистанционной покупки указано право отказа в течение 14 дней с доставки. Для отдельных категорий есть исключения; спорный случай должен проверить сотрудник.','Patērētāja distances pirkumam norādītas atteikuma tiesības 14 dienās no piegādes. Dažām kategorijām ir izņēmumi; strīdīgu gadījumu pārbauda darbinieks.'),
 c('return-process','returns','returns','На странице возвратов есть порядок отказа. После уведомления товар отправляют или передают продавцу в течение 14 дней. Прямые расходы возврата обычно несёт покупатель, с указанными на сайте исключениями.','Atgriešanas lapā ir atteikuma kārtība. Pēc paziņojuma preci nosūta vai nodod pārdevējam 14 dienās. Tiešās atgriešanas izmaksas parasti sedz pircējs, ievērojot lapā minētos izņēmumus.'),
 c('refund','returns','returns','На сайте указан возврат платежей в течение 14 дней после получения уведомления об отказе. Магазин может дождаться товара или доказательства отправки. Дату конкретного возврата я не вижу.','Vietnē norādīta maksājumu atmaksa 14 dienās pēc atteikuma paziņojuma saņemšanas. Veikals var sagaidīt preci vai nosūtīšanas apliecinājumu. Konkrētas atmaksas datumu neredzu.'),
 c('opened','returns','returns','Проверка товара и полноценное использование различаются: на сайте говорится о возможном уменьшении стоимости при использовании сверх необходимой проверки. Самостоятельно отказать в возврате я не могу.','Preces pārbaude atšķiras no pilnvērtīgas lietošanas: vietnē minēta vērtības samazināšanās, ja lietošana pārsniedz nepieciešamo pārbaudi. Es nevaru patstāvīgi atteikt atgriešanu.'),
 c('warranty','warranty','warranty','Срок гарантии производителя зависит от товара и указан в описании. На странице отдельно упомянуты права потребителя на претензию о несоответствии в течение двух лет. Это разные основания обращения.','Ražotāja garantijas termiņš atkarīgs no preces un norādīts aprakstā. Lapā atsevišķi minētas patērētāja tiesības divos gados pieteikt prasījumu par neatbilstību. Tie ir atšķirīgi pamati.'),
 c('defect','warranty','warranty','По неисправности можно обратиться в магазин или указанный производителем сервис. Подготовьте документ о покупке и гарантийный талон, если он выдавался. Покрытие случая оценивает сотрудник.','Par bojājumu var vērsties veikalā vai ražotāja norādītajā servisā. Sagatavojiet pirkuma dokumentu un garantijas talonu, ja tas izsniegts. Gadījuma segumu izvērtē darbinieks.'),
 c('business-warranty','warranty','warranty','Для покупки на компанию страницы FAQ и гарантии сформулированы по-разному. Универсальный срок не подтверждаю: нужны условия конкретного товара и ответ магазина.','Uzņēmuma pirkumam BUJ un garantijas lapas nosacījumi formulēti atšķirīgi. Universālu termiņu neapstiprinu: vajadzīgi konkrētās preces nosacījumi un veikala atbilde.'),
 c('pickup','order','faq','Купить товар сразу на месте нельзя: сначала оформите заказ и дождитесь сообщения о готовности.','Preci uzreiz uz vietas nopirkt nevar: vispirms noformējiet pasūtījumu un sagaidiet paziņojumu par gatavību.'),
 c('hours','contact','contact','Поддержка: пн–пт 09:00–17:00. На страницах выдачи указаны разные часы; перед поездкой уточните время. Адрес: Aleksandra Čaka iela 81, Rīga.','Atbalsts: P.–Pk. 09:00–17:00. Saņemšanas laiki lapās atšķiras; pirms brauciena precizējiet laiku. Adrese: Aleksandra Čaka iela 81, Rīga.'),
 c('contact','contact','contact','Контакты магазина: info@anete.lv, +371 2001 3727. Это публичные контакты; сообщение из демо автоматически не отправляется.','Veikala kontakti: info@anete.lv, +371 2001 3727. Tie ir publiski kontakti; no demonstrācijas ziņa automātiski netiek sūtīta.'),
 c('order','order','order','Выберите товар, добавьте в корзину, укажите доставку и оплату, подтвердите заказ. Подтверждение приходит по электронной почте.','Izvēlieties preci, pievienojiet grozam, norādiet piegādi un apmaksu, apstipriniet pasūtījumu. Apstiprinājums pienāk e-pastā.'),
 c('status','order','contact','Демо не подключено к заказам магазина. Я не могу проверить статус, изменить адрес, отменить заказ или назначить компенсацию. Это нужно решить с сотрудником.','Demonstrācija nav savienota ar veikala pasūtījumiem. Nevaru pārbaudīt statusu, mainīt adresi, atcelt pasūtījumu vai piešķirt kompensāciju. Tas jārisina ar darbinieku.')
];
export const tenants = Object.freeze({...prospectTenants,anete:{id:'anete',name:'Anete.lv',checked:'2026-10-15',contact:{email:'info@anete.lv',phone:'+37120013727',hours:{ru:'Пн–пт 09:00–17:00 (Латвия)',lv:'P.–Pk. 09:00–17:00 (Latvija)',en:'Mon–Fri 09:00–17:00 (Latvia)'},source:'https://anete.lv/kontakti'},cards,sources}});
export const getTenant=id=>Object.hasOwn(tenants,id)?tenants[id]:Object.hasOwn(pilotTenants,id)?pilotTenants[id]:null;
