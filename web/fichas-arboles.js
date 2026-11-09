// BasatiNA · Fichas de flora (árboles → arbustos → flores)
// Pantalla independiente. Los datos están en fichas-plantas-datos.js (window.BNA_FICHAS_PLANTAS).
// Solo dibujos esquemáticos de hojas (SVG), sin fotografías ni mapas.
(()=>{'use strict';
const ID='fichas-arboles';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const G='#729b58',L='#42633a',T='#544a39';
// ---- Dibujos esquemáticos de hojas (plantillas por tipo) ----
const leaf={
lobulada:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M100 235C80 247 63 233 74 217C40 219 35 196 62 183C27 177 29 150 60 146C32 126 46 105 73 110C57 85 77 67 97 82C88 53 107 34 118 22C136 41 147 62 134 83C164 69 179 89 161 110C193 109 200 135 171 147C205 157 199 183 170 183C194 204 177 225 151 217C161 241 136 250 119 235L119 257L107 257Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M113 245L117 45M115 113L83 94M115 143L70 125M115 174L70 164M114 204L79 200M117 112L150 93M117 142L165 126M116 173L170 163M115 204L158 199"/>`,
dentada:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M115 25L124 38L131 36L136 52L144 52L146 70L154 72L153 91L161 95L157 113L164 119L157 136L162 143L153 157L156 166L144 178L145 187L132 197L131 206L118 213L117 245L110 245L108 213L95 206L94 197L81 187L82 178L70 166L73 157L64 143L69 136L62 119L69 113L65 95L73 91L72 72L80 70L82 52L90 52L95 36L102 38Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M113 240L114 35M114 80L90 62M114 80L138 62M114 115L80 95M114 115L148 95M114 150L82 133M114 150L146 133M114 182L90 170M114 182L138 170"/>`,
entera:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M114 25C160 60 170 140 120 215L118 248L110 248L108 215C58 140 68 60 114 25Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M114 245L114 40M114 90L92 70M114 90L136 70M114 130L84 108M114 130L144 108M114 170L90 150M114 170L138 150"/>`,
lanceolada:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M114 18C134 70 136 150 117 225L116 252L111 252L110 225C92 150 94 70 114 18Z"/><path fill="none" stroke="${L}" stroke-width="2.5" d="M113 248L114 30M114 80L104 66M114 80L124 66M114 120L102 104M114 120L126 104M114 160L103 146M114 160L125 146M114 195L106 184M114 195L122 184"/>`,
cordada:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M112 215C60 200 28 150 38 110C46 78 80 70 112 95C120 60 140 40 150 30C150 60 160 70 178 92C196 130 175 190 116 215L118 250L110 250Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M113 245L114 100L146 42M114 140L62 110M114 140L170 112M114 175L72 160M114 175L160 162"/>`,
palmeada:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M112 205L60 200L22 160L58 150L28 100L78 108L84 50L112 90L140 50L146 108L196 100L166 150L202 160L164 200Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M112 250L112 190M112 190L112 92M112 190L80 110M112 190L144 110M112 190L45 157M112 190L180 157"/>`,
pinnada:`<path fill="none" stroke="${L}" stroke-width="4" d="M114 252L114 22"/>${[50,85,120,155,190].map(y=>`<ellipse cx="88" cy="${y}" rx="24" ry="11" transform="rotate(-20 88 ${y})" fill="${G}" stroke="${T}" stroke-width="2.5"/><ellipse cx="140" cy="${y}" rx="24" ry="11" transform="rotate(20 140 ${y})" fill="${G}" stroke="${T}" stroke-width="2.5"/>`).join('')}<ellipse cx="114" cy="24" rx="11" ry="22" fill="${G}" stroke="${T}" stroke-width="2.5"/>`,
palmaticompuesta:`<path fill="none" stroke="${L}" stroke-width="4" d="M114 252L114 170"/>${[-70,-35,0,35,70].map(a=>`<ellipse cx="114" cy="110" rx="17" ry="58" transform="rotate(${a} 114 170)" fill="${G}" stroke="${T}" stroke-width="2.5"/>`).join('')}`,
acicula:`<path fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round" d="M114 252L114 225"/><path fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round" d="M112 228C100 170 92 100 84 25M116 228C128 170 136 100 144 25"/>`,
aguja:`<path fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round" d="M114 252L114 25"/>${[40,62,84,106,128,150,172,194,216].map(y=>`<path fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round" d="M110 ${y}L72 ${y-10}M118 ${y}L156 ${y-10}"/>`).join('')}`,
escama:`<path fill="none" stroke="${T}" stroke-width="5" d="M114 252L114 30M114 200L70 150M114 160L156 110M114 120L80 75"/>${[[114,40],[114,70],[114,100],[114,130],[114,160],[114,190],[78,82],[90,100],[146,118],[134,135],[76,155],[92,172]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="10" ry="16" fill="${G}" stroke="${T}" stroke-width="2"/>`).join('')}`,
espinosa:`<path fill="${G}" stroke="${T}" stroke-width="3" stroke-linejoin="round" d="M114 25L128 50L150 45L146 75L170 85L150 105L172 125L146 135L160 162L132 162L130 192L114 205L98 192L96 162L68 162L82 135L56 125L78 105L58 85L82 75L78 45L100 50Z"/><path fill="none" stroke="${L}" stroke-width="3" d="M114 250L114 205L114 40"/>`
};
const svg=t=>`<svg viewBox="0 0 228 270" role="img" aria-label="Dibujo esquemático del tipo de hoja" style="display:block;width:100%;max-width:170px;margin:0 auto;background:#fff;border-radius:8px">${leaf[t]||leaf.entera}</svg>`;
// ---- Pantalla ----
let D=null,cat='arboles',q='',ori='',hoja='';
const CATS=[['arboles','Árboles'],['arbustos','Arbustos'],['flores','Flores']];
function card(f){
 const rows=[['Cómo reconocerlo',f.reconocer],['Porte y tamaño',f.porte],['Hojas',f.hoja],['Flores',f.flores],['Floración',f.floracion],['Fruto',f.fruto],['Hábitat',f.habitat],['En Navarra',f.navarra],['Especies parecidas',f.parecidas]].filter(r=>r[1]);
 return `<details class="card" style="margin:8px 0"><summary style="cursor:pointer"><b>${esc(f.nombre)}</b> · <i>${esc(f.cientifico)}</i><br><small>${esc(f.familia)} · ${esc(f.origen)}${f.caduca?(' · '+esc(f.caduca)):''}</small></summary>
 ${f.otros?`<p><small>También: ${esc(f.otros)}${f.eusk?(' · Euskera: '+esc(f.eusk)):''}</small></p>`:(f.eusk?`<p><small>Euskera: ${esc(f.eusk)}</small></p>`:'')}
 ${svg(f.dibujo)}<p class="note" style="text-align:center"><small>Dibujo esquemático del tipo de hoja (${esc(f.dibujoTxt||f.dibujo)}). Orientativo: no es una clave de identificación.</small></p>
 <dl>${rows.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>
 <p><small>Fuentes: ${(f.fuentes||[]).map(s=>`<a href="${esc(s[1])}" target="_blank" rel="noopener noreferrer">${esc(s[0])}</a>`).join(' · ')}</small></p></details>`;}
function render(){
 const s=document.getElementById('t-'+ID);if(!s)return;
 if(!D){s.innerHTML='<h2>🌿 Fichas de flora</h2><p>Cargando fichas…</p>';return;}
 const all=D.fichas.filter(f=>f.categoria===cat);
 const L=all.filter(f=>(!ori||f.origenClave===ori)&&(!hoja||f.caduca===hoja)&&(!q||norm([f.nombre,f.cientifico,f.otros,f.eusk,f.familia,f.habitat,f.navarra].join(' ')).includes(norm(q)))).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
 const fase=(D.fases||{})[cat]||{};
 s.innerHTML=`<h2>🌿 Fichas de flora</h2>
 <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${CATS.map(([k,n])=>{const c=D.fichas.filter(f=>f.categoria===k).length;return `<button type="button" data-cat="${k}" style="padding:6px 10px;border-radius:16px;border:1px solid #42633a;background:${k===cat?'#42633a':'#fff'};color:${k===cat?'#fff':'#253525'}">${n} (${c})</button>`;}).join('')}</div>
 <p><small>${esc(fase.texto||'')}</small></p>
 ${all.length?`<input id="fpQ" type="search" placeholder="Buscar por nombre, familia o hábitat" value="${esc(q)}" style="width:100%;padding:8px;box-sizing:border-box">
 <div style="display:flex;gap:6px;margin:6px 0"><select id="fpO" style="flex:1"><option value="">Todos los orígenes</option><option value="autoctona"${ori==='autoctona'?' selected':''}>Autóctonas</option><option value="introducida"${ori==='introducida'?' selected':''}>Introducidas o naturalizadas</option><option value="cultivada"${ori==='cultivada'?' selected':''}>Cultivadas u ornamentales</option></select>
 <select id="fpH" style="flex:1"><option value="">Hoja caduca y perenne</option><option value="Hoja caduca"${hoja==='Hoja caduca'?' selected':''}>Hoja caduca</option><option value="Hoja perenne"${hoja==='Hoja perenne'?' selected':''}>Hoja perenne</option></select></div>
 <p><small>${L.length} de ${all.length} fichas. Toca una para abrirla.</small></p>${L.map(card).join('')}`:'<p>Esta fase todavía está en preparación. Las fichas aparecerán aquí cuando estén documentadas.</p>'}
 <p class="note"><small>${esc(D.nota||'')}</small></p>`;
 s.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;q='';ori='';hoja='';render();});
 const i=s.querySelector('#fpQ');if(i)i.oninput=()=>{q=i.value;const p=i.selectionStart;render();const j=document.getElementById('fpQ');j.focus();j.setSelectionRange(p,p);};
 const o=s.querySelector('#fpO');if(o)o.onchange=()=>{ori=o.value;render();};
 const h=s.querySelector('#fpH');if(h)h.onchange=()=>{hoja=h.value;render();};}
function load(){if(D||window.BNA_FICHAS_PLANTAS){D=D||window.BNA_FICHAS_PLANTAS;render();return;}
 const sc=document.createElement('script');sc.src='fichas-plantas-datos.js?v='+Date.now();sc.onload=()=>{D=window.BNA_FICHAS_PLANTAS||{fichas:[]};render();};
 sc.onerror=()=>{const s=document.getElementById('t-'+ID);if(s)s.innerHTML='<h2>🌿 Fichas de flora</h2><p>No se han podido cargar las fichas. Desliza hacia abajo para reintentar.</p>';};document.body.appendChild(sc);}
const run=()=>{if(document.getElementById('t-'+ID))return true;const b=[...document.querySelectorAll('#drawer button')].find(x=>x.textContent.trim().endsWith('Identificar plantas o aves'));const w=document.querySelector('.wrap');if(!b||!w)return false;
 const s=document.createElement('section');s.id='t-'+ID;s.style.display='none';w.appendChild(s);
 const n=document.createElement('button');n.type='button';n.dataset.t=ID;n.textContent='🌿 Fichas de flora';
 n.onclick=()=>{if(typeof showTab==='function'){showTab(ID);s.style.display='block';}if(typeof menu==='function')menu(false);render();load();};
 b.parentElement.appendChild(n);if(typeof TITLES!=='undefined')TITLES[ID]='🌿 Fichas de flora';return true;};
if(run())return;const o=new MutationObserver(()=>{if(run())o.disconnect();});o.observe(document.body,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000);
})();
