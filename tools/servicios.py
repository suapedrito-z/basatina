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
    """Douglas-Peucker sencillo (pts = [[lat, lon], ...]). Los anillos cerrados se parten en dos mitades."""
    if tol <= 0 or len(pts) < 4: return pts
    if pts[0] == pts[-1]:
        m = len(pts) // 2
        return _dp(pts[:m + 1], tol)[:-1] + _dp(pts[m:], tol)
    return _dp(pts, tol)

def _dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    dx, dy = b[1] - a[1], b[0] - a[0]; L = (dx * dx + dy * dy) ** .5
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = abs(dy * p[1] - dx * p[0] + b[1] * a[0] - b[0] * a[1]) / L if L > 1e-12 else ((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2) ** .5
        if d > dmax: dmax, idx = d, i
    if dmax > tol:
        return _dp(pts[:idx + 1], tol)[:-1] + _dp(pts[idx:], tol)
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
# capas que se descargan (nombre en IDENA, figura que se muestra en la app)
ENP_CAPAS = [("BIODIV_Pol_ParquesNat", "Parque Natural"), ("BIODIV_Pol_ReservasInt", "Reserva Integral"), ("BIODIV_Pol_ReservasNat", "Reserva Natural"),
             ("BIODIV_Pol_EnclavesNat", "Enclave Natural"), ("BIODIV_Pol_AreasNatRec", "Área Natural Recreativa"), ("BIODIV_Pol_PaisajesPro", "Paisaje Protegido"),
             ("BIODIV_Sym_MonumNat", "Monumento Natural"), ("BIODIV_Pol_ZonasHumedas", "Zona Húmeda"),
             ("BIODIV_Pol_RN2000", "Red Natura 2000 · ZEC"), ("BIODIV_Pol_ZEPA", "Red Natura 2000 · ZEPA (aves)")]
BUS_CAPAS = [("TRAURB_Sym_TUCParadasBus", "tuc"), ("IDEMUN_Sym_Bus", "bus"), ("DOTACI_Sym_Paradas", "nbus"), ("DOTACI_Sym_EmpresasBus", "empresa"),
             ("IDEMUN_Sym_Taxi", "taxi"), ("TRAURB_Sym_TUCTaxis", "taxi")]
BUS_RE = re.compile(r"parada|autob[uú]s|estaci[oó]n(es)? de (tren|autob|ferro)|ferrocarril|transporte (p[uú]blico|interurbano|comarcal)", re.I)

def main():
    out = {"t": time.strftime("%Y-%m-%d"), "farmacias": [], "enp": [], "bus": []}
    # farmacias
    F, _ = capa("DOTACI_Sym_Farmacias")
    for at, pt, _r in F:
        ti = campo(at, "TITULAR", "NOMBRE", "DENOMIN")
        if "," in ti: ti = " ".join(reversed([x.strip() for x in ti.split(",", 1)]))   # «Pérez, Ana» -> «Ana Pérez»
        d = tit(campo(at, "DIRECC", "DOMICIL"))
        m = campo(at, "POBLAC", "MUNICIP", "LOCALID")
        o = {"n": "Farmacia " + tit(ti) if ti else "Farmacia", "d": d, "m": m, "pt": pt}
        if campo(at, "ZONA"): o["z"] = campo(at, "ZONA")
        tel = re.sub(r"[^\d+ ]", "", campo(at, "TELEF", "TLF", "TFNO"))[:20].strip()
        if tel: o["tel"] = tel
        out["farmacias"].append(o)
    L = catalogo()
    INFO.append("\n# Capas del catálogo que parecen de espacios protegidos o transporte:")
    enp = [(n, t) for n, t in L if ENP_RE.search(t) and re.search(r"_(Pol|Sym)_", n)]
    bus = [(n, t) for n, t in L if BUS_RE.search(t) and "_Sym_" in n]
    for n, t in enp + bus: INFO.append("  %s :: %s" % (n, t))
    nombres = {n for n, t in L}
    for n, fig in ENP_CAPAS:
        if n not in nombres: INFO.append("  (no está en el catálogo: %s)" % n); continue
        E, _ = capa(n, tol=0.0025 if "RN2000" in n or "ZEPA" in n else 0.0015)
        for at, pt, rings in E:
            nom = tit(campo(at, "ESPP", "RN2000", "ZONAHUMEDA", "NOMBRE", "DENOMIN"))
            if not nom: continue
            o = {"n": nom, "fig": fig, "pt": pt}
            eu = campo(at, "NOMBRE_EUS")
            if eu and eu != nom: o["eu"] = eu
            cod = campo(at, "IDESPP", "CRN2000", "CZONHUMEDA")
            if cod: o["cod"] = cod
            ha = campo(at, "HECTAREAS")
            if ha:
                try: o["ha"] = round(float(ha))
                except Exception: pass
            u = campo(at, "URL_CAS", "URLDECLARA", "URL")
            if u.startswith("http"): o["url"] = u
            if n == "BIODIV_Sym_MonumNat":
                o["d"] = " · ".join(x for x in [campo(at, "ESPECIE"), campo(at, "LUGAR")] if x)
            if rings: o["r"] = rings
            out["enp"].append(o)
    for n, k in BUS_CAPAS:
        if n not in nombres: INFO.append("  (no está en el catálogo: %s)" % n); continue
        B, _ = capa(n)
        for at, pt, _r in B:
            o = {"k": k, "pt": pt}
            if k == "tuc":
                o["n"] = campo(at, "PARADA"); o["id"] = campo(at, "CPARADA"); o["url"] = campo(at, "URL")
            elif k == "empresa":
                o["n"] = tit(campo(at, "EMPRESA")); o["d"] = campo(at, "POBLACION"); o["tel"] = campo(at, "TELEFONO"); o["url"] = campo(at, "URL")
            elif k == "taxi":
                o["n"] = campo(at, "PARADATAXI", "PARADA", "NOMBRE") or "Parada de taxi"; o["d"] = campo(at, "MUNICIPIO"); o["tel"] = campo(at, "TELEFONO")
            else:
                o["n"] = tit(campo(at, "PARADA", "NOMBRE", "DENOMIN")) or "Parada"
                o["d"] = " · ".join(x for x in [campo(at, "MUNICIPIO", "POBLACION"), campo(at, "EMPRESA", "OPERADOR"),
                                                " – ".join(y for y in [campo(at, "ORIGEN"), campo(at, "DESTINO")] if y) or campo(at, "LINEA")] if x)
                o["tel"] = campo(at, "TELEFONO"); o["url"] = campo(at, "URL")
            out["bus"].append({x: v for x, v in o.items() if v not in ("", None)})
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
