import {BudgetGuard} from '../src/guard.js';
export function memoryStorage(){
 const records=new Map();let tail=Promise.resolve();
 return {records,transaction(fn){const job=tail.then(()=>fn({get:async key=>structuredClone(records.get(key)),put:async(key,value)=>records.set(key,structuredClone(value))}));tail=job.catch(()=>{});return job;}};
}
export function environment(overrides={}){
 const storage=memoryStorage(),env={AI_ENABLED:'false',SESSION_SECRET:'test-only-signing-secret-at-least-32-characters',ASSETS:{fetch:async()=>new Response('<html>test</html>',{headers:{'Content-Type':'text/html'}})},...overrides};
 const guard=new BudgetGuard({storage},env);
 env.GUARD={idFromName:id=>id,get:()=>({fetch:(url,options)=>guard.fetch(new Request(url,options))})};
 return {env,storage,guard};
}
export function request(path='/api/chat',body={tenant:'anete',locale:'ru',message:'Доставка'},extra={}){
 return new Request('https://demo.example'+path,{method:'POST',headers:{'Origin':'https://demo.example','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...extra.headers},body:JSON.stringify(body),...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='headers'))});
}
