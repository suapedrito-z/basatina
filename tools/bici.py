"""
Rutas en bici para BasatiNA -> web/bici.js

1) Turismo de Navarra (visitnavarra.es): rutas de carretera, gravel, BTT, vías verdes y EuroVelo 1.
   De cada página de lista sacamos las fichas (/detalle-ruta/-/r/...), y de cada ficha su GPX,
   kilómetros, desnivel y dificultad. El recorrido se simplifica (un punto cada ~30-40 m) para que pese poco.
2) Red ciclable de Pamplona (SIG del Ayuntamiento de Pamplona, capa MOVI_Lin_RedCiclable) por WFS.

Escribe tools/bici_info.txt con lo encontrado, para revisar si algo falla.
"""
import json, re, time, html, urllib.request, urllib.parse, xml.etree.ElementTree as ET

UA = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "es-ES,es;q=0.9"}
BASE = "https://www.visitnavarra.es"
LISTAS = {"carretera": "/es/navarra-en-bici-carretera", "gravel": "/es/navarra-en-gravel",
          "btt": "/es/bici-y-btt/espacios-btt-de-navarra", "vv": "/es/vias-verdes-de-navarra", "ev1": "/es/bici-y-btt/eurovelo-1-en-navarra"}
INFO = []

def get(url, tries=3, binario=False):
    for i in range(tries):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
            return b if binario else b.decode("utf-8", "replace")
        except Exception as e:
            INFO.append("  reintento %d %s %s" % (i + 1, url, e)); time.sleep(4 * (i + 1))
    return None

def absu(u, base=BASE):
    u = html.unescape(u)
    u = u if u.startswith("http") else base + (u if u.startswith("/") else "/" + u)
    # los nombres de archivo llevan espacios y tildes: hay que codificarlos para poder pedirlos
    pr = urllib.parse.urlsplit(u)
    return urllib.parse.urlunsplit((pr.scheme, pr.netloc, urllib.parse.quote(urllib.parse.unquote(pr.path), safe="/"), pr.query, pr.fragment))

def fichas(page):
    return sorted(set(absu(m) for m in re.findall(r'href="([^"]*/detalle-ruta/-/r/[^"#?]+)', page)))

def gpx_links(page):
    return sorted(set(absu(m) for m in re.findall(r'href="([^"]+?\.gpx[^"]*)"', page, re.I)))

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = (dx * dx + dy * dy) or 1e-12; best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]; t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
        d = ((p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2) ** .5
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)

def gpx_pts(b):
    """Devuelve lista de tramos [[lat,lon],...] de un GPX (trk y rte)."""
    try: root = ET.fromstring(b)
    except Exception: return []
    segs = []
    for tag in ("trkseg", "rte"):
        for s in root.iter():
            if s.tag.split("}")[-1] != tag: continue
            pts = [[round(float(p.get("lat")), 5), round(float(p.get("lon")), 5)] for p in s
                   if p.tag.split("}")[-1] in ("trkpt", "rtept") and p.get("lat")]
            if len(pts) > 1:
                import sys; sys.setrecursionlimit(100000)
                segs.append(simplify(pts, 0.00035))
    return segs

def num(s):
    try: return float(s.replace(".", "").replace(",", ".")) if re.search(r",\d", s) else float(s)
    except Exception: return None

def ficha(url, tipo):
    p = get(url)
    if not p: return None
    t = re.search(r"<h1[^>]*>(.*?)</h1>", p, re.S) or re.search(r'<meta property="og:title" content="([^"]+)"', p)
    nombre = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t.group(1)))).split(" - ")[0].split("|")[0].strip() if t else ""
    if not nombre or nombre.lower() in ("visit navarra", "turismo de navarra"):
        nombre = url.rsplit("/", 1)[-1].replace("-", " ").capitalize()
    txt = html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>|<style.*?</style>", " ", p, flags=re.S)))
    txt = re.sub(r"\s+", " ", txt)
    km = re.search(r"(\d+(?:[.,]\d+)?)\s*km", txt); des = re.search(r"Desnivel[^\d]{0,20}(\d+(?:[.,]\d+)?)", txt, re.I)
    dif = re.search(r"\b(Muy alta|Alta|Media|Baja|Muy baja)\b", txt)
    g = gpx_links(p)
    segs = []
    for u in g[:2]:
        b = get(u, binario=True)
        if b: segs += gpx_pts(b)
    INFO.append("  %s | %s | km=%s des=%s dif=%s | gpx=%d tramos=%d" % (tipo, nombre, km and km.group(1), des and des.group(1), dif and dif.group(1), len(g), len(segs)))
    if not segs: return None
    return {"tipo": tipo, "n": nombre, "km": num(km.group(1)) if km else None, "des": int(num(des.group(1))) if des else None,
            "dif": dif.group(1) if dif else "", "url": url, "r": segs}

