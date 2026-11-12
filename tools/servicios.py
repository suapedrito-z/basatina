"""
Servicios y espacios naturales de Navarra para BasatiNA (IDENA, Gobierno de Navarra, CC BY 4.0).

  python3 tools/servicios.py   -> web/servicios.js  y  tools/servicios_info.txt

Qué descarga:
  · Farmacias de Navarra (capa DOTACI_Sym_Farmacias): nombre, dirección, pueblo, teléfono y posición.
  · Espacios naturales protegidos y Red Natura 2000: busca las capas en el catálogo (GetCapabilities)
    por su título, así si IDENA cambia el nombre de la capa no hay que tocar nada aquí.
  · Paradas y estaciones de transporte público, si IDENA las publica.

Lo ejecuta GitHub Actions (.github/workflows/servicios.yml) cada mes. Necesita: pip install pyshp pyproj
"""
import io, json, re, sys, time, zipfile, urllib.request, collections

UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)"}
INFO = []

def get(url, tries=3):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
        except Exception as e:
            print("  reintento", i + 1, url, e, flush=True); time.sleep(5 * (i + 1))
    return None

FUERA = {"FEATURE", "BEGINLIFE", "GEOM_LONG", "GEOM_AREA", "GEOM_PERI", "OBJECTID", "FID", "ID", "X25830", "Y25830",
         "SHAPE_LENG", "SHAPE_AREA", "X", "Y", "XUTM", "YUTM", "COORX", "COORY"}

def simplify(pts, tol):
    """Douglas-Peucker sencillo (pts = [[lat, lon], ...])."""
    if tol <= 0 or len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]; dx, dy = b[1] - a[1], b[0] - a[0]
        d = abs(dy * p[1] - dx * p[0] + b[1] * a[0] - b[0] * a[1]) / ((dx * dx + dy * dy) ** .5 or 1e-12)
        if d > dmax: dmax, idx = d, i
    if dmax > tol:
        return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [a, b]

def capa(nombre, tol=0.0015):
    """Lee un shapefile de IDENA. Devuelve [(atributos, punto, anillos)] y los campos."""
    import shapefile
    from pyproj import Transformer
    tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
    b = get("https://idena.navarra.es/descargas/" + nombre + ".zip")
    if not b:
        INFO.append("## %s -> ERROR de descarga" % nombre); return [], []
    try:
        z = zipfile.ZipFile(io.BytesIO(b))
    except Exception as e:
        INFO.append("## %s -> no es un zip (%s)" % (nombre, e)); return [], []
    names = z.namelist(); shp = [n[:-4] for n in names if n.lower().endswith(".shp")]
    if not shp:
        INFO.append("## %s -> sin .shp" % nombre); return [], []
    g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (shp[0] + ext).lower()][0]))
    sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252")
    campos = [f[0] for f in sf.fields[1:]]; out = []
    for sr in sf.iterShapeRecords():
        at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(campos, sr.record)}
        at = {k: v for k, v in at.items() if k not in FUERA and v not in ("", None, "-")}
        s = sr.shape
        if not s.points: continue
        if s.shapeType in (1, 8, 11, 21) or not s.parts:
            lo, la = tr.transform(*s.points[0][:2]); out.append((at, [round(la, 5), round(lo, 5)], None)); continue
        parts = list(s.parts) + [len(s.points)]; rings = []
        for i in range(len(parts) - 1):
            pts = [[round(la, 4), round(lo, 4)] for lo, la in (tr.transform(x, y) for x, y in s.points[parts[i]:parts[i + 1]])]
            pts = simplify(pts, tol)
            if len(pts) >= 3: rings.append(pts)
        if not rings: continue
        big = max(rings, key=len)   # punto de referencia: centro del anillo más grande
        la = sum(p[0] for p in big) / len(big); lo = sum(p[1] for p in big) / len(big)
        out.append((at, [round(la, 4), round(lo, 4)], rings))
    INFO.append("## %s: %d elementos · campos %s\n   ejemplo %s" % (nombre, len(out), campos,
                json.dumps(out[0][0] if out else {}, ensure_ascii=False, default=str)[:600]))
    return out, campos

def campo(at, *claves):
    """Primer atributo cuyo nombre empieza por alguna de las claves."""
    for c in claves:
        for k, v in at.items():
            if k.upper().startswith(c) and str(v).strip():
                return str(v).strip()
    return ""

def tit(s):
    s = re.sub(r"\s+", " ", s or "").strip()
    return s.title() if s.isupper() and len(s) > 4 else s

