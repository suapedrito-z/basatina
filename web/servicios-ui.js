/* =====================================================================
   🧩 PANTALLAS NUEVAS (nov. 2026)
   - El tiempo: marcadores de presión atmosférica y de polen
   - 🔭 Cielo y astronomía (y aviso en el Inicio cuando llega el día)
   - 💊 Farmacias · 🧺 Mercados semanales · 🚌 Transporte público  (grupo «Servicios»)
   - 🦉 Flora y fauna de Navarra · 🌱 Plantas medicinales · 🏞️ Espacios naturales protegidos  (grupo «Vida silvestre»)
   Datos: web/servicios.js (tools/servicios.py) y web/especies.js (tools/especies.py), que se cargan solo al abrir su pantalla.
   Se carga después del script principal de index.html y antes de naturaleza-catalogo.js.
   ===================================================================== */
const SV_N=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function svSec(id,html){const s=document.createElement('section');s.id='t-'+id;s.innerHTML=html;(document.querySelector('.wrap')||document.body).appendChild(s);return s;}
function svDsub(grupo){const g=[...document.querySelectorAll('#drawer .dgroup')].find(x=>SV_N(x.querySelector('span')?.dataset.k||x.textContent).includes(SV_N(grupo)));return g&&g.nextElementSibling;}
function svBtn(sub,t,label,first){if(!sub)return;const b=document.createElement('button');b.dataset.t=t;b.textContent=label;b.onclick=()=>{showTab(t);menu(false);};first?sub.prepend(b):sub.appendChild(b);}
function svLoad(src,glob,cb){if(window[glob])return cb(true);const k='_svL_'+glob;if(window[k]){window[k].push(cb);return;}window[k]=[cb];
  const s=document.createElement('script');s.src=src+'?t='+Math.floor(Date.now()/36e5);const fin=ok=>{const L=window[k];window[k]=null;L.forEach(f=>f(ok));};s.onload=()=>fin(!!window[glob]);s.onerror=()=>fin(false);document.body.appendChild(s);}
const svLink=(u,t)=>`<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`;
const svMapa=(la,lo,t)=>`https://www.google.com/maps/search/?api=1&query=${la},${lo}`;
function svHook(t,fn){const _p=showTab;showTab=function(x){_p(x);if(x===t)setTimeout(fn,30);};}

/* ---------- 🌡️ Presión atmosférica y 🌼 polen (pestaña El tiempo) ---------- */
(function(){const ex=document.getElementById('tExtra');if(!ex)return;
  ex.closest('.card').insertAdjacentHTML('afterend','<div class="card" id="tPP"><b>🧭 Presión y 🌼 polen</b><div class="note">Cargando…</div></div>');})();
const PP_POL=[['grass_pollen','Gramíneas','🌾'],['olive_pollen','Olivo','🫒'],['birch_pollen','Abedul','🌳'],['alder_pollen','Aliso','🌳'],['mugwort_pollen','Artemisa','🌿'],['ragweed_pollen','Ambrosía','🌿']];
const ppNivel=v=>v==null?['—','#9e9e9e',0]:v<1?['Nulo','#9e9e9e',0]:v<10?['Bajo','#43a047',1]:v<50?['Moderado','#f9a825',2]:v<200?['Alto','#ef6c00',3]:['Muy alto','#c62828',4];
function ppGauge(p){// semicírculo de 960 a 1050 hPa
  const a=Math.PI*(1-Math.max(0,Math.min(1,(p-960)/90))),cx=110,cy=100,r=80,x=cx+r*Math.cos(a)*.86,y=cy-r*Math.sin(a)*.86;
  const arc=(v0,v1,c)=>{const a0=Math.PI*(1-(v0-960)/90),a1=Math.PI*(1-(v1-960)/90);return `<path d="M${cx+r*Math.cos(a0)} ${cy-r*Math.sin(a0)} A${r} ${r} 0 0 1 ${cx+r*Math.cos(a1)} ${cy-r*Math.sin(a1)}" stroke="${c}" stroke-width="14" fill="none"/>`;};
  return `<svg viewBox="0 0 220 120" style="width:100%;max-width:260px;display:block;margin:auto">${arc(960,1000,'#5c6bc0')}${arc(1000,1013,'#4fc3f7')}${arc(1013,1025,'#81c784')}${arc(1025,1050,'#ffb74d')}
    <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="currentColor"/>
    <text x="22" y="116" font-size="10" fill="currentColor" opacity=".7">960</text><text x="180" y="116" font-size="10" fill="currentColor" opacity=".7">1050</text>
    <text x="${cx}" y="${cy+18}" font-size="15" font-weight="700" text-anchor="middle" fill="currentColor">${Math.round(p)} hPa</text></svg>`;}
function ppSpark(v,iNow){if(!v||v.length<3)return '';const mn=Math.min(...v)-1,mx=Math.max(...v)+1,W=300,H=60,X=i=>i*W/(v.length-1),Y=x=>H-(x-mn)*H/(mx-mn);
  const d=v.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H+14}" style="width:100%;height:74px;display:block"><path d="${d}" fill="none" stroke="#1e88e5" stroke-width="2.5"/>
    <line x1="${X(iNow)}" x2="${X(iNow)}" y1="0" y2="${H}" stroke="#e53935" stroke-dasharray="3 3"/><text x="${X(iNow)+3}" y="10" font-size="10" fill="#e53935">ahora</text>
    <text x="0" y="${H+12}" font-size="10" fill="currentColor" opacity=".7">hace 24 h</text><text x="${W}" y="${H+12}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">dentro de 24 h</text></svg>`;}
async function ppRender(){const el=document.getElementById('tPP');if(!el||typeof TOWNS==='undefined')return;const t=TOWNS[TOWN];if(!t)return;
  const [w,q]=await Promise.all([getJSON(`${OM}?latitude=${t[1]}&longitude=${t[2]}&current=pressure_msl,surface_pressure&hourly=pressure_msl&past_days=1&forecast_days=2${TZ}`),
    getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${t[1]}&longitude=${t[2]}&hourly=${PP_POL.map(x=>x[0]).join(',')}&forecast_days=4${TZ}`)]);
  let h='<b>🧭 Presión atmosférica</b>';
  if(w&&w.current&&w.hourly){const p=w.current.pressure_msl,H=w.hourly,now=new Date(),iNow=Math.max(0,H.time.findIndex(s=>new Date(s)>now)-1);
    const pv=H.pressure_msl,d3=pv[iNow]-(pv[iNow-3]??pv[iNow]),d24=(pv[iNow+12]??pv[iNow])-pv[iNow];
    const est=p<1000?['Borrasca: tiempo revuelto','#3949ab']:p<1013?['Presión baja: tiempo variable','#0288d1']:p<1025?['Presión normal: tiempo estable','#2e7d32']:['Anticiclón: muy estable, poco viento','#ef6c00'];
    const ten=d3>=1?['⬆️ Subiendo','tiende a mejorar']:d3<=-3?['⬇️ Bajando rápido','posible empeoramiento en horas']:d3<=-1?['↘️ Bajando','puede cambiar a peor']:['➡️ Estable','sin cambios a la vista'];
    h+=ppGauge(p)+`<div style="text-align:center"><b style="color:${est[1]}">${est[0]}</b></div>
      <div class="kpi" style="margin-top:6px"><div><span class="note">Últimas 3 horas</span><b>${ten[0]}</b><span class="note">${d3>0?'+':''}${fmtN(d3,1)} hPa · ${ten[1]}</span></div>
      <div><span class="note">Próximas 12 horas</span><b>${d24>0?'+':''}${fmtN(d24,1)} hPa</b><span class="note">en ${esc(t[0])} (a su altura: ${Math.round(w.current.surface_pressure)} hPa)</span></div></div>
      ${ppSpark(pv.slice(Math.max(0,iNow-24),iNow+25),Math.min(24,iNow))}
      <div class="note">La presión se da «a nivel del mar» para poder comparar pueblos. Si baja deprisa suele llegar viento o lluvia; si sube, tiempo más tranquilo.</div>`;}
  else h+='<div class="note">No se pudo leer la presión ahora.</div>';
  h+='<div style="margin-top:12px"><b>🌼 Polen en el aire</b></div>';
  if(q&&q.hourly){const H=q.hourly,dias=[...new Set(H.time.map(s=>s.slice(0,10)))].slice(0,4),now=new Date();
    const mx=(k,d)=>{let m=null;H.time.forEach((s,i)=>{if(s.startsWith(d)&&H[k]&&H[k][i]!=null)m=Math.max(m??0,H[k][i]);});return m;};
    const cur=k=>{const i=Math.max(0,H.time.findIndex(s=>new Date(s)>now)-1);return H[k]?H[k][i]:null;};
    const filas=PP_POL.map(([k,n,ic])=>{const v=cur(k),L=ppNivel(v),ds=dias.map(d=>ppNivel(mx(k,d)));return {n,ic,v,L,ds,max:Math.max(...dias.map(d=>mx(k,d)??0))};});
    const activos=filas.filter(f=>f.max>=1);
    if(!activos.length)h+='<div class="note">✅ Ahora mismo no hay polen de estas plantas en el aire en '+esc(t[0])+' (es lo normal en otoño e invierno).</div>';
    h+=`<div style="display:grid;grid-template-columns:auto 1fr ${dias.map(()=>'34px').join(' ')};gap:6px 6px;align-items:center;margin-top:6px;font-size:13.5px">
      <span></span><span class="note">ahora</span>${dias.map((d,i)=>`<span class="note" style="text-align:center">${i?DSEM[new Date(d+'T12:00').getDay()].slice(0,3):'Hoy'}</span>`).join('')}
      ${filas.map(f=>`<span>${f.ic} ${f.n}</span><span style="display:flex;align-items:center;gap:6px"><span style="flex:1;height:9px;border-radius:5px;background:rgba(127,127,127,.18);overflow:hidden"><span style="display:block;height:100%;width:${f.L[2]*25}%;background:${f.L[1]}"></span></span><b style="color:${f.L[1]};font-size:12px;min-width:58px">${f.L[0]}</b></span>
        ${f.ds.map(L=>`<span title="${L[0]}" style="height:22px;border-radius:6px;background:${L[2]?L[1]:'rgba(127,127,127,.15)'};color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center">${L[2]||''}</span>`).join('')}`).join('')}</div>
      <div class="note" style="margin-top:6px">Niveles (granos por m³): bajo &lt;10 · moderado 10–50 · alto 50–200 · muy alto &gt;200. Los cuadros son el máximo de cada día (1 bajo … 4 muy alto). Si tienes alergia, sigue las indicaciones de tu médico.</div>`;}
  else h+='<div class="note">No se pudo leer el polen ahora.</div>';
  el.innerHTML=h+'<div class="note" style="margin-top:4px">Fuente: Open‑Meteo (modelos meteorológicos) y Copernicus CAMS (polen).</div>';}
