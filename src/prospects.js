import {nicheKnowledge} from './niche-data.js';
// Independently checked public store pages, 2026-10-15. Unofficial demonstrations.
export const prospectTenants = {
  "rotallieta": {
    "id": "rotallieta",
    "name": "Rotallieta.lv",
    "homepage": "https://rotallieta.lv/",
    "checked": "2026-10-15",
    "contact": {
      "email": "info@rotallieta.lv",
      "phone": "+37124824808",
      "hours": {
        "ru": "Пн–пт 09:00–19:00",
        "lv": "P.–Pk. 09:00–19:00",
        "en": "Mon–Fri 09:00–19:00"
      },
      "source": "https://rotallieta.lv/"
    },
    "sources": {
      "contact": {
        "title": "Kontakti",
        "url": "https://rotallieta.lv/"
      },
      "delivery": {
        "title": "Piegāde",
        "url": "https://rotallieta.lv/piegade-un-apmaksa/"
      },
      "terms": {
        "title": "Noteikumi",
        "url": "https://rotallieta.lv/noteikumi/"
      }
    },
    "cards": [
      {
        "id": "delivery",
        "topic": "delivery",
        "source": "delivery",
        "ru": "В Латвии указана бесплатная доставка в пункты DPD, Latvijas Pasts и Venipak; курьер DPD — 3,99 €.",
        "lv": "Latvijā norādīta bezmaksas piegāde DPD, Latvijas Pasts un Venipak punktos; DPD kurjers — 3,99 €.",
        "en": "In Latvia, DPD, Latvijas Pasts and Venipak collection points are listed as free; DPD courier costs €3.99.",
        "requiresReview": false
      },
      {
        "id": "timing",
        "topic": "timing",
        "source": "delivery",
        "ru": "Указанный срок: Латвия 1–3 рабочих дня; Литва и Эстония 3–5 рабочих дней. Это не подтверждение даты конкретного заказа.",
        "lv": "Norādīts: Latvijā 1–3 darba dienas, Lietuvā un Igaunijā 3–5 darba dienas. Konkrēta pasūtījuma datumu neapstiprinu.",
        "en": "Listed estimates: Latvia 1–3 working days; Lithuania and Estonia 3–5 working days. This does not confirm an individual order date.",
        "requiresReview": false
      },
      {
        "id": "shipping-cost",
        "topic": "shipping-cost",
        "source": "delivery",
        "ru": "Для Литвы и Эстонии указаны DPD-пакомат 3,99 € и курьер 5,99 €. Иные направления уточните у магазина.",
        "lv": "Lietuvai un Igaunijai norādīts DPD pakomāts 3,99 € un kurjers 5,99 €. Citus galamērķus precizējiet veikalā.",
        "en": "For Lithuania and Estonia: DPD locker €3.99 or courier €5.99. Ask the shop about other destinations.",
        "requiresReview": false
      },
      {
        "id": "payment",
        "topic": "payment",
        "source": "terms",
        "ru": "Указаны банковский перевод и оплата картой или наличными при получении на складе/в магазине.",
        "lv": "Norādīts bankas pārskaitījums un karte vai skaidra nauda, saņemot noliktavā/veikalā.",
        "en": "Listed methods: bank transfer, and card or cash when collecting at the warehouse/shop.",
        "requiresReview": false
      },
      {
        "id": "return",
        "topic": "return",
        "source": "terms",
        "ru": "Для отказа направьте форму на info@rotallieta.lv. Товар возвращают в течение 14 дней после уведомления; применимость условий уточняет магазин.",
        "lv": "Atteikuma veidlapu sūtiet uz info@rotallieta.lv. Preci atdod 14 dienās pēc paziņojuma; piemērošanu precizē veikals.",
        "en": "Send the withdrawal form to info@rotallieta.lv. Return goods within 14 days after notice; confirm applicability with the shop.",
        "requiresReview": false
      },
      {
        "id": "warranty",
        "topic": "warranty",
        "source": "terms",
        "ru": "Для гарантийного обращения требуется подтверждение покупки. Единого срока для всех товаров в проверенных условиях не найдено; уточните для своего товара.",
        "lv": "Garantijas pieteikumam vajadzīgs pirkuma apliecinājums. Pārbaudītajos noteikumos vienots termiņš visām precēm nav atrasts; precizējiet konkrētai precei.",
        "en": "Warranty claims require proof of purchase. No universal period was found in the checked terms; ask about the specific product.",
        "requiresReview": true
      },
      {
        "id": "pickup",
        "topic": "pickup",
        "source": "contact",
        "ru": "На сайте указан склад: A. Deglava 166a, Рига. Перед поездкой подтвердите готовность заказа.",
        "lv": "Vietnē norādīta noliktava: A. Deglava 166a, Rīga. Pirms brauciena apstipriniet pasūtījuma gatavību.",
        "en": "The site lists a warehouse at A. Deglava 166a, Riga. Confirm that your order is ready before travelling.",
        "requiresReview": false
      },
      {
        "id": "contact",
        "topic": "contact",
        "source": "contact",
        "ru": "Контакты Rotallieta.lv: info@rotallieta.lv, +37124824808. Демо сообщения не отправляет.",
        "lv": "Rotallieta.lv kontakti: info@rotallieta.lv, +37124824808. Demonstrācija ziņas nesūta.",
        "en": "Rotallieta.lv contacts: info@rotallieta.lv, +37124824808. The demo sends no messages.",
        "requiresReview": true
      },
      {
        "id": "hours",
        "topic": "hours",
        "source": "contact",
        "ru": "Пн–пт 09:00–19:00 (Латвия).",
        "lv": "P.–Pk. 09:00–19:00 (Latvija).",
        "en": "Mon–Fri 09:00–19:00 (Latvia).",
        "requiresReview": false
      },
      {
        "id": "status",
        "topic": "status",
        "source": "contact",
        "ru": "Демо не подключено к заказам. Статус, отмену, изменение заказа или компенсацию нужно обсудить с магазином.",
        "lv": "Demonstrācija nav savienota ar pasūtījumiem. Statusu, atcelšanu, izmaiņas vai kompensāciju apspriediet ar veikalu.",
        "en": "The demo has no order access. Discuss status, cancellation, changes or compensation with the shop.",
        "requiresReview": true
      },
      {
        "id": "payment-problem",
        "topic": "payment-problem",
        "source": "contact",
        "ru": "Демо не видит платежи и не возвращает деньги. Не вводите реквизиты; обратитесь в магазин.",
        "lv": "Demonstrācija neredz maksājumus un neatmaksā naudu. Neievadiet rekvizītus; sazinieties ar veikalu.",
        "en": "The demo cannot see payments or issue refunds. Do not enter payment details; contact the shop.",
        "requiresReview": true
      },
      {
        "id": "defect",
        "topic": "defect",
        "source": "contact",
        "ru": "Неисправность или повреждение нужно обсудить с магазином. Демо не решает, покрывается ли случай гарантией.",
        "lv": "Par defektu vai bojājumu sazinieties ar veikalu. Demonstrācija neizlemj, vai gadījumu sedz garantija.",
        "en": "Contact the shop about a defect or damage. The demo cannot decide warranty coverage.",
        "requiresReview": true
      },
      {
        "id": "return-process",
        "topic": "return",
        "source": "terms",
        "ru": "Для отказа направьте форму на info@rotallieta.lv. Товар возвращают в течение 14 дней после уведомления; применимость условий уточняет магазин.",
        "lv": "Atteikuma veidlapu sūtiet uz info@rotallieta.lv. Preci atdod 14 dienās pēc paziņojuma; piemērošanu precizē veikals.",
        "en": "Send the withdrawal form to info@rotallieta.lv. Return goods within 14 days after notice; confirm applicability with the shop.",
        "requiresReview": false
      }
    ]
  },
  "bariba": {
    "id": "bariba",
    "name": "Bariba.lv",
    "homepage": "https://www.bariba.lv/",
    "checked": "2026-10-15",
    "contact": {
      "email": "veikals@bariba.lv",
      "phone": "+37167134777",
      "hours": {
        "ru": "Пн–пт 08:00–16:00",
        "lv": "P.–Pk. 08:00–16:00",
        "en": "Mon–Fri 08:00–16:00"
      },
      "source": "https://www.bariba.lv/"
    },
    "sources": {
      "contact": {
        "title": "Kontakti",
        "url": "https://www.bariba.lv/"
      },
      "delivery": {
        "title": "Piegāde",
        "url": "https://www.bariba.lv/precu-piegade-riga-un-latvija.html"
      },
      "payment": {
        "title": "Apmaksa",
        "url": "https://www.bariba.lv/pasutijums-un-maksajums.html"
      },
      "terms": {
        "title": "Noteikumi",
        "url": "https://www.bariba.lv/lietosanas-noteikumiem-un-privatuma-politikai.html"
      }
    },
    "cards": [
      {
        "id": "delivery",
        "topic": "delivery",
        "source": "delivery",
        "ru": "Бесплатная доставка заказов свыше 30 € указана для городов маршрута магазина. Другие города — по согласованию; это не бесплатная доставка по всей Латвии.",
        "lv": "Bezmaksas piegāde virs 30 € norādīta veikala maršruta pilsētām. Citās pilsētās — pēc vienošanās; ne visā Latvijā bez maksas.",
        "en": "Free delivery above €30 is listed for towns on the shop’s route. Other towns require agreement; this is not nationwide free delivery.",
        "requiresReview": false
      },
      {
        "id": "timing",
        "topic": "timing",
        "source": "delivery",
        "ru": "Доставка в рабочие дни 10:00–17:00, по маршруту города; общий срок до 6 рабочих дней, если у товара не указано иное.",
        "lv": "Piegāde darba dienās 10:00–17:00 atbilstoši pilsētas maršrutam; līdz 6 darba dienām, ja precei nav norādīts citādi.",
        "en": "Delivery runs on working days 10:00–17:00 according to the town’s route; up to 6 working days unless the product states otherwise.",
        "requiresReview": false
      },
      {
        "id": "pickup",
        "topic": "pickup",
        "source": "delivery",
        "ru": "Бесплатный самовывоз: Granīta 26, Rumbula. Дождитесь письма о готовности.",
        "lv": "Bezmaksas saņemšana: Granīta 26, Rumbula. Sagaidiet e-pastu par gatavību.",
        "en": "Free collection: Granīta 26, Rumbula. Wait for the ready-for-collection email.",
        "requiresReview": false
      },
      {
        "id": "payment",
        "topic": "payment",
        "source": "payment",
        "ru": "Для онлайн-оплаты указаны Visa и Mastercard. Сборка заказа начинается после подтверждения оплаты.",
        "lv": "Tiešsaistes apmaksai norādītas Visa un Mastercard. Komplektēšana sākas pēc maksājuma apstiprinājuma.",
        "en": "Visa and Mastercard are listed for online payment. Packing starts after payment confirmation.",
        "requiresReview": false
      },
      {
        "id": "return",
        "topic": "return",
        "source": "terms",
        "ru": "В условиях указаны 14 календарных дней для отказа. Запросите форму и свяжитесь с магазином; расходы возврата несёт покупатель.",
        "lv": "Noteikumos norādītas 14 kalendāra dienas atteikumam. Pieprasiet veidlapu un sazinieties ar veikalu; atgriešanas izmaksas sedz pircējs.",
        "en": "The terms list 14 calendar days for withdrawal. Request the form and contact the shop; the buyer pays return costs.",
        "requiresReview": false
      },
      {
        "id": "warranty",
        "topic": "warranty",
        "source": "terms",
        "ru": "Единый гарантийный срок для всех товаров не подтверждён. Вопрос качества конкретного товара нужно уточнить у магазина.",
        "lv": "Vienots garantijas termiņš visām precēm nav apstiprināts. Konkrētas preces kvalitātes jautājums jāprecizē veikalā.",
        "en": "A universal warranty period is not confirmed. Ask the shop to assess the specific product quality issue.",
        "requiresReview": true
      },
      {
        "id": "contact",
        "topic": "contact",
        "source": "contact",
        "ru": "Контакты Bariba.lv: veikals@bariba.lv, +37167134777. Демо сообщения не отправляет.",
        "lv": "Bariba.lv kontakti: veikals@bariba.lv, +37167134777. Demonstrācija ziņas nesūta.",
        "en": "Bariba.lv contacts: veikals@bariba.lv, +37167134777. The demo sends no messages.",
        "requiresReview": true
      },
      {
        "id": "hours",
        "topic": "hours",
        "source": "contact",
        "ru": "Пн–пт 08:00–16:00 (Латвия).",
        "lv": "P.–Pk. 08:00–16:00 (Latvija).",
        "en": "Mon–Fri 08:00–16:00 (Latvia).",
        "requiresReview": false
      },
      {
        "id": "status",
        "topic": "status",
        "source": "contact",
        "ru": "Демо не подключено к заказам. Статус, отмену, изменение заказа или компенсацию нужно обсудить с магазином.",
        "lv": "Demonstrācija nav savienota ar pasūtījumiem. Statusu, atcelšanu, izmaiņas vai kompensāciju apspriediet ar veikalu.",
        "en": "The demo has no order access. Discuss status, cancellation, changes or compensation with the shop.",
        "requiresReview": true
      },
      {
        "id": "payment-problem",
        "topic": "payment-problem",
        "source": "contact",
        "ru": "Демо не видит платежи и не возвращает деньги. Не вводите реквизиты; обратитесь в магазин.",
        "lv": "Demonstrācija neredz maksājumus un neatmaksā naudu. Neievadiet rekvizītus; sazinieties ar veikalu.",
        "en": "The demo cannot see payments or issue refunds. Do not enter payment details; contact the shop.",
        "requiresReview": true
      },
      {
        "id": "defect",
        "topic": "defect",
        "source": "contact",
        "ru": "Неисправность или повреждение нужно обсудить с магазином. Демо не решает, покрывается ли случай гарантией.",
        "lv": "Par defektu vai bojājumu sazinieties ar veikalu. Demonstrācija neizlemj, vai gadījumu sedz garantija.",
        "en": "Contact the shop about a defect or damage. The demo cannot decide warranty coverage.",
        "requiresReview": true
      },
      {
        "id": "return-process",
        "topic": "return",
        "source": "terms",
        "ru": "В условиях указаны 14 календарных дней для отказа. Запросите форму и свяжитесь с магазином; расходы возврата несёт покупатель.",
        "lv": "Noteikumos norādītas 14 kalendāra dienas atteikumam. Pieprasiet veidlapu un sazinieties ar veikalu; atgriešanas izmaksas sedz pircējs.",
        "en": "The terms list 14 calendar days for withdrawal. Request the form and contact the shop; the buyer pays return costs.",
        "requiresReview": false
      },
      {
        "id": "shipping-cost",
        "topic": "delivery",
        "source": "delivery",
        "ru": "Бесплатная доставка заказов свыше 30 € указана для городов маршрута магазина. Другие города — по согласованию; это не бесплатная доставка по всей Латвии.",
        "lv": "Bezmaksas piegāde virs 30 € norādīta veikala maršruta pilsētām. Citās pilsētās — pēc vienošanās; ne visā Latvijā bez maksas.",
        "en": "Free delivery above €30 is listed for towns on the shop’s route. Other towns require agreement; this is not nationwide free delivery.",
        "requiresReview": false
      }
    ]
  },
  "hobbyset": {
    "id": "hobbyset",
    "name": "HobbySet",
    "homepage": "https://hobbyset.lv/",
    "checked": "2026-10-15",
    "contact": {
      "email": "hobbyset@hobbyset.lv",
      "phone": "+37127071071",
      "hours": {
        "ru": "Интернет-магазин: пн–пт 09:00–17:00",
        "lv": "Interneta veikals: P.–Pk. 09:00–17:00",
        "en": "Online shop: Mon–Fri 09:00–17:00"
      },
      "source": "https://hobbyset.lv/site/content/en/166/Contact-us.html"
    },
    "sources": {
      "contact": {
        "title": "Kontakti",
        "url": "https://hobbyset.lv/site/content/en/166/Contact-us.html"
      },
      "delivery": {
        "title": "Piegāde",
        "url": "https://hobbyset.lv/site/content/lv/276/Pieg%C4%81des-veidi.html"
      },
      "payment": {
        "title": "Apmaksa",
        "url": "https://hobbyset.lv/site/content/lv/275/Apmaksas-veidi.html"
      },
      "returns": {
        "title": "Atgriešana",
        "url": "https://hobbyset.lv/site/content/lv/278/Pre%C4%8Du-atgrie-scaron-ana.html"
      }
    },
    "cards": [
      {
        "id": "delivery",
        "topic": "delivery",
        "source": "delivery",
        "ru": "Пакоматы в Латвии: Latvijas Pasts 2,49 €, Venipak 1,99 €, Omniva 3,29 €. Для заказов свыше 50 € пакомат в Латвии бесплатный.",
        "lv": "Pakomāti Latvijā: Latvijas Pasts 2,49 €, Venipak 1,99 €, Omniva 3,29 €. Pasūtījumiem virs 50 € pakomāts Latvijā bez maksas.",
        "en": "Latvian lockers: Latvijas Pasts €2.49, Venipak €1.99, Omniva €3.29. Latvian locker delivery is free above €50.",
        "requiresReview": false
      },
      {
        "id": "timing",
        "topic": "timing",
        "source": "delivery",
        "ru": "Для доступных товаров указан пакомат за 2–3 рабочих дня. Точный срок конкретного заказа подтвердит магазин.",
        "lv": "Pieejamām precēm norādīta piegāde pakomātā 2–3 darba dienās. Konkrēto termiņu apstiprina veikals.",
        "en": "For available goods, lockers are listed at 2–3 working days. The shop confirms an individual order estimate.",
        "requiresReview": false
      },
      {
        "id": "pickup",
        "topic": "pickup",
        "source": "delivery",
        "ru": "Самовывоз из Dzirnavu 100, Рига, бесплатный. Готовность заказа нужно подтвердить.",
        "lv": "Saņemšana Dzirnavu 100, Rīgā, ir bez maksas. Jāapstiprina pasūtījuma gatavība.",
        "en": "Collection at Dzirnavu 100, Riga, is free. Confirm order readiness first.",
        "requiresReview": false
      },
      {
        "id": "payment",
        "topic": "payment",
        "source": "payment",
        "ru": "Указаны онлайн-банк, карта и банковский перевод по электронному счёту. Счёт оплачивается в течение 3 рабочих дней.",
        "lv": "Norādīta internetbanka, karte un bankas pārskaitījums pēc e-rēķina. Rēķinu apmaksā 3 darba dienās.",
        "en": "Listed methods: online banking, card and bank transfer using an emailed invoice. Pay the invoice within 3 working days.",
        "requiresReview": false
      },
      {
        "id": "return",
        "topic": "return",
        "source": "returns",
        "ru": "Страница возвратов упоминает 14 дней, но содержит старую нормативную ссылку. Актуальный порядок и форму нужно подтвердить у магазина.",
        "lv": "Atgriešanas lapā minētas 14 dienas, bet ir novecojusi normatīvā atsauce. Aktuālo kārtību un veidlapu apstipriniet veikalā.",
        "en": "The returns page mentions 14 days but cites an old regulation. Confirm the current process and form with the shop.",
        "requiresReview": true
      },
      {
        "id": "warranty",
        "topic": "warranty",
        "source": "contact",
        "ru": "Единого гарантийного срока в проверенных страницах не подтверждено. Для конкретного товара обратитесь в интернет-магазин.",
        "lv": "Pārbaudītajās lapās vienots garantijas termiņš nav apstiprināts. Par konkrētu preci sazinieties ar interneta veikalu.",
        "en": "The checked pages do not confirm a universal warranty period. Contact the online shop about a specific product.",
        "requiresReview": true
      },
      {
        "id": "contact",
        "topic": "contact",
        "source": "contact",
        "ru": "Контакты HobbySet: hobbyset@hobbyset.lv, +37127071071. Демо сообщения не отправляет.",
        "lv": "HobbySet kontakti: hobbyset@hobbyset.lv, +37127071071. Demonstrācija ziņas nesūta.",
        "en": "HobbySet contacts: hobbyset@hobbyset.lv, +37127071071. The demo sends no messages.",
        "requiresReview": true
      },
      {
        "id": "hours",
        "topic": "hours",
        "source": "contact",
        "ru": "Интернет-магазин: пн–пт 09:00–17:00 (Латвия).",
        "lv": "Interneta veikals: P.–Pk. 09:00–17:00 (Latvija).",
        "en": "Online shop: Mon–Fri 09:00–17:00 (Latvia).",
        "requiresReview": false
      },
      {
        "id": "status",
        "topic": "status",
        "source": "contact",
        "ru": "Демо не подключено к заказам. Статус, отмену, изменение заказа или компенсацию нужно обсудить с магазином.",
        "lv": "Demonstrācija nav savienota ar pasūtījumiem. Statusu, atcelšanu, izmaiņas vai kompensāciju apspriediet ar veikalu.",
        "en": "The demo has no order access. Discuss status, cancellation, changes or compensation with the shop.",
        "requiresReview": true
      },
      {
        "id": "payment-problem",
        "topic": "payment-problem",
        "source": "contact",
        "ru": "Демо не видит платежи и не возвращает деньги. Не вводите реквизиты; обратитесь в магазин.",
        "lv": "Demonstrācija neredz maksājumus un neatmaksā naudu. Neievadiet rekvizītus; sazinieties ar veikalu.",
        "en": "The demo cannot see payments or issue refunds. Do not enter payment details; contact the shop.",
        "requiresReview": true
      },
      {
        "id": "defect",
        "topic": "defect",
        "source": "contact",
        "ru": "Неисправность или повреждение нужно обсудить с магазином. Демо не решает, покрывается ли случай гарантией.",
        "lv": "Par defektu vai bojājumu sazinieties ar veikalu. Demonstrācija neizlemj, vai gadījumu sedz garantija.",
        "en": "Contact the shop about a defect or damage. The demo cannot decide warranty coverage.",
        "requiresReview": true
      },
      {
        "id": "return-process",
        "topic": "return",
        "source": "returns",
        "ru": "Страница возвратов упоминает 14 дней, но содержит старую нормативную ссылку. Актуальный порядок и форму нужно подтвердить у магазина.",
        "lv": "Atgriešanas lapā minētas 14 dienas, bet ir novecojusi normatīvā atsauce. Aktuālo kārtību un veidlapu apstipriniet veikalā.",
        "en": "The returns page mentions 14 days but cites an old regulation. Confirm the current process and form with the shop.",
        "requiresReview": true
      },
      {
        "id": "shipping-cost",
        "topic": "delivery",
        "source": "delivery",
        "ru": "Пакоматы в Латвии: Latvijas Pasts 2,49 €, Venipak 1,99 €, Omniva 3,29 €. Для заказов свыше 50 € пакомат в Латвии бесплатный.",
        "lv": "Pakomāti Latvijā: Latvijas Pasts 2,49 €, Venipak 1,99 €, Omniva 3,29 €. Pasūtījumiem virs 50 € pakomāts Latvijā bez maksas.",
        "en": "Latvian lockers: Latvijas Pasts €2.49, Venipak €1.99, Omniva €3.29. Latvian locker delivery is free above €50.",
        "requiresReview": false
      }
    ]
  },
  "apavi40plus": {
    "id": "apavi40plus",
    "name": "Apavi 40 plus",
    "homepage": "https://apavi40plus.com/",
    "checked": "2026-10-15",
    "contact": {
      "email": "info@apavi40plus.lv",
      "phone": "+37122339398",
      "hours": {
        "ru": "Чт–пт 16:00–18:00; сб 10:00–13:00; другое время по согласованию",
        "lv": "C.–Pk. 16:00–18:00; S. 10:00–13:00; citā laikā pēc vienošanās",
        "en": "Thu–Fri 16:00–18:00; Sat 10:00–13:00; other times by appointment"
      },
      "source": "https://apavi40plus.com/policies/contact-information"
    },
    "sources": {
      "contact": {
        "title": "Kontakti",
        "url": "https://apavi40plus.com/policies/contact-information"
      },
      "delivery": {
        "title": "Piegāde",
        "url": "https://apavi40plus.com/policies/shipping-policy"
      },
      "returns": {
        "title": "Atgriešana",
        "url": "https://apavi40plus.com/policies/refund-policy"
      },
      "terms": {
        "title": "Noteikumi",
        "url": "https://apavi40plus.com/policies/terms-of-service"
      }
    },
    "cards": [
      {
        "id": "delivery",
        "topic": "delivery",
        "source": "delivery",
        "ru": "В Латвии: Unisend 2,20 €, Omniva 2,65–4 €, Latvijas Pasts 3,50–7,50 €. Доступен бесплатный самовывоз.",
        "lv": "Latvijā: Unisend 2,20 €, Omniva 2,65–4 €, Latvijas Pasts 3,50–7,50 €. Pieejama bezmaksas saņemšana.",
        "en": "In Latvia: Unisend €2.20, Omniva €2.65–4, Latvijas Pasts €3.50–7.50. Free collection is available.",
        "requiresReview": false
      },
      {
        "id": "timing",
        "topic": "timing",
        "source": "delivery",
        "ru": "Указана отправка на следующий рабочий день после оплаты. Это дата отправки, а не гарантированного получения.",
        "lv": "Norādīta nosūtīšana nākamajā darba dienā pēc apmaksas. Tā nav garantēta saņemšanas diena.",
        "en": "Dispatch is listed for the next working day after payment. This is not a guaranteed arrival date.",
        "requiresReview": false
      },
      {
        "id": "payment",
        "topic": "payment",
        "source": "terms",
        "ru": "Указаны Visa/Mastercard через Paysera и банковский перевод по счёту.",
        "lv": "Norādītas Visa/Mastercard ar Paysera un bankas pārskaitījums pēc rēķina.",
        "en": "Listed methods: Visa/Mastercard via Paysera and bank transfer by invoice.",
        "requiresReview": false
      },
      {
        "id": "return",
        "topic": "return",
        "source": "returns",
        "ru": "В течение 14 дней с получения можно запросить возврат или обмен размера через профиль заказа. Обратную доставку оплачивает покупатель.",
        "lv": "14 dienās pēc saņemšanas pasūtījuma profilā var pieprasīt atgriešanu vai izmēra maiņu. Atpakaļsūtīšanu apmaksā pircējs.",
        "en": "Within 14 days of receipt, request a return or size exchange in your order profile. The buyer pays return shipping.",
        "requiresReview": false
      },
      {
        "id": "opened",
        "topic": "opened",
        "source": "returns",
        "ru": "Магазин просит примерять обувь в помещении, сохранить коробку и использовать внешнюю упаковку для отправки. Спорное состояние оценивает сотрудник.",
        "lv": "Veikals lūdz apavus pielaikot telpās, saglabāt kasti un sūtīšanai lietot ārējo iepakojumu. Strīdīgu stāvokli izvērtē darbinieks.",
        "en": "The shop asks customers to try shoes indoors, keep the box and add outer shipping packaging. Staff assess disputed condition.",
        "requiresReview": true
      },
      {
        "id": "pickup",
        "topic": "pickup",
        "source": "contact",
        "ru": "Магазин: Bruņinieku 52, Рига. Перед поездкой уточните готовность и время.",
        "lv": "Veikals: Bruņinieku 52, Rīga. Pirms brauciena precizējiet gatavību un laiku.",
        "en": "Shop: Bruņinieku 52, Riga. Confirm readiness and opening time before travelling.",
        "requiresReview": false
      },
      {
        "id": "warranty",
        "topic": "warranty",
        "source": "terms",
        "ru": "Единый срок гарантии на дефекты не подтверждён. Указанные 14 дней возврата не следует считать сроком гарантии; уточните у магазина.",
        "lv": "Vienots defektu garantijas termiņš nav apstiprināts. Minētās 14 atgriešanas dienas nav jāuzskata par garantijas termiņu; precizējiet veikalā.",
        "en": "A universal defect warranty period is not confirmed. The 14-day return period is not a warranty duration; ask the shop.",
        "requiresReview": true
      },
      {
        "id": "contact",
        "topic": "contact",
        "source": "contact",
        "ru": "Контакты Apavi 40 plus: info@apavi40plus.lv, +37122339398. Демо сообщения не отправляет.",
        "lv": "Apavi 40 plus kontakti: info@apavi40plus.lv, +37122339398. Demonstrācija ziņas nesūta.",
        "en": "Apavi 40 plus contacts: info@apavi40plus.lv, +37122339398. The demo sends no messages.",
        "requiresReview": true
      },
      {
        "id": "hours",
        "topic": "hours",
        "source": "contact",
        "ru": "Чт–пт 16:00–18:00; сб 10:00–13:00; другое время по согласованию (Латвия).",
        "lv": "C.–Pk. 16:00–18:00; S. 10:00–13:00; citā laikā pēc vienošanās (Latvija).",
        "en": "Thu–Fri 16:00–18:00; Sat 10:00–13:00; other times by appointment (Latvia).",
        "requiresReview": false
      },
      {
        "id": "status",
        "topic": "status",
        "source": "contact",
        "ru": "Демо не подключено к заказам. Статус, отмену, изменение заказа или компенсацию нужно обсудить с магазином.",
        "lv": "Demonstrācija nav savienota ar pasūtījumiem. Statusu, atcelšanu, izmaiņas vai kompensāciju apspriediet ar veikalu.",
        "en": "The demo has no order access. Discuss status, cancellation, changes or compensation with the shop.",
        "requiresReview": true
      },
      {
        "id": "payment-problem",
        "topic": "payment-problem",
        "source": "contact",
        "ru": "Демо не видит платежи и не возвращает деньги. Не вводите реквизиты; обратитесь в магазин.",
        "lv": "Demonstrācija neredz maksājumus un neatmaksā naudu. Neievadiet rekvizītus; sazinieties ar veikalu.",
        "en": "The demo cannot see payments or issue refunds. Do not enter payment details; contact the shop.",
        "requiresReview": true
      },
      {
        "id": "defect",
        "topic": "defect",
        "source": "contact",
        "ru": "Неисправность или повреждение нужно обсудить с магазином. Демо не решает, покрывается ли случай гарантией.",
        "lv": "Par defektu vai bojājumu sazinieties ar veikalu. Demonstrācija neizlemj, vai gadījumu sedz garantija.",
        "en": "Contact the shop about a defect or damage. The demo cannot decide warranty coverage.",
        "requiresReview": true
      },
      {
        "id": "return-process",
        "topic": "return",
        "source": "returns",
        "ru": "В течение 14 дней с получения можно запросить возврат или обмен размера через профиль заказа. Обратную доставку оплачивает покупатель.",
        "lv": "14 dienās pēc saņemšanas pasūtījuma profilā var pieprasīt atgriešanu vai izmēra maiņu. Atpakaļsūtīšanu apmaksā pircējs.",
        "en": "Within 14 days of receipt, request a return or size exchange in your order profile. The buyer pays return shipping.",
        "requiresReview": false
      },
      {
        "id": "shipping-cost",
        "topic": "delivery",
        "source": "delivery",
        "ru": "В Латвии: Unisend 2,20 €, Omniva 2,65–4 €, Latvijas Pasts 3,50–7,50 €. Доступен бесплатный самовывоз.",
        "lv": "Latvijā: Unisend 2,20 €, Omniva 2,65–4 €, Latvijas Pasts 3,50–7,50 €. Pieejama bezmaksas saņemšana.",
        "en": "In Latvia: Unisend €2.20, Omniva €2.65–4, Latvijas Pasts €3.50–7.50. Free collection is available.",
        "requiresReview": false
      }
    ]
  },
  "celotajs": {
    "id": "celotajs",
    "name": "Veikals Ceļotājs",
    "homepage": "https://veikalscelotajs.lv/",
    "checked": "2026-10-15",
    "contact": {
      "email": "celotajs@veikalscelotajs.lv",
      "phone": "+37127267207",
      "hours": {
        "ru": "Интернет-магазин: пн–пт 10:00–17:00",
        "lv": "Interneta veikals: P.–Pk. 10:00–17:00",
        "en": "Online shop: Mon–Fri 10:00–17:00"
      },
      "source": "https://veikalscelotajs.lv/pages/kontakti"
    },
    "sources": {
      "contact": {
        "title": "Kontakti",
        "url": "https://veikalscelotajs.lv/pages/kontakti"
      },
      "delivery": {
        "title": "Piegāde",
        "url": "https://veikalscelotajs.lv/policies/shipping-policy"
      },
      "returns": {
        "title": "Atgriešana",
        "url": "https://veikalscelotajs.lv/policies/refund-policy"
      },
      "warranty": {
        "title": "Garantija",
        "url": "https://veikalscelotajs.lv/pages/garantija"
      },
      "terms": {
        "title": "Noteikumi",
        "url": "https://veikalscelotajs.lv/policies/terms-of-service"
      }
    },
    "cards": [
      {
        "id": "delivery",
        "topic": "delivery",
        "source": "delivery",
        "ru": "В Латвии, Литве и Эстонии указаны Itella/Omniva и курьер. Пакоматы бесплатны от 30 €, иначе 1,82–2,99 €; крупные товары — курьером.",
        "lv": "Latvijā, Lietuvā un Igaunijā norādīti Itella/Omniva un kurjers. Pakomāti bez maksas no 30 €, citādi 1,82–2,99 €; lielas preces — ar kurjeru.",
        "en": "Itella/Omniva and courier are listed for Latvia, Lithuania and Estonia. Lockers are free from €30, otherwise €1.82–2.99; oversized goods require courier.",
        "requiresReview": false
      },
      {
        "id": "timing",
        "topic": "timing",
        "source": "delivery",
        "ru": "Указаны ориентиры: пакомат 1–3 рабочих дня; курьер в Риге 1–2, вне Риги 2–5. Конкретная дата не гарантируется.",
        "lv": "Norādītie orientieri: pakomāts 1–3 darba dienas; kurjers Rīgā 1–2, ārpus Rīgas 2–5. Konkrētu datumu negarantēju.",
        "en": "Listed estimates: lockers 1–3 working days; courier 1–2 in Riga, 2–5 outside Riga. No specific date is guaranteed.",
        "requiresReview": false
      },
      {
        "id": "pickup",
        "topic": "pickup",
        "source": "delivery",
        "ru": "Бесплатный самовывоз указан в Ceļotājs и Urban Outdoor в Риге. Дождитесь подтверждения готовности и уточните часы.",
        "lv": "Bezmaksas saņemšana norādīta Ceļotājs un Urban Outdoor Rīgā. Sagaidiet gatavības apstiprinājumu un precizējiet darba laiku.",
        "en": "Free collection is listed at Ceļotājs and Urban Outdoor in Riga. Wait for readiness confirmation and check opening times.",
        "requiresReview": false
      },
      {
        "id": "payment",
        "topic": "payment",
        "source": "terms",
        "ru": "Способ оплаты выбирается при оформлении заказа. Полный актуальный список в проверенных условиях не подтверждён; демо платежи не принимает.",
        "lv": "Apmaksas veidu izvēlas pasūtījuma noformēšanā. Pilns aktuālais saraksts pārbaudītajos noteikumos nav apstiprināts; demonstrācija maksājumus nepieņem.",
        "en": "Choose payment during checkout. The checked terms do not confirm a complete current list; this demo does not accept payments.",
        "requiresReview": false
      },
      {
        "id": "return",
        "topic": "return",
        "source": "returns",
        "ru": "Об отказе сообщают по email в течение 14 календарных дней с получения; товар возвращают в течение 14 дней после уведомления.",
        "lv": "Par atteikumu paziņo e-pastā 14 kalendāra dienās pēc saņemšanas; preci atdod 14 dienās pēc paziņojuma.",
        "en": "Notify the shop by email within 14 calendar days of receipt; return the goods within 14 days after notice.",
        "requiresReview": false
      },
      {
        "id": "warranty",
        "topic": "warranty",
        "source": "warranty",
        "ru": "На странице магазина указана гарантия не менее 2 лет с подтверждением покупки. Покрытие конкретного дефекта оценивается отдельно.",
        "lv": "Veikala lapā norādīta vismaz 2 gadu garantija ar pirkuma apliecinājumu. Konkrēta defekta segumu izvērtē atsevišķi.",
        "en": "The shop page states at least a 2-year warranty with proof of purchase. Coverage of a specific defect is assessed separately.",
        "requiresReview": false
      },
      {
        "id": "contact",
        "topic": "contact",
        "source": "contact",
        "ru": "Контакты Veikals Ceļotājs: celotajs@veikalscelotajs.lv, +37127267207. Демо сообщения не отправляет.",
        "lv": "Veikals Ceļotājs kontakti: celotajs@veikalscelotajs.lv, +37127267207. Demonstrācija ziņas nesūta.",
        "en": "Veikals Ceļotājs contacts: celotajs@veikalscelotajs.lv, +37127267207. The demo sends no messages.",
        "requiresReview": true
      },
      {
        "id": "hours",
        "topic": "hours",
        "source": "contact",
        "ru": "Интернет-магазин: пн–пт 10:00–17:00 (Латвия).",
        "lv": "Interneta veikals: P.–Pk. 10:00–17:00 (Latvija).",
        "en": "Online shop: Mon–Fri 10:00–17:00 (Latvia).",
        "requiresReview": false
      },
      {
        "id": "status",
        "topic": "status",
        "source": "contact",
        "ru": "Демо не подключено к заказам. Статус, отмену, изменение заказа или компенсацию нужно обсудить с магазином.",
        "lv": "Demonstrācija nav savienota ar pasūtījumiem. Statusu, atcelšanu, izmaiņas vai kompensāciju apspriediet ar veikalu.",
        "en": "The demo has no order access. Discuss status, cancellation, changes or compensation with the shop.",
        "requiresReview": true
      },
      {
        "id": "payment-problem",
        "topic": "payment-problem",
        "source": "contact",
        "ru": "Демо не видит платежи и не возвращает деньги. Не вводите реквизиты; обратитесь в магазин.",
        "lv": "Demonstrācija neredz maksājumus un neatmaksā naudu. Neievadiet rekvizītus; sazinieties ar veikalu.",
        "en": "The demo cannot see payments or issue refunds. Do not enter payment details; contact the shop.",
        "requiresReview": true
      },
      {
        "id": "defect",
        "topic": "defect",
        "source": "contact",
        "ru": "Неисправность или повреждение нужно обсудить с магазином. Демо не решает, покрывается ли случай гарантией.",
        "lv": "Par defektu vai bojājumu sazinieties ar veikalu. Demonstrācija neizlemj, vai gadījumu sedz garantija.",
        "en": "Contact the shop about a defect or damage. The demo cannot decide warranty coverage.",
        "requiresReview": true
      },
      {
        "id": "return-process",
        "topic": "return",
        "source": "returns",
        "ru": "Об отказе сообщают по email в течение 14 календарных дней с получения; товар возвращают в течение 14 дней после уведомления.",
        "lv": "Par atteikumu paziņo e-pastā 14 kalendāra dienās pēc saņemšanas; preci atdod 14 dienās pēc paziņojuma.",
        "en": "Notify the shop by email within 14 calendar days of receipt; return the goods within 14 days after notice.",
        "requiresReview": false
      },
      {
        "id": "shipping-cost",
        "topic": "delivery",
        "source": "delivery",
        "ru": "В Латвии, Литве и Эстонии указаны Itella/Omniva и курьер. Пакоматы бесплатны от 30 €, иначе 1,82–2,99 €; крупные товары — курьером.",
        "lv": "Latvijā, Lietuvā un Igaunijā norādīti Itella/Omniva un kurjers. Pakomāti bez maksas no 30 €, citādi 1,82–2,99 €; lielas preces — ar kurjeru.",
        "en": "Itella/Omniva and courier are listed for Latvia, Lithuania and Estonia. Lockers are free from €30, otherwise €1.82–2.99; oversized goods require courier.",
        "requiresReview": false
      }
    ]
  }
};

for (const [id, knowledge] of Object.entries(nicheKnowledge)) {
  prospectTenants[id].sources['niche-product'] = knowledge.source;
  prospectTenants[id].cards.push(...knowledge.cards);
}
