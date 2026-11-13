/* =====================================================================
   ✨ NOVEDADES · 13 nov. 2026 (se carga el último, después de arbustos.js)
   1. «BasatiNA» siempre con la «NA» en rojo, como en el logo, en todas las pantallas.
   2. Vida silvestre: «Flora y fauna» (antes «Flora, fauna y setas»), con «Arbustos» dentro.
   3. Se retiran las «Fichas de flora» (fichas-arboles.js) y los parches de naturaleza-catalogo.js.
   4. Seguridad: enlaces externos fuera de la app y PIN con bloqueo tras varios fallos.
   5. Inicio → «Ahora en Navarra»: carrusel con todo lo de hoy, mañana y pasado (cambia cada 3 s)
      y los ríos por zonas (Arga alta/media/baja, Irati, Ega, Aragón, Ebro), también rotando.
   6. Grupo «NA Salud»: Tiempo y salud (presión y dolores, calor/frío, UV, aire, polen,
      diario de dolores), Plantas medicinales, Farmacias y teléfonos de urgencia.
   7. Idioma: Castellano · Euskara · English · Français (diccionarios en idiomas.js).
   Reglas del proyecto: no se reescribe nada de index.html; todo se engancha envolviendo funciones.
   ===================================================================== */
(function(){'use strict';
const $=id=>document.getElementById(id);
const nv=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const E=s=>(typeof esc==='function'?esc(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));

/* ---------- estilos ---------- */
document.head.insertAdjacentHTML('beforeend',`<style id="nvCss">
.na{color:#DD4826!important;font-weight:inherit}
#drawer .dhead .na,.bnaHero .na,#pvSec .na,#pvBox .na{color:#DD4826!important;opacity:1!important;text-shadow:0 0 2px #fff,0 0 6px rgba(255,255,255,.95),0 0 10px rgba(255,255,255,.7)}
#anTk{display:block;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 8px rgba(29,45,35,.05);overflow:hidden}
#anTk .anC{display:flex;align-items:center;gap:11px;padding:12px 12px 10px;cursor:pointer;min-height:64px;animation:anIn .45s ease}
#anTk .anC>div{flex:1;min-width:0}
#anTk .anC b{display:block;font-size:14.5px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#anTk .anC small{display:block;color:var(--mut);font-size:12.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#anTk .anW{color:#3D7031!important;font-weight:800}
#anTk .anE{font-size:22px;width:40px;height:40px;border-radius:13px;background:#F3F6F1;display:flex;align-items:center;justify-content:center;flex:none}
#anTk .anS{display:flex;gap:6px;padding:8px 10px 0;overflow-x:auto;scrollbar-width:none}
#anTk .anS button{flex:none;border:1px solid var(--line);background:transparent;color:inherit;border-radius:14px;padding:3px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
#anTk .anS button.on{background:#3D7031;border-color:#3D7031;color:#fff}
#anTk .anF{display:flex;align-items:center;gap:8px;padding:0 10px 8px}
#anTk .anF button{border:none;background:#F3F6F1;color:inherit;border-radius:12px;width:46px;height:38px;font-size:26px;font-weight:700;line-height:1;cursor:pointer;flex:none}
#anTk .anF button:active{transform:scale(.92)}
#anTk .anF span{font-size:11.5px;color:var(--mut);white-space:nowrap}
#anTk .anBar{flex:1;height:4px;background:rgba(127,127,127,.18);border-radius:3px;overflow:hidden}
#anTk .anBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3D7031,#097BA4);animation:anProg 3s linear forwards}
#anTk.pause .anBar i{animation-play-state:paused}
@keyframes anIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
@keyframes anProg{from{width:0}to{width:100%}}
body:not(.bna) #anTk,body:not(.bna) #anTk .anF button,body:not(.bna) #anTk .anE{background:var(--panel)}
.saG{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.saI{border:1px solid var(--line);border-radius:14px;padding:10px;background:rgba(127,127,127,.04)}
.saI b{display:block;font-size:14px}.saI .lv{display:inline-block;margin-top:4px;padding:2px 9px;border-radius:12px;color:#fff;font-size:12px;font-weight:800}
.saI .s{font-size:12.5px;margin-top:4px;color:var(--mut);line-height:1.35}
.saI details{margin-top:4px;font-size:12.5px}.saI summary{cursor:pointer;color:var(--acc)}
.saI ul{margin:4px 0 0;padding-left:18px}
@media(max-width:380px){.saG{grid-template-columns:1fr}}
#nvLang{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
#nvLang>div{background:var(--panel,#fff);color:var(--txt);border-radius:18px;padding:16px;width:min(92vw,360px);box-shadow:0 10px 40px rgba(0,0,0,.35)}
#nvLang button.l{display:flex;width:100%;align-items:center;gap:10px;padding:12px;margin-top:8px;border-radius:12px;border:1px solid var(--line);background:transparent;color:inherit;font:inherit;font-size:16px;cursor:pointer;text-align:left}
#nvLang button.l.on{border-color:#3D7031;box-shadow:0 0 0 2px rgba(61,112,49,.2);font-weight:800}
</style>`);

/* =====================================================================
   1. «BasatiNA» con la «NA» en rojo en cualquier texto que aparezca
   ===================================================================== */
const NA_NO=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','SELECT','TITLE','NOSCRIPT','CANVAS']);
function naText(n){const v=n.nodeValue;if(!v||v.indexOf('BasatiNA')<0)return;const p=n.parentNode;
  if(!p||p.nodeType!==1||NA_NO.has(p.nodeName)||p.namespaceURI==='http://www.w3.org/2000/svg')return;
  if(p.closest&&p.closest('.na,[contenteditable="true"],svg'))return;
  const fr=document.createDocumentFragment(),parts=v.split('BasatiNA');
  parts.forEach((t,i)=>{if(t)fr.appendChild(document.createTextNode(t));
    if(i<parts.length-1){fr.appendChild(document.createTextNode('Basati'));const s=document.createElement('span');s.className='na';s.textContent='NA';fr.appendChild(s);}});
  p.replaceChild(fr,n);}
function naScan(root){if(!root)return;if(root.nodeType===3)return naText(root);
  if(root.nodeType!==1||NA_NO.has(root.nodeName))return;
  if((root.textContent||'').indexOf('BasatiNA')<0)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];let n;
  while((n=w.nextNode()))if(n.nodeValue.indexOf('BasatiNA')>=0)L.push(n);L.forEach(naText);}
let NAQ=new Set(),NAR=0;
function naFlush(){NAR=0;const L=[...NAQ];NAQ.clear();L.forEach(x=>{if(x.isConnected)naScan(x);});}
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')NAQ.add(m.target);else m.addedNodes.forEach(x=>NAQ.add(x));}
  if(NAQ.size&&!NAR)NAR=requestAnimationFrame(naFlush);}).observe(document.body,{childList:true,subtree:true,characterData:true});
setTimeout(()=>naScan(document.body),0);
// la cabecera lo hacía solo con el tema nuevo: ahora siempre
try{if(typeof bnWord==='function'){const _bw=bnWord;bnWord=function(on){_bw(true);};bnWord(true);}}catch(e){}

/* =====================================================================
   2. Vida silvestre: «Flora y fauna», con Arbustos dentro
   ===================================================================== */
