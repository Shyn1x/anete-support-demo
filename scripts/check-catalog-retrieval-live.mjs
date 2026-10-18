// Read-only merchant pages only. Never calls Workers, OpenAI, accounts or checkout.
import {readFile,writeFile,access} from 'node:fs/promises';
import {getTenant} from '../src/kb.js';import {searchProducts} from '../src/catalog-index.js';import {readCandidates} from '../src/catalog-service.js';
const path=process.argv[2];if(!path)throw Error('Pass a NEW report path. Run npm run build:clients first.');
try{await access(path);throw Error('Report already exists; choose a NEW report path.');}catch(error){if(error.code!=='ENOENT')throw error;}
const cases=[['bariba','What food is best for puppies?'],['hobbyset','Какие акварельные краски выбрать?'],['rotallieta','Busy Board'],['apavi40plus','Josef Seibel 42801'],['celotajs','Какую палатку выбрать?'],['anete','Which vacuum should I choose?']];
const results=[];
for(const [tenant,message]of cases){
 const start=Date.now();let plan;
 if(tenant==='anete')plan={native:true,index:{tenant,importedAt:null},candidates:[]};
 else {const m=JSON.parse(await readFile('public/catalog-index/'+tenant+'/manifest.json','utf8')),products=[];for(const shard of m.shards)products.push(...JSON.parse(await readFile('public/catalog-index/'+tenant+'/'+shard,'utf8')));plan={index:m,candidates:searchProducts({tenant,products},message)};}
 try{const loaded=await readCandidates(plan,getTenant(tenant),message,fetch,true);results.push({tenant,message,matched:loaded.candidates.map(c=>({title:c.t,url:c.u})),readFailures:loaded.readFailures,diagnostics:loaded.diagnostics,products:loaded.products.map(p=>({title:p.title,url:p.url,checkedAt:p.checkedAt,format:p.format,descriptionLines:p.lines.length,descriptionCharacters:p.lines.join('\n').length,variantCount:p.variants.length})),elapsedMs:Date.now()-start});}
 catch(e){results.push({tenant,message,error:e.message,elapsedMs:Date.now()-start});}
 console.log(tenant,results.at(-1).products?.length||0,'read',results.at(-1).error||'');
}
await writeFile(path,JSON.stringify({schema:'catalog-read-only-smoke-v1',checkedAt:new Date().toISOString(),paidOpenAICalls:0,deployedWorkerRequests:0,scope:'Six current merchant search/read probes, not a live AI-quality test or exhaustive catalogue validation.',results},null,2)+'\n',{flag:'wx'});
