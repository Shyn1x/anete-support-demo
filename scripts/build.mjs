import {mkdir,copyFile} from 'node:fs/promises';
import {tenants} from '../src/kb.js';
let count=0;for(const tenant of Object.values(tenants)){const ids=new Set();for(const c of tenant.cards){if(ids.has(c.id)||!c.ru||!c.lv||!c.en||!tenant.sources[c.source])throw Error('Invalid knowledge base: '+tenant.id);ids.add(c.id);count++;}for(const source of Object.values(tenant.sources))if(new URL(source.url).protocol!=='https:')throw Error('Unsafe source');}
for(const name of ['index.html','demos.html','app.js','contact.js','qa.html','qa.js','qa-cases.js','qa-core.js','qa.css','style.css','favicon.svg']){await mkdir('dist',{recursive:true});await copyFile('public/'+name,'dist/'+name);}
console.log(`Validated ${count} trilingual cards across ${Object.keys(tenants).length} isolated shops.`);
