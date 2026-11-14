/* =====================================================================
   🧩 MEJORAS · 14 nov. 2026 (se carga el último, después de rutas-ui.js)
   1. 🌙 La Luna y el campo (grupo El tiempo): fases, luna ascendente/descendente, calendario
      lunar tradicional de la huerta y qué hacer cada mes.
   2. Vida silvestre: la ficha se abre DEBAJO del nombre tocado y se cierra al cambiar de pestaña.
      Pestaña nueva 🌸 Flores (datos en FL_D) con cuidados y si van bien en cada zona de Navarra.
   3. 🍲 Cocina tradicional (grupo Turismo): recetas completas (CO_R) y productos típicos.
      «Dónde comer» se queda solo con los restaurantes.
   4. Ríos: en la web (navegador) solo sale un aviso «disponible en la app».
   5. 🛒 Supermercados y mercados (grupo Servicios): web/tiendas.js (robot tools/tiendas.py).
   6. Deporte: ⭐ equipos y ligas favoritos y ➕ añadir partidos a «⭐ Mi calendario deportivo»
      (grupo Mi Espacio). Todo se guarda solo en el dispositivo (dpFav, dpMios).
   7. 🧸 Para los peques (grupo Qué hacer): sitios para ir con niños, parques infantiles,
      rutas fáciles y agenda infantil.
   ===================================================================== */
(function(){
const $=id=>document.getElementById(id);
const N=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const dsub=g=>typeof svDsub==='function'?svDsub(g):null;
function btnAfter(sub,afterT,t,label){if(!sub)return;const b=document.createElement('button');b.dataset.t=t;b.textContent=label;b.onclick=()=>{showTab(t);menu(false);};
  const a=afterT&&sub.querySelector(`button[data-t="${afterT}"]`);if(a)a.after(b);else sub.appendChild(b);}
// lleva una fila arriba de la pantalla dejando sitio a la barra superior
function verFila(el){if(!el)return;setTimeout(()=>{const y=el.getBoundingClientRect().top+window.scrollY-96;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});},40);}
const go=u=>{try{if(typeof foOpenUrl==='function')return foOpenUrl(u);}catch(e){}window.open(u,'_blank');};

/* =====================================================================
   1. 🌙 LA LUNA Y EL CAMPO
   ===================================================================== */
// posición aproximada de la Luna (precisión de ~1°, suficiente para saber si sube o baja)
function lcDecl(d){const R=Math.PI/180,D=d.getTime()/864e5-10957.5,L=218.316+13.176396*D,M=(134.963+13.064993*D)*R,F=(93.272+13.229350*D)*R;
  const lam=(L+6.289*Math.sin(M))*R,bet=5.128*Math.sin(F)*R,e=23.44*R;
  return Math.asin(Math.sin(bet)*Math.cos(e)+Math.cos(bet)*Math.sin(e)*Math.sin(lam))/R;}
const lcSube=d=>lcDecl(new Date(d.getTime()+864e5))>lcDecl(d);
// fase del día: 0 nueva … 3 menguante (con las fechas exactas de asFases si existen)
function lcFaseDia(f){const m=moon(new Date(f+'T12:00')),k=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'].indexOf(m.ico);
  const cre=k>=1&&k<=3,men=k>=5;return {m,cre,men,nueva:k===0,llena:k===4};}
const LC_FASE=[
  ['🌑','Luna nueva','Descanso en la huerta según la tradición: no se siembra ni se poda. Buen momento para limpiar, quitar malas hierbas y preparar la tierra.'],
  ['🌒','Luna creciente','La savia «sube». La tradición aconseja sembrar y trasplantar lo que da fruto o se come por encima de la tierra (tomate, pimiento, judía, lechuga, flores), hacer injertos y esquejes y cortar el césped para que crezca rápido.'],
  ['🌕','Luna llena','Según la tradición, buen momento para recoger frutos jugosos y plantas aromáticas y medicinales (dicen que tienen más jugo y aroma). No se aconseja podar.'],
  ['🌘','Luna menguante','La savia «baja». Es la luna tradicional para sembrar lo que crece bajo tierra (patata, ajo, cebolla, zanahoria, remolacha), podar, cortar leña y madera («En menguante de enero corta tu madero»), cosechar para guardar, embotellar el vino y abonar.']];
const LC_MES=[
  ['Enero','Poda de frutales y vid en reposo (mejor en menguante, según la tradición). Plantar ajos en la Ribera y la Zona Media. Semilleros protegidos de lechuga y cebolla. Recoger cardo, coles y puerros.'],
  ['Febrero','Siembra de habas y guisantes; plantar ajos. A final de mes, semillero de tomate y pimiento dentro de casa o en invernadero. Acabar la poda.'],
  ['Marzo','Siembra de zanahoria, rabanito, espinaca, acelga y lechuga. Plantar cebolla y, al final del mes, las primeras patatas (antes en la Ribera, más tarde en la Montaña).'],
  ['Abril','Plantar patata. Semillero de calabacín, pepino y calabaza. Trasplantar lechugas. Ojo con las heladas tardías: aún no saques el tomate en la Cuenca de Pamplona ni en la Montaña.'],
  ['Mayo','Trasplantar tomate, pimiento, berenjena y calabacín cuando ya no hiele (en la Cuenca, mejor a partir de mediados de mayo). Siembra de judía y maíz. Recoger habas y guisantes.'],
  ['Junio','Siembras escalonadas de lechuga y judía. Trasplantar puerros. Recoger ajos (se guardan mejor recogidos en menguante, dice la tradición). Empezar el riego regular.'],
  ['Julio','Riego por la mañana temprano o al atardecer. Semillero de coles y brócoli para el invierno. Recoger tomate, calabacín, judía verde y pepino.'],
  ['Agosto','Siembra de escarola, lechuga de otoño y espinaca. Trasplantar coles. En la Ribera empieza la cosecha del pimiento del piquillo, que sigue hasta octubre.'],
  ['Septiembre','Siembra de espinaca, rabanito y canónigos. Plantar fresas. Recoger pimientos, tomates y calabazas. Preparar conservas (mejor en menguante, según la tradición).'],
  ['Octubre','Plantar ajos y habas (Ribera y Zona Media) y bulbos de flor (tulipán, narciso). Recoger las últimas calabazas. Empezar a aporcar el cardo para blanquearlo.'],
  ['Noviembre','Siembra de habas y guisantes. Plantar árboles frutales y rosales a raíz desnuda. Echar estiércol o compost a la tierra que queda libre. Proteger las alcachofas del frío.'],
  ['Diciembre','Poda en reposo los días sin helada. Recoger cardo, coles, puerros y escarolas. Repasar herramientas y preparar el plan de la huerta para la primavera.']];
let LCM=null,LCS=null;
function lcRender(){const el=$('lcBody');if(!el)return;const hoy=hoyYmd();if(!LCM)LCM=hoy.slice(0,7);if(!LCS)LCS=hoy;
  const H=lcFaseDia(LCS),sube=lcSube(new Date(LCS+'T12:00')),fi=H.nueva?0:H.llena?2:H.cre?1:3,F=LC_FASE[fi];
  const [y,m]=LCM.split('-').map(Number),d1=new Date(y,m-1,1),nd=new Date(y,m,0).getDate(),off=(d1.getDay()+6)%7;
  // fases exactas del mes (Meeus) si están las funciones de 🔭 Cielo
  let FX=[];try{FX=asFases(new Date(y,m-1,1),new Date(y,m,1));}catch(e){}
  const fx={};FX.forEach(f=>{fx[ymd(f.d)]=['🌑','🌓','🌕','🌗'][f.q];});
  let g='';for(let i=0;i<off;i++)g+='<div></div>';
  for(let d=1;d<=nd;d++){const f=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,x=lcFaseDia(f),c=x.nueva||x.llena?'#5e35b1':x.cre?'#2e7d32':'#8d6e63';
    g+=`<button class="calD${f===hoy?' hoy':''}${f===LCS?' sel':''}" data-f="${f}" style="line-height:1.1;box-shadow:inset 0 -4px 0 ${c}">${d}<span style="display:block;font-size:13px">${fx[f]||x.m.ico}</span></button>`;}
  el.innerHTML=`<div class="card"><div style="display:flex;gap:12px;align-items:center"><div style="font-size:52px;line-height:1">${H.m.ico}</div>
     <div><b style="font-size:17px">${F[1]}</b><div class="note">${cap1(fLarga(LCS))} · ${H.m.ill} % iluminada</div><div class="note">${sube?'⬆️ Luna <b>ascendente</b>':'⬇️ Luna <b>descendente</b>'}</div></div></div>
     <div style="margin-top:8px;line-height:1.5">${F[2]}</div>
     <div class="note" style="margin-top:6px;line-height:1.5">${sube?'⬆️ <b>Ascendente</b>: la tradición dice que es buena para recoger frutas y verduras de hoja, coger esquejes e injertar.':'⬇️ <b>Descendente</b>: la tradición dice que es buena para plantar, trasplantar, podar y abonar, porque la savia baja hacia la raíz.'}</div></div>
   <div class="card"><div class="row" style="justify-content:space-between;align-items:center"><button class="btn" id="lcP">‹</button><b>${cap1(d1.toLocaleDateString('es-ES',{month:'long',year:'numeric'}))}</b><button class="btn" id="lcN">›</button></div>
     <div class="calG calH">${['L','M','X','J','V','S','D'].map(x=>`<div>${x}</div>`).join('')}</div><div class="calG">${g}</div>
     <div class="note" style="margin-top:6px"><b style="color:#2e7d32">━</b> creciente · <b style="color:#8d6e63">━</b> menguante · <b style="color:#5e35b1">━</b> luna nueva o llena. Toca un día para ver qué toca hacer.</div>
     ${FX.length?`<div class="note" style="margin-top:4px">${FX.map(f=>`${['🌑 Nueva','🌓 Cuarto creciente','🌕 Llena','🌗 Cuarto menguante'][f.q]}: ${f.d.getDate()} a las ${f.d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`).join(' · ')}</div>`:''}</div>
   <div class="card"><b>🧑‍🌾 En la huerta en ${LC_MES[m-1][0].toLowerCase()}</b><div style="margin-top:6px;line-height:1.5">${LC_MES[m-1][1]}</div>
     <div class="note" style="margin-top:6px">Orientativo para la Zona Media y la Cuenca de Pamplona. En la Ribera se puede adelantar 2 o 3 semanas y en la Montaña hay que retrasarlo otro tanto.</div></div>
   <div class="card"><b>🌕 ¿Cómo nos afecta la Luna?</b>
     ${avDet('<b>🌊 Las mareas: sí, seguro</b>','La atracción de la Luna (y del Sol) mueve el agua de los océanos. Es su efecto más claro sobre la Tierra.')}
     ${avDet('<b>🌱 La huerta: tradición, no ciencia</b>','El calendario lunar de siembra es un saber popular de muchas generaciones de agricultores. Los estudios científicos no han encontrado que la fase de la Luna cambie de forma clara cómo crecen las plantas: pesan mucho más la temperatura, el agua, el sol y la tierra. Si te gusta seguirlo, adelante: no hace daño.')}
     ${avDet('<b>🌙 El sueño</b>','Algún estudio ha encontrado que con luna llena se duerme un poco peor, pero otros no lo han confirmado. Puede influir la luz de la noche si duermes con la ventana abierta.')}
     ${avDet('<b>🌲 La madera</b>','Es tradición cortar la madera en menguante de invierno para que dure más y no se carcoma («En menguante de enero corta tu madero»). Lo que sí está claro es que la madera cortada en invierno, con poca savia, seca mejor.')}
     ${avDet('<b>🍂 Refranes</b>','«Luna de octubre, siete lunas cubre» (el tiempo de la luna de octubre se repetiría siete meses) · «En menguante de enero corta tu madero» · «Si quieres buen ajo, plántalo en enero».')}</div>
   <div class="note">Fases de la Luna calculadas con los métodos de J. Meeus. La luna ascendente/descendente es un cálculo aproximado. Los consejos de siembra son de la tradición popular, no recomendaciones científicas.</div>`;
  el.querySelectorAll('.calD').forEach(b=>b.onclick=()=>{LCS=b.dataset.f;lcRender();});
  $('lcP').onclick=()=>{const d=new Date(y,m-2,1);LCM=ymd(d).slice(0,7);LCS=LCM+'-01';lcRender();};
  $('lcN').onclick=()=>{const d=new Date(y,m,1);LCM=ymd(d).slice(0,7);LCS=LCM+'-01';lcRender();};}
