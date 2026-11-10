 // web/arbustos.js - Módulo de Arbustos de Navarra para BasatiNA
// =======================================================
// CATÁLOGO BOTÁNICO DE ARBUSTOS DE NAVARRA (OFICIAL)
// BasatiNA - Son&Pe Technology Systems
// =======================================================

const ARBUSTOS_NAVARRA = [
  {
    id: "ezpela",
    nombre: "Boj",
    euskera: "Ezpela",
    cientifico: "Buxus sempervirens",
    zona: "Montaña, valles prepirenaicos y carrascales calizos",
    floracion: "Marzo a mayo",
    descripcion: "Arbusto perennifolio muy denso de madera extremadamente dura y pesada. Muy abundante en quejigales y laderas rocosas del norte y zona media.",
    usos: "Madera codiciada para torneado, cucharas, cuencos tradicionales e instrumentos. Planta muy tóxica si se ingiere.",
    color: "#2e7d32"
  },
  {
    id: "elorri-beltza",
    nombre: "Endrino",
    euskera: "Elorri beltza",
    cientifico: "Prunus spinosa",
    zona: "Orlas forestales, sotos y setos de toda Navarra",
    floracion: "Marzo a abril (antes de brotar las hojas)",
    descripcion: "Arbusto caducifolio muy espinoso que florece de forma espectacular en blanco. Produce bayas esféricas negro-azuladas muy astringentes.",
    usos: "Ingrediente imprescindible del tradicional Pacharán Navarro (patxaran). Los frutos se maceran en anís.",
    color: "#1565c0"
  },
  {
    id: "elorri-zuria",
    nombre: "Majuelo / Espino blanco",
    euskera: "Elorri zuria",
    cientifico: "Crataegus monogyna",
    zona: "Pastizales, setos y linderos de toda la comunidad",
    floracion: "Abril a junio",
    descripcion: "Arbusto o arbolillo espinoso de copa densa con flores blancas aromáticas y pequeños frutos rojos carnosos (majuelas) en otoño.",
    usos: "Uso medicinal tradicional como regulador del ritmo cardíaco y calmante natural. Alimento clave para aves en invierno.",
    color: "#c62828"
  },
  {
    id: "masusta",
    nombre: "Zarzamora",
    euskera: "Masustondoa / Larra",
    cientifico: "Rubus ulmifolius",
    zona: "Barrancos, orillas de caminos, bosques de ribera y ribazos",
    floracion: "Mayo a julio",
    descripcion: "Tallos arqueados de varios metros armados con fuertes aguijones curvados. Fruto compuesto (mora) que madura en negro en verano.",
    usos: "Consumo de frutos frescos, mermeladas y licores. Las hojas tiernas se han empleado en infusión astringente.",
    color: "#4a148c"
  },
  {
    id: "orrea",
    nombre: "Enebro común",
    euskera: "Orre arrunta",
    cientifico: "Juniperus communis",
    zona: "Matorrales despejados, pastizales secos y claros de bosque",
    floracion: "Primavera (bayas maduran al segundo o tercer año)",
    descripcion: "Arbusto perenne con hojas aciculares punzantes con una banda blanca superior. Produce gálbulos esféricos azulados oscuros.",
    usos: "Aromatización de destilados (ginebra), carnes de caza y remedios diuréticos y antisépticos.",
    color: "#37474f"
  },
  {
    id: "erromeroa",
    nombre: "Romero",
    euskera: "Erromeroa",
    cientifico: "Salvia rosmarinus",
    zona: "Bardenas Reales, Ribera y solanas de la Zona Media",
    floracion: "Casi todo el año (óptimo en primavera y otoño)",
    descripcion: "Arbusto aromático leñoso de hojas lineales verde oscuro y envés blanquecino, con flores violáceas muy melíferas.",
    usos: "Condimento culinario esencial, elaboración de alcohol de romero para fricciones musculares y planta melífera de gran valor.",
    color: "#3f51b5"
  },
  {
    id: "ezkaia",
    nombre: "Tomillo común",
    euskera: "Ezkaia",
    cientifico: "Thymus vulgaris",
    zona: "Estepas áridas de la Ribera, coscojares y pedregales soleados",
    floracion: "Marzo a junio",
    descripcion: "Mata leñosa baja muy resistente a la sequía, de olor penetrante característico y flores rosáceas o blanquecinas en glomérulos.",
    usos: "Antiséptico natural, infusión respiratoria tradicional de invierno y condimento de asados y guisos.",
    color: "#ad1457"
  },
  {
    id: "arrosondoa",
    nombre: "Escaramujo / Rosal silvestre",
    euskera: "Basaarrosa / Arrosondoa",
    cientifico: "Rosa canina",
    zona: "Bordes de caminos, prados de siega y matorrales húmedos",
    floracion: "Mayo a julio",
    descripcion: "Arbusto trepador con tallos espinosos y flores de pétalos rosas o blancos. Fruto elipsoide rojo vivo llamado escaramujo (tapaculos).",
    usos: "Frutos con una concentración altísima de vitamina C para mermeladas e infusiones. Hojas para infusiones digestivas.",
    color: "#d81b60"
  },
  {
    id: "sabukoa",
    nombre: "Saúco negro",
    euskera: "Intsusa beltza",
    cientifico: "Sambucus nigra",
    zona: "Sotos de ribera, bordes de arroyos y cercanías de caseríos húmedos",
    floracion: "Mayo a junio",
    descripcion: "Arbusto grande de ramas con médula esponjosa blanca, flores blancas en umbelas aplanadas muy fragantes y bayas negras colgantes.",
    usos: "Jarabes caseros contra catarros, flores fritas en buñuelos y elaboración de cordiales.",
    color: "#283593"
  },
  {
    id: "karraskila",
    nombre: "Coscoja",
    euskera: "Karraskila / Txaparroa",
    cientifico: "Quercus coccifera",
    zona: "Matorrales secos de la Ribera baja y Zona Media árida",
    floracion: "Abril a mayo",
    descripcion: "Mata leñosa muy ramificada y densa emparentada con la encina. Hojas pequeñas, coriáceas y fuertemente espinosas en el borde.",
    usos: "Fijación de suelos secos y pedregosos sometidos a erosión. Refugio cinegético y forraje de cabras.",
    color: "#558b2f"
  },
  {
    id: "gurbitza",
    nombre: "Madroño",
    euskera: "Gurbitza",
    cientifico: "Arbutus unedo",
    zona: "Laderas cálidas, barrancos silíceos y sierras de la vertiente media",
    floracion: "Octubre a diciembre (coincide con la maduración de los frutos)",
    descripcion: "Arbusto o arbolillo con hojas lustrosas dentadas. Produce frutos esféricos verrugosos que pasan de amarillo a rojo escarlata.",
    usos: "Frutos comestibles dulces al madurar. Elaboración tradicional de licores y mermeladas.",
    color: "#ef6c00"
  },
  {
    id: "ilarkia",
    nombre: "Brezo común / Brezo ceniciento",
    euskera: "Txilarra / Iñarra",
    cientifico: "Erica vagans / Calluna vulgaris",
    zona: "Brezales atlánticos, pastos altos del Baztan, Larraun y Quinto Real",
    floracion: "Julio a octubre",
    descripcion: "Mata de suelos ácidos y turberas con multitud de campanitas rosadas o moradas que cubren las laderas en verano.",
    usos: "Miel monofloral de brezo de gran calidad, escobas rústicas tradicionales y camas de ganado.",
    color: "#8e24aa"
  },
  {
    id: "ereñotza",
    nombre: "Laurel",
    euskera: "Ereñotza",
    cientifico: "Laurus nobilis",
    zona: "Barrancos resguardados, fondos de valles templados y riberas",
    floracion: "Marzo a abril",
    descripcion: "Arbusto siempreverde de porte esbelto con hojas coriáceas oscuras y onduladas muy aromáticas.",
    usos: "Hoja de condimento indispensable en la cocina tradicional. Propiedades digestivas y repelente natural.",
    color: "#1b5e20"
  },
  {
    id: "ezpina-beltza",
    nombre: "Espino cerval",
    euskera: "Otsalizarra / Karraskina",
    cientifico: "Rhamnus cathartica",
    zona: "Riberas secas, ribazos y orlas de quejigales",
    floracion: "Mayo a junio",
    descripcion: "Arbusto caducifolio de ramas frecuentemente espinosas con pequeñas drupas negras globosas en otoño.",
    usos: "Antiguo uso en tintorería tradicional (tintes amarillos y verdes) y remedios populares.",
    color: "#455a64"
  },
  {
    id: "astigarra",
    nombre: "Cornejo / Sanguino",
    euskera: "Zuhandor gorria",
    cientifico: "Cornus sanguinea",
    zona: "Bordes de arroyos, setos frescos y fondos de barrancos del norte y zona media",
    floracion: "Mayo a junio",
    descripcion: "Arbusto caducifolio cuyas ramas jóvenes adquieren un llamativo color rojo sangre en otoño e invierno.",
    usos: "Varas flexibles tradicionales empleadas en cestería rural y mangos de herramientas.",
    color: "#b71c1c"
  }
];

