import test from 'node:test';
import assert from 'node:assert/strict';
import {checks,checkOne,runAudit} from '../scripts/audit-next-batch.mjs';
import {profiles,getDraft} from '../staging/next-batch/profiles.mjs';
import {reply,preparedAnswer} from '../staging/next-batch/dialogue.mjs';
import {createConversation} from '../staging/next-batch/conversation.mjs';

for(const check of checks())test(`draft audit ${check.group}: ${check.id}`,()=>{
 const result=checkOne(check);assert.deepEqual(result.errors,[],JSON.stringify(result));
});
for(const profile of profiles){
 test(`${profile.id}: source arrays returned to a caller cannot poison the next response`,()=>{
  const first=reply(profile,'Как доставят заказ?');first.sources.push('foreign-source');
  assert.ok(!reply(profile,'Как доставят заказ?').sources.includes('foreign-source'));
 });
 test(`${profile.id}: question after a product noun keeps the actual pickup intent`,()=>{
  const got=reply(profile,'Can I collect this item in person?','en');assert.notEqual(got.kind,'handoff');
 });
 test(`${profile.id}: language switches, ambiguous URL keeps chosen language, goodbye clears topic`,()=>{
  const session=createConversation(profile);
  assert.equal(session.next('What is the delivery cost?').locale,'en');
  assert.equal(session.next('Kāda ir piegāde?').locale,'lv');
  const linked=session.next(profile.home+'products/demo');assert.equal(linked.locale,'lv');assert.equal(linked.kind,'product-pending');
  assert.equal(session.next('Сколько доставка?').locale,'ru');
  const bye=session.next('Спасибо, до свидания!');assert.equal(bye.kind,'social');assert.doesNotMatch(bye.answer,/[?？]/u);
  assert.equal(session.snapshot().lastCardId,null);assert.equal(session.next('А сколько стоит?').contextUsed,false);
 });
 for(const [locale,first,follow] of [['ru','Сколько стоит доставка?','А сколько стоит?'],['lv','Cik maksā piegāde?','Cik maksā?'],['en','What is the delivery cost?','How much?']])test(`${profile.id}: bounded ${locale} follow-up reuses only its own published terms`,()=>{
  const session=createConversation(profile,locale),a=session.next(first),b=session.next(follow);
  assert.ok(a.cardId);assert.equal(b.contextUsed,true);assert.equal(b.locale,locale);
  if(profile.id==='musiclab'){
   assert.equal(b.kind,'clarify');assert.equal(b.cardId,null);assert.deepEqual(b.sources,[]);assert.doesNotMatch(b.answer,/\d|€/u);
  }else {assert.equal(b.cardId,a.cardId);assert.deepEqual(b.sources,a.sources);}
  if(profile.id==='darzniece')assert.equal(b.kind,'conflict');
 });
 test(`${profile.id}: privacy, unrelated questions and reset erase the prior topic without retaining user text`,()=>{
  const session=createConversation(profile,'en');session.next('What is the delivery cost?');
  session.next('My email is buyer@example.test');assert.equal(session.snapshot().lastCardId,null);
  assert.ok(!JSON.stringify(session.snapshot()).includes('buyer'));assert.equal(session.next('How much?').contextUsed,false);
  session.next('What is the delivery cost?');session.next('An unrelated thing I cannot describe');assert.equal(session.next('How much?').contextUsed,false);
  session.next('What is the delivery cost?');session.reset();assert.deepEqual(session.snapshot(),{shop:profile.id,locale:'en',lastCardId:null});
 });
 test(`${profile.id}: source answer is not reused for an unsupported delivery guarantee`,()=>{
  const s=createConversation(profile);s.next('Как доставят заказ?');const r=s.next('Точно привезут завтра к десяти утра?');assert.equal(r.contextUsed,false);assert.equal(r.kind,'clarify');
 });
 test(`${profile.id}: a language-only instruction translates the prepared answer without losing its topic`,()=>{
  const s=createConversation(profile),a=s.next('Как доставят заказ?');
  const en=s.next('Please answer in English');assert.equal(en.locale,'en');assert.equal(en.cardId,a.cardId);assert.equal(en.contextUsed,true);
  const lv=s.next('Atbildi latviski');assert.equal(lv.locale,'lv');assert.equal(lv.cardId,a.cardId);assert.equal(lv.contextUsed,true);
  assert.equal(s.next('Спасибо, пока').kind,'social');assert.equal(s.next('Please answer in English').contextUsed,false);
 });
 test(`${profile.id}: repeated turns keep constant-size metadata and never call a provider`,()=>{
  const s=createConversation(profile);for(let i=0;i<100;i++)s.next(i%2?'How much?':'What is the delivery cost?');
  assert.ok(JSON.stringify(s.snapshot()).length<160);assert.equal(s.next('Thanks, goodbye').providerUsed,false);
 });
}
test('conversations for two merchants cannot supply each other’s active card or contact',()=>{
 const a=createConversation(getDraft('dzijas')),b=createConversation(getDraft('musiclab'));
 a.next('Как доставят заказ?');assert.equal(b.next('А сколько стоит?').contextUsed,false);
 const other=b.next('Нужен сотрудник');assert.ok(other.answer.includes(getDraft('musiclab').contact));assert.ok(!other.answer.includes(getDraft('dzijas').contact));
});
test('the complete audit report executes its checks and reports zero provider calls',()=>{
 const report=runAudit();assert.equal(report.passed,report.total);assert.equal(report.total,1530);assert.equal(report.providerCalls,0);assert.equal(report.apiCostUsd,0);
});
test('a language switch on a prepared handoff retains the contact and demo limitations',()=>{
 for(const [id,q]of [['etextile','Можно вернуть отрез ленты?'],['sedumi','Есть остаток в филиале?'],['kurzemesvelo','Сколько дадите за старый велосипед на обмен?'],['pulkstenuoutlets','Подтвердите оригинальность часов']]){
  const p=getDraft(id),s=createConversation(p);assert.equal(s.next(q).kind,'handoff');
  const translated=s.next('Please answer in English');assert.equal(translated.kind,'handoff');assert.ok(translated.answer.includes(p.contact));assert.match(translated.answer,/no ticket was created/i);
 }
 assert.throws(()=>preparedAnswer(getDraft('dzijas'),getDraft('musiclab').cards[0]),/another draft/);
});
