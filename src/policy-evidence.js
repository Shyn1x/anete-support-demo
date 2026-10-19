// Preserve monetary eligibility conditions when paraphrasing free shipping.
// This supplements numeric allowlists; it is not a semantic proof of prose.
const freeDelivery=/бесплат\p{L}*.{0,20}достав|достав\p{L}*.{0,20}бесплат|free (?:shipping|delivery)|(?:shipping|delivery).{0,15}(?:is |are )?free|bezmaksas piegād|piegād\p{L}*.{0,15}bezmaksas/iu;
const negative=/не (?:могу|можем|удалось) подтверд|не подтвержд|cannot confirm|can't confirm|not confirmed|nevar.{0,12}apstiprin|nav apstiprin/iu;
function thresholds(text){
 const re=/(свыше|более|от|не менее|above|over|from|at least|virs|no|vismaz)\s*(?:€\s*)?(\d+(?:[.,]\d+)?)\s*(€|eur|евро)?/giu;
 return [...text.matchAll(re)].filter(m=>m[3]||m[0].includes('€')).map(m=>({amount:m[2].replace(',','.'),bound:/^(?:свыше|более|above|over|virs)$/iu.test(m[1])?'exclusive':'inclusive'}));
}
export function deliveryConditionReason(reply,result,tenant,locale){
 const cards=tenant.cards.filter(c=>result.ids.includes(c.id)&&['delivery','shipping-cost'].includes(c.id));
 if(!cards.length)return null;
 const affirmative=reply.split(/[.!?\n]/u).some(s=>freeDelivery.test(s)&&!negative.test(s));
 if(!affirmative)return null;
 const source=cards.map(c=>c[locale]).join('\n');if(!freeDelivery.test(source))return null;
 const needed=thresholds(source),actual=thresholds(reply);
 for(const condition of needed){
  if(!actual.some(c=>c.amount===condition.amount))return 'delivery_condition_omitted';
  if(!actual.some(c=>c.amount===condition.amount&&c.bound===condition.bound))return 'delivery_condition_changed';
 }
 if(/маршрут|route|maršrut/iu.test(source)&&!/маршрут|route|maršrut/iu.test(reply))return 'delivery_scope_omitted';
 return null;
}
export function timingConditionReason(reply,result,tenant,locale){
 const source=tenant.cards.filter(c=>result.ids.includes(c.id)&&c.id==='timing').map(c=>c[locale]).join('\n');
 const conditional=/для доступных товаров|for available goods|pieejamām precēm/iu;
 const duration=/\d[\d\s–—-]*.{0,15}(?:рабоч\p{L}* д|working days|darba dien)/iu;
 if(conditional.test(source)&&duration.test(reply)&&!/для доступных|если.{0,15}доступ|при условии.{0,20}доступ|for available|if.{0,15}available|pieejam\p{L}* prec|ja prece.{0,10}pieejam/iu.test(reply))return 'timing_condition_omitted';
 return null;
}
// Additional unsupported fit/date assurances observed in adversarial fixtures.
// A refusal to guarantee is allowed; it is not an affirmative promise.
export function additionalPromiseReason(reply){
 const assurance=/\b(?:will|would)\s+(?:definitely|certainly)\s+fit|\bperfect fit for (?:you|your)\b|(?:обязательно|несомненно)\s+(?:вам\s+)?подойд(?:[её]т|ут)|подойд(?:[её]т|ут)\s+(?:вам\s+)?точно|(?:noteikti|garantēti|droši)\s+derēs|\bwill\s+(?:definitely\s+|certainly\s+)?(?:arrive|be delivered)\s+(?:by|on|before)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|(?:доставим|привез[её]м|доставят|приедет|прид[её]т)\s+(?:точно\s+)?(?:к|в|до)\s+(?:понедельник|вторник|сред[уеы]|четверг|пятниц[уеы]|суббот[уеы]|воскресень)/iu;
 const denial=/не (?:могу|можем|буду) (?:обещать|гарантировать)|нельзя гарантировать|(?:cannot|can't|do not|don't) (?:confirm|guarantee|promise)|nevar.{0,12}(?:garantēt|apsolīt)/iu;
 return reply.split(/[.!?;\n]|\s+(?:but|но|tomēr)\s+/iu).some(s=>assurance.test(s)&&!denial.test(s))?'unverified_promise':null;
}