function renderArbustos(lista) {
  const contenedor = document.getElementById("catalogo-arbustos-lista");
  if (!contenedor) return;

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = `
      <div style="padding:24px; text-align:center; color:var(--muted); font-size:14px;">
        No se ha encontrado ningún arbusto que coincida con la búsqueda.
      </div>`;
    return;
  }

  contenedor.innerHTML = lista.map(item => `
    <div class="card" onclick="abrirFichaArbusto('${item.id}')" style="margin-bottom:10px; cursor:pointer; border-left:4px solid ${item.color};">
      <div style="display:flex; justify-content:space-between; align-items:baseline;">
        <b style="font-size:15px; color:var(--txt);">${item.nombre}</b>
        <span style="font-size:12px; color:var(--acc); font-style:italic;">${item.euskera}</span>
      </div>
      <div style="font-size:12px; color:var(--muted); font-style:italic; margin-top:2px;">${item.cientifico}</div>
      <div style="font-size:12px; color:var(--txt); margin-top:6px; line-height:1.4;">${item.zona}</div>
    </div>
  `).join("");
}

function abrirFichaArbusto(id) {
  const item = ARBUSTOS_NAVARRA.find(a => a.id === id);
  if (!item) return;

  const modalExistente = document.getElementById("modal-arbusto");
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement("div");
  modal.id = "modal-arbusto";
  modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;";
  modal.innerHTML = `
    <div style="background:var(--panel, #121a24); border:1px solid var(--line, #223244); border-radius:12px; max-width:440px; width:100%; padding:18px; box-sizing:border-box; max-height:90vh; overflow-y:auto; color:var(--txt, #fff);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <div>
          <h3 style="margin:0; font-size:18px; color:var(--txt, #fff);">${item.nombre}</h3>
          <span style="font-size:13px; color:var(--acc, #4caf50); font-weight:600;">${item.euskera}</span>
        </div>
        <button type="button" class="btn" onclick="document.getElementById('modal-arbusto').remove();" style="padding:4px 8px; font-size:14px; cursor:pointer;">✕</button>
      </div>

      <div style="font-size:12px; color:var(--muted, #90a4ae); font-style:italic; margin-bottom:12px;">${item.cientifico}</div>

      <div style="background:#090d13; padding:10px; border-radius:8px; font-size:13px; margin-bottom:10px; line-height:1.4;">
        <b>📍 Hábitat en Navarra:</b><br>${item.zona}
      </div>

      <div style="background:#090d13; padding:10px; border-radius:8px; font-size:13px; margin-bottom:10px; line-height:1.4;">
        <b>🌸 Floración:</b> ${item.floracion}
      </div>

      <div style="font-size:13px; margin-bottom:10px; line-height:1.5;">
        <b>Descripción:</b><br>${item.descripcion}
      </div>

      <div style="font-size:13px; line-height:1.5; color:#e0e0e0; border-top:1px solid var(--line, #223244); padding-top:8px;">
        <b>🌿 Usos y tradición:</b><br>${item.usos}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function iniciarCatalogoArbustos() {
  renderArbustos(ARBUSTOS_NAVARRA);

  const inputBuscador = document.getElementById("buscador-arbustos");
  if (inputBuscador && !inputBuscador.dataset.init) {
    inputBuscador.dataset.init = "1";
    inputBuscador.addEventListener("input", (e) => {
      // Sin tildes ni mayúsculas: "pacharan" encuentra "Pacharán"
      const norm = t => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const q = norm(e.target.value).trim();
      const filtrados = ARBUSTOS_NAVARRA.filter(item =>
        [item.nombre, item.euskera, item.cientifico, item.zona, item.descripcion, item.usos]
          .some(campo => norm(campo).includes(q))
      );
      renderArbustos(filtrados);
    });
  }
}

// Expone globalmente para que BasatiNA pueda llamarla en cualquier cambio de pestaña
window.iniciarCatalogoArbustos = iniciarCatalogoArbustos;
window.abrirFichaArbusto = abrirFichaArbusto;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarCatalogoArbustos);
} else {
  iniciarCatalogoArbustos();
}
