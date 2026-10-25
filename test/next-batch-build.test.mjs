import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {buildNextBatch} from '../scripts/build-next-batch.mjs';
import {profiles} from '../staging/next-batch/profiles.mjs';
import {reply} from '../staging/next-batch/dialogue.mjs';
import {starters} from '../staging/next-batch/starters.mjs';

test('ten standalone previews compile without provider access or sibling shop data',async()=>{
 const path=await buildNextBatch();
 assert.equal((await readdir(path)).length,11);
 for(const profile of profiles){
  const html=await readFile(`${path}/${profile.id}.html`,'utf8');
  assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);assert.match(html,/maxlength="1000"/);
  assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
  assert.doesNotMatch(html,/__DRAFT_|sk-proj-[\w-]{10,}|workers\.dev/i);
  assert.doesNotMatch(html.replace(/<script>[\s\S]*<\/script>/,''),/<iframe[\s>]/i);
  assert.ok(html.includes(profile.contact));assert.match(html,/<meta name="viewport"/);
  for(const other of profiles.filter(p=>p.id!==profile.id)){
   assert.ok(!html.includes(other.contact),`foreign contact in ${profile.id}: ${other.id}`);
   assert.ok(!html.includes(other.home),`foreign site in ${profile.id}: ${other.id}`);
  }
  const code=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(code);new vm.Script(code);
  for(const locale of ['ru','lv','en']){
   const answer=reply(profile,starters[profile.id][locale],locale);assert.ok(answer.cardId,`${profile.id}/${locale} starter reaches its topic`);
  }
 }
});