if(typeof extraRender==='function'){const _ppE=extraRender;extraRender=async function(){const r=await _ppE.apply(this,arguments);ppRender();return r;};}

/* ---------- 🔭 CIELO Y ASTRONOMÍA ---------- */
// fases de la Luna (Meeus, «Astronomical Algorithms», cap. 49): q 0 nueva · 1 cuarto creciente · 2 llena · 3 cuarto menguante
function asFase(k,q){const R=Math.PI/180,T=k/1236.85,E=1-0.002516*T,M=(2.5534+29.1053567*k)*R,Mp=(201.5643+385.81693528*k)*R,F=(160.7108+390.67050284*k)*R,O=(124.7746-1.56375588*k)*R,s=Math.sin,c=Math.cos;
  let J=2451550.09766+29.530588861*k+0.00015437*T*T,d;
  if(q===0||q===2){const a=q===0?[-0.4072,0.17241,0.01608,0.01039,0.00739,-0.00514,0.00208]:[-0.40614,0.17302,0.01614,0.01043,0.00734,-0.00515,0.00209];
    d=a[0]*s(Mp)+a[1]*E*s(M)+a[2]*s(2*Mp)+a[3]*s(2*F)+a[4]*E*s(Mp-M)+a[5]*E*s(Mp+M)+a[6]*E*E*s(2*M)-0.00111*s(Mp-2*F)-0.00057*s(Mp+2*F)+0.00056*E*s(2*Mp+M)-0.00042*s(3*Mp)+0.00042*E*s(M+2*F)+0.00038*E*s(M-2*F)-0.00024*E*s(2*Mp-M)-0.00017*s(O);}
  else{d=-0.62801*s(Mp)+0.17172*E*s(M)-0.01183*E*s(Mp+M)+0.00862*s(2*Mp)+0.00804*s(2*F)+0.00454*E*s(Mp-M)+0.00204*E*E*s(2*M)-0.0018*s(Mp-2*F)-0.0007*s(Mp+2*F)-0.0004*s(3*Mp)-0.00034*E*s(2*Mp-M)+0.00032*E*s(M+2*F)+0.00032*E*s(M-2*F)-0.00028*E*E*s(Mp+2*M)+0.00027*E*s(2*Mp+M)-0.00017*s(O);
    const W=0.00306-0.00038*E*c(M)+0.00026*c(Mp)-0.00002*c(Mp-M)+0.00002*c(Mp+M)+0.00002*c(2*F);d+=q===1?W:-W;}
  return new Date((J+d-2440587.5)*864e5-69e3);}
function asFases(desde,hasta){const k0=Math.floor((desde.getFullYear()+desde.getMonth()/12-2000)*12.3685)-1,L=[];
  for(let k=k0;;k++){for(let q=0;q<4;q++){const d=asFase(k+q/4,q);if(d>hasta)return L;if(d>=desde)L.push({q,d});}}}
const AS_FN=[['🌑','Luna nueva','Noche sin Luna: la mejor para ver estrellas y la Vía Láctea.'],['🌓','Cuarto creciente','La Luna se ve por la tarde y primera parte de la noche.'],
  ['🌕','Luna llena','Sale al anochecer y se pone al amanecer. Ilumina mucho el monte de noche.'],['🌗','Cuarto menguante','Sale de madrugada: primeras horas de la noche oscuras.']];
// lluvias de estrellas (máximo aproximado según la IMO; puede variar un día) y otros fenómenos
const AS_LL=[[0,3,'Cuadrántidas','Hasta 80 meteoros por hora en el máximo, pero muy breve. Mira hacia el noreste después de medianoche.'],
  [3,22,'Líridas','Lluvia moderada (unos 18 por hora). Mejor de madrugada.'],[4,6,'Eta Acuáridas','Restos del cometa Halley. Se ven poco desde Navarra: solo en la última hora antes del amanecer.'],
  [7,12,'Perseidas','La más famosa: hasta 100 por hora en cielo oscuro. Mejor de madrugada, mirando al noreste.'],[9,8,'Dracónidas','Suele ser floja, pero a veces sorprende. Mejor al anochecer.'],
  [9,21,'Oriónidas','Restos del cometa Halley, unos 20 por hora. Mejor de madrugada.'],[10,17,'Leónidas','Unos 15 por hora, muy rápidas. Mejor de madrugada.'],
  [11,14,'Gemínidas','La mejor del año: hasta 150 por hora y desde las 22 h. Abrígate bien.'],[11,22,'Úrsidas','Lluvia pequeña cerca del solsticio de invierno.']];
const AS_FIJOS=[['2026-12-21','☀️','Solsticio de invierno','La noche más larga del año. Empieza el invierno.'],['2027-03-20','🌱','Equinoccio de primavera','Día y noche duran casi lo mismo. Empieza la primavera.'],
  ['2027-06-21','☀️','Solsticio de verano','El día más largo del año. Empieza el verano.'],['2027-08-02','🌒','Eclipse total de Sol','La totalidad se verá en el extremo sur de la península; en Navarra será un eclipse parcial por la mañana. Mira solo con gafas homologadas para eclipses.','https://eclipses.ign.es'],
  ['2027-09-23','🍂','Equinoccio de otoño','Empieza el otoño.'],['2027-12-22','☀️','Solsticio de invierno','La noche más larga del año.'],
  ['2028-01-26','💍','Eclipse anular de Sol («anillo de fuego»)','Al atardecer. El anillo se verá en una franja del sur y oeste de España; en Navarra, parcial. Nunca mires al Sol sin gafas homologadas.','https://eclipses.ign.es'],
  ['2028-03-20','🌱','Equinoccio de primavera','Empieza la primavera.'],['2028-06-20','☀️','Solsticio de verano','El día más largo del año.'],['2028-09-22','🍂','Equinoccio de otoño','Empieza el otoño.'],['2028-12-21','☀️','Solsticio de invierno','La noche más larga del año.']];
const asYmd=d=>ymd(d);
function asEventos(dias){const hoy=new Date();hoy.setHours(0,0,0,0);const fin=new Date(hoy.getTime()+dias*864e5),L=[];
  for(const f of asFases(hoy,fin)){const n=AS_FN[f.q];L.push({f:asYmd(f.d),h:f.d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),ico:n[0],t:n[1],d:n[2],luna:1,q:f.q});}
  for(let y=hoy.getFullYear();y<=fin.getFullYear();y++)for(const [m,d,t,x] of AS_LL){const dt=new Date(y,m,d);if(dt>=hoy&&dt<=fin)L.push({f:asYmd(dt),ico:'🌠',t:'Lluvia de estrellas: '+t,d:'Noche del '+d+' al '+(d+1)+' (aprox.). '+x,top:1,ll:1});}
  for(const [f,ico,t,d,u] of AS_FIJOS){const dt=new Date(f+'T12:00');if(dt>=hoy&&dt<=fin)L.push({f,ico,t,d,u,top:1});}
  // la luna estorba a las lluvias de estrellas: lo avisamos
  L.filter(e=>e.ll).forEach(e=>{const m=moon(new Date(e.f+'T23:00'));if(m.ill>60)e.d+=` Ojo: Luna ${m.ill} % iluminada, se verán menos.`;else if(m.ill<25)e.d+=' Sin apenas Luna: buena noche para verla.';});
  return L.sort((a,b)=>(a.f+(a.h||'')).localeCompare(b.f+(b.h||'')));}
svSec('astro',`<div class="card"><b>🔭 El cielo de Navarra</b><div class="note">Fases de la Luna, lluvias de estrellas, eclipses y solsticios. Cuando llega uno importante, sale un aviso en el Inicio.</div>
  <div id="asHoy" style="margin-top:8px"></div></div>
  <div class="card"><b>📅 Próximos fenómenos</b><div class="seg" id="asSeg" style="margin-top:6px"><button class="btn on" data-v="top">⭐ Destacados</button><button class="btn" data-v="all">🗓️ Todo (con la Luna)</button></div><div id="asList" style="margin-top:6px"></div></div>
  <div class="card"><b>🌌 Dónde ver bien las estrellas en Navarra</b><div class="note">Busca sitios altos o abiertos y lejos de las luces de los pueblos: Bardenas Reales, la sierra de Urbasa-Andía, los valles de Roncal y Salazar, la Aezkoa o la sierra de Leyre. Deja 20 minutos a los ojos para acostumbrarse a la oscuridad y usa luz roja.</div></div>
  <div class="note">Fases de la Luna calculadas con los métodos de J. Meeus. Lluvias de estrellas: Organización Internacional de Meteoros (IMO). Eclipses: Observatorio Astronómico Nacional (IGN) · ${svLink('https://eclipses.ign.es','eclipses.ign.es')}.</div>`);
