// No dependency or credentials required. AI is intentionally disabled in this local adapter.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import worker from '../src/worker.js';
import {BudgetGuard} from '../src/guard.js';
const records=new Map();let tail=Promise.resolve();
const storage={async transaction(fn){const next=tail.then(()=>fn({get:async key=>structuredClone(records.get(key)),put:async(key,value)=>records.set(key,structuredClone(value))}));tail=next.catch(()=>{});return next;}};
const guard=new BudgetGuard({storage},{});
const root=fileURLToPath(new URL('../public/',import.meta.url));
const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.html':'text/html'};
const env={AI_ENABLED:'false',SESSION_SECRET:'local-development-only-not-a-real-secret',GUARD:{idFromName:x=>x,get:()=>({fetch:(url,options)=>guard.fetch(new Request(url,options))})},ASSETS:{async fetch(request){const pathname=new URL(request.url).pathname;const path=pathname==='/'?'/index.html':['/demos','/demos/'].includes(pathname)?'/demos.html':['/usage','/usage/'].includes(pathname)?'/usage.html':pathname;try{const content=await readFile(root+path);const type=Object.entries(mime).find(([ext])=>path.endsWith(ext))?.[1]||'application/octet-stream';return new Response(content,{headers:{'Content-Type':type+'; charset=utf-8'}});}catch{return new Response('Not found',{status:404});}}}};
const port=Number(process.env.PORT||8787);
const server=http.createServer(async(req,res)=>{try{const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>8192){res.writeHead(413);res.end();return;}chunks.push(c);}const url=`http://localhost:${port}${req.url}`;const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);headers.set('CF-Connecting-IP',req.socket.remoteAddress||'local');const response=await worker.fetch(new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Local server error');}});
server.listen(port,'127.0.0.1',()=>console.log(`Demo: http://localhost:${port} (reference mode, no API costs)`));
