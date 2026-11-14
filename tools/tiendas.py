"""
Supermercados, mercados municipales y parques infantiles de Navarra para BasatiNA (OpenStreetMap, ODbL).

  python3 tools/tiendas.py   -> web/tiendas.js  y  tools/tiendas_info.txt

Qué descarga (Overpass):
  · shop=supermarket                      -> supermercados (con marca, horario, web y teléfono si los tienen)
  · amenity=marketplace                   -> mercados municipales y plazas de mercado
  · leisure=playground                    -> parques infantiles (para «Para los peques»)
Cada punto se sitúa en su pueblo más cercano con web/pueblos.js.

Lo ejecuta GitHub Actions (.github/workflows/tiendas.yml) el día 5 de cada mes.
"""
import json, math, sys, time, urllib.parse, urllib.request, datetime, collections

UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)"}
SERVIDORES = ["https://overpass-api.de/api/interpreter",
              "https://overpass.private.coffee/api/interpreter",
              "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
Q = """[out:json][timeout:600];
area["ISO3166-2"="ES-NA"]->.a;
(nwr["shop"="supermarket"](area.a);nwr["amenity"="marketplace"](area.a);nwr["leisure"="playground"](area.a););
out center tags;"""


def overpass(q):
    for s in SERVIDORES:
        for intento in range(2):
            try:
                print("Overpass:", s, flush=True)
                r = urllib.request.urlopen(urllib.request.Request(s, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA), timeout=900)
                return json.loads(r.read())
            except Exception as e:
                print("  falló:", e, flush=True); time.sleep(20)
    raise SystemExit("Ningún servidor de Overpass contestó")


# pueblos de Navarra para saber en qué localidad está cada punto
txt = open("web/pueblos.js", encoding="utf-8").read()
P = json.loads(txt[txt.index("{"):txt.rindex("}") + 1])
PUEBLOS = [(p["pt"][0], p["pt"][1], p["n"]) for p in P["pueblos"]]


def pueblo(la, lo):
    best, bd = "", 1e9
    c = math.cos(math.radians(la))
    for a, b, n in PUEBLOS:
        d = (a - la) ** 2 + ((b - lo) * c) ** 2
        if d < bd: bd, best = d, n
    return best


def r5(x): return round(x, 5)


els = overpass(Q)["elements"]
sup, mer, jue = [], [], []
for e in els:
    t = e.get("tags", {})
    la = e.get("lat", (e.get("center") or {}).get("lat"))
    lo = e.get("lon", (e.get("center") or {}).get("lon"))
    if la is None: continue
    calle = (t.get("addr:street", "") + (" " + t["addr:housenumber"] if t.get("addr:housenumber") else "")).strip()
    loc = t.get("addr:city") or pueblo(la, lo)
    web = t.get("website") or t.get("contact:website") or ""
    tel = t.get("phone") or t.get("contact:phone") or ""
    if t.get("shop") == "supermarket":
        sup.append([t.get("name") or t.get("brand") or "Supermercado", t.get("brand", ""), r5(la), r5(lo), loc, calle,
                    t.get("opening_hours", ""), web, tel])
    elif t.get("amenity") == "marketplace":
        mer.append([t.get("name") or "Mercado", r5(la), r5(lo), loc, calle, t.get("opening_hours", ""), web])
    elif t.get("leisure") == "playground":
        jue.append([t.get("name", ""), r5(la), r5(lo), pueblo(la, lo)])

sup.sort(key=lambda a: (a[4], a[0])); mer.sort(key=lambda a: (a[3], a[0])); jue.sort(key=lambda a: (a[3], a[0]))
out = {"t": datetime.date.today().isoformat(), "super": sup, "mercado": mer, "juegos": jue}
with open("web/tiendas.js", "w", encoding="utf-8") as f:
    f.write("// Supermercados, mercados y parques infantiles de Navarra. © colaboradores de OpenStreetMap (ODbL). Generado por tools/tiendas.py\n")
    f.write("window.TIENDAS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
marcas = collections.Counter(a[1] or a[0] for a in sup)
with open("tools/tiendas_info.txt", "w", encoding="utf-8") as f:
    f.write("Supermercados: %d · Mercados: %d · Parques infantiles: %d\n\nMarcas más repetidas:\n" % (len(sup), len(mer), len(jue)))
    for m, n in marcas.most_common(40): f.write("  %4d  %s\n" % (n, m))
    f.write("\nMercados:\n" + "".join("  %s (%s)\n" % (m[0], m[3]) for m in mer))
print("OK", len(sup), len(mer), len(jue))
