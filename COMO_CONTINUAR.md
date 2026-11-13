# BasatiNA: cómo seguir trabajando en la app

Guía para cualquier persona o asistente de IA (Claude, ChatGPT, Gemini…) que vaya a continuar con el proyecto.
**Léela entera antes de tocar nada.**

Propiedad de **Son&Pe Technology Systems** (Sonia y Pedro).

## 1. Qué es

- **BasatiNA** es una app Android para Navarra: ríos y riadas (SAIH Ebro), el tiempo, radar, carreteras, cámaras, energía, monte, caza, pesca, naturaleza, terremotos, pueblos…
- La app Android es solo una «ventana» (WebView). **Toda la pantalla está en `web/index.html`**, un solo archivo HTML+JS grande.
- El móvil descarga la pantalla nueva sola desde GitHub, así que la mayoría de cambios **no necesitan APK nueva**.

## 2. Archivos importantes

| Archivo | Qué es |
|---|---|
| `web/index.html` | Toda la app: HTML, estilos y JavaScript |
| `web/version.json` | Versión de la pantalla. **Se regenera con `python3 tools/make_version.py` después de cada cambio en `web/`** |
| `web/*.js` (rios, pesca, caza, monte, sismo, pueblos, energia, viaje, agenda) | Datos generados por GitHub Actions. No editar a mano |
| `web/eu.js` | Motor de traducción + diccionario de euskera |
| `web/idiomas.js` | Diccionarios nuevos: euskera (textos nuevos), inglés y francés. Clave = texto exacto en castellano |
| `web/novedades.js` | Cambios del 13 nov. 2026 (ver abajo). Se carga el último |
| `tools/*.py` | Scripts que descargan datos (los ejecuta GitHub Actions, que sí tiene internet) |
| `.github/workflows/*.yml` | Tareas automáticas: `build.yml` compila la APK; el resto actualiza datos |
| `app/src/main/java/es/pedrito/controlarga/` | Código Android: `MainActivity` (WebView + puente `AndroidNet`), `RiverJob` (avisos en segundo plano), `RiverWidget` |
| `app/build.gradle` | `versionCode` / `versionName` de la APK. Súbelo si cambias algo de Android |
| `config/*.json` | Claves de servicios (TomTom, AEMET). Las guarda la propia app desde el modo administrador |
| `pueblos/` | Historia, fiestas y fotos que escriben Pedro y Sonia desde la app |

## 3. Reglas para no romper nada

1. **Haz siempre `git pull` antes de editar** y edita la última versión de `web/index.html`. Ya se perdió trabajo una vez por editar una copia vieja.
2. **No borres ni reescribas secciones enteras.** Cada parte nueva se añade al final del último `<script>` y se engancha envolviendo `showTab`:
   `const _x=showTab;showTab=function(t){_x(t);if(t==='mipantalla')miInit();};`
3. **Cada pantalla** es un `<section id="t-NOMBRE">`, más un botón en el menú `<button data-t="NOMBRE">` y su título en `TITLES`.
4. **Después de tocar `web/`**: ejecuta `python3 tools/make_version.py`, haz commit y push. La APK se compila sola en GitHub Actions.
5. **Internet desde la app**:
   - Las webs que no permiten CORS (SAIH, Gobierno de Navarra, Ministerio…) se piden con `netGet(url)`, que usa el puente Android y solo funciona dentro de la app (`APP===true`).
   - Las que sí lo permiten se piden con `fetch`.
6. **No pongas contraseñas ni claves en el código.** Las claves van en `config/*.json` y se guardan desde la app (modo administrador). La firma de la APK usa los secretos de GitHub `KEYSTORE_B64` (la llave .jks en base64) y `KEYSTORE_PASS` (su contraseña). La llave NO va en el repositorio (es público). No crear nunca una llave nueva: los móviles dejarían de poder actualizar.
7. **Siempre en español**, y si puedes añade el texto en `web/idiomas.js` (euskera, inglés y francés). Pon cada palabra traducible en su propio `<span>` si va mezclada con números. Mensajes claros, sin tecnicismos.
8. **Aviso que debe seguir saliendo**: «⚠️ ANTE EL RIESGO, HAZ CASO SIEMPRE A LOS AVISOS OFICIALES».