const dr=$('drawer');
// accesos que ya no van en el menú (Arbustos pasa a estar dentro de Flora y fauna;
// Fauna, Vegetación y Árboles por zonas ya se habían quitado del menú)
['natfau','natveg','natarb','arbustos','fichas-arboles'].forEach(t=>dr&&dr.querySelectorAll(`button[data-t="${t}"]`).forEach(b=>b.remove()));
try{TITLES.biodiversidad='🦉 Flora y fauna';}catch(e){}
(function(){const s=$('t-biodiversidad');if(!s)return;const h=s.querySelector('.card b');if(h)h.textContent='🦉 Flora y fauna de Navarra';
  const tp=$('biTp');if(tp&&!tp.querySelector('[data-v="Arbustos"]')){tp.insertAdjacentHTML('beforeend','<button class="btn" data-v="Arbustos">🌿 Arbustos</button>');
    const b=tp.querySelector('[data-v="Arbustos"]');b.onclick=()=>{BITP='Arbustos';BIN=40;tp.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));biRender();};}
  const nt=s.querySelector('.card .note');if(nt)nt.insertAdjacentHTML('beforeend',' <span>Incluye los arbustos de Navarra, con su nombre en euskera, floración y usos tradicionales.</span>');})();
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function arbMeses(t){t=nv(t);const m=Array(12).fill(0);if(/todo el ano/.test(t)){m.fill(1);return m;}
  const f=MESES.map((x,i)=>[t.indexOf(x),i]).filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  if(!f.length){if(/primavera/.test(t))[2,3,4].forEach(i=>m[i]=1);return m;}
  if(f.length>=2&&/\ba\b|-|–/.test(t)){let i=f[0];for(let k=0;k<12;k++){m[i]=1;if(i===f[1])break;i=(i+1)%12;}}else f.forEach(i=>m[i]=1);return m;}
function arbConv(){let A=[];try{A=ARBUSTOS_NAVARRA;}catch(e){}
  return (A||[]).map(a=>({k:0,g:'Arbustos',tp:'Arbustos',n:a.nombre,s:a.cientifico,eu:a.euskera,f:'',z:[],m:arbMeses(a.floracion),c:0,arb:a}));}
// las fichas de arbustos se añaden a la lista de especies cuando se carga web/especies.js
(function(){const inj=v=>{if(v&&Array.isArray(v.e)&&!v.e.some(o=>o.arb))v.e=v.e.concat(arbConv());return v;};
  let _E=window.ESPECIES;if(_E){inj(_E);return;}
  try{Object.defineProperty(window,'ESPECIES',{configurable:true,enumerable:true,get(){return _E;},set(v){_E=inj(v);}});}catch(e){}})();
