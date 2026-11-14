/* =====================================================================
   🥾 ESCAPADAS · rutas con ficha (nov. 2026)
   Arriba un buscador y debajo fichas de ruta (al estilo Wikiloc). Al tocar una ruta se abre su ficha con:
   distancia, desnivel, dificultad, altitudes, tiempo, mapa del recorrido (solo esa ruta), perfil que se sigue
   con el dedo (marca el punto en el mapa), descripción, descarga GPX y el tiempo previsto en el trayecto.
   Datos: web/rutas.js (lo genera tools/rutas.py con OpenStreetMap + IDENA; robot .github/workflows/rutas.yml).
   El mapa antiguo de «Salir al monte» (cuevas, miradores, fuentes, baño, bici) queda abajo en un desplegable.
   Se carga después de servicios-ui.js (usa svLoad, SV_N y svHook) y del script principal (NavMap, getJSON…).
   ===================================================================== */
const RU = {todas: [], q: '', g: '', z: '', d: '', k: '', c: false, o: 'nombre', pos: null, n: 25, sel: null, map: null, pt: null, cum: null, base: 'topo', scroll: 0};
const RU_DIF = {'Fácil': '#2e9e4f', 'Moderada': '#d89b00', 'Difícil': '#ef6c00', 'Muy difícil': '#d32f2f'};
const RU_GRP = [['', 'Todas', '🥾'], ['Senderos y paseos', 'Senderos y paseos', '🌿'], ['Grandes travesías', 'Grandes travesías', '🏔️'],
  ['Camino de Santiago', 'Camino de Santiago', '🐚'], ['Vías verdes', 'Vías verdes', '🚲']];
const RU_ICO = {'Senderos y paseos': '🌿', 'Grandes travesías': '🏔️', 'Camino de Santiago': '🐚', 'Vías verdes': '🚲'};
const RU_ZON = ['Pirineo', 'Baztan-Bidasoa', 'Plazaola-Sakana-Ultzama', 'Pamplona y Comarca', 'Tierra Estella', 'Zona Media', 'Sangüesa-Prepirineo', 'La Ribera'];
// Cartografía de fondo del mapa de la ficha (IGN): topográfico, mapa base y foto aérea
const RU_WMS = {
  topo: b => `https://www.ign.es/wms-inspire/mapa-raster?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=mtn_rasterizado&STYLES=&CRS=EPSG:4326&BBOX=${b.s},${b.w},${b.n},${b.e}&WIDTH=${Math.round(b.W * 1.5)}&HEIGHT=${Math.round(b.H * 1.5)}&FORMAT=image/jpeg`,
  sat: b => `https://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=OI.OrthoimageCoverage&STYLES=&CRS=EPSG:4326&BBOX=${b.s},${b.w},${b.n},${b.e}&WIDTH=${Math.round(b.W * 1.5)}&HEIGHT=${Math.round(b.H * 1.5)}&FORMAT=image/jpeg`,
  mapa: null};

// ---------- utilidades ----------
const ruKm = (a, b) => {const r = Math.PI / 180, p1 = a[0] * r, p2 = b[0] * r, dp = p2 - p1, dl = (b[1] - a[1]) * r;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2)));};
const ruH = h => {const H = Math.floor(h), m = Math.round((h - H) * 60 / 5) * 5; return m === 60 ? `${H + 1} h` : H ? `${H} h${m ? ' ' + String(m).padStart(2, '0') : ''}` : `${m} min`;};
const ruF = (x, d = 1) => (typeof fmtN === 'function' ? fmtN(x, d) : (+x).toFixed(d));
const ruE = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
function ruOpen(u) {if (APP && window.AndroidNet.openUrl) window.AndroidNet.openUrl(u); else window.open(u, '_blank');}
// punto de la línea a una fracción (0-1) de su longitud
function ruPunto(r, fr) {const L = r.lin, c = RU.cum, t = fr * c[c.length - 1]; let k = 1; while (k < c.length - 1 && c[k] < t) k++;
  const a = L[k - 1], b = L[k], q = c[k] > c[k - 1] ? (t - c[k - 1]) / (c[k] - c[k - 1]) : 0; return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];}

