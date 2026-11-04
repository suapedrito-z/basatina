"""
Busca en el catálogo de datos abiertos (datos.gob.es, publicador Gobierno de Navarra) las capas de caza
(cotos, zonas de caza...) y, si encuentra los cotos, los guarda en web/caza.js para la app.
Escribe tools/caza_info.txt con lo encontrado. Lo ejecuta GitHub Actions.
"""
import io, json, time, urllib.request, urllib.parse, zipfile, collections
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "application/json"}
def get(url, binary=False):
    h = dict(UA)
    if binary: h["Accept"] = "*/*"      # los .zip de IDENA dan error 406 si se pide JSON
    r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=120).read()
    return r if binary else r.decode("utf-8", "replace")
info, urls = [], []
for q in ["cotos de caza", "caza", "cinegetic", "CAZAPE", "Planes de Ordenación Cinegética", "palomer", "puestos", "coto"]:
    try:
        j = json.loads(get("https://datos.gob.es/apidata/catalog/dataset/title/" + urllib.parse.quote(q) + "?_pageSize=50"))
        for it in j.get("result", {}).get("items", []):
            pub = str(it.get("publisher", ""))
            if "A15002917" not in pub.upper():
                continue
            title = it.get("title")
            dists = it.get("distribution", [])
            dists = dists if isinstance(dists, list) else [dists]
            acc = [d.get("accessURL") for d in dists if isinstance(d, dict)]
            info.append(f"- {title} :: {acc}")
            urls += [u for u in acc if isinstance(u, str)]
    except Exception as e:
        info.append(f"búsqueda '{q}' falló: {e}")
urls = sorted(set(urls))
info.append("\nURLs: " + "\n".join(urls))
# probar también nombres típicos de IDENA
for name in ["CAZAPE_Pol_Cotos", "CAZAPE_Pol_CotoCaza", "CAZAPE_Pol_Coto", "CAZAPE_Pol_CotosCaza", "CAZAPE_Pol_ZonaCaza"]:
    u = f"https://idena.navarra.es/descargas/{name}.zip"
    try:
        b = get(u, True); info.append(f"OK {u} {len(b)} bytes"); urls.append(u)
    except Exception as e:
        info.append(f"no {u}: {e}")

# ---- descargar las capas útiles y guardarlas en web/caza.js ----
import shapefile
from pyproj import Transformer
tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = (dx*dx+dy*dy) or 1e-12; best, idx = -1, 0
    for i in range(1, len(pts)-1):
        p = pts[i]; t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)); d = ((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)**.5
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
out = {"t": time.strftime("%Y-%m-%d")}
UTILES = ["CAZAPE_Pol_Monterias", "CAZAPE_Pol_ResaqueCazaM", "CAZAPE_Sym_PuesPaloma", "CAZAPE_Sym_ChozaPaloma", "CAZAPE_Lin_FrenPaloma",
           "CAZAPE_Sym_EsperaNoct", "CAZAPE_Pol_Reservas", "CAZAPE_Pol_Refugios", "CAZAPE_Pol_ZonaCodor", "CAZAPE_Sym_PuesMalviz", "CAZAPE_Sym_PuesAnade"]
for u in urls:
    if not u.lower().endswith(".zip") or u.rsplit("/", 1)[1][:-4] not in UTILES: continue
    key = u.rsplit("/", 1)[1][:-4]
    try:
        z = zipfile.ZipFile(io.BytesIO(get(u, True))); names = z.namelist()
        base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
        g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base+ext).lower()][0]))
        sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252"); fields = [f[0] for f in sf.fields[1:]]
        feats, vals = [], collections.defaultdict(collections.Counter)
        for sr in sf.iterShapeRecords():
            at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(fields, sr.record)}
            for k, v in at.items(): vals[k][str(v)[:60]] += 1
            if sr.shape.shapeType in (1, 8, 11, 21) or not sr.shape.parts:      # puntos (puestos, chozas, esperas)
                lo, la = tr.transform(*sr.shape.points[0][:2])
                feats.append({"a": {k: v for k, v in at.items() if v not in ("", None, "-") and k not in ("FEATURE",)}, "pt": [round(la, 5), round(lo, 5)]})
                continue
            parts = list(sr.shape.parts) + [len(sr.shape.points)]
            rings = []
            for i in range(len(parts)-1):
                pts = [[round(la, 5), round(lo, 5)] for lo, la in (tr.transform(x, y) for x, y in sr.shape.points[parts[i]:parts[i+1]])]
                pts = simplify(pts, 0.0003)
                if len(pts) >= 2: rings.append(pts)
            if rings: feats.append({"a": {k: v for k, v in at.items() if v not in ("", None, "-") and k not in ("FEATURE",)}, "r": rings})
        out[key] = feats
        info.append(f"\n## {key}: {len(feats)} elementos · campos {fields}")
        for k in fields: info.append(f"- {k}: {len(vals[k])} distintos · {list(vals[k].most_common(8))}")
    except Exception as e:
        info.append(f"fallo {u}: {e}")
txt = "// Caza en Navarra: Planes de Ordenación Cinegética (© Gobierno de Navarra · IDENA, CC BY 4.0). Generado por tools/caza.py\nwindow.CAZA_GEO=" + json.dumps(out, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n"
open("web/caza.js", "w", encoding="utf-8").write(txt)
info.append(f"\ncaza.js: {len(txt)//1024} KB")
open("tools/caza_info.txt", "w", encoding="utf-8").write("\n".join(map(str, info)))
print("\n".join(map(str, info)))
