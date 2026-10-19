// Keep the original options when a customer opens one of them. The active
// product is tracked separately, so “the first one” still refers to the list.
export function nextCatalogChoices(current,data,valid){
 if(data.mode==='social')return current;
 const incoming=(Array.isArray(data.catalogURLs)?data.catalogURLs:data.mode==='catalog'&&data.productURL?[data.productURL]:[]).filter(valid).slice(0,3);
 if(!data.catalogMetadataOnly&&incoming.length===1&&current.length>1&&current.includes(incoming[0]))return current;
 return incoming;
}
