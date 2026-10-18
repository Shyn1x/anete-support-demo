// Held-out ordinary customer questions, not an AI-response benchmark.
// expected is a safety/routing contract, not a claim that the catalogue is complete.
const common=[
 ['policy','answer',['Какие способы доставки есть?','Kādi piegādes veidi ir pieejami?','What delivery options are available?']],
 ['complaint','review',['Получил повреждённую посылку','Saņēmu bojātu sūtījumu','My parcel arrived damaged']],
 ['human','review',['Мне нужен сотрудник','Vēlos runāt ar darbinieku','I want to speak to a human']]
];
const shops={
 anete:[
 ['selection','clarify',['Какой пылесос лучше выбрать?','Kādu putekļsūcēju izvēlēties?','Which vacuum should I choose?']],
 ['comparison','clarify',['Сравни модели холодильников Example-X и Example-Y','Salīdzini ledusskapja modeļus Example-X un Example-Y','Compare fridge models Example-X and Example-Y']],
 ['unknown-model','clarify',['У пылесоса Example-X сменный фильтр?','Vai putekļsūcēja modelim Example-X ir maināms filtrs?','Does the vacuum Example-X have a replaceable filter?']]
 ],
 bariba:[
 ['selection','clarify',['Какой корм лучше выбрать для кота?','Kādu barību izvēlēties kaķim?','Which cat food should I choose?']],
 ['comparison','clarify',['Сравни корм Example-X и Example-Y','Salīdzini barību Example-X un Example-Y','Compare food Example-X and Example-Y']],
 ['unknown-model','clarify',['В корме Example-X есть курица?','Vai barībā Example-X ir vista?','Does food Example-X contain chicken?']],
 ['known-product','answer',['CooKing Lamb состав?','CooKing Lamb sastāvs?','CooKing Lamb ingredients?']],
 ['reported-puppy-selection','answer',['Какой корм лучше подойдет для щенков','Kāda barība ir piemērota kucēniem?','What food is best for puppies?']],
 ['medical-constraint','review',['Какой корм подойдет щенку с аллергией?','Kāda barība kucēnam ar alerģiju?','What food is suitable for a puppy with allergies?']]
 ],
 hobbyset:[
 ['selection','clarify',['Какие краски лучше выбрать для ткани?','Kādas krāsas izvēlēties audumam?','Which paint should I choose for fabric?']],
 ['comparison','clarify',['Сравни краски Example-X и Example-Y','Salīdzini krāsas Example-X un Example-Y','Compare paint Example-X and Example-Y']],
 ['unknown-model','clarify',['Краски Example-X можно разводить водой?','Vai krāsas Example-X var atšķaidīt ar ūdeni?','Can paint Example-X be thinned with water?']],
 ['known-product','answer',['POP ART сколько тюбиков?','POP ART cik tūbiņu?','POP ART how many tubes?']]
 ],
 apavi40plus:[
 ['selection','clarify',['Какую обувь лучше выбрать для прогулок?','Kādus apavus izvēlēties pastaigām?','Which shoes should I choose for walking?']],
 ['comparison','clarify',['Сравни обувь Example-X и Example-Y','Salīdzini apavus Example-X un Example-Y','Compare shoes Example-X and Example-Y']],
 ['unknown-model','clarify',['У обуви Example-X съёмная стелька?','Vai apaviem Example-X ir izņemama iekšzole?','Do shoes Example-X have a removable insole?']],
 ['known-product','answer',['42801 какой материал?','42801 kāds materiāls?','42801 leather material?']]
 ],
 rotallieta:[
 ['selection','clarify',['Какую игрушку лучше выбрать ребёнку?','Kādu rotaļlietu izvēlēties bērnam?','Which toy should I choose for a child?']],
 ['comparison','clarify',['Сравни игрушки Example-X и Example-Y','Salīdzini rotaļlietas Example-X un Example-Y','Compare toys Example-X and Example-Y']],
 ['unknown-model','clarify',['Игрушка Example-X включает батарейки?','Vai rotaļlietai Example-X baterijas ir komplektā?','Does toy Example-X include batteries?']],
 ['known-product','answer',['Busy Board HE0545 какие батарейки?','Busy Board HE0545 kādas baterijas?','Busy Board HE0545 batteries?']]
 ],
 celotajs:[
 ['selection','clarify',['Какую палатку лучше выбрать для похода?','Kādu telti izvēlēties pārgājienam?','Which tent should I choose for hiking?']],
 ['comparison','clarify',['Сравни палатки Example-X и Example-Y','Salīdzini teltis Example-X un Example-Y','Compare tents Example-X and Example-Y']],
 ['unknown-model','clarify',['Палатка Example-X сколько весит?','Cik sver telts Example-X?','What is the weight of tent Example-X?']],
 ['known-product','answer',['Спальник comfort limit extreme?','Guļammaiss comfort limit extreme?','Sleeping bag comfort limit extreme?']]
 ]
};
export const productCoverageCases=Object.entries(shops).flatMap(([tenant,rows])=>[...common,...rows].flatMap(([kind,expected,questions])=>questions.map((message,i)=>({id:tenant+'-'+kind+'-'+['ru','lv','en'][i],tenant,kind,expected,locale:['ru','lv','en'][i],message}))));
