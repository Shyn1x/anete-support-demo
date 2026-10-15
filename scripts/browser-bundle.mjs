import {build} from 'esbuild';
import {createHash} from 'node:crypto';
const failure=`function demoBootFailure(){if(document.documentElement.dataset.boot==='ready')return;const notice=document.getElementById('boot-status');if(notice){notice.hidden=false;notice.textContent='Чат не загрузился. Нажмите Ctrl+Shift+R. Если не помогло, проверьте, разрешён ли JavaScript для этого сайта. Код: UI_LOAD_FAILED.';}document.documentElement.dataset.boot='failed';}`;
export async function browserBundle(){
 const result=await build({entryPoints:[new URL('../public/app.js',import.meta.url).pathname],bundle:true,write:false,format:'iife',target:'es2020',platform:'browser',banner:{js:`${failure}\nwindow.addEventListener('error',demoBootFailure);setTimeout(demoBootFailure,12000);\ntry {`},footer:{js:`} catch { demoBootFailure(); }`}});
 const content=result.outputFiles[0].text;
 return {content,filename:'chat-ui.'+createHash('sha256').update(content).digest('hex').slice(0,12)+'.js'};
}
