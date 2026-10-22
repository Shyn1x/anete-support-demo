// Separate static asset directories: no catalog, QA, usage or raw source modules.
import {mkdir,readFile,writeFile,copyFile,rm,readdir,cp} from 'node:fs/promises';
import {prospectTenants} from '../src/prospects.js';
await import('./build.mjs');
const files=await readdir('public');
const bundle=files.find(f=>/^chat-ui\.[a-f0-9]{12}\.js$/.test(f));
for(const tenant of Object.values(prospectTenants)){
 const root='dist/clients/'+tenant.id;await rm(root,{recursive:true,force:true,maxRetries:3,retryDelay:100});await mkdir(root,{recursive:true});
 let html=(await readFile('public/index.html','utf8')).replaceAll('Anete.lv',tenant.name).replaceAll('https://anete.lv/kontakti',tenant.contact.source);
 await writeFile(root+'/index.html',html);
 await copyFile('public/catalog-'+tenant.id+'.json',root+'/catalog-index.json');
 await cp('public/catalog-data/'+tenant.id,root+'/catalog-data',{recursive:true});
 for(const name of [bundle,'style.css','brand.css','favicon.svg'])await copyFile('public/'+name,root+'/'+name);
}
console.log('Built 5 client-only sites. Passwords and API keys are not included.');