svSec('lunacampo',`<div class="card"><b>🌙 La Luna y el campo</b><div class="note">El calendario lunar que se ha usado siempre en la huerta y en el monte: qué toca sembrar, plantar, podar o recoger según la Luna, y qué hacer cada mes en Navarra.</div></div><div id="lcBody"></div>`);
svHook('lunacampo',()=>{LCM=null;LCS=null;lcRender();});

/* =====================================================================
   2. VIDA SILVESTRE: fichas debajo del nombre · 🌸 Flores
   ===================================================================== */
let BIROW=null;
const biBox=$('biFicha'),biHome=biBox&&biBox.parentNode,biNext=$('biList');
function biBack(){if(!biBox||!biHome)return;biBox.style.margin='';if(biBox.parentNode!==biHome||biBox.nextSibling!==biNext)biHome.insertBefore(biBox,biNext);}
if(typeof biFicha==='function'&&biBox){
  const _bf=biFicha;
  biFicha=function(o){
    // tocar otra vez el mismo nombre la cierra
    if(o&&BISEL===o&&biBox.style.display!=='none'&&BIROW&&biBox.previousElementSibling===BIROW){_bf(null);BIROW=null;biBack();return;}
    _bf(o);
    if(!o){BIROW=null;biBack();return;}
    if(BIROW&&BIROW.isConnected){BIROW.after(biBox);biBox.style.margin='4px 0 10px';biBox.style.border='2px solid #43a047';
      verFila(BIROW);}};
  const _br=biRender;
  biRender=function(){BIROW=null;biBack();const r=_br.apply(this,arguments);
    document.querySelectorAll('#biList [data-i]').forEach(d=>d.addEventListener('click',()=>{BIROW=d;},true));return r;};
  // al cambiar de pestaña (Todas, Fauna, Flora, Setas, Arbustos, Flores) se cierra la ficha
  const tp=$('biTp');if(tp)tp.addEventListener('click',e=>{if(e.target.closest('button')){_bf(null);BIROW=null;biBack();}},true);
}

/* ---------- 🌸 FLORES ---------- */
// zonas de Navarra: tmin = mínima de un invierno frío; calor 1 fresco · 3 muy caluroso; seco 0 muy lluvioso · 3 muy seco; suelo caliza = suele ser calizo
const FL_Z=[['pir','🏔️ Pirineo y montaña','Roncal, Salazar, Aezkoa, Irati, Larra',-15,1,1,''],
  ['nor','🌧️ Noroeste húmedo','Baztan, Bidasoa, Malerreka, Leitzaldea, Ultzama',-6,1,0,'acida'],
  ['pam','🏙️ Cuenca de Pamplona y valles','Pamplona, Sakana, Valdizarbe, Lónguida',-9,2,1,'caliza'],
  ['med','🍇 Zona Media y Tierra Estella','Estella, Tafalla, Olite, Sangüesa, Viana',-8,2,2,'caliza'],
  ['rib','☀️ Ribera','Tudela, Bardenas, Peralta, Lodosa, Corella',-9,3,3,'caliza']];
/* [nombre, científico, tipo, meses de flor, luz, riego 1-3, mínima que aguanta (°C), calor 1-3, suelo, cuándo plantar, cuidados, poda, ojo] */
const FL_D=[
 ['Geranio','Pelargonium zonale','Vivaz de maceta',[4,5,6,7,8,9,10],'Sol',2,0,3,'','Primavera, cuando ya no hiela','Riego cuando la tierra esté seca por encima, sin encharcar. Abono para flor cada 15 días en verano. Quita las flores secas.','Al final del invierno, recorta a la mitad.','Plaga: el «taladro del geranio», una mariposita cuya oruga hace agujeros en los tallos. Tóxico leve para perros y gatos.'],
 ['Gitanilla','Pelargonium peltatum','Vivaz colgante',[4,5,6,7,8,9,10],'Sol',2,0,3,'','Primavera','Como el geranio, pero colgante: ideal para balcones y ventanas. No mojes las hojas al regar.','Recorte suave al final del invierno.','Mismo taladro que el geranio.'],
 ['Petunia y surfinia','Petunia × hybrida','Anual',[4,5,6,7,8,9,10],'Sol',3,2,3,'','Abril-mayo','Mucho sol y riego frecuente en verano (las colgantes, a diario). Abono líquido cada semana para que no paren de florecer.','Si se estiran, recórtalas a mitad del verano y rebrotan.',''],
 ['Rosal','Rosa sp.','Arbusto',[5,6,7,8,9,10],'Sol',2,-20,2,'','Noviembre a febrero (a raíz desnuda) o todo el año en maceta','Riego al pie, nunca sobre las hojas. Abono en primavera y tras la primera floración. Quita las rosas pasadas.','Poda fuerte en febrero, dejando 3-5 yemas por tallo.','Pulgón en los brotes, oídio (polvo blanco) y mancha negra en las hojas.'],
 ['Lavanda','Lavandula angustifolia','Arbusto aromático',[6,7,8],'Sol',1,-15,3,'caliza','Otoño o primavera','Aguanta la sequía y le gustan los suelos calizos y pobres. Lo que la mata es el encharcamiento: tierra con buen drenaje.','Después de florecer, recorta las espigas y un poco de follaje, sin llegar a la madera vieja.',''],
 ['Hortensia','Hydrangea macrophylla','Arbusto',[6,7,8,9],'Semisombra',3,-12,1,'acida','Otoño o primavera','Mucho riego y sombra en las horas de calor. En tierra caliza amarillea: usa sustrato para acidófilas y agua de lluvia. En tierra ácida da flores azules; en caliza, rosas.','A finales de invierno, quita solo las flores secas y los tallos muertos (las flores salen de las yemas del año anterior).','Tóxica si se come.'],
 ['Camelia','Camellia japonica','Arbusto',[1,2,3,4],'Semisombra',2,-12,1,'acida','Otoño','Tierra ácida y húmeda, sin sol de mediodía. Florece en invierno: protege los capullos de las heladas fuertes.','Ligera, justo después de florecer.',''],
 ['Azalea y rododendro','Rhododendron sp.','Arbusto',[3,4,5],'Semisombra',3,-15,1,'acida','Otoño','Necesitan tierra ácida, humedad y nada de cal: riega con agua de lluvia. Acolcha el pie con corteza de pino.','Solo quitar flores secas.','Tóxicos para personas y animales.'],
 ['Margarita gigante','Leucanthemum × superbum','Vivaz',[6,7,8],'Sol',2,-20,2,'','Primavera u otoño','Muy agradecida. Divide la mata cada 3 años para que siga floreciendo bien.','Corta los tallos secos al final del verano.',''],
 ['Clavel','Dianthus caryophyllus','Vivaz',[5,6,7,8,9],'Sol',1,-10,2,'caliza','Primavera','Le gusta la tierra caliza, el sol y poco riego. Ponle tutor si se tumba.','Quita las flores pasadas.',''],
 ['Tulipán','Tulipa sp.','Bulbo',[3,4,5],'Sol',2,-25,1,'','Octubre-noviembre (bulbos a 15 cm de hondo)','Necesita el frío del invierno para florecer bien. Después de la flor, deja que la hoja se seque sola.','Corta solo la flor seca.','Tóxico para perros y gatos (sobre todo el bulbo).'],
 ['Narciso','Narcissus sp.','Bulbo',[2,3,4],'Sol o semisombra',2,-25,1,'','Septiembre-noviembre','Muy fácil y se naturaliza en el césped. Deja que las hojas se sequen solas.','Nada.','Tóxico (bulbo y hojas).'],
 ['Jacinto','Hyacinthus orientalis','Bulbo',[3,4],'Sol o semisombra',2,-20,1,'','Octubre-noviembre','Perfume intenso. En maceta, tierra con buen drenaje.','Nada.','El bulbo irrita la piel: usa guantes.'],
 ['Dalia','Dahlia sp.','Tubérculo',[7,8,9,10],'Sol',3,0,2,'','Abril-mayo, cuando ya no hiela','Riego abundante y tutor para las grandes. Donde hiela fuerte, saca los tubérculos en otoño y guárdalos en serrín.','Quita las flores pasadas.','Babosas y caracoles en los brotes.'],
 ['Gladiolo','Gladiolus sp.','Bulbo',[7,8,9],'Sol',2,-5,2,'','Abril-junio (escalonado)','Planta los bulbos cada 2 semanas para tener flor más tiempo. En zonas frías, sácalos en otoño.','Nada.',''],
 ['Lirio','Iris germanica','Vivaz de rizoma',[5,6],'Sol',1,-20,3,'caliza','Julio-septiembre','Aguanta sequía y suelo calizo. El rizoma debe quedar medio enterrado, al sol.','Corta los tallos florales secos.','Tóxico si se come.'],
 ['Peonía','Paeonia lactiflora','Vivaz',[5,6],'Sol',2,-30,1,'','Octubre-noviembre','Vive muchos años sin moverla. Necesita frío en invierno. No la entierres demasiado (yemas a 3-5 cm).','Corta los tallos a ras en otoño.',''],
 ['Girasol','Helianthus annuus','Anual',[7,8,9],'Sol',2,2,3,'','Siembra directa en abril-mayo','Muy fácil, perfecto para niños. Ponle tutor si es de los altos.','Nada.',''],
 ['Caléndula','Calendula officinalis','Anual',[3,4,5,6,9,10,11],'Sol',1,-5,2,'','Siembra en primavera u otoño','Muy rústica, se resiembra sola. Atrae insectos buenos al huerto.','Quita las flores secas.',''],
 ['Clavel de moro','Tagetes sp.','Anual',[6,7,8,9,10],'Sol',1,2,3,'','Mayo','Muy resistente al calor. En la huerta ayuda a alejar algunos nematodos del suelo.','Quita las flores secas.',''],
 ['Begonia','Begonia semperflorens','Anual',[5,6,7,8,9,10],'Semisombra',2,2,2,'','Mayo','Ideal para jardineras a la sombra. Riego moderado: se pudre si se encharca.','Nada.','Tóxica para perros y gatos.'],
 ['Alegría de la casa','Impatiens walleriana','Anual',[5,6,7,8,9],'Sombra',3,5,1,'','Mayo','Para rincones de sombra. Nunca dejes que se seque la tierra.','Nada.',''],
 ['Buganvilla','Bougainvillea sp.','Trepadora',[6,7,8,9,10],'Sol',1,-3,3,'','Primavera','Necesita mucho sol y calor. Fuera de la Ribera, solo en patios muy resguardados o en maceta que se pueda meter en invierno.','A final de invierno, para darle forma.','Espinas.'],
 ['Jazmín','Jasminum officinale','Trepadora',[6,7,8,9],'Sol',2,-10,3,'','Primavera','Perfume de verano. Ponle una celosía o malla para trepar.','Tras la floración, aclara los tallos viejos.',''],
 ['Glicinia','Wisteria sinensis','Trepadora',[4,5],'Sol',2,-20,2,'','Otoño o primavera','Muy vigorosa: necesita un soporte fuerte (pérgola). Tarda unos años en florecer.','Dos podas: en verano recorta los brotes largos y en invierno déjalos con 2-3 yemas.','Semillas y vainas tóxicas.'],
 ['Lilo','Syringa vulgaris','Arbusto',[4,5],'Sol',2,-30,1,'caliza','Otoño','Muy rústico, le va bien la cal y el frío. Flores muy perfumadas.','Justo después de florecer, quita las flores secas.',''],
 ['Romero','Salvia rosmarinus','Arbusto aromático',[1,2,3,4,5,10,11,12],'Sol',1,-12,3,'caliza','Otoño o primavera','Casi no hay que regarlo. Suelo con buen drenaje. Lo visitan mucho las abejas.','Recorte ligero después de la floración.',''],
 ['Salvia arbustiva','Salvia microphylla','Arbusto',[5,6,7,8,9,10,11],'Sol',1,-12,3,'','Primavera','Florece de primavera a otoño y aguanta la sequía. Le encanta a los colibríes… y aquí a las abejas.','Recorte a final de invierno.',''],
 ['Gaura','Gaura lindheimeri','Vivaz',[6,7,8,9,10],'Sol',1,-15,3,'','Primavera','Flores como mariposas todo el verano. Aguanta calor y sequía.','Corta a ras a final de invierno.',''],
 ['Agapanto','Agapanthus sp.','Vivaz',[6,7,8],'Sol',2,-8,3,'','Primavera','Florece mejor con las raíces apretadas (en maceta no la cambies mucho). En zonas frías, protege la base en invierno.','Corta los tallos florales secos.','Tóxico si se come.'],
 ['Azucena de día','Hemerocallis sp.','Vivaz',[6,7,8],'Sol',2,-25,3,'','Primavera u otoño','Casi indestructible. Cada flor dura un día, pero salen muchas.','Quita hojas secas en otoño.','Muy tóxica para los gatos.'],
 ['Ciclamen','Cyclamen persicum','Vivaz de maceta',[10,11,12,1,2,3],'Semisombra',2,2,1,'','Otoño','Flor de invierno para dentro de casa o balcones resguardados. Riega por el plato, sin mojar el centro.','Quita flores y hojas secas tirando desde abajo.','Tóxico (tubérculo).'],
 ['Pensamiento','Viola × wittrockiana','Anual de invierno',[10,11,12,1,2,3,4,5],'Sol',2,-15,1,'','Septiembre-noviembre','La flor del invierno: aguanta heladas y nieve. Las flores son comestibles.','Quita las flores pasadas.',''],
 ['Prímula','Primula vulgaris','Vivaz',[2,3,4],'Semisombra',2,-15,1,'','Otoño','Flor de los primeros días de primavera. Tierra fresca, sin sol fuerte.','Nada.',''],
 ['Crisantemo','Chrysanthemum × morifolium','Vivaz',[9,10,11],'Sol',2,-15,2,'','Primavera','La flor del otoño (y de Todos los Santos). Pinza las puntas hasta julio para que salga más compacto.','Corta los tallos en invierno.','Tóxico para perros y gatos.'],
 ['Verbena','Verbena × hybrida','Vivaz',[5,6,7,8,9,10],'Sol',1,-5,3,'','Primavera','Tapizante para sol y calor; muy buena para jardineras.','Recorte suave a mitad de verano.','Oídio si la riegas por encima.'],
 ['Rosa de Siria','Hibiscus syriacus','Arbusto',[7,8,9],'Sol',2,-20,3,'','Otoño o primavera','Florece en pleno verano, cuando hay pocas flores. Brota tarde en primavera: no lo des por muerto.','Final de invierno.',''],
 ['Adelfa','Nerium oleander','Arbusto',[5,6,7,8,9,10],'Sol',1,-8,3,'','Primavera','Aguanta sol, calor y sequía. Fuera de la Ribera y la Zona Media, mejor en sitio resguardado.','Tras la floración.','⚠️ MUY TÓXICA (toda la planta) para personas y animales. Ojo con niños y mascotas.'],
 ['Cosmos','Cosmos bipinnatus','Anual',[6,7,8,9,10],'Sol',1,2,3,'','Siembra directa en abril-mayo','Muy fácil, florece sin parar y atrae mariposas.','Quita flores secas.',''],
 ['Capuchina','Tropaeolum majus','Anual',[5,6,7,8,9,10],'Sol',1,1,2,'','Siembra en abril-mayo','Hojas y flores comestibles (sabor picante). En la huerta atrae al pulgón y protege otras plantas.','Nada.',''],
 ['Equinácea','Echinacea purpurea','Vivaz',[6,7,8,9],'Sol',1,-30,3,'','Primavera','Muy resistente al frío y la sequía. Deja las flores secas en invierno: los pájaros comen sus semillas.','Corta a ras al final del invierno.',''],
 ['Lantana','Lantana camara','Arbusto',[5,6,7,8,9,10],'Sol',1,-3,3,'','Primavera','Florece todo el verano con mucho calor. En zonas frías, en maceta para resguardarla en invierno.','Poda fuerte a final de invierno.','Tóxica, sobre todo los frutos.']];
