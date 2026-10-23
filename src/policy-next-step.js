// Server-owned contact/action text from the merchant return policy, fetched
// 2026-10-23 (hash and review in docs/audits/2026-10-23-other-shops-review.json).
// Never let generated prose or user history choose the address or the steps.
const copies={
 ru:'Напишите в магазин на celotajs@veikalscelotajs.lv. В письме укажите товар и номер заказа — в этот демо-чат их вводить не нужно. Способ отправки согласуйте с магазином. Для отдельных категорий действуют исключения, поэтому применимость возврата нужно проверить по условиям магазина.',
 lv:'Rakstiet veikalam uz celotajs@veikalscelotajs.lv. E-pastā norādiet preci un pasūtījuma numuru — šajā demonstrācijas čatā tos neievadiet. Atgriešanas veidu saskaņojiet ar veikalu. Atsevišķām preču kategorijām ir izņēmumi, tāpēc pārbaudiet konkrētās preces atgriešanas nosacījumus.',
 en:'Email the shop at celotajs@veikalscelotajs.lv. Include the item and order number in that email, not in this demo chat. Agree the return method with the shop. Some product categories have exceptions, so check the shop’s conditions for your item.'
};
export function policyNextStep(tenant,locale,result){
 if(tenant.id!=='celotajs'||tenant.sources?.returns?.url!=='https://veikalscelotajs.lv/policies/refund-policy'||!result.ids?.some(id=>['return','return-process'].includes(id)))return '';
 return copies[locale]||'';
}
