import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';
import {prospectTenants} from '../src/prospects.js';
const names=new Set();
for(const t of Object.values(prospectTenants)){
 const cfg=JSON.parse(await readFile('deploy/clients/'+t.id+'.json','utf8'));assert.equal(cfg.vars.TENANT_ID,t.id);assert.equal(cfg.preview_urls,false);assert.equal(cfg.durable_objects.bindings[0].script_name,'anete-support-demo');assert.equal(cfg.main,'../../src/client-worker.js');assert.ok(!cfg.migrations);assert.ok(!names.has(cfg.name));names.add(cfg.name);
 const files=await readdir('dist/clients/'+t.id);assert.equal(files.length,5);assert.ok(!files.some(x=>/^(demos|qa|usage|app|branding|contact)\./.test(x)));
 const html=await readFile('dist/clients/'+t.id+'/index.html','utf8');assert.ok(html.includes(t.name));assert.ok(!html.includes('Anete.lv'));assert.ok(!html.includes('anete.lv/'));assert.ok(!/href="\/(demos|qa|usage)/.test(html));assert.ok(!/Хороший ответ|Без лишнего ожидания|ПОДДЕРЖКА, КОТОРАЯ ПОНИМАЕТ/.test(html));
 console.log(t.id+': isolated build and shared budget binding OK');
}