// ---------- estilos ----------
document.head.insertAdjacentHTML('beforeend', `<style>
#ruBox .ruBusca{position:relative;margin:6px 0}
#ruQ{width:100%;box-sizing:border-box;font-size:16px;padding:12px 14px;border-radius:12px}
.ruChips{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none}.ruChips::-webkit-scrollbar{display:none}
.ruChips button{white-space:nowrap;border-radius:99px;padding:7px 12px;flex:none}
.ruFil{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px}.ruFil select{width:100%;margin:0}
.ruFil label{grid-column:1/-1;display:flex;align-items:center;gap:6px;font-size:14px;color:var(--txt)}
.ruCard{display:flex;gap:11px;align-items:stretch;cursor:pointer;padding:10px;margin:8px 0}
.ruCard:active{transform:scale(.99)}
.ruMini{width:84px;height:84px;border-radius:12px;flex:none;background:linear-gradient(160deg,rgba(60,180,120,.18),rgba(41,198,242,.16));border:1px solid var(--line)}
.ruTx{flex:1;min-width:0;display:flex;flex-direction:column}
.ruNom{font-size:15px;line-height:1.25;color:var(--txt)}
.ruDat{display:flex;flex-wrap:wrap;gap:3px 10px;font-size:13px;margin-top:5px;color:var(--txt);align-items:center}
.ruDif{color:#fff;border-radius:99px;padding:1px 9px;font-size:12px;font-weight:700}
.ruSpark{width:100%;height:26px;margin-top:auto;display:block}
.ruTit{font-size:21px;line-height:1.2;margin:8px 0 3px;color:var(--txt)}
.ruKpi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}
.ruKpi>div{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 4px;text-align:center}
.ruKpi span{font-size:11px;color:var(--mut);display:block;margin-bottom:2px}.ruKpi b{font-size:15px;color:var(--txt)}
.ruMapBox{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line)}
.ruMapBtn{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px}
.ruBase{position:absolute;left:8px;bottom:8px;display:flex;gap:4px}
.ruBase button{padding:5px 9px;font-size:12px;border-radius:99px}
.ruPasa{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.ruPasa span{background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:2px 9px;font-size:12.5px;color:var(--txt)}
.ruWx{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:6px 0 10px}
.ruWx>div{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:6px 2px;text-align:center;font-size:12px;color:var(--txt)}
.ruWx .i{font-size:22px;display:block}
.ruBtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
</style>`);

// ---------- montaje en la sección Escapadas ----------
(function () {
  const box = document.getElementById('ruBox'); if (!box) return;
  box.innerHTML = `<div id="ruLista">
    <div class="ruBusca"><input id="ruQ" class="town" type="search" placeholder="🔎 Busca ruta, pueblo o sendero (Zubiri, PR-NA 120…)" autocomplete="off"></div>
    <div class="ruChips" id="ruG">${RU_GRP.map(([v, t, i]) => `<button class="btn${v ? '' : ' on'}" data-g="${v}">${i} ${t}</button>`).join('')}</div>
    <div class="ruFil">
      <select id="ruZ" class="town"><option value="">📍 Todas las zonas</option>${RU_ZON.map(z => `<option>${z}</option>`).join('')}</select>
      <select id="ruD" class="town"><option value="">💪 Cualquier dificultad</option>${Object.keys(RU_DIF).map(d => `<option>${d}</option>`).join('')}</select>
      <select id="ruK" class="town"><option value="">📏 Cualquier distancia</option><option value="0-5">Hasta 5 km</option><option value="5-10">De 5 a 10 km</option><option value="10-20">De 10 a 20 km</option><option value="20-999">Más de 20 km</option></select>
      <select id="ruO" class="town"><option value="nombre">↕️ Por nombre</option><option value="cerca">📍 Más cerca de mí</option><option value="km">Más cortas primero</option><option value="kmd">Más largas primero</option><option value="up">Menos desnivel primero</option></select>
      <label><input type="checkbox" id="ruC"> 🔁 Solo rutas circulares</label>
    </div>
    <div class="note" id="ruN">Cargando rutas…</div>
    <div id="ruL"></div>
    <button class="btn" id="ruMas" style="width:100%;display:none">Ver más rutas</button>
  </div>
  <div id="ruFicha" style="display:none"></div>`;
  const $ = id => document.getElementById(id);
  let t = 0; $('ruQ').oninput = e => {clearTimeout(t); t = setTimeout(() => {RU.q = e.target.value; RU.n = 25; ruLista();}, 200);};
  $('ruG').onclick = e => {const b = e.target.closest('button'); if (!b) return; RU.g = b.dataset.g; RU.n = 25;
    $('ruG').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); ruLista();};
  $('ruZ').onchange = e => {RU.z = e.target.value; RU.n = 25; ruLista();};
  $('ruD').onchange = e => {RU.d = e.target.value; RU.n = 25; ruLista();};
  $('ruK').onchange = e => {RU.k = e.target.value; RU.n = 25; ruLista();};
  $('ruC').onchange = e => {RU.c = e.target.checked; RU.n = 25; ruLista();};
  $('ruO').onchange = async e => {RU.o = e.target.value; RU.n = 25;
    if (RU.o === 'cerca' && !RU.pos) {$('ruN').textContent = '📍 Buscando dónde estás…';
      try {const p = await myPos(); RU.pos = [p.la, p.lo];} catch (er) {$('ruN').textContent = '⚠️ ' + er.message; RU.o = 'nombre'; e.target.value = 'nombre';}}
    ruLista();};
  $('ruMas').onclick = () => {RU.n += 25; ruLista(true);};
  $('ruL').onclick = e => {const c = e.target.closest('.ruCard'); if (c) ruFicha(RU.todas[+c.dataset.i]);};
  // el mapa antiguo, al abrir su desplegable, se vuelve a dibujar con su tamaño real
  const old = $('moViejo'); if (old) old.addEventListener('toggle', () => {if (old.open) setTimeout(() => {if (typeof MOM !== 'undefined' && MOM) {MOM.draw(); MOM.base();}}, 80);});
})();