## 4. Funciones útiles que ya existen en `index.html`

- **Mapas**: `NavMap(idCanvas, dibujar, tocar)` hace un mapa de Navarra con zoom y fondo del IGN. `drawTiles(...)` pinta capas de teselas XYZ encima.
- **Tiempo**: `getJSON(url)` (Open‑Meteo, con `OM` y `TZ`), `wxIcon(code,hora)`, `wDesc(code)`.
- **Formato y cálculo**: `fmtN(número,decimales)`, `km(lat1,lon1,lat2,lon2)`, `ymd(fecha)`.
- **Interfaz**: `toast(texto)`, `menu(true/false)`, `showTab('nombre')`.
- **Modo administrador** (en el código sigue llamándose «zona técnica»): variable `TECH` y función `techApply()`. Los elementos con clase `tech` solo se ven ahí.
- **GitHub desde la app**: `ghTok()`, `ghPut(ruta, base64, mensaje, sha)` (lo usan Pueblos y las claves).

## 5. Modo administrador (antes «zona técnica»)

- **Cómo se entra**: tocar 5 veces el logo y meter el PIN. La primera vez en cada móvil pide la llave de edición de GitHub.
- **Qué hay dentro**: Agenda de fiestas, Modo científico, SAIH, las casillas de claves, 📊 Descargas de la app (lee `download_count` de las releases de GitHub) y, en «Fotos de la gente», la subida de fotos de Instagram.
- **Fotos (desde nov. 2026)**: «Fotos de la gente» es pública. «Envía tu foto» (el formulario con alias y correo) sigue solo en el modo administrador hasta resolver el tratamiento de datos personales. Mientras, los administradores suben fotos de Instagram con permiso del autor (solo se guarda el @usuario).
- **Huella automática**: `.github/workflows/version.yml` ejecuta `tools/make_version.py` en cada push que toque `web/`, así que editar a mano en la web de GitHub también llega a los móviles.
- **Listas editables desde la app** (modo administrador): `agenda/cultura.json` (Agenda cultural), `deporte/partidos.json` (Deporte navarro), `avisos/escapadas.json` (avisos de «Antes de salir hoy»). Helpers `jsLoad`/`jsEdit`.
- **Datos abiertos de Navarra** (`tools/abiertos.py`, robot `abiertos.yml` cada lunes → `web/abiertos.js`, se carga solo al abrir Turismo): alojamientos, restaurantes, museos, arte y monumentos, festivos locales (salen en la Agenda cultural) y productos típicos/recetas. Usa la API CKAN (`package_show`) por nombre de conjunto; alojamientos y restaurantes se sitúan en su pueblo con `web/pueblos.js`. `python3 tools/abiertos.py --explorar` lista los campos en `tools/abiertos_info.txt`.
- **Bici** (`tools/bici.py`, robot `bici.yml` los martes → `web/bici.js`, ~2 MB, se carga solo al activar una capa de bici en Escapadas): capas de IDENA (DOTACI_Lin_RutasBTT, EuroVelo1/3, INFRAE_*SIGMC: red ciclista, puntos de riesgo, aparcabicis, servicios) y salidas de rutas de carretera/gravel de visitnavarra.es (sus GPX dan 404 en la web oficial: solo ponemos el pueblo de salida y el enlace). El SIG de Pamplona (sig.pamplona.es) no responde desde GitHub.
- **Manuales**: `manuales/` tiene el manual de usuario en PDF. El de administrador es interno y **no se sube aquí** (el repositorio es público): lo guardan Pedro y Sonia.

