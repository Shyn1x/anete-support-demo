import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {writeBuildFile} from '../scripts/atomic-build-file.mjs';
test('concurrent catalogue builds expose only complete JSON to readers and leave no temporary files',async()=>{
 const base=await mkdtemp(join(tmpdir(),'catalogue-atomic-')),path=join(base,'index.json');
 const values=Array.from({length:8},(_,i)=>JSON.stringify({version:i,rows:Array(1000).fill('catalogue entry '+i)}));
 await writeFile(path,values[0]);
 try{
  await Promise.all([...values.map(v=>writeBuildFile(path,v)),(async()=>{for(let i=0;i<100;i++){const text=await readFile(path,'utf8');assert(values.includes(text));assert.equal(JSON.parse(text).rows.length,1000);}})()]);
  assert.deepEqual(await readdir(base),['index.json']);
 }finally{await rm(base,{recursive:true,force:true});}
});