function ruInit() {
  if (RU.todas.length) {if (!RU.sel) ruLista(); else if (RU.map) setTimeout(() => {RU.map.draw(); RU.map.base();}, 60); return;}
  svLoad('rutas.js', 'RUTAS', ok => {
    if (!ok || !window.RUTAS) {document.getElementById('ruN').textContent = '⚠️ No se pudieron cargar las rutas. Desliza hacia abajo para reintentar.'; return;}
    RU.todas = RUTAS.rutas.map((r, i) => Object.assign(r, {i, _s: SV_N([r.n, r.ref, r.pueblo, r.muni, r.fin, r.zona, r.tipo, r.grupo, (r.pasa || []).join(' ')].join(' '))}));
    ruLista();
  });
}
svHook('monte', ruInit);

// ---------- lista de rutas ----------
function ruFiltra() {
  const q = SV_N(RU.q).split(/\s+/).filter(Boolean);
  let L = RU.todas.filter(r => (!RU.g || r.grupo === RU.g) && (!RU.z || r.zona === RU.z) && (!RU.d || r.dif === RU.d) && (!RU.c || r.circ)
    && (!RU.k || (() => {const [a, b] = RU.k.split('-').map(Number); return r.km >= a && r.km < b;})()) && q.every(w => r._s.includes(w)));
  const by = {nombre: (a, b) => a.n.localeCompare(b.n, 'es'), km: (a, b) => a.km - b.km, kmd: (a, b) => b.km - a.km, up: (a, b) => a.up - b.up,
    cerca: (a, b) => a._d - b._d}[RU.o];
  if (RU.o === 'cerca' && RU.pos) L.forEach(r => r._d = ruKm(RU.pos, r.lin[0]));
  return L.sort(by);
}
function ruCardHtml(r) {
  const d = RU.o === 'cerca' && r._d != null ? ` · a ${ruF(r._d, r._d < 10 ? 1 : 0)} km` : '';
  return `<div class="card ruCard" data-i="${r.i}"><canvas class="ruMini" data-i="${r.i}"></canvas>
   <div class="ruTx"><b class="ruNom">${ruE(r.n)}</b>
    <div class="note">${RU_ICO[r.grupo] || '🥾'} ${ruE(r.zona)} · ${r.circ ? 'circular desde' : 'sale de'} ${ruE(r.pueblo)}${d}</div>
    <div class="ruDat"><span>📏 ${ruF(r.km)} km</span><span>↗ ${r.up} m</span><span>⏱️ ${ruH(r.h)}</span><span class="ruDif" style="background:${RU_DIF[r.dif]}">${r.dif}</span></div>
    ${ruSpark(r)}</div></div>`;
}
function ruSpark(r) {const p = r.pf, mn = Math.min(...p), mx = Math.max(...p), rg = Math.max(30, mx - mn), W = 200, H = 26;
  const pts = p.map((e, i) => `${(i / (p.length - 1) * W).toFixed(1)},${(H - 2 - (e - mn) / rg * (H - 4)).toFixed(1)}`).join(' ');
  return `<svg class="ruSpark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polygon points="0,${H} ${pts} ${W},${H}" fill="${RU_DIF[r.dif]}33"/><polyline points="${pts}" fill="none" stroke="${RU_DIF[r.dif]}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;}
// dibujo pequeño de la forma de la ruta (sin mapa debajo, para que la lista sea ligera)
function ruMini(cv, r) {const W = 84, H = 84, x = (() => {const k = window.devicePixelRatio || 1; cv.width = W * k; cv.height = H * k; const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); return c;})();
  const L = r.lin, la = L.map(p => p[0]), lo = L.map(p => p[1]), s = Math.min(...la), n = Math.max(...la), w = Math.min(...lo), e = Math.max(...lo);
  const kx = Math.cos((s + n) / 2 * Math.PI / 180), sc = Math.min((W - 16) / Math.max(1e-6, (e - w) * kx), (H - 16) / Math.max(1e-6, n - s));
  const P = p => [W / 2 + (p[1] - (w + e) / 2) * kx * sc, H / 2 - (p[0] - (s + n) / 2) * sc];
  x.lineJoin = x.lineCap = 'round';
  for (const [col, wd] of [['rgba(255,255,255,.85)', 5], [RU_DIF[r.dif], 2.6]]) {x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); L.forEach((p, i) => {const [a, b] = P(p); i ? x.lineTo(a, b) : x.moveTo(a, b);}); x.stroke();}
  const [a, b] = P(L[0]); x.fillStyle = '#2e9e4f'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(a, b, 4.5, 0, 7); x.fill(); x.stroke();
}
function ruLista(mas) {
  const L = ruFiltra(), el = document.getElementById('ruL'); if (!el) return;
  document.getElementById('ruN').textContent = `${L.length} ${L.length === 1 ? 'ruta' : 'rutas'}${RU.todas.length !== L.length ? ' de ' + RU.todas.length : ' en Navarra'}`;
  const desde = mas ? el.children.length : 0, trozo = L.slice(desde, RU.n);
  if (!mas) el.innerHTML = '';
  el.insertAdjacentHTML('beforeend', trozo.map(ruCardHtml).join('') || (mas ? '' : '<div class="card note">No hay rutas con esos filtros. Prueba a quitar alguno.</div>'));
  el.querySelectorAll('canvas.ruMini:not([data-ok])').forEach(cv => {cv.dataset.ok = 1; ruMini(cv, RU.todas[+cv.dataset.i]);});
  document.getElementById('ruMas').style.display = L.length > RU.n ? '' : 'none';
}

// ---------- ficha de una ruta ----------
function ruFicha(r) {
  RU.sel = r; RU.pt = null; RU.scroll = window.scrollY;
  // la ficha ocupa un paso en el historial: el «atrás» del móvil la cierra y vuelve a la lista
  if (!(history.state && history.state.ruta)) history.pushState({t: 'monte', ruta: 1}, '');
  const L = r.lin; RU.cum = [0]; for (let i = 1; i < L.length; i++) RU.cum.push(RU.cum[i - 1] + ruKm(L[i - 1], L[i]));
  const fi = document.getElementById('ruFicha'), li = document.getElementById('ruLista');
  li.style.display = 'none'; fi.style.display = '';
  const ref = r.ref && !SV_N(r.n).includes(SV_N(r.ref)) ? ruE(r.ref) + ' · ' : '';
  fi.innerHTML = `<button class="btn" id="ruVolver">← Volver a las rutas</button>
   <h2 class="ruTit">${ruE(r.n)}</h2>
   <div class="note">${RU_ICO[r.grupo] || '🥾'} ${ref}${ruE(r.grupo)} · ${ruE(r.zona)} · ${ruE(r.muni || r.pueblo)}</div>
   <div class="ruKpi">
    <div><span>Distancia</span><b>${ruF(r.km)} km</b></div><div><span>Desnivel +</span><b>${r.up} m</b></div>
    <div><span>Desnivel −</span><b>${r.dn} m</b></div><div><span>Dificultad</span><b style="color:${RU_DIF[r.dif]}">${r.dif}</b></div>
    <div><span>Altitud máx.</span><b>${r.mx} m</b></div><div><span>Altitud mín.</span><b>${r.mn} m</b></div>
    <div><span>Tiempo</span><b>${ruH(r.h)}</b></div><div><span>Tipo</span><b>${r.circ ? '🔁 Circular' : '➡️ Lineal'}</b></div></div>
   <div class="ruMapBox"><canvas id="ruMapa" height="300"></canvas>
    <div class="ruMapBtn"><button class="btn mtb" id="ruIn">＋</button><button class="btn mtb" id="ruOut">－</button><button class="btn mtb" id="ruAll">⤢</button></div>
    <div class="ruBase">${[['topo', '🏔️ Topo'], ['mapa', '🗺️ Mapa'], ['sat', '🛰️ Satélite']].map(([k, t]) => `<button class="btn${RU.base === k ? ' on' : ''}" data-b="${k}">${t}</button>`).join('')}</div></div>
   <div class="card" style="padding:10px 8px 8px"><b>⛰️ Perfil del recorrido</b>${ruPerfil(r)}
    <div id="ruPfT" class="note" style="min-height:2.9em;margin-top:2px">👆 Desliza el dedo por la gráfica (o toca la ruta en el mapa) para ver la altitud de cada punto.</div></div>
   <div class="card"><b>📝 La ruta</b><div style="margin-top:6px;font-size:14.5px;line-height:1.5;color:var(--txt)">${ruE(r.desc)}</div>
    ${r.destaca ? `<div class="note" style="margin-top:6px">⭐ Destacado: ${ruE(r.destaca)}</div>` : ''}
    ${r.pasa && r.pasa.length ? `<div class="note" style="margin-top:8px">Pueblos por los que pasa:</div><div class="ruPasa">${r.pasa.map(p => `<span>${ruE(p)}</span>`).join('')}</div>` : ''}</div>
   <div class="ruBtns">
    <button class="btn pri" id="ruGpx">⬇️ Descargar GPS (GPX)</button><button class="btn" id="ruIr">🚗 Cómo llegar a la salida</button>
    ${r.osm ? `<button class="btn" id="ruOsm">🗺️ Ver en OpenStreetMap</button>` : ''}${r.web ? `<button class="btn" id="ruWeb">🔗 Web de la ruta</button>` : ''}
    <button class="btn" id="ruSh">📤 Compartir</button></div>
   <div class="card" id="ruTiempo"><b>🌦️ El tiempo en el recorrido</b><div class="note">Cargando la previsión…</div></div>
   <div class="card" style="border-color:#ffb020"><div class="note">⚠️ Tiempo orientativo sin paradas (norma DIN 33466: 4 km/h en llano, 300 m/h subiendo, 500 m/h bajando). La dificultad está calculada con la distancia y el desnivel, no con el terreno: infórmate antes de salir, mira los avisos y lleva agua, ropa de abrigo y el móvil cargado. Emergencias: 112.<br>Datos: ${(r.fuente || []).map(ruE).join(' · ')}. Alturas: Copernicus DEM GLO-30. Mapas: © Instituto Geográfico Nacional.</div></div>`;
  const $ = id => document.getElementById(id);
  $('ruVolver').onclick = () => {if (history.state && history.state.ruta) history.back(); else ruCerrar();};
  $('ruGpx').onclick = () => ruGpx(r);
  $('ruIr').onclick = () => ruOpen(`https://www.google.com/maps/dir/?api=1&destination=${r.lin[0][0]},${r.lin[0][1]}`);
  if ($('ruOsm')) $('ruOsm').onclick = () => ruOpen(`https://www.openstreetmap.org/relation/${r.osm}`);
  if ($('ruWeb')) $('ruWeb').onclick = () => ruOpen(r.web);
  $('ruSh').onclick = () => {const t = `🥾 ${r.n}\n📏 ${ruF(r.km)} km · ↗ ${r.up} m · ↘ ${r.dn} m · ${r.dif} · ⏱️ ${ruH(r.h)}\n📍 Salida: https://www.google.com/maps/search/?api=1&query=${r.lin[0][0]},${r.lin[0][1]}\n(BasatiNA · basatina.es)`;
    if (APP) window.AndroidNet.share(t); else if (navigator.share) navigator.share({text: t}).catch(() => {}); else navigator.clipboard && navigator.clipboard.writeText(t);};
  fi.querySelectorAll('.ruBase button').forEach(b => b.onclick = () => {RU.base = b.dataset.b; fi.querySelectorAll('.ruBase button').forEach(x => x.classList.toggle('on', x === b));
    if (RU.map) {RU.map.wms = RU_WMS[RU.base]; RU.map.img = null; RU.map.base();}});
  window.scrollTo(0, Math.max(0, fi.getBoundingClientRect().top + window.scrollY - 100));
  setTimeout(() => {ruMapa(r); ruPerfilTouch(r);}, 30);
  ruTiempo(r);
}
function ruCerrar() {RU.sel = null; document.getElementById('ruFicha').style.display = 'none'; document.getElementById('ruFicha').innerHTML = '';
  document.getElementById('ruLista').style.display = ''; RU.map = null; setTimeout(() => window.scrollTo(0, RU.scroll), 20);}

