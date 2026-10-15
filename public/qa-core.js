export function assess(item,data){
 const notes=[];
 if(data.locale!==item.locale)notes.push('language');
 if(typeof data.text!=='string'||!data.text.trim())notes.push('empty_answer');
 if(!Array.isArray(data.cardIds))notes.push('invalid_cards');
 else if(item.anyCards.length&&!item.anyCards.some(id=>data.cardIds.includes(id)))notes.push('topic');
 else if(!item.anyCards.length&&data.cardIds.length)notes.push('unexpected_topic');
 if(data.handoff!==item.handoff)notes.push('handoff');
 if(item.mode&&data.mode!==item.mode)notes.push('mode');
 if(data.cardIds?.length&&!data.sources?.length)notes.push('missing_sources');
 return {pass:notes.length===0,notes};
}
export function report(version,items,rows){
 return {suite:version,exportedAt:new Date().toISOString(),totalCases:items.length,attempted:rows.length,completed:rows.filter(r=>r.state!=='pending').length,unresolved:rows.filter(r=>r.state==='pending').length,providerResponses:rows.filter(r=>r.answer?.providerUsed===true).length,preliminaryPass:rows.filter(r=>r.assessment?.pass).length,requiresHumanReview:true,costNote:'No measured provider bill or token usage is available. Each attempted AI call reserves USD 0.02; non-AI cases do not. Existing daily/lifetime guards remain unchanged.',rows};
}
export async function runCases({items,rows,request,onResult,signal,pause=ms=>new Promise(r=>setTimeout(r,ms)),interval=7000}){
 const done=new Set(rows.map(row=>row.id));
 for(const item of items){
  if(signal.aborted)return {reason:'paused'};
  if(done.has(item.id))continue;
  let response;
  const started=Date.now(),row={...item,state:'pending',at:new Date().toISOString(),error:'interrupted_or_pending',assessment:{pass:false,notes:['unresolved_attempt']}};
  rows.push(row);onResult(row);
  try{response=await request(item,signal);}catch(error){
   // The request may already have reached OpenAI, including on user cancellation.
   // An ambiguous network failure may already have consumed a reservation. Never retry it.
   Object.assign(row,{state:'done',elapsedMs:Date.now()-started,error:signal.aborted?'aborted_ambiguous':'network_or_timeout',assessment:{pass:false,notes:['transport']}});onResult(row);return {reason:signal.aborted?'paused':'transport'};
  }
  const data=await response.json().catch(()=>({error:'invalid_json'}));
  if(response.status===401){rows.pop();onResult(null);return {reason:'login'};}
  if(response.status===429){rows.pop();onResult(null);return {reason:data.error==='budget_exhausted'?'budget':'rate'};}
  if(!response.ok){Object.assign(row,{state:'done',elapsedMs:Date.now()-started,status:response.status,error:data.error||'http_error',assessment:{pass:false,notes:['service']}});onResult(row);return {reason:'service'};}
  Object.assign(row,{state:'done',elapsedMs:Date.now()-started,status:response.status,error:null,answer:data,assessment:assess(item,data)});onResult(row);
  if(!signal.aborted&&rows.length<items.length)await pause(interval);
 }
 return {reason:'complete'};
}