// [nivel 0 bien · 1 con cuidados · 2 difícil, motivos]
function flCompat(f,z){const [,,,,luz,riego,tmin,calor,suelo]=f,[, , ,zt,zc,zs,zsu]=z,M=[];let lv=0;const sube=v=>{lv=Math.max(lv,v);};
  const dif=tmin-zt,tp=f[2];
  if(/^Anual$/.test(tp)){M.push('Es de temporada: se planta cuando ya no hiela y dura hasta las primeras heladas del otoño.');if(zc===1&&calor===3){sube(1);M.push('El verano es corto y fresco: florecerá menos.');}}
  else if(/maceta|colgante/.test(tp)&&dif>0){sube(1);M.push(`Es planta de maceta: en invierno métela en casa, en una galería o en un balcón resguardado donde no hiele (aquí puede bajar a ${zt} °C).`);}
  else if(/Bulbo|Tubérculo/.test(tp)&&dif>0){sube(1);M.push(`Los bulbos no aguantan los ${zt} °C de un invierno frío en la tierra: sácalos en otoño y guárdalos en un sitio seco y sin helada hasta la primavera.`);}
  else if(dif>=8){sube(2);M.push(`No aguanta los ${zt} °C que puede hacer en invierno: en maceta y dentro de casa o en un sitio muy resguardado desde noviembre (o como planta de temporada).`);}
  else if(dif>0){sube(1);M.push(`Las heladas fuertes (hasta ${zt} °C) le pueden hacer daño: acolcha el pie, cúbrela con manta térmica las noches de helada o ponla junto a una pared al sur.`);}
  if(calor===1&&zc===3){sube(1);M.push('Sufre con el calor del verano: ponla en semisombra y riégala a menudo.');}
  if(calor===3&&zc===1&&!/^Anual$/.test(tp)){sube(1);M.push('Le falta calor: florecerá menos. Busca el sitio más soleado y resguardado.');}
  if(suelo==='acida'&&zsu==='caliza'){sube(1);M.push('Pide tierra ácida y aquí suele ser caliza: plántala en maceta o en un hoyo grande con sustrato para acidófilas y riégala con agua de lluvia.');}
  if(suelo==='acida'&&zsu===''){M.push('Mejor con tierra ácida (sustrato para acidófilas).');}
  if(riego===3&&zs>=3){sube(1);M.push('Necesita mucho riego en el verano seco de la zona.');}
  if(riego===1&&zs===0){sube(1);M.push('No le gusta la humedad constante: tierra con muy buen drenaje (mezcla arena o grava) y sin plato con agua.');}
  if(suelo==='caliza'&&zsu==='acida')M.push('Prefiere tierra caliza: un poco de cal o ceniza en el hoyo le vendrá bien.');
  return [lv,M];}
const FL_LV=[['✅','Va bien','#2e7d32'],['⚠️','Con cuidados','#ef6c00'],['❌','Difícil','#c62828']];
let FLZ=(()=>{try{return localStorage.getItem('flZona')||'pam';}catch(e){return 'pam';}})(),FLQ='',FLSOLO=false,FLSEL=null;
const NMES2=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function flMeses(ms){const now=new Date().getMonth()+1;return `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:4px">${NMES2.map((x,i)=>`<div style="text-align:center;font-size:10px;padding:3px 0;border-radius:4px;background:${ms.includes(i+1)?(i+1===now?'#e65100':'#ec407a'):'rgba(127,127,127,.15)'};color:${ms.includes(i+1)?'#fff':'inherit'}">${x[0].toUpperCase()}</div>`).join('')}</div>`;}
function flFichaHTML(f){const z=FL_Z.find(x=>x[0]===FLZ)||FL_Z[2],[n,s,tp,ms,luz,rg,tmin,,,pl,cu,po,ojo]=f;
  return `<div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:17px">🌸 ${esc(n)}</b><div class="note"><i>${esc(s)}</i> · ${esc(tp)}</div></div><button class="btn" data-flx="1">✕</button></div>
   <div style="margin-top:8px"><b>📍 En tu zona (${esc(z[1])})</b>${FL_Z.map(Z=>{const [lv,M]=flCompat(f,Z),L=FL_LV[lv];return `<div class="s" style="margin-top:5px;${Z[0]===FLZ?'font-weight:700':''}"><span style="color:${L[2]}">${L[0]} ${L[1]}</span> · ${esc(Z[1])}${Z[0]===FLZ&&M.length?`<div style="font-weight:400;margin:2px 0 0 22px">${M.map(esc).join('<br>')}</div>`:''}</div>`;}).join('')}</div>
   <div style="margin-top:10px"><b>🌼 Cuándo florece</b>${flMeses(ms)}</div>
   <div class="kpi" style="margin-top:10px"><div><span class="note">☀️ Luz</span><b>${esc(luz)}</b></div><div><span class="note">💧 Riego</span><b>${['','Poco','Moderado','Abundante'][rg]}</b></div>
     <div><span class="note">❄️ Aguanta hasta</span><b>${tmin>0?'+':''}${tmin} °C</b></div><div><span class="note">🪴 Cuándo plantar</span><b style="font-size:13px">${esc(pl)}</b></div></div>
   <div style="margin-top:10px;line-height:1.5"><b>🧤 Cuidados:</b> ${esc(cu)}</div>
   <div style="margin-top:6px;line-height:1.5"><b>✂️ Poda:</b> ${esc(po)}</div>
   ${ojo?`<div style="margin-top:6px;line-height:1.5;color:#c62828"><b>⚠️ Ojo:</b> ${esc(ojo)}</div>`:''}`;}
function flRender(){const el=$('flList');if(!el)return;const q=N(FLQ),z=FL_Z.find(x=>x[0]===FLZ)||FL_Z[2];
  const L=FL_D.filter(f=>(!q||N(f[0]+' '+f[1]+' '+f[2]).includes(q))&&(!FLSOLO||flCompat(f,z)[0]===0)).sort((a,b)=>a[0].localeCompare(b[0],'es'));
  el.innerHTML='<div class="card">'+(L.length?L.map((f,i)=>{const [lv]=flCompat(f,z),Lv=FL_LV[lv],k=FL_D.indexOf(f);
    return `<div class="st" data-fl="${k}" style="cursor:pointer"><div style="font-size:22px">🌸</div><div style="flex:1"><b>${esc(f[0])}</b><div class="s"><i>${esc(f[1])}</i> · ${esc(f[2])}</div><div class="s">Flor: ${f[3].map(m=>NMES2[m-1]).join(', ')}</div></div><span style="color:${Lv[2]};font-size:12px;white-space:nowrap">${Lv[0]} ${Lv[1]}</span></div>`+
      (FLSEL===k?`<div class="card" id="flFicha" style="margin:4px 0 10px;border:2px solid #ec407a">${flFichaHTML(f)}</div>`:'');}).join(''):'<div class="note">No hay flores con estos filtros.</div>')+'</div>';
  el.querySelectorAll('[data-fl]').forEach(d=>d.onclick=()=>{const k=+d.dataset.fl;FLSEL=FLSEL===k?null:k;flRender();if(FLSEL!=null){const r=el.querySelector(`[data-fl="${k}"]`);verFila(r);}});
  el.querySelectorAll('[data-flx]').forEach(b=>b.onclick=e=>{e.stopPropagation();FLSEL=null;flRender();});}