let ASMODE='top';
async function asRender(){const t=(typeof TOWNS!=='undefined'&&TOWNS[TOWN])||['Pamplona',42.8125,-1.6458],m=moon(new Date()),el=document.getElementById('asHoy');
  el.innerHTML=`<div class="kpi"><div><span class="note">${m.ico} Luna hoy</span><b>${m.n}</b><span class="note">${m.ill} % iluminada</span></div><div><span class="note">🌙 Esta noche en ${esc(t[0])}</span><b id="asNube">…</b><span class="note" id="asNubeS"></span></div></div>`;
  const L=asEventos(ASMODE==='top'?800:120).filter(e=>ASMODE==='all'||e.top||e.q===0||e.q===2),hoy=hoyYmd();
  document.getElementById('asList').innerHTML=L.slice(0,ASMODE==='top'?30:40).map(e=>{const dd=Math.round((new Date(e.f+'T12:00')-new Date(hoy+'T12:00'))/864e5);
    return `<div class="st" style="align-items:flex-start"><div style="font-size:26px;line-height:1">${e.ico}</div><div style="flex:1"><b>${esc(e.t)}</b><div class="s">${fLarga(e.f)}${e.h?' · '+e.h+' h':''} · <b>${dd===0?'¡hoy!':dd===1?'mañana':'dentro de '+dd+' días'}</b></div><div class="s">${esc(e.d)}</div>${e.u?`<div class="s">${svLink(e.u,'🔗 Más información')}</div>`:''}</div></div>`;}).join('');
  // nubes esta noche (21 h – 2 h)
  const j=await getJSON(`${OM}?latitude=${t[1]}&longitude=${t[2]}&hourly=cloud_cover&forecast_days=2${TZ}`);
  if(j&&j.hourly){const H=j.hourly,d0=hoyYmd(),d1=ymd(new Date(Date.now()+864e5)),v=[];H.time.forEach((s,i)=>{if((s.startsWith(d0)&&+s.slice(11,13)>=21)||(s.startsWith(d1)&&+s.slice(11,13)<=2))v.push(H.cloud_cover[i]);});
    const c=v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;document.getElementById('asNube').textContent=c==null?'—':c<25?'✨ Despejado':c<60?'⛅ Algunas nubes':'☁️ Cubierto';
    document.getElementById('asNubeS').textContent=c==null?'':'nubes: '+c+' % de 21 h a 2 h';}}
document.querySelectorAll('#asSeg button').forEach(b=>b.onclick=()=>{ASMODE=b.dataset.v;document.querySelectorAll('#asSeg button').forEach(x=>x.classList.toggle('on',x===b));asRender();});
svHook('astro',asRender);
// aviso en el Inicio: fenómeno destacado hoy o en los próximos 2 días, o Luna llena/nueva hoy
(function(){const sb=document.getElementById('sisBanner');if(!sb)return;sb.insertAdjacentHTML('afterend','<div id="asBanner" style="display:none;color:#fff;background:linear-gradient(90deg,#1a237e,#4a148c);padding:8px 10px;border-radius:10px;margin-bottom:8px;font-size:13.5px;cursor:pointer" onclick="showTab(\'astro\')"></div>');})();
function asBanner(){const el=document.getElementById('asBanner');if(!el)return;const hoy=hoyYmd(),L=asEventos(3).filter(e=>e.top||(e.f===hoy&&(e.q===0||e.q===2)));
  if(!L.length){el.style.display='none';return;}const e=L[0],dd=Math.round((new Date(e.f+'T12:00')-new Date(hoy+'T12:00'))/864e5);
  el.style.display='';el.innerHTML=`${e.ico} <b>${dd===0?'Hoy':dd===1?'Mañana':'En '+dd+' días'}: ${esc(e.t)}</b> · toca para ver el cielo`;}
asBanner();svHook('mtiempo',asBanner);

/* ---------- 💊 FARMACIAS ---------- */
svSec('farmacia',`<div class="card" style="border-left:4px solid #2e7d32"><b>💊 Farmacias de guardia</b>
  <div class="note">Las guardias las organiza cada día el Colegio Oficial de Farmacéuticos de Navarra por zonas. Consulta la de hoy en su buscador oficial:</div>
  <div class="row" style="margin-top:6px"><a class="btn pri" href="https://www.farmaceuticos.com/farmacias-de-guardia/navarra/" target="_blank" rel="noopener">🔎 Ver guardias de hoy</a><a class="btn" href="tel:948222111">📞 Colegio: 948 22 21 11</a></div>
  <div class="note" style="margin-top:6px">Cada farmacia pertenece a una <b>zona de guardia</b> (la ves en su ficha, abajo): busca esa zona en el buscador oficial. De noche, algunas farmacias atienden por ventanilla o hay que llamar al timbre, y pueden pedir receta. <b>Si es una urgencia, llama al 112.</b></div></div>
  <div class="card"><b>📍 Farmacias cerca</b><div class="row" style="margin-top:6px"><button class="btn pri" id="faNear">📍 Las más cercanas a mí</button></div>
  <input class="town" id="faQ" type="search" placeholder="🔎 Buscar por pueblo o nombre (p. ej. Elizondo)" style="width:100%;box-sizing:border-box;margin-top:8px">
  <div id="faMsg" class="note"></div><div id="faList" style="margin-top:6px"></div></div>
  <div class="card" style="padding:6px"><div style="position:relative"><canvas id="fac" height="360"></canvas><div style="position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px"><button class="btn mtb" id="facIn">＋</button><button class="btn mtb" id="facOut">－</button></div></div></div>
  <div class="note">Fuente: Farmacias de Navarra · Departamento de Salud / IDENA (Gobierno de Navarra, CC BY 4.0). Si ves algún dato mal, avísanos por el buzón.</div>`);
let FAM=null,FAPOS=null,FASEL=null;
const faL=()=>(window.SERVICIOS&&SERVICIOS.farmacias)||[];
function faFila(f,d){return `<div class="st" style="align-items:flex-start"><div style="flex:1"><b>💊 ${esc(f.n)}</b><div class="s">${esc([f.d,f.m].filter(Boolean).join(' · '))}</div>${f.z?`<div class="s">🛡️ Zona de guardia: <b>${esc(f.z)}</b></div>`:''}
  <div class="row" style="margin-top:4px">${f.tel?`<a class="btn" href="tel:${esc(f.tel.replace(/\s/g,''))}">📞 ${esc(f.tel)}</a>`:''}<a class="btn" href="${svMapa(f.pt[0],f.pt[1])}" target="_blank" rel="noopener">🧭 Cómo llegar</a></div></div>${d!=null?`<span class="note">${fmtN(d,1)} km</span>`:''}</div>`;}
function faRender(){const q=SV_N(document.getElementById('faQ').value.trim()),el=document.getElementById('faList');let L=faL();
  if(!L.length){el.innerHTML='<div class="note">La lista de farmacias llegará con la próxima actualización de datos.</div>';return;}
  if(q)L=L.filter(f=>SV_N(f.n+' '+f.m+' '+f.d+' '+(f.z||'')).includes(q)).slice(0,40);
  else if(FAPOS)L=L.map(f=>({f,d:km(FAPOS.la,FAPOS.lo,f.pt[0],f.pt[1])})).sort((a,b)=>a.d-b.d).slice(0,10).map(x=>x.f);
  else{el.innerHTML=`<div class="note">${faL().length} farmacias en Navarra. Busca tu pueblo o toca «Las más cercanas».</div>`;return;}
  el.innerHTML=L.length?L.map(f=>faFila(f,FAPOS?km(FAPOS.la,FAPOS.lo,f.pt[0],f.pt[1]):null)).join(''):'<div class="note">No hay farmacias con ese nombre.</div>';FAM&&FAM.draw();}
function faDraw(x,P,b,M){for(const f of faL()){const [px,py]=P(f.pt[0],f.pt[1]);if(px<-9||py<-9||px>b.W+9||py>b.H+9)continue;x.beginPath();x.arc(px,py,FASEL===f?9:Math.max(3,Math.min(6,2+M.z*.3)),0,7);x.fillStyle='#2e7d32';x.fill();x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke();}
  if(FAPOS){const [px,py]=P(FAPOS.la,FAPOS.lo);x.beginPath();x.arc(px,py,7,0,7);x.fillStyle='#1e88e5';x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.stroke();}}
function faTap(px,py,M){let best=null,bd=18;for(const f of faL()){const [x,y]=M.P(f.pt[0],f.pt[1]),d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=f;}}FASEL=best;M.draw();
  if(best){document.getElementById('faList').innerHTML=faFila(best,FAPOS?km(FAPOS.la,FAPOS.lo,best.pt[0],best.pt[1]):null);}}
function faInit(){svLoad('servicios.js','SERVICIOS',()=>{if(!FAM){FAM=NavMap('fac',faDraw,faTap);mapBtns('fac',FAM);document.getElementById('faQ').oninput=faRender;
    document.getElementById('faNear').onclick=async()=>{const m=document.getElementById('faMsg');m.textContent='Buscando tu posición…';try{FAPOS=await myPos();m.textContent='';FAM.fit(FAPOS.la-.04,FAPOS.la+.04,FAPOS.lo-.06,FAPOS.lo+.06);faRender();}catch(e){m.textContent='❌ '+e.message;}};}
  faRender();setTimeout(()=>{FAM.draw();FAM.base();},60);});}
