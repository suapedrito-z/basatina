"""
Descarga de IDENA (Gobierno de Navarra, CC BY 4.0) las capas para «Salir al monte» y las guarda en web/monte.js:
cuevas y simas, miradores, áreas recreativas, zonas de baño, bienes de interés cultural, manantiales, fuentes,
vías verdes, GR, Camino de Santiago. Escribe tools/monte_info.txt con los campos.
"""
import io, json, time, urllib.request, zipfile, collections
import shapefile
from pyproj import Transformer
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "*/*"}
B = "https://idena.navarra.es/descargas/"
CAPAS = ["GEOLOG_Sym_Cuevas", "DOTACI_Sym_Miradores", "FOREST_Sym_AreasRecForest", "HIDROG_Sym_ZonaBano", "PATRIM_Sym_BICarquite",
         "GEOLOG_Sym_Manantiales", "IDEMUN_Sym_Fuentes", "PATRIM_Sym_Senderismo",
         "DOTACI_Lin_VVBidasoa", "DOTACI_Lin_VVVascoNav", "DOTACI_Lin_VVIrati", "DOTACI_Lin_VVPlazaola", "DOTACI_Lin_VVTarazoni",
         "DOTACI_Lin_GR1", "DOTACI_Lin_GR12", "DOTACI_Lin_GR321", "PATRIM_Lin_CaminoSant"]
KEEP = {"GEOLOG_Sym_Cuevas": ["CODIGO", "CUEVA", "TIPO", "COTA", "MUNICIPIO", "TOPONIMIA", "LONGITUD", "PROFUNDIDA", "DESCRIPCIO"],
        "GEOLOG_Sym_Manantiales": ["MANANTIAL", "MUNICIPIO", "RIO"], "FOREST_Sym_AreasRecForest": ["NOMBRE", "DEMARCACIO", "BARBACOA", "EQUIPAMIEN", "PARKING", "VEGETACION", "ELEPAISAJE"],
        "PATRIM_Sym_BICarquite": ["BIC", "TIPO", "POBLACION"], "DOTACI_Sym_Miradores": ["RECTUR", "ZONATUR", "POBLACION", "URL"], "IDEMUN_Sym_Fuentes": ["FUENTE", "MUNICIPIO", "POTABLE"],
        "PATRIM_Sym_Senderismo": ["NOMBRE", "DESCRIPCIO", "URL", "DESCARGA"]}
DROP = {"URLPDF", "SITUACION", "FEATURE", "BEGINLIFE", "GEOM_LONG", "GEOM_AREA", "GEOM_PERI", "X25830", "Y25830", "OBJECTID", "FID", "ID"}
tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = (dx*dx+dy*dy) or 1e-12; best, idx = -1, 0
    for i in range(1, len(pts)-1):
        p = pts[i]; t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)); d = ((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)**.5
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
out, info = {"t": time.strftime("%Y-%m-%d")}, []
for key in CAPAS:
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(B + key + ".zip", headers=UA), timeout=180).read()))
        names = z.namelist(); base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
        g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base+ext).lower()][0]))
        sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252"); fields = [f[0] for f in sf.fields[1:]]
        feats, vals = [], collections.defaultdict(collections.Counter)
        for sr in sf.iterShapeRecords():
            at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(fields, sr.record)}
            for k, v in at.items(): vals[k][str(v)[:60]] += 1
            a = {k: (str(v)[:160] if isinstance(v, str) else v) for k, v in at.items() if v not in ("", None, "-", 0, 0.0, "0", "0.0") and k not in DROP and (key not in KEEP or k in KEEP[key])}
            if key == "GEOLOG_Sym_Cuevas" and "Fuera de Navarra" in str(at.get("OBSERVACIO", "")): continue
            s = sr.shape
            if not s.points: continue
            if s.shapeType in (1, 8, 11, 21) or not s.parts:
                lo, la = tr.transform(*s.points[0][:2]); feats.append({"a": a, "pt": [round(la, 4), round(lo, 4)]}); continue
            parts = list(s.parts) + [len(s.points)]; rings = []
            for i in range(len(parts)-1):
                pts = [[round(la, 5), round(lo, 5)] for lo, la in (tr.transform(x, y) for x, y in s.points[parts[i]:parts[i+1]])]
                pts = simplify(pts, 0.0004)
                if len(pts) >= 2: rings.append(pts)
            if rings: feats.append({"a": a, "r": rings})
        out[key] = {"d": vals["BEGINLIFE"].most_common(1)[0][0] if "BEGINLIFE" in vals else "", "f": feats}
        info.append(f"\n## {key}: {len(feats)} · campos {fields}")
        for k in fields:
            if k not in DROP: info.append(f"- {k}: {len(vals[k])} · {list(vals[k].most_common(6))}")
    except Exception as e:
        info.append(f"fallo {key}: {e}")
txt = "// Salir al monte (© Gobierno de Navarra · IDENA, CC BY 4.0). Generado por tools/monte.py\nwindow.MONTE_GEO=" + json.dumps(out, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n"
open("web/monte.js", "w", encoding="utf-8").write(txt)
info.append(f"\nmonte.js: {len(txt)//1024} KB  ·  " + ", ".join(f"{k}:{len(v['f'])}" for k, v in out.items() if isinstance(v, dict)))
open("tools/monte_info.txt", "w", encoding="utf-8").write("\n".join(map(str, info))); print("\n".join(map(str, info)))
