import test from 'node:test';import assert from 'node:assert/strict';
import {shopperReport} from '../scripts/check-shopper-scenarios.mjs';import {getTenant} from '../src/kb.js';import {isProductSource} from '../public/catalog.js';
const report=await shopperReport();
for(const c of report.results)test('shopper goal '+c.id+': '+c.message,()=>{
 if(c.tenant==='anete'&&c.expected==='search'){assert.equal(c.contractMet,null);assert.equal(c.outcome,'needs_live_search');}else assert.equal(c.contractMet,true,JSON.stringify(c));
 const own=new Set(Object.values(getTenant(c.tenant).sources).map(s=>s.url));assert(c.matched.every(p=>isProductSource(p.url,own)));assert.equal(c.liveAIQuality,'not_tested');
 if(c.expected==='unknown')assert.deepEqual(c.matched,[]);
});
test('buyer report keeps offline matches separate from untested live AI wording and native search',()=>{assert.equal(report.paidOpenAICalls,0);assert.equal(report.totals.variants,159);assert.equal(report.totals.goals,53);assert.equal(report.totals.needsLiveSearch,3);assert.equal(report.totals.contractFailures,0);});
