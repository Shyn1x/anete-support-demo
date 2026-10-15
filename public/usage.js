const q=id=>document.getElementById(id),money=n=>'$'+(n/1e6).toFixed(2);
const inRiga=value=>new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Riga',dateStyle:'short',timeStyle:'short'}).format(new Date(value))+' (Рига)';
async function refresh(){q('usage-refresh').disabled=true;try{
 const response=await fetch('/api/usage',{signal:AbortSignal.timeout(10000)});const data=await response.json();
 q('usage-login').hidden=response.status!==401;q('usage-details').hidden=!response.ok;
 if(response.status===401){q('usage-state').textContent='Введите пароль демо для чтения счётчиков. Это не API-ключ.';return;}
 if(!response.ok)throw Error('unavailable');
 q('usage-state').textContent='Счётчики прочитаны. Платных запросов не выполнялось.';
 const reasons={total_budget:'Общий резерв исчерпан. Нужен отдельный выбор владельца; автоматического повышения нет.',daily_budget:'Дневной резерв исчерпан.',minute_rate:'Достигнут лимит 10 сообщений в минуту для текущего подключения.',day_rate:'Достигнут лимит 100 сообщений в сутки UTC для текущего подключения.'};
 q('usage-result').textContent=reasons[data.blockedBy]||'Резерв для запросов есть.';
 q('daily').textContent=`За сутки UTC: зарезервировано ${money(data.daily.reservedMicroUSD)} из ${money(data.daily.limitMicroUSD)}. Осталось ${money(data.daily.remainingMicroUSD)}.`;
 q('total').textContent=`За весь эксперимент: зарезервировано ${money(data.total.reservedMicroUSD)} из ${money(data.total.limitMicroUSD)}. Осталось ${money(data.total.remainingMicroUSD)}.`;
 q('remaining').textContent=`Общий доступный запас: ${data.budgetCallsRemaining} попыток ИИ; с учётом частоты прямо сейчас — ${data.callsAvailableNow}.`;
 q('client').textContent=`Для текущего подключения осталось сообщений: ${data.clientRate.minuteRemaining} в текущую минуту и ${data.clientRate.dayRemaining} за сутки UTC. Для другого устройства/сети значения могут отличаться.`;
 q('reset').textContent=`Следующие сутки: ${inRiga(data.nextDayUTC)}. Следующая минута: ${inRiga(data.nextMinuteUTC)}.`;
 }catch{q('usage-state').textContent='Не удалось прочитать счётчики. Повторите позже.';q('usage-details').hidden=true;}finally{q('usage-refresh').disabled=false;}}
q('usage-refresh').addEventListener('click',refresh);
q('usage-login').addEventListener('submit',async e=>{e.preventDefault();const password=q('password').value;q('password').value='';try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!r.ok){q('usage-state').textContent='Не удалось войти. Проверьте пароль или повторите позже.';return;}await refresh();}catch{q('usage-state').textContent='Ошибка соединения.';}});
refresh();
