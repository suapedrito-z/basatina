 // web/arbustos.js - Módulo de Arbustos de Navarra para BasatiNA

const DATOS_ARBUSTOS_NAVARRA = [
  {
    id: "boj",
    nombreComun: "Boj",
    nombreEuskera: "Ezpela",
    nombreCientifico: "Buxus sempervirens",
    familia: "Buxaceae",
    habitat: "Pirineo, Prepirineo y Sierras de Leyre y Urbasa. Terrenos calizos y pedregosos.",
    floracion: "Marzo - Mayo",
    descripcion: "Arbusto perennifolio muy denso de madera noble y hojas opuestas y coriáceas. Clave en el sotobosque de los quejigales y pinares navarros.",
    usos: "Tradicionalmente usado para tallas finas de madera, cucharas y peines artesanos. Muy resistente al frío."
  },
  {
    id: "endrino",
    nombreComun: "Endrino",
    nombreEuskera: "Otabera / Patxarana",
    nombreCientifico: "Prunus spinosa",
    familia: "Rosaceae",
    habitat: "Común en toda Navarra: linderos de bosques, setos de la Zona Media y valles húmedos.",
    floracion: "Febrero - Abril (flores blancas antes de las hojas)",
    descripcion: "Arbusto caducifolio muy espinoso que forma setos densos. Produce bayas esféricas azulosas o casi negras cubiertas de cera (pruina).",
    usos: "El fruto (arañón / endrina) es el ingrediente esencial para la elaboración del pacharán navarro (patxaran)."
  },
  {
    id: "enebro-comun",
    nombreComun: "Enebro común",
    nombreEuskera: "Ipar-orrea",
    nombreCientifico: "Juniperus communis",
    familia: "Cupressaceae",
    habitat: "Pasto alpino, matorrales y bosques secos de la montaña y zona media navarra.",
    floracion: "Primavera",
    descripcion: "Arbusto perenne dioico de porte variable con hojas aciculares y punzantes que llevan una sola banda blanca en el haz.",
    usos: "Sus gálbulas (enebrinas) se usan como condimento culinario y aromatizante de bebidas espirituosas como la ginebra."
  },
  {
    id: "madrono",
    nombreComun: "Madroño",
    nombreEuskera: "Gurbitza",
    nombreCientifico: "Arbutus unedo",
    familia: "Ericaceae",
    habitat: "Barrancos cálidos del prepirineo y zonas abrigadas de la vertiente cantábrica y zona media.",
    floracion: "Octubre - Diciembre (coincide flor con el fruto maduro)",
    descripcion: "Arbusto grande o arbolillo de corteza rojiza, hojas dentadas lustrosas y frutos globosos carnosos de color rojo intenso y superficie granulada.",
    usos: "Frutos comestibles (para mermeladas y licores fermentados) y madera de combustión de alta calidad."
  },
  {
    id: "retama-garbancillo",
    nombreComun: "Garbancillo / Aliaga",
    nombreEuskera: "Ote zuria",
    nombreCientifico: "Genista scorpius",
    familia: "Fabaceae",
    habitat: "Muy abundante en la Zona Media, Bardenas Reales y Ribera. Matorrales xerófilos y parameras.",
    floracion: "Abril - Junio",
    descripcion: "Arbusto denso con espinas laterales muy fuertes y afiladas. En primavera se cubre por completo de flores amarillas vistosas.",
    usos: "Fijador de suelos erosionados en zonas secas. Tradicionalmente usado como combustible rápido para hornos de leña."
  }
];

function inicializarModuloArbustos() {
  const contenedor = document.getElementById("catalogo-arbustos-lista");
  if (!contenedor) return;

  renderizarListaArbustos(DATOS_ARBUSTOS_NAVARRA);

  const buscador = document.getElementById("buscador-arbustos");
  if (buscador) {
    buscador.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtrados = DATOS_ARBUSTOS_NAVARRA.filter(item =>
        item.nombreComun.toLowerCase().includes(q) ||
        item.nombreCientifico.toLowerCase().includes(q) ||
        (item.nombreEuskera && item.nombreEuskera.toLowerCase().includes(q)) ||
        item.habitat.toLowerCase().includes(q)
      );
      renderizarListaArbustos(filtrados);
    });
  }
}

function renderizarListaArbustos(lista) {
  const contenedor = document.getElementById("catalogo-arbustos-lista");
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.innerHTML = "<p style='color:#a0aec0;'>No se encontraron arbustos.</p>";
    return;
  }

  contenedor.innerHTML = lista.map(item => `
    <div style="background:#1a2332; border:1px solid #2d3748; border-radius:8px; padding:12px; margin-bottom:10px; cursor:pointer;" onclick="mostrarDetalleArbusto('${item.id}')">
      <div style="display:flex; justify-content:space-between; align-items:baseline;">
        <strong style="color:#e2e8f0; font-size:1.05rem;">${item.nombreComun} ${item.nombreEuskera ? `<span style='color:#718096; font-size:0.9rem;'>(${item.nombreEuskera})</span>` : ''}</strong>
        <em style="color:#63b3ed; font-size:0.85rem;">${item.nombreCientifico}</em>
      </div>
      <p style="color:#a0aec0; font-size:0.85rem; margin:6px 0 0 0;">📍 ${item.habitat}</p>
    </div>
  `).join("");
}

function mostrarDetalleArbusto(id) {
  const item = DATOS_ARBUSTOS_NAVARRA.find(a => a.id === id);
  if (!item) return;

  const modal = document.getElementById("modal-ficha-arbusto");
  const detalle = document.getElementById("detalle-arbusto");
  if (!modal || !detalle) return;

  detalle.innerHTML = `
    <h3 style="color:#63b3ed; margin-top:0;">${item.nombreComun} <small style='color:#a0aec0;'>(${item.nombreCientifico})</small></h3>
    ${item.nombreEuskera ? `<p style='color:#e2e8f0;'><strong>Euskera:</strong> ${item.nombreEuskera}</p>` : ''}
    <p style='color:#e2e8f0;'><strong>Familia:</strong> ${item.familia}</p>
    <p style='color:#e2e8f0;'><strong>Floración:</strong> ${item.floracion}</p>
    <hr style="border:0; border-top:1px solid #2d3748; margin:10px 0;">
    <p style='color:#cbd5e0; line-height:1.4;'><strong>Descripción:</strong> ${item.descripcion}</p>
    <p style='color:#cbd5e0; line-height:1.4;'><strong>Hábitat en Navarra:</strong> ${item.habitat}</p>
    <p style='color:#cbd5e0; line-height:1.4;'><strong>Usos:</strong> ${item.usos}</p>
  `;
  modal.style.display = "flex";
}

function ocultarDetalleArbusto() {
  const modal = document.getElementById("modal-ficha-arbusto");
  if (modal) modal.style.display = "none";
}

// Auto-arranque
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarModuloArbustos);
} else {
  inicializarModuloArbustos();
}
 
