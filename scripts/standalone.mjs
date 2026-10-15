// Build a portable, explicitly non-AI reference demo. No fetch leaves this page.
import {build} from 'esbuild';import {readFile,writeFile} from 'node:fs/promises';
const result=await build({stdin:{contents:`import {detectLocale} from './src/locale.js';import {getTenant} from './src/kb.js';import {preflight,referenceRoute,render} from './src/core.js';
window.fetch=async function(path,options){
 if(path==='/api/config')return Response.json({mode:'reference',ready:true,locked:false,authenticated:true});
 if(path!=='/api/chat')throw new Error('Network disabled in standalone demo');
 const data=JSON.parse(options.body),blocked=preflight(data.message),route=blocked?{ids:[],kind:blocked,handoff:false}:referenceRoute(data.message,data.previousTopic);
 return Response.json(render('anete',detectLocale(data.message,data.locale),route,blocked?'safety':'reference'));
};`,resolveDir:process.cwd(),sourcefile:'standalone-entry.js'},bundle:true,write:false,format:'iife',minify:true,platform:'browser'});
let html=await readFile('public/index.html','utf8');const css=await readFile('public/style.css','utf8'),app=await readFile('public/app.js','utf8'),icon=await readFile('public/favicon.svg','utf8');
html=html.replace('<link rel="icon" href="/favicon.svg">',`<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">`).replace('<link rel="stylesheet" href="/style.css">',`<style>${css}</style>`).replace('<script type="module" src="/app.js"></script>','');
html=html.replace('href="/" aria-label="Support Studio"','href="#" aria-label="Support Studio"');
html=html.replace('</body>',`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}${app.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile('Anete-demo-offline.html',html);console.log('Built Anete-demo-offline.html: RU/LV/EN reference chat, no API calls or costs.');