// ---------- mapa de la ficha: solo esta ruta ----------
function ruMapa(r) {
  const M = NavMap('ruMapa', (x, P, b) => {
    const L = r.lin; x.lineJoin = x.lineCap = 'round';
    for (const [col, wd] of [['rgba(255,255,255,.9)', 7], [RU_DIF[r.dif], 4]]) {x.strokeStyle = col; x.lineWidth = wd; x.beginPath();
      L.forEach((p, i) => {const [a, c] = P(p[0], p[1]); i ? x.lineTo(a, c) : x.moveTo(a, c);}); x.stroke();}
    // flechas de sentido cada cierto trecho
    const tot = RU.cum[RU.cum.length - 1], paso = Math.max(tot / 8, 0.3);
    x.fillStyle = '#fff';
    for (let d = paso / 2; d < tot; d += paso) {const fr = d / tot, p = ruPunto(r, fr), q = ruPunto(r, Math.min(1, fr + 0.002)), [a, c] = P(p[0], p[1]), [a2, c2] = P(q[0], q[1]), an = Math.atan2(c2 - c, a2 - a);
      x.save(); x.translate(a, c); x.rotate(an); x.beginPath(); x.moveTo(5, 0); x.lineTo(-4, -4); x.lineTo(-4, 4); x.closePath(); x.fill(); x.restore();}
    const mk = (p, col, t) => {const [a, c] = P(p[0], p[1]); x.fillStyle = col; x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.arc(a, c, 9, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.font = 'bold 10px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, a, c + .5);};
    if (!r.circ) mk(L[L.length - 1], '#d32f2f', 'F');
    mk(L[0], '#2e9e4f', r.circ ? '⟳' : 'S');
    if (RU.pt) {const [a, c] = P(RU.pt[0], RU.pt[1]); x.fillStyle = '#ffeb3b'; x.strokeStyle = '#222'; x.lineWidth = 2; x.beginPath(); x.arc(a, c, 7, 0, 7); x.fill(); x.stroke();}
  }, (px, py, M) => {   // tocar la ruta en el mapa: se marca ese punto también en el perfil
    const L = r.lin; let best = -1, bd = 24;
    L.forEach((p, i) => {const [a, c] = M.P(p[0], p[1]), d = Math.hypot(a - px, c - py); if (d < bd) {bd = d; best = i;}});
    if (best >= 0) ruCursor(r, RU.cum[best] / RU.cum[RU.cum.length - 1]);
  });
  M.wms = RU_WMS[RU.base]; RU.map = M;
  const la = r.lin.map(p => p[0]), lo = r.lin.map(p => p[1]);
  M.fit(Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo));
  const $ = id => document.getElementById(id);
  $('ruIn').onclick = () => M.zoom(1.6); $('ruOut').onclick = () => M.zoom(1 / 1.6);
  $('ruAll').onclick = () => M.fit(Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo));
}

