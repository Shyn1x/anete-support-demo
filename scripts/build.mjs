import {mkdir,copyFile,readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {browserBundle} from './browser-bundle.mjs';
import {tenants} from '../src/kb.js';
let count=0;for(const tenant of Object.values(tenants)){const ids=new Set();for(const c of tenant.cards){if(ids.has(c.id)||!c.ru||!c.lv||!c.en||!tenant.sources[c.source])throw Error('Invalid knowledge base: '+tenant.id);ids.add(c.id);count++;}for(const source of Object.values(tenant.sources))if(new URL(source.url).protocol!=='https:')throw Error('Unsafe source');}
const bundle=await browserBundle();
for(const file of await readdir('public'))if(/^chat-ui\.[a-f0-9]{12}\.js$/.test(file))await unlink('public/'+file);
await writeFile('public/'+bundle.filename,bundle.content);
for(const page of ['index.html','demos.html']){
 let html=await readFile('public/'+page,'utf8');
 if(page==='index.html')html=html.replace(/<script[^>]*src="\/(?:app\.js|chat-ui\.[a-f0-9]{12}\.js)"[^>]*><\/script>/,'<script defer src="/'+bundle.filename+'"></script>');
 for(const css of ['style.css','brand.css']){const hash=createHash('sha256').update(await readFile('public/'+css)).digest('hex').slice(0,12);html=html.replace(new RegExp('href="/'+css.replace('.','\\.')+'(?:\\?v=[a-f0-9]+)?"','g'),'href="/'+css+'?v='+hash+'"');}
 await writeFile('public/'+page,html);
}
for(const name of ['index.html','demos.html',bundle.filename,'app.js','branding.js','brand.css','contact.js','qa.html','qa.js','qa-cases.js','qa-core.js','qa.css','style.css','favicon.svg']){await mkdir('dist',{recursive:true});await copyFile('public/'+name,'dist/'+name);}
console.log(`Validated ${count} trilingual cards across ${Object.keys(tenants).length} isolated shops. Browser bundle: ${bundle.filename}`);
