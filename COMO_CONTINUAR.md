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
| `web/eu.js` | Traducciones al euskera |
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
6. **No pongas contraseñas ni claves en el código.** Las claves van en `config/*.json` y se guardan desde la app (modo administrador). La firma de la APK usa el secreto `KEYSTORE_PASS` de GitHub.
7. **Siempre en español** (y euskera en `eu.js` si se puede). Mensajes claros, sin tecnicismos.
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
- **Qué hay dentro**: Pueblos (en pruebas), Agenda de fiestas, Modo científico, SAIH, las casillas de claves, 📊 Descargas de la app (lee `download_count` de las releases de GitHub) y, en «Fotos de la gente», la subida de fotos de Instagram.
- **Fotos (desde nov. 2026)**: «Fotos de la gente» es pública. «Envía tu foto» (el formulario con alias y correo) sigue solo en el modo administrador hasta resolver el tratamiento de datos personales. Mientras, los administradores suben fotos de Instagram con permiso del autor (solo se guarda el @usuario).
- **Huella automática**: `.github/workflows/version.yml` ejecuta `tools/make_version.py` en cada push que toque `web/`, así que editar a mano en la web de GitHub también llega a los móviles.
- **Listas editables desde la app** (modo administrador): `agenda/cultura.json` (Agenda cultural), `deporte/partidos.json` (Deporte navarro), `avisos/escapadas.json` (avisos de «Antes de salir hoy»). Helpers `jsLoad`/`jsEdit`.
- **Datos abiertos de Navarra** (`tools/abiertos.py`, robot `abiertos.yml` cada lunes → `web/abiertos.js`, se carga solo al abrir Turismo): alojamientos, restaurantes, museos, arte y monumentos, festivos locales (salen en la Agenda cultural) y productos típicos/recetas. Usa la API CKAN (`package_show`) por nombre de conjunto; alojamientos y restaurantes se sitúan en su pueblo con `web/pueblos.js`. `python3 tools/abiertos.py --explorar` lista los campos en `tools/abiertos_info.txt`.
- **Manuales**: `manuales/` tiene el manual de usuario en PDF. El de administrador es interno y **no se sube aquí** (el repositorio es público): lo guardan Pedro y Sonia.

## 6. Cosas pendientes o ideas

- **Pueblos**: abrirlo a todo el mundo cuando tenga contenido.
- **Asistente con IA dentro de la app**: solo con la clave protegida en un servidor, nunca en el repositorio público.
- **Radar con previsión (Rainbow.ai)**: preparado, pero sin clave, porque pide tarjeta.