// ---------- perfil que se sigue con el dedo ----------
const RU_PF = {W: 360, H: 150, L: 36};
function ruPerfil(r) {
  const p = r.pf, {W, H, L} = RU_PF, mn = Math.min(...p), mx = Math.max(...p), rg = Math.max(40, mx - mn), y0 = mn - rg * .08, y1 = mx + rg * .12;
  const X = i => L + i / (p.length - 1) * (W - L), Y = e => H - (e - y0) / (y1 - y0) * H, col = RU_DIF[r.dif];
  const pl = p.map((e, i) => X(i).toFixed(1) + ',' + Y(e).toFixed(1)).join(' ');
  const st = [25, 50, 100, 200, 250, 500].find(v => rg / v <= 4) || 1000; let gr = '';
  for (let e = Math.ceil(y0 / st) * st; e <= y1; e += st) gr += `<line x1="${L}" x2="${W}" y1="${Y(e).toFixed(1)}" y2="${Y(e).toFixed(1)}" stroke="currentColor" stroke-opacity=".12"/><text x="${L - 4}" y="${(Y(e) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity=".6">${e}</text>`;
  const ks = r.km <= 4 ? 1 : r.km <= 10 ? 2 : r.km <= 25 ? 5 : r.km <= 60 ? 10 : 20;
  for (let k = 0; k <= r.km + 1e-9; k += ks) gr += `<text x="${(L + k / r.km * (W - L)).toFixed(1)}" y="${H + 13}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity=".6">${k}${k ? '' : ' km'}</text>`;
  RU_PF.y = Y;
  return `<svg id="ruPf" viewBox="0 0 ${W} ${H + 17}" style="width:100%;touch-action:none;display:block;margin-top:6px;color:var(--txt)">
   <defs><linearGradient id="ruGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity=".05"/></linearGradient></defs>${gr}
   <polygon points="${L},${H} ${pl} ${W},${H}" fill="url(#ruGr)"/><polyline points="${pl}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>
   <line id="ruPfC" x1="0" x2="0" y1="0" y2="${H}" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" visibility="hidden"/>
   <circle id="ruPfD" r="5" fill="#ffeb3b" stroke="#222" stroke-width="1.5" visibility="hidden"/>
   <g id="ruPfB" visibility="hidden"><rect id="ruPfR" rx="5" height="18" fill="#222" fill-opacity=".82"/><text id="ruPfX" font-size="11" font-weight="700" fill="#fff" y="13"></text></g></svg>`;
}
function ruCursor(r, fr) {
  const p = r.pf, n = p.length, {W, L} = RU_PF, i = Math.round(Math.max(0, Math.min(1, fr)) * (n - 1)), cx = L + i / (n - 1) * (W - L), cy = RU_PF.y(p[i]);
  const C = document.getElementById('ruPfC'), D = document.getElementById('ruPfD'); if (!C) return;
  C.setAttribute('x1', cx); C.setAttribute('x2', cx); C.setAttribute('visibility', 'visible'); D.setAttribute('cx', cx); D.setAttribute('cy', cy); D.setAttribute('visibility', 'visible');
  // burbuja con la altitud encima del punto
  const tx = `${p[i]} m`, bw = tx.length * 6.6 + 10, bx = Math.max(L, Math.min(W - bw, cx - bw / 2)), by = Math.max(0, cy - 26);
  const B = document.getElementById('ruPfB'); document.getElementById('ruPfR').setAttribute('width', bw); document.getElementById('ruPfX').textContent = tx;
  document.getElementById('ruPfX').setAttribute('x', 5); B.setAttribute('transform', `translate(${bx.toFixed(1)},${by.toFixed(1)})`); B.setAttribute('visibility', 'visible');
  const dk = r.km / (n - 1) * 1000, a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), g = (p[b] - p[a]) / ((b - a) * dk) * 100;
  document.getElementById('ruPfT').innerHTML = `📍 Km <b>${ruF(i / (n - 1) * r.km)}</b> de ${ruF(r.km)} · altitud <b>${p[i]} m</b> · pendiente <b>${g > 0 ? '+' : ''}${Math.round(g)} %</b>`;
  RU.pt = ruPunto(r, i / (n - 1)); if (RU.map) RU.map.draw();
}
function ruPerfilTouch(r) {
  const sv = document.getElementById('ruPf'); if (!sv) return; const {W, L} = RU_PF;
  const mv = e => {const b = sv.getBoundingClientRect(), xv = (e.clientX - b.left) / b.width * W; ruCursor(r, (xv - L) / (W - L));};
  sv.addEventListener('pointerdown', e => {sv.setPointerCapture(e.pointerId); mv(e);});
  sv.addEventListener('pointermove', e => {if (e.buttons || e.pointerType === 'touch') mv(e);});
}

