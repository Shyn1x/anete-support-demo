import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {catalogPrecisionReason} from '../src/catalog-precision.js';import {catalogReplyRequest} from '../src/catalog-reply.js';import {getTenant} from '../src/kb.js';
const {products:old}=JSON.parse(await readFile(new URL('./fixtures/apavi-comparison-20261019.json',import.meta.url),'utf8'));
const products=[{...old[0],lines:[...old[0].lines,'Siltinājums: Dabīgā aitas vilna','Tehnoloģija: AALTONEN GRIP (pret slīdēšanu)']},{...old[1],lines:[...old[1].lines,'Zābaku stulms ir rotāts ar sudraba krāsas kniedēm.','Aizmugurējā siksniņa ar cilpām: Dekoratīva un praktiska siksniņa papēža daļā.','Rāvējslēdzēja aizdare: Iestrādātais rāvējslēdzējs nodrošina ātru un ērtu uzvilkšanu.']}];
const en=JSON.parse(await readFile(new URL('../docs/audits/2026-10-23-buyer-v8-smoke-live.json',import.meta.url),'utf8')).rows[0].answer.text;
const rows=JSON.parse(await readFile(new URL('../docs/audits/2026-10-23-buyer-v8-language-live.json',import.meta.url),'utf8')).rows;
const ru=rows[0].answer.text,lv=rows[1].answer.text;
const response=out=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(out)}]}]});
for(const [locale,reply]of [['en',en],['ru',ru],['lv',lv]])test('captured accepted live prose exposes qualification loss in '+locale,()=>{assert.equal(catalogPrecisionReason(reply,products),'catalog_material_qualification');});
test('captured RU still cannot infer missing winter functions after fixing hardware colour',()=>{assert.equal(catalogPrecisionReason(ru.replace('серебряными заклёпками','серебристыми заклёпками'),products),'catalog_unsupported_detail');});
test('captured LV decorative zip remains rejected after fixing hardware colour',()=>{assert.equal(catalogPrecisionReason(lv.replace('sudraba kniedēm','sudraba krāsas kniedēm'),products),'catalog_unsupported_detail');});
const corrected={en:en.replace('genuine sheepskin','genuine sheep-wool').replace('silver rivets','silver-coloured rivets'),ru:ru.replace('серебряными заклёпками','серебристыми заклёпками').replace('без специальных зимних функций','зимние характеристики в описании не подтверждены'),lv:lv.replace('sudraba kniedēm','sudraba krāsas kniedēm').replace('dekoratīvu rāvējslēdzēju','rāvējslēdzēju')};
for(const locale of ['ru','lv','en'])test('qualified version of captured answer retains useful comparison in '+locale,()=>{assert.equal(catalogPrecisionReason(corrected[locale],products),null);});
for(const [reply,reason]of [
 ['The first model has sheepskin lining.','catalog_material_qualification'],
 ['У первой модели подкладка из овчины.','catalog_material_qualification'],
 ['Pirmajam modelim ir aitādas odere.','catalog_material_qualification'],
 ['Andres Machado AM6002 has silver rivets.','catalog_material_qualification'],
 ['Вторая модель без специальных зимних функций.','catalog_unsupported_detail'],
 ['The second model has no special winter features.','catalog_unsupported_detail'],
 ['Otrajam modelim nav īpašu ziemas funkciju.','catalog_unsupported_detail'],
 ['Andres Machado AM6002 has a decorative zipper.','catalog_unsupported_detail'],
 ['У второй модели декоративная молния.','catalog_unsupported_detail'],
 ['Andres Machado AM6002 ir dekoratīvs rāvējslēdzējs.','catalog_unsupported_detail']
])test('source-bound terminology guard: '+reply,()=>{assert.equal(catalogPrecisionReason(reply,products),reason);});
test('explicit unavailable winter information is allowed',()=>{assert.equal(catalogPrecisionReason('Andres Machado AM6002: winter functions are unconfirmed.',products),null);});
test('actual sheepskin source is not collapsed to wool-only',()=>{assert.equal(catalogPrecisionReason('The first model has sheepskin lining.',[{...products[0],lines:['Lining: genuine sheepskin']}]),null);});
test('actual precious metal is not rejected because another model has coloured hardware',()=>{const ps=[{...products[0],lines:['Decoration: solid silver rivets']},products[1]];assert.equal(catalogPrecisionReason('Aaltonen 56480 has silver rivets.',ps),null);assert.equal(catalogPrecisionReason('Andres Machado AM6002 has silver rivets.',ps),'catalog_material_qualification');});
test('decorative zipper may be stated when actually documented for that product',()=>{assert.equal(catalogPrecisionReason('Andres Machado AM6002 has a decorative zipper.',[{...products[1],lines:['Closure: decorative zipper']}]),null);});
test('an explicit lack of winter functions may be stated when actually documented',()=>{assert.equal(catalogPrecisionReason('Andres Machado AM6002 has no winter features.',[{...products[1],lines:['This model has no winter features.']}]),null);});
test('gold colour does not become gold composition',()=>{assert.equal(catalogPrecisionReason('Andres Machado AM6002 has gold buckles.',[{...products[1],lines:['Decoration: gold-coloured buckles']}]),'catalog_material_qualification');assert.equal(catalogPrecisionReason('Andres Machado AM6002 has gold-coloured buckles.',[{...products[1],lines:['Decoration: gold-coloured buckles']}]),null);});
for(const [locale,text,reason]of [['en',en,'catalog_material_qualification'],['ru',ru.replace('серебряными заклёпками','серебристыми заклёпками'),'catalog_unsupported_detail'],['lv',lv.replace('sudraba kniedēm','sudraba krāsas kniedēm'),'catalog_unsupported_detail']])test('valid source-reference protocol still rejects captured precision issue in '+locale,()=>{
 const request=catalogReplyRequest(getTenant('apavi40plus'),products,'Compare these two products.',locale,{requireAll:true});assert.throws(()=>request.parse(response({ids:['catalog:0','catalog:1'],reply:text,evidence:['evidence_0_0','evidence_1_0']})),new RegExp(reason));
});
