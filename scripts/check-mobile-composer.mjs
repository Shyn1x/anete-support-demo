// Optional visual QA. Requires Playwright via PLAYWRIGHT_MODULE or the local
// environment. All requests are fulfilled from repository files; no live API.
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
import {browserBundle} from './browser-bundle.mjs';import {getTenant} from '../src/kb.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const before=process.argv.includes('--baseline'),root=resolve('public'),out=resolve('reports/mobile-composer-20261019');await mkdir(out,{recursive:true});
const currentCSS=await readFile(root+'/style.css','utf8');const marker=currentCSS.indexOf('/* Mobile controls may be taller');assert(marker>=0);const baselineCSS=before?currentCSS.slice(0,marker):null;
const bundle=await browserBundle(),browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROME?{executablePath:process.env.PLAYWRIGHT_CHROME}:{}),args:['--no-sandbox']});const rows=[];
try{
 for(const shop of ['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();let apiCalls=0;
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='mobile-demo.test')throw Error('Unexpected external request');
   if(u.pathname==='/api/config'){const tenant=getTenant(shop);return route.fulfill({json:{tenant:shop,name:tenant.name,ready:true,locked:false,authenticated:true,mode:'reference',sources:Object.values(tenant.sources),contact:tenant.contact}});}
   if(u.pathname.startsWith('/api/')){apiCalls++;return route.abort();}
   if(/^\/chat-ui\.[a-f0-9]{12}\.js$/.test(u.pathname))return route.fulfill({contentType:'text/javascript',body:bundle.content});
   const file=u.pathname==='/'?'/index.html':u.pathname;if(!['/index.html','/style.css','/brand.css','/favicon.svg'].includes(file))throw Error('Unexpected asset');
   return route.fulfill({contentType:({'.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[extname(file)],body:file==='/style.css'&&before?baselineCSS:await readFile(root+file)});
  });
  for(const width of [320,375,390,430])for(const locale of ['ru','lv','en']){
   await page.setViewportSize({width,height:844});await page.goto('http://mobile-demo.test/');await page.waitForFunction(()=>document.documentElement.dataset.boot==='ready');await page.locator('#'+locale).click();
   // Evaluate the unfocused empty chat, with no browser-assisted scrolling of
   // its clipped inner contents. This reproduces the original failure.
   const measure=async()=>page.evaluate(()=>{const shell=document.querySelector('.chat-shell'),form=document.querySelector('#chat-form'),input=document.querySelector('#message'),note=document.querySelector('.composer-note');const s=shell.getBoundingClientRect(),f=form.getBoundingClientRect(),i=input.getBoundingClientRect(),n=note.getBoundingClientRect();return {shellHeight:s.height,formInside:f.top>=s.top&&f.bottom<=s.bottom,noteInside:n.bottom<=s.bottom+1,inputInside:i.bottom<=s.bottom,inputFocused:document.activeElement===input,overflowX:document.documentElement.scrollWidth>innerWidth,cardScrollTop:shell.scrollTop};});
   const initial=await measure();rows.push({shop,width,locale,state:'initial',...initial});if(!before){assert(initial.formInside&&initial.noteInside&&initial.inputInside,JSON.stringify(rows.at(-1)));assert(!initial.inputFocused);assert(!initial.overflowX);}
   if(shop==='anete'&&width===390&&locale==='ru'){
    await page.evaluate(()=>{const s=document.querySelector('.chat-shell');window.scrollTo(0,s.getBoundingClientRect().top+scrollY-16);});
    await page.screenshot({path:out+'/'+(before?'before':'after')+'-390x844.png'});
   }
   if(before)continue;
   // A long source-backed transcript, expanded handoff and preview must not
   // hide the composer either. Fixtures do not call a model or media endpoint.
   await page.evaluate(()=>{const messages=document.querySelector('#messages');for(let i=0;i<12;i++){const b=document.createElement('div');b.className='bubble bot';b.textContent='Длинный пример ответа для проверки прокрутки. '.repeat(10);messages.append(b);}document.querySelector('.chat-shell').classList.add('has-handoff');const h=document.querySelector('#handoff');h.hidden=false;document.querySelector('#handoff-content').hidden=false;document.querySelector('#summary').textContent='Синтетическое описание. '.repeat(20);document.querySelector('#attachment-preview').hidden=false;const image=document.createElement('img');image.alt='Synthetic preview';image.width=180;image.height=140;image.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="140"><rect width="180" height="140" fill="%23eee"/></svg>';document.querySelector('#attachment-preview').append(image);});
   const expanded=await measure();rows.push({shop,width,locale,state:'long-handoff-preview',...expanded});assert(expanded.formInside&&expanded.noteInside&&!expanded.overflowX,JSON.stringify(rows.at(-1)));
   await page.locator('#chat-form').scrollIntoViewIfNeeded();const input=page.locator('#message');await input.fill('Проверка видимости поля после нажатия.');await page.setViewportSize({width,height:420});await input.scrollIntoViewIfNeeded();assert(await input.isVisible());const reduced=await measure();assert(reduced.formInside&&!reduced.overflowX);await page.setViewportSize({width,height:844});
  }
  // Browser chrome reduces usable phone height; large text must remain usable.
  for(const width of [320,375,390,430]){
   await page.setViewportSize({width,height:640});await page.goto('http://mobile-demo.test/');await page.waitForFunction(()=>document.documentElement.dataset.boot==='ready');
   for(const enlarged of [false,true]){
    if(enlarged)await page.addStyleTag({content:'button{font-size:22px!important}.attachment-hint,.bubble{font-size:18px!important}'});
    const dimensions=await page.evaluate(()=>{const s=document.querySelector('.chat-shell').getBoundingClientRect(),f=document.querySelector('#chat-form').getBoundingClientRect(),n=document.querySelector('.composer-note').getBoundingClientRect();return {formInside:f.top>=s.top&&f.bottom<=s.bottom,noteInside:n.bottom<=s.bottom+1,overflowX:document.documentElement.scrollWidth>innerWidth};});
    rows.push({shop,width,height:640,state:enlarged?'short-large-text':'short',...dimensions});
    if(!before)assert(dimensions.formInside&&dimensions.noteInside&&!dimensions.overflowX,JSON.stringify(rows.at(-1)));
   }
  }
  // Capture geometry at desktop and tablet breakpoints for before/after parity.
  for(const width of [1024,1440]){await page.setViewportSize({width,height:1000});await page.goto('http://mobile-demo.test/');await page.waitForFunction(()=>document.documentElement.dataset.boot==='ready');rows.push({shop,width,state:'desktop',...await page.evaluate(()=>Object.fromEntries(['.chat-shell','.messages','#chat-form','.composer-note'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return [sel,[r.x,r.y,r.width,r.height]];})))});}
  assert.equal(apiCalls,0);await context.close();
 }
 if(!before){const baseline=JSON.parse(await readFile(out+'/baseline.json','utf8'));assert.deepEqual(rows.filter(r=>r.state==='desktop'),baseline.rows.filter(r=>r.state==='desktop'),'Desktop geometry changed');}
 await writeFile(out+'/'+(before?'baseline':'verified')+'.json',JSON.stringify({kind:'local-browser-fixtures-not-live-server',paidCalls:0,rows},null,2)+'\n');
 console.log(JSON.stringify({mode:before?'baseline':'verified',checks:rows.length,clippedInitial:rows.filter(r=>r.state==='initial'&&!r.formInside).length,paidCalls:0}));
}finally{await browser.close();}