try{const _bf=biFicha;biFicha=function(o){if(!o||!o.arb)return _bf(o);const a=o.arb,el=$('biFicha');BISEL=o;el.style.display='';
  const tox=/t[oó]xic|venen/i.test(a.usos+' '+a.descripcion);
  el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div style="display:flex;gap:10px;align-items:center">${typeof bnTile==='function'?bnTile('biodiversidad',24,44):''}
     <div><b style="font-size:17px;font-family:'Montserrat',system-ui,sans-serif">🌿 ${E(a.nombre)}</b><div class="note"><i>${E(a.cientifico)}</i>${a.euskera?' · <span>euskeraz</span>: <b>'+E(a.euskera)+'</b>':''}</div><div class="note"><span>Arbusto</span></div></div></div><button class="btn" id="biX">✕</button></div>
   ${tox?'<div class="note" style="color:#c62828;margin-top:6px"><span>⚠️ Planta tóxica: no la comas ni la uses como remedio.</span></div>':''}
   <div style="margin-top:10px"><b>📍 <span>Dónde vive en Navarra</span></b><div class="s" style="margin-top:3px">${E(a.zona)}</div></div>
   <div style="margin-top:10px"><b>🌸 <span>Floración</span></b><div class="s" style="margin-top:3px">${E(a.floracion)}</div>${o.m.some(Boolean)&&typeof biMeses==='function'?biMeses(o.m):''}</div>
   <div style="margin-top:10px;line-height:1.5"><b><span>Cómo es</span></b><div>${E(a.descripcion)}</div></div>
   <div style="margin-top:10px;line-height:1.5"><b>🧺 <span>Usos y tradición</span></b><div>${E(a.usos)}</div></div>
   <div class="note" style="margin-top:8px"><span>Los usos tradicionales son información cultural, no un consejo médico.</span></div>`;
  $('biX').onclick=()=>biFicha(null);el.scrollIntoView({behavior:'smooth'});};}catch(e){console.log(e);}
// la pantalla antigua «Arbustos de Navarra» lleva ahora a Flora y fauna → Arbustos
const _st0=showTab;showTab=function(t){if(t==='arbustos'||t==='fichas-arboles'){try{BITP='Arbustos';BIN=40;document.querySelectorAll('#biTp button').forEach(x=>x.classList.toggle('on',x.dataset.v==='Arbustos'));}catch(e){}t='biodiversidad';}_st0(t);};

/* =====================================================================
   4. Seguridad
   ===================================================================== */
// 4a. En la app, los enlaces a otras webs se abren en el navegador del móvil y no dentro de BasatiNA
if(typeof APP!=='undefined'&&APP&&window.AndroidNet&&window.AndroidNet.openUrl){
  const ext=u=>/^(https?:|mailto:|tel:|geo:)/i.test(String(u||''));
  document.addEventListener('click',e=>{if(e.defaultPrevented)return;const a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    const h=a.getAttribute('href')||'';if(!ext(h))return;e.preventDefault();try{window.AndroidNet.openUrl(a.href);}catch(x){}});
  const _wo=window.open;window.open=function(u){if(ext(u)){try{window.AndroidNet.openUrl(String(u));return null;}catch(x){}}return _wo.apply(window,arguments);};}
// 4b. PIN: tras 5 fallos seguidos hay que esperar (30 s, 1 min, 2 min…)
(function(){const ok=$('pinOk');if(!ok||typeof ok.onclick!=='function')return;const orig=ok.onclick,K='pinFail';
  const get=()=>{try{return JSON.parse(localStorage.getItem(K))||{n:0,t:0};}catch(e){return {n:0,t:0};}},put=v=>{try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}};
  const espera=s=>'⏳ '+s+' s';
  ok.onclick=async function(){const f=get(),now=Date.now(),msg=$('pinMsg'),inp=$('pinIn');
    if(f.t>now){msg.textContent=espera(Math.ceil((f.t-now)/1000));inp.value='';return;}
    const m0=typeof pinMode!=='undefined'?pinMode:'';await orig.apply(this,arguments);
    const box=$('pinBox'),open=box&&box.style.display!=='none';
    const fallo=(m0==='enter'||m0==='key')&&open&&pinMode===m0&&!inp.value&&!TECH;
    if(fallo){f.n++;if(f.n>=5){f.t=now+30000*Math.pow(2,Math.min(6,f.n-5));msg.textContent=espera(Math.round((f.t-now)/1000));}put(f);}
    else if(TECH||pinMode==='new')put({n:0,t:0});};})();

/* =====================================================================
   5. Inicio → «Ahora en Navarra»: todo lo de hoy, mañana y pasado, pasando cada 10 s
   ===================================================================== */
const ANT={L:[],i:0,t:0,day:'',busy:false,tm:0,f:(()=>{try{return localStorage.getItem('anFil')||'';}catch(e){return '';}})()};
const AN_FIL=[['','Todo'],['cultura','Cultura'],['deporte','Deporte'],['otros','Otros']];
const anVis=()=>ANT.L.filter(x=>!ANT.f||(ANT.f==='otros'?!['cultura','deporte'].includes(x.tab):x.tab===ANT.f));
const AN_DIA=['Hoy','Mañana','Pasado mañana'];
const anDias=()=>[0,1,2].map(i=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+i);return ymd(d);});
const hNum=h=>{const m=String(h||'').match(/(\d{1,2})[:.](\d{2})/);return m?(+m[1])*60+(+m[2]):9999;};
async function anLoad(){if(ANT.busy)return;ANT.busy=true;const D=anDias(),L=[];
  try{// 🎭 agenda cultural
    if(typeof AG_PATH!=='undefined'&&typeof agEnDia==='function'){const G=await jsLoad(AG_PATH,AG_DEF).catch(()=>null),seen=new Set();
      (G&&G.eventos||[]).forEach(e=>{for(let i=0;i<3;i++)if(agEnDia(e,D[i])&&!seen.has(e.id||e.t)){seen.add(e.id||e.t);
        const larga=!!(e.ff&&e.ff>e.f&&e.f<D[0]);
        L.push({d:i,f:D[i],h:larga?'':(e.h||''),ico:agIco(e.cat),t:e.t,s:[e.lugar,e.pueblo].filter(Boolean).join(' · '),hasta:larga?e.ff:'',tab:'cultura',bd:['ok','Cultura'],o:larga?2:0});break;}});}
    // 🏆 deporte navarro
    if(typeof DP_PATH!=='undefined'){const G=BNDP||await jsLoad(DP_PATH,DP_DEF).catch(()=>null);
      (G&&G.partidos||[]).forEach(x=>{const i=D.indexOf(x.f);if(i<0||/descanso/i.test((x.loc||'')+' '+(x.vis||'')))return;
        const dep=(typeof DP_DEPS!=='undefined'&&DP_DEPS.find(y=>y[0]===x.dep))||['','','🏆'];
        L.push({d:i,f:x.f,h:x.h||'',ico:dep[2],t:(x.loc||'')+' – '+(x.vis||''),s:[x.comp,x.lugar].filter(Boolean).join(' · '),res:x.res||'',tab:'deporte',bd:['az','Deporte'],o:1});});}
    // 🧺 mercados semanales
    if(typeof MK_PATH!=='undefined'){const G=await jsLoad(MK_PATH,MK_DEF).catch(()=>null);
      const M=(G&&G.mercados||[]).map(m=>Array.isArray(m)?{p:m[0],l:m[1],d:m[2],h:m[3]}:m);
      D.forEach((f,i)=>{const wd=(new Date(f+'T12:00').getDay()+6)%7;M.filter(m=>m.d===wd).forEach(m=>L.push({d:i,f,h:m.h||'',ico:'🧺',t:'',tl:['Mercado semanal',m.p],s:m.l||'',tab:'mercados',bd:['am','Mercado'],o:3}));});}
    // 🔭 cielo
    if(typeof asEventos==='function'){try{asEventos(3).filter(e=>e.top||(e.luna&&(e.q===0||e.q===2))).forEach(e=>{const i=D.indexOf(e.f);if(i>=0)L.push({d:i,f:e.f,h:e.h||'',ico:e.ico,t:e.t,s:'',tab:'astro',bd:['az','Cielo'],o:4});});}catch(x){}}
    // 📅 tu calendario (solo en este móvil)
    if(typeof lsGet==='function')lsGet('agendaMia',[]).forEach(x=>{const i=D.indexOf(x.f);if(i>=0)L.push({d:i,f:x.f,h:x.h||'',ico:'📅',t:x.t,s:'',tl:null,cal:1,bd:['ok','Tu calendario'],o:-1});});
    // 🩺 salud: día propenso a dolores de cabeza
    try{const S=await saCalc(typeof TOWN!=='undefined'?TOWN:0);if(S)S.dias.forEach((x,i)=>{if(x.cab.lv>=2)L.push({d:i,f:x.f,h:'',ico:'🧠',t:'',tl:['Día propenso a dolores de cabeza',''],s:'',sw:x.cab.why,tab:'salud',bd:['ro','Salud'],o:-2});});}catch(x){}
  }catch(e){console.log('anLoad',e);}
  const pr=a=>a.o<0?a.o:a.o===2?9:0;L.sort((a,b)=>a.d-b.d||pr(a)-pr(b)||hNum(a.h)-hNum(b.h)||a.o-b.o);
  ANT.L=L;ANT.t=Date.now();ANT.day=hoyYmd();if(ANT.i>=anVis().length)ANT.i=0;ANT.busy=false;anDraw();}
function anDraw(){const el=$('anTk');if(!el)return;const L=anVis();
  const fil=`<div class="anS">${AN_FIL.map(([k,n])=>`<button data-f="${k}" class="${k===ANT.f?'on':''}"><span>${n}</span>${ANT.L.length?' '+(k?ANT.L.filter(x=>k==='otros'?!['cultura','deporte'].includes(x.tab):x.tab===k).length:ANT.L.length):''}</button>`).join('')}</div>`;
  const bindF=()=>el.querySelectorAll('[data-f]').forEach(b=>b.onclick=e=>{e.stopPropagation();ANT.f=b.dataset.f;ANT.i=0;try{localStorage.setItem('anFil',ANT.f);}catch(x){}anDraw();anTimer();});
  if(!L.length){el.innerHTML=fil+`<div class="anC" style="cursor:default"><span class="anE">📭</span><div><b>${ANT.t?'<span>No hay nada apuntado para hoy, mañana ni pasado.</span>':'<span>Cargando…</span>'}</b></div></div>`;bindF();return;}
  const x=L[ANT.i%L.length],dd=AN_DIA[x.d];
  const tit=x.tl?`<span>${E(x.tl[0])}</span>${x.tl[1]?': '+E(x.tl[1]):''}`:E(x.t);
  const cuando=`<span>${dd}</span>${x.h?' · '+E(x.h)+(/\d$/.test(x.h)?' h':''):''}${x.hasta?' · <span>hasta el</span> '+E(fLarga(x.hasta)):''}${x.res?' · <span>Resultado</span> '+E(x.res):''}`;
  el.innerHTML=fil+`<div class="anC" title=""><span class="anE">${x.ico||'📌'}</span><div><small class="anW">${cuando}</small><b>${tit}</b>${x.sw?`<small>${saWhy(x.sw)}</small>`:x.s?`<small>${E(x.s)}</small>`:''}</div><span class="bdg ${x.bd[0]}"><span>${x.bd[1]}</span></span></div>
    <div class="anF"><button class="anP" aria-label="Anterior">‹</button><span>${ANT.i%L.length+1} / ${L.length}</span><div class="anBar"><i></i></div><button class="anX" aria-label="Siguiente">›</button></div>`;
  bindF();el.querySelector('.anC').onclick=()=>{if(x.cal){if(typeof bnDiGo==='function')bnDiGo('cal');return;}
    if(x.tab==='cultura'){try{AGSEL=x.f;AGMES=x.f.slice(0,7);}catch(e){}}showTab(x.tab);};
  el.querySelector('.anP').onclick=e=>{e.stopPropagation();ANT.i=(ANT.i-1+L.length)%L.length;anDraw();anTimer();};
  el.querySelector('.anX').onclick=e=>{e.stopPropagation();ANT.i=(ANT.i+1)%L.length;anDraw();anTimer();};}
function anTimer(){clearInterval(ANT.tm);ANT.tm=setInterval(()=>{if(!document.hidden&&(typeof BNTAB==='undefined'||BNTAB==='mtiempo')&&typeof rzTick==='function')rzTick();
  const n=anVis().length;if(document.hidden||!$('anTk')||!n)return;
  if(typeof BNTAB!=='undefined'&&BNTAB!=='mtiempo')return;ANT.i=(ANT.i+1)%n;anDraw();},3000);}
// ojo: index.html llama a veces a la función original (setTimeout(bnHome,…)), así que el carrusel
// se vuelve a poner solo cada vez que se redibuja el inicio
function anEnsure(){const H=$('bnaHome');if(!H||!isBna()||$('anTk'))return;
  let now=H.querySelector('.bnaNow');if(!now){H.insertAdjacentHTML('beforeend','<div class="bnaH">Ahora en Navarra</div><div class="bnaNow"></div>');now=H.querySelector('.bnaNow');}
  // el partido destacado y «hoy en tu calendario» ya salen en el carrusel
  now.querySelectorAll('div[onclick*="deporte"],div[onclick*="bnDiGo"],div[onclick*="caudal"]').forEach(x=>x.remove());
  if(APP&&!$('rzTk')){const rz=document.createElement('article');rz.id='rzTk';now.prepend(rz);rzDraw();}
  const tk=document.createElement('article');tk.id='anTk';now.appendChild(tk);
  if(!ANT.t||Date.now()-ANT.t>10*60e3||ANT.day!==hoyYmd())anLoad();anDraw();}
if(typeof bnHome==='function'){const _bh=bnHome;bnHome=function(){try{_bh.apply(this,arguments);}catch(e){console.log('bnHome',e);}anEnsure();};
  const H0=$('bnaHome');if(H0)new MutationObserver(()=>anEnsure()).observe(H0,{childList:true});
  anTimer();setTimeout(()=>{try{bnHome();}catch(e){}},400);}


/* =====================================================================
   5b. Ríos por zonas en «Ahora en Navarra» (solo en la app: los datos del SAIH los lee el móvil)
   Cada río se parte en zona alta, media y baja; de cada zona se enseña una estación.
   Arga: estaciones fijas. Los demás: las estaciones que la app ya encontró en Ríos (RIVST, guardadas 7 días),
   ordenadas de arriba abajo según hacia dónde corre el río.
   ===================================================================== */
const RZ_ARGA=[['alta',['A159','A152']],['media',['A313','A323','A324']],['baja',['A004','A069']]];
const RZ_RIOS={irati:{n:'Irati',re:/IRATI/i,ab:s=>-s.lat},ega:{n:'Ega',re:/\bEGA\b/i,ab:s=>-s.lat},aragon:{n:'Aragón',re:/ARAG[OÓ]N/i,ab:s=>-s.lon},ebro:{n:'Ebro',re:/^EBRO/i,ab:s=>s.lon}};
const RZ_ZN={alta:'zona alta',media:'zona media',baja:'zona baja'};
const RZ={i:0,t:0,busy:false,elegidas:{}};
function rzValor(code){const st=CAU&&CAU[code];if(!st||!st.tags)return null;const q=pick(st,'q'),n=pick(st,'n');const t=q&&!isNaN(+q.VALOR_QM)?q:n&&!isNaN(+n.VALOR_QM)?n:null;
  if(!t)return null;const al=n?alertOf(n):null;return {v:+t.VALOR_QM,u:t===q?'m³/s':'m',tr:t.LS_TENDENCIA||'',al,name:st.name};}
function rzLista(){const L=[];
  RZ_ARGA.forEach(([z,codes])=>{const c=codes.find(x=>rzValor(x));if(c)L.push({r:'arga',rio:'Arga',z,code:c});});
  Object.entries(RZ_RIOS).forEach(([r,d])=>{(RZ.elegidas[r]||[]).forEach(([z,c])=>{if(rzValor(c))L.push({r,rio:d.n,z,code:c});});});return L;}
function rzZonas(r){let st=(typeof RIVST!=='undefined'&&RIVST[r])||(typeof LS!=='undefined'&&(LS.get(rk(r),null)||{}).st)||[];
  st=st.filter(x=>x.lat!=null&&x.lon!=null&&!/EMBALSE|PRESA/i.test(x.name));const d=RZ_RIOS[r],pr=st.filter(x=>d.re.test(x.name));if(pr.length>=2)st=pr;
  if(!st.length)return [];st.sort((a,b)=>d.ab(a)-d.ab(b));const n=st.length,cut=[st.slice(0,Math.ceil(n/3)),st.slice(Math.ceil(n/3),Math.ceil(2*n/3)),st.slice(Math.ceil(2*n/3))];
  const out=[];['alta','media','baja'].forEach((z,i)=>{const g=cut[i];if(g&&g.length)out.push([z,g.map(x=>x.code)]);});return out;}
async function rzLoad(){if(!APP||RZ.busy||Date.now()-RZ.t<15*60e3)return;RZ.busy=true;RZ.t=Date.now();if(!CAU)CAU={};
  try{for(const r of Object.keys(RZ_RIOS)){const zs=rzZonas(r);const el=[];
      for(const [z,codes] of zs){for(const c of codes.slice(0,3)){if(!rzValor(c)){try{const x=await netGet(SAIH+'/api/ficha/procesarTablaValoresActuales?estacion='+c);
            fichaAdd(CAU,c,JSON.parse(x.body).VALORES_ACTUALES||'');const st=(RIVST[r]||[]).find(y=>y.code===c)||((LS.get(rk(r),null)||{}).st||[]).find(y=>y.code===c);if(st&&CAU[c])CAU[c].name=st.name;}catch(e){}}
          if(rzValor(c)){el.push([z,c]);break;}}}
      RZ.elegidas[r]=el;rzDraw();}}catch(e){console.log('rzLoad',e);}RZ.busy=false;}
function rzDraw(){const el=$('rzTk');if(!el)return;const L=rzLista();if(!L.length){el.style.display='none';return;}el.style.display='';
  const x=L[RZ.i%L.length],v=rzValor(x.code);
  let bd=['ok','Normal'];if(x.r==='arga'&&v.u==='m³/s'&&typeof CFG!=='undefined'&&x.code==='A313')bd=v.v>=CFG.qRoj?['ro','Peligro']:v.v>=CFG.qAma?['am','Alerta']:['ok','Normal'];
  else if(v.al){const t=v.al[0];bd=/rojo/i.test(t)?['ro','Aviso rojo']:/naranja/i.test(t)?['ro','Aviso naranja']:/amarillo/i.test(t)&&!/Normal/.test(t)?['am','Aviso amarillo']:['ok','Normal'];}
  const nom=typeof prettyName==='function'?prettyName(v.name||x.code):(v.name||x.code);
  const tr=/arriba/i.test(v.tr)?' ↑':/abajo/i.test(v.tr)?' ↓':'';
  el.innerHTML=`<div class="anC"><span class="anE">${typeof bnTile==='function'?bnTile('caudal',20,34):'🌊'}</span><div><small class="anW"><span>Río</span> ${E(x.rio)} · <span>${RZ_ZN[x.z]}</span></small><b>${E(nom)}</b><small>${fmtN(v.v,v.u==='m'?2:1)} ${v.u}${tr} <span>ahora</span></small></div><span class="bdg ${bd[0]}"><span>${bd[1]}</span></span></div>
    <div class="anF"><button class="anP" aria-label="Anterior">‹</button><span>${RZ.i%L.length+1} / ${L.length}</span><div class="anBar"><i></i></div><button class="anX" aria-label="Siguiente">›</button></div>`;
  el.querySelector('.anC').onclick=()=>{showTab('caudal');if(x.r!=='arga'&&typeof rivShow==='function')setTimeout(()=>rivShow(x.r),150);};
  el.querySelector('.anP').onclick=e=>{e.stopPropagation();RZ.i=(RZ.i-1+L.length)%L.length;rzDraw();anTimer();};
  el.querySelector('.anX').onclick=e=>{e.stopPropagation();RZ.i=(RZ.i+1)%L.length;rzDraw();anTimer();};}
function rzTick(){const n=rzLista().length;if(n){RZ.i=(RZ.i+1)%n;rzDraw();}rzLoad();}
document.head.insertAdjacentHTML('beforeend','<style>#rzTk{display:block;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 8px rgba(29,45,35,.05);overflow:hidden}body:not(.bna) #rzTk{background:var(--panel)}#rzTk .anC{display:flex;align-items:center;gap:11px;padding:12px 12px 10px;cursor:pointer;animation:anIn .45s ease}#rzTk .anC>div{flex:1;min-width:0}#rzTk .anC b{display:block;font-size:14.5px}#rzTk .anC small{display:block;color:var(--mut);font-size:12.5px}#rzTk .anW{color:#0D6285!important;font-weight:800}#rzTk .anE{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex:none}#rzTk .anF{display:flex;align-items:center;gap:8px;padding:0 10px 8px}#rzTk .anF button{border:none;background:#F3F6F1;color:inherit;border-radius:12px;width:46px;height:38px;font-size:26px;font-weight:700;line-height:1;cursor:pointer;flex:none}#rzTk .anF span{font-size:11.5px;color:var(--mut)}#rzTk .anBar{flex:1;height:4px;background:rgba(127,127,127,.18);border-radius:3px;overflow:hidden}#rzTk .anBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#097BA4,#1e88e5);animation:anProg 3s linear forwards}</style>');
if(APP)setTimeout(rzLoad,8000);

/* =====================================================================
   9. ACTUALIZACIÓN SOLA de la pantalla (sin tocar «Buscar nueva versión»)
   Mira si hay pantalla nueva al abrir la app, al volver a ella y cada 30 minutos.
   Si la hay, la descarga y la aplica sola cuando estás en el Inicio y no estás escribiendo
   (o la próxima vez que vuelvas a la app). La APK no se puede instalar sola si no viene de Google Play:
   en ese caso sigue saliendo el aviso para descargarla.
   ===================================================================== */
if(typeof checkUpdate==='function'&&APP&&window.AndroidNet.updateWeb){let PEND=false,LAST=0;
  const libre=()=>!document.querySelector('input:focus,textarea:focus,select:focus,#pinBox[style*="flex"],#nvLang,#muBox,#bnaAccBox')&&(typeof BNTAB==='undefined'||BNTAB==='mtiempo');
  const aplicar=()=>{if(!PEND)return;if(!libre())return;PEND=false;toast('✨ BasatiNA actualizada');setTimeout(()=>{try{window.AndroidNet.reload();}catch(e){location.reload();}},1200);};
  const _cu=checkUpdate;
  checkUpdate=async function(manual){if(manual)return _cu(true);if(Date.now()-LAST<5*60e3)return;LAST=Date.now();
    const r=await updWeb().catch(()=>({ok:false}));if(!r||!r.ok)return;
    if(r.apk>r.myApk&&r.apkUrl){if(typeof bnMudanza==='function'&&bnMudanza())return;
      if(r.play)return;   // Google Play ya actualiza la app sola
      toast('📲 Hay una versión nueva de la app ('+r.apk+')','Descargar',()=>window.AndroidNet.openUrl(r.apkUrl));return;}
    if(r.changed>0){PEND=true;aplicar();}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(PEND)aplicar();else checkUpdate(false);}});
  setInterval(()=>checkUpdate(false),30*60e3);
  const _st9=showTab;showTab=function(t){_st9(t);if(t==='mtiempo')setTimeout(aplicar,500);};}
/* =====================================================================
   6. NA SALUD
   ===================================================================== */
const SA_LV=[['Bajo','#43a047'],['Moderado','#f9a825'],['Alto','#ef6c00'],['Muy alto','#c62828'],['Extremo','#6a1b9a']];
const saLv=s=>s<=1?0:s<=3?1:s<=5?2:3;
const SAC={};let SAD=0,SAT=null;
async function saCalc(ti){const t=(typeof TOWNS!=='undefined'&&TOWNS[ti])||[ 'Pamplona',42.8125,-1.6458];
  const key=ti+'|'+hoyYmd()+'|'+new Date().getHours();if(SAC[key])return SAC[key];
  const pol=typeof PP_POL!=='undefined'?PP_POL:[];
  const [w,q]=await Promise.all([getJSON(`${OM}?latitude=${t[1]}&longitude=${t[2]}&hourly=pressure_msl,temperature_2m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max&past_days=1&forecast_days=3${TZ}`),
    getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${t[1]}&longitude=${t[2]}&hourly=european_aqi${pol.length?','+pol.map(x=>x[0]).join(','):''}&forecast_days=3${TZ}`)]);
  if(!w||!w.hourly||!w.daily)return null;
  const H=w.hourly,P=H.pressure_msl,T=H.temperature_2m,RH=H.relative_humidity_2m,DY=w.daily;
  const idx=f=>H.time.map((s,i)=>s.startsWith(f)?i:-1).filter(i=>i>=0);
  const avg=(A,I)=>{const v=I.map(i=>A[i]).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const nowI=Math.max(0,H.time.findIndex(s=>new Date(s)>new Date())-1);
  const dias=[];
  for(let d=0;d<3;d++){const k=d+1,f=DY.time[k];if(!f)break;const I=idx(f),Ip=idx(DY.time[k-1]);
    let d24=0,d3=0,pmin=1e9;I.forEach(i=>{if(P[i]==null)return;pmin=Math.min(pmin,P[i]);
      if(i>=24&&P[i-24]!=null)d24=Math.max(d24,P[i-24]-P[i]);if(i>=3&&P[i-3]!=null)d3=Math.max(d3,P[i-3]-P[i]);});
    const tm=avg(T,I),tp=avg(T,Ip),dT=tm!=null&&tp!=null?Math.abs(tm-tp):0,rh=avg(RH,I)||0;
    // 🧠 cabeza y migraña
    let s=0;const why=[];
    if(d24>=10){s+=3;}else if(d24>=6){s+=2;}else if(d24>=3){s+=1;}
    if(d24>=3)why.push(`baja ${fmtN(d24,0)} hPa en 24 h`);
    if(d3>=4){s+=2;why.push(`cae rápido (${fmtN(d3,1)} hPa en 3 h)`);}else if(d3>=2.5){s+=1;why.push(`cae rápido (${fmtN(d3,1)} hPa en 3 h)`);}
    if(pmin<1000){s+=1;why.push(`borrasca (${Math.round(pmin)} hPa)`);}
    if(dT>=6){s+=1;why.push(`cambio de ${fmtN(dT,0)} °C`);}
    const cab={lv:saLv(s),why};
    // 🦴 articulaciones
    let s2=(d24>=6?2:d24>=3?1:0)+(rh>=85&&tm!=null&&tm<=10?2:rh>=80&&tm!=null&&tm<=12?1:0)+(DY.temperature_2m_min[k]!=null&&DY.temperature_2m_min[k]<=0?1:0)+(dT>=6?1:0);
    const w2=[];if(d24>=3)w2.push(`presión bajando`);if(rh>=80&&tm!=null&&tm<=12)w2.push(`frío húmedo (${Math.round(rh)} %)`);if(DY.temperature_2m_min[k]<=0)w2.push('heladas');if(dT>=6)w2.push(`cambio de ${fmtN(dT,0)} °C`);
    const art={lv:saLv(s2),why:w2};
    // 🌡️ calor y frío (sensación térmica)
    const ax=DY.apparent_temperature_max[k],an=DY.apparent_temperature_min[k];
    const lc=ax==null?0:ax>=41?3:ax>=32?2:ax>=27?1:0,lf=an==null?0:an<-10?3:an<0?2:an<=5?1:0;
    const ter={lv:Math.max(lc,lf),frio:lf>lc,ax,an,tx:DY.temperature_2m_max[k],tn:DY.temperature_2m_min[k]};
    // ☀️ UV
    const uv=DY.uv_index_max[k],luv=uv==null?0:uv>10?4:uv>=8?3:uv>=6?2:uv>=3?1:0;
    // 💨 aire y 🌼 polen
    let aq=null,pl=[];
    if(q&&q.hourly){const QH=q.hourly,QI=QH.time.map((s,i)=>s.startsWith(f)?i:-1).filter(i=>i>=0);
      const mx=a=>{let m=null;QI.forEach(i=>{if(a&&a[i]!=null)m=Math.max(m??0,a[i]);});return m;};
      aq=mx(QH.european_aqi);
      pl=pol.map(([kk,n,ic])=>{const v=mx(QH[kk]);const L=typeof ppNivel==='function'?ppNivel(v):['—','#9e9e9e',0];return {n,ic,v,lv:L[2],t:L[0]};}).filter(x=>x.lv>=1).sort((a,b)=>b.lv-a.lv||b.v-a.v);}
    dias.push({f,cab,art,ter,uv,luv,aq,pl,d24,d3,pmin});}
  const r={t:t[0],dias,H,nowI};SAC[key]=r;return r;}