svHook('farmacia',faInit);

/* ---------- 🧺 MERCADOS SEMANALES (lista editable: mercados/mercados.json) ---------- */
const MK_PATH='mercados/mercados.json',MK_DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MK_DEF={mercados:[
  ['Pamplona','Landaben (rastro y mercadillo)',6,'9:00–14:30'],['Pamplona','Mercado ecológico',5,'9:30–14:00'],['Barañáin','',1,'8:00–14:00'],['Burlada','',2,'8:00–14:00'],
  ['Villava / Atarrabia','',3,'9:00–13:30'],['Berriozar','',5,'8:00–14:00'],['Beriáin','',5,'9:00–14:00'],['Estella-Lizarra','Plaza de los Fueros (alimentación) y plaza de Santiago',3,'8:00–14:00'],
  ['Tudela','',5,'8:00–14:00'],['Tudela','Mercadillo de antigüedades',6,'10:00–14:00'],['Tafalla','',4,'9:00–14:00'],['Olite / Erriberri','',2,'9:00–14:00'],
  ['Puente la Reina / Gares','',5,'8:00–14:00'],['Artajona','',5,'9:00–14:00'],['Altsasu / Alsasua','',2,'9:00–14:00'],['Etxarri Aranatz','(si es festivo, el martes)',0,''],
  ['Elizondo (Baztan)','Plaza del mercado',3,'9:00–13:00'],['Doneztebe / Santesteban','Plaza del mercado',4,'9:00–13:00'],['Lodosa','',2,'9:00–13:30'],['San Adrián','',3,'9:00–14:00'],
  ['Mendavia','',5,'9:00–14:00'],['Azagra','',0,'9:00–14:00'],['Caparroso','',5,'9:00–14:00'],['Carcastillo','',5,'9:00–14:00'],['Castejón','',0,'9:00–14:00'],
  ['Corella','',2,'9:00–14:00'],['Cintruénigo','',5,'9:00–14:00'],['Cascante','',3,'9:00–14:00'],['Cortes','',4,'9:00–14:00']
].map(([p,l,d,h],i)=>({id:'m'+i,p,l,d,h}))};
let MKDIA=null,MKQ='';
svSec('mercados',`<div class="card"><b>🧺 Mercados y mercadillos semanales</b><div class="note">Fruta, verdura, queso, ropa… Elige un día o busca tu pueblo. Los días de fiesta puede no haber mercado: si vas de lejos, confírmalo con el ayuntamiento.</div>
  <div class="seg" id="mkDias" style="margin-top:8px"></div><input class="town" id="mkQ" type="search" placeholder="🔎 Buscar pueblo" style="width:100%;box-sizing:border-box;margin-top:8px"></div>
  <div class="card" id="mkList"></div>
  <div class="card"><b>🏪 Mercados municipales de Pamplona</b><div class="note">Abiertos de lunes a sábado por la mañana (y algunas tardes): Santo Domingo (Casco Antiguo), Ensanche y Ermitagaña. Basotxoa, mercado de producto local en el Bosquecillo, algunos sábados (mira la Agenda cultural).</div></div>
  <div class="card"><b>📨 ¿Falta tu pueblo o ha cambiado el día?</b><div class="row"><button class="btn pri" onclick="bzIr('Sugerencia','Mercado semanal\\nPueblo: \\nDía: \\nHorario: \\nLugar: ')">📨 Avisar por el buzón</button></div></div>
  <div class="card tech" style="display:none;border:2px solid #8e24aa" id="mkAdm"></div>
  <div class="note">Datos recopilados de ayuntamientos y de mercadillosemanal.com (nov. 2026). Pueden cambiar.</div>`);
async function mkRender(){const G=await jsLoad(MK_PATH,MK_DEF),L=(G.mercados||[]),hoy=(new Date().getDay()+6)%7;if(MKDIA==null)MKDIA=hoy;
  const ds=document.getElementById('mkDias');ds.innerHTML=MK_DIAS.map((d,i)=>`<button class="btn${i===MKDIA&&!MKQ?' on':''}" data-d="${i}">${i===hoy?'Hoy · ':''}${d.slice(0,3)}${L.some(m=>m.d===i)?'':' ·'}</button>`).join('');
  ds.querySelectorAll('button').forEach(b=>b.onclick=()=>{MKDIA=+b.dataset.d;MKQ='';document.getElementById('mkQ').value='';mkRender();});
  const q=SV_N(MKQ),R=(q?L.filter(m=>SV_N(m.p+' '+m.l).includes(q)):L.filter(m=>m.d===MKDIA)).sort((a,b)=>a.d-b.d||a.p.localeCompare(b.p,'es'));
  document.getElementById('mkList').innerHTML=`<b>${q?'🔎 Resultados':(MKDIA===hoy?'📅 Hoy, ':'📅 ')+MK_DIAS[MKDIA].toLowerCase()}</b>`+(R.length?R.map(m=>`<div class="st"><div style="flex:1"><b>🧺 ${esc(m.p)}</b><div class="s">${q?MK_DIAS[m.d]+' · ':''}${esc(m.h||'por la mañana')}${m.l?' · '+esc(m.l):''}</div></div>
    ${TECH?`<button class="btn" data-del="${esc(m.id)}">🗑️</button>`:`<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((m.l&&!/^\(/.test(m.l)?m.l+', ':'')+m.p+', Navarra')}" target="_blank" rel="noopener">📍 Mapa</a>`}</div>`).join(''):'<div class="note">No tenemos ningún mercado apuntado.</div>');
  document.querySelectorAll('#mkList [data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Quitar este mercado de la lista?'))return;try{await jsEdit(MK_PATH,MK_DEF,d=>{d.mercados=d.mercados.filter(x=>x.id!==b.dataset.del);},'Quitar mercado');toast('✅ Quitado');mkRender();}catch(e){toast('❌ '+e.message);}});
  if(TECH){const a=document.getElementById('mkAdm');a.innerHTML=`<b>🔧 Añadir un mercado</b><div class="note">Solo administradores. Se publica en todos los móviles.</div>
    <input class="town" id="mkAP" placeholder="Pueblo *" style="width:100%;box-sizing:border-box;margin-top:6px"><select class="town" id="mkAD" style="width:100%;margin-top:6px">${MK_DIAS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select>
    <input class="town" id="mkAH" placeholder="Horario (p. ej. 9:00–14:00)" style="width:100%;box-sizing:border-box;margin-top:6px"><input class="town" id="mkAL" placeholder="Lugar u observaciones" style="width:100%;box-sizing:border-box;margin-top:6px">
    <div class="row"><button class="btn pri" id="mkAOk">💾 Guardar</button></div>`;
    document.getElementById('mkAOk').onclick=async()=>{const p=document.getElementById('mkAP').value.trim();if(!p)return toast('Falta el pueblo');
      try{await jsEdit(MK_PATH,MK_DEF,d=>{d.mercados=d.mercados||[];d.mercados.push({id:'m'+Date.now(),p,d:+document.getElementById('mkAD').value,h:document.getElementById('mkAH').value.trim(),l:document.getElementById('mkAL').value.trim()});},'Añadir mercado');toast('✅ Guardado');mkRender();}catch(e){toast('❌ '+e.message);}};}}
document.getElementById('mkQ').oninput=e=>{MKQ=e.target.value.trim();mkRender();};
svHook('mercados',mkRender);

/* ---------- 🚌 TRANSPORTE PÚBLICO ---------- */
svSec('bus',`<div class="card"><b>🧭 ¿Cómo voy en transporte público?</b><div class="note">Escribe a dónde quieres ir y te abrimos la ruta en autobús o tren desde donde estás (Google Maps), con horarios y transbordos.</div>
  <input class="town" id="buDest" list="buDL" placeholder="Destino (pueblo, calle o sitio)" style="width:100%;box-sizing:border-box;margin-top:8px"><datalist id="buDL"></datalist>
  <div class="row" style="margin-top:6px"><button class="btn pri" id="buGo">🚌 Ver cómo llegar</button></div></div>
  <div class="card" id="buNear" style="display:none"></div>
  <div class="card"><b>🚍 Villavesas (Comarca de Pamplona)</b><div class="note">Transporte urbano de Pamplona y su comarca. Para ver cuánto falta para la próxima villavesa en tu parada, usa la app oficial «Tu Villavesa» o la web de la Mancomunidad.</div>
  <div class="row" style="margin-top:6px"><a class="btn pri" href="https://www.infotuc.es" target="_blank" rel="noopener">⏱️ Tiempos de paso y líneas</a><a class="btn" href="https://play.google.com/store/search?q=Tu%20Villavesa&c=apps" target="_blank" rel="noopener">📲 App Tu Villavesa</a></div>
  <div class="note" style="margin-top:6px">También hay servicio nocturno los fines de semana y transporte adaptado. Se puede pagar con tarjeta de transporte, bancaria o el móvil.</div></div>
  <div class="card"><b>🚌 Autobuses entre pueblos</b><div class="note">Casi todas las líneas de Navarra salen o pasan por la estación de autobuses de Pamplona. En muchos valles hay además <b>transporte a la demanda</b> (hay que reservar el día antes): pregunta en tu ayuntamiento.</div>
  <div class="row" style="margin-top:6px"><a class="btn" href="https://www.google.com/maps/search/?api=1&query=Estaci%C3%B3n%20de%20autobuses%20de%20Pamplona" target="_blank" rel="noopener">📍 Estación de autobuses de Pamplona</a></div></div>
  <div class="card"><b>🚆 Tren</b><div class="note">Navarra tiene dos líneas de Renfe: <b>Castejón – Tafalla – Pamplona – Altsasu</b> (hacia Vitoria) y <b>Castejón – Tudela – Cortes</b> (hacia Zaragoza y Logroño). Estaciones principales: Pamplona/Iruña, Tudela, Tafalla, Olite, Castejón, Altsasu y Marcilla.</div>
  <div class="row" style="margin-top:6px"><a class="btn pri" href="https://www.renfe.com" target="_blank" rel="noopener">🎫 Horarios y billetes (Renfe)</a></div></div>
  <div class="card"><b>✈️ Aeropuerto de Pamplona (Noáin)</b><div class="note">A unos 7 km del centro. Comprueba en la web de Aena si hay vuelos y cómo llegar.</div><div class="row" style="margin-top:6px"><a class="btn" href="https://www.aena.es/es/pamplona.html" target="_blank" rel="noopener">✈️ Aena · Pamplona</a></div></div>
  <div class="note">Los horarios cambian: consulta siempre la web o la app oficial de cada servicio. Paradas y empresas: IDENA (Gobierno de Navarra y Mancomunidad de la Comarca de Pamplona, CC BY 4.0).</div>`);