- **Localidades** (antes «Pueblos», pantalla `pueblos`): ya es pública, en su propio grupo del menú. Editar sigue siendo solo para administradores.
- **Actualizar datos**: ya no hay botón 🔄 arriba; se desliza la pantalla hacia abajo estando arriba del todo (llama a `dRefresh`).
- **Inicio**: debajo del mapa sale «La semana en Navarra» (`seInit` → `#seBody`), ya no hay accesos rápidos.
- **Avisos**: cada aviso usa `avDet(principal, detalles)`: la parte en negrita a la vista y el resto en un desplegable.
- **Diseño «Navarra viva» (nov. 2026)**: el inicio tiene un paisaje animado (`#pvBox`, funciones `pv*`) con el cielo según la hora y el tiempo real de Pamplona. Cada sección lleva arriba una escena animada de su tema (`#pvSec`, funciones `pvs*`). **Si añades una sección nueva, ponla en `PVS_ESC`** con una de estas escenas: cielo, agua, bosque, carretera, sismo, energia, pueblo, fiesta, topo, bokeh (si no, sale «aurora»). Para probar el tiempo a mano: `pvDemo(código, hora)`; `pvDemo()` vuelve a lo real.
- **Ojo al editar a mano en GitHub**: el 10 nov. 2026 una edición borró sin querer la sección Escapadas (`t-monte`) al pegar la de Arbustos. Después de editar, comprueba que siguen estando todas las `<section id="t-…">`.

- **Pantallas nuevas (12 nov. 2026)** en `web/servicios-ui.js` (se carga antes de `naturaleza-catalogo.js`):
  - El tiempo: tarjeta `#tPP` con presión atmosférica (reloj, tendencia) y polen por tipos (Open‑Meteo / CAMS). Se pinta al envolver `extraRender`.
  - 🔭 `astro`: fases de la Luna calculadas (Meeus), lluvias de estrellas, solsticios y eclipses (`AS_LL`, `AS_FIJOS`: **añadir ahí los de 2029 en adelante**). Aviso en el Inicio (`#asBanner`) del día del fenómeno y los 2 anteriores.
  - Grupo «Servicios»: 💊 `farmacia` (farmacias de IDENA con su zona de guardia + enlace a las guardias oficiales), 🧺 `mercados` (lista editable `mercados/mercados.json`; si no existe, sale la lista de `MK_DEF`), 🚌 `bus` (paradas de villavesa con enlace a tiempo real, autobuses, taxis y empresas).
  - Vida silvestre: 🦉 `biodiversidad` (sustituye al catálogo de `naturaleza-catalogo.js`, cuyas 13 fichas revisadas se añaden dentro), 🌱 `medic` (`ME_P`, texto fijo) y 🏞️ `enp` (espacios protegidos, monumentos naturales, zonas húmedas y Red Natura).
  - Robots: `tools/servicios.py` (`servicios.yml`, día 3 de cada mes → `web/servicios.js`) y `tools/especies.py` (`especies.yml`, día 9 → `web/especies.js`; GBIF + Wikipedia, ~1.200 especies, guarda caché en `tools/especies_cache.json`).
- **Agenda cultural**: buscador por localidad (`#agPue`, variable `AGPUE`), filtra también los festivos locales.

## 6. Cosas pendientes o ideas

- **Asistente con IA dentro de la app**: solo con la clave protegida en un servidor, nunca en el repositorio público.
- **Radar con previsión (Rainbow.ai)**: preparado, pero sin clave, porque pide tarjeta.

- **Novedades 13 nov. 2026** (`web/novedades.js`, versión de la APK 3.8 / código 18):
  - «BasatiNA» sale siempre con la **NA en rojo** (un vigilante cambia el texto en cualquier pantalla; en la web, `naRojo()` en `docs/index.html`).
  - Vida silvestre: «🦉 Flora y fauna» (antes «Flora, fauna y setas») con el filtro **🌿 Arbustos** dentro (las fichas de `arbustos.js` se añaden a `ESPECIES`). La pantalla `arbustos` lleva ahí.
  - **Retirado**: «Fichas de flora» (`fichas-arboles.js` y sus datos), el script `naturaleza-catalogo.js` ya no se carga (sigue en `web/` solo como fuente de `tools/especies.py`) y se borraron los robots de parches de una sola vez (`naturaleza-*.yml`, `vida-silvestre-solo-identificador.yml`, `fichas-arboles.yml`, `verificar-fichas.yml`): podían volver a meter código viejo en `index.html`.
  - Inicio → **«Ahora en Navarra»**: carrusel (`anLoad`/`anDraw`) con agenda cultural, deporte, mercados, cielo, tu calendario y aviso de salud de hoy, mañana y pasado. Cambia cada 10 s; filtros Todo/Cultura/Deporte/Otros.
  - Grupo **NA Salud** (`salud`): presión y dolores de cabeza, articulaciones, calor/frío, UV, aire y polen (`saCalc`), diario de dolores (solo en el móvil, `saDiario` en localStorage), teléfonos 112 y Toxicología. Plantas medicinales y Farmacias se han movido aquí.
  - **Idioma**: botón «Castellano · Euskara · English · Français» en Configuración. Los grupos del menú guardan su nombre en castellano en `data-k`, así el código los encuentra en cualquier idioma.
  - **Seguridad**: los enlaces externos se abren fuera de la app; el PIN se bloquea tras 5 fallos (30 s, 1 min…); en Android, el WebView solo abre pantallas propias, `AndroidNet.get` solo acepta http/https, `openUrl` solo web/correo/teléfono/mapas y la actualización ignora nombres de archivo raros.

