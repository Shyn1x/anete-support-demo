// Original demo styling inspired by public storefront palettes, checked 2026-10-15.
// No shop logos, remote fonts, trackers or official-service claims are used.
const profile=(avatar,headlines,kickers,leads,welcomes)=>({avatar,copy:Object.fromEntries(['ru','lv','en'].map((lang,i)=>[lang,{headline:headlines[i],eyebrow:kickers[i],lead:leads[i],welcome:welcomes[i]}]))});
export const brands=Object.freeze({
 rotallieta:profile('r.',
 ["Rotallieta.lv", "Rotallieta.lv", "Rotallieta.lv"],
 ["Чат поддержки", "Atbalsta čats", "Support chat"],
 ["Спросите о правилах магазина или пришлите ссылку на товар.", "Jautājiet par veikala noteikumiem vai atsūtiet saiti uz preci.", "Ask about shop policies or send a product link."],
 ['Здравствуйте! Помогу с правилами доставки, оплаты и возврата в Rotallieta.lv 🙂 Что хотите узнать? Это независимое демо; доступа к заказам нет.','Labdien! Palīdzēšu ar Rotallieta.lv piegādes, apmaksas un atgriešanas noteikumiem 🙂 Kas interesē? Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem.','Hello! I can help with Rotallieta.lv delivery, payment and return policies 🙂 What would you like to know? This is an independent demo without order access.']),
 bariba:profile('b.',
 ["Bariba.lv", "Bariba.lv", "Bariba.lv"],
 ["Чат поддержки", "Atbalsta čats", "Support chat"],
 ["Спросите о правилах магазина или пришлите ссылку на товар.", "Jautājiet par veikala noteikumiem vai atsūtiet saiti uz preci.", "Ask about shop policies or send a product link."],
 ['Здравствуйте! Подскажу правила Bariba.lv: доставку, оплату и возврат 🐾 Это независимое демо без доступа к заказам. Какой у вас вопрос?','Labdien! Palīdzēšu ar Bariba.lv piegādes, apmaksas un atgriešanas noteikumiem 🐾 Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem. Kāds ir jautājums?','Hello! Ask me about Bariba.lv delivery, payment or returns 🐾 This is an independent demo with no order access. How can I help?']),
 hobbyset:profile('h.',
 ["HobbySet", "HobbySet", "HobbySet"],
 ["Чат поддержки", "Atbalsta čats", "Support chat"],
 ["Спросите о правилах магазина или пришлите ссылку на товар.", "Jautājiet par veikala noteikumiem vai atsūtiet saiti uz preci.", "Ask about shop policies or send a product link."],
 ['Здравствуйте! Помогу разобраться в доставке, оплате и правилах HobbySet 🎨 Спорные условия предложу уточнить у магазина. Это независимое демо.','Labdien! Palīdzēšu saprast HobbySet piegādi, apmaksu un noteikumus 🎨 Neskaidrus nosacījumus ieteikšu precizēt veikalā. Šī ir neatkarīga demonstrācija.','Hello! I can help with HobbySet delivery, payment and shop policies 🎨 Unclear terms need confirmation from the shop. This is an independent demo.']),
 apavi40plus:profile('40+',
 ["Apavi 40 plus", "Apavi 40 plus", "Apavi 40 plus"],
 ["Чат поддержки", "Atbalsta čats", "Support chat"],
 ["Спросите о правилах магазина или пришлите ссылку на товар.", "Jautājiet par veikala noteikumiem vai atsūtiet saiti uz preci.", "Ask about shop policies or send a product link."],
 ['Здравствуйте! Расскажу о доставке, оплате, возврате и обмене размера в Apavi 40 plus. Чем помочь? Это независимое демо; наличие размеров не проверяю.','Labdien! Pastāstīšu par Apavi 40 plus piegādi, apmaksu, atgriešanu un izmēra maiņu. Kā palīdzēt? Šī ir neatkarīga demonstrācija; izmēru pieejamību nepārbaudu.','Hello! I can explain Apavi 40 plus delivery, payment, returns and size exchanges. How can I help? This is an independent demo; I cannot check size availability.']),
 celotajs:profile('c.',
 ["Veikals Ceļotājs", "Veikals Ceļotājs", "Veikals Ceļotājs"],
 ["Чат поддержки", "Atbalsta čats", "Support chat"],
 ["Спросите о правилах магазина или пришлите ссылку на товар.", "Jautājiet par veikala noteikumiem vai atsūtiet saiti uz preci.", "Ask about shop policies or send a product link."],
 ['Здравствуйте! Помогу с правилами доставки, самовывоза, возврата и гарантии Veikals Ceļotājs 🏕️ С чего начнём? Это независимое демо без доступа к заказам.','Labdien! Palīdzēšu ar Veikals Ceļotājs piegādes, saņemšanas, atgriešanas un garantijas noteikumiem 🏕️ Ar ko sāksim? Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem.','Hello! I can help with Veikals Ceļotājs delivery, collection, returns and warranty policies 🏕️ Where shall we start? This is an independent demo without order access.'])
});
export const getBrand=id=>Object.hasOwn(brands,id)?brands[id]:null;
export function applyBrand(root,id){const brand=getBrand(id);if(brand)root.documentElement.dataset.shop=id;else delete root.documentElement.dataset.shop;return brand;}
