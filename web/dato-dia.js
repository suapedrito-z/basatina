/* =====================================================================
   💡 DATO DEL DÍA (Inicio)
   Lee curiosidades/datos_navarra.json desde GitHub (con jsLoad, igual que la Agenda cultural).
   - Si hay un dato con la fecha de hoy (MM-DD) → sale ese («Tal día como hoy»).
   - Si no → un «comodín» (fecha null), el mismo para todo el mundo ese día y sin repetirse
     hasta pasar por todos.
   - Los datos con "revisar": true solo los ve el modo administrador (para comprobarlos antes).
   - En euskera usa texto_eu si existe; si no, texto_es.
   Prueba: en el modo administrador, ddDemo('07-05') simula ese día; ddDemo() vuelve a hoy.
   Reglas del proyecto: no se toca index.html por dentro; se engancha envolviendo bnHome.
   ===================================================================== */
(function(){'use strict';
const DD_PATH='curiosidades/datos_navarra.json',DD_DEF={version:1,datos:[]};
const DD={L:null,forzar:null,cargando:false};
const $=id=>document.getElementById(id);
const E=s=>(typeof esc==='function'?esc(s):String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const ICO={rios:'🌊',clima:'🌦️',naturaleza:'🌲',geografia:'⛰️',historia:'📜',pueblos:'🏘️'};
const dos=n=>String(n).padStart(2,'0');

/* Elige el dato de un día. Es una función «pura» (no toca la pantalla) para poder probarla. */
function ddElegir(L,fecha,admin){
  const vale=(L||[]).filter(x=>x&&x.texto_es&&(admin||!x.revisar));
  const mmdd=dos(fecha.getMonth()+1)+'-'+dos(fecha.getDate());
  // número de días desde 1970: cambia cada día y sigue contando de un año a otro
  const n=Math.floor(Date.UTC(fecha.getFullYear(),fecha.getMonth(),fecha.getDate())/864e5);
  const ef=vale.filter(x=>x.fecha===mmdd);
  if(ef.length)return {d:ef[n%ef.length],efem:true};
  const co=vale.filter(x=>!x.fecha);
  return co.length?{d:co[n%co.length],efem:false}:null;
}

function ddFecha(){if(!DD.forzar)return new Date();
  const [m,d]=DD.forzar.split('-').map(Number),f=new Date();f.setMonth(m-1,d);return f;}

function ddDraw(){const el=$('ddTk');if(!el)return;
  if(!DD.L){el.innerHTML='<div class="ddC"><span class="ddE">💡</span><div><small>Cargando…</small></div></div>';return;}
  const admin=typeof TECH!=='undefined'&&!!TECH,f=ddFecha(),r=ddElegir(DD.L,f,admin);
  if(!r){el.style.display='none';return;}el.style.display='';
  const x=r.d,eu=(window.LANG==='eu'&&x.texto_eu)?x.texto_eu:x.texto_es;
  const hace=r.efem&&x.anio?f.getFullYear()-x.anio:0;
  const cab=r.efem?`<span>Tal día como hoy</span>${hace>0?' · <span>hace</span> '+hace+' <span>años</span>':''}`:'<span>¿Sabías que…?</span>';
  el.innerHTML=`<div class="ddC"><span class="ddE">${ICO[x.categoria]||'💡'}</span><div>
    <small class="ddW">${cab}${DD.forzar?' · 🧪 '+E(DD.forzar):''}${x.revisar?' · <span class="ddR">⚠️ Pendiente de revisar</span>':''}</small>
    <p>${E(eu)}</p>
    ${x.fuente?`<small class="ddF"><span>Fuente</span>: ${x.url&&/^https?:\/\//i.test(x.url)?`<a href="${E(x.url)}" target="_blank" rel="noopener">${E(x.fuente)}</a>`:E(x.fuente)}</small>`:''}
  </div></div>`;}

async function ddLoad(){if(DD.cargando)return;DD.cargando=true;
  try{const G=await jsLoad(DD_PATH,DD_DEF);DD.L=(G&&G.datos)||[];}catch(e){DD.L=[];console.log('ddLoad',e);}
  DD.cargando=false;ddDraw();}

/* Pone la tarjeta en el Inicio, debajo de «Ahora en Navarra». Si el Inicio se redibuja, la vuelve a poner. */
function ddEnsure(){const H=$('bnaHome');if(!H||$('ddTk'))return;if(typeof isBna==='function'&&!isBna())return;
  H.insertAdjacentHTML('beforeend','<div class="bnaH"><span>Dato del día</span></div><article id="ddTk"></article>');
  if(!DD.L)ddLoad();ddDraw();}

document.head.insertAdjacentHTML('beforeend',`<style id="ddCss">
#ddTk{display:block;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 8px rgba(29,45,35,.05);overflow:hidden}
#ddTk .ddC{display:flex;align-items:flex-start;gap:11px;padding:12px}
#ddTk .ddC>div{flex:1;min-width:0}
#ddTk .ddE{font-size:22px;width:40px;height:40px;border-radius:13px;background:#F3F6F1;display:flex;align-items:center;justify-content:center;flex:none}
#ddTk p{margin:3px 0 5px;font-size:14.5px;line-height:1.4}
#ddTk small{display:block;color:var(--mut);font-size:12.5px;line-height:1.3}
#ddTk .ddW{color:#3D7031;font-weight:800}
#ddTk .ddR{color:#B5651D}
#ddTk .ddF a{color:inherit;text-decoration:underline}
</style>`);

if(typeof bnHome==='function'){const _bh=bnHome;bnHome=function(){try{_bh.apply(this,arguments);}catch(e){console.log('bnHome',e);}ddEnsure();};
  const H0=$('bnaHome');if(H0)new MutationObserver(()=>ddEnsure()).observe(H0,{childList:true});
  setTimeout(ddEnsure,500);}
// a medianoche (o al volver a la app otro día) cambia el dato
let ddDia=new Date().getDate();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&new Date().getDate()!==ddDia){ddDia=new Date().getDate();ddDraw();}});

window.ddDemo=f=>{DD.forzar=/^\d{2}-\d{2}$/.test(f||'')?f:null;ddDraw();};
window.ddRecargar=()=>{DD.L=null;ddLoad();};
window.ddElegir=ddElegir;   // para pruebas
})();
