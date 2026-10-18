import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {createWorker} from '../src/worker.js';import {environment} from './helpers.mjs';
import {browserBundle} from '../scripts/browser-bundle.mjs';import {brands} from '../public/branding.js';import {getTenant} from '../src/kb.js';
class Element{constructor(){this.children=[];this.dataset={};this.listeners={};this.style={};this.value='';this.classList={toggle(){},remove(){}};this.firstChild={nodeValue:'a'};this._text='';}set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text;}get firstElementChild(){return this.children[0];}append(x){x.parent=this;this.children.push(x);}replaceChildren(...x){this.children=x;}querySelectorAll(){return this.children;}addEventListener(n,fn){this.listeners[n]=fn;}setAttribute(n,v){this[n]=v;}close(){}showModal(){}removeAttribute(n){delete this[n];}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}focus(){}}
async function harness(shop,{broken=false,pending=false,noQuery=false,workerConfig=false,chatRequests=null,chatReply=null}={}){
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));for(const s of ['h1','.avatar','.chat-shell'])elements.set(s,new Element());
 const translations=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>{const e=new Element();e.dataset.i18n=m[1];return e;});const contacts=[new Element(),new Element()];
 const document={documentElement:{dataset:{}},getElementById:id=>elements.get('#'+id),querySelector:s=>broken&&s==='#chat-form'?null:elements.get(s),querySelectorAll:s=>s==='[data-i18n]'?translations:contacts,createElement:()=>new Element()};
 let calls=0,watchdog;const paths=[];const tenant=getTenant(shop);const context=vm.createContext({document,window:{addEventListener(){}},setTimeout(fn){watchdog=fn;},clearTimeout(){},location:{search:noQuery?'':'?shop='+shop},URLSearchParams,URL,AbortController,AbortSignal,fetch:async (path,options)=>{calls++;paths.push(path);if(path==='/api/chat'&&chatRequests){chatRequests.push(JSON.parse(options.body));return {ok:true,status:200,json:async()=>chatReply?chatReply(chatRequests.length):({locale:'en',mode:'ai',text:'What would you like to know?',sources:[],cardIds:[],handoff:false,providerUsed:true,conversational:true})};}assert.ok(path==='/api/config'||path.startsWith('/api/config?tenant='));if(workerConfig){const {env}=environment({TENANT_ID:shop,DEMO_PASSWORD:'test-only-client-password'});return createWorker().fetch(new Request('https://demo.example'+path),env);}if(pending)return new Promise(()=>{});return {ok:true,json:async()=>({tenant:shop,name:tenant.name,ready:true,locked:false,mode:'reference',sources:Object.values(tenant.sources),contact:tenant.contact})};}});
 const bundle=await browserBundle();assert.match(bundle.filename,/^chat-ui\.[a-f0-9]{12}\.js$/);assert.ok(!/^\s*import\s/m.test(bundle.content));
 vm.runInContext(bundle.content,context);await new Promise(setImmediate);return {elements,translations,contacts,document,calls,watchdog,paths};
}
for(const shop of Object.keys(brands))test(`classic browser bundle starts ${shop} without module requests`,async()=>{
 const h=await harness(shop);assert.equal(h.calls,1);assert.equal(h.document.documentElement.dataset.boot,'ready');assert.equal(h.document.documentElement.dataset.shop,shop);assert.equal(h.elements.get('#boot-status').hidden,true);
 for(const lang of ['ru','lv','en']){h.elements.get('#'+lang).listeners.click();assert.equal(h.translations.find(e=>e.dataset.i18n==='headline').textContent,brands[shop].copy[lang].headline);assert.equal(h.elements.get('#messages').firstElementChild.textContent,brands[shop].copy[lang].welcome);}
 h.watchdog();assert.equal(h.elements.get('#boot-status').hidden,true);assert.equal(h.contacts[0].href,getTenant(shop).contact.source);
});
test('startup exception leaves an actionable visible error instead of a silent blank chat',async()=>{const h=await harness('rotallieta',{broken:true});assert.equal(h.document.documentElement.dataset.boot,'failed');assert.equal(h.elements.get('#boot-status').hidden,false);assert.match(h.elements.get('#boot-status').textContent,/UI_LOAD_FAILED/);assert.equal(h.calls,0);});
test('configuration stall triggers visible startup watchdog without paid calls',async()=>{const h=await harness('bariba',{pending:true});h.watchdog();assert.equal(h.document.documentElement.dataset.boot,'failed');assert.match(h.elements.get('#boot-status').textContent,/Ctrl\+Shift\+R/);assert.equal(h.calls,1);});

test('clean client root uses the server-selected brand without a shop selector',async()=>{const h=await harness('bariba',{noQuery:true});assert.equal(h.document.documentElement.dataset.shop,'bariba');assert.equal(h.document.documentElement.dataset.boot,'ready');assert.equal(h.translations.find(e=>e.dataset.i18n==='headline').textContent,'Bariba.lv');});

