"""
Lista de pueblos de Navarra para la app (web/pueblos.js):
- Entidades de población del Nomenclátor de Navarra (IDENA, ESTADI_Txt_EntidadPob): nombre, municipio y posición.
- Municipios (IDENA, DIADMI_Pol_Municipio) para saber a qué municipio pertenece cada uno.
- Altitud de cada pueblo con el modelo del terreno (Open-Meteo Elevation API, Copernicus DEM 90 m).
Escribe tools/pueblos_info.txt con los campos que trae cada capa.
"""
import io, json, time, urllib.request, zipfile, collections
import shapefile
from pyproj import Transformer
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/basatina)", "Accept": "*/*"}
tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
def shp(key):
    z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request("https://idena.navarra.es/descargas/" + key + ".zip", headers=UA), timeout=180).read()))
    n = z.namelist(); b = [x[:-4] for x in n if x.lower().endswith(".shp")][0]
    g = lambda e: io.BytesIO(z.read([x for x in n if x.lower() == (b + e).lower()][0]))
    sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252")
    return sf, [f[0] for f in sf.fields[1:]]
info = []
def describe(key, sf, fields):
    vals = collections.defaultdict(collections.Counter); n = 0
    for r in sf.iterRecords():
        n += 1
        for k, v in zip(fields, r): vals[k][str(v)[:50]] += 1
    info.append(f"\n## {key}: {n} · {fields}")
    for k in fields: info.append(f"- {k}: {len(vals[k])} · {list(vals[k].most_common(6))}")
# entidades de población (puntos con etiqueta)
sf, F = shp("ESTADI_Txt_EntidadPob"); describe("ESTADI_Txt_EntidadPob", sf, F)
pue = []
for sr in sf.iterShapeRecords():
    a = dict(zip(F, sr.record))
    if not sr.shape.points: continue
    x, y = sr.shape.points[0][:2]; lo, la = tr.transform(x, y)
    pue.append({"a": {k: (v.strip() if isinstance(v, str) else v) for k, v in a.items() if k not in ("FEATURE", "BEGINLIFE")}, "pt": [round(la, 5), round(lo, 5)]})
# municipios (para el nombre del municipio y la merindad si viene)
sf2, F2 = shp("DIADMI_Pol_Municipio"); describe("DIADMI_Pol_Municipio", sf2, F2)
from shapely.geometry import shape as Shape, Point
mun, polys = {}, []
for sr in sf2.iterShapeRecords():
    a = dict(zip(F2, sr.record)); c = str(a["CMUNICIPIO"]).strip()
    mun[c] = {"n": a["MUNICIPIO"].strip(), "altc": a.get("ALTCAPITAL"), "altm": a.get("ALTMEDIA"), "hab": a.get("HABIT2025"), "hab03": a.get("HABIT2003"),
              "km2": round(float(a.get("GEOM_AREA") or 0) / 1e6, 1)}
    polys.append((c, Shape(sr.shape.__geo_interface__)))
# a qué municipio pertenece cada pueblo (punto dentro del polígono, en UTM)
sf.close() if hasattr(sf, "close") else None
sf, F = shp("ESTADI_Txt_EntidadPob")
for p, sr in zip(pue, sf.iterShapeRecords()):
    x, y = sr.shape.points[0][:2]; pt = Point(x, y)
    p["m"] = next((c for c, g in polys if g.contains(pt)), None)
    if p["m"] is None:
        p["m"] = min(polys, key=lambda cg: cg[1].distance(pt))[0]
for p in pue:
    p["n"] = p["a"].get("ENTIDAD"); del p["a"]
# altitud: 100 puntos por petición
alts = []
for i in range(0, len(pue), 100):
    ch = pue[i:i+100]
    u = "https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(str(p["pt"][0]) for p in ch) + "&longitude=" + ",".join(str(p["pt"][1]) for p in ch)
    for k in range(5):
        try: alts += json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))["elevation"]; break
        except Exception as e: print("reintento altitud", e); time.sleep(5 * (k + 1))
    else: alts += [None] * len(ch)
    time.sleep(0.5)
for p, h in zip(pue, alts): p["alt"] = None if h is None else round(h)
out = {"t": time.strftime("%Y-%m-%d"), "pueblos": pue, "municipios": mun}
txt = "// Pueblos de Navarra: Nomenclátor y municipios (© Gobierno de Navarra · IDENA, CC BY 4.0); altitud: Copernicus DEM vía Open-Meteo. Generado por tools/pueblos.py\nwindow.PUEBLOS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n"
open("web/pueblos.js", "w", encoding="utf-8").write(txt)
info.append(f"\npueblos.js: {len(txt)//1024} KB · {len(pue)} entidades · {len(mun)} municipios")
open("tools/pueblos_info.txt", "w", encoding="utf-8").write("\n".join(info)); print("\n".join(info))
