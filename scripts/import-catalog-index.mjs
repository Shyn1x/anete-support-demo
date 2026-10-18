// Explicit, read-only public sitemap import. Never runs during build or deployment.
import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {productURL,plain} from '../src/catalog.js';import {getTenant} from '../src/kb.js';
const roots={bariba:'https://www.bariba.lv/sitemap.xml',hobbyset:'https://hobbyset.lv/sitemap.xml',rotallieta:'https://rotallieta.lv/sitemap.xml',apavi40plus:'https://apavi40plus.com/sitemap.xml',celotajs:'https://veikalscelotajs.lv/sitemap.xml'};
const unxml=s=>plain(String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'));
export function sitemapEntries(xml,tenant){
 if(/<!DOCTYPE|<!ENTITY/iu.test(xml))throw Error('Unsafe XML');const rows=[],categories=new Map();
 if(tenant.id==='hobbyset')for(const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gu)){const u=unxml(m[1]);const match=u.match(/\/categories\/lv\/(\d+)\/.*?([^/]+)\.html$/u);if(match)categories.set(match[1],decodeURIComponent(match[2]).replace(/-/g,' '));}
 for(const m of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gu)){
  let raw=unxml(m[1].match(/<loc>([\s\S]*?)<\/loc>/u)?.[1]||'');
  // HobbySet publishes http sitemap addresses; upgrade only its own exact host.
  if(tenant.id==='hobbyset')raw=raw.replace(/^http:\/\/hobbyset\.lv\//,'https://hobbyset.lv/');
  try{raw=new URL(raw).href;}catch{continue;}const url=productURL(raw,tenant);if(!url)continue;
  const imageTitle=unxml(m[1].match(/<image:title>([\s\S]*?)<\/image:title>/u)?.[1]||'');
  const title=imageTitle||decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1)).replace(/\.html$/,'').replace(/-/g,' ');
  if(title.length>2&&title.length<700)rows.push({u:url,t:title,...(tenant.id==='hobbyset'?{c:categories.get(new URL(url).pathname.match(/^\/products\/(?:lv|ru|en)\/(\d+)\//)?.[1])||''}:{})});
 }return rows;
}
export function sitemapChildren(xml,root){
 const own=new URL(root);return [...xml.matchAll(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gu)].map(m=>unxml(m[1].match(/<loc>([\s\S]*?)<\/loc>/u)?.[1]||'')).filter(s=>{try{const u=new URL(s);return u.origin===own.origin&&!u.username&&!u.password&&/\/(?:product-sitemap\d*|sitemap_products_\d+)\.xml$/.test(u.pathname);}catch{return false;}});
}
async function download(url){
 const response=await fetch(url,{headers:{Accept:'application/xml,text/xml','User-Agent':'LomentiDemoCatalog/1.0 (read-only public catalogue)'},redirect:'manual',signal:AbortSignal.timeout(30000)});
 if(response.status!==200)throw Error('Sitemap HTTP '+response.status);if(!/xml/i.test(response.headers.get('content-type')||''))throw Error('Sitemap content type');
 const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>20000000){await reader.cancel();throw Error('Sitemap size cap');}chunks.push(value);}return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
}
export async function importCatalog(tenantId,output='public/catalog-index'){
 const tenant=getTenant(tenantId),root=roots[tenantId];if(!tenant||!root)throw Error('Unknown import tenant');
 const xml=await download(root),children=sitemapChildren(xml,root);if(children.length>10)throw Error('Too many product sitemaps');
 const all=sitemapEntries(xml,tenant);for(const child of children)all.push(...sitemapEntries(await download(child),tenant));
 const grouped=new Map();for(const row of all){const key=tenantId==='hobbyset'?new URL(row.u).pathname.match(/^\/products\/(?:lv|ru|en)\/\d+\/(\d+)\//)?.[1]:new URL(row.u).pathname.replace(/^\/(ru|lv|en|et|de)(?=\/)/,'');if(!key)continue;const prev=grouped.get(key);if(!prev||/\/products\/lv\//.test(row.u))grouped.set(key,row);}
 const rows=[...grouped.values()].sort((a,b)=>a.u.localeCompare(b.u));if(!rows.length||rows.length>30000)throw Error('Unexpected catalogue size: '+rows.length);
 const dir=output+'/'+tenantId;await mkdir(dir,{recursive:true});
 const shards=[];for(let i=0;i<rows.length;i+=150){const name=String(i/150).padStart(3,'0')+'.json';await writeFile(dir+'/'+name,JSON.stringify(rows.slice(i,i+150))+'\n');shards.push(name);}
 const manifest={schema:'shop-catalog-index-v1',tenant:tenantId,importedAt:new Date().toISOString(),source:root,sourcePages:1+children.length,entries:rows.length,completeSitemapImport:true,fullDescriptionImport:false,shards};
 await writeFile(dir+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
async function main(){const args=process.argv.slice(2);if(args.length!==1||!roots[args[0]])throw Error('Usage: node scripts/import-catalog-index.mjs SHOP');console.log(JSON.stringify(await importCatalog(args[0]),null,2));}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
