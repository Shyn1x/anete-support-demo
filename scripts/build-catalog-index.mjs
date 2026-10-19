import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {getTenant} from '../src/kb.js';import {validateIndex} from '../src/catalog-index.js';
export async function catalogueAsset(id){
 const root='public/catalog-index/'+id,manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));
 if(manifest.schema!=='shop-catalog-index-v1'||manifest.tenant!==id||!Array.isArray(manifest.shards)||manifest.shards.some(n=>!/^\d{3}\.json$/.test(n)))throw Error('Invalid catalogue manifest');
 const products=[];for(const name of manifest.shards)products.push(...JSON.parse(await readFile(root+'/'+name,'utf8')));
 if(products.length!==manifest.entries)throw Error('Incomplete catalogue index: '+id);
 return JSON.stringify(validateIndex({...manifest,products},getTenant(id)));
}
export async function buildCatalogues(){for(const id of ['bariba','hobbyset','rotallieta','apavi40plus','celotajs'])await buildSearchIndex(id);}

// Build-time work only: the deployed Worker reads a small posting list/shard.
export async function buildSearchIndex(id){
 const {concepts,fold,prefixBucket,searchProducts}=await import('../src/catalog-index.js');
 const all=JSON.parse(await catalogueAsset(id)),groups=Object.fromEntries(concepts.map(([key])=>[key,[]])),buckets=new Map();
 for(const [i,p]of all.products.entries()){
  const text=fold(p.t+' '+decodeURIComponent(new URL(p.u).pathname));
  for(const [key,,match]of concepts)if(match.test(text))groups[key].push(i);
  const words=new Set((text.match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>1).map(w=>w.slice(0,4)));
  for(const word of words){const bucket=prefixBucket(word);if(!buckets.has(bucket))buckets.set(bucket,{});const values=buckets.get(bucket);(values[word]??=[]).push(i);}
 }
 const root='public/catalog-data/'+id;await mkdir(root+'/rows',{recursive:true});await mkdir(root+'/terms',{recursive:true});
 for(let i=0;i<all.products.length;i+=150)await writeFile(root+'/rows/'+String(i/150).padStart(3,'0')+'.json',JSON.stringify(all.products.slice(i,i+150))+'\n');
 for(const [key,value]of buckets)await writeFile(root+'/terms/'+key+'.json',JSON.stringify(value)+'\n');
 const safeGroups={};for(const [key,q]of [['kitten','котят'],['puppy','щенок'],['paint','краски'],['food','корм'],['tent','палатка'],['boot','ботинки'],['shoe','обувь'],['backpack','рюкзак']])safeGroups[key]=groups[key].filter(i=>searchProducts({tenant:id,products:[all.products[i]]},q,{limit:1}).length);
 const {products,shards,...meta}=all;await writeFile('public/catalog-'+id+'.json',JSON.stringify({...meta,schema:'shop-catalog-search-v1',groups,safeGroups})+'\n');
}
