"""
Descarga de IDENA (Gobierno de Navarra, datos abiertos CC BY 4.0) los tramos de pesca del año
y las aguas de régimen especial, y los guarda en web/pesca.js para que la app los tenga dentro.
También escribe tools/pesca_info.txt con los campos que trae cada capa (para revisarlos).
Lo ejecuta GitHub Actions.
"""
import io, json, time, urllib.request, zipfile, collections
import shapefile                     # pip install pyshp
from pyproj import Transformer       # pip install pyproj

CAPAS = {
    "especial": "https://idena.navarra.es/descargas/CAZAPE_Lin_AgRegEsp.zip",
}
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)"}

def simplify(pts, tol):
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

out, info = {"t": time.strftime("%Y-%m-%d")}, []
for capa, url in CAPAS.items():
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()
    base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
    get = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base + ext).lower()][0]))
    prj = z.read([n for n in names if n.lower() == (base + ".prj").lower()][0]).decode("latin-1") if any(n.lower().endswith(".prj") for n in names) else ""
    # el texto viene en Windows-1252 (así salen bien los guiones largos «–»)
    sf = shapefile.Reader(shp=get(".shp"), dbf=get(".dbf"), encoding="cp1252")
    fields = [f[0] for f in sf.fields[1:]]
    # IDENA usa ETRS89 UTM 30 (EPSG:25830)
    tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
    feats, vals = [], collections.defaultdict(collections.Counter)
    for sr in sf.iterShapeRecords():
        attrs = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(fields, sr.record)}
        for k, v in attrs.items():
            vals[k][str(v)[:80]] += 1
        parts = list(sr.shape.parts) + [len(sr.shape.points)]
        for i in range(len(parts) - 1):
            seg = sr.shape.points[parts[i]:parts[i + 1]]
            pts = [[round(la, 5), round(lo, 5)] for lo, la in (tr.transform(x, y) for x, y in seg)]
            pts = simplify(pts, 0.0002)
            if len(pts) >= 2:
                feats.append({"a": {k: v for k, v in attrs.items() if v not in ("", None, "-") and k not in ("FEATURE", "GEOM_LONG", "CUENCAPERM")}, "p": pts})
    out[capa] = feats
    info.append(f"## {capa}: {url}\narchivos: {names}\nprj: {prj[:200]}\nelementos: {len(feats)}\ncampos: {fields}\n")
    for k in fields:
        info.append(f"- {k}: {len(vals[k])} valores distintos · ejemplos: {list(vals[k].most_common(12))}")
    info.append("")
txt = "// Pesca en Navarra: tramos y aguas de régimen especial (© Gobierno de Navarra · IDENA, CC BY 4.0). Generado por tools/pesca.py\nwindow.PESCA_GEO=" + \
      json.dumps(out, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n"
open("web/pesca.js", "w", encoding="utf-8").write(txt)
open("tools/pesca_info.txt", "w", encoding="utf-8").write("\n".join(info))
print("\n".join(info))
print("pesca.js:", len(txt) // 1024, "KB")