const saWhy=L=>L.map(w=>'<span>'+E(w)+'</span>').join(' · ');
const saChip=(lv,txt)=>`<span class="lv" style="background:${SA_LV[lv][1]}"><span>${txt||SA_LV[lv][0]}</span></span>`;
const saTips=L=>`<details><summary><span>Consejos</span></summary><ul>${L.map(x=>`<li><span>${x}</span></li>`).join('')}</ul></details>`;
const aqTxt=v=>v==null?['—',0]:v<=20?['Buena',0]:v<=40?['Razonable',0]:v<=60?['Moderada',1]:v<=80?['Mala',2]:v<=100?['Muy mala',3]:['Extremadamente mala',3];
function saSpark(R){const P=R.H.pressure_msl,tm=R.H.time;const v=P.map(x=>x==null?NaN:x),ok=v.filter(x=>!isNaN(x));if(ok.length<6)return'';
  const mn=Math.min(...ok)-1,mx=Math.max(...ok)+1,W=320,Hh=80,X=i=>i*W/(v.length-1),Y=x=>Hh-(x-mn)*Hh/(mx-mn);
  let d='';v.forEach((x,i)=>{if(!isNaN(x))d+=(d?'L':'M')+X(i).toFixed(1)+' '+Y(x).toFixed(1);});
  const sep=tm.map((s,i)=>s.endsWith('T00:00')&&i?i:-1).filter(i=>i>0);
  return `<svg viewBox="0 0 ${W} ${Hh+16}" style="width:100%;height:96px;display:block;margin-top:6px">${sep.map(i=>`<line x1="${X(i)}" x2="${X(i)}" y1="0" y2="${Hh}" stroke="currentColor" opacity=".15"/>`).join('')}
    <path d="${d}" fill="none" stroke="#1e88e5" stroke-width="2.5"/><line x1="${X(R.nowI)}" x2="${X(R.nowI)}" y1="0" y2="${Hh}" stroke="#e53935" stroke-dasharray="3 3"/>
    <text x="${X(R.nowI)+3}" y="10" font-size="10" fill="#e53935">ahora</text><text x="2" y="${Hh+13}" font-size="10" fill="currentColor" opacity=".7">ayer</text>
    <text x="${W-2}" y="${Hh+13}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">+3 días</text>
    <text x="${W-2}" y="10" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">${Math.round(mx-1)} hPa</text><text x="${W-2}" y="${Hh-2}" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">${Math.round(mn+1)} hPa</text></svg>`;}