def visitnavarra():
    rutas, vistas = [], set()
    for tipo, path in LISTAS.items():
        p = get(BASE + path)
        INFO.append("LISTA %s %s -> %s" % (tipo, path, "OK %d bytes" % len(p) if p else "ERROR"))
        if not p: continue
        F = fichas(p)
        # páginas intermedias (p. ej. cada espacio BTT): seguimos un nivel más
        sub = sorted(set(absu(m) for m in re.findall(r'href="(/es/[^"#?]*(?:btt|bici|gravel|via-verde|vias-verdes|eurovelo)[^"#?]*)"', p, re.I)))
        sub = [u for u in sub if u != BASE + path and "/detalle-ruta/" not in u][:40]
        for u in sub:
            q = get(u)
            if q: F += fichas(q)
            time.sleep(.5)
        F = sorted(set(F))
        INFO.append("  fichas %d (subpáginas %d) · gpx directos en la lista %d" % (len(F), len(sub), len(gpx_links(p))))
        for u in F:
            if u in vistas: continue
            vistas.add(u); r = ficha(u, tipo); time.sleep(.6)
            if r: rutas.append(r)
        # GPX puestos directamente en la página de lista (p. ej. etapas de EuroVelo)
        for u in gpx_links(p):
            b = get(u, binario=True); segs = gpx_pts(b) if b else []
            if segs:
                n = urllib.parse.unquote(u.rsplit("/", 1)[-1]).rsplit(".", 1)[0]; n = re.sub(r"_?\d{12,}", "", n).replace("_", " ").strip()
                rutas.append({"tipo": tipo, "n": n, "km": None, "des": None, "dif": "", "url": BASE + path, "r": segs})
                INFO.append("  gpx directo %s tramos=%d" % (n, len(segs)))
    return rutas

def eurovelo():
    """Etapas navarras de la EuroVelo 1 (eurovelospain.com): GPX de cada etapa si lo publican."""
    out = []
    for n in range(1, 6):
        u = "https://www.eurovelospain.com/etapas/ev1-etapa-%02d/" % n
        p = get(u)
        g = sorted(set(absu(m, "https://www.eurovelospain.com") for m in re.findall(r'href="([^"]+?\.(?:gpx|GPX)[^"]*)"', p or "")))
        t = re.search(r"<h1[^>]*>(.*?)</h1>", p or "", re.S)
        nombre = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t.group(1)))).strip() if t else "EuroVelo 1 · etapa %d" % n
        segs = []
        for x in g[:1]:
            b = get(x, binario=True)
            if b: segs += gpx_pts(b)
        km = re.search(r"(\d+(?:[.,]\d+)?)\s*km", re.sub(r"<[^>]+>", " ", p or ""))
        INFO.append("EUROVELO %s -> %s | gpx=%d tramos=%d" % (u, nombre, len(g), len(segs)))
        if segs: out.append({"tipo": "ev1", "n": "EuroVelo 1 · " + nombre, "km": num(km.group(1)) if km else None, "des": None, "dif": "", "url": u, "r": segs})
    return out

IDENA = {  # capa de IDENA -> (clave en la app, tolerancia de simplificación)
    "DOTACI_Lin_RutasBTT": ("btt", 0.00025), "DOTACI_Lin_EuroVelo1": ("ev", 0.0003), "DOTACI_Lin_EuroVelo3": ("ev", 0.0003),
    "INFRAE_Lin_TrazadoSIGMC": ("red", 0.0003), "INFRAE_Sym_PtoRiesgoSIGMC": ("riesgo", 0), "INFRAE_Sym_AparcamientoSIGMC": ("aparca", 0),
    "INFRAE_Sym_ServSIGMC": ("serv", 0)}
