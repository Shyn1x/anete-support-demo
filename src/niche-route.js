// Conservative free routing: identify a verified model before answering product facts.
const rules={
 rotallieta:{model:/busy\s*board|бизи\s*борд|he0545/i,questions:[['toy-batteries',/батар|батаре|bater|batter/],['toy-age',/возраст|месяц|лет|реб[её]н|vecum|mēne|men[eš]|age|month|child|small parts|мелк|sīk/],['toy-dimensions',/размер|габарит|упаков|izm[eē]r|iepako|dimension|size|packag/]]},
 bariba:{model:/(?:cooking|кукинг).*(?:lamb|ягн|jēr|jer)|(?:lamb|ягн|jēr|jer).*(?:cooking|кукинг)/i,questions:[['food-composition',/состав|куриц|курин|ингреди|sast[aā]v|vist|ingredient|chicken/],['food-stage',/возраст|взросл|щен|vecum|pieaugu|kuc[eē]n|age|adult|pupp/],['food-pack',/фасов|пачк|мешок|вес|килограмм|iepako|svars|pack|weight|\bkg\b|кг/]]},
 hobbyset:{model:/pop\s*art|поп\s*арт/i,questions:[['art-beginner',/начина|студент|iesāc|iesac|student|beginner|starter/],['art-colours',/цвет|оттен|краск.{0,10}какие|to[nņ]|krās|kras|colo[u]?r/],['art-pack',/комплект|объ[её]м|тюбик|сколько|что.{0,10}входит|komplekt|tilpum|tūbi|tubi|cik|contain|tube|volume|how many/]]},
 apavi40plus:{model:/42801/i,questions:[['shoe-width',/ширин|полн[оы]т|plat|width|wide/],['shoe-insole',/стельк|iekšzol|iekszol|insole/],['shoe-material',/материал|кож|подклад|materi[aā]l|[aā]da|oder|leather|lining/]]},
 celotajs:{model:/спальник|спальн.{0,5}меш|gu[lļ]ammais|sleeping\s*bag|comfort|extreme/i,questions:[['sleep-ratings',/comfort|limit|extreme|комфорт|лимит|экстр|temperat|температур|grād/],['sleep-factors',/ветер|влажност|коврик|устал|одежд|wind|moist|mat\b|fatigue|cloth|vēj|mitrum|paklāj|nogurum|apģērb/],['sleep-guide',/руковод|нович|выбор|выбрать|ceļved|izvēl|iesāc|guide|beginner|choose/]]}
};
const priority=/оператор|сотрудник|человек|связаться|human|agent|contact|darbiniek|sazin|слом|брак|поврежд|broken|faulty|damag|defect|bojā|salūz|аллерг|лечени|allerg|ārst|arst|гарантиру|guarantee|garantē|безопасно|safe at|droši pie|где.{0,12}заказ|order status|kur.{0,12}pasūt/iu;
const policy=/достав|возврат|оплат|гарант|pieg[aā]d|atgrie|apmaks|garant|delivery|shipping|return|payment|warranty/iu;
const live=/налич|сейчас|сегодня|цена|цене|стоим|срок.{0,8}годност|in stock|availab|price|today|expiry|expir|pieejam|noliktav|šodien|cena|derīg/iu;
export function nicheRoute(s,tenantId){
 const rule=rules[tenantId];if(!rule||policy.test(s))return null;
 if(tenantId==='apavi40plus'&&/размерн.{0,8}(сетк|таблиц)|таблиц.{0,10}размер|size.{0,4}chart|sizing.{0,4}(chart|table)|izm[eē]ru.{0,4}tabul/iu.test(s))return {ids:[],kind:'product-sizing',handoff:false};
 if(rule.model.test(s)&&priority.test(s))return {ids:['contact'],kind:'answer',handoff:true};
 if(live.test(s)&&rule.model.test(s))return {ids:[],kind:'product-live',handoff:false};
 if(!rule.model.test(s)){
  // No model inferred from a topic or another shop's catalog.
  if(/батарей|батаре|стельк|ширин.{0,10}(обув|туф)|состав.{0,10}корм|batter|insole|food ingredients|baterij|iekšzol/iu.test(s))return {ids:[],kind:'product-clarify',handoff:false};
  return null;
 }
 const ids=rule.questions.filter(([,re])=>re.test(s)).map(([id])=>id);
 return ids.length?{ids:ids.slice(0,3),kind:'answer',handoff:false}:{ids:[],kind:'product-clarify',handoff:false};
}
