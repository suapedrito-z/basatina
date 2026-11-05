# Datos de viaje para BasatiNA (GitHub Actions, varias veces al día). Escribe web/viaje.js
#  - Gasolineras de Navarra con precios del día (Ministerio para la Transición Ecológica)
#  - Puntos de recarga de coche eléctrico (OpenStreetMap)
#  - Puertos de montaña en carreteras (OpenStreetMap)
import json, time, urllib.request, urllib.parse
UA = {"User-Agent": "BasatiNA/3.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "application/json, */*"}
info = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); info.append(s)
def get(u, data=None, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=UA), timeout=timeout) as f: return f.read()
def num(s):
    try: return round(float(str(s).replace(",", ".")), 3)
    except Exception: return None

try:
    prev = json.loads(open("web/viaje.js").read()[len("window.VIAJE="):-1])
except Exception:
    prev = {}
out = {"t": time.strftime("%Y-%m-%d %H:%M"), "gas": prev.get("gas", []), "gasT": prev.get("gasT", ""), "rec": prev.get("rec", []), "pue": prev.get("pue", [])}

# 1) gasolineras
GAS = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/31"
for i in range(3):
    try:
        j = json.loads(get(GAS, timeout=180)); L = []
        for e in j.get("ListaEESSPrecio", []):
            la, lo = num(e.get("Latitud")), num(e.get("Longitud (WGS84)"))
            if la is None or lo is None: continue
            L.append({"id": e.get("IDEESS"), "n": (e.get("Rótulo") or "").strip(), "dir": (e.get("Dirección") or "").title(), "mun": (e.get("Localidad") or e.get("Municipio") or "").title(),
                      "h": e.get("Horario") or "", "pt": [la, lo], "g95": num(e.get("Precio Gasolina 95 E5")), "g98": num(e.get("Precio Gasolina 98 E5")),
                      "dA": num(e.get("Precio Gasoleo A")), "dP": num(e.get("Precio Gasoleo Premium")), "glp": num(e.get("Precio Gases licuados del petróleo"))})
        if L: out["gas"] = L; out["gasT"] = j.get("Fecha", ""); log("gasolineras", len(L), out["gasT"]); break
    except Exception as e:
        log("fallo gasolineras", e); time.sleep(15)

def overpass(q):
    for s in ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"] * 2:
        try: return json.loads(get(s, data=urllib.parse.urlencode({"data": q}).encode(), timeout=170))
        except Exception as e: log("overpass", s, e); time.sleep(8)
    return None

# 2) recarga eléctrica (solo una vez al día basta)
if not out["rec"] or time.strftime("%H") < "08":
    j = overpass('[out:json][timeout:180];area["ISO3166-2"="ES-NA"]->.a;nwr["amenity"="charging_station"](area.a);out center tags;')
    if j:
        L = []
        for e in j["elements"]:
            t = e.get("tags", {}); c = e.get("center") or {"lat": e.get("lat"), "lon": e.get("lon")}
            if c.get("lat") is None: continue
            tipos = sorted({k.split(":")[1] for k in t if k.startswith("socket:") and k.count(":") == 1 and t[k] not in ("no", "0")})
            pot = [t[k] for k in t if k.startswith("socket:") and k.endswith(":output")]
            L.append({"n": t.get("name") or t.get("operator") or t.get("network") or "", "op": t.get("operator") or t.get("network") or "", "pt": [round(c["lat"], 5), round(c["lon"], 5)],
                      "cap": t.get("capacity") or "", "tip": tipos, "kw": max(pot, key=lambda x: num(x.split()[0]) or 0) if pot else "", "fee": t.get("fee") or "", "acc": t.get("access") or "", "h": t.get("opening_hours") or ""})
        out["rec"] = L; log("recarga", len(L))

# 3) puertos de montaña en carreteras (Navarra y sus bordes)
if not out["pue"] or len(out["pue"]) > 80 or time.strftime("%H") < "08":
    # solo los de Navarra en carreteras de verdad (no pistas), más los de la frontera de Belagua y Larrau
    q = """[out:json][timeout:150];area["ISO3166-2"="ES-NA"]->.a;node["mountain_pass"="yes"](area.a)->.p;way(bn.p)["highway"~"^(trunk|primary|secondary|tertiary)$"]->.w;
(node.p(w.w);node["mountain_pass"="yes"]["name"~"Pierre Saint-Martin|Larraineko|Larrau"](42.85,-1.1,43.1,-0.7););out body;"""
    j = overpass(q)
    if j:
        L, seen = [], set()
        for e in j["elements"]:
            t = e.get("tags", {}); n = t.get("name:es") or t.get("name") or t.get("name:eu")
            if not n or n in seen: continue
            seen.add(n)
            L.append({"n": n, "eu": t.get("name:eu") or "", "ele": num(t.get("ele")), "pt": [round(e["lat"], 5), round(e["lon"], 5)]})
        out["pue"] = sorted(L, key=lambda x: -(x["ele"] or 0)); log("puertos", len(L), [(x["n"], x["ele"]) for x in out["pue"]])

open("web/viaje.js", "w").write("window.VIAJE=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";")
open("tools/viaje_info.txt", "w").write("\n".join(info))