# ---------- catálogo de capas (para encontrar las de espacios protegidos y transporte) ----------
def catalogo():
    b = get("https://idena.navarra.es/ogc/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0")
    if not b: INFO.append("catálogo WMS -> ERROR"); return []
    t = b.decode("utf-8", "ignore"); L = []
    for m in re.finditer(r"<Layer[^>]*>\s*<Name>([^<]+)</Name>\s*<Title>([^<]*)</Title>", t):
        L.append((m.group(1).strip(), m.group(2).strip()))
    INFO.append("catálogo WMS: %d capas" % len(L)); return L

ENP_RE = re.compile(r"espacio[s]? natural|red natura|zona[s]? especial|\bZEC\b|\bZEPA\b|\bLIC\b|reserva[s]? (natural|integral)|enclave[s]? natural"
                    r"|parque[s]? natural|monumento[s]? natural|paisaje[s]? protegido|[áa]rea[s]? natural(es)? recreativa|humedal|ramsar|reserva de la biosfera", re.I)
BUS_RE = re.compile(r"parada|autob[uú]s|estaci[oó]n(es)? de (tren|autob|ferro)|ferrocarril|transporte (p[uú]blico|interurbano|comarcal)", re.I)

def main():
    out = {"t": time.strftime("%Y-%m-%d"), "farmacias": [], "enp": [], "bus": []}
    # farmacias
    F, _ = capa("DOTACI_Sym_Farmacias")
    for at, pt, _r in F:
        n = tit(campo(at, "NOMBRE", "DENOMIN", "RAZON", "TITULAR", "FARMACIA")) or "Farmacia"
        d = tit(campo(at, "DIRECC", "DOMICIL", "CALLE", "VIA", "DIRE"))
        m = campo(at, "MUNICIP", "LOCALID", "POBLAC", "ENTIDAD", "CONCEJO")
        tel = re.sub(r"[^\d+ ]", "", campo(at, "TELEF", "TLF", "TFNO", "TEL"))[:20]
        out["farmacias"].append({"n": n, "d": d, "m": m, "tel": tel.strip(), "pt": pt})
    L = catalogo()
    INFO.append("\n# Capas del catálogo que parecen de espacios protegidos o transporte:")
    enp = [(n, t) for n, t in L if ENP_RE.search(t) and re.search(r"_(Pol|Sym)_", n)]
    bus = [(n, t) for n, t in L if BUS_RE.search(t) and "_Sym_" in n]
    for n, t in enp + bus: INFO.append("  %s :: %s" % (n, t))
    vistos = set()
    for n, t in enp[:30]:
        if n in vistos: continue
        vistos.add(n)
        E, _ = capa(n, tol=0.002)
        for at, pt, rings in E:
            nom = tit(campo(at, "NOMBRE", "DENOMIN", "NOM_", "TOPONIM", "NAME", "DESCRIP")) or t
            fig = tit(campo(at, "FIGURA", "CATEGOR", "TIPO", "CLASE")) or t
            cod = campo(at, "CODIGO", "COD_", "CODE", "SITECODE")
            sup = campo(at, "SUPERF", "HECT", "AREA_HA", "SUP_")
            o = {"n": nom, "fig": fig, "capa": t, "pt": pt}
            if cod: o["cod"] = cod
            if sup: o["ha"] = sup
            if rings: o["r"] = rings
            out["enp"].append(o)
    for n, t in bus[:6]:
        B, _ = capa(n)
        for at, pt, _r in B:
            out["bus"].append({"n": tit(campo(at, "NOMBRE", "DENOMIN", "PARADA", "ESTACION", "DESCRIP")) or t,
                               "d": tit(campo(at, "MUNICIP", "LOCALID", "LINEA", "OPERADOR")), "capa": t, "pt": pt})
    # quitar duplicados exactos (el mismo espacio puede salir en varias capas)
    seen = set(); E2 = []
    for o in out["enp"]:
        k = (o["n"], o["fig"], tuple(o["pt"]))
        if k in seen: continue
        seen.add(k); E2.append(o)
    out["enp"] = E2
    INFO.insert(0, "Generado %s · farmacias %d · espacios %d · transporte %d" % (out["t"], len(out["farmacias"]), len(out["enp"]), len(out["bus"])))
    open("tools/servicios_info.txt", "w").write("\n".join(INFO) + "\n")
    if not out["farmacias"] and not out["enp"]:
        print("Sin datos: no se toca web/servicios.js"); return
    js = "// Farmacias, espacios naturales protegidos y transporte (© Gobierno de Navarra · IDENA, CC BY 4.0). Generado por tools/servicios.py\n"
    js += "window.SERVICIOS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open("web/servicios.js", "w").write(js)
    print(INFO[0], "·", len(js) // 1024, "KB")

if __name__ == "__main__":
    main()
