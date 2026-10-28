import {writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
// Concurrent local builds publish complete files instead of truncating a file
// while another test/build reads it. No network or runtime state is involved.
export async function writeBuildFile(path,content){
 const temporary=path+'.'+randomUUID()+'.tmp';
 await writeFile(temporary,content,{flag:'wx'});
 try{await rename(temporary,path);}finally{try{await unlink(temporary);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
