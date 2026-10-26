// Deterministic shopper rehearsal through the actual shared Worker. No model,
// merchant fetches, deployed sessions or production budget objects are used.
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createWorker} from '../src/worker.js';
import {getTenant} from '../src/kb.js';
import {environment,request} from '../test/helpers.mjs';
import {buyerCases} from '../staging/next-batch/buyer-cases.mjs';
export const PILOT_IDS=['dzijas','jig','musiclab','etextile','zummers'];
const mapId=(tenant,id)=>id==='opening'?'hours':id==='visit'?'pickup':id==='cut-return'||id==='return-policy'?'return':getTenant(tenant).cards.some(c=>c.id===id)?id:'pilot-'+id;
const combined={dzijas:[['pickup','pilot-quantity'],['delivery','pilot-quantity']],jig:[['delivery','pilot-reel'],['pickup','pilot-line']],musiclab:[['delivery','pilot-interface'],['pickup','pilot-monitor']],etextile:[['delivery','pilot-leather'],['payment','pilot-adhesive']],zummers:[['delivery','pilot-guitar'],['pickup','pilot-cable']]};
export function pilotBuyerCases(){return PILOT_IDS.flatMap(tenant=>[
 ...buyerCases[tenant].map(([message,card,kind,locale],i)=>({id:tenant+'-'+String(i+1).padStart(2,'0'),tenant,message,locale,kind,cards:card?[mapId(tenant,card)]:i===8||i===9?combined[tenant][i-8]:[],group:i<3?'policy':i<8?'niche':i<10?'combined':'support-safety-social'})),
 ...[
  {message:'Какие способы доставки есть?',locale:'ru',cards:['delivery'],kind:'fact'},
  {message:'А сколько это стоит?',locale:'ru',cards:['shipping-cost'],kind:'fact'},
  {message:'Please explain it more simply',locale:'en',cards:['shipping-cost'],kind:'fact'},
  {message:'Paldies, jauku dienu!',locale:'lv',cards:[],kind:'social'},
  {message:'Спасибо, но посылка пришла сломанной. Что делать?',locale:'ru',cards:['defect'],kind:'handoff'}
 ].map((c,i)=>({...c,id:tenant+'-thread-'+(i+1),tenant,group:'thread',thread:'delivery'}))
 ]);}
export function assessPilotBuyer(c,answer,status=200){
 const issues=[];
 if(status!==200)issues.push('http:'+status);
 if(answer.locale!==c.locale)issues.push('language:'+answer.locale);
 if(typeof answer.text!=='string'||!answer.text.trim())issues.push('empty-answer');
 for(const id of c.cards)if(!answer.cardIds?.includes(id))issues.push('missing-topic:'+id);
 if(c.kind==='handoff'&&!answer.handoff)issues.push('missing-shop-review');
 if(c.kind==='social'&&(answer.mode!=='social'||answer.handoff||/[?？]/u.test(answer.text||'')))issues.push('farewell-followup-or-escalation');
 if(c.kind==='privacy'&&(answer.mode!=='safety'||/buyer@example\.test|not-a-real-password|4111|20000000/u.test(answer.text||'')))issues.push('privacy');
 if(['fact','clarify'].includes(c.kind)&&c.cards.every(id=>!getTenant(c.tenant).cards.find(card=>card.id===id)?.requiresReview)&&!c.cards.includes('shipping-cost')&&answer.handoff)issues.push('unnecessary-shop-review');
 const hosts=new Set(Object.values(getTenant(c.tenant).sources).map(s=>new URL(s.url).hostname));
 for(const source of answer.sources||[])try{const u=new URL(source.url);if(u.protocol!=='https:'||!hosts.has(u.hostname))issues.push('foreign-source');}catch{issues.push('invalid-source');}
 return {pass:issues.length===0,issues,requiresHumanReview:true};
}
export async function auditPilotBuyers(){
 const cases=pilotBuyerCases(),rows=[];let forbiddenCalls=0;
 for(const tenant of PILOT_IDS){
  const {env,guard,storage}=environment({TENANT_ID:tenant,NEXT_BATCH_ENABLED:'true',DEMO_PASSWORD:'synthetic-local-audit-password',AI_CONVERSATIONAL:'true',CATALOG_ENABLED:'true'});
  env.ASSETS={fetch:async req=>{try{const pathname=new URL(req.url).pathname;return Response.json(JSON.parse(await readFile(new URL('../dist/pilots/'+tenant+pathname,import.meta.url),'utf8')));}catch{return new Response('missing',{status:404});}}};
  let time=Date.parse('2026-10-26T12:00:00Z');guard.now=()=>time;
  const worker=createWorker(async()=>{forbiddenCalls++;throw Error('External network forbidden in offline audit');});
  const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);
  if(login.status!==200)throw Error('Local synthetic login failed');
  const cookie=login.headers.get('set-cookie').split(';')[0];let history=[],previousTopic=null;
  for(const c of cases.filter(c=>c.tenant===tenant)){
   time+=8000; // Test-clock only: exercise normal rate accounting, never sleep.
   if(!c.thread){history=[];previousTopic=null;}
   const body={tenant,locale:'ru',message:c.message,history,previousTopic};
   const res=await worker.fetch(request('/api/chat',body,{headers:{cookie}}),env),answer=await res.json();
   rows.push({id:c.id,group:c.group,tenant,question:c.message,expected:{locale:c.locale,kind:c.kind,cards:c.cards},requestSha256:createHash('sha256').update(JSON.stringify(body)).digest('hex'),httpStatus:res.status,answer,assessment:assessPilotBuyer(c,answer,res.status)});
   history=[...history,{role:'user',text:c.message.slice(0,400)},{role:'assistant',text:(answer.text||'').slice(0,400)}].slice(-4);previousTopic=answer.topic||null;
  }
  if((storage.records.get('state')?.total||0)!==0)throw Error('Unexpected test-provider reservation');
 }
 return {schema:'pilot-worker-buyer-audit-v1',createdAt:new Date().toISOString(),scope:'100 shopper requests through the real Worker, local synthetic auth and clock, reference answers; NOT live-model quality',providerCalls:0,apiCostUsd:0,forbiddenNetworkAttempts:forbiddenCalls,total:rows.length,passed:rows.filter(r=>r.assessment.pass).length,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const output=process.argv[2];if(!output)throw Error('Supply a NEW output path; reports cannot be overwritten.');
 const report=await auditPilotBuyers();await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',encoding:'utf8'});
 console.log(JSON.stringify({total:report.total,passed:report.passed,forbiddenNetworkAttempts:report.forbiddenNetworkAttempts,providerCalls:0,report:output},null,2));if(report.passed!==report.total||report.forbiddenNetworkAttempts)process.exitCode=1;
}