function buInit(){pbLoad(()=>{const dl=document.getElementById('buDL');if(!dl.children.length&&window.PUEBLOS)dl.innerHTML=[...new Set(PUEBLOS.pueblos.map(p=>p.n.split(' / ')[0]))].slice(0,1500).map(n=>`<option value="${esc(n)}">`).join('');});
  document.getElementById('buGo').onclick=()=>{const d=document.getElementById('buDest').value.trim();if(!d)return toast('Escribe un destino');
    window.open('https://www.google.com/maps/dir/?api=1&travelmode=transit&destination='+encodeURIComponent(d+(/navarra/i.test(d)?'':', Navarra')),'_blank');};
  svLoad('servicios.js','SERVICIOS',()=>{const B=(window.SERVICIOS&&SERVICIOS.bus)||[],el=document.getElementById('buNear');if(!B.length||el.dataset.ok)return;el.dataset.ok=1;el.style.display='';
    const E=B.filter(o=>o.k==='empresa').sort((a,b)=>a.n.localeCompare(b.n,'es'));
    el.innerHTML=`<b>📍 Paradas cerca de ti</b><div class="note">Villavesas (con el tiempo que falta en cada parada), autobuses entre pueblos y taxis.</div><div class="row" style="margin-top:6px"><button class="btn pri" id="buNb">📍 Buscar paradas cercanas</button></div><div id="buNl"></div>
      ${E.length?`<details style="margin-top:10px"><summary><b>🏢 Empresas de autobús de Navarra (${E.length})</b></summary>${E.map(o=>`<div class="st"><div style="flex:1"><b>${esc(o.n)}</b><div class="s">${esc(o.d||'')}</div></div>${o.tel?`<a class="btn" href="tel:${esc(o.tel.replace(/\s/g,''))}">📞</a>`:''}${urlOk(o.url)?`<a class="btn" href="${esc(o.url)}" target="_blank" rel="noopener">🌐</a>`:''}</div>`).join('')}</details>`:''}`;
    const ico={tuc:'🚍',bus:'🚌',nbus:'🚌',taxi:'🚕'};
    document.getElementById('buNb').onclick=async()=>{const l=document.getElementById('buNl');l.innerHTML='<div class="note">Buscando tu posición…</div>';
      try{const p=await myPos(),N=B.filter(o=>o.k!=='empresa').map(o=>({o,d:km(p.la,p.lo,o.pt[0],o.pt[1])})).sort((a,b)=>a.d-b.d);
        const sel=[...N.filter(x=>x.o.k==='tuc').slice(0,5),...N.filter(x=>x.o.k==='bus'||x.o.k==='nbus').slice(0,5),...N.filter(x=>x.o.k==='taxi').slice(0,2)].filter(x=>x.d<25).sort((a,b)=>a.d-b.d);
        l.innerHTML=sel.length?sel.map(({o,d})=>`<div class="st" style="align-items:flex-start"><div style="flex:1"><b>${ico[o.k]||'🚏'} ${esc(o.n)}</b><div class="s">${o.k==='tuc'?'Villavesa · parada '+esc(o.id||''):esc(o.d||'')}</div>
          <div class="row" style="margin-top:4px">${o.k==='tuc'&&urlOk(o.url)?`<a class="btn pri" href="${esc(o.url)}" target="_blank" rel="noopener">⏱️ Próximas villavesas</a>`:''}${o.tel?`<a class="btn" href="tel:${esc(o.tel.split('/')[0].replace(/\s/g,''))}">📞</a>`:''}${o.k!=='tuc'&&urlOk(o.url)?`<a class="btn" href="${esc(o.url)}" target="_blank" rel="noopener">🌐 Horarios</a>`:''}<a class="btn" href="${svMapa(o.pt[0],o.pt[1])}" target="_blank" rel="noopener">🧭</a></div></div><span class="note">${d<1?Math.round(d*1000)+' m':fmtN(d,1)+' km'}</span></div>`).join('')
          :'<div class="note">No tenemos paradas registradas cerca de ti. Prueba con «¿Cómo voy en transporte público?».</div>';}
      catch(e){l.innerHTML='<div class="note">❌ '+esc(e.message)+'</div>';}};});}
svHook('bus',buInit);

/* ---------- 🌱 PLANTAS MEDICINALES ---------- */
// [nombre, científico, parte que se usa, uso tradicional, dónde crece en Navarra, cuándo, precauciones]
const ME_P=[
 ['Manzanilla','Matricaria chamomilla','Flores','Infusión para la digestión pesada y para relajarse.','Campos, cunetas y terrenos removidos, sobre todo en la Zona Media y la Ribera.','Mayo–julio','Puede dar alergia a quien la tenga a las margaritas y otras compuestas.'],
 ['Manzanilla de Aragón (abrótano hembra)','Santolina chamaecyparissus','Cabezuelas de flores','Infusión digestiva muy tradicional en la Ribera.','Terrenos secos, yesos y cunetas de la Ribera, Bardenas y Zona Media.','Junio–julio','No tomar en el embarazo. Con moderación.'],
 ['Té de roca','Chiliadenus glutinosus (Jasonia glutinosa)','Tallos con flor','Infusión digestiva, típica de los montes de Navarra y Aragón.','Grietas de roca caliza: foces de Lumbier y Arbayún, sierras de la Zona Media y Tierra Estella.','Julio–septiembre','Corta solo unas ramitas, sin arrancarla. En reservas naturales está prohibido recolectar.'],
 ['Tomillo','Thymus vulgaris','Ramitas con flor','Infusión para catarros y digestión; condimento.','Matorrales secos y soleados de la Zona Media y la Ribera.','Abril–junio','El aceite esencial concentrado no se toma.'],
 ['Romero','Salvia rosmarinus','Hojas y ramas','Infusión digestiva; alcohol de romero para friegas (uso externo).','Matorral mediterráneo de la mitad sur.','Todo el año','Evitar dosis altas en el embarazo y en personas con epilepsia.'],
 ['Espliego (lavanda)','Lavandula latifolia','Flores','Uso externo y en saquitos para relajarse y perfumar la ropa.','Laderas secas de la Zona Media, Tierra Estella y la Ribera.','Julio–agosto','El aceite esencial no se toma por boca.'],
 ['Salvia','Salvia officinalis subsp. lavandulifolia','Hojas','Infusión digestiva y gárgaras para la garganta.','Sierras calizas de la Zona Media y Tierra Estella.','Mayo–julio','No tomar mucho tiempo seguido, ni en el embarazo o la lactancia.'],
 ['Malva','Malva sylvestris','Flores y hojas','Infusión suavizante para la tos y la garganta; uso externo en irritaciones.','Cunetas, huertas y bordes de pueblos de toda Navarra.','Abril–septiembre','Recógela lejos de carreteras y de campos tratados.'],
 ['Ortiga','Urtica dioica','Hojas tiernas','Tradicional «depurativa»; también en sopas y tortillas.','Junto a cuadras, huertas y bordes de bosque, sobre todo en el norte.','Marzo–mayo','Usa guantes. Es diurética: cuidado si tomas medicamentos.'],
 ['Saúco','Sambucus nigra','Flores (y frutos maduros, siempre cocinados)','Infusión de flores para resfriados.','Setos, riberas y bordes de pueblo de toda Navarra.','Flores: mayo–junio','Hojas, tallos y frutos verdes o crudos son tóxicos. No confundir con el yezgo (Sambucus ebulus), que es tóxico.'],
 ['Tilo','Tilia platyphyllos','Flores con su hoja alada','Infusión relajante para dormir mejor.','Bosques mixtos del norte; plantado en paseos y plazas.','Junio–julio','Usa flores del año.'],
 ['Espino albar','Crataegus monogyna','Flores y hojas','Tradicional para los nervios y «el corazón».','Setos y bordes de bosque en toda Navarra.','Abril–mayo','Puede interaccionar con medicamentos para el corazón y la tensión: consulta a tu médico.'],
 ['Hipérico (hierba de San Juan)','Hypericum perforatum','Ramitas con flor','Aceite de hipérico para quemaduras leves y golpes (uso externo).','Prados, claros y cunetas de toda Navarra.','Junio–julio','Tomado, interacciona con muchos medicamentos (anticonceptivos, antidepresivos, anticoagulantes…) y hace la piel sensible al sol.'],
 ['Milenrama','Achillea millefolium','Ramitas con flor','Infusión digestiva; uso externo en pequeñas heridas.','Prados y cunetas, sobre todo en el norte y la montaña.','Junio–septiembre','Alergia a compuestas. No en el embarazo.'],
 ['Llantén','Plantago lanceolata y P. major','Hojas','Hoja machacada sobre picaduras; jarabe para la tos.','Caminos, prados y bordes de toda Navarra.','Abril–septiembre','Recógelo en sitios limpios.'],
 ['Cola de caballo','Equisetum arvense','Tallos verdes de verano','Tradicional diurética.','Zonas húmedas, cunetas y riberas.','Abril–junio','No confundir con Equisetum palustre, que es tóxica. No tomar mucho tiempo seguido.'],
 ['Diente de león','Taraxacum officinale','Hojas y raíz','Hojas tiernas en ensalada; amargo digestivo.','Prados, huertas y jardines.','Marzo–mayo','Alergia a compuestas. Es diurético.'],
 ['Hinojo','Foeniculum vulgare','Semillas','Infusión para los gases y la digestión.','Cunetas y bordes soleados de la Zona Media y la Ribera.','Agosto–octubre','¡Peligro! Se confunde con la cicuta y otras umbelíferas mortales. Solo si lo conoces con total seguridad (huele a anís).'],
 ['Poleo','Mentha pulegium','Hojas y ramitas','Infusión digestiva tradicional.','Zonas que se encharcan en invierno.','Julio–septiembre','Su aceite esencial es tóxico para el hígado. Nunca en el embarazo. Solo infusión suave y de vez en cuando.'],
 ['Mastranzo (hierbabuena silvestre)','Mentha suaveolens','Hojas','Infusión digestiva.','Bordes de arroyos y acequias.','Junio–septiembre','El aceite esencial no se toma.'],
 ['Árnica','Arnica montana','Flores','SOLO uso externo, en pomadas para golpes.','Prados ácidos de montaña del Pirineo y el norte.','Junio–julio','Tóxica si se toma. Es escasa: no la arranques.'],
 ['Gordolobo','Verbascum thapsus','Flores','Infusión para la tos.','Terrenos removidos, taludes y cunetas.','Junio–agosto','Filtra muy bien la infusión: los pelillos irritan la garganta.'],
 ['Melisa (toronjil)','Melissa officinalis','Hojas','Infusión relajante y digestiva.','Bordes de huertas y setos frescos.','Mayo–septiembre','Puede interferir con tratamientos de tiroides.'],
 ['Valeriana','Valeriana officinalis','Raíz','Tradicional para dormir.','Bordes húmedos de bosque, sobre todo en el norte.','Otoño','Da sueño: no conduzcas. No mezclar con sedantes ni alcohol.'],
 ['Gayuba','Arctostaphylos uva-ursi','Hojas','Tradicional para infecciones de orina.','Matorrales y pinares de montaña (Pirineo y sierras).','Todo el año','No más de una semana. No en embarazo, lactancia ni niños.'],
 ['Genciana','Gentiana lutea','Raíz','Amargo para abrir el apetito; licores.','Pastos de montaña del Pirineo y Urbasa.','Otoño','Arrancar la raíz mata la planta: no la recolectes. Confusión mortal con el eléboro blanco (Veratrum album).'],
 ['Laurel','Laurus nobilis','Hojas','Digestivo y para cocinar.','Cultivado y asilvestrado en zonas templadas del norte.','Todo el año','No confundir con el laurel cerezo de los jardines, que es tóxico.']];
