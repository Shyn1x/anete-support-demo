// Translate only allowlisted guard reasons; never display raw server error text.
export function limitMessage(locale,data={},now=Date.now()){
 const seconds=Number.isFinite(Date.parse(data.retryAt))?Math.max(1,Math.ceil((Date.parse(data.retryAt)-now)/1000)):60;
 const minutes=Math.max(1,Math.ceil(seconds/60));
 const copy={
  ru:{minute:`Слишком много сообщений подряд. Повторите примерно через ${minutes} мин.`,day:'Достигнут дневной лимит сообщений. Попробуйте после 00:00 UTC — это 03:00 по Риге летом и 02:00 зимой.',budget:'Резерв ИИ временно недоступен. Попробуйте задать вопрос проще: о доставке, оплате, возврате или гарантии.',other:'Слишком много запросов. Подождите немного и повторите.'},
  lv:{minute:`Pārāk daudz ziņu pēc kārtas. Mēģiniet vēlreiz aptuveni pēc ${minutes} min.`,day:'Sasniegts dienas ziņu limits. Mēģiniet pēc 00.00 UTC — plkst. 03.00 Rīgā vasarā un 02.00 ziemā.',budget:'AI rezerve pašlaik nav pieejama. Mēģiniet jautāt vienkāršāk: par piegādi, apmaksu, atgriešanu vai garantiju.',other:'Pārāk daudz pieprasījumu. Nedaudz uzgaidiet un mēģiniet vēlreiz.'},
  en:{minute:`Too many messages in a row. Try again in about ${minutes} min.`,day:'The daily message limit has been reached. Try after 00:00 UTC — 03:00 in Riga in summer and 02:00 in winter.',budget:'The AI allowance is temporarily unavailable. Try a simpler question about delivery, payment, returns or warranty.',other:'Too many requests. Please wait a little and try again.'}
 }[locale]||null;
 if(!copy)return limitMessage('en',data,now);
 return data.reason==='minute_rate'?copy.minute:data.reason==='day_rate'?copy.day:data.error==='budget_exhausted'?copy.budget:copy.other;
}