(function(){const tp=$('biTp');if(!tp)return;
  tp.insertAdjacentHTML('beforeend','<button class="btn" data-v="Flores">🌸 Flores</button>');
  $('biList').insertAdjacentHTML('afterend',`<div id="flBox" style="display:none"><div class="card"><b>🌸 Flores para tu jardín, balcón o huerta</b><div class="note">Cuidados de cada flor y si va bien con el clima de cada zona de Navarra (heladas, calor del verano, lluvia y tipo de tierra).</div>
    <label class="note" style="display:block;margin-top:8px">Tu zona<select class="town" id="flZ" style="width:100%">${FL_Z.map(z=>`<option value="${z[0]}">${z[1]} · ${z[2]}</option>`).join('')}</select></label>
    <input class="town" id="flQ" type="search" placeholder="🔎 Buscar flor (rosal, lavanda, geranio…)" style="width:100%;box-sizing:border-box;margin-top:8px">
    <label class="note" style="display:flex;align-items:center;gap:6px;margin-top:6px"><input type="checkbox" id="flSolo"> Solo las que van bien en mi zona</label></div><div id="flList"></div>
    <div class="note">Datos orientativos de jardinería. Las mínimas de cada zona son de inviernos fríos; en patios y balcones de ciudad suele helar menos.</div></div>`);
  $('flZ').value=FLZ;$('flZ').onchange=e=>{FLZ=e.target.value;try{localStorage.setItem('flZona',FLZ);}catch(x){}flRender();};
  $('flQ').oninput=e=>{FLQ=e.target.value;flRender();};$('flSolo').onchange=e=>{FLSOLO=e.target.checked;flRender();};
  const vista=()=>{const fl=typeof BITP!=='undefined'&&BITP==='Flores',sec=$('t-biodiversidad');if(!sec)return;
    $('flBox').style.display=fl?'':'none';['biList','biCnt'].forEach(id=>{const e=$(id);if(e)e.style.display=fl?'none':'';});
    ['biQ','biMes'].forEach(id=>{const e=$(id);if(e){const w=id==='biMes'?e.closest('label'):e;if(w)w.style.display=fl?'none':'';}});
    const gz=$('biG');if(gz&&gz.parentNode)gz.parentNode.style.display=fl?'none':'flex';
    if(fl){if(typeof biFicha==='function')biFicha(null);flRender();}};
  tp.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.v==='Flores'){e.stopImmediatePropagation();BITP='Flores';tp.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));}setTimeout(vista,0);});
  // biRender con BITP='Flores' no encontraría nada: que no pinte la lista
  if(typeof biRender==='function'){const _r=biRender;biRender=function(){if(typeof BITP!=='undefined'&&BITP==='Flores'){vista();return;}return _r.apply(this,arguments);};}
  svHook('biodiversidad',vista);})();

/* =====================================================================
   3. 🍲 COCINA TRADICIONAL DE NAVARRA
   ===================================================================== */
/* recetas: [nombre, zona, tipo, tiempo, dificultad, raciones, ingredientes[], pasos[], truco] */
const CO_R=[
 ['Menestra de verduras','Tudela y la Ribera','Primero','1 h 30 min','Media',4,
  ['8 alcachofas','8 espárragos blancos frescos (o de bote)','250 g de habas tiernas desgranadas','250 g de guisantes desgranados','4 pencas de acelga o borraja','100 g de jamón serrano en tacos','1 cebolla','2 dientes de ajo','2 huevos y harina para rebozar','1 cucharada de harina para la salsa','Aceite de oliva y sal'],
  ['Limpia las alcachofas: quita las hojas duras, corta las puntas y pártelas en cuartos. Frótalas con limón para que no se pongan negras.','Pela los espárragos (si son frescos) y córtalos en trozos de 5 cm. Limpia las pencas y córtalas en trozos.','Cuece cada verdura por separado en agua con sal hasta que esté tierna: guisantes y habas unos 10 min, alcachofas 15 min, espárragos 12 min, pencas 15 min. Guarda un vaso grande del agua de cocer.','Escurre bien las alcachofas y las pencas, pásalas por harina y huevo batido y fríelas en aceite caliente. Déjalas sobre papel de cocina.','En una cazuela, pocha la cebolla picada y el ajo con un poco de aceite a fuego suave 10 min. Añade el jamón y rehoga 2 min.','Echa la cucharada de harina, remueve un minuto y añade poco a poco el agua de cocer las verduras hasta tener una salsa ligera.','Mete todas las verduras en la cazuela (primero las cocidas y encima las rebozadas), mueve la cazuela en círculos y deja que cueza todo junto 5 minutos. Prueba de sal.'],
  'La menestra de verdad se hace en primavera, cuando coinciden alcachofa, espárrago, haba y guisante frescos. Cada verdura se cuece aparte para que conserve su sabor.'],
 ['Pochas a la navarra','Toda Navarra (Sangüesa, Ribera)','Primero','1 h','Fácil',4,
  ['800 g de pochas desgranadas (o 500 g congeladas)','1 cebolla','1 pimiento verde','1 tomate maduro','2 dientes de ajo','4 cucharadas de aceite de oliva','Sal','Guindillas en vinagre para acompañar'],
  ['Pon las pochas en una cazuela con agua fría que las cubra dos dedos. Añade media cebolla, el pimiento, el tomate y los ajos enteros, y el aceite.','Lleva a ebullición y baja el fuego al mínimo: tienen que cocer muy suave, «sonriendo», unos 40 minutos.','Cuando rompa a hervir, y otras dos veces más durante la cocción, «asústalas»: echa un chorrito de agua fría para cortar el hervor. Así no se pelan.','Saca las verduras, tritúralas con un poco de caldo y vuelve a echar el puré a la cazuela para espesar.','Pocha la otra media cebolla muy picada en una sartén con aceite y añádela al final. Sala, mueve la cazuela (sin cuchara) y deja reposar 10 minutos.','Sirve con guindillas en vinagre.'],
  'Las pochas no se ponen en remojo. Se pueden congelar crudas en temporada (agosto-octubre) para todo el año.'],
 ['Bacalao al ajoarriero','Toda Navarra','Segundo','45 min (más el desalado)','Fácil',4,
  ['400 g de bacalao desalado y desmigado','2 cebollas','3 dientes de ajo','1 pimiento verde','1 pimiento rojo','2 pimientos choriceros (o 2 cucharadas de su carne)','300 g de tomate triturado','Aceite de oliva','Sal y un poco de azúcar si el tomate es ácido','Opcional: 4 huevos'],
  ['Si los choriceros son secos, ponlos en remojo en agua templada 30 min y raspa la carne con una cuchara.','En una cazuela con aceite, sofríe los ajos laminados, la cebolla picada y los pimientos en tiras, a fuego suave unos 20 minutos, hasta que estén bien pochados.','Añade la carne del choricero y el tomate triturado. Deja cocer 10 minutos más.','Echa el bacalao desmigado y escurrido, mezcla y cocina 5 minutos removiendo (el bacalao se hace enseguida).','Prueba de sal: el bacalao ya trae. Si pones huevos, cuájalos encima tapando la cazuela 3-4 minutos.'],
  'Desala el bacalao 36-48 horas en la nevera, cambiando el agua cada 8 horas. En muchas fiestas de Navarra hay concursos de ajoarriero.'],
 ['Cordero en chilindrón','Ribera y Zona Media','Segundo','1 h 45 min','Media',4,
  ['1,2 kg de cordero (paletilla o cuello) en trozos','2 cebollas','4 dientes de ajo','2 pimientos rojos (o 4 choriceros)','400 g de tomate triturado','100 ml de vino blanco','1 hoja de laurel','Aceite de oliva, sal y pimienta'],
  ['Salpimienta el cordero y dóralo por tandas en una cazuela con aceite caliente. Sácalo.','En el mismo aceite, pocha la cebolla y el ajo picados y los pimientos en tiras, unos 15 minutos.','Si usas choriceros, añade su carne (remojados antes). Echa el tomate y deja 10 minutos.','Vuelve a meter el cordero, riega con el vino y deja que se evapore el alcohol 2 minutos.','Añade el laurel y un vaso de agua. Tapa y cuece a fuego suave 1 hora o 1 hora y cuarto, hasta que la carne esté tierna. Si se seca, añade un poco de agua.','Prueba de sal y deja reposar 10 minutos antes de servir.'],
  'Usa Cordero de Navarra (Indicación Geográfica Protegida). Está aún más rico de un día para otro.'],
 ['Trucha a la navarra','Valles del Pirineo y ríos de Navarra','Segundo','25 min','Fácil',4,
  ['4 truchas limpias (de ración)','4 lonchas finas de jamón serrano','Harina','Aceite de oliva','Sal','1 limón'],
  ['Seca bien las truchas con papel de cocina y sálalas por dentro y por fuera con poca sal (el jamón ya sala).','Mete una loncha de jamón doblada dentro de cada trucha.','Pásalas por harina y sacude el exceso.','Fríelas en una sartén con abundante aceite caliente, unos 4-5 minutos por cada lado, hasta que estén doradas.','Si quieres, fríe un poco más de jamón en el mismo aceite y ponlo por encima. Sirve con limón.'],
  'Antes la loncha de jamón se freía y se ponía encima; ahora es más común dentro. Las dos formas son «a la navarra».'],
 ['Pimientos del piquillo rellenos de bacalao','Lodosa y la Ribera','Segundo','50 min','Media',4,
  ['16 pimientos del piquillo de Lodosa (12 para rellenar y 4 para la salsa)','300 g de bacalao desalado y desmigado','1 cebolla','40 g de mantequilla','40 g de harina','400 ml de leche','200 ml de nata para cocinar (o caldo de pescado)','Aceite de oliva y sal'],
  ['Pocha media cebolla muy picada en la mantequilla. Añade la harina y remueve 2 minutos.','Echa la leche poco a poco sin dejar de remover hasta tener una bechamel espesa. Añade el bacalao y cocina 5 minutos. Sala con cuidado y deja enfriar.','Rellena 12 pimientos con la mezcla, con ayuda de una cucharilla, sin que se rompan.','Salsa: pocha la otra media cebolla, añade 4 pimientos y su jugo, la nata y deja cocer 5 minutos. Tritura bien.','Pon los pimientos en una fuente, cúbrelos con la salsa y calienta en el horno a 180 °C unos 10 minutos.'],
  'Busca la etiqueta de la Denominación de Origen «Pimiento del Piquillo de Lodosa»: asados a la leña y pelados a mano.'],
 ['Cogollos de Tudela con ajos y anchoas','Tudela','Primero','10 min','Fácil',4,
  ['4 cogollos de Tudela','4 dientes de ajo','8 filetes de anchoa en aceite','6 cucharadas de aceite de oliva virgen extra','1 cucharada de vinagre de vino','Sal'],
  ['Lava los cogollos, quita las hojas de fuera y córtalos en cuartos a lo largo. Escúrrelos bien.','Ponlos en una fuente con las anchoas por encima.','Lamina los ajos y dóralos en el aceite a fuego suave sin que se quemen.','Aparta del fuego, añade el vinagre (con cuidado, salta) y echa este aceite caliente por encima de los cogollos. Sirve enseguida.'],
  'Los cogollos de Tudela tienen Indicación Geográfica Protegida. La temporada buena es de otoño a primavera.'],
 ['Alcachofas con jamón','Tudela y la Ribera','Primero','40 min','Fácil',4,
  ['1,5 kg de alcachofas','100 g de jamón serrano en tacos','2 dientes de ajo','1 cucharada de harina','Perejil','1 limón','Aceite de oliva y sal'],
  ['Limpia las alcachofas: quita las hojas duras hasta llegar a las tiernas, corta la punta y pela el tallo. Pártelas por la mitad y échalas en agua con limón.','Cuécelas en agua con sal unos 15-20 minutos hasta que estén tiernas. Guarda un vaso del agua.','En una cazuela con aceite, dora el ajo picado y el jamón.','Añade la harina, remueve 1 minuto y echa medio vaso del agua de cocer.','Mete las alcachofas escurridas, espolvorea perejil y deja 5 minutos a fuego suave moviendo la cazuela.'],
  'La Alcachofa de Tudela (IGP) está en su mejor momento de noviembre a abril.'],
 ['Borraja con patatas','Ribera de Navarra','Primero','40 min','Fácil',4,
  ['1 kg de borraja','3 patatas medianas','3 dientes de ajo','Aceite de oliva virgen extra','Sal','Opcional: almejas o un chorrito de vinagre'],
  ['Limpia la borraja quitando las hojas grandes y los pelillos de los tallos (mejor con guantes). Córtala en trozos de 4 cm y lávala muy bien.','Cuece la borraja con las patatas peladas y troceadas en agua con sal unos 20-25 minutos.','Escurre bien.','Dora los ajos laminados en aceite y échalo por encima de la verdura. Sirve caliente.'],
  'Antes se cocinaba con almejas en Cuaresma. También está buena rehogada con un poco de jamón.'],
 ['Cardo con almendras','Ribera (plato de Nochebuena)','Primero','1 h','Media',4,
  ['1 kg de cardo limpio (o de bote)','50 g de almendras crudas peladas','2 dientes de ajo','1 cucharada de harina','1 limón','Aceite de oliva y sal'],
  ['Si el cardo es fresco, quita los hilos y las hebras con un cuchillo, córtalo en trozos de 4-5 cm y ponlo en agua con limón y una cucharada de harina para que no se ponga negro.','Cuécelo en agua con sal unos 45 minutos (con olla rápida, 15) hasta que esté tierno. Guarda un vaso del caldo.','Machaca o tritura las almendras con los ajos.','En una cazuela con aceite, rehoga la mezcla de almendras sin que se queme, añade la harina y remueve.','Echa el caldo poco a poco, mete el cardo escurrido y cuece todo junto 10 minutos.'],
  'El cardo blanco de la Ribera se cosecha en invierno, después de «aporcarlo» (cubrirlo de tierra) para que no le dé la luz.'],
 ['Migas de pastor','Bardenas y Zona Media','Segundo','45 min (más el remojo)','Fácil',4,
  ['500 g de pan del día anterior','150 g de panceta o tocino','1 chorizo','4 dientes de ajo','Aceite de oliva','Agua y sal','Opcional: uvas o un pimiento verde frito'],
  ['El día antes, corta el pan en trozos pequeños, rocíalo con un poco de agua con sal (que quede húmedo, no empapado) y tápalo con un paño.','En una sartén grande con aceite, fríe los ajos con piel aplastados, la panceta y el chorizo en trozos. Sácalos.','Echa el pan en la sartén y remueve sin parar, a fuego medio, con la espumadera o una paleta, durante 20-30 minutos, hasta que quede suelto y dorado.','Vuelve a meter la panceta, el chorizo y los ajos y mezcla bien.'],
  'Eran el almuerzo de los pastores en la Bardena. Con uvas están buenísimas.'],
 ['Cuajada','Valles del Pirineo y Urbasa-Andía','Postre','20 min (más 2 h de reposo)','Fácil',4,
  ['1 l de leche de oveja','Cuajo (la cantidad que diga el envase, suelen ser unas gotas)','Miel o azúcar para acompañar'],
  ['Calienta la leche hasta que esté templada, a unos 37-40 °C (puedes meter el dedo sin quemarte). Si la calientas de más, no cuaja.','Pon unas gotas de cuajo en el fondo de cada cuenco.','Echa la leche templada encima y no muevas los cuencos.','Déjalos reposar a temperatura ambiente unos 15-20 minutos hasta que cuaje y luego mételos en la nevera 2 horas.','Sírvela con miel o azúcar, y si quieres, con nueces.'],
  'Antes se hacía en un «kaiku» de madera y se metía una piedra muy caliente: por eso la cuajada tradicional tiene un ligero sabor a quemado.'],
 ['Melocotón con vino','Ribera','Postre','30 min (más el enfriado)','Fácil',4,
  ['4 melocotones de viña o de pulpa firme','500 ml de vino tinto de Navarra','150 g de azúcar','1 rama de canela','Piel de 1 limón'],
  ['Pela los melocotones y córtalos en gajos o déjalos enteros si son pequeños.','Pon en una cazuela el vino, el azúcar, la canela y la piel de limón. Lleva a ebullición.','Añade los melocotones y cuece a fuego suave 10-15 minutos, hasta que estén tiernos pero enteros.','Deja enfriar en el propio vino y mételo en la nevera. Se sirve frío con su almíbar.'],
  'Los melocotones de viña de finales de verano son los mejores para esta receta.'],
 ['Pantxineta','Toda Navarra y País Vasco','Postre','1 h','Media',6,
  ['2 láminas de hojaldre','500 ml de leche','4 yemas de huevo','100 g de azúcar','40 g de maicena','Piel de limón y 1 rama de canela','1 huevo batido','Almendra laminada y azúcar glas'],
  ['Crema: calienta 400 ml de leche con la piel de limón y la canela. En un bol, mezcla las yemas, el azúcar, la maicena y el resto de la leche fría.','Retira la canela y el limón, echa la mezcla en la leche caliente y remueve sin parar a fuego medio hasta que espese. Deja enfriar tapada con film.','Pon una lámina de hojaldre en un molde redondo, extiende la crema dejando 2 cm de borde y cubre con la otra lámina. Sella los bordes.','Pinta con huevo batido, cubre con almendra laminada y hornea a 190 °C unos 30 minutos, hasta que esté dorada.','Deja enfriar y espolvorea azúcar glas.'],
  'Está más rica tibia.'],
 ['Patxaran casero','Toda Navarra','Licor','10 min (más 3 meses)','Fácil',0,
  ['1 l de anís seco','250-300 g de endrinas maduras','5 granos de café','1 rama de canela pequeña','Opcional: unas cucharadas de azúcar o una vaina de vainilla'],
  ['Coge las endrinas en otoño, cuando estén maduras (azul oscuro) y mejor después de alguna helada. Lávalas y sécalas.','Mételas en una botella de boca ancha con el café y la canela y cubre con el anís.','Cierra y guárdala en un sitio oscuro 2-3 meses, dándole la vuelta de vez en cuando.','Cuando tenga un color rojo oscuro, cuela y embotella.'],
  'El Pacharán Navarro tiene Indicación Geográfica Protegida. Es una bebida alcohólica: con moderación y solo para adultos.']];
