# Vídeo de presentación de BasatiNA: recorre todas las pantallas con un rótulo que explica cada cosa.
# Se ejecuta en GitHub Actions (allí hay internet para los datos de verdad). Uso: python3 tools/video.py http://localhost:8765/
import os, sys, json, shutil, subprocess, urllib.request
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/"
OUT = "video_out"; FPS = 10
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)

def pyget(url):  # hace de "móvil": pide las páginas (SAIH, IDENA…) como hace la app de verdad
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) BasatiNA", "Accept": "*/*"}), timeout=40)
        return {"code": r.status, "body": r.read().decode("utf8", "ignore")}
    except urllib.error.HTTPError as e:
        return {"code": e.code, "body": ""}
    except Exception:
        return {"code": 0, "body": ""}

BRIDGE = """
window.AndroidNet = new Proxy({}, {get:(t,k)=>{
  if(k==='get')return (u,id)=>window.__pyGet(u).then(r=>window.__netCb(id,r.code,r.body));
  if(k==='updateWeb')return id=>setTimeout(()=>window.__netCb(id,200,'{"ok":false}'),50);
  if(k==='appVersion')return ()=>10; if(k==='webVersion')return ()=>999; if(k==='lastCrash')return ()=>'';
  return ()=>{};}});
try{localStorage.setItem('town','0');}catch(e){}
"""
CAPCSS = """#vcap{position:fixed;left:8px;right:8px;bottom:10px;z-index:200;background:rgba(8,14,22,.92);border:1px solid #29c6f2;border-radius:14px;
padding:10px 14px;color:#fff;font:15px/1.35 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5)}#vcap b{display:block;font-size:17px;color:#29c6f2;margin-bottom:2px}
#vcap:empty{display:none}#splash{z-index:150}"""

scene_no = [0]
class Scene:
    def __init__(s, pg): s.pg = pg; s.n = 0; scene_no[0] += 1; s.dir = f"{OUT}/s{scene_no[0]:02d}"; os.makedirs(s.dir)
    def shot(s, rep=1):
        p = f"{s.dir}/f{s.n:05d}.jpg"; s.pg.screenshot(path=p, type="jpeg", quality=92); s.n += 1
        for _ in range(rep - 1):
            q = f"{s.dir}/f{s.n:05d}.jpg"; os.link(p, q); s.n += 1
    def hold(s, sec): s.shot(max(1, int(sec * FPS)))
    def scroll(s, px, sec=3, el=None):
        steps = max(1, int(sec * FPS))
        for _ in range(steps):
            if el: s.pg.evaluate(f"document.querySelector('{el}').scrollBy(0,{px/steps})")
            else: s.pg.evaluate(f"window.scrollBy(0,{px/steps})")
            s.shot()

def cap(pg, title, text=""):
    pg.evaluate("([t,x])=>{let c=document.getElementById('vcap');if(!c){c=document.createElement('div');c.id='vcap';document.body.appendChild(c);}c.innerHTML=t?('<b>'+t+'</b>'+x):'';}", [title, text])

def tab(pg, t, wait=5):
    pg.evaluate(f"menu&&menu(false);showTab('{t}');window.scrollTo(0,0)"); pg.wait_for_timeout(wait * 1000); pg.evaluate("window.scrollTo(0,0)")

def page_scene(pg, t, title, text, wait=5, scroll=1400, hold=3.5, sec=6, extra=None):
    tab(pg, t, wait); sc = Scene(pg); cap(pg, title, text)
    if extra: extra(pg, sc)
    sc.hold(hold)
    if scroll: sc.scroll(scroll, sec); sc.hold(1.5)
    return sc

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={"width": 400, "height": 820}, device_scale_factor=1.8, locale="es-ES", timezone_id="Europe/Madrid")
    ctx.expose_function("__pyGet", pyget)
    ctx.add_init_script(BRIDGE)
    pg = ctx.new_page()
    pg.goto(BASE + "index.html"); pg.add_style_tag(content=CAPCSS)
    # 1. arranque
    sc = Scene(pg); cap(pg, "BasatiNA", "El río, el tiempo y la naturaleza de Navarra en una app.<br>Propiedad de Son&amp;Pe Technology Systems.")
    sc.hold(3); pg.wait_for_timeout(9000)
    # 2. inicio
    tab(pg, "mtiempo", 6); sc = Scene(pg)
    cap(pg, "🏠 Inicio: el tiempo en Navarra", "Mapa con la temperatura y el cielo en los pueblos de Navarra. Arriba eliges el día y la capa.")
    sc.hold(4.5)
    pg.click('#mtDayB'); pg.wait_for_timeout(600); cap(pg, "📅 Elige el día", "Hoy o cualquiera de los próximos días, por su nombre."); sc.hold(3)
    pg.click('#mtDayB'); pg.wait_for_timeout(300)
    for l, t, x in [("lluvia", "🌧️ Capa Lluvia", "Cuánto va a llover y dónde."), ("viento", "💨 Capa Viento", "Fuerza y dirección del viento, con las rachas."),
                    ("rios", "🌊 Capa Ríos", "Los ríos de Navarra en azul y sus estaciones de aforo con el caudal en directo.")]:
        pg.click(f'button[data-l="{l}"]'); pg.wait_for_timeout(2500); cap(pg, t, x); sc.hold(3.5)
    cap(pg, "🏠 Inicio", "Debajo del mapa, el resumen del día y las fuentes de los datos."); sc.scroll(700, 3); sc.hold(1.5)
    # 3. menú
    pg.evaluate("window.scrollTo(0,0);menu(true);document.querySelectorAll('#drawer .dgroup').forEach(g=>g.classList.add('open'))"); pg.wait_for_timeout(800)
    sc = Scene(pg); cap(pg, "☰ El menú", "Todo ordenado por grupos: Ríos, El tiempo, Qué hacer, Energía, NA sísmica, Son&amp;Pe y Actualizar.")
    sc.hold(3.5); sc.scroll(1500, 5, "#drawer"); sc.hold(2.5)
    pg.evaluate("document.querySelectorAll('#drawer .dgroup').forEach(g=>g.classList.remove('open'));menu(false)")
    # 4. pantallas
    S = [
      ("caudal", "📊 Caudal de los ríos", "En directo del SAIH Ebro: Arga, Irati, Ega, Aragón y Ebro. Embalse de Eugui con su % de llenado. Semáforo verde, amarillo o rojo según el caudal.", 8, 1800),
      ("hist", "📜 Datos históricos", "Cómo han ido los ríos y las grandes riadas del pasado.", 6, 1200),
      ("libre", "🎚️ Mapa de riadas", "Elige un caudal y mira qué zonas se inundarían a lo largo del río.", 7, 900),
      ("prev", "🔮 Previsiones", "Cómo puede subir el río con la lluvia prevista para los próximos días.", 7, 1200),
      ("sim", "▶️ Simulador", "Animación de los próximos días: la lluvia y la subida del río, hora a hora.", 7, 900),
      ("tiempo", "🌦️ El tiempo", "El tiempo en tu pueblo: ahora y próximos días, avisos de AEMET, calidad del aire, polen, índice UV, sol y luna y cota de nieve.", 7, 2200),
      ("clima", "📈 Histórico del clima", "Temperaturas y lluvias de años anteriores para comparar con este.", 8, 1400),
      ("monte", "🥾 Salir al monte", "Rutas, GR, vías verdes, Camino de Santiago por etapas, cuevas, cascadas, miradores, zonas de baño, fuentes y patrimonio. Toca un punto y te dice el tiempo allí.", 8, 1800),
      ("pesca", "🎣 Pesca", "Tramos oficiales de pesca de cada río (IDENA) y sus normas.", 7, 1400),
      ("caza", "🦌 Caza", "Calendario de la temporada 2026‑27: qué se puede cazar cada día, y mapa con puestos de paloma, monterías, reservas y refugios.", 7, 1600),
      ("natura", "🌿 Naturaleza", "Setas, frutos, fauna y vegetación de cada mes, y los árboles de cada zona de Navarra.", 6, 1800),
      ("sismo", "🌍 Terremotos y fallas", "Terremotos recientes en Navarra y alrededores, fallas activas y placas.", 7, 1400),
      ("energia", "⚡ Energía en Navarra", "Eólica y solar hora a hora (estimado), producción real de Red Eléctrica por meses con el factor de capacidad, y el mapa con los 65 parques eólicos, los 1.422 molinos y las plantas solares.", 9, 2600),
      ("ajustes", "⚙️ Ajustes y avisos", "Tu pueblo, tamaño de letra, tema claro u oscuro y los avisos al móvil si el río sube.", 3, 1200),
      ("about", "ℹ️ Acerca de", "Qué es la app, de dónde salen los datos y quién la ha hecho: Son&amp;Pe Technology Systems.", 3, 2200),
    ]
    for t, ti, tx, w, sc_px in S:
        try: page_scene(pg, t, ti, tx, wait=w, scroll=sc_px, sec=max(4, sc_px / 300))
        except Exception as e: print("fallo escena", t, e, flush=True)
    # 5. zona técnica (oculta)
    try:
        pg.evaluate("TECH=true;techApply()")
        sc = page_scene(pg, "pueblos", "🔧 Zona técnica · 🏘️ Pueblos", "De momento oculta (logo 5 veces + PIN). Los 945 pueblos de Navarra de la A a la Z.", wait=4, scroll=0, hold=3.5)
        pg.fill('#pbQ', 'zubiri'); pg.wait_for_timeout(400); cap(pg, "🏘️ Pueblos", "Buscas el pueblo…"); sc.hold(2)
        pg.click('#pbList [data-i]'); pg.wait_for_timeout(6000); pg.evaluate("window.scrollTo(0,0)")
        cap(pg, "🏘️ Ficha del pueblo", "Altitud, habitantes, superficie, el tiempo, la vegetación y lo que hay cerca. Y la historia, fiestas, gastronomía y fotos que escribís Sonia y tú.")
        sc.hold(4); sc.scroll(1600, 6); sc.hold(2)
    except Exception as e: print("fallo pueblos", e, flush=True)
    # final
    pg.evaluate("TECH=false;techApply();showTab('about');window.scrollTo(0,document.body.scrollHeight)"); pg.wait_for_timeout(1500)
    sc = Scene(pg); cap(pg, "BasatiNA", "Propiedad de Son&amp;Pe Technology Systems · Sonia y Pedro · 2026"); sc.hold(4)
    br.close()

# ---- montaje: un archivo por escena y luego todos juntos ----
parts = []
for d in sorted(os.listdir(OUT)):
    if not d.startswith("s"): continue
    tmp, fin = f"{OUT}/{d}.tmp.mp4", f"{OUT}/{d}.mp4"
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{OUT}/{d}/f%05d.jpg",
                        "-vf", "scale=720:-2,fps=30,fade=in:0:8,format=yuv420p", "-c:v", "libx264", "-crf", "21", "-preset", "veryfast", "-pix_fmt", "yuv420p", tmp])
    if r.returncode == 0: os.rename(tmp, fin); parts.append(fin)
open(f"{OUT}/list.txt", "w").write("".join(f"file '{os.path.basename(x)}'\n" for x in parts))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{OUT}/list.txt", "-c", "copy", "-movflags", "+faststart", "BasatiNA_presentacion.mp4"], check=True)
print("hecho", os.path.getsize("BasatiNA_presentacion.mp4") // 1024, "KB")
