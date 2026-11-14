"""
RUTAS DE NAVARRA EN OPENSTREETMAP (primer paso: contarlas y ver cómo clasificarlas).

Qué hace, paso a paso:
 1. Pide a la API Overpass de OpenStreetMap todas las rutas a pie (senderismo, a pie, paseo) que tocan Navarra,
    y aparte cuenta las de bici y BTT para tenerlas en cuenta más adelante.
 2. De cada ruta saca: nombre, matrícula (GR 11, PR-NA 120, SL-NA 50…), red (internacional, nacional, regional,
    local), de dónde sale y a dónde llega (si OSM lo dice), los km (sumando sus tramos), si es circular o lineal,
    el punto de salida y el pueblo de Navarra más cercano a ese punto (con web/pueblos.js).
 3. Guarda la lista en rutas/osm_rutas.json y un resumen legible en rutas/rutas_info.txt.

Todavía NO toca la app (nada en web/). Licencia de los datos: © colaboradores de OpenStreetMap, ODbL
(hay que poner la atribución en la app cuando se usen).
"""
import json, math, re, time, urllib.request, urllib.parse, collections, os

UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)"}
# Varios servidores de Overpass: si uno falla o está saturado se prueba el siguiente
SERVIDORES = ["https://overpass-api.de/api/interpreter",
              "https://overpass.private.coffee/api/interpreter",
              "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
# Navarra en OSM: la región con código ISO ES-NA. «out geom» trae también el dibujo de cada tramo.
Q_PIE = """[out:json][timeout:600];
area["ISO3166-2"="ES-NA"]["admin_level"="4"]->.na;
rel["type"="route"]["route"~"^(hiking|foot|walking)$"](area.na);
out geom;"""
Q_BICI = """[out:json][timeout:300];
area["ISO3166-2"="ES-NA"]["admin_level"="4"]->.na;
rel["type"="route"]["route"~"^(bicycle|mtb)$"](area.na);
out tags;"""
# Caja aproximada de Navarra, para saber cuántos km de cada ruta caen dentro (las largas como el GR 11 siguen fuera)
CAJA = (41.90, 43.32, -2.51, -0.72)


def overpass(q):
    for s in SERVIDORES:
        for intento in range(2):
            try:
                print("Overpass:", s, flush=True)
                data = urllib.parse.urlencode({"data": q}).encode()
                r = urllib.request.urlopen(urllib.request.Request(s, data=data, headers=UA), timeout=900)
                return json.loads(r.read())
            except Exception as e:
                print("  falló:", e, flush=True); time.sleep(20)
    raise SystemExit("Ningún servidor de Overpass contestó")


def km(a, b):  # distancia en km entre dos puntos (lat, lon), fórmula del haversine
    p1, p2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1] - a[1]); dp = p2 - p1
    return 12742 * math.asin(min(1, math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2)))


def dentro(p): return CAJA[0] <= p[0] <= CAJA[1] and CAJA[2] <= p[1] <= CAJA[3]


# Pueblos de Navarra (para poner a cada ruta el pueblo de salida y su municipio)
t = open("web/pueblos.js", encoding="utf-8").read()
PU = json.loads(t[t.index("{"):t.rindex("}") + 1])
PUEBLOS, MUNIS = PU["pueblos"], PU["municipios"]


def pueblo_cerca(p):
    best = min(PUEBLOS, key=lambda x: km(p, x["pt"]))
    return best["n"], MUNIS.get(best["m"], {}).get("n", ""), round(km(p, best["pt"]), 1)


def tipo_ref(ref, red, nombre):
    """Clasifica la ruta por su matrícula: GR, PR, SL, Camino de Santiago u otra."""
    r = (ref or "").upper().replace(" ", "")
    n = (nombre or "").lower()
    if "santiago" in n or "camino francés" in n or "camino frances" in n: return "Camino de Santiago"
    if r.startswith("GRT"): return "GRT (transfronterizo)"
    if r.startswith(("GR", "E.GR", "EGR")): return "GR"
    if r.startswith("PR"): return "PR"
    if r.startswith("SL"): return "SL"
    if red in ("iwn", "nwn"): return "Otra de gran recorrido"
    return "Otra (sin matrícula)"