let COV='rec',COSEL=null,COQ='';
function coRecHTML(r){const [n,z,tp,t,d,rac,ing,pas,tr]=r;
  return `<div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:17px">🥘 ${esc(n)}</b><div class="note">📍 ${esc(z)} · ${esc(tp)}</div></div><button class="btn" data-cox="1">✕</button></div>
   <div class="kpi" style="margin-top:8px"><div><span class="note">⏱️ Tiempo</span><b style="font-size:14px">${esc(t)}</b></div><div><span class="note">👩‍🍳 Dificultad</span><b style="font-size:14px">${esc(d)}${rac?' · '+rac+' personas':''}</b></div></div>
   <div style="margin-top:10px"><b>🧺 Ingredientes</b><ul style="margin:6px 0 0;padding-left:20px;line-height:1.55">${ing.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>
   <div style="margin-top:10px"><b>🔪 Elaboración</b><ol style="margin:6px 0 0;padding-left:22px;line-height:1.55">${pas.map(p=>`<li style="margin-bottom:5px">${esc(p)}</li>`).join('')}</ol></div>
   ${tr?`<div class="note" style="margin-top:8px;line-height:1.5">💡 ${esc(tr)}</div>`:''}
   <div class="row" style="margin-top:8px"><button class="btn" data-cosh="1">📤 Compartir receta</button></div>`;}