svSec('medic',`<div class="card" style="border-left:4px solid #c62828"><b>⚠️ Antes de nada</b><div class="note">Aquí contamos los <b>usos tradicionales</b> de estas plantas en Navarra. No es un consejo médico ni sustituye al médico o al farmacéutico. Si estás embarazada, das el pecho, es para un niño o tomas medicación, pregunta antes.
  Recoge solo lo que conozcas con total seguridad, lejos de carreteras y campos tratados, corta solo una parte y nunca en espacios protegidos donde esté prohibido.</div></div>
  <div class="card"><b>🌱 Plantas medicinales de Navarra</b><input class="town" id="meQ" type="search" placeholder="🔎 Buscar (p. ej. tos, digestión, té de roca)" style="width:100%;box-sizing:border-box;margin-top:8px"><div id="meList" style="margin-top:6px"></div></div>
  <div class="note">Textos de divulgación redactados para BasatiNA. Sin fotos: para identificarlas, usa «Identificar plantas o aves» o una guía de campo.</div>`);
function meRender(){const q=SV_N(document.getElementById('meQ').value.trim());
  const L=ME_P.filter(p=>!q||SV_N(p.join(' ')).includes(q));
  document.getElementById('meList').innerHTML=L.length?L.map(([n,s,pa,u,d,e,o])=>`<details class="st" style="display:block"><summary><b>🌿 ${esc(n)}</b> <i class="note">${esc(s)}</i></summary>
    <div class="s" style="margin-top:6px"><b>Se usa:</b> ${esc(pa)}</div><div class="s"><b>Uso tradicional:</b> ${esc(u)}</div><div class="s"><b>Dónde crece:</b> ${esc(d)}</div><div class="s"><b>Cuándo:</b> ${esc(e)}</div>
    <div class="s" style="color:#c62828"><b>⚠️ Ojo:</b> ${esc(o)}</div><div class="s"><a href="#" data-bio="${esc(s.split(' (')[0])}">🦉 Ver su ficha y dónde se ha visto</a></div></details>`).join(''):'<div class="note">No hay ninguna planta con eso.</div>';
  document.querySelectorAll('#meList [data-bio]').forEach(a=>a.onclick=e=>{e.preventDefault();BIQ=a.dataset.bio;showTab('biodiversidad');});}
document.getElementById('meQ').oninput=meRender;svHook('medic',meRender);

/* ---------- 🏞️ ESPACIOS NATURALES PROTEGIDOS ---------- */
const EP_TOP=[['🏞️','Parque Natural Señorío de Bertiz','Bertizarana (Baztan-Bidasoa)','Jardín histórico y bosque atlántico de robles y hayas junto al Bidasoa.',43.146,-1.613],
 ['🏞️','Parque Natural Urbasa-Andía','Sakana y Tierra Estella','Sierras calizas con grandes hayedos, pastos y simas. En su borde nace el Urederra.',42.83,-2.12],
 ['🏜️','Parque Natural de las Bardenas Reales','Ribera','Paisaje semidesértico de arcillas, yesos y cabezos (Castildetierra). También es Reserva de la Biosfera de la UNESCO.',42.17,-1.48],
 ['🌲','Reserva Integral de Lizardoia','Selva de Irati','Hayedo-abetal sin intervención humana dentro de la selva de Irati.',43.0,-1.12],
 ['🌲','Reservas Integrales de Ukerdi y Aztaparreta','Valle de Roncal','Bosques de montaña del Pirineo dejados a su evolución natural.',42.92,-0.85],
 ['🦅','Reserva Natural Foz de Lumbier','Lumbier','Cañón del río Irati con una gran colonia de buitres. Se recorre por la antigua vía del tren.',42.638,-1.29],
 ['🦅','Reserva Natural Foz de Arbayún','Valle de Salazar','Cañón del Salazar de casi 400 m de alto. Se ve desde el mirador de la carretera NA-178.',42.705,-1.18],
 ['💧','Reserva Natural Nacedero del Urederra','Baquedano (Améscoas)','Pozas de agua turquesa. Acceso con cupo diario y reserva previa en temporada.',42.775,-2.13],
 ['🦆','Reserva Natural Laguna de Pitillas','Pitillas','Humedal de la Zona Media con aves acuáticas y esteparias. Humedal Ramsar.',42.415,-1.58],
 ['🦆','Reserva Natural Embalse de las Cañas','Viana','Humedal con carrizal y miles de aves en paso. Humedal Ramsar.',42.48,-2.4],
 ['⛰️','Reserva Natural de Larra','Valle de Belagua','Karst calizo de alta montaña con simas profundas.',42.97,-0.78]];
let EPM=null,EPSEL=null,EPFIG='';
svSec('enp',`<div class="card"><b>🏞️ Patrimonio natural protegido</b><div class="note">Navarra protege sus lugares más valiosos con distintas figuras: parques naturales, reservas integrales y naturales, enclaves naturales, monumentos naturales (sobre todo árboles singulares), áreas naturales recreativas, paisajes protegidos y la Red Natura 2000 europea (ZEC y ZEPA).</div></div>
  <div class="card"><b>⭐ Los imprescindibles</b><div id="epTop" style="margin-top:6px"></div></div>
  <div class="card"><b>🗺️ Todos los espacios</b><select class="town" id="epFig" style="width:100%;margin-top:6px"></select><input class="town" id="epQ" type="search" placeholder="🔎 Buscar por nombre" style="width:100%;box-sizing:border-box;margin-top:6px">
  <div style="position:relative;margin-top:8px"><canvas id="epc" height="360"></canvas><div style="position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px"><button class="btn mtb" id="epcIn">＋</button><button class="btn mtb" id="epcOut">－</button></div></div>
  <div id="epFicha"></div><div id="epList" style="margin-top:6px"></div></div>
  <div class="card"><b>🥾 Normas al visitar</b><div class="note">Ve por los caminos señalizados, no dejes basura, no hagas fuego, lleva al perro atado, no cojas plantas, rocas ni animales y respeta las zonas de nidificación y los cierres temporales. En las reservas naturales e integrales el acceso puede estar limitado: infórmate antes.</div></div>
  <div class="note">Fuente: espacios naturales protegidos, monumentos naturales, zonas húmedas y Red Natura 2000 de Navarra · IDENA (Gobierno de Navarra, CC BY 4.0).</div>`);
