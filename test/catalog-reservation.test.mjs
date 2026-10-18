import test from 'node:test';import assert from 'node:assert/strict';import {environment} from './helpers.mjs';
const ip='a'.repeat(64),nonce='c'.repeat(32);
const check=(guard,body)=>guard.fetch(new Request('https://guard/check',{method:'POST',body:JSON.stringify(body)}));
test('catalogue read admission counts one message, later reserve counts no second message and cannot replay',async()=>{
 const {guard,storage}=environment();assert.equal((await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:nonce})).status,200);
 assert.equal(storage.records.get('state').total,0);assert.equal(storage.records.get('state').ips[ip].chat,1);
 assert.equal((await check(guard,{ip,kind:'catalog-reserve',reserve:true,catalogNonce:nonce})).status,200);
 assert.equal(storage.records.get('state').total,10000);assert.equal(storage.records.get('state').ips[ip].chat,1);assert.equal(storage.records.get('state').ips[ip].dayChat,1);
 assert.equal((await check(guard,{ip,kind:'catalog-reserve',reserve:true,catalogNonce:nonce})).status,409);assert.equal(storage.records.get('state').total,10000);
});
test('no paid reserve without admission, from wrong client, with expired token or invalid phase',async()=>{
 const {guard,storage}=environment();const reserve={ip,kind:'catalog-reserve',reserve:true,catalogNonce:nonce};assert.equal((await check(guard,reserve)).status,409);
 await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:nonce});assert.equal((await check(guard,{...reserve,ip:'b'.repeat(64)})).status,409);
 for(const body of [{...reserve,reserve:false},{...reserve,catalogNonce:'bad'},{ip,kind:'catalog-reserve',reserve:true}])assert.equal((await check(guard,body)).status,400);
 guard.now=()=>Date.now()+31000;assert.equal((await check(guard,reserve)).status,409);assert.equal(storage.records.get('state').total,0);
});
test('concurrent reservations of a ticket charge once and preserve the exact existing cap',async()=>{
 const {guard,storage}=environment({TOTAL_BUDGET_MICRO_USD:'10000'});await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:nonce});
 const r=await Promise.all(Array.from({length:12},()=>check(guard,{ip,kind:'catalog-reserve',reserve:true,catalogNonce:nonce})));assert.equal(r.filter(x=>x.status===200).length,1);assert.equal(storage.records.get('state').total,10000);
 const next='d'.repeat(32);await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:next});const denied=await check(guard,{ip,kind:'catalog-reserve',reserve:true,catalogNonce:next});assert.equal(denied.status,429);assert.equal((await denied.json()).reason,'total_budget');assert.equal(storage.records.get('state').total,10000);
});
test('message caps still block catalogue admission without touching budget',async()=>{
 const {guard,storage}=environment();for(let i=0;i<10;i++)assert.equal((await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:String(i).padStart(32,'0')})).status,200);
 assert.equal((await check(guard,{ip,kind:'chat',reserve:false,catalogNonce:nonce})).status,429);assert.equal(storage.records.get('state').total,0);assert.equal(storage.records.get('state').ips[ip].chat,10);
});
