import test from 'node:test';import assert from 'node:assert/strict';
import {referenceRoute,render,aiRoute} from '../src/core.js';import {getTenant} from '../src/kb.js';import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
const cases=[
 ['rotallieta','toy-age',['Возраст Busy Board HE0545?','Kāds vecums Busy Board HE0545?','Busy Board HE0545 age?']],
 ['rotallieta','toy-batteries',['Какие батарейки Busy Board HE0545?','Kādas baterijas Busy Board HE0545?','Busy Board HE0545 batteries included?']],
 ['rotallieta','toy-dimensions',['Размер Busy Board HE0545?','Busy Board HE0545 izmēri?','Busy Board HE0545 dimensions?']],
 ['bariba','food-composition',['CooKing Lamb содержит курицу?','CooKing Lamb sastāvs un vista?','CooKing Lamb chicken ingredients?']],
 ['bariba','food-stage',['CooKing Lamb для взрослых или щенков?','CooKing Lamb pieaugušiem vai kucēniem?','CooKing Lamb adult or puppy food?']],
 ['bariba','food-pack',['CooKing Lamb фасовка?','CooKing Lamb iepakojums?','CooKing Lamb pack weight?']],
 ['hobbyset','art-beginner',['POP ART для начинающего?','POP ART iesācējiem?','POP ART for beginners?']],
 ['hobbyset','art-pack',['POP ART сколько тюбиков?','POP ART cik tūbiņu?','POP ART how many tubes?']],
 ['hobbyset','art-colours',['POP ART какие цвета?','POP ART kādi toņi?','POP ART colours?']],
 ['apavi40plus','shoe-width',['42801 какая ширина?','42801 kāds platums?','42801 width?']],
 ['apavi40plus','shoe-material',['42801 какой материал?','42801 kāds materiāls?','42801 leather material?']],
 ['apavi40plus','shoe-insole',['42801 съёмная стелька?','42801 izņemama iekšzole?','42801 removable insole?']],
 ['celotajs','sleep-ratings',['Спальник comfort limit extreme?','Guļammaiss comfort limit extreme?','Sleeping bag comfort limit extreme?']],
 ['celotajs','sleep-factors',['Спальник ветер и влажность?','Guļammaiss vējš un mitrums?','Sleeping bag wind and moisture?']],
 ['celotajs','sleep-guide',['Спальник руководство для новичка?','Guļammaiss iesācēja ceļvedis?','Sleeping bag beginner guide?']]
];
for(const [tenant,id,queries] of cases)for(const [i,locale] of ['ru','lv','en'].entries())test(`niche ${tenant} ${id} ${locale}: sourced answer without API even when enabled`,async()=>{
 const message=queries[i];const ai=await aiRoute(getTenant(tenant),message,null);const parsed=ai.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:[id],handoff:false})}]}]});assert.deepEqual(parsed.ids,[id]);const route=referenceRoute(message,null,tenant);assert.ok(route.ids.includes(id));assert.equal(route.handoff,false);
 const {env}=environment({AI_ENABLED:'true',OPENAI_API_KEY:'test-placeholder-no-real-key',DEMO_PASSWORD:'test-only-password-123',TENANT_ID:tenant});let calls=0;
 const worker=createWorker(()=>{calls++;throw Error('Paid provider forbidden');});const login=await worker.fetch(request('/api/login',{password:env.DEMO_PASSWORD}),env);const cookie=login.headers.get('Set-Cookie').split(';')[0];const res=await worker.fetch(request('/api/chat',{tenant,locale,message},{headers:{cookie}}),env);
 assert.equal(res.status,200);const out=await res.json();assert.equal(calls,0);assert.equal(out.providerUsed,false);assert.ok(out.cardIds.includes(id));assert.ok(out.sources.some(s=>s.url===getTenant(tenant).sources['niche-product'].url));assert.ok(out.text.includes(getTenant(tenant).cards.find(c=>c.id===id)[locale]));
});
for(const tenant of ['rotallieta','bariba','hobbyset','apavi40plus','celotajs']){
 test(`${tenant}: other shop model cannot unlock niche facts`,()=>{const q=tenant==='apavi40plus'?'Busy Board HE0545 batteries?':'42801 removable insole?';const r=referenceRoute(q,null,tenant);assert.ok(r.ids.every(id=>getTenant(tenant).cards.find(c=>c.id===id)?.source!=='niche-product'));});
 test(`${tenant}: AI cannot select product facts without matching query`,async()=>{const route=await aiRoute(getTenant(tenant),'Tell me about an unknown model',null);const card=getTenant(tenant).cards.find(c=>c.source==='niche-product');const out=route.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:[card.id],handoff:false})}]}]});assert.equal(out.kind,'product-clarify');assert.deepEqual(out.ids,[]);});
}
for(const [tenant,q] of [['rotallieta','Busy Board HE0545 in stock?'],['bariba','CooKing Lamb expiry date?'],['hobbyset','POP ART price?'],['apavi40plus','42801 available today?'],['celotajs','Sleeping bag price today?']])test(`${tenant}: dynamic data never replaced with static specifications`,()=>{const out=render(tenant,'en',referenceRoute(q,null,tenant),'reference');assert.deepEqual(out.cardIds,[]);assert.match(out.text,/cannot access current stock/);});
