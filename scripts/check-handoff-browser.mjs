// Optional visual regression check. Requires externally installed Playwright + Chromium.
// Serves only local assets and synthetic /api responses. No provider or live shop traffic.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {getTenant} from '../src/kb.js';
import {render} from '../src/core.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const shops=['anete','bariba','hobbyset','apavi40plus','rotallieta','celotajs'];
const locales=['ru','lv','en'],widths=[320,375,390,430,1280];
const output=resolve(process.env.HANDOFF_SCREENSHOT_DIR||'reports/handoff-browser');
await mkdir(output,{recursive:true});
let apiCalls=0;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/config'){
   const t=getTenant(url.searchParams.get('tenant')||'anete');
   res.setHeader('Content-Type','application/json');
   res.end(JSON.stringify({tenant:t.id,name:t.name,ready:true,locked:false,mode:'reference',sources:Object.values(t.sources),contact:t.contact}));return;
  }
  if(url.pathname==='/api/chat'){
   apiCalls++;let raw='';for await(const chunk of req)raw+=chunk;
   const input=JSON.parse(raw),t=getTenant(input.tenant);
   res.setHeader('Content-Type','application/json');
   res.end(JSON.stringify({...render(t.id,input.locale,{ids:['contact'],kind:'answer',handoff:true},'reference'),contact:t.contact}));return;
  }
  const relative=url.pathname==='/'?'index.html':url.pathname.slice(1);
  const file=resolve('dist',relative);assert.ok(file.startsWith(resolve('dist')+'/'));
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 for(const shop of shops)for(const locale of locales)for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<720,hasTouch:width<720});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/?shop='+shop);await page.waitForFunction(()=>document.documentElement.dataset.boot==='ready');
  await page.locator('#'+locale).click();
  const send=async()=>{await page.locator('#message').fill(({ru:'Мне нужен сотрудник',lv:'Vēlos runāt ar darbinieku',en:'I need a person'})[locale]);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#message').disabled);};
  await send();const panel=page.locator('#handoff'),toggle=page.locator('#handoff-toggle');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  const summary=await page.locator('#summary').textContent();
  const measure=()=>page.evaluate(()=>{const p=document.querySelector('#handoff'),m=document.querySelector('#messages'),f=document.querySelector('#chat-form'),shell=document.querySelector('.chat-shell');const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,width:b.width};};return {panel:r(p),messages:r(m),composer:r(f),shell:r(shell),overflow:document.documentElement.scrollWidth>innerWidth};});
  const before=await measure(),calls=apiCalls;
  if(shop==='hobbyset'&&locale==='ru'&&width===390){await page.waitForFunction(()=>{const e=document.querySelector('#messages');return e.scrollTop+e.clientHeight>=e.scrollHeight-2;});await page.locator('#message').blur();await page.evaluate(()=>scrollTo(0,document.querySelector('.chat-shell').getBoundingClientRect().top+scrollY-8));await page.screenshot({path:resolve(output,'hobbyset-390-open.png')});}
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  const after=await measure();assert.ok(after.panel.height<before.panel.height-80);assert.ok(after.messages.height>before.messages.height+80,JSON.stringify({shop,locale,width,before,after}));
  assert.ok(after.panel.height>=44&&after.panel.height<=90);assert.equal(after.overflow,false);assert.ok(after.composer.top>=after.panel.bottom-1);assert.ok(after.composer.bottom<=after.shell.bottom);
  assert.equal(apiCalls,calls);assert.equal(await page.locator('#message').isEnabled(),true);
  if(shop==='hobbyset'&&locale==='ru'&&width===390){await page.evaluate(()=>scrollTo(0,document.querySelector('.chat-shell').getBoundingClientRect().top+scrollY-8));await page.screenshot({path:resolve(output,'hobbyset-390-collapsed.png')});}
  // A second handoff response must honour the user's collapsed state.
  await send();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#summary').textContent(),summary);
  assert.equal(await page.locator('.bubble.user').count(),2);assert.equal(await page.locator('.bubble.bot').count(),3);
  await toggle.focus();await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  await page.locator('#choose-email').click();assert.equal(await page.locator('#contact-step').evaluate(e=>e.open),true);assert.ok((await page.locator('#contact-open').getAttribute('href')).startsWith('mailto:'+getTenant(shop).contact.email+'?'));
  await page.locator('#contact-back').click();await toggle.focus();await page.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await page.locator('#reset').click();assert.equal(await panel.isVisible(),false);assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.deepEqual(errors,[]);results.push({shop,locale,width,expandedHeight:before.panel.height,collapsedHeight:after.panel.height,pass:true});
  await context.close();
 }
 console.log(`PASS: ${results.length} Chromium cases, 6 shops × 3 languages × 5 widths; only local synthetic requests.`);
 await writeFile(resolve(output,'results.json'),JSON.stringify({cases:results.length,apiCalls,externalRequests:0,results},null,2)+'\n');
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