function coRenderC(){const el=$('ckList');if(!el)return;
  $('ckSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===COV));$('ckQ').style.display=COV==='rec'?'':'none';
  if(COV==='prod'){el.innerHTML='<div class="note">Cargando…</div>';
    const pinta=()=>{const A=window.ABIERTOS,P=A&&A.recetas?A.recetas.filter(r=>r.tipo==='Productos típicos'):[];
      el.innerHTML=P.length?P.map(r=>`<details class="st" style="display:block"><summary><b>🧺 ${esc(r.n)}</b>${r.do?' <span class="note">· 🏅 Denominación de origen</span>':''}</summary><div class="s" style="white-space:pre-line;margin-top:6px">${esc(r.txt)}${/[.!?»]$/.test(r.txt.trim())?'':'…'}</div></details>`).join('')+'<div class="note" style="margin-top:8px">Textos de Turismo de Navarra (datos abiertos del Gobierno de Navarra).</div>':'<div class="note">No se pudieron cargar los productos típicos ahora.</div>';};
    if(typeof abLoad==='function')abLoad(pinta);else pinta();return;}
  const q=N(COQ),T=['Primero','Segundo','Postre','Licor'],L=CO_R.filter(r=>!q||N(r[0]+' '+r[1]+' '+r[6].join(' ')).includes(q));
  el.innerHTML=(L.length?T.map(t=>{const R=L.filter(r=>r[2]===t);if(!R.length)return '';
    return `<div style="margin:10px 0 2px"><b>${{Primero:'🥗 Primeros',Segundo:'🍖 Segundos',Postre:'🍮 Postres',Licor:'🍷 Licores'}[t]}</b></div>`+R.map(r=>{const k=CO_R.indexOf(r);
      return `<div class="st" data-co="${k}" style="cursor:pointer"><div style="flex:1"><b>${esc(r[0])}</b><div class="s">📍 ${esc(r[1])} · ⏱️ ${esc(r[3])}</div></div><span class="note">${COSEL===k?'▾':'›'}</span></div>`+(COSEL===k?`<div class="card" style="margin:4px 0 10px;border:2px solid #e64a19">${coRecHTML(r)}</div>`:'');}).join('');}).join(''):'<div class="note">No hay recetas con ese nombre o ingrediente.</div>')+
    '<div class="note" style="margin-top:8px">Recetas tradicionales caseras, recogidas por BasatiNA. Cada casa tiene su forma: si la tuya es distinta, mándanosla por el buzón.</div>';
  el.querySelectorAll('[data-co]').forEach(d=>d.onclick=()=>{const k=+d.dataset.co;COSEL=COSEL===k?null:k;coRenderC();if(COSEL!=null){const r=el.querySelector(`[data-co="${k}"]`);verFila(r);}});
  el.querySelectorAll('[data-cox]').forEach(b=>b.onclick=()=>{COSEL=null;coRenderC();});
  el.querySelectorAll('[data-cosh]').forEach(b=>b.onclick=()=>{const r=CO_R[COSEL];if(!r)return;const t=`${r[0]} (${r[1]})\n\nIngredientes${r[5]?' ('+r[5]+' personas)':''}:\n- ${r[6].join('\n- ')}\n\nElaboración:\n${r[7].map((p,i)=>(i+1)+'. '+p).join('\n')}\n\n${r[8]}\n\nReceta de BasatiNA · https://basatina.es`;
    if(APP&&window.AndroidNet&&window.AndroidNet.share)window.AndroidNet.share(t);else if(navigator.share)navigator.share({title:r[0],text:t}).catch(()=>{});else{try{navigator.clipboard.writeText(t);toast('📋 Receta copiada');}catch(e){}}});}
svSec('cocina',`<div class="card"><b>🍲 Cocina tradicional de Navarra</b><div class="note">Las recetas de siempre, completas y paso a paso, y los productos típicos de nuestra tierra.</div>
  <div class="seg" id="ckSeg" style="margin-top:8px"><button class="btn on" data-v="rec">🥘 Recetas</button><button class="btn" data-v="prod">🧺 Productos típicos</button></div>
  <input class="town" id="ckQ" type="search" placeholder="🔎 Plato o ingrediente (bacalao, alcachofa…)" style="width:100%;box-sizing:border-box;margin-top:8px"></div>
  <div class="card" id="ckList"></div>`);
$('ckSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{COV=b.dataset.v;coRenderC();});$('ckQ').oninput=e=>{COQ=e.target.value;coRenderC();};
svHook('cocina',coRenderC);
// «Dónde comer» ya solo con restaurantes
(function(){const v=$('coV');if(v){const b=v.querySelector('[data-v="rec"]');if(b)b.remove();v.style.display='none';}
  if(typeof COVISTA!=='undefined')COVISTA='rest';
  document.querySelectorAll('#drawer button[data-t="comer"]').forEach(b=>{if(b.dataset.txt)b.dataset.txt='Dónde comer';const sp=b.querySelectorAll('span');if(sp.length)sp[sp.length-1].textContent='Dónde comer';else b.textContent='🍽️ Dónde comer';});
  const sc=$('t-comer');if(sc){const c=sc.querySelector('.card');if(c)c.insertAdjacentHTML('beforeend','<div class="note" style="margin-top:6px">🍲 Las recetas típicas están ahora en <a href="#" onclick="showTab(\'cocina\');return false">Turismo → Cocina tradicional</a>.</div>');}})();

/* =====================================================================
   4. RÍOS: en la web solo en la app
   ===================================================================== */
const RW_T=['caudal','emb','prev','libre','hist'];
if(typeof APP==='undefined'||!APP){
  const st=document.createElement('style');st.textContent='section.rwOnly>*:not(.rwMsg):not([id^="pv"]){display:none!important}';document.head.appendChild(st);
  RW_T.forEach(t=>{const s=$('t-'+t);if(!s)return;s.classList.add('rwOnly');
    s.insertAdjacentHTML('afterbegin',`<div class="card rwMsg" style="text-align:center"><div style="font-size:44px">📱</div><b style="font-size:17px">Solo en la app del móvil</b>
      <div class="note" style="margin:6px 0 10px;line-height:1.5">Los datos de los ríos y embalses (SAIH Ebro) solo se pueden leer desde la app: la web oficial no deja que otras páginas los muestren. Descarga BasatiNA gratis para Android y tendrás los ríos al minuto y los avisos de crecidas.</div>
      <button class="btn pri" onclick="window.nvDescargar?nvDescargar():location.href='https://basatina.es/'">📲 Descargar la app</button></div>`);});
  const g=[...document.querySelectorAll('#drawer .dgroup')].find(x=>N(x.querySelector('span')?.dataset.k||x.textContent).startsWith('rios'));
  if(g&&!g.querySelector('.rwTag'))g.querySelector('span').insertAdjacentHTML('afterend','<small class="rwTag" style="margin-left:6px;font-size:11px;opacity:.75">📱 solo app</small>');
}

/* =====================================================================
   5. 🛒 SUPERMERCADOS Y MERCADOS (web/tiendas.js)
   ===================================================================== */
let SUV='super',SUQ='',SUM='',SUC=false,SUN=40;
svSec('super',`<div class="card"><b>🛒 Supermercados y mercados</b><div class="note">Supermercados y mercados municipales de Navarra, con horario (si se conoce), cómo llegar y teléfono. Los mercadillos de cada semana están en 🧺 Mercados semanales.</div>
  <div class="seg" id="suSeg" style="margin-top:8px"><button class="btn on" data-v="super">🛒 Supermercados</button><button class="btn" data-v="mercado">🏛️ Mercados</button><button class="btn" data-v="semana">🧺 Mercadillos</button></div>
  <div style="display:flex;gap:6px;margin-top:8px"><input id="suQ" class="town" type="search" placeholder="🔎 Pueblo, calle o nombre" style="flex:1;min-width:0"><button class="btn" id="suC">📍 Cerca de mí</button></div>
  <select id="suM" class="town" style="width:100%;margin-top:6px"></select></div>
  <div class="card" id="suList"><div class="note">Cargando…</div></div>
  <div class="note" style="margin:0 6px 10px">Datos: © colaboradores de OpenStreetMap (ODbL), se actualizan cada mes. Puede faltar alguno o haber cambiado el horario: si ves un error, avísanos por el buzón.</div>`);
function suHorario(h){if(!h)return '';return esc(h).replace(/\bMo\b/g,'lun').replace(/\bTu\b/g,'mar').replace(/\bWe\b/g,'mié').replace(/\bTh\b/g,'jue').replace(/\bFr\b/g,'vie').replace(/\bSa\b/g,'sáb').replace(/\bSu\b/g,'dom').replace(/\bPH\b/g,'festivos').replace(/\boff\b/g,'cerrado').replace(/;\s*/g,' · ');}
function suRender(){const el=$('suList');$('suSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===SUV));
  svLoad('tiendas.js','TIENDAS',ok=>{const T=window.TIENDAS;if(!ok||!T){el.innerHTML='<div class="note">Los supermercados llegarán con la próxima actualización de datos.</div>';return;}
    const sm=$('suM');sm.style.display=SUV==='super'?'':'none';
    if(SUV==='super'&&!sm.dataset.ok){sm.dataset.ok=1;const C={};T.super.forEach(a=>{const k=a[1]||'';if(k)C[k]=(C[k]||0)+1;});
      sm.innerHTML='<option value="">Todas las cadenas</option>'+Object.entries(C).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<option value="${esc(k)}">${esc(k)} (${n})</option>`).join('');sm.value=SUM;}
    const q=N(SUQ);let L=(SUV==='super'?T.super.map(a=>({n:a[0],m:a[1],la:a[2],lo:a[3],p:a[4],c:a[5],h:a[6],w:a[7],t:a[8]})):T.mercado.map(a=>({n:a[0],m:'',la:a[1],lo:a[2],p:a[3],c:a[4],h:a[5],w:a[6],t:''})))
      .filter(o=>(!SUM||SUV!=='super'||o.m===SUM)&&(!q||N(o.n+' '+o.m+' '+o.p+' '+o.c).includes(q)));
    if(SUC&&MYPOS){L.forEach(o=>o.k=km(MYPOS.la,MYPOS.lo,o.la,o.lo));L.sort((a,b)=>a.k-b.k);}
    el.innerHTML=`<div class="note">${fmtN(L.length,0)} ${SUV==='super'?'supermercados':'mercados'}</div>`+L.slice(0,SUN).map(o=>`<div class="st" style="align-items:flex-start"><div style="flex:1"><b>${SUV==='super'?'🛒':'🏛️'} ${esc(o.n)}</b>${o.m&&N(o.m)!==N(o.n)?` <span class="note">· ${esc(o.m)}</span>`:''}
      <div class="s">📍 ${o.c?esc(o.c)+', ':''}${esc(o.p)}${o.k!=null?` · <b>${fmtN(o.k,o.k<10?1:0)} km</b>`:''}</div>${o.h?`<div class="s">🕒 ${suHorario(o.h)}</div>`:''}
      <div class="row" style="margin-top:4px"><button class="btn" data-url="${esc(abMapsPt(o.la,o.lo))}">🧭 Cómo llegar</button>${o.w?`<button class="btn" data-url="${esc(abWeb(o.w))}">🌐 Web</button>`:''}${o.t?`<button class="btn" data-tel="${esc(o.t)}">📞 Llamar</button>`:''}</div></div></div>`).join('')+
      (L.length>SUN?`<div class="row"><button class="btn" id="suMas">Ver más (${fmtN(L.length-SUN,0)})</button></div>`:'')+(L.length?'':'<div class="note">No hay resultados con esos filtros.</div>');
    abBtns(el);const mb=$('suMas');if(mb)mb.onclick=()=>{SUN+=40;suRender();};});}
$('suSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.v==='semana'){showTab('mercados');return;}SUV=b.dataset.v;SUN=40;suRender();});
$('suQ').oninput=e=>{SUQ=e.target.value;SUN=40;clearTimeout(suRender.t);suRender.t=setTimeout(suRender,250);};
$('suM').onchange=e=>{SUM=e.target.value;SUN=40;suRender();};
$('suC').onclick=e=>abCerca(e.target,()=>{SUC=true;suRender();});
svHook('super',suRender);

/* =====================================================================
   6. ⭐ DEPORTE: favoritos y Mi calendario deportivo
   ===================================================================== */
const dpFav=()=>{const f=lsGet('dpFav',{});return {eq:f.eq||[],comp:f.comp||[]};};
const dpMios=()=>lsGet('dpMios',[]);
const dpEsFav=x=>{const F=dpFav();return F.eq.includes(x.loc)||F.eq.includes(x.vis)||F.comp.includes(x.dep+'|'+x.comp);};
// botones de cada partido (los pinta dpRender de index.html)
window.dpMineBtns=function(x){const mio=dpMios().some(m=>m.id===x.id),F=dpFav();
  const st=n=>`<button class="btn dpStar" data-eq="${esc(n)}" style="padding:3px 8px;font-size:12px">${F.eq.includes(n)?'⭐':'☆'} ${esc(n.length>18?n.slice(0,17)+'…':n)}</button>`;
  return `<div class="row dpMine" style="margin-top:4px;flex-wrap:wrap;gap:4px">${x.res?'':`<button class="btn" data-dpadd="${esc(x.id)}" style="padding:3px 8px;font-size:12px">${mio?'✅ En mi calendario':dpEsFav(x)?'⭐ En mi calendario':'➕ Mi calendario'}</button>`}${st(x.loc)}${st(x.vis)}</div>`;};
async function dpMineBind(){let G=null;try{G=await jsLoad(DP_PATH,DP_DEF);}catch(e){return;}const P=G.partidos||[];
  document.querySelectorAll('#t-deporte [data-dpadd]').forEach(b=>b.onclick=e=>{e.stopPropagation();const x=P.find(p=>p.id===b.dataset.dpadd);if(!x)return;let M=dpMios();
    if(M.some(m=>m.id===x.id)){M=M.filter(m=>m.id!==x.id);toast('Quitado de tu calendario deportivo');}else{M.push({id:x.id,dep:x.dep,comp:x.comp,loc:x.loc,vis:x.vis,f:x.f,h:x.h||'',lugar:x.lugar||''});toast('✅ Añadido a ⭐ Mi calendario deportivo (Mi Espacio)');}
    lsSet('dpMios',M);dpRender();});
  document.querySelectorAll('#t-deporte .dpStar').forEach(b=>b.onclick=e=>{e.stopPropagation();const n=b.dataset.eq,F=dpFav();
    if(F.eq.includes(n)){F.eq=F.eq.filter(x=>x!==n);toast('☆ '+n+' ya no es favorito');}else{F.eq.push(n);toast('⭐ '+n+': sus partidos saldrán en tu calendario deportivo');}lsSet('dpFav',F);dpRender();});
  // ⭐ seguir la liga elegida
  const cs=$('dpComp');let lb=$('dpLigaFav');if(lb)lb.remove();
  if(typeof DPCOMP!=='undefined'&&DPCOMP&&cs){const k=DPDEP+'|'+DPCOMP,on=dpFav().comp.includes(k);
    cs.insertAdjacentHTML('afterend',`<div class="row" id="dpLigaFav" style="margin-top:6px"><button class="btn${on?' pri':''}" style="flex:1">${on?'⭐ Sigues esta liga (todos sus partidos van a tu calendario)':'☆ Seguir la liga «'+esc(DPCOMP)+'» en mi calendario'}</button></div>`);
    $('dpLigaFav').querySelector('button').onclick=()=>{const F=dpFav();if(F.comp.includes(k))F.comp=F.comp.filter(x=>x!==k);else F.comp.push(k);lsSet('dpFav',F);toast(on?'Ya no sigues esta liga':'⭐ Liga añadida a tu calendario deportivo');dpRender();};}
  // acceso al calendario
  if(!$('dpMiCal')){const c=$('dpProx');if(c)c.insertAdjacentHTML('beforebegin',`<div class="card" id="dpMiCal" style="cursor:pointer" onclick="showTab('misdep')"><b>⭐ Mi calendario deportivo</b><div class="note">Marca ☆ tus equipos o sigue una liga entera y sus partidos irán solos a tu calendario. Con ➕ añades un partido suelto. Toca aquí para verlo.</div></div>`);}}
if(typeof dpRender==='function'){const _dr=dpRender;dpRender=async function(){const r=await _dr.apply(this,arguments);try{await dpMineBind();}catch(e){}return r;};}
// lista de partidos de mi calendario: los marcados a mano + los de equipos y ligas favoritos
async function mdLista(){let P=[];try{P=(await jsLoad(DP_PATH,DP_DEF)).partidos||[];}catch(e){}
  const M=dpMios(),ids=new Set(),L=[];
  P.forEach(x=>{if(dpEsFav(x)||M.some(m=>m.id===x.id)){ids.add(x.id);L.push(Object.assign({},x,{fav:dpEsFav(x),mano:M.some(m=>m.id===x.id)}));}});
  M.forEach(m=>{if(!ids.has(m.id))L.push(Object.assign({},m,{mano:true}));});
  return L.sort((a,b)=>(a.f+(a.h||'99')).localeCompare(b.f+(b.h||'99')));}
function mdIcs(L){const p=n=>String(n).padStart(2,'0'),dt=(f,h)=>f.replace(/-/g,'')+(h?'T'+h.replace(':','')+'00':''),e=s=>String(s||'').replace(/([,;\\])/g,'\\$1');
  const ev=L.map(x=>{const fin=x.h?(()=>{const d=new Date(x.f+'T'+x.h);d.setHours(d.getHours()+2);return ymd(d).replace(/-/g,'')+'T'+p(d.getHours())+p(d.getMinutes())+'00';})():ymd(new Date(new Date(x.f+'T12:00').getTime()+864e5)).replace(/-/g,'');
    return ['BEGIN:VEVENT','UID:'+x.id+'@basatina.es','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',x.h?'DTSTART;TZID=Europe/Madrid:'+dt(x.f,x.h):'DTSTART;VALUE=DATE:'+dt(x.f),x.h?'DTEND;TZID=Europe/Madrid:'+fin:'DTEND;VALUE=DATE:'+fin,
      'SUMMARY:'+e(x.loc+' - '+x.vis),'DESCRIPTION:'+e(x.comp),x.lugar?'LOCATION:'+e(x.lugar):'','END:VEVENT'].filter(Boolean).join('\r\n');}).join('\r\n');
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BasatiNA//Deporte//ES\r\n'+ev+'\r\nEND:VCALENDAR\r\n';}
function mdBajar(L,nom){const t=mdIcs(L);if(APP&&window.AndroidNet&&window.AndroidNet.shareFile){window.AndroidNet.shareFile(nom,btoa(unescape(encodeURIComponent(t))),'text/calendar');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
let MDM=null,MDS=null;
async function mdRender(){const el=$('mdBody');if(!el)return;const hoy=hoyYmd();if(!MDM)MDM=hoy.slice(0,7);if(!MDS)MDS=hoy;
  const L=await mdLista(),F=dpFav(),[y,m]=MDM.split('-').map(Number),d1=new Date(y,m-1,1),nd=new Date(y,m,0).getDate(),off=(d1.getDay()+6)%7;
  let g='';for(let i=0;i<off;i++)g+='<div></div>';
  for(let d=1;d<=nd;d++){const f=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,n=L.filter(x=>x.f===f).length;
    g+=`<button class="calD${f===hoy?' hoy':''}${f===MDS?' sel':''}" data-f="${f}">${d}<span>${n?'<i class="e"></i>':''}${n>1?'<i class="e"></i>':''}</span></button>`;}
  const fila=x=>`<div class="st" style="align-items:flex-start"><div style="font-size:22px">${typeof dpIco==='function'?dpIco(x.dep):'🏆'}</div><div style="flex:1"><b>${esc(x.loc)} – ${esc(x.vis)}</b>${x.res?` <b style="color:var(--acc)">${esc(x.res)}</b>`:''}
     <div class="s">${esc(x.comp||'')}</div><div class="s">📅 ${fLarga(x.f)}${x.h?' · '+esc(x.h)+' h':' · hora pendiente'}${x.lugar?' · 📍 '+esc(x.lugar):''}</div>
     <div class="s">${x.fav?'⭐ por tus favoritos':''}${x.fav&&x.mano?' · ':''}${x.mano?'➕ añadido por ti':''}</div>
     <div class="row" style="margin-top:4px"><button class="btn" data-ics="${esc(x.id)}" style="padding:3px 8px;font-size:12px">📲 Al calendario del móvil</button>${x.mano?`<button class="btn" data-mdx="${esc(x.id)}" style="padding:3px 8px;font-size:12px">🗑️ Quitar</button>`:''}</div></div></div>`;
  const dia=L.filter(x=>x.f===MDS),prox=L.filter(x=>x.f>=hoy&&!x.res).slice(0,30);
  el.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><button class="btn" id="mdP">‹</button><b>${cap1(d1.toLocaleDateString('es-ES',{month:'long',year:'numeric'}))}</b><button class="btn" id="mdN">›</button></div>
     <div class="calG calH">${['L','M','X','J','V','S','D'].map(x=>`<div>${x}</div>`).join('')}</div><div class="calG">${g}</div>
     <div style="margin-top:8px"><b>${cap1(fLarga(MDS))}</b>${dia.length?dia.map(fila).join(''):'<div class="note">Ese día no tienes partidos.</div>'}</div></div>
   <div class="card"><b>📅 Próximos partidos (${prox.length})</b>${prox.length?prox.map(fila).join('')+`<div class="row" style="margin-top:6px"><button class="btn pri" id="mdTodo" style="flex:1">📲 Pasar todos al calendario del móvil</button></div>`:'<div class="note">Aún no hay partidos. Ve a Qué hacer → 🏆 Deporte navarro y marca ☆ tus equipos, sigue una liga o toca ➕ en un partido.</div>'}</div>
   <div class="card"><b>⭐ Mis equipos y ligas</b>${F.eq.length||F.comp.length?[...F.eq.map(n=>['eq',n,'👕 '+n]),...F.comp.map(k=>['comp',k,'🏆 '+k.split('|')[1]])].map(([t,v,l])=>`<div class="st"><span>${esc(l)}</span><button class="btn" data-fx="${t}" data-fv="${esc(v)}">✕</button></div>`).join(''):'<div class="note">Todavía no tienes favoritos.</div>'}
     <div class="row" style="margin-top:6px"><button class="btn" onclick="showTab('deporte')">🏆 Ir a Deporte navarro</button></div></div>
   <div class="note">Tu calendario deportivo se guarda solo en este dispositivo (entra en la «📦 Copia de mis datos» de Ajustes). «Al calendario del móvil» abre Google Calendar con el partido ya apuntado. «Pasar todos» crea un archivo .ics que puedes abrir con tu calendario o guardar en Drive.</div>`;
  el.querySelectorAll('.calD').forEach(b=>b.onclick=()=>{MDS=b.dataset.f;mdRender();});
  $('mdP').onclick=()=>{MDM=ymd(new Date(y,m-2,1)).slice(0,7);mdRender();};$('mdN').onclick=()=>{MDM=ymd(new Date(y,m,1)).slice(0,7);mdRender();};
  // un partido: abre Google Calendar con el evento ya rellenado (en el móvil se abre la app de Calendar)
  el.querySelectorAll('[data-ics]').forEach(b=>b.onclick=()=>{const x=L.find(p=>p.id===b.dataset.ics);if(!x)return;const f=x.f.replace(/-/g,'');
    let dates;if(x.h){const d=new Date(x.f+'T'+x.h),e=new Date(d.getTime()+2*36e5),hh=t=>ymd(t).replace(/-/g,'')+'T'+String(t.getHours()).padStart(2,'0')+String(t.getMinutes()).padStart(2,'0')+'00';dates=hh(d)+'/'+hh(e);}
    else dates=f+'/'+ymd(new Date(new Date(x.f+'T12:00').getTime()+864e5)).replace(/-/g,'');
    const u='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(x.loc+' - '+x.vis)+'&dates='+dates+'&ctz=Europe/Madrid&details='+encodeURIComponent((x.comp||'')+' · BasatiNA')+(x.lugar?'&location='+encodeURIComponent(x.lugar):'');
    if(APP&&window.AndroidNet&&window.AndroidNet.openUrl)window.AndroidNet.openUrl(u);else window.open(u,'_blank');});
  el.querySelectorAll('[data-mdx]').forEach(b=>b.onclick=()=>{lsSet('dpMios',dpMios().filter(m=>m.id!==b.dataset.mdx));mdRender();});
  el.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{const F=dpFav();F[b.dataset.fx]=F[b.dataset.fx].filter(v=>v!==b.dataset.fv);lsSet('dpFav',F);mdRender();});
  const t=$('mdTodo');if(t)t.onclick=()=>mdBajar(prox,'mis-partidos.ics');}
svSec('misdep',`<div class="card"><b>⭐ Mi calendario deportivo</b><div class="note">Los partidos de tus equipos y ligas favoritos y los que añadas tú, en un calendario.</div></div><div id="mdBody"></div>`);
svHook('misdep',()=>{MDM=null;MDS=null;mdRender();});

/* =====================================================================
   7. 🧸 PARA LOS PEQUES
   ===================================================================== */
// [icono, nombre, dónde, descripción, lat, lon, edad, url]
const PQ_S=[
 ['🦁','Sendaviva','Arguedas (Ribera)','Parque de naturaleza con animales, atracciones, espectáculos de aves y tirolinas. Abre de primavera a otoño: mira el calendario antes de ir.',42.1904,-1.5799,'Todas','https://www.sendaviva.com'],
 ['🔭','Planetario de Pamplona','Pamplona (Yamaguchi)','Sesiones de cúpula para todas las edades, talleres y observaciones. Algunas sesiones son especiales para los más pequeños.',42.8064,-1.6614,'Desde 4 años','https://www.pamplonetario.org'],
 ['🦌','Parque de la Taconera','Pamplona (Casco Antiguo)','En los fosos viven ciervos, patos, pavos reales y otras aves. Tiene zona de juegos y el Mesón del Caballo Blanco cerca.',42.8186,-1.6501,'Todas',''],
 ['🏰','Ciudadela y Vuelta del Castillo','Pamplona','Gran parque con baluartes para explorar, césped para correr y zona de juegos. Exposiciones en los pabellones.',42.8118,-1.6496,'Todas',''],
 ['🚲','Parque fluvial del Arga','Comarca de Pamplona','Paseo llano junto al río para ir andando, en bici o en patinete, con zonas de juego y merenderos por el camino.',42.8251,-1.6338,'Todas',''],
 ['🏞️','Parque de los Sentidos','Noáin','Parque pensado para descubrir con los cinco sentidos: caminos, juegos, plantas y rincones sorprendentes.',42.7598,-1.6334,'Todas',''],
 ['🌳','Hayedo de Orgi','Lizaso (Ultzama)','Robledal-hayedo con un paseo llano y adaptado de unos 2,5 km. Perfecto con carrito y para ver setas y pájaros.',42.9658,-1.6464,'Todas',''],
 ['🌿','Señorío de Bertiz','Oieregi (Bertizarana)','Parque natural con jardín botánico y caminos por el bosque. Centro de interpretación.',43.1440,-1.6171,'Todas',''],
 ['🧙','Cuevas de Zugarramurdi y Museo de las Brujas','Zugarramurdi','La cueva «del aquelarre», con un arroyo que la atraviesa, y un museo para conocer las historias de las brujas.',43.2701,-1.5463,'Desde 5 años',''],
 ['🦇','Cuevas de Urdazubi/Urdax (Ikaburu)','Urdazubi/Urdax','Cueva con estalactitas y estalagmitas que se visita con guía. Lleva chaqueta: dentro hace fresco.',43.2600,-1.5072,'Desde 4 años',''],
 ['🚂','Vía verde del Plazaola','Lekunberri','Antiguo tren convertido en camino llano con túneles (lleva linterna). Ideal en bici con niños.',43.0013,-1.8928,'Todas',''],
 ['🦅','Foz de Lumbier','Lumbier','Camino llano por el antiguo trenecito del Irati, entre paredes enormes con buitres. Un túnel a oscuras: lleva linterna.',42.6416,-1.2894,'Todas',''],
 ['🏯','Palacio Real de Olite','Olite','Torres, pasadizos y jardines de un castillo de cuento. Visitas teatralizadas algunos días.',42.4822,-1.6499,'Todas','https://www.guiartenavarra.com'],
 ['🛡️','Castillo de Javier','Javier','Castillo medieval con su foso, puente levadizo y torre. Visita corta, perfecta para niños.',42.5900,-1.2133,'Todas',''],
 ['🌵','Bardenas Reales','Arguedas y Ribera','Un paisaje como de otro planeta. Pasa por el centro de información y haz la ruta por las pistas marcadas (en coche, bici o a pie). Lleva agua y gorra.',42.1858,-1.5208,'Todas',''],
 ['💧','Nacedero del Urederra','Baquedano','El río nace con aguas turquesa. Paseo de unas 2 horas ida y vuelta. Hay cupo diario y en temporada hay que reservar.',42.7684,-2.1100,'Desde 6 años','https://www.urederra.com'],
 ['🌲','Selva de Irati','Orbaizeta / Ochagavía','El gran hayedo. Desde las Casas de Irati salen paseos cortos y fáciles por el bosque y junto al embalse. Precioso en otoño.',42.9878,-1.1050,'Todas','']];
const PQ_KW=/infantil|niñ[oa]s|famili|txiki|haur|cuentacuentos|títeres|titeres|marioneta|payas|magia|clown|ludoteca|peques|kids/i;
let PQV='sitios',PQQ='',PQC=false,PQN=40;
svSec('peques',`<div class="card"><b>🧸 Para los peques</b><div class="note">Planes para ir con niños por Navarra: sitios para visitar, parques infantiles, paseos fáciles y actividades infantiles de la agenda.</div>
  <div class="seg" id="pqSeg" style="margin-top:8px"><button class="btn on" data-v="sitios">🎈 Sitios</button><button class="btn" data-v="juegos">🛝 Parques</button><button class="btn" data-v="rutas">🥾 Paseos</button><button class="btn" data-v="agenda">🎭 Agenda</button></div>
  <div style="display:flex;gap:6px;margin-top:8px" id="pqFil"><input id="pqQ" class="town" type="search" placeholder="🔎 Pueblo o nombre" style="flex:1;min-width:0"><button class="btn" id="pqC">📍 Cerca de mí</button></div></div>
  <div class="card" id="pqList"><div class="note">Cargando…</div></div>
  <div class="note" style="margin:0 6px 10px">Horarios y precios cambian: consulta la web de cada sitio antes de ir. Parques infantiles: © colaboradores de OpenStreetMap (ODbL). ¿Conoces un plan que falte? Mándanoslo por el buzón.</div>`);
const pqKm=(la,lo)=>PQC&&MYPOS?km(MYPOS.la,MYPOS.lo,la,lo):null;
const pqKmT=k=>k==null?'':` · <b>${fmtN(k,k<10?1:0)} km</b>`;
async function pqRender(){const el=$('pqList'),q=N(PQQ);$('pqSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===PQV));
  $('pqFil').style.display=PQV==='agenda'?'none':'flex';
  if(PQV==='sitios'){let L=PQ_S.filter(s=>!q||N(s[1]+' '+s[2]+' '+s[3]).includes(q)).map(s=>({s,k:pqKm(s[4],s[5])}));if(PQC&&MYPOS)L.sort((a,b)=>a.k-b.k);
    el.innerHTML=L.map(({s,k})=>`<div class="st" style="align-items:flex-start"><div style="font-size:26px">${s[0]}</div><div style="flex:1"><b>${esc(s[1])}</b><div class="s">📍 ${esc(s[2])}${pqKmT(k)} · 👧 ${esc(s[6])}</div><div class="s" style="margin-top:2px">${esc(s[3])}</div>
      <div class="row" style="margin-top:4px"><button class="btn" data-url="${esc(abMapsPt(s[4],s[5]))}">🧭 Cómo llegar</button>${s[7]?`<button class="btn" data-url="${esc(s[7])}">🌐 Web</button>`:`<button class="btn" data-url="${esc('https://www.google.com/search?q='+encodeURIComponent(s[1]+' '+s[2]+' Navarra'))}">🔎 Más info</button>`}</div></div></div>`).join('')||'<div class="note">No hay resultados.</div>';abBtns(el);return;}
  if(PQV==='juegos'){el.innerHTML='<div class="note">Cargando parques…</div>';svLoad('tiendas.js','TIENDAS',ok=>{const T=window.TIENDAS;if(!ok||!T||!T.juegos){el.innerHTML='<div class="note">Los parques infantiles llegarán con la próxima actualización de datos.</div>';return;}
      let L=T.juegos.filter(j=>!q||N(j[0]+' '+j[3]).includes(q)).map(j=>({j,k:pqKm(j[1],j[2])}));
      if(PQC&&MYPOS)L.sort((a,b)=>a.k-b.k);else if(!q){el.innerHTML=`<div class="note">${fmtN(T.juegos.length,0)} parques infantiles en Navarra. Escribe tu pueblo o toca «📍 Cerca de mí».</div>`;return;}
      el.innerHTML=`<div class="note">${fmtN(L.length,0)} parques</div>`+L.slice(0,PQN).map(({j,k})=>`<div class="st"><div style="flex:1"><b>🛝 ${esc(j[0]||'Parque infantil')}</b><div class="s">📍 ${esc(j[3])}${pqKmT(k)}</div></div><button class="btn" data-url="${esc(abMapsPt(j[1],j[2]))}">🧭</button></div>`).join('')+
        (L.length>PQN?`<div class="row"><button class="btn" id="pqMas">Ver más (${fmtN(L.length-PQN,0)})</button></div>`:'');abBtns(el);const mb=$('pqMas');if(mb)mb.onclick=()=>{PQN+=40;pqRender();};});return;}
  if(PQV==='rutas'){el.innerHTML='<div class="note">Cargando paseos…</div>';svLoad('rutas.js','RUTAS',ok=>{const R=window.RUTAS;if(!ok||!R){el.innerHTML='<div class="note">No se pudieron cargar las rutas.</div>';return;}
      let L=R.rutas.filter(r=>r.dif==='Fácil'&&r.km<=7&&(r.up||0)<=250&&(!q||N(r.n+' '+r.pueblo+' '+(r.muni||'')+' '+(r.zona||'')).includes(q)));
      L=L.map(r=>({r,k:r.pt?pqKm(r.pt[0],r.pt[1]):null}));if(PQC&&MYPOS)L.sort((a,b)=>(a.k??1e9)-(b.k??1e9));else L.sort((a,b)=>a.r.km-b.r.km);
      el.innerHTML=`<div class="note">${fmtN(L.length,0)} paseos fáciles (hasta 7 km y poco desnivel)</div>`+L.slice(0,PQN).map(({r,k})=>`<div class="st" data-ru="${esc(r.id)}" style="cursor:pointer"><div style="flex:1"><b>🥾 ${esc(r.n)}</b><div class="s">📍 ${esc(r.pueblo||'')}${pqKmT(k)} · ${fmtN(r.km,1)} km · ⬆️ ${r.up||0} m · ${r.circ?'🔁 circular':'↔️ lineal'}</div></div><span class="note">›</span></div>`).join('')+
        (L.length>PQN?`<div class="row"><button class="btn" id="pqMas">Ver más (${fmtN(L.length-PQN,0)})</button></div>`:'');
      el.querySelectorAll('[data-ru]').forEach(d=>d.onclick=()=>pqRuta(d.dataset.ru));const mb=$('pqMas');if(mb)mb.onclick=()=>{PQN+=40;pqRender();};});return;}
  // agenda infantil (agenda cultural)
  el.innerHTML='<div class="note">Cargando la agenda…</div>';let G=null;try{G=await jsLoad('agenda/cultura.json',{eventos:[]});}catch(e){}
  const hoy=hoyYmd(),E=((G&&G.eventos)||[]).filter(e=>(e.ff||e.f)>=hoy&&PQ_KW.test((e.t||'')+' '+(e.desc||'')+' '+(e.cat||''))).sort((a,b)=>(a.f<hoy?hoy:a.f).localeCompare(b.f<hoy?hoy:b.f));
  el.innerHTML=E.length?E.slice(0,60).map(e=>`<div class="st" style="align-items:flex-start"><div style="flex:1"><b>🎭 ${esc(e.t)}</b><div class="s">📅 ${e.ff&&e.ff!==e.f?'Hasta el '+fLarga(e.ff):fLarga(e.f)}${e.h?' · '+esc(e.h):''}</div><div class="s">📍 ${esc([e.lugar,e.pueblo].filter(Boolean).join(', '))}</div>${e.url?`<div class="s"><a href="${esc(e.url)}" target="_blank" rel="noopener">Más información ›</a></div>`:''}</div></div>`).join('')
    :'<div class="note">Ahora mismo no hay actividades infantiles en la agenda cultural. Mira también la 🎭 Agenda cultural completa.</div><div class="row"><button class="btn" onclick="showTab(\'cultura\')">🎭 Ver la agenda cultural</button></div>';}
// abrir la ficha de una ruta en Escapadas
function pqRuta(id){showTab('monte');let n=0;const t=setInterval(()=>{n++;try{if(typeof RU!=='undefined'&&RU.todas&&RU.todas.length){const r=RU.todas.find(x=>x.id===id);clearInterval(t);if(r&&typeof ruFicha==='function')ruFicha(r);return;}}catch(e){}if(n>40)clearInterval(t);},250);}
$('pqSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{PQV=b.dataset.v;PQN=40;pqRender();});
$('pqQ').oninput=e=>{PQQ=e.target.value;PQN=40;clearTimeout(pqRender.t);pqRender.t=setTimeout(pqRender,250);};
$('pqC').onclick=e=>abCerca(e.target,()=>{PQC=true;pqRender();});
svHook('peques',pqRender);

/* =====================================================================
   MENÚ, TÍTULOS, ICONOS Y ESCENAS
   ===================================================================== */
btnAfter(dsub('El tiempo'),'astro','lunacampo','🌙 La Luna y el campo');
btnAfter(dsub('Turismo'),'comer','cocina','🍲 Cocina tradicional');
btnAfter(dsub('Servicios'),'mercados','super','🛒 Supermercados y mercados');
btnAfter(dsub('Mi Espacio'),'sitios','misdep','⭐ Mi calendario deportivo');
btnAfter(dsub('Qué hacer'),'deporte','peques','🧸 Para los peques');
Object.assign(TITLES,{lunacampo:'🌙 La Luna y el campo',cocina:'🍲 Cocina tradicional',super:'🛒 Supermercados y mercados',misdep:'⭐ Mi calendario deportivo',peques:'🧸 Para los peques',comer:'🍽️ Dónde comer'});
try{Object.assign(PVS_ESC,{lunacampo:'cielo',cocina:'pueblo',super:'pueblo',misdep:'fiesta',peques:'bosque'});}catch(e){}
try{Object.assign(ICK,{lunacampo:'globe',cocina:'basket',super:'basket',misdep:'trend-up',peques:'tree'});Object.assign(ICC,{lunacampo:'#3949ab',cocina:'#e64a19',super:'#e64a19',misdep:'#e53935',peques:'#43a047'});}catch(e){}
try{Object.assign(BNK,{lunacampo:'i-tiempo',cocina:'i-comer',super:'i-comer',misdep:'i-trofeo',peques:'i-monte'});Object.assign(BNF,{lunacampo:'b',cocina:'r',super:'r',misdep:'r',peques:'g'});}catch(e){}
try{if(typeof applyIcons==='function')applyIcons((CFG.iconos||'pro')==='pro');}catch(e){}
})();
