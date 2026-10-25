import {createConversation} from './conversation.mjs';
// Replaced with one profile by the build. No client-side tenant selector/registry.
const profile=__DRAFT_PROFILE__,sources=__DRAFT_SOURCES__;
const starter=__DRAFT_STARTER__;

const strings={
 ru:{title:'Помощник',label:'Локальный черновик · без подключения ИИ',intro:'Независимая демонстрация. Здесь нет связи с магазином, заказами и каталогом. Проверяем ответы по подготовленным сведениям.',hello:'Здравствуйте! 🙂 Что хотите узнать?',placeholder:'Задайте вопрос без персональных данных…',send:'Отправить',reset:'Новый разговор',warning:'Черновик не отправляет сообщения и не сохраняет переписку.',source:'Источники',input:'Ваш вопрос',delivery:'Как доставят заказ?',niche:'У меня вопрос о товаре',redacted:'[Сообщение с личными данными скрыто]'},
 lv:{title:'Palīgs',label:'Lokāls melnraksts · bez pieslēgta MI',intro:'Neatkarīga demonstrācija. Nav savienojuma ar veikalu, pasūtījumiem vai katalogu. Pārbaudām sagatavotās informācijas atbildes.',hello:'Labdien! 🙂 Ko vēlaties uzzināt?',placeholder:'Jautājums bez personas datiem…',send:'Sūtīt',reset:'Jauna saruna',warning:'Melnraksts nesūta ziņas un nesaglabā sarunu.',source:'Avoti',input:'Jūsu jautājums',delivery:'Kā piegādā pasūtījumu?',niche:'Jautājums par preci',redacted:'[Ziņa ar personas datiem paslēpta]'},
 en:{title:'Assistant',label:'Local draft · no AI connection',intro:'Independent demonstration. No connection to the shop, orders or catalogue. We are rehearsing answers from prepared information.',hello:'Hello! 🙂 What would you like to know?',placeholder:'Ask without personal information…',send:'Send',reset:'New conversation',warning:'This draft does not send messages or save conversations.',source:'Sources',input:'Your question',delivery:'How is an order delivered?',niche:'I have a product question',redacted:'[Message containing personal details hidden]'}
};
const el=id=>document.getElementById(id);
let locale='ru';
let conversation=createConversation(profile,locale);
function bubble(text,role='assistant',refs=[]){
 const node=document.createElement('article');node.className='message '+role;node.textContent=text;
 if(refs.length){const list=document.createElement('nav');list.setAttribute('aria-label',strings[locale].source);
  for(const id of refs){const source=sources.find(s=>s.id===id);if(!source)continue;
   const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=new URL(source.url).pathname==='/'?profile.name:decodeURI(new URL(source.url).pathname).replaceAll('-',' ');list.append(link);}
  node.append(list);
 }
 el('messages').append(node);
}
function setLanguage(next,reset=false){locale=next;const s=strings[locale];document.documentElement.lang=locale;
 el('title').textContent=profile.name;el('label').textContent=s.label;el('intro').textContent=s.intro;el('input').placeholder=s.placeholder;el('input').setAttribute('aria-label',s.input);
 el('send').textContent=s.send;el('reset').textContent=s.reset;el('warning').textContent=s.warning;el('delivery').textContent=s.delivery;el('niche').textContent=starter[locale];
 if(reset){conversation=createConversation(profile,locale);el('messages').replaceChildren();bubble(s.hello);}
}
function ask(text){if(!text.trim())return;const answer=conversation.next(text);locale=answer.locale;el('locale').value=locale;setLanguage(locale);bubble(answer.kind==='privacy'?strings[locale].redacted:text,'user');bubble(answer.answer,'assistant',answer.sources);el('input').value='';}
el('form').addEventListener('submit',e=>{e.preventDefault();ask(el('input').value);});
el('locale').addEventListener('change',e=>{setLanguage(e.target.value);conversation=createConversation(profile,locale);});
el('reset').addEventListener('click',()=>setLanguage(locale,true));
el('delivery').addEventListener('click',()=>ask(strings[locale].delivery));
el('niche').addEventListener('click',()=>ask(starter[locale]));
setLanguage(locale,true);