function saDiario(R){const el=$('saDiario');if(!el)return;const L=lsGet('saDiario',[]);const d0=R&&R.dias[0];
  const pNow=R&&R.H.pressure_msl[R.nowI],d24=R&&R.nowI>=24?R.H.pressure_msl[R.nowI-24]-pNow:null;
  const bajando=L.filter(x=>x.d24!=null&&x.d24>=3).length;
  el.innerHTML=`<b>📓 Mi diario de dolores</b><div class="note">Apunta los días que te duele algo y BasatiNA guarda la presión de ese momento. Con el tiempo verás si a ti te afecta. <b>Se guarda solo en este móvil.</b></div>
   <div class="row" style="flex-wrap:wrap;margin-top:8px"><button class="btn pri" data-ap="cabeza">🤕 Hoy me duele la cabeza</button><button class="btn" data-ap="articulaciones">🦴 Hoy me duelen las articulaciones</button></div>
   ${L.length?`<div class="note" style="margin-top:8px">${L.length>=3?`<span>Días con la presión bajando</span>: <b>${bajando} / ${L.length}</b>`:'<span>Con unos cuantos apuntes más podrás ver si coincide con las bajadas de presión.</span>'}</div>
   ${L.slice(-12).reverse().map((x,i)=>`<div class="st" style="padding:6px 0"><div style="font-size:20px">${x.tipo==='cabeza'?'🤕':'🦴'}</div><div style="flex:1"><b>${E(fLarga(x.f))}${x.h?' · '+E(x.h):''}</b><div class="s">${x.p?Math.round(x.p)+' hPa':''}${x.d24!=null?' · '+(x.d24>0?'↓ ':'↑ ')+fmtN(Math.abs(x.d24),1)+' hPa / 24 h':''}</div></div><button class="btn" data-del="${L.length-1-i}">✕</button></div>`).join('')}
   <div class="row"><button class="btn" id="saDelAll">🗑️ Borrar todo</button></div>`:''}`;
  el.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{const A=lsGet('saDiario',[]);const n=new Date();
    A.push({f:hoyYmd(),h:n.toTimeString().slice(0,5),tipo:b.dataset.ap,p:pNow!=null?Math.round(pNow*10)/10:null,d24:d24!=null?Math.round(d24*10)/10:null});
    lsSet('saDiario',A.slice(-200));toast('✅ Apuntado');saDiario(R);});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const A=lsGet('saDiario',[]);A.splice(+b.dataset.del,1);lsSet('saDiario',A);saDiario(R);});
  const da=$('saDelAll');if(da)da.onclick=()=>{if(confirm('¿Borrar todos los apuntes del diario de dolores?')){lsSet('saDiario',[]);saDiario(R);}};}
