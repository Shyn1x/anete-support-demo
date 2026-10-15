import test from 'node:test';import assert from 'node:assert/strict';
import {aiRoute,RESERVE_MICRO_USD} from '../src/core.js';import {tenants} from '../src/kb.js';
test('one-cent reservation covers conservative bounded text estimate',()=>{assert.equal(RESERVE_MICRO_USD,10000);assert.ok((23000+512)*0.4+160*1.6<RESERVE_MICRO_USD);});
test('all tenant catalogs accept full-length RU LV EN and unicode messages within byte bound',async()=>{for(const tenant of Object.values(tenants))for(const message of ['я'.repeat(1000),'ā'.repeat(1000),'x'.repeat(1000),'🙂'.repeat(500)]){const route=await aiRoute(tenant,message,null);assert.ok(new TextEncoder().encode(JSON.stringify(route.body)).length<=23000);}});
test('oversized catalog is rejected before provider use',async()=>{const tenant={...Object.values(tenants)[0],cards:[{id:'delivery',ru:'я'.repeat(20000),lv:'',en:''}]};await assert.rejects(()=>aiRoute(tenant,'question',null),/prompt_size/);});
