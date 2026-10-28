// Builds ten standalone offline previews. Does not deploy or call any provider.
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {build} from 'esbuild';
import {profiles} from '../staging/next-batch/profiles.mjs';
import {starters} from '../staging/next-batch/starters.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const defaultDestination=resolve(root,'dist/next-batch');
const {sources}=JSON.parse(await readFile(resolve(root,'staging/next-batch/sources.json'),'utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export async function buildNextBatch({destination=defaultDestination}={}){
 await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
 for(const profile of profiles){
  const selected=sources.filter(s=>s.id.startsWith(profile.id+'-'));
  const result=await build({absWorkingDir:root,entryPoints:['staging/next-batch/preview.mjs'],bundle:true,write:false,minify:true,format:'iife',target:'es2022',
   define:{__DRAFT_PROFILE__:JSON.stringify(profile),__DRAFT_SOURCES__:JSON.stringify(selected),__DRAFT_STARTER__:JSON.stringify(starters[profile.id])}});
  // Data includes public merchant strings: do not let it terminate the script tag.
  const script=result.outputFiles[0].text.replaceAll('</script','<\\/script');
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>${escape(profile.name)} — local draft</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f2ed;color:#202923;font:17px/1.55 system-ui,sans-serif}button,textarea,select{font:inherit}button,select{min-height:44px}main{max-width:760px;margin:30px auto;padding:0 18px 30px}.shell{background:#fff;border:1px solid #d8ddd5;border-radius:18px;overflow:hidden}header{padding:24px;background:${profile.accent};color:white;display:flex;gap:16px;justify-content:space-between;align-items:flex-start}h1{font-size:clamp(22px,5vw,30px);line-height:1.2;margin:0 0 8px;overflow-wrap:anywhere}header p{margin:0;font-size:14px}header div{min-width:0}select{max-width:76px;background:white;color:#202923;border:0;border-radius:8px}#intro{margin:0;padding:18px 22px;background:#f4f5ef;font-size:15px}.messages{padding:22px;min-height:210px;display:grid;gap:14px}.message{padding:16px 18px;border-radius:14px;background:#f0f2ec;white-space:pre-wrap;overflow-wrap:anywhere;max-width:95%}.message.user{background:#26392f;color:white;justify-self:end}.message nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;font-size:14px}.message a{color:inherit;text-underline-offset:3px}.controls{padding:0 22px 22px}.quick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}button{padding:10px 16px;border:1px solid #b7c2b9;border-radius:10px;background:white;color:#202923;cursor:pointer}button:hover{background:#f0f2ec}form{display:flex;gap:10px;align-items:flex-end}textarea{resize:vertical;min-height:80px;max-height:240px;width:100%;min-width:0;border:1px solid #98a69c;border-radius:10px;padding:12px;color:#202923}#send{background:#26392f;color:white;border-color:#26392f}footer{font-size:14px;margin-top:18px;color:#515d55}#reset{margin-top:14px}button:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #b97131;outline-offset:3px}@media(max-width:430px){main{margin:14px auto;padding:0 12px 24px}header{padding:20px 16px}.messages{padding:16px}.controls{padding:0 16px 18px}#intro{padding:16px}form{display:grid;grid-template-columns:1fr}#send{justify-self:end}.message{max-width:100%}}
</style></head><body><main><section class="shell"><header><div><h1 id="title"></h1><p id="label"></p></div><select id="locale" aria-label="Language"><option value="ru">RU</option><option value="lv">LV</option><option value="en">EN</option></select></header><p id="intro"></p><div id="messages" class="messages" role="log" aria-live="polite"></div><div class="controls"><div class="quick"><button id="delivery" type="button"></button><button id="niche" type="button"></button></div><form id="form"><textarea id="input" maxlength="1000" rows="2" required></textarea><button id="send" type="submit"></button></form><button id="reset" type="button"></button></div></section><footer id="warning"></footer></main><script>${script}</script></body></html>`;
  await writeFile(resolve(destination,profile.id+'.html'),html,'utf8');
 }
 const links=profiles.map(p=>`<li><a href="${p.id}.html">${escape(p.name)}</a> — ${escape(p.sector)}</li>`).join('\n');
 await writeFile(resolve(destination,'index.html'),`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10 локальных черновиков — обзор владельца</title><style>body{font:18px/1.6 system-ui;max-width:760px;margin:40px auto;padding:20px;color:#202923}li{margin:16px 0}h1{font-size:32px}</style><h1>Следующая партия · 10 черновиков</h1><p>Локальный обзор для владельца. Это предварительные прототипы без ИИ и каталога. Не отправляйте этот список компаниям. Отдельные страницы не содержат переходов к другим клиентам.</p><ul>${links}</ul></html>`);
 return destination;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Built 10 offline drafts:',await buildNextBatch());