async function saRender(){const B=$('saBody'),Pp=$('saPres');if(!B)return;if(SAT==null)SAT=typeof TOWN!=='undefined'?TOWN:0;
  B.innerHTML='<div class="card"><div class="note">Cargando…</div></div>';
  const R=await saCalc(SAT).catch(()=>null);
  if(!R){B.innerHTML='<div class="card"><div class="note">No se pudo cargar el tiempo ahora. Prueba en un rato.</div></div>';saDiario(null);return;}
  const x=R.dias[Math.min(SAD,R.dias.length-1)],aq=aqTxt(x.aq);
  const ter=x.ter.frio?['❄️','Frío']:['🌡️',x.ter.lv?'Calor':'Temperatura'];
  B.innerHTML=`<div class="card"><div class="note" style="margin-bottom:8px"><b>${E(R.t)}</b> · ${E(fLarga(x.f))}</div><div class="saG">
   <div class="saI"><b>🧠 <span>Dolor de cabeza y migraña</span></b>${saChip(x.cab.lv)}<div class="s">${x.cab.why.length?saWhy(x.cab.why):'<span>Sin cambios bruscos de presión.</span>'}</div>
     ${x.cab.lv?saTips(['Bebe agua a menudo y no te saltes comidas.','Duerme a tus horas y evita el alcohol.','Si tienes migraña, ten a mano tu tratamiento habitual.']):''}</div>
   <div class="saI"><b>🦴 <span>Articulaciones y reuma</span></b>${saChip(x.art.lv)}<div class="s">${x.art.why.length?saWhy(x.art.why):'<span>Tiempo estable.</span>'}</div>
     ${x.art.lv?saTips(['Abrígate y mantén calientes las articulaciones.','Haz movimientos suaves y estiramientos.','Si tienes un tratamiento, sigue lo que te diga tu médico.']):''}</div>
   <div class="saI"><b>${ter[0]} <span>${ter[1]}</span></b>${saChip(x.ter.lv)}<div class="s"><span>Sensación</span> ${fmtN(x.ter.an,0)}° / ${fmtN(x.ter.ax,0)}° · <span>real</span> ${fmtN(x.ter.tn,0)}° / ${fmtN(x.ter.tx,0)}°</div>
     ${x.ter.lv?saTips(x.ter.frio?['Abrígate por capas y cubre cabeza, manos y pies.','Cuidado con el hielo en aceras y carreteras.','Ojo con braseros y estufas: ventila para evitar el monóxido.']:['Bebe agua aunque no tengas sed.','Evita el sol y el ejercicio de 12 a 18 h.','Vigila a mayores, bebés y personas enfermas.']):''}</div>
   <div class="saI"><b>☀️ <span>Rayos UV</span></b>${saChip(x.luv)}<div class="s"><span>Índice UV máx.</span> ${x.uv!=null?fmtN(x.uv,0):'—'}</div>
     ${x.luv?saTips(['Gafas de sol, gorra y crema de protección 30 o más.','A partir de 6, evita el sol de mediodía.','Cuidado en la nieve y en el agua: reflejan mucho.']):''}</div>
   <div class="saI"><b>💨 <span>Calidad del aire</span></b>${saChip(aq[1],aq[0])}<div class="s"><span>índice europeo</span> ${x.aq!=null?Math.round(x.aq):'—'}</div>
     ${aq[1]?saTips(['Si tienes asma o problemas de corazón, evita el ejercicio intenso al aire libre.','Ventila a primera hora de la mañana.']):''}</div>
   <div class="saI"><b>🌼 <span>Polen</span></b>${saChip(x.pl.length?Math.min(3,x.pl[0].lv):0,x.pl.length?x.pl[0].t:'Nulo')}<div class="s">${x.pl.length?x.pl.slice(0,3).map(p=>p.ic+' <span>'+E(p.n)+'</span>').join(' · '):'<span>Casi no hay polen en el aire.</span>'}</div>
     ${x.pl.length?saTips(['Si tienes alergia: ventanas cerradas en las horas centrales.','Gafas de sol al salir y ducha al volver a casa.','Sigue el tratamiento que te haya dado tu médico.']):''}</div>
  </div><div class="note" style="margin-top:8px">Algunos estudios relacionan las bajadas de presión y los cambios bruscos de temperatura con más dolores de cabeza y molestias en las articulaciones en personas sensibles. No le pasa a todo el mundo: tu diario te ayudará a saber si es tu caso.</div></div>`;
  const p0=R.H.pressure_msl[R.nowI];
  Pp.innerHTML=`<b>🧭 <span>Presión atmosférica</span></b><div class="note"><span>Ahora</span>: <b>${p0!=null?Math.round(p0):'—'} hPa</b>${R.dias[0]&&R.dias[0].d24>=3?' · <span>bajando</span>':''}</div>${saSpark(R)}
   <div class="note">Línea azul: presión desde ayer hasta dentro de 3 días. Si baja deprisa suelen llegar viento y lluvia.</div>`;
  saDiario(R);}
