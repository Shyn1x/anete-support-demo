import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const failure=`function demoBootFailure(){if(document.documentElement.dataset.boot==='ready')return;const notice=document.getElementById('boot-status');if(notice){notice.hidden=false;notice.textContent='Чат не загрузился. Нажмите Ctrl+Shift+R. Если не помогло, проверьте, разрешён ли JavaScript для этого сайта. Код: UI_LOAD_FAILED.';}document.documentElement.dataset.boot='failed';}`;
export async function browserBundle({branding=null}={}){
 const plugins=branding?[{name:'pinned-preview-brand',setup(build){build.onResolve({filter:/^\.\/branding\.js$/},()=>({path:branding}));}}]:[];
 const result=await build({entryPoints:[fileURLToPath(new URL('../public/app.js',import.meta.url))],bundle:true,write:false,format:'iife',target:'es2020',platform:'browser',plugins,banner:{js:`${failure}\nwindow.addEventListener('error',demoBootFailure);setTimeout(demoBootFailure,12000);\ntry {`},footer:{js:`} catch { demoBootFailure(); }`}});
 const content=result.outputFiles[0].text;
 return {content,filename:'chat-ui.'+createHash('sha256').update(content).digest('hex').slice(0,12)+'.js'};
}
