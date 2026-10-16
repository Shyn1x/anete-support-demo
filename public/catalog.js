// Allow a dynamic product source only on a host already present in this demo's verified metadata.
export function isProductSource(value,approved){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||!approved)return false;const hosts=new Set([...approved].map(s=>new URL(s).hostname));return hosts.has(u.hostname)&&(/^\/(?:ru\/|lv\/|en\/|et\/|de\/)?(?:products|prece)\//.test(u.pathname)||/^\/[\p{L}\p{N}_.-]+\.html$/u.test(u.pathname));}catch{return false;}}
// Copy only public product context and allowlisted failure codes, never the full chat response.
export function catalogReport(data,approved){
 if(data?.mode!=='catalog'||data.productRead!==false||!isProductSource(data.productURL,approved))return null;
 const attempts=Array.isArray(data.catalogDiagnostics?.attempts)?data.catalogDiagnostics.attempts:[];
 return {schema:'support-catalog-error-v1',checkedAt:new Date().toISOString(),productURL:data.productURL,attempts:attempts.slice(0,2).filter(x=>['html','shopify-json'].includes(x?.format)&&/^(?:http_\d{3}|url|redirect|mime|parse|size|body|timeout|network)$/.test(x?.error)).map(x=>({format:x.format,error:x.error}))};
}
export function mountCatalogDiagnostic(doc,box,data,approved,locale,clipboard=globalThis.navigator?.clipboard){
 const report=catalogReport(data,approved);if(!report)return;
 const copy={ru:['Скопировать причину ошибки','Скопировано','Выделите текст ниже'],lv:['Kopēt kļūdas informāciju','Nokopēts','Atlasiet tekstu zemāk'],en:['Copy error details','Copied','Select the text below']}[locale];
 const button=doc.createElement('button');button.type='button';button.className='catalog-diagnostic';button.textContent=copy[0];
 button.addEventListener('click',async()=>{const value=JSON.stringify(report,null,2);try{await clipboard.writeText(value);button.textContent=copy[1];}catch{let area=box.querySelector('.catalog-diagnostic-text');if(!area){area=doc.createElement('textarea');area.className='catalog-diagnostic-text';area.readOnly=true;area.rows=5;area.setAttribute('aria-label',copy[0]);box.append(area);}area.value=value;area.focus();area.select();button.textContent=copy[2];}});
 box.append(button);
}