function saInit(){const s=$('saTown');if(s&&!s.options.length){if(typeof fillTowns==='function')fillTowns(s);s.value=String(SAT==null?(typeof TOWN!=='undefined'?TOWN:0):SAT);
    s.onchange=()=>{SAT=+s.value;saRender();};}
  saRender();}
if(typeof svSec==='function'){
  svSec('salud',`<div class="card" style="border-left:4px solid #e53935"><b>🩺 Tiempo y salud</b>
   <div class="note">Cómo puede afectarte el tiempo hoy y los próximos días: presión atmosférica, cambios bruscos de temperatura, calor, frío, rayos UV, calidad del aire y polen.</div>
   <div style="display:flex;gap:6px;margin-top:8px;align-items:center"><span>📍</span><select class="town" id="saTown" style="flex:1"></select></div>
   <div class="seg" id="saDia" style="margin-top:8px"><button class="btn on" data-d="0">Hoy</button><button class="btn" data-d="1">Mañana</button><button class="btn" data-d="2">Pasado mañana</button></div></div>
  <div id="saBody"></div><div class="card" id="saPres"></div><div class="card" id="saDiario"></div>
  <div class="card"><b>➕ Más en NA Salud</b><div class="row" style="flex-wrap:wrap;margin-top:6px"><button class="btn" data-go="medic">🌱 Plantas medicinales</button><button class="btn" data-go="farmacia">💊 Farmacias de guardia</button></div></div>
  <div class="card" style="border-left:4px solid #c62828"><b>📞 Teléfonos de urgencia</b>
   <div class="st"><div style="font-size:22px">🚑</div><div style="flex:1"><b>112 · <span>SOS Navarra</span></b><div class="s">Urgencias sanitarias, accidentes, incendios y rescates.</div></div><a class="btn pri" href="tel:112">Llamar</a></div>
   <div class="st"><div style="font-size:22px">☠️</div><div style="flex:1"><b>91 562 04 20 · <span>Información Toxicológica</span></b><div class="s">Intoxicaciones con setas, plantas, medicamentos o productos de casa (24 horas).</div></div><a class="btn" href="tel:915620420">Llamar</a></div></div>
  <div class="note" style="margin:4px 6px 14px">⚕️ Información orientativa y general: no es un consejo médico ni un diagnóstico. Si tienes un dolor fuerte, que no se va o distinto al habitual, consulta a tu médico o farmacéutico. Ante una urgencia, llama al 112. Datos: Open‑Meteo (CC BY 4.0) y Copernicus CAMS.</div>`);
  document.querySelectorAll('#saDia button').forEach(b=>b.onclick=()=>{SAD=+b.dataset.d;document.querySelectorAll('#saDia button').forEach(x=>x.classList.toggle('on',x===b));saRender();});
  document.querySelectorAll('#t-salud [data-go]').forEach(b=>b.onclick=()=>showTab(b.dataset.go));
  const _st1=showTab;showTab=function(t){_st1(t);if(t==='salud')setTimeout(saInit,30);};
  // grupo «NA Salud» en el menú, justo antes de «NA Sostenible»
  (function(){if(!dr||$('dgSalud'))return;const en=dr.querySelector('button[data-t="energia"]'),ref=en&&en.closest('.dsub')&&en.closest('.dsub').previousElementSibling;
    const html='<div class="dgroup" id="dgSalud"><span data-k="NA Salud">NA Salud</span><i>▸</i></div><div class="dsub" id="dsSalud"></div>';
    if(ref&&ref.classList.contains('dgroup'))ref.insertAdjacentHTML('beforebegin',html);else{const g=$('bnaDGrid')||dr;g.insertAdjacentHTML('beforeend',html);}
    const g=$('dgSalud'),sub=$('dsSalud');
    g.onclick=()=>{const o=!g.classList.contains('open');dr.querySelectorAll('.dgroup').forEach(x=>x.classList.remove('open'));if(o)g.classList.add('open');};
    svBtn(sub,'salud','🩺 Tiempo y salud');
    ['medic','farmacia'].forEach(t=>{const b=dr.querySelector(`button[data-t="${t}"]`);if(b)sub.appendChild(b);});})();
  try{Object.assign(TITLES,{salud:'🩺 Tiempo y salud'});
    if(typeof PVS_ESC!=='undefined')PVS_ESC.salud='cielo';
    if(typeof BNI!=='undefined')BNI['i-salud']='<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27S4 19.5 4 11.5A6 6 0 0 1 16 8a6 6 0 0 1 12 3.5C28 19.5 16 27 16 27z" fill="currentColor" fill-opacity=".12"/><path d="M7 15h5l2-4 3 7 2-3h6"/></g>';
    Object.assign(ICK,{salud:'pulse','g:NA Salud':'pulse'});Object.assign(ICC,{salud:'#e53935','g:NA Salud':'#e53935'});
    Object.assign(BNK,{salud:'i-salud','g:NA Salud':'i-salud'});Object.assign(BNF,{salud:'r','g:NA Salud':'r'});
    if(typeof BNL!=='undefined')BNL.salud='Salud';
    if(typeof applyIcons==='function')applyIcons((CFG.iconos||'pro')==='pro');}catch(e){console.log(e);}
}

/* =====================================================================
   7. IDIOMA: Castellano · Euskara · English · Français
   ===================================================================== */