// ---------- descarga GPX (con las alturas del perfil) ----------
function ruGpx(r) {
  const L = r.lin, tot = RU.cum[RU.cum.length - 1], p = r.pf, n = p.length;
  const ele = i => {const f = tot ? RU.cum[i] / tot * (n - 1) : 0, a = Math.floor(f), b = Math.min(n - 1, a + 1); return Math.round(p[a] + (p[b] - p[a]) * (f - a));};
  const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="BasatiNA (basatina.es)" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${x(r.n)}</name><desc>${x((r.fuente || []).join(' · '))}</desc></metadata>\n`
    + `<wpt lat="${L[0][0]}" lon="${L[0][1]}"><ele>${ele(0)}</ele><name>Salida</name></wpt>\n`
    + (r.circ ? '' : `<wpt lat="${L[L.length - 1][0]}" lon="${L[L.length - 1][1]}"><ele>${ele(L.length - 1)}</ele><name>Llegada</name></wpt>\n`)
    + `<trk><name>${x(r.n)}</name><trkseg>\n${L.map((q, i) => `<trkpt lat="${q[0]}" lon="${q[1]}"><ele>${ele(i)}</ele></trkpt>`).join('\n')}\n</trkseg></trk>\n</gpx>\n`;
  const nom = SV_N(r.n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.gpx';
  if (APP && window.AndroidNet.shareFile) {window.AndroidNet.shareFile(nom, btoa(unescape(encodeURIComponent(gpx))), 'application/gpx+xml'); return;}
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([gpx], {type: 'application/gpx+xml'})); a.download = nom; document.body.appendChild(a); a.click();
  setTimeout(() => {URL.revokeObjectURL(a.href); a.remove();}, 1000);
}

// ---------- el tiempo en el recorrido: salida, punto más alto y llegada ----------
async function ruTiempo(r) {
  const el = document.getElementById('ruTiempo'); if (!el) return;
  const L = r.lin, k = r.pf.indexOf(r.mx), cima = ruPunto(r, k / (r.pf.length - 1));
  const P = [['🟢 Salida · ' + r.pueblo, L[0], r.pf[0]]];
  if (k > 2 && k < r.pf.length - 3 && r.mx - Math.max(r.pf[0], r.pf[r.pf.length - 1]) > 80) P.push(['⛰️ Punto más alto', cima, r.mx]);
  if (!r.circ && ruKm(L[0], L[L.length - 1]) > 2) P.push(['🏁 Llegada · ' + r.fin, L[L.length - 1], r.pf[r.pf.length - 1]]);
  const J = await Promise.all(P.map(([, q, alt]) => getJSON(`${OM}?latitude=${q[0].toFixed(4)}&longitude=${q[1].toFixed(4)}&elevation=${alt}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=4${TZ}`)));
  if (RU.sel !== r || !document.getElementById('ruTiempo')) return;
  if (J.every(j => !j || !j.daily)) {el.innerHTML = '<b>🌦️ El tiempo en el recorrido</b><div class="note">No se pudo cargar la previsión ahora.</div>'; return;}
  const h = new Date().getHours();
  el.innerHTML = '<b>🌦️ El tiempo en el recorrido</b>' + P.map(([t, , alt], n) => {const j = J[n]; if (!j || !j.daily) return ''; const d = j.daily;
    return `<div style="margin-top:8px;font-size:13.5px;color:var(--txt)"><b>${ruE(t)}</b> <span class="note">(${alt} m) · ahora ${wxIcon(j.current.weather_code, h)} ${Math.round(j.current.temperature_2m)}°</span></div>
     <div class="ruWx">${d.time.map((x, i) => {const dt = new Date(x + 'T12:00'); return `<div><b>${i ? DOW[dt.getDay()] + ' ' + dt.getDate() : 'Hoy'}</b><span class="i">${wxIcon(d.weather_code[i], 12)}</span>
      <b>${Math.round(d.temperature_2m_max[i])}°</b> <span class="note">${Math.round(d.temperature_2m_min[i])}°</span><br><span class="note">${d.precipitation_sum[i] > 0.1 ? '💧' + ruF(d.precipitation_sum[i]) + ' mm' : '☀️ seco'}</span><br><span class="note">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h</span></div>`;}).join('')}</div>`;}).join('')
    + '<div class="note">Previsión de Open-Meteo para la altitud de cada punto.</div>';
}

window.addEventListener('popstate', e => {if (RU.sel && !(e.state && e.state.ruta)) ruCerrar();});
