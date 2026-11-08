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
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
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

def pamplona():
    """Red ciclable de Pamplona por WFS (GeoServer del SIG municipal). Probamos varias direcciones."""
    capa = "Pamplona:MOVI_Lin_RedCiclable"
    for base in ["https://sig.pamplona.es/ogc/wfs", "https://sig.pamplona.es/ogc/ows", "https://sig.pamplona.es/geoserver/wfs", "https://sig.pamplona.es/ogc/Pamplona/wfs"]:
        u = base + "?" + urllib.parse.urlencode({"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": capa,
                                                 "outputFormat": "application/json", "srsName": "EPSG:4326", "count": "20000"})
        try: b = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=200).read().decode("utf-8", "replace")
        except Exception as e: b = None; INFO.append("  " + str(e))
        INFO.append("PAMPLONA %s -> %s" % (base, (b or "ERROR")[:160].replace("\n", " ")))
        if not b or not b.lstrip().startswith("{"): continue
        try: j = json.loads(b)
        except Exception: continue
        out = []
        for f in j.get("features", []):
            g = f.get("geometry") or {}; P = f.get("properties") or {}
            lines = g.get("coordinates", [])
            if g.get("type") == "LineString": lines = [lines]
            for ln in lines:
                pts = [[round(c[1], 5), round(c[0], 5)] for c in ln]
                # si vinieran en UTM (no en grados) no valen
                if pts and abs(pts[0][0]) <= 90:
                    out.append({"a": {"CAT": P.get("CATEGORIA") or P.get("TIPO_VIA") or "", "VIA": P.get("VIA") or ""}, "r": [simplify(pts, 0.00008)]})
        INFO.append("  tramos red ciclable: %d · campos: %s" % (len(out), list((j.get("features") or [{}])[0].get("properties", {}).keys())[:20]))
        if out: return out
    return []

if __name__ == "__main__":
    rutas = visitnavarra() + eurovelo()
    pam = pamplona()
    out = {"t": time.strftime("%Y-%m-%d"), "rutas": rutas, "pamplona": pam}
    INFO.insert(0, "rutas %d (%s) · red ciclable Pamplona %d tramos" % (len(rutas), {t: sum(1 for r in rutas if r["tipo"] == t) for t in LISTAS}, len(pam)))
    open("tools/bici_info.txt", "w").write("\n".join(INFO) + "\n")
    print("\n".join(INFO[:400]))
    if rutas or pam:
        open("web/bici.js", "w", encoding="utf-8").write("// Rutas en bici: Turismo de Navarra (visitnavarra.es) y red ciclable del Ayuntamiento de Pamplona (sig.pamplona.es). Generado por tools/bici.py\nwindow.BICI=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
