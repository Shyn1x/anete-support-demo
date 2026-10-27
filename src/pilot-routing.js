// Preview-only routing of reviewed policy and clarification cards. Product
// specifications still require catalogue evidence; these rules invent none.
import {pilotProfiles} from './pilot-profiles.js';
export const PILOT_BUYER_REVISION='pilot-buyer-v3';
const policy={
 delivery:/достав|пересыл|отправ.{0,25}(?:omniva|пакомат)|shipping|delivery|deliver\b|piegād|piegad|pakomāt|pakomat|omniva/iu,
 pickup:/самовывоз|забрат|получ.{0,20}магазин|адрес|pick.?up|collect(?:ion)?|address|saņemt.{0,25}veikal|saņemšan|izņemt|adrese/iu,
 payment:/оплат|платить|сч[её]т|payment|\bpay\b|invoice|apmak|maksāt|maksat|rēķin/iu,
 opening:/время.{0,15}работ|график|открыт|opening|hours|open on|darba laik|atvērts/iu,
 returns:/возврат|вернут|return|refund|atgrie|atteikum/iu
};
const cardId=id=>id==='return-policy'||id==='cut-return'?'return':id==='opening'?'hours':id==='visit'?'pickup':id;
const matches=(card,text)=>(policy[card.topic]?.test(text)??false)||card.patterns.some(p=>new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${p})`,'iu').test(text));
export function pilotPriorityRoute(text,tenant){
 if(tenant?.release!=='preview')return null;
 const negated=/\b(?:no employee|employee (?:is )?not needed|do not|don't|dont)\b|не (?:нужен|хочу)|nevēlos|nevajag/iu.test(text);
 const employee=/(?:need|want|find|get|speak to|talk to|connect).{0,30}\bemployee\b|^employee[!.? ]*$/iu.test(text);
 if(employee&&!negated)return {ids:['contact'],kind:'answer',handoff:true};
 const status=/где.{0,35}(?:мой заказ|моя посылка)|where (?:is|are|was) (?:my|the) (?:order|parcel)|track my order|kur (?:ir|atrodas|palicis).{0,35}pasūtījum/iu.test(text);
 return status?{ids:['status'],kind:'answer',handoff:true}:null;
}
export function pilotReferenceRoute(text,tenant){
 if(tenant?.release!=='preview')return null;
 const profile=pilotProfiles.find(p=>p.id===tenant.id);
 if(!profile)return null;
 const cards=profile.cards.filter(c=>matches(c,text));
 // Policies precede product words ("collect my yarn"). Several clauses are
 // split by the shared router before this function is called.
 const selected=cards.filter(c=>c.sources.length);
 if(selected.length){const ids=[...new Set(selected.map(c=>cardId(c.id)))].slice(0,3);return {ids,kind:'answer',handoff:selected.some(c=>['handoff','conflict'].includes(c.kind))};}
 const clarification=cards.find(c=>!c.sources.length);
 return clarification?{ids:['pilot-'+clarification.id],kind:'product-clarify',handoff:false}:null;
}