const epL=()=>(window.SERVICIOS&&SERVICIOS.enp)||[];
const epCol=f=>/parque/i.test(f)?'#2e7d32':/integral/i.test(f)?'#1b5e20':/reserva/i.test(f)?'#00897b':/enclave/i.test(f)?'#7cb342':/monumento|[áa]rbol/i.test(f)?'#795548':/recreativ/i.test(f)?'#f9a825':/paisaje/i.test(f)?'#8e24aa':/zepa|aves/i.test(f)?'#1e88e5':/zec|lic|natura/i.test(f)?'#26a69a':'#43a047';
function epFicha(o){const el=document.getElementById('epFicha');if(!o){el.innerHTML='';return;}
  el.innerHTML=`<div class="st" style="align-items:flex-start;border:2px solid ${epCol(o.fig)};border-radius:12px;padding:8px;margin-top:8px"><div style="flex:1"><b>${esc(o.n)}</b><div class="s">${esc(o.fig)}${o.cod?' · '+esc(o.cod):''}${o.ha?' · '+fmtN(o.ha,0)+' ha':''}</div>${o.eu?`<div class="s">Euskaraz: ${esc(o.eu)}</div>`:''}${o.d?`<div class="s">🌳 ${esc(o.d)}</div>`:''}
    <div class="row" style="margin-top:4px"><a class="btn" href="${svMapa(o.pt[0],o.pt[1])}" target="_blank" rel="noopener">🧭 Cómo llegar</a>${o.url?`<a class="btn" href="${esc(o.url)}" target="_blank" rel="noopener">📜 Ficha oficial</a>`:`<a class="btn" href="https://www.google.com/search?q=${encodeURIComponent(o.fig+' '+o.n+' Navarra')}" target="_blank" rel="noopener">🔎 Más información</a>`}</div></div></div>`;}
function epDraw(x,P,b,M){const L=epL().filter(o=>!EPFIG||o.fig===EPFIG);
  for(const o of L){const c=epCol(o.fig),sel=EPSEL===o;if(o.r)for(const r of o.r){x.beginPath();r.forEach((q,i)=>{const [px,py]=P(q[0],q[1]);i?x.lineTo(px,py):x.moveTo(px,py);});x.closePath();x.fillStyle=c;x.globalAlpha=sel?.5:.22;x.fill();x.globalAlpha=1;x.strokeStyle=c;x.lineWidth=sel?3:1.2;x.stroke();}
    else{const [px,py]=P(o.pt[0],o.pt[1]);if(px<-9||py<-9||px>b.W+9||py>b.H+9)continue;x.beginPath();x.arc(px,py,sel?8:5,0,7);x.fillStyle=c;x.fill();x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke();}}}
function epTap(px,py,M){const b=M.box(),ll=[b.n-(b.n-b.s)*py/b.H,b.w+(b.e-b.w)*px/b.W];let best=null,bd=16;const L=epL().filter(o=>!EPFIG||o.fig===EPFIG);
  for(const o of L){if(o.r){if(o.r.some(r=>czInside(ll,r))&&(!best||!best.r||(o.r[0].length<best.r[0].length))){best=o;bd=0;}}else{const [x,y]=M.P(o.pt[0],o.pt[1]),d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=o;}}}
  EPSEL=best;epFicha(best);M.draw();}
function epRender(){document.getElementById('epTop').innerHTML=EP_TOP.map(([ic,n,z,d,la,lo])=>`<div class="st" style="align-items:flex-start"><div style="font-size:24px">${ic}</div><div style="flex:1"><b>${esc(n)}</b><div class="s">📍 ${esc(z)}</div><div class="s">${esc(d)}</div></div><a class="btn" href="${svMapa(la,lo)}" target="_blank" rel="noopener">🧭</a></div>`).join('');
  const L=epL(),sel=document.getElementById('epFig');
  if(!L.length){document.getElementById('epList').innerHTML='<div class="note">El mapa con todos los espacios llegará con la próxima actualización de datos.</div>';return;}
  if(!sel.options.length){const F={};L.forEach(o=>F[o.fig]=(F[o.fig]||0)+1);sel.innerHTML='<option value="">Todas las figuras ('+L.length+')</option>'+Object.entries(F).sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([f,n])=>`<option value="${esc(f)}">${esc(f)} (${n})</option>`).join('');
    sel.onchange=()=>{EPFIG=sel.value;EPSEL=null;epFicha(null);epLista();EPM.draw();};document.getElementById('epQ').oninput=epLista;}
  epLista();}
function epLista(){const q=SV_N(document.getElementById('epQ').value.trim()),L=epL().filter(o=>(!EPFIG||o.fig===EPFIG)&&(!q||SV_N(o.n).includes(q))).sort((a,b)=>a.n.localeCompare(b.n,'es'));
  const el=document.getElementById('epList');el.innerHTML=(L.length>60?`<div class="note">${L.length} espacios. Busca o elige una figura para ver menos.</div>`:'')+L.slice(0,60).map((o,i)=>`<div class="st" data-i="${i}" style="cursor:pointer"><div style="flex:1"><b><span style="color:${epCol(o.fig)}">●</span> ${esc(o.n)}</b><div class="s">${esc(o.fig)}</div></div></div>`).join('');
  el.querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>{const o=L[+d.dataset.i];EPSEL=o;epFicha(o);if(o.r){let s=90,n=-90,w=180,e=-180;o.r.forEach(r=>r.forEach(([a,b])=>{s=Math.min(s,a);n=Math.max(n,a);w=Math.min(w,b);e=Math.max(e,b);}));EPM.fit(s,n,w,e);}else EPM.fit(o.pt[0]-.02,o.pt[0]+.02,o.pt[1]-.03,o.pt[1]+.03);document.getElementById('epc').scrollIntoView({behavior:'smooth'});});}
function epInit(){svLoad('servicios.js','SERVICIOS',()=>{if(!EPM){EPM=NavMap('epc',epDraw,epTap);mapBtns('epc',EPM);}epRender();setTimeout(()=>{EPM.draw();EPM.base();},60);});}
svHook('enp',epInit);

/* ---------- 🦉 FLORA, FAUNA Y SETAS DE NAVARRA (web/especies.js) ---------- */
let BIQ='',BITP='',BIG='',BIZ='',BIMES=false,BIN=40,BISEL=null;
svSec('biodiversidad',`<div class="card"><b>🦉 Flora, fauna y setas de Navarra</b><div class="note">Fichas de las especies que más se observan en Navarra: qué son, en qué zonas se han visto y en qué meses. Las zonas salen de miles de observaciones reales (museos, Gobierno de Navarra, naturalistas…). Que una especie no salga en tu zona no quiere decir que no esté.</div>
  <div class="seg" id="biTp" style="margin-top:8px"><button class="btn on" data-v="">Todas</button><button class="btn" data-v="Fauna">🦌 Fauna</button><button class="btn" data-v="Flora">🌿 Flora</button><button class="btn" data-v="Setas">🍄 Setas</button></div>
  <input class="town" id="biQ" type="search" placeholder="🔎 Nombre, científico o euskera (p. ej. tejón, Fagus)" style="width:100%;box-sizing:border-box;margin-top:8px">
  <div style="display:flex;gap:6px;margin-top:6px"><select class="town" id="biG" style="flex:1"></select><select class="town" id="biZ" style="flex:1"></select></div>
  <label class="note" style="display:flex;align-items:center;gap:6px;margin-top:6px"><input type="checkbox" id="biMes"> Solo lo que se ve este mes</label><div id="biCnt" class="note"></div></div>
  <div class="card" id="biFicha" style="display:none"></div><div id="biList"></div>
  <div class="note">Observaciones: ${svLink('https://www.gbif.org','GBIF.org')} (CC0 / CC BY). Textos: Wikipedia en español (CC BY-SA 4.0), con enlace a cada artículo. Amenaza: Lista Roja de la UICN. No damos ubicaciones exactas de ninguna especie.</div>`);
const BI_IU={CR:['En peligro crítico','#b71c1c'],EN:['En peligro','#d84315'],VU:['Vulnerable','#ef6c00'],NT:['Casi amenazada','#f9a825']};
const biIco=g=>({'Aves':'🐦','Mamíferos':'🦊','Reptiles':'🦎','Anfibios':'🐸','Peces':'🐟','Mariposas':'🦋','Libélulas':'🪰','Escarabajos':'🪲','Plantas con flor':'🌼','Coníferas':'🌲','Helechos':'🌿','Setas':'🍄'}[g]||'🌱');
const biL=()=>(window.ESPECIES&&ESPECIES.e)||[];
function biMeses(m){const mx=Math.max(1,...m);return `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;align-items:end;height:46px;margin-top:4px">${m.map((v,i)=>`<div title="${NMES[i]}: ${v}" style="height:${Math.max(3,Math.round(v/mx*40))}px;background:${i===new Date().getMonth()?'#e65100':'#43a047'};border-radius:3px 3px 0 0"></div>`).join('')}</div>
  <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;font-size:10px;text-align:center" class="note">${NMES.map(x=>`<div>${x[0].toUpperCase()}</div>`).join('')}</div>`;}
