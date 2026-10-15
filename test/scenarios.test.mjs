import test from 'node:test';import assert from 'node:assert/strict';
import {scenarios} from './scenarios.mjs';import {preflight,referenceRoute,render,aiRoute} from '../src/core.js';import {getTenant} from '../src/kb.js';import {createWorker} from '../src/worker.js';import {environment,request} from './helpers.mjs';
for(const [i,[locale,message,expected]] of scenarios.entries()){
 test(`scenario ${i+1} ${locale}: ${message}`,async()=>{
  const safety=preflight(message),route=safety?{ids:[],kind:safety,handoff:false}:referenceRoute(message);
  assert.equal(route.ids[0]||route.kind,expected);
  const {env}=environment();const res=await createWorker(()=>{throw Error('No network allowed');}).fetch(request('/api/chat',{tenant:'anete',locale,message}),env);
  assert.equal(res.status,200);const body=await res.json();assert.ok(body.text.length>5);
  assert.equal(body.cardIds[0]||(safety||route.kind),expected);
  assert.equal(body.mode,safety?'safety':'reference');
  if(route.ids.length){assert.ok(body.sources.length);assert.ok(body.text.includes(getTenant('anete').cards.find(c=>c.id===expected)[locale]));}
 });
}
test('all scenario IDs are distinct and three-language coverage is balanced',()=>{assert.equal(scenarios.length,108);assert.equal(new Set(scenarios.map(s=>s[1])).size,108);for(const locale of ['ru','lv','en'])assert.equal(scenarios.filter(s=>s[0]===locale).length,36);});
test('AI classifier catalog supports every approved answer in all three locales',async()=>{
 for(const card of getTenant('anete').cards){for(const locale of ['ru','lv','en']){
  const route=await aiRoute(getTenant('anete'),'synthetic question',null);
  const selected=route.parse({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({ids:[card.id],handoff:false})}]}]});
  const answer=render('anete',locale,selected,'ai');assert.ok(answer.text.includes(card[locale]));assert.ok(answer.sources.length);
 }}
});
