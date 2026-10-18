// Build a portable, explicitly non-AI reference demo. No fetch leaves this page.
import {build} from 'esbuild';import {readFile,writeFile} from 'node:fs/promises';
const result=await build({stdin:{contents:`import {detectLocale} from './src/locale.js';import {getTenant} from './src/kb.js';import {preflight,referenceRoute,render} from './src/core.js';
window.fetch=async function(path,options){
 if(path.startsWith('/api/config')){const id=new URL(path,'https://demo.local').searchParams.get('tenant')||'anete',t=getTenant(id);if(!t)return Response.json({error:'unknown_tenant'},{status:404});return Response.json({tenant:t.id,name:t.name,sources:Object.values(t.sources),mode:'reference',ready:true,locked:false,authenticated:true,contact:t.contact});}
 if(path!=='/api/chat')throw new Error('Network disabled in standalone demo');
 const data=JSON.parse(options.body),blocked=preflight(data.message),route=blocked?{ids:[],kind:blocked,handoff:false}:referenceRoute(data.message,data.previousTopic,data.tenant);
 return Response.json(render(data.tenant,detectLocale(data.message,data.locale),route,blocked?'safety':route.social?'social':'reference'));
};`,resolveDir:process.cwd(),sourcefile:'standalone-entry.js'},bundle:true,write:false,format:'iife',minify:true,platform:'browser'});
let html=await readFile('public/index.html','utf8');const css=(await readFile('public/style.css','utf8'))+'\n'+(await readFile('public/brand.css','utf8')),app=(await build({entryPoints:['public/app.js'],bundle:true,write:false,format:'iife',minify:true,platform:'browser'})).outputFiles[0].text,icon=await readFile('public/favicon.svg','utf8');
html=html.replace(/<link rel="stylesheet" href="\/brand\.css(?:\?v=[a-f0-9]+)?">/,'').replace('<link rel="icon" href="/favicon.svg">',`<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">`).replace(/<link rel="stylesheet" href="\/style\.css(?:\?v=[a-f0-9]+)?">/,`<style>${css}</style>`).replace(/<script[^>]*src="\/(?:app\.js|chat-ui\.[a-f0-9]{12}\.js)"[^>]*><\/script>/,'');
html=html.replace('href="/" aria-label="Lomenti"','href="#" aria-label="Lomenti"');
html=html.replace('</body>',`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}${app.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile('Anete-demo-offline.html',html);console.log('Built Anete-demo-offline.html: RU/LV/EN reference chat, no API calls or costs.');
