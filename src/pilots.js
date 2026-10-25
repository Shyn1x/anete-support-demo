// Opt-in integration candidates. Existing published tenants stay in kb.tenants.
import {pilotProfiles} from './pilot-profiles.js';
import {pilotSources} from './pilot-sources.js';
const copy={
 ru:{unknown:'Этот пункт в подготовленных источниках не подтверждён. Уточните условия у магазина.',return:'Порядок возврата конкретного товара нужно подтвердить у магазина. Демо не принимает решение о праве на возврат.',warranty:'Единый гарантийный срок для всех товаров не подтверждён. Уточните условия конкретной модели у магазина.',status:'Демо не видит заказы, не меняет их и не возвращает деньги. Обратитесь в магазин без передачи личных данных в этот чат.',defect:'По повреждению или неисправности обратитесь в магазин. Случай требует проверки, демо не подтверждает компенсацию.',help:'Укажите товар или пришлите его ссылку и напишите, что хотите проверить. Отвечу только по прочитанному описанию, а не по предположению.'},
 lv:{unknown:'Šis punkts sagatavotajos avotos nav apstiprināts. Precizējiet nosacījumus veikalā.',return:'Konkrētās preces atgriešanas kārtība jāapstiprina veikalā. Demonstrācija neizlemj tiesības uz atgriešanu.',warranty:'Vienots garantijas termiņš visām precēm nav apstiprināts. Precizējiet konkrētā modeļa nosacījumus veikalā.',status:'Demonstrācija neredz pasūtījumus, tos nemaina un naudu neatmaksā. Sazinieties ar veikalu, nesūtot personas datus šajā čatā.',defect:'Par bojājumu vai darbības traucējumu sazinieties ar veikalu. Gadījums jāpārbauda, demonstrācija neapstiprina kompensāciju.',help:'Norādiet preci vai tās saiti un jautājumu. Atbildēšu tikai pēc nolasītā apraksta, nevis pieņēmuma.'},
 en:{unknown:'This point is not confirmed in the prepared sources. Check the terms with the shop.',return:'The shop needs to confirm the return process for the particular item. This demo does not decide return eligibility.',warranty:'A universal warranty period for all products is not confirmed. Ask the shop about the particular model.',status:'The demo cannot see or change orders or issue refunds. Contact the shop without sending personal details in this chat.',defect:'Contact the shop about damage or a fault. The case needs review; this demo cannot approve compensation.',help:'Name the product or share its link and what you want to check. I will use only the description I read, not assumptions.'}
};
const texts=key=>Object.fromEntries(['ru','lv','en'].map(l=>[l,copy[l][key]]));
const baseCard=(id,topic,key,source='contact',review=true)=>({id,topic,source,...texts(key),requiresReview:review});
export const pilotTenants=Object.freeze(Object.fromEntries(pilotProfiles.map(p=>{
 const sources=Object.fromEntries(pilotSources.filter(s=>s.id.startsWith(p.id+'-')).map(s=>[s.id,{url:s.url,title:s.id.replace(p.id+'-','')} ]));
 sources.contact={title:p.name,url:p.home};
 const approved=(id,topic,card)=>({id,topic,source:card.sources[0],...card.answer,requiresReview:card.kind==='handoff'||card.kind==='conflict'});
 const cards=p.cards.filter(c=>c.sources.length).map(c=>approved(c.id==='return-policy'||c.id==='cut-return'?'return':c.id==='opening'?'hours':c.id==='visit'?'pickup':c.id,c.topic==='returns'?'returns':c.topic,c));
 const has=id=>cards.some(c=>c.id===id),delivery=cards.find(c=>c.id==='delivery');
 if(!has('shipping-cost'))cards.push(delivery?{...delivery,id:'shipping-cost'}:baseCard('shipping-cost','delivery','unknown'));
 if(!has('timing'))cards.push(delivery&&/days|time|estimate/iu.test(delivery.en)?{...delivery,id:'timing'}:baseCard('timing','delivery','unknown'));
 if(!has('pickup'))cards.push(baseCard('pickup','delivery','unknown'));
 if(!has('payment'))cards.push(baseCard('payment','payment','unknown'));
 if(!has('return'))cards.push(baseCard('return','returns','return'));
 if(!has('return-process'))cards.push({...cards.find(c=>c.id==='return'),id:'return-process'});
 if(!has('warranty'))cards.push(baseCard('warranty','warranty','warranty'));
 cards.push(baseCard('status','order','status'),baseCard('payment-problem','payment','status'),baseCard('defect','warranty','defect'));
 cards.push({id:'contact',topic:'contact',source:'contact',requiresReview:true,...Object.fromEntries(['ru','lv','en'].map(l=>[l,`${p.name}: ${p.contact}. ${copy[l].status}`]))});
 for(const c of p.cards.filter(c=>!c.sources.length))cards.push({id:'pilot-'+c.id,topic:'product',source:'contact',...c.answer,requiresReview:false});
 return [p.id,{id:p.id,name:p.name,homepage:p.home,checked:p.checkedOn,release:'preview',contact:{email:p.contact,source:p.home},sources,cards}];
})));
export function pilotAvailable(id,env){return Object.hasOwn(pilotTenants,id)&&env.NEXT_BATCH_ENABLED==='true'&&env.TENANT_ID===id;}
export const pilotHelp=Object.fromEntries(['ru','lv','en'].map(l=>[l,Object.fromEntries(pilotProfiles.map(p=>[p.id,copy[l].help]))]));
export const pilotDomains={dzijas:/пряж|моток|спиц|dzija|dziju|yarn|drops|needle/iu,jig:/спиннинг|удилищ|леск|приманк|катуш|rod|lure|reel|braid|spining|aukla|spole/iu,musiclab:/микрофон|интерфейс|монитор|midi|phantom|microphone|interface|monitor|mikrofon|interfeis/iu,etextile:/кож|бегунок|молни|пресс|фурнит|нитк|leather|slider|zipper|press|thread|āda|kursor|rāvējslēdz|prese/iu,zummers:/гитар|кабел|усилит|колон|guitar|cable|amplifier|speaker|ģitār|kabel|skaļrun/iu};