- **Google Play (13 nov. 2026)**: la app apunta a Android 16 (API 36) y desde la versión 4.0 (código 20) su identificador es **`es.sonpe.basatina`** (antes `es.pedrito.controlarga`). **No se puede volver a cambiar nunca.** El paquete Java sigue siendo `es.pedrito.controlarga` (eso da igual).
  - Para el móvil es otra app: en Ajustes está **📦 Copia de mis datos** (guardar/recuperar un .json con localStorage y las fotos de IndexedDB, sin `ghTok` ni el PIN). La app antigua (código < 20) muestra «BasatiNA se muda» (`bnMudanza`).
  - GitHub fabrica el `.aab` para Google Play (Actions → Construir APK → Artifacts). Política de privacidad: `docs/privacidad.html`.
- **Actualización sola (13 nov. 2026)**: `checkUpdate` (envuelto en `novedades.js`) mira si hay pantalla nueva al abrir la app, al volver a ella y cada 30 min, y la aplica sola en el Inicio si no estás escribiendo. La APK desde la web sigue necesitando que el usuario la instale; la de Google Play se actualiza sola desde Play.
- **Ahora en Navarra**: los eventos cambian cada 3 s. Encima, tarjeta de ríos por zonas (`rz*`): Arga alta (Huarte/Eugui), media (Burlada/Pamplona/Arazuri) y baja (Funes/Etxauri); Irati, Ega, Aragón y Ebro con las estaciones que la app ya conoce de «Ríos» (`RIVST`), partidas en tres zonas según hacia dónde corre el río. Solo en la app.

- **📜 Dato del día (13 nov. 2026, APK 4.3 / código 23)**: tarjeta «Tal día como hoy» en el Inicio, encima de «La semana en Navarra» (`web/efemerides.js`), y aviso cada mañana en el móvil (`RiverJob.checkDato`, se activa en Ajustes → «📜 Dato del día», con hora a elegir).
  - Datos en **`efemerides/navarra.json`**: `dias` con clave `MM-DD` (lista de datos `{a, t, txt, cat, fuente, ok}`) y `curiosidades` (salen, rotando, los días sin dato propio). `ok:true` = revisado por Pedro o Sonia. Se edita a mano en GitHub o desde la app en modo administrador (tocar la tarjeta → ✏️).
  - **Sin política**: nada de elecciones, partidos, gobiernos, guerras ni atentados. Hay un filtro de palabras (`EF_NO` en `efemerides.js` y `NO_DATO` en `RiverJob.java`, **deben ser iguales**) y una lista extra `prohibidas` en el JSON que se puede ampliar sin programar.
  - El primer lote (34 días + 19 curiosidades) está **sin revisar** (`ok:false`): comprobad fechas y textos con la fuente antes de darlo por bueno.
  - **Personaje de la semana (APK 4.4 / código 24)**: `semanas` en el JSON = `[{desde:'AAAA-MM-DD' (el sábado en que empieza), personaje, fuente?, dias:[7 datos {t, txt, fuente?}, de sábado a viernes]}]`. Tiene prioridad sobre `dias` y `curiosidades`. Lo leen `efSemana` (web) y `checkDato` (Java).
