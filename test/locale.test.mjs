import test from 'node:test';import assert from 'node:assert/strict';
import {detectLocale} from '../src/locale.js';
for(const [query,expected]of [
 ['Какая гарнтия на тавар?','ru'],['What is the warranty?','en'],['Can I return something if I changed my mind?','en'],['Do you deliver outside Latvia?','en'],['Nopirku preci, bet tā salūza. Ko darīt?','lv'],['Gribu atdot preci, jo pārdomāju.','lv'],['Gribu atdot preci jo pardomaju','lv'],['garantija','lv'],['warranty','en'],['Спасибо','ru'],['Paldies','lv'],['Thanks','en']]){
 for(const fallback of ['ru','lv','en'])test(`language ${query} after ${fallback}`,()=>assert.equal(detectLocale(query,fallback),expected));
}
test('ambiguous short messages retain active language',()=>{for(const lang of ['ru','lv','en'])for(const text of ['OK','123','Anete','DPD','?',''])assert.equal(detectLocale(text,lang),lang);});
test('mixed language tie retains selected language',()=>assert.equal(detectLocale('гарантия warranty','lv'),'lv'));