function biFicha(o){const el=document.getElementById('biFicha');if(!o){el.style.display='none';return;}BISEL=o;el.style.display='';const iu=BI_IU[o.iu],tot=o.z.reduce((a,z)=>a+z[1],0)||1;
  el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:17px">${biIco(o.g)} ${esc(o.n)}</b><div class="note"><i>${esc(o.s)}</i>${o.eu?' · euskeraz: <b>'+esc(o.eu)+'</b>':''}</div><div class="note">${esc(o.g)}${o.f?' · familia '+esc(o.f):''}</div></div><button class="btn" id="biX">✕</button></div>
   ${iu?`<div style="margin-top:6px;display:inline-block;padding:3px 8px;border-radius:8px;color:#fff;background:${iu[1]};font-size:12.5px">⚠️ ${iu[0]} (Lista Roja UICN)</div>`:''}
   ${o.tp==='Setas'?'<div class="note" style="color:#c62828;margin-top:6px">⚠️ Nunca comas una seta solo por esta ficha. Muchas comestibles tienen gemelas mortales: consulta a un experto o a una sociedad micológica.</div>':''}
   ${o.w?`<div style="margin-top:8px;line-height:1.5">${esc(o.w.x)}</div><div class="note">${o.w.u?svLink(o.w.u,'📖 Seguir leyendo en Wikipedia'):''}</div>`:''}
   ${o.rev?`<details style="margin-top:8px" open><summary><b>✅ Ficha revisada por BasatiNA</b></summary>${Object.entries(o.rev.campos||{}).map(([k,v])=>`<div class="s" style="margin-top:6px"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}
     ${(o.rev.fuentes||[]).length?'<div class="note" style="margin-top:6px">Fuentes: '+o.rev.fuentes.map(([n,u])=>svLink(u,esc(n))).join(' · ')+'</div>':''}</details>`:''}
   ${o.z.length?`<div style="margin-top:10px"><b>📍 Dónde se ve en Navarra</b>${o.z.map(([z,n])=>`<div class="s" style="display:flex;align-items:center;gap:6px;margin-top:3px"><span style="flex:1">${esc(z)}</span><span style="width:90px;height:8px;background:rgba(127,127,127,.18);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(n/tot*100)}%;background:#2e7d32"></span></span></div>`).join('')}
     <div class="note" style="margin-top:4px">Barras: parte de las observaciones en cada zona (zonas aproximadas).${o.sens?' 🔒 Especie sensible: no la molestes ni difundas dónde la ves.':''}</div></div>`:''}
   ${o.m&&o.m.some(Boolean)?`<div style="margin-top:10px"><b>📅 Meses en que más se observa</b>${biMeses(o.m)}</div>`:''}
   <div class="note" style="margin-top:8px">${o.c?o.c+' observaciones en Navarra · ':''}${o.k?svLink('https://www.gbif.org/species/'+o.k,'Ver en GBIF'):''}</div>`;
  document.getElementById('biX').onclick=()=>{biFicha(null);};el.scrollIntoView({behavior:'smooth'});}
function biRender(){const L=biL(),el=document.getElementById('biList');
  if(!L.length){el.innerHTML='<div class="card"><div class="note">Las fichas se están preparando y llegarán con la próxima actualización de datos.</div></div>';return;}
  const gs=document.getElementById('biG'),zs=document.getElementById('biZ');
  const G=[...new Set(L.filter(o=>!BITP||o.tp===BITP).map(o=>o.g))].sort((a,b)=>a.localeCompare(b,'es'));if(BIG&&!G.includes(BIG))BIG='';
  gs.innerHTML='<option value="">Todos los grupos</option>'+G.map(g=>`<option${g===BIG?' selected':''}>${esc(g)}</option>`).join('');
  if(!zs.options.length){const Z=[...new Set(L.flatMap(o=>o.z.map(z=>z[0])))].sort();zs.innerHTML='<option value="">Toda Navarra</option>'+Z.map(z=>`<option>${esc(z)}</option>`).join('');}
  zs.value=BIZ;const q=SV_N(BIQ),mes=new Date().getMonth();
  const R=L.filter(o=>(!BITP||o.tp===BITP)&&(!BIG||o.g===BIG)&&(!BIZ||o.z.some(z=>z[0]===BIZ))&&(!q||SV_N(o.n+' '+o.s+' '+(o.eu||'')+' '+o.f).includes(q))
    &&(!BIMES||(o.m&&o.m[mes]>0&&o.m[mes]>=Math.max(...o.m)*.25))).sort((a,b)=>b.c-a.c);
  document.getElementById('biCnt').textContent=R.length+' de '+L.length+' fichas'+(ESPECIES.t?' · actualizado '+ESPECIES.t:'');
  el.innerHTML='<div class="card">'+R.slice(0,BIN).map((o,i)=>`<div class="st" data-i="${i}" style="cursor:pointer"><div style="font-size:22px">${biIco(o.g)}</div><div style="flex:1"><b>${esc(o.n)}</b>${o.iu&&BI_IU[o.iu]?` <span style="color:${BI_IU[o.iu][1]};font-size:12px">⚠️ ${BI_IU[o.iu][0]}</span>`:''}${o.rev?' <span class="note">✅</span>':''}
    <div class="s"><i>${esc(o.s)}</i> · ${esc(o.g)}</div><div class="s">${o.z.slice(0,2).map(z=>esc(z[0].split(' (')[0])).join(' · ')}</div></div></div>`).join('')+
    (R.length>BIN?`<div class="row"><button class="btn pri" id="biMore">Ver más (${R.length-BIN})</button></div>`:'')+(R.length?'':'<div class="note">No hay fichas con estos filtros.</div>')+'</div>';
  el.querySelectorAll('[data-i]').forEach(d=>d.onclick=()=>biFicha(R[+d.dataset.i]));const mb=document.getElementById('biMore');if(mb)mb.onclick=()=>{BIN+=40;biRender();};}
document.querySelectorAll('#biTp button').forEach(b=>b.onclick=()=>{BITP=b.dataset.v;BIN=40;document.querySelectorAll('#biTp button').forEach(x=>x.classList.toggle('on',x===b));biRender();});
document.getElementById('biQ').oninput=e=>{BIQ=e.target.value;BIN=40;biRender();};
document.getElementById('biG').onchange=e=>{BIG=e.target.value;BIN=40;biRender();};
document.getElementById('biZ').onchange=e=>{BIZ=e.target.value;BIN=40;biRender();};
document.getElementById('biMes').onchange=e=>{BIMES=e.target.checked;BIN=40;biRender();};
function biInit(){document.getElementById('biQ').value=BIQ;document.getElementById('biList').innerHTML='<div class="card"><div class="note">Cargando fichas…</div></div>';
  svLoad('especies.js','ESPECIES',()=>{biRender();if(BIQ){const L=biL(),o=L.find(x=>SV_N(x.s)===SV_N(BIQ));if(o)biFicha(o);}});}
svHook('biodiversidad',biInit);

/* ---------- 📋 menú, títulos, iconos y escenas ---------- */
(function(){
  const vs=svDsub('Vida silvestre');svBtn(vs,'biodiversidad','🦉 Flora y fauna de Navarra',true);svBtn(vs,'medic','🌱 Plantas medicinales');svBtn(vs,'enp','🏞️ Espacios naturales protegidos');
  svBtn(svDsub('El tiempo'),'astro','🔭 Cielo y astronomía');
  // grupo nuevo «Servicios», detrás de Localidades
  const loc=svDsub('Localidades');if(loc){loc.insertAdjacentHTML('afterend','<div class="dgroup"><span>Servicios</span><i>▸</i></div><div class="dsub"></div>');
    const g=loc.nextElementSibling,sub=g.nextElementSibling;
    g.onclick=()=>{const o=!g.classList.contains('open');document.querySelectorAll('#drawer .dgroup').forEach(x=>x.classList.remove('open'));if(o)g.classList.add('open');};
    svBtn(sub,'farmacia','💊 Farmacias de guardia');svBtn(sub,'mercados','🧺 Mercados semanales');svBtn(sub,'bus','🚌 Transporte público');}
  Object.assign(TITLES,{biodiversidad:'🦉 Flora, fauna y setas',medic:'🌱 Plantas medicinales',enp:'🏞️ Espacios naturales protegidos',astro:'🔭 Cielo y astronomía',
    farmacia:'💊 Farmacias',mercados:'🧺 Mercados semanales',bus:'🚌 Transporte público'});
  Object.assign(PVS_ESC,{biodiversidad:'bosque',medic:'bosque',enp:'bosque',astro:'cielo',farmacia:'pueblo',mercados:'pueblo',bus:'carretera'});
  Object.assign(ICK,{biodiversidad:'paw-print',medic:'plant',enp:'mountains',astro:'globe',farmacia:'plant',mercados:'basket',bus:'car','g:Servicios':'map-pin'});
  Object.assign(ICC,{biodiversidad:'#8d6e63',medic:'#2e7d32',enp:'#2e7d32',astro:'#3949ab',farmacia:'#2e7d32',mercados:'#e64a19',bus:'#1e88e5','g:Servicios':'#e53935'});
  Object.assign(BNK,{biodiversidad:'i-hoja',medic:'i-hoja',enp:'i-monte',astro:'i-tiempo',mercados:'i-comer',bus:'i-carretera',farmacia:'i-pin','g:Servicios':'i-pin'});
  Object.assign(BNF,{biodiversidad:'g',medic:'g',enp:'g',astro:'b',farmacia:'g',mercados:'r',bus:'b','g:Servicios':'r'});
  try{if(typeof applyIcons==='function')applyIcons((CFG.iconos||'pro')==='pro');}catch(e){}
})();
