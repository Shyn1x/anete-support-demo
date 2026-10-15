// Additional ordinary phrases and adversarial context changes, separate from the initial 150-case audit.
const shops=['rotallieta','bariba','hobbyset','apavi40plus','celotajs'];
const common=[
 ['ru','Не нужен оператор, как оплатить?',['payment']],
 ['en','The packaging arrived damaged',['defect']],
 ['lv','Piegāde un apmaksas veidi?',['delivery','payment']],
 ['ru','Спасибо! Товар не работает',['defect']],
 ['ru','И какая цена сейчас?',['product-live']],
 ['en','Do you have stock?',['product-live']],
 ['ru','Сначала у меня был вопрос о доставке. Но теперь хочу отменить заказ',['status']],
 ['ru','Ничего не понял',['notHelpful']],
 ['ru','Отвечай на английском',['language'],'en'],
 ['en','Please reply in Latvian',['language'],'lv']
];
const extra={
 rotallieta:[['ru','HE0545: какие батарейки и доставка?',['toy-batteries','delivery']],['ru','В наборе есть мелкие детальки?',['product-help']]],
 bariba:[['ru','CooKing Lamb: курица и доставка?',['food-composition','delivery']],['en','Which food is suitable for a kitten?',['product-help']]],
 hobbyset:[['ru','POP ART для новичка и как оплатить?',['art-beginner','payment']],['en','Can I use this on fabric?',['product-help']]],
 apavi40plus:[['ru','42801: материал и доставка?',['shoe-material','delivery']],['en','My foot is 27 cm, which size?',['product-sizing']]],
 celotajs:[['ru','Что значит comfort и как оплатить?',['sleep-ratings','payment']],['en','Which backpack for a weekend hike?',['product-help']]]
};
export const buyerHoldoutCases=shops.flatMap(tenant=>[...common,...extra[tenant]].map(([locale,message,expected,responseLocale],i)=>({id:`holdout-${tenant}-${i+1}`,tenant,locale:responseLocale||locale,message,expected,match:'all'})));
