import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {buildSearchIndex} from '../scripts/build-catalog-index.mjs';import {loadCatalogIndex,searchIndexedProducts} from '../src/catalog-index.js';import {getTenant} from '../src/kb.js';
await buildSearchIndex('hobbyset');
function assets(){let reads=0,maxBytes=0;const env={TENANT_ID:'hobbyset',ASSETS:{fetch:async req=>{reads++;let path=new URL(req.url).pathname;path=path==='/catalog-index.json'?'/catalog-hobbyset.json':path.replace(/^\/catalog-data/,'/catalog-data/hobbyset');try{const b=await readFile('public'+path);maxBytes=Math.max(maxBytes,b.length);return new Response(b);}catch{return new Response('',{status:404});}}}};return {env,stats:()=>({reads,maxBytes})};}
for(const q of ['Какие акварельные краски выбрать?','Which watercolor paints should I choose?','Kādas akvareļkrāsas izvēlēties?'])test('production sparse index finds actual paints without scanning the whole catalogue: '+q,async()=>{
 const {env,stats}=assets(),tenant=getTenant('hobbyset'),index=await loadCatalogIndex(env,tenant);assert.equal(index.schema,'shop-catalog-search-v1');assert.equal(index.products,undefined);assert(index.entries>18000);
 const rows=await searchIndexedProducts(env,tenant,index,q);assert.equal(rows.length,3);assert(rows.every(p=>/akvareļkrāsu|watercolou?r/iu.test(p.t)));assert(rows.every(p=>!/(?:gumiar|maskējoš|papīr|paper|brush|sponge|izšūšan)/iu.test(p.t)));assert(stats().reads<=6);assert(stats().maxBytes<350000);
});
test('unknown prefix and fictitious model cannot produce an unrelated sparse-index match',async()=>{const {env}=assets(),t=getTenant('hobbyset'),index=await loadCatalogIndex(env,t);assert.deepEqual(await searchIndexedProducts(env,t,index,'Example-X999-fictional-product material'),[]);});
for(const id of ['bariba','rotallieta','apavi40plus','celotajs'])await buildSearchIndex(id);
for(const [id,q,match]of [['bariba','What food is best for puppies?',/pupp|kucēn/iu],['rotallieta','Which Busy Board toys are listed?',/busy board/iu],['apavi40plus','What material is Josef Seibel 42801 made from?',/42801/iu],['celotajs','Which tent should I choose?',/telts|tent/iu]])test('production sparse index also resolves shopper intent for '+id,async()=>{
 let reads=0;const env={TENANT_ID:id,ASSETS:{fetch:async req=>{reads++;let path=new URL(req.url).pathname;path=path==='/catalog-index.json'?'/catalog-'+id+'.json':path.replace(/^\/catalog-data/,'/catalog-data/'+id);try{return new Response(await readFile('public'+path));}catch{return new Response('',{status:404});}}}};
 const t=getTenant(id),index=await loadCatalogIndex(env,t),rows=await searchIndexedProducts(env,t,index,q);assert(rows.length>0);assert(rows.every(p=>match.test(p.t)));assert(reads<12);
});
