// Manually reviewed public facts only. Not an inventory/price cache or a feed.
import {productURL} from './catalog.js';
const snapshots=[{
 tenant:'hobbyset',url:'https://hobbyset.lv/products/lv/2372/150958/sort/1/filter/0_0_0_0/Akvare%C4%BCkr%C4%81su-komplekts-12-kr%C4%81sas.html',
 title:'Akvareļkrāsu komplekts, 12 krāsas',checkedAt:'2026-10-18T16:04:30.397Z'
}];
export function reviewedCatalogSnapshot(url,tenant,error,now=Date.now()){
 // Only an explicit access refusal can use a reviewed snapshot. A deleted or
 // redirected product must not be resurrected. Expiry is fixed, not rolling.
 if(!error?.catalogAttempts?.some(x=>x.error==='http_403'))return null;
 const entry=snapshots.find(p=>p.tenant===tenant.id&&p.url===url&&productURL(p.url,tenant)===p.url);
 if(!entry||now<Date.parse(entry.checkedAt)||now-Date.parse(entry.checkedAt)>7*86400000)return null;
 return {title:entry.title,url:entry.url,checkedAt:entry.checkedAt,lines:[],variants:[],summary:{state:'unknown'},chart:[],measure:'unspecified',format:'reviewed-snapshot',reviewedSnapshot:true};
}