(function(){const b=$('dLang');if(!b)return;const N=[['es','Castellano','🇪🇸'],['eu','Euskara','🟩'],['en','English','🇬🇧'],['fr','Français','🇫🇷']];
  const L0=(typeof LANG!=='undefined'&&LANG)||'es',txt='Castellano · Euskara · English · Français';
  b.dataset.emo='🌐 ';b.dataset.txt=txt;const sp=[...b.querySelectorAll('span')].filter(x=>!x.className&&!x.querySelector('svg')).pop();if(sp)sp.textContent=txt;else b.textContent='🌐 '+txt;
  b.onclick=()=>{if(typeof menu==='function')menu(false);const o=document.createElement('div');o.id='nvLang';
    o.innerHTML=`<div><b style="font-size:17px">🌐 Idioma · Hizkuntza · Language · Langue</b>${N.map(([k,n,f])=>`<button class="l${k===L0?' on':''}" data-l="${k}"><span style="font-size:22px">${f}</span><span style="flex:1">${n}</span>${k===L0?'✓':''}</button>`).join('')}
      <div class="note" style="margin-top:10px">Los nombres de lugares, especies y los datos oficiales se dejan como están.</div><div class="row" style="margin-top:8px"><button class="btn" data-x="1">✕</button></div></div>`;
    document.body.appendChild(o);o.onclick=e=>{if(e.target===o||e.target.closest('[data-x]'))o.remove();};
    o.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>{try{localStorage.setItem('lang',x.dataset.l);}catch(e){}location.reload();});};})();


/* =====================================================================
   8. 📦 COPIA DE MIS DATOS y MUDANZA a la app nueva (es.sonpe.basatina, versión 20 o más)
   La app de Google Play es otra app para el móvil: lo guardado en la antigua (es.pedrito.controlarga)
   no pasa solo. Aquí se guarda todo en un archivo .json y se recupera en la nueva.
   Lo que NO se copia: la llave de GitHub y el PIN (por seguridad, se vuelven a poner).
   ===================================================================== */
const MU_NO=new Set(['ghTok','pinH','pinFail','tech']),MU_NUEVA=20,MU_WEB='https://sonpe-technology.es/';
const muVer=()=>{try{return APP&&window.AndroidNet.appVersion?+window.AndroidNet.appVersion():0;}catch(e){return 0;}};
const muVieja=()=>APP&&muVer()>0&&muVer()<MU_NUEVA;
function muIdb(){return new Promise((res,rej)=>{const r=indexedDB.open('basatina',1);r.onupgradeneeded=()=>r.result.createObjectStore('fotos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function muFotos(){const db=await muIdb();return new Promise((res,rej)=>{const t=db.transaction('fotos','readonly'),st=t.objectStore('fotos'),o={};
  const c=st.openCursor();c.onsuccess=()=>{const k=c.result;if(k){o[k.key]=k.value;k.continue();}else res(o);};c.onerror=()=>rej(c.error);});}
async function muGuardar(){try{const ls={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!MU_NO.has(k))ls[k]=localStorage.getItem(k);}
    const fotos=await muFotos().catch(()=>({})),d={app:'BasatiNA',tipo:'copia',v:1,fecha:new Date().toISOString(),ls,fotos};
    const txt=JSON.stringify(d),nom='BasatiNA-copia-'+hoyYmd()+'.json';
    if(APP&&window.AndroidNet.shareFile){const b=btoa(unescape(encodeURIComponent(txt)));window.AndroidNet.shareFile(nom,b,'application/json');}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);}
    try{localStorage.setItem('muHecha','1');}catch(e){}
    const nf=Object.keys(fotos).length;toast('✅ Copia hecha'+(nf?' ('+nf+(nf===1?' foto':' fotos')+')':'')+'. Guárdala en Drive, en Archivos o mándatela por WhatsApp');}
  catch(e){toast('❌ No se pudo hacer la copia: '+e.message);}}
function muRecuperar(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
  i.onchange=()=>{const f=i.files&&i.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);
      if(!d||d.app!=='BasatiNA'||!d.ls)throw new Error('ese archivo no es una copia de BasatiNA');
      if(!confirm('¿Recuperar la copia del '+String(d.fecha||'').slice(0,10)+'? Se juntará con lo que tengas en este móvil y lo repetido se sustituirá.'))return;
      Object.entries(d.ls).forEach(([k,v])=>{if(!MU_NO.has(k))try{localStorage.setItem(k,v);}catch(e){}});
      const db=await muIdb();await new Promise((res,rej)=>{const t=db.transaction('fotos','readwrite'),st=t.objectStore('fotos');Object.entries(d.fotos||{}).forEach(([k,v])=>st.put(v,k));t.oncomplete=res;t.onerror=()=>rej(t.error);});
      try{localStorage.setItem('muHecha','1');}catch(e){}
      toast('✅ Datos recuperados. Se vuelve a abrir la app…');setTimeout(()=>location.reload(),1500);}
    catch(e){toast('❌ '+e.message);}};r.readAsText(f);};
  document.body.appendChild(i);i.click();setTimeout(()=>i.remove(),60000);}
// tarjeta en Ajustes
if(typeof ajustesRender==='function'){const _aj=ajustesRender;ajustesRender=function(){_aj.apply(this,arguments);const el=$('ajBody');if(!el||$('muCard'))return;
  el.insertAdjacentHTML('beforeend',`<div class="card" id="muCard"><b>📦 Copia de mis datos</b><div class="note">Guarda en un archivo tu diario de salidas (con fotos), el diario de dolores, el calendario, las notas, los sitios secretos y los ajustes. Sirve para cambiar de móvil o para pasarte a la BasatiNA de Google Play. El archivo es tuyo: no se envía a nadie.</div>
    <div class="row" style="flex-wrap:wrap;margin-top:8px"><button class="btn pri" id="muG">💾 Guardar copia</button><button class="btn" id="muR">📥 Recuperar copia</button></div></div>`);
  $('muG').onclick=muGuardar;$('muR').onclick=muRecuperar;};}
// app antigua: explicar la mudanza (también cuando avisa de versión nueva)
function bnMudanza(){if(!muVieja())return false;if($('muBox'))return true;const o=document.createElement('div');o.id='muBox';o.className='nvMu';
  o.innerHTML=`<div><b style="font-size:17px">📲 BasatiNA se muda</b><div class="note" style="margin-top:6px">La nueva BasatiNA (la de Google Play) es otra app para el móvil. Para no perder nada:</div>
   <ol style="margin:8px 0 0;padding-left:20px;line-height:1.55"><li><span>Guarda tus datos en un archivo</span> <button class="btn pri" id="muG2">💾 Guardar copia</button></li>
   <li><span>Instala la BasatiNA nueva</span> <button class="btn" id="muI">⬇️ Instalar</button></li>
   <li><span>Ábrela y entra en Ajustes → Copia de mis datos → Recuperar copia.</span></li>
   <li><span>Cuando lo veas todo en la nueva, desinstala esta.</span></li></ol>
   <div class="row" style="margin-top:10px"><button class="btn" data-x="1">Más tarde</button></div></div>`;
  document.body.appendChild(o);o.onclick=e=>{if(e.target===o||e.target.closest('[data-x]'))o.remove();};
  $('muG2').onclick=muGuardar;$('muI').onclick=()=>{try{window.AndroidNet.openUrl(MU_WEB);}catch(e){}};return true;}
window.bnMudanza=bnMudanza;
setTimeout(()=>{if(muVieja()){let n=0;try{n=+(sessionStorage.getItem('muVisto')||0);sessionStorage.setItem('muVisto','1');}catch(e){}if(!n)bnMudanza();}
  // app nueva recién instalada y vacía: recordar que se pueden recuperar los datos
  else if(APP&&muVer()>=MU_NUEVA){let v=null;try{v=localStorage.getItem('muHecha')||localStorage.getItem('diario')||localStorage.getItem('sitios');localStorage.setItem('muHecha','1');}catch(e){}
    if(!v)toast('📦 ¿Tenías la BasatiNA anterior? Recupera tus datos','Recuperar',muRecuperar);}},2500);
document.head.insertAdjacentHTML('beforeend','<style>.nvMu{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}.nvMu>div{background:var(--panel,#fff);color:var(--txt);border-radius:18px;padding:16px;width:min(92vw,400px);box-shadow:0 10px 40px rgba(0,0,0,.35)}.nvMu li{margin-top:8px}</style>');

window.NOVEDADES={anLoad,saCalc,naScan};
})();
