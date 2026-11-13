/* =====================================================================
   📜 DATO DEL DÍA · «Tal día como hoy en Navarra» (13 nov. 2026)
   - Los datos están en efemerides/navarra.json (en GitHub). Se editan a mano en GitHub
     o desde la app en modo administrador (botón ✏️ de la tarjeta). No hace falta APK nueva.
   - Si un día no tiene dato, sale una «curiosidad» de Navarra (va rotando).
   - Filtro anti-política: si un dato contiene una palabra de EF_NO (o de "prohibidas"
     en el JSON), no se enseña. Es una red de seguridad: lo importante es no meterlos.
   - Aviso en el móvil cada mañana: lo hace RiverJob.checkDato (Java) con la misma lista.
     Se activa en Ajustes (CFG.dato, CFG.datoH).
   Se carga después de novedades.js. No toca nada de index.html: se engancha envolviendo funciones.
   ===================================================================== */
(function(){'use strict';
const $=id=>document.getElementById(id);
const E=s=>(typeof esc==='function'?esc(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const EF_PATH='efemerides/navarra.json',EF_DEF={_def:1,dias:{},curiosidades:[],prohibidas:[]};   // _def = «no se pudo leer el archivo»
// Palabras que bloquean un dato. En MAYÚSCULAS = siglas (se miran tal cual); el resto, sin tildes y por principio de palabra.
// OJO: si cambias esta lista, cambia también la de RiverJob.java (NO_DATO).
const EF_NO=['elecci','electoral','partido politico','parlament','gobierno','diputacion','congreso de los diputados','senado','ministr','alcald','concejal',
  'presidente del','presidenta del','votacion','referendum','guerra','batalla','atentad','terroris','franquis','dictadura','golpe de estado','fusilad',
  'carlis','requete','republica','independentis','nacionalis','huelga','manifestacion','ETA','UPN','PSN','PSOE','PNV','EH Bildu','Bildu','Geroa','Podemos','Vox','PP'];
const nrm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function efMalo(x,extra){const txt=[x.t,x.txt].join(' '),n=nrm(txt);
  return EF_NO.concat(extra||[]).some(w=>{if(!w)return false;
    if(w===w.toUpperCase()&&/[A-Z]/.test(w))return new RegExp('(^|[^A-Za-z])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z]|$)').test(txt);
    return new RegExp('(^|[^a-z])'+nrm(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(n);});}
const mmdd=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const diaAno=d=>Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);
// devuelve {x, tipo:'dia'|'cur', k}
function efElegir(D,d){d=d||new Date();const ex=D.prohibidas||[],k=mmdd(d);
  const L=((D.dias||{})[k]||[]).filter(x=>x&&x.t&&!efMalo(x,ex));
  if(L.length)return {x:L[d.getFullYear()%L.length],tipo:'dia',k,n:L.length};
  const C=(D.curiosidades||[]).filter(x=>x&&x.t&&!efMalo(x,ex));
  return C.length?{x:C[diaAno(d)%C.length],tipo:'cur',k}:null;}
const CAT_IC={naturaleza:'🌿',cultura:'🎭','música':'🎻',deporte:'🚴',ciencia:'🔭',tradiciones:'🎉',personajes:'⭐',lugares:'🏰'};

document.head.insertAdjacentHTML('beforeend',`<style id="efCss">
#efHome{margin-top:12px}
#efCard{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 8px rgba(29,45,35,.05);padding:12px 13px;cursor:pointer}
#efCard .efH{display:flex;align-items:center;gap:10px}
#efCard .efI{font-size:22px;width:40px;height:40px;border-radius:13px;background:#FBF3E4;display:flex;align-items:center;justify-content:center;flex:none}
#efCard .efK{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#A0612A}
#efCard b{display:block;font-size:15px;line-height:1.25}
#efCard .efT{margin:8px 0 0;font-size:14px;line-height:1.45;color:var(--txt,#1d2b23)}
#efCard.cerr .efT{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#efCard .efF{margin-top:6px;font-size:12.5px;color:var(--mut)}
#efCard .efA{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
#efEd input,#efEd textarea,#efEd select{width:100%;box-sizing:border-box;margin:3px 0 6px;font:inherit;padding:7px;border:1px solid var(--line);border-radius:9px}
</style>`);

// la tarjeta va justo encima de «La semana en Navarra»
(function(){const se=$('seHome');if(se&&!$('efHome'))se.insertAdjacentHTML('beforebegin','<div id="efHome"><div id="efCard" class="cerr"><div class="efH"><div class="efI">📜</div><div><div class="efK">Tal día como hoy</div><b>Cargando…</b></div></div></div></div>');})();

let EF=null,EFT=0,EFDAY='';
async function efLoad(force){
  if(!force&&EF&&Date.now()-EFT<6*3600e3)return EF;
  // si el archivo no se puede leer (sin internet o con un error), jsLoad devuelve EF_DEF (_def): entonces seguimos con la última copia buena.
  // Si el archivo está bien pero vacío, se respeta: la tarjeta se esconde.
  try{const d=await jsLoad(EF_PATH,EF_DEF,force);if(d&&!d._def){EF=d;EFT=Date.now();LS.set('ef_cache',d);return EF;}}catch(e){}
  EF=EF||LS.get('ef_cache',null)||EF_DEF;return EF;}

function efDraw(){const el=$('efCard');if(!el||!EF)return;const r=efElegir(EF);EFDAY=hoyYmd();
  const box=$('efHome');if(box)box.style.display=r?'':'none';
  if(!r)return;   // sin datos: no se enseña la tarjeta
  const x=r.x,hoy=new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const cab=r.tipo==='dia'?('Tal día como hoy · '+hoy+(x.a?', '+x.a:'')):'Dato curioso de Navarra';
  el.innerHTML=`<div class="efH"><div class="efI">${CAT_IC[x.cat]||(r.tipo==='dia'?'📜':'💡')}</div><div><div class="efK">${E(cab)}</div><b>${E(x.t)}</b></div></div>
   <p class="efT">${E(x.txt)}</p>
   <div class="efMas" style="display:none">${x.fuente&&/^https?:\/\//i.test(x.fuente)?`<div class="efF">Fuente: <a href="${E(x.fuente)}" target="_blank" rel="noopener">${E(x.fuente.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])}</a></div>`:''}
    ${typeof TECH!=='undefined'&&TECH?`<div class="efF">${x.ok?'✅ Revisado':'⚠️ Sin revisar todavía'} · clave ${r.k}${r.tipo==='cur'?' (curiosidad: hoy no hay dato propio)':''}</div>
    <div class="efA"><button class="btn" data-a="ed">✏️ ${r.tipo==='dia'?'Editar':'Añadir'} el dato de hoy</button>${r.tipo==='dia'&&!x.ok?'<button class="btn" data-a="ok">✅ Marcar revisado</button>':''}</div><div id="efEd"></div>`:''}</div>`;
  el.onclick=ev=>{const b=ev.target.closest('button[data-a]');if(b){ev.stopPropagation();if(b.dataset.a==='ed')efForm(r);else efOk(r);return;}
    if(ev.target.closest('a,#efEd'))return;const c=el.classList.toggle('cerr');el.querySelector('.efMas').style.display=c?'none':'block';};}

async function efHome(force){if(!$('efCard'))return;await efLoad(force);efDraw();}

// ---------- modo administrador: editar el dato de hoy ----------
function efForm(r){const box=$('efEd');if(!box)return;const x=r.tipo==='dia'?r.x:{};
  const cats=(EF.cats&&EF.cats.length?EF.cats:Object.keys(CAT_IC));
  box.innerHTML=`<div class="note" style="margin-top:8px">Sin política: nada de elecciones, partidos, gobiernos, guerras ni atentados.</div>
   <label class="note">Año (opcional)</label><input id="efA" type="number" value="${E(x.a||'')}">
   <label class="note">Título</label><input id="efTi" maxlength="70" value="${E(x.t||'')}">
   <label class="note">Texto (2 o 3 frases)</label><textarea id="efTx" rows="4" maxlength="400">${E(x.txt||'')}</textarea>
   <label class="note">Categoría</label><select id="efC">${cats.map(c=>`<option ${c===x.cat?'selected':''}>${E(c)}</option>`).join('')}</select>
   <label class="note">Fuente (enlace para comprobarlo)</label><input id="efFu" value="${E(x.fuente||'')}" placeholder="https://…">
   <div class="efA"><button class="btn on" id="efG">💾 Guardar</button><button class="btn" id="efX">Cancelar</button></div>`;
  $('efX').onclick=e=>{e.stopPropagation();box.innerHTML='';};
  $('efG').onclick=async e=>{e.stopPropagation();
    const n={t:$('efTi').value.trim(),txt:$('efTx').value.trim(),cat:$('efC').value,ok:true};
    const a=parseInt($('efA').value,10);if(a)n.a=a;const fu=$('efFu').value.trim();if(/^https?:\/\//i.test(fu))n.fuente=fu;
    if(!n.t||!n.txt){toast('Falta el título o el texto');return;}
    if(efMalo(n,EF.prohibidas)){toast('⛔ Parece un tema político. Cámbialo para que no se quede fuera.');return;}
    try{EF=await jsEdit(EF_PATH,EF_DEF,d=>{delete d._def;d.dias=d.dias||{};const L=d.dias[r.k]=d.dias[r.k]||[];
        const i=r.tipo==='dia'?L.findIndex(y=>y.t===r.x.t):-1;if(i>=0)L[i]=n;else L.push(n);},'Dato del día '+r.k);
      LS.set('ef_cache',EF);toast('✅ Guardado. Les llegará a todos en unos minutos.');efDraw();}
    catch(err){toast('No se pudo guardar: '+err.message);}};}
async function efOk(r){try{EF=await jsEdit(EF_PATH,EF_DEF,d=>{const y=((d.dias||{})[r.k]||[]).find(y=>y.t===r.x.t);if(y)y.ok=true;},'Dato del día revisado '+r.k);
  LS.set('ef_cache',EF);toast('✅ Marcado como revisado');efDraw();}catch(err){toast('No se pudo guardar: '+err.message);}}

// ---------- enganches ----------
const _stEf=showTab;showTab=function(t){_stEf(t);if(t==='mtiempo')setTimeout(()=>efHome(false),200);};
// al cambiar de día con la app abierta
setInterval(()=>{if(EFDAY&&EFDAY!==hoyYmd())efHome(false);},60e3);
setTimeout(()=>efHome(false),600);

// ---------- Ajustes: aviso del dato del día ----------
if(typeof ajustesRender==='function'){const _ajEf=ajustesRender;window.ajustesRender=ajustesRender=function(){_ajEf.apply(this,arguments);
  const el=$('ajBody');if(!el)return;const nat=typeof APP!=='undefined'&&APP&&window.AndroidNet&&window.AndroidNet.setAlerts;
  const h=CFG.datoH||9;
  el.insertAdjacentHTML('beforeend',`<div class="card"><b>📜 Dato del día</b><div class="note">Cada mañana, un dato histórico o curioso de Navarra de ese mismo día. Sin temas políticos.</div>
   ${nat?`<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="ajDato" ${CFG.dato?'checked':''}> Avisarme en el móvil</label>
   <div class="st"><div><b>⏰ Hora del aviso</b></div><div><select id="ajDatoH" class="town">${[7,8,9,10,11,12,18,20].map(v=>`<option value="${v}" ${v===h?'selected':''}>${v}:00</option>`).join('')}</select></div></div>
   <div class="note">Android puede retrasarlo unos minutos para ahorrar batería.</div>`:'<div class="note">El aviso en el móvil llega con la app de Android actualizada (versión 4.3 o más). La tarjeta se ve en el Inicio.</div>'}</div>`);
  const c=$('ajDato');if(c)c.onchange=()=>{CFG.dato=c.checked;cfgSave();};
  const s=$('ajDatoH');if(s)s.onchange=()=>{CFG.datoH=+s.value;cfgSave();};};}

window.EFEMERIDES={efElegir,efMalo,efHome};
})();
