// Original demo styling inspired by public storefront palettes, checked 2026-10-15.
// No shop logos, remote fonts, trackers or official-service claims are used.
const profile=(avatar,headlines,kickers,leads,welcomes)=>({avatar,copy:Object.fromEntries(['ru','lv','en'].map((lang,i)=>[lang,{headline:headlines[i],eyebrow:kickers[i],lead:leads[i],welcome:welcomes[i]}]))});
export const brands=Object.freeze({
 rotallieta:profile('r.',
 ['Меньше вопросов.\nБольше радости.','Mazāk jautājumu.\nVairāk prieka.','Fewer questions.\nMore joy.'],
 ['ПОМОЩЬ С ПОКУПКОЙ ИГРУШЕК','PALĪDZĪBA ROTAĻLIETU PIRKUMIEM','HELP WITH TOY SHOPPING'],
 ['Помощник по правилам Rotallieta.lv: доставка, оплата и возврат игрушек. Ответы на трёх языках с источниками.','Palīgs par Rotallieta.lv noteikumiem: rotaļlietu piegāde, apmaksa un atgriešana. Atbildes trīs valodās ar avotiem.','A guide to Rotallieta.lv policies: toy delivery, payment and returns. Three languages, with sources.'],
 ['Здравствуйте! Помогу с правилами доставки, оплаты и возврата в Rotallieta.lv 🙂 Что хотите узнать? Это независимое демо; доступа к заказам нет.','Labdien! Palīdzēšu ar Rotallieta.lv piegādes, apmaksas un atgriešanas noteikumiem 🙂 Kas interesē? Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem.','Hello! I can help with Rotallieta.lv delivery, payment and return policies 🙂 What would you like to know? This is an independent demo without order access.']),
 bariba:profile('b.',
 ['Забота начинается\nс понятного ответа.','Rūpes sākas\nar skaidru atbildi.','Care starts\nwith a clear answer.'],
 ['ПОМОЩНИК ПО ПРАВИЛАМ ЗООМАГАЗИНА','PALĪGS ZOOVEIKALA NOTEIKUMOS','PET SHOP POLICY ASSISTANT'],
 ['Доставка, оплата и возвраты в Bariba.lv — в одном чате. Проверенные правила магазина на LV, RU и EN.','Bariba.lv piegāde, apmaksa un atgriešana vienā čatā. Pārbaudīti veikala noteikumi LV, RU un EN.','Bariba.lv delivery, payment and returns in one chat. Verified shop policies in LV, RU and EN.'],
 ['Здравствуйте! Подскажу правила Bariba.lv: доставку, оплату и возврат 🐾 Это независимое демо без доступа к заказам. Какой у вас вопрос?','Labdien! Palīdzēšu ar Bariba.lv piegādes, apmaksas un atgriešanas noteikumiem 🐾 Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem. Kāds ir jautājums?','Hello! Ask me about Bariba.lv delivery, payment or returns 🐾 This is an independent demo with no order access. How can I help?']),
 hobbyset:profile('h.',
 ['Больше творчества.\nМеньше вопросов.','Vairāk radošuma.\nMazāk jautājumu.','More creativity.\nFewer questions.'],
 ['ПОМОЩЬ С ПОКУПКАМИ ДЛЯ ТВОРЧЕСТВА','PALĪDZĪBA RADOŠIEM PIRKUMIEM','HELP WITH CREATIVE SHOPPING'],
 ['Помощник по публичным правилам HobbySet. Доставка, способы оплаты и понятный следующий шаг для сложных вопросов.','Palīgs par HobbySet publiskajiem noteikumiem. Piegāde, apmaksas veidi un skaidrs nākamais solis sarežģītos jautājumos.','A guide to HobbySet’s public policies. Delivery, payment options and a clear next step for complex questions.'],
 ['Здравствуйте! Помогу разобраться в доставке, оплате и правилах HobbySet 🎨 Спорные условия предложу уточнить у магазина. Это независимое демо.','Labdien! Palīdzēšu saprast HobbySet piegādi, apmaksu un noteikumus 🎨 Neskaidrus nosacījumus ieteikšu precizēt veikalā. Šī ir neatkarīga demonstrācija.','Hello! I can help with HobbySet delivery, payment and shop policies 🎨 Unclear terms need confirmation from the shop. This is an independent demo.']),
 apavi40plus:profile('40+',
 ['Подходящий ответ.\nБез лишних шагов.','Piemērota atbilde.\nBez liekiem soļiem.','The right answer.\nFewer steps.'],
 ['ПОМОЩНИК ПО ПОКУПКЕ ОБУВИ','PALĪGS APAVU PIRKUMIEM','FOOTWEAR SHOPPING ASSISTANT'],
 ['Правила Apavi 40 plus: доставка, оплата, возврат и обмен размера. Три языка и ссылки на страницы магазина.','Apavi 40 plus noteikumi: piegāde, apmaksa, atgriešana un izmēra maiņa. Trīs valodas un saites uz veikala lapām.','Apavi 40 plus policies: delivery, payment, returns and size exchanges. Three languages and links to shop sources.'],
 ['Здравствуйте! Расскажу о доставке, оплате, возврате и обмене размера в Apavi 40 plus. Чем помочь? Это независимое демо; наличие размеров не проверяю.','Labdien! Pastāstīšu par Apavi 40 plus piegādi, apmaksu, atgriešanu un izmēra maiņu. Kā palīdzēt? Šī ir neatkarīga demonstrācija; izmēru pieejamību nepārbaudu.','Hello! I can explain Apavi 40 plus delivery, payment, returns and size exchanges. How can I help? This is an independent demo; I cannot check size availability.']),
 celotajs:profile('c.',
 ['Разберёмся —\nи можно в путь.','Noskaidrosim —\nun var doties ceļā.','Get answers.\nThen get outdoors.'],
 ['ПОМОЩЬ С ПОКУПКАМИ ДЛЯ ПОХОДОВ','PALĪDZĪBA PĀRGĀJIENU PIRKUMIEM','HELP WITH OUTDOOR SHOPPING'],
 ['Помощник по правилам Veikals Ceļotājs. Доставка, самовывоз, возвраты и гарантия — с проверенными источниками.','Palīgs par Veikals Ceļotājs noteikumiem. Piegāde, saņemšana, atgriešana un garantija ar pārbaudītiem avotiem.','A guide to Veikals Ceļotājs policies. Delivery, collection, returns and warranty, with verified sources.'],
 ['Здравствуйте! Помогу с правилами доставки, самовывоза, возврата и гарантии Veikals Ceļotājs 🏕️ С чего начнём? Это независимое демо без доступа к заказам.','Labdien! Palīdzēšu ar Veikals Ceļotājs piegādes, saņemšanas, atgriešanas un garantijas noteikumiem 🏕️ Ar ko sāksim? Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem.','Hello! I can help with Veikals Ceļotājs delivery, collection, returns and warranty policies 🏕️ Where shall we start? This is an independent demo without order access.'])
});
export const getBrand=id=>Object.hasOwn(brands,id)?brands[id]:null;
export function applyBrand(root,id){const brand=getBrand(id);if(brand)root.documentElement.dataset.shop=id;else delete root.documentElement.dataset.shop;return brand;}
