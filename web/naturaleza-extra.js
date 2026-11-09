/* BasatiNa · Complementos de naturaleza. Datos meteorológicos: Open-Meteo. */
(function(){
'use strict';
const zones=[['Pamplona / Iruña',42.8169,-1.6432],['Baztan',43.145,-1.517],['Roncesvalles / Orreaga',43.009,-1.319],['Selva de Irati',42.98,-1.08],['Estella / Lizarra',42.671,-2.032],['Tudela',42.063,-1.605]];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=(title,body)=>'<div class="card"><b>'+title+'</b><div class="note" style="margin-top:8px">'+body+'</div></div>';
const label='<div class="note" style="margin-top:8px">Estimación orientativa basada en previsiones meteorológicas, no en observaciones de campo. Comprueba siempre los avisos oficiales antes de salir.</div>';
function weatherUI(mode){
const id=mode==='setas'?'bnSetas':'bnMonte';
return '<div class="card" id="'+id+'"><b>'+(mode==='setas'?'🍄 Semáforo meteorológico de setas':'🥾 Condiciones para salir al monte')+'</b><div class="note">Selecciona una zona para consultar la previsión de hoy. No equivale a una garantía de seguridad ni de presencia de setas.</div><select class="town" aria-label="Zona de Navarra" style="width:100%;margin:9px 0">'+zones.map((z,i)=>'<option value="'+i+'">'+esc(z[0])+'</option>').join('')+'</select><div class="bnResult note" aria-live="polite">Selecciona una zona para consultar sus condiciones.</div>'+label+'</div>';
}
async function loadWeather(root,mode){
const out=root.querySelector('.bnResult'), z=zones[+root.querySelector('select').value];out.textContent='Consultando previsión…';
try{
const url='https://api.open-meteo.com/v1/forecast?latitude='+z[1]+'&longitude='+z[2]+'&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code,sunrise,sunset&past_days=7&forecast_days=3&timezone=Europe%2FMadrid';
const response=await fetch(url);if(!response.ok)throw Error('Sin respuesta');const d=(await response.json()).daily;const i=d.time.indexOf(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));if(i<0)throw Error('Fecha no disponible');
const rain=d.precipitation_sum.slice(Math.max(0,i-7),i).reduce((a,b)=>a+(Number(b)||0),0),p=d.precipitation_sum[i],wind=d.wind_speed_10m_max[i],temp=d.temperature_2m_max[i],min=d.temperature_2m_min[i],prob=d.precipitation_probability_max[i];
if(mode==='setas'){
const favorable=rain>=15&&rain<=90&&min>=3&&temp<=24, dry=rain<5;
const color=favorable?'#3ccf7a':dry?'#ff8a3d':'#ffb020',state=favorable?'Condiciones meteorológicas favorables':dry?'Poca lluvia reciente':'Condiciones variables';
out.innerHTML='<div style="font-size:18px;font-weight:700;color:'+color+'">● '+state+'</div><div>Precipitación de los 7 días anteriores: <b>'+rain.toFixed(1)+' mm</b> · Hoy: '+p+' mm · Temperatura: '+min+'–'+temp+' °C</div><div>Este indicador no predice la aparición de setas ni identifica especies comestibles.</div>';
}else{
const risk=wind>=60||prob>=80||[95,96,99,75,73,71].includes(d.weather_code[i]), caution=wind>=35||prob>=50||temp<=2;
const color=risk?'#ff4d4d':caution?'#ffb020':'#3ccf7a';
out.innerHTML='<div style="font-size:18px;font-weight:700;color:'+color+'">● '+(risk?'Precaución elevada':caution?'Conviene extremar la precaución':'Sin señales meteorológicas destacadas en este resumen')+'</div><div>Máxima '+temp+' °C · Mínima '+min+' °C · Viento máximo '+wind+' km/h · Probabilidad máxima de lluvia '+prob+' %</div><div>No incluye estado del terreno, aludes, cierres de rutas ni todos los avisos oficiales.</div>';
}
}catch(e){out.textContent='No se ha podido consultar la previsión. Comprueba la conexión y vuelve a intentarlo.';}
}
function insertWeather(section,mode){const sec=document.getElementById('t-'+section);if(!sec)return;sec.insertAdjacentHTML('afterbegin',weatherUI(mode));const root=sec.firstElementChild;root.querySelector('select').addEventListener('change',()=>loadWeather(root,mode));loadWeather(root,mode);}
function moon(date){const known=Date.UTC(2000,0,6,18,14),days=(date.getTime()-known)/86400000,phase=((days/29.530588853)%1+1)%1;return phase<.04||phase>.96?'🌑 Luna nueva':phase<.22?'🌒 Creciente':phase<.29?'🌓 Cuarto creciente':phase<.46?'🌔 Gibosa creciente':phase<.54?'🌕 Luna llena':phase<.71?'🌖 Gibosa menguante':phase<.79?'🌗 Cuarto menguante':'🌘 Menguante';}
function createPages(){
const wrap=document.querySelector('.wrap');if(!wrap)return;
const html='<section id="t-cielo">'+card('🌙 Cielo de Navarra','<div id="bnSky">Consultando horas solares…</div><div style="margin-top:10px">Las fases lunares son aproximadas. Para observación astronómica consulta también nubosidad y contaminación lumínica.</div>')+'</section>'+
'<section id="t-estaciones">'+card('🌿 Navarra por estaciones','<div id="bnSeason"></div><div style="margin-top:10px">Calendario orientativo: la floración, fauna y nieve cambian según el año, la altitud y la meteorología. Respeta los espacios protegidos.</div>')+'</section>';
wrap.insertAdjacentHTML('beforeend',html);
const drawer=document.getElementById('drawer'),group=[...drawer.querySelectorAll('.dgroup')].find(x=>x.textContent.includes('Qué hacer'));if(group){const sub=group.nextElementSibling;sub.insertAdjacentHTML('beforeend','<button data-t="cielo">🌙 Cielo de Navarra</button><button data-t="estaciones">🌿 Navarra por estaciones</button>');}
if(typeof TITLES!=='undefined'){TITLES.cielo='🌙 Cielo de Navarra';TITLES.estaciones='🌿 Navarra por estaciones';}
drawer.querySelectorAll('button[data-t="cielo"],button[data-t="estaciones"]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.t)));
const m=new Date().getMonth(),season=m<=1||m===11?0:m<=4?1:m<=7?2:3;
const seasons=[['❄️ Invierno','Nieve en el Pirineo, aves invernantes y cascadas. Consulta carreteras, hielo y avisos antes de viajar.'],['🌸 Primavera','Floración en la Ribera y valles, bosques verdes y aves migratorias. Evita molestar nidos.'],['☀️ Verano','Rutas tempranas, ríos y observación nocturna del cielo. Atención al calor y al riesgo de incendios.'],['🍂 Otoño','Color en Irati y otros hayedos, migración de aves y temporada de setas regulada.']];
document.getElementById('bnSeason').innerHTML='<div style="font-size:18px;font-weight:700;margin:8px 0">Ahora: '+seasons[season][0]+'</div><p>'+seasons[season][1]+'</p>'+seasons.map(x=>'<div style="padding:8px 0;border-top:1px solid var(--line)"><b>'+x[0]+'</b><div>'+x[1]+'</div></div>').join('');
const sky=document.getElementById('bnSky');sky.innerHTML='<div>'+moon(new Date())+'</div><div>Consultando salida y puesta del sol para Pamplona…</div>';
fetch('https://api.open-meteo.com/v1/forecast?latitude=42.8169&longitude=-1.6432&daily=sunrise,sunset&forecast_days=1&timezone=Europe%2FMadrid').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{sky.innerHTML='<div>'+moon(new Date())+'</div><div>☀️ Amanecer: <b>'+esc(d.daily.sunrise[0].slice(11))+'</b> · Atardecer: <b>'+esc(d.daily.sunset[0].slice(11))+'</b> (Pamplona)</div>';}).catch(()=>sky.insertAdjacentHTML('beforeend','<div>Horario solar no disponible ahora.</div>'));
}
function agenda(){const sec=document.getElementById('t-agenda');if(!sec)return;sec.insertAdjacentHTML('afterbegin',card('📅 Agenda de pueblos · acceso rápido','Consulta las fiestas registradas en los pueblos y la agenda cultural. Los eventos dependen de la información publicada y pueden cambiar. <div style="margin-top:10px"><button class="btn pri" id="bnAgendaCulture">🎭 Ver agenda cultural</button></div>'));document.getElementById('bnAgendaCulture').addEventListener('click',()=>showTab('cultura'));}
function init(){insertWeather('natura','setas');insertWeather('monte','monte');agenda();createPages();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