pie = overpass(Q_PIE)["elements"]
rutas = []
for el in pie:
    tg = el.get("tags", {})
    tramos = [m for m in el.get("members", []) if m.get("type") == "way" and m.get("geometry")
              and m.get("role", "") not in ("alternative", "excursion", "approach", "connection")]
    total = nav = 0.0; puntas = collections.Counter(); primero = None
    for m in tramos:
        g = [(p["lat"], p["lon"]) for p in m["geometry"] if p]
        if len(g) < 2: continue
        primero = primero or g[0]
        for a, b in zip(g, g[1:]):
            d = km(a, b); total += d
            if dentro(a) and dentro(b): nav += d
        # las puntas de cada tramo: las que solo aparecen una vez son los extremos de la ruta
        for p in (g[0], g[-1]): puntas[(round(p[0], 4), round(p[1], 4))] += 1
    extremos = [p for p, c in puntas.items() if c == 1]
    forma = "circular" if not extremos else "lineal" if len(extremos) == 2 else "con ramales/huecos"
    salida = extremos[0] if extremos else primero
    if not salida: continue
    pn, mn, dpu = pueblo_cerca(salida)
    nombre = tg.get("name") or tg.get("name:es") or tg.get("name:eu") or ""
    rutas.append({
        "id": el["id"], "nombre": nombre, "ref": tg.get("ref", ""), "red": tg.get("network", ""),
        "tipo": tipo_ref(tg.get("ref"), tg.get("network"), nombre), "route": tg.get("route", ""),
        "desde": tg.get("from", ""), "hasta": tg.get("to", ""), "operador": tg.get("operator", ""),
        "km": round(total, 1), "km_navarra": round(nav, 1), "forma": forma,
        "salida": [round(salida[0], 5), round(salida[1], 5)], "pueblo": pn, "municipio": mn, "dist_pueblo": dpu,
        "descripcion": tg.get("description", "")[:200], "web": tg.get("website", "") or tg.get("url", ""),
        "dificultad_osm": tg.get("sac_scale", "") or tg.get("difficulty", ""),
    })

bici = overpass(Q_BICI)["elements"]
os.makedirs("rutas", exist_ok=True)
json.dump({"t": time.strftime("%Y-%m-%d"), "licencia": "© colaboradores de OpenStreetMap (ODbL)", "rutas": rutas},
          open("rutas/osm_rutas.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)

# ---------------- Resumen legible ----------------
L = []; C = collections.Counter
utiles = [r for r in rutas if r["km_navarra"] >= 0.5]
L.append(f"RUTAS A PIE EN OPENSTREETMAP QUE TOCAN NAVARRA ({time.strftime('%Y-%m-%d')})")
L.append(f"Total: {len(rutas)} · con al menos 0,5 km dentro de Navarra: {len(utiles)} · con nombre: {sum(bool(r['nombre']) for r in utiles)}")
L.append(f"Rutas de bici/BTT (solo contadas): {len(bici)} · " + ", ".join(f"{k}: {v}" for k, v in C(e['tags'].get('route') for e in bici).items()))


def bloque(titulo, cnt):
    L.append(f"\n## {titulo}")
    for k, v in cnt.most_common(): L.append(f"- {k or '(sin dato)'}: {v}")


bloque("Por tipo (matrícula)", C(r["tipo"] for r in utiles))
bloque("Por red OSM (iwn internacional, nwn nacional, rwn regional, lwn local)", C(r["red"] for r in utiles))
bloque("Por forma", C(r["forma"] for r in utiles))


def tramo(k):
    return "menos de 5 km" if k < 5 else "5-10 km" if k < 10 else "10-20 km" if k < 20 else "20-40 km" if k < 40 else "más de 40 km"


bloque("Por distancia (km dentro de Navarra)", C(tramo(r["km_navarra"]) for r in utiles))
bloque("Por municipio de salida (los 40 con más rutas)", C(dict(C(r["municipio"] for r in utiles).most_common(40))))
bloque("Dificultad que trae OSM (casi siempre vacía)", C(r["dificultad_osm"] for r in utiles))
L.append("\n## Lista completa (tipo · matrícula · nombre · km en Navarra · forma · sale de)")
for r in sorted(utiles, key=lambda r: (r["tipo"], r["ref"], r["nombre"])):
    L.append(f"- {r['tipo']} · {r['ref'] or '-'} · {r['nombre'] or '(sin nombre)'} · {r['km_navarra']} km · {r['forma']} · {r['pueblo']} ({r['municipio']}) · osm.org/relation/{r['id']}")
open("rutas/rutas_info.txt", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L[:60]))
