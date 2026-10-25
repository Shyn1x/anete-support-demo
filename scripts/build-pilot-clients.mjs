// Local assets/config preparation only. No deploy, secrets or provider calls.
import {mkdir,rm,readFile,writeFile,copyFile,readdir,cp,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {browserBundle} from './browser-bundle.mjs';
import {buildSearchIndex} from './build-catalog-index.mjs';
import {pilotTenants} from '../src/pilots.js';
import {pilotProfiles} from '../src/pilot-profiles.js';
const productPrompt={dzijas:'DROPS SAGA',jig:'RYOBI EXCIA 2.70m 3-18g',musiclab:'Lone Pine 6.5',etextile:'Prese furnitūrai',zummers:'SX SD104-RDS'};
const detailPrompt={
 dzijas:{ru:'сколько метров в мотке?',lv:'kāds ir garums?',en:'what is the yarn length?'},
 jig:{ru:'какой материал?',lv:'kāds ir materiāls?',en:'what material is listed?'},
 musiclab:{ru:'какой вес?',lv:'kāds ir svars?',en:'what is the weight?'},
 etextile:{ru:'для чего предназначен?',lv:'kāds ir materiāls?',en:'what is it used for?'},
 zummers:{ru:'какой материал?',lv:'kāds ir materiāls?',en:'what material is listed?'}
};
const root=fileURLToPath(new URL('../',import.meta.url));
export async function buildPilotClients(){
 const configs=resolve(root,'deploy/pilots');await mkdir(configs,{recursive:true});
 for(const tenant of Object.values(pilotTenants)){
  const profile=pilotProfiles.find(p=>p.id===tenant.id),directory=resolve(root,'dist/pilots',tenant.id);
  await buildSearchIndex(tenant.id);await rm(directory,{recursive:true,force:true});await mkdir(directory,{recursive:true});
  const checked=tenant.checked.split('-').reverse().join('.');
  const brand={avatar:tenant.name[0].toLowerCase(),copy:Object.fromEntries(['ru','lv','en'].map(l=>[l,{headline:tenant.name,
   questions:[{ru:'Как доставят заказ?',lv:'Kā piegādā pasūtījumu?',en:'How is an order delivered?'}[l],productPrompt[tenant.id]+': '+detailPrompt[tenant.id][l],{ru:'Как оплатить заказ?',lv:'Kā apmaksāt pasūtījumu?',en:'How can I pay?'}[l]],
   lead:{ru:'Спросите о товаре или правилах магазина. Можно прислать ссылку.',lv:'Jautājiet par preci vai veikala nosacījumiem. Varat atsūtīt saiti.',en:'Ask about a product or shop terms. You can share a link.'}[l],
   welcome:{ru:`Здравствуйте! Помогу с товарами и условиями ${tenant.name} 🙂 Это независимое демо без доступа к заказам. Какой у вас вопрос?`,lv:`Labdien! Palīdzēšu ar ${tenant.name} precēm un nosacījumiem 🙂 Šī ir neatkarīga demonstrācija bez piekļuves pasūtījumiem. Kāds ir jautājums?`,en:`Hello! I can help with ${tenant.name} products and terms 🙂 This is an independent demo with no order access. What would you like to know?`}[l],
   footer:{ru:`Публичные страницы проверены ${checked}`,lv:`Publiskās lapas pārbaudītas ${checked}`,en:`Public pages checked ${tenant.checked}`}[l],
   sourceInfo:{ru:`Правила проверены ${checked}. Товарный поиск охватывает начальную подборку, а не весь ассортимент. Актуальность конкретной карточки проверяется при её чтении.`,lv:`Noteikumi pārbaudīti ${checked}. Preču meklēšanā ir sākotnējā izlase, nevis viss sortiments. Konkrēto lapu pārbauda tās lasīšanas laikā.`,en:`Policies checked ${tenant.checked}. Product search covers an initial sample, not the full assortment. A product page is checked when it is read.`}[l]
  }]))};
  const temporary=resolve(directory,'.branding.mjs');await writeFile(temporary,`const brand=${JSON.stringify(brand)};export function applyBrand(root,id){if(id!==${JSON.stringify(tenant.id)})return null;root.documentElement.dataset.shop=id;return brand;}\n`);
  const bundle=await browserBundle({branding:temporary});await unlink(temporary);await writeFile(resolve(directory,bundle.filename),bundle.content);
  let html=await readFile(resolve(root,'public/index.html'),'utf8');
  html=html.replace(/src="\/(?:app\.js|chat-ui\.[a-f0-9]{12}\.js)"/,`src="/${bundle.filename}"`).replaceAll('Anete.lv',tenant.name).replaceAll('https://anete.lv/kontakti',tenant.contact.source).replaceAll('15.10.2026',checked);
  html=html.replace(/<a\b[^>]*href="\/(?:demos|usage|qa)(?:[/?"][^>]*)?>[\s\S]*?<\/a>/giu,'');
  await writeFile(resolve(directory,'index.html'),html);
  for(const name of ['style.css','brand.css','favicon.svg'])await copyFile(resolve(root,'public',name),resolve(directory,name));
  await writeFile(resolve(directory,'brand.css'),(await readFile(resolve(directory,'brand.css'),'utf8'))+`\nhtml[data-shop="${tenant.id}"]{--accent:${profile.accent};}\n`);
  await copyFile(resolve(root,'public/catalog-'+tenant.id+'.json'),resolve(directory,'catalog-index.json'));await cp(resolve(root,'public/catalog-data',tenant.id),resolve(directory,'catalog-data'),{recursive:true});
  const config={name:'support-demo-'+tenant.id,main:'../../src/client-worker.js',compatibility_date:'2026-10-01',workers_dev:true,preview_urls:false,assets:{directory:'../../dist/pilots/'+tenant.id,binding:'ASSETS',run_worker_first:true},durable_objects:{bindings:[{name:'GUARD',class_name:'BudgetGuard',script_name:'anete-support-demo'}]},keep_vars:true,vars:{TENANT_ID:tenant.id,NEXT_BATCH_ENABLED:'true',CATALOG_ENABLED:'true',AI_CONVERSATIONAL:'true',AI_ENABLED:'false'},observability:{enabled:false}};
  await writeFile(resolve(configs,tenant.id+'.json'),JSON.stringify(config,null,2)+'\n');
 }
 return Object.keys(pilotTenants);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Prepared pinned pilot clients:',(await buildPilotClients()).join(', '));
