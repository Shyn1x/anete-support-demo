// New shopper goals written separately from the retrieval matchers.
// Language variants are counted as variants, not independent goals or live AI passes.
const common=[
 ['delivery','policy',['Хочу сделать заказ. Какие способы доставки есть?','Vēlos pasūtīt. Kādi ir piegādes veidi?','I want to order. What delivery options are available?']],
 ['payment','policy',['Как можно оплатить покупку?','Kā var apmaksāt pirkumu?','How can I pay for my purchase?']],
 ['return','policy',['Можно вернуть товар, если я передумал?','Vai varu atgriezt preci, ja pārdomāju?','Can I return an item if I changed my mind?']],
 ['damaged','review',['Посылка приехала повреждённой. Что делать?','Sūtījums pienāca bojāts. Ko darīt?','My parcel arrived damaged. What should I do?']],
 ['human','review',['Хочу поговорить с сотрудником магазина','Vēlos runāt ar veikala darbinieku','I want to speak to a shop employee']],
 ['privacy','blocked',['Моя почта test@example.invalid','Mans e-pasts test@example.invalid','My email is test@example.invalid']]
];
const shops={
 anete:[['vacuum','search',['Какой пылесос выбрать?','Kādu putekļsūcēju izvēlēties?','Which vacuum should I choose?']],['unknown','unknown',['Пылесос Example-X999 с HEPA фильтром?','Vai putekļsūcējam Example-X999 ir HEPA filtrs?','Does vacuum Example-X999 have a HEPA filter?']]],
 bariba:[['puppy','search',['Какой корм лучше подойдет для щенков?','Kādu barību izvēlēties kucēniem?','What food is best for puppies?']],['cat','search',['Какой корм выбрать для кота?','Kādu barību izvēlēties kaķim?','Which cat food should I choose?']],['allergy','review',['У щенка аллергия, посоветуй корм','Kucēnam ir alerģija, kādu barību izvēlēties?','My puppy has allergies. Which food should I choose?']],['unknown','unknown',['Что в составе корма Example-X999?','Kāds ir barības Example-X999 sastāvs?','What are the ingredients of food Example-X999?']]],
 hobbyset:[['watercolour','search',['Какие акварельные краски выбрать?','Kādas akvareļkrāsas izvēlēties?','Which watercolor paints should I choose?']],['body','review',['Можно использовать эти краски на коже ребёнка?','Vai šīs krāsas droši izmantot uz bērna ādas?','Can I use these paints on a child’s skin?']],['unknown','unknown',['Краски Example-X999 подходят для ткани?','Vai krāsas Example-X999 der audumam?','Is paint Example-X999 suitable for fabric?']]],
 apavi40plus:[['model','search',['Josef Seibel 42801 какой материал?','Josef Seibel 42801 kāds materiāls?','What material is Josef Seibel 42801 made from?']],['unknown','unknown',['У обуви Example-X999 какая ширина?','Kāds ir apavu Example-X999 platums?','What is the width of shoe Example-X999?']]],
 rotallieta:[['board','search',['Какие игрушки Busy Board есть?','Kādas Busy Board rotaļlietas ir?','Which Busy Board toys are listed?']],['safety','review',['Эта игрушка безопасна для новорождённого?','Vai šī rotaļlieta ir droša jaundzimušajam?','Is this toy safe for a newborn?']],['unknown','unknown',['У игрушки Example-X999 батарейки в комплекте?','Vai rotaļlietai Example-X999 baterijas ir komplektā?','Does toy Example-X999 include batteries?']]],
 celotajs:[['tent','search',['Какую палатку выбрать?','Kādu telti izvēlēties?','Which tent should I choose?']],['cold','review',['Безопасно спать в этом спальнике при -20?','Vai šajā guļammaisā droši gulēt -20 grādos?','Is it safe to sleep in this sleeping bag at -20?']],['unknown','unknown',['Сколько весит палатка Example-X999?','Cik sver telts Example-X999?','What is the weight of tent Example-X999?']]]
};
export const shopperCases=Object.entries(shops).flatMap(([tenant,rows])=>[...common,...rows].flatMap(([goal,expected,variants])=>variants.map((message,i)=>({id:tenant+'-'+goal+'-'+['ru','lv','en'][i],tenant,goal,expected,locale:['ru','lv','en'][i],message}))));
