import {RESERVE_MICRO_USD} from './core.js';
const json=(x,status=200)=>Response.json(x,{status});
const cap=(value,fallback,max)=>{const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,max):fallback;};
// User-authorized on 15 Oct 2026: fixed USD 0.90 additional reservation allowance.
// Originally 45 attempts at USD 0.02; its dollar amount is unchanged.
// Fixed date and fixed amount: the exception cannot roll forward or reset counters.
export function dailyReservationLimit(env,day){
 const base=cap(env.DAILY_BUDGET_MICRO_USD,500000,500000);
 const extra=day==='2026-10-15'&&env.LIVE_EVAL_EXTRA_DAY==='2026-10-15'?900000:0;
 return base+extra;
}
export class BudgetGuard {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 now(){return Date.now();}
 async fetch(request){
  if(new URL(request.url).pathname==='/status'&&request.method==='GET'){
   const ip=request.headers.get('X-Demo-Client');if(!/^[a-f0-9]{64}$/.test(ip||''))return json({error:'invalid'},400);
   const now=this.now(),day=new Date(now).toISOString().slice(0,10),minute=Math.floor(now/60000);
   const dailyLimit=dailyReservationLimit(this.env,day),totalLimit=cap(this.env.TOTAL_BUDGET_MICRO_USD,5000000,5000000);
   return this.ctx.storage.transaction(async tx=>{
    const state=await tx.get('state')||{total:0,day,daily:0,ips:{}};
    const dailyUsed=state.day===day?state.daily:0,entry=state.day===day?state.ips[ip]:null;
    const dailyRemaining=Math.max(0,dailyLimit-dailyUsed),totalRemaining=Math.max(0,totalLimit-state.total);
    const minuteRemaining=Math.max(0,10-(entry?.minute===minute?entry.chat:0)),dayRemaining=Math.max(0,100-(entry?.dayChat||0));
    const budgetCalls=Math.floor(Math.min(dailyRemaining,totalRemaining)/RESERVE_MICRO_USD);
    const blockedBy=totalRemaining<RESERVE_MICRO_USD?'total_budget':dailyRemaining<RESERVE_MICRO_USD?'daily_budget':minuteRemaining===0?'minute_rate':dayRemaining===0?'day_rate':null;
    return json({kind:'reservation_estimate_not_invoice',scope:'all_shops',dayUTC:day,perCallMicroUSD:RESERVE_MICRO_USD,daily:{limitMicroUSD:dailyLimit,reservedMicroUSD:dailyUsed,remainingMicroUSD:dailyRemaining},total:{limitMicroUSD:totalLimit,reservedMicroUSD:state.total,remainingMicroUSD:totalRemaining},budgetCallsRemaining:budgetCalls,clientRate:{minuteRemaining,dayRemaining},callsAvailableNow:Math.min(budgetCalls,minuteRemaining,dayRemaining),blockedBy,nextDayUTC:new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString(),nextMinuteUTC:new Date((minute+1)*60000).toISOString()});
   });
  }
  if(request.method!=='POST')return json({error:'method'},405);
  const {ip,kind,reserve}=await request.json();
  if(!/^[a-f0-9]{64}$/.test(ip)||!['auth','chat'].includes(kind)||typeof reserve!=='boolean')return json({error:'invalid'},400);
  const now=this.now(),day=new Date(now).toISOString().slice(0,10),minute=Math.floor(now/60000);
  const daily=dailyReservationLimit(this.env,day),total=cap(this.env.TOTAL_BUDGET_MICRO_USD,5000000,5000000);
  return this.ctx.storage.transaction(async tx=>{
   const state=await tx.get('state')||{total:0,day,daily:0,ips:{}};
   if(state.day!==day){state.day=day;state.daily=0;state.ips={};}
   if(!state.ips[ip]&&Object.keys(state.ips).length>=2000)return json({error:'rate_limit'},429);
   const entry=state.ips[ip]||{minute,chat:0,auth:0,dayChat:0};
   if(entry.minute!==minute){entry.minute=minute;entry.chat=0;entry.auth=0;}
   if((kind==='auth'&&entry.auth>=5)||(kind==='chat'&&entry.chat>=10))return json({error:'rate_limit',reason:'minute_rate',retryAt:new Date((minute+1)*60000).toISOString()},429);
   if(kind==='chat'&&entry.dayChat>=100)return json({error:'rate_limit',reason:'day_rate',retryAt:new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString()},429);
   if(reserve&&state.total+RESERVE_MICRO_USD>total)return json({error:'budget_exhausted',reason:'total_budget',retryAt:null},429);
   if(reserve&&state.daily+RESERVE_MICRO_USD>daily)return json({error:'budget_exhausted',reason:'daily_budget',retryAt:new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString()},429);
   entry[kind]++;if(kind==='chat')entry.dayChat++;
   state.ips[ip]=entry;
   if(reserve){state.daily+=RESERVE_MICRO_USD;state.total+=RESERVE_MICRO_USD;}
   await tx.put('state',state);
   return json({ok:true});
  });
 }
}
