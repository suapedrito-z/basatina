"""
Descarga de OpenStreetMap el dibujo de los ríos de Navarra y lo guarda en web/rios.js
para que la app lo tenga dentro y no dependa de ningún servidor al abrirse.
Lo ejecuta GitHub Actions (tiene internet sin restricciones). Se puede repetir cuando se quiera.
"""
import json, time, urllib.parse, urllib.request

BBOX = (41.88, -2.55, 43.47, -0.70)  # sur, oeste, norte, este (recuadro de Navarra)
Q = f"""[out:json][timeout:180][bbox:{BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]}];
way["waterway"="river"]["name"];out geom;"""
SERVERS = ["https://overpass-api.de/api/interpreter",
           "https://overpass.kumi.systems/api/interpreter",
           "https://overpass.private.coffee/api/interpreter"]

def fetch():
    data = urllib.parse.urlencode({"data": Q}).encode()
    for s in SERVERS:
        for intento in range(3):
            try:
                req = urllib.request.Request(s, data=data, headers={
                    "User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/basatina)"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    j = json.load(r)
                    if j.get("elements"):
                        print("OK", s, len(j["elements"]), "tramos")
                        return j
            except Exception as e:
                print("fallo", s, e)
                time.sleep(10)
    raise SystemExit("No se pudo descargar de ningún servidor")

def simplify(pts, tol):
    """Douglas-Peucker: quita puntos que casi no cambian la forma de la línea"""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = (dx * dx + dy * dy) or 1e-12
    best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
        d = ((p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2) ** .5
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [a, b]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)

j = fetch()
out = []
for w in j["elements"]:
    t = w.get("tags", {})
    g = w.get("geometry") or []
    if len(g) < 2:
        continue
    pts = simplify([[round(p["lat"], 4), round(p["lon"], 4)] for p in g], 0.0012)
    out.append({"n": t.get("name", ""), "es": t.get("name:es", ""), "eu": t.get("name:eu", ""), "p": pts})
txt = "// Dibujo de los ríos de Navarra (© OpenStreetMap, ODbL). Generado por tools/rios.py\nwindow.RIOS_GEO=" + \
      json.dumps({"t": time.strftime("%Y-%m-%d"), "w": out}, ensure_ascii=False, separators=(",", ":")) + ";\n"
open("web/rios.js", "w", encoding="utf-8").write(txt)
print("tramos:", len(out), "tamaño:", len(txt) // 1024, "KB")
