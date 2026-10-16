import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CASES,SHOPS,assess,summary,safeAnswer,stopReason,runShop} from '../scripts/run-live-50.mjs';
const good={locale:'ru',text:'Проверенный ответ',cardIds:['delivery'],sources:[{url:'https://bariba.lv/info'}],handoff:false,mode:'ai',providerUsed:true,conversational:true,topic:'delivery'};
test('exactly 50 unique scenarios, 10 per tenant; languages, niche, typo and control coverage',()=>{
 assert.equal(CASES.length,50);assert.equal(new Set(CASES.map(c=>c.id)).size,50);
 for(const s of SHOPS){const cases=CASES.filter(c=>c.tenant===s.id);assert.equal(cases.length,10);for(const locale of ['ru','lv','en'])assert(cases.some(c=>c.locale===locale));assert(cases.some(c=>c.safety));assert(cases.some(c=>c.social));assert(cases.some(c=>c.message==='Гарнтия'));assert.equal(cases.filter(c=>c.thread).length,3);}
 assert.equal(CASES.filter(c=>c.ai).length,35);
});
test('actual generation is distinguished from selector or reference fallback',()=>{
 const c=CASES[0];assert.equal(assess(c,good,['bariba.lv']).pass,true);
 for(const d of [{...good,conversational:false},{...good,mode:'reference'},{...good,providerUsed:false}])assert.equal(assess(c,d,['bariba.lv']).pass,false);
 assert.equal(summary([{state:'complete',assessment:assess(c,{...good,mode:'reference'},['bariba.lv']),answer:good}]).generatedAI,0);
});
test('wrong locale, host, handoff and absent sources fail',()=>{
 for(const d of [{...good,locale:'en'},{...good,sources:[{url:'https://evil.example/'}]},{...good,sources:[]},{...good,handoff:true}])assert.equal(assess({...CASES[0],handoff:false},d,['bariba.lv']).pass,false);
});
test('budgets, rate limits, auth and provider fallback stop',()=>{
 for(const [status,d] of [[200,{fallbackReason:'daily_budget'}],[200,{fallbackReason:'total_budget'}],[200,{fallbackReason:'answer_validation'}],[429,{error:'rate_limit'}],[401,{}],[503,{}]])assert(stopReason(status,d));
 assert.equal(stopReason(200,good),null);
});
test('only safe response fields enter reports',()=>{const d=safeAnswer({...good,password:'secret',cookie:'cookie',headers:{Authorization:'key'},apiKey:'key'});assert.equal(d.password,undefined);assert.equal(d.cookie,undefined);assert.equal(d.headers,undefined);assert.equal(d.apiKey,undefined);});
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'live50-'));try{await fn(join(dir,'report.json'));}finally{await rm(dir,{recursive:true,force:true});}}
test('checkpoint exists before request; dialogue and language switching travel to server',()=>fixture(async path=>{
 const report={rows:[]};let calls=0;const cases=CASES.slice(0,3);
 const fetcher=async (url,options)=>{const onDisk=JSON.parse(await readFile(path));assert.equal(onDisk.rows.at(-1).state,'pending');const body=JSON.parse(options.body);assert.equal(body.tenant,'bariba');assert.equal(options.headers.Cookie,'demo_session=local');assert.equal(body.history.length,calls*2);const c=cases[calls++];return {status:200,json:async()=>({...good,locale:c.locale,cardIds:c.cards,topic:c.cards[0]})};};
 await runShop({shop:SHOPS[0],cases,report,path,cookie:'demo_session=local',allowedHosts:['bariba.lv'],fetcher,wait:async()=>{}});
 assert.equal(calls,3);assert.equal(summary(report.rows).passed,3);assert(!(await readFile(path,'utf8')).includes('demo_session'));
}));
test('budget denied is resumable without marking test completed or retrying',()=>fixture(async path=>{const report={rows:[]};let calls=0;const stop=await runShop({shop:SHOPS[0],cases:CASES.slice(0,2),report,path,cookie:'x',allowedHosts:[],wait:async()=>{},fetcher:async()=>{calls++;return {status:200,json:async()=>({fallbackReason:'daily_budget'})};}});assert(stop);assert.equal(calls,1);assert.equal(report.rows.length,0);}));
test('ambiguous calls are never repeated on resume',()=>fixture(async path=>{const report={rows:[]};let calls=0;const args={shop:SHOPS[0],cases:CASES.slice(0,1),report,path,cookie:'x',allowedHosts:[],wait:async()=>{},fetcher:async()=>{calls++;throw Error('network');}};assert(await runShop(args));assert.equal(report.rows[0].state,'ambiguous');await runShop(args);assert.equal(calls,1);}));
test('completed calls are skipped on resume',()=>fixture(async path=>{const c=CASES[0],report={rows:[{id:c.id,state:'complete',answer:good,assessment:assess(c,good,['bariba.lv'])}]};await runShop({shop:SHOPS[0],cases:[c],report,path,cookie:'x',allowedHosts:[],wait:async()=>{},fetcher:async()=>{throw Error('must not fetch');}});assert.equal(report.rows.length,1);}));