NOMBRE = ["NOMBRE", "NOM_RUTA", "RUTA", "DENOMINACI", "ETAPA", "TRAMO", "DESCRIPCIO", "TIPO", "SERVICIO", "DENOMINA"]
FUERA = {"FEATURE", "BEGINLIFE", "GEOM_LONG", "GEOM_AREA", "GEOM_PERI", "OBJECTID", "FID", "ID", "X25830", "Y25830", "SHAPE_LENG", "SHAPE_AREA"}

def idena():
    """Capas oficiales de bici de IDENA (Gobierno de Navarra, CC BY 4.0), en shapefile UTM 30N."""
    import io, zipfile, sys, collections, shapefile
    from pyproj import Transformer
    sys.setrecursionlimit(100000)
    tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
    out = collections.defaultdict(list)
    for capa, (clave, tol) in IDENA.items():
        b = get("https://idena.navarra.es/descargas/" + capa + ".zip", binario=True)
        if not b: INFO.append("IDENA %s -> ERROR" % capa); continue
        z = zipfile.ZipFile(io.BytesIO(b)); names = z.namelist(); base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
        g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base + ext).lower()][0]))
        sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252"); campos = [f[0] for f in sf.fields[1:]]
        n0 = len(out[clave]); ej = None
        for sr in sf.iterShapeRecords():
            at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(campos, sr.record)}
            at = {k: v for k, v in at.items() if k not in FUERA and v not in ("", None, "-") and not (isinstance(v, (int, float)) and v == 0)}
            ej = ej or at
            a = ficha_idena(clave, at)
            if a is None: continue
            s = sr.shape
            if not s.points: continue
            if s.shapeType in (1, 8, 11, 21) or not s.parts:
                lo, la = tr.transform(*s.points[0][:2]); out[clave].append({"a": a, "pt": [round(la, 4), round(lo, 4)]}); continue
            parts = list(s.parts) + [len(s.points)]; rings = []
            for i in range(len(parts) - 1):
                pts = [[round(la, 4), round(lo, 4)] for lo, la in (tr.transform(x, y) for x, y in s.points[parts[i]:parts[i + 1]])]
                pts = simplify(pts, tol)
                if len(pts) >= 2: rings.append(pts)
            if rings: out[clave].append({"a": a, "r": rings})
        INFO.append("IDENA %s -> %s: %d elementos · campos %s · ejemplo %s" % (capa, clave, len(out[clave]) - n0, campos, json.dumps(ej, ensure_ascii=False, default=str)[:400]))
    return dict(out)

def txt_cod(v):
    """«CBP (Carril bici protegido)» -> «Carril bici protegido»"""
    v = str(v or ""); m = re.match(r"^\w{2,4} \((.*)\)$", v); return m.group(1) if m else v

def ficha_idena(clave, at):
    """Solo lo que sirve en la ficha de la app (para que el archivo pese poco)."""
    g = lambda k: at.get(k) not in (None, "") and str(at.get(k)).strip() or ""
    if clave == "btt":
        return {"N": g("NOMBRE"), "D": g("DESCRIPCIO")[:200], "BKM": g("LONGITUD") and "%s km" % g("LONGITUD"), "BDES": g("DESNIVEL") and "%s m" % g("DESNIVEL"),
                "BDIF": g("DIFICULTAD"), "BDUR": g("DURACION"), "URL": g("URL"), "DESCARGA": g("DESCARGA")}
    if clave == "ev":
        return {"N": "%s · %s" % (g("RUTA").replace("Eurovelo", "EuroVelo"), g("TRAMO")), "D": g("OBSERVACIO"), "URL": g("URL"), "DESCARGA": g("DESCARGA")}
    if clave == "red":
        return {"N": txt_cod(g("TIPOVIACIC")) or "Vía ciclista", "D": " · ".join(x for x in [g("VIA").split("/")[0].title(), g("MUNICIPIO")] if x)}
    if clave == "riesgo":
        return {"N": g("DESCRIPCIO")[:160] or "Punto de riesgo", "D": g("MUNICIPIO")}
    if clave == "aparca":
        d = [g("NOMBRE"), g("PLAZAS") and g("PLAZAS") + " plazas", "cubierto" if "SIE" in g("CUBIERTA") else "", "vigilado" if g("VIGILADO").startswith("SI") else "",
             txt_cod(g("TARIFA")).lower(), g("MUNICIPIO")]
        return {"N": "Aparcabicis", "D": " · ".join(x for x in d if x)}
    if clave == "serv":
        t = txt_cod(g("TIPOSB"))
        if re.search(r"panel|informativ", t, re.I): return None   # los paneles informativos no aportan y son la mayoría
        return {"N": t or "Servicio", "D": " · ".join(x for x in [g("NOMBRE"), g("OBSERVACIO")[:100], g("MUNICIPIO")] if x)}
    return {"N": "", "D": ""}

