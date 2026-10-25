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
  // Execute the ACTUAL bundled handlers against a minimal DOM contract.
  // This checks form/state/privacy logic; it is explicitly not browser/layout QA.
  class Element{
   constructor(){this.children=[];this.listeners={};this.value='';this.textContent='';this.attributes={};}
   append(node){this.children.push(node);}replaceChildren(){this.children=[];}
   setAttribute(key,value){this.attributes[key]=value;}
   addEventListener(event,fn){this.listeners[event]=fn;}
  }
  const nodes=Object.fromEntries(['title','label','intro','input','send','reset','warning','delivery','niche','messages','locale','form'].map(id=>[id,new Element()]));
  const document={documentElement:{lang:'ru'},getElementById:id=>nodes[id],createElement:()=>new Element()};
  vm.runInNewContext(code,{document,URL,URLSearchParams},{timeout:1500});
  assert.equal(nodes.title.textContent,profile.name);assert.equal(nodes.messages.children.length,1);
  nodes.delivery.listeners.click();assert.equal(nodes.messages.children.length,3);
  nodes.input.value='My email is buyer@example.test';nodes.form.listeners.submit({preventDefault(){}});
  const visible=()=>JSON.stringify(nodes.messages.children);
  assert.ok(!visible().includes('buyer@example.test'));assert.equal(nodes.input.value,'');
  nodes.reset.listeners.click();assert.equal(nodes.messages.children.length,1);
  nodes.locale.listeners.change({target:{value:'lv'}});assert.equal(document.documentElement.lang,'lv');
  nodes.input.value='Kāda ir piegāde?';nodes.form.listeners.submit({preventDefault(){}});
  nodes.input.value='How much?';nodes.form.listeners.submit({preventDefault(){}});assert.equal(document.documentElement.lang,'en');
  nodes.reset.listeners.click();assert.equal(nodes.messages.children.length,1);assert.equal(document.documentElement.lang,'en');
  for(const locale of ['ru','lv','en']){
   const answer=reply(profile,starters[profile.id][locale],locale);assert.ok(answer.cardId,`${profile.id}/${locale} starter reaches its topic`);
  }
 }
});