for(const shop of Object.keys(brands))test(`clean root bundle loads ${shop} from the real tenant-restricted API`,async()=>{const h=await harness(shop,{noQuery:true,workerConfig:true});assert.deepEqual(h.paths,['/api/config']);assert.equal(h.document.documentElement.dataset.boot,'ready');assert.equal(h.document.documentElement.dataset.shop,shop);assert.equal(h.translations.find(e=>e.dataset.i18n==='headline').textContent,getTenant(shop).name);});

test('browser sends bounded short history, clears it on reset and never persists it',async()=>{const requests=[],h=await harness('bariba',{chatRequests:requests});for(const q of ['How does delivery work?','And how long?','What about payment?']){h.elements.get('#message').value=q;h.elements.get('#chat-form').listeners.submit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);}assert.equal(requests.length,3);assert.deepEqual(requests.map(r=>r.history.length),[0,2,4]);assert.equal(requests[1].history[0].text,'How does delivery work?');h.elements.get('#reset').listeners.click();h.elements.get('#message').value='How can I pay?';h.elements.get('#chat-form').listeners.submit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);assert.equal(requests[3].history.length,0);});

// Exercise disclosure state through the actual bundled response renderer.
for(const shop of ['anete',...Object.keys(brands)])for(const locale of ['ru','lv','en'])test(`${shop}/${locale}: collapsed contacts survive follow-ups without losing the conversation`,async()=>{
 const requests=[],h=await harness(shop,{chatRequests:requests,chatReply:n=>({locale,mode:'reference',text:'Synthetic support answer',sources:[],cardIds:['contact'],handoff:n!==3,contact:getTenant(shop).contact})});
 h.elements.get('#'+locale).listeners.click();
 const panel=h.elements.get('#handoff'),input=h.elements.get('#message');
 const send=async()=>{input.value='Synthetic support question';h.elements.get('#chat-form').listeners.submit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);};
 await send();assert.equal(panel.hidden,false);assert.equal(h.elements.get('#handoff-toggle')['aria-expanded'],'true');
 const summary=h.elements.get('#summary').textContent;
 input.value='Unsent draft';h.elements.get('#handoff-toggle').onclick(); // User collapses the contact panel.
 assert.equal(input.value,'Unsent draft');assert.equal(requests.length,1);assert.equal(h.elements.get('#handoff-content').hidden,true);
 assert.equal(input.disabled,false);assert.equal(h.elements.get('#messages').children.length,3);
 await send();assert.equal(panel.hidden,false);assert.equal(h.elements.get('#handoff-toggle')['aria-expanded'],'false');assert.equal(h.elements.get('#summary').textContent,summary);
 await send();assert.equal(panel.hidden,true);assert.equal(h.elements.get('#handoff-toggle')['aria-expanded'],'false');
 await send();assert.equal(panel.hidden,false);assert.equal(h.elements.get('#handoff-toggle')['aria-expanded'],'false');assert.equal(requests.length,4);
 assert.equal(requests[3].history.length,4);assert.equal(h.elements.get('#messages').children.length,9);
 assert.equal(h.translations.find(e=>e.dataset.i18n==='handoffCollapse').textContent,({ru:'Свернуть',lv:'Sakļaut',en:'Collapse'})[locale]);
 assert.equal(h.translations.find(e=>e.dataset.i18n==='handoffExpand').textContent,({ru:'Развернуть',lv:'Izvērst',en:'Expand'})[locale]);
 h.elements.get('#handoff-toggle').onclick();h.elements.get('#choose-email').onclick();assert.ok(h.elements.get('#contact-open').href.startsWith('mailto:'+getTenant(shop).contact.email+'?'));
 h.elements.get('#reset').listeners.click();assert.equal(panel.hidden,true);assert.equal(h.elements.get('#handoff-toggle')['aria-expanded'],'true');assert.equal(h.elements.get('#handoff-content').hidden,false);assert.equal(h.elements.get('#messages').children.length,1);
});

test('catalogue choices survive ordinal follow-ups, become a single linked product and clear on reset',async()=>{
 const a='https://www.bariba.lv/food-a.html',b='https://www.bariba.lv/food-b.html',requests=[];
 const h=await harness('bariba',{chatRequests:requests,chatReply:n=>({locale:'en',mode:'catalog',text:'Synthetic catalogue response',sources:[],cardIds:[],handoff:false,...(n===1?{catalogURLs:[a,b,'https://evil.invalid/products/food']}:{productURL:b})})});
 const send=async q=>{h.elements.get('#message').value=q;h.elements.get('#chat-form').listeners.submit({preventDefault(){}});await new Promise(setImmediate);await new Promise(setImmediate);};
 await send('Which puppy food?');assert.deepEqual(requests[0].catalogURLs,[]);
 await send('The second one, ingredients?');assert.deepEqual(requests[1].catalogURLs,[a,b]);
 await send('And the price?');assert.deepEqual(requests[2].catalogURLs,[b]);
 h.elements.get('#reset').listeners.click();await send('Which cat food?');assert.deepEqual(requests[3].catalogURLs,[]);
});