def salidas():
    """Rutas de carretera y gravel de visitnavarra: sus GPX están rotos en la web oficial (404),
    así que ponemos un punto en el pueblo de salida con la ficha y el enlace."""
    import unicodedata
    def norm(s):
        s = unicodedata.normalize("NFD", (s or "").lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return re.sub(r"[^a-z0-9]+", " ", s).strip()
    P = open("web/pueblos.js", encoding="utf-8").read(); P = json.loads(P[P.index("{"):P.rindex("}") + 1]); IDX = {}
    for p in P["pueblos"]:
        for alt in [p["n"]] + p["n"].split("/"): IDX.setdefault(norm(alt), p["pt"])
    out = []
    for tipo in ("carretera", "gravel"):
        p = get(BASE + LISTAS[tipo]) or ""
        for m in re.finditer(r'href="([^"]*/detalle-ruta/-/r/[^"#?]+)"', p):
            url = absu(m.group(1))
            if any(o["url"] == url for o in out): continue
            txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " | ", p[m.end():m.end() + 2500])))   # el pueblo va DESPUÉS del enlace, en la misma tarjeta
            ini = re.search(r"([A-ZÁÉÍÓÚÑ][^|]{1,40}?)\s*\|\s*(?:\|\s*)*(?:Carretera|Gravel)\b", txt)
            pt = None
            if ini:
                for c in [ini.group(1)] + ini.group(1).split("/"):
                    pt = IDX.get(norm(c))
                    if pt: break
            r = ficha_datos(url)
            INFO.append("SALIDA %s %s -> %s %s" % (tipo, url.rsplit("/", 1)[-1], ini and ini.group(1), pt))
            if pt and r: out.append(dict(r, tipo=tipo, ini=ini.group(1).strip(), pt=pt, url=url))
            time.sleep(.5)
    return out

def ficha_datos(url):
    p = get(url)
    if not p: return None
    t = re.search(r"<h1[^>]*>(.*?)</h1>", p, re.S)
    nombre = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t.group(1)))).strip() if t else url.rsplit("/", 1)[-1].replace("-", " ").capitalize()
    txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>|<style.*?</style>", " ", p, flags=re.S))))
    km = re.search(r"(\d+(?:[.,]\d+)?)\s*km", txt); des = re.search(r"Desnivel[^\d]{0,20}(\d+(?:[.,]\d+)?)", txt, re.I)
    dif = re.search(r"\b(Muy alta|Alta|Media|Baja|Muy baja)\b", txt)
    return {"n": nombre, "km": num(km.group(1)) if km else None, "des": int(num(des.group(1))) if des else None, "dif": dif.group(1) if dif else ""}

if __name__ == "__main__":
    capas = idena()
    sal = salidas()
    out = {"t": time.strftime("%Y-%m-%d"), "idena": capas, "salidas": sal}
    INFO.insert(0, "IDENA %s · salidas carretera/gravel %d" % ({k: len(v) for k, v in capas.items()}, len(sal)))
    open("tools/bici_info.txt", "w").write("\n".join(INFO) + "\n")
    print("\n".join(INFO[:300]))
    if capas or sal:
        open("web/bici.js", "w", encoding="utf-8").write("// Bici: IDENA (Gobierno de Navarra, CC BY 4.0) y rutas de Turismo de Navarra (visitnavarra.es). Generado por tools/bici.py\nwindow.BICI=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
