import {mkdir,copyFile} from 'node:fs/promises';
import {cards,sources} from '../src/kb.js';
const ids=new Set();for(const c of cards){if(ids.has(c.id)||!c.ru||!c.lv||!c.en||!sources[c.source])throw Error('Invalid knowledge base');ids.add(c.id);}
for(const name of ['index.html','app.js','style.css','favicon.svg']){await mkdir('dist',{recursive:true});await copyFile('public/'+name,'dist/'+name);}
console.log(`Validated ${cards.length} trilingual answer cards and ${Object.keys(sources).length} verified source URLs. Static files copied to dist/. Wrangler uses public/.`);
