import re, urllib.request, urllib.parse, unicodedata
UA = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) BasatiNA/1.0", "Accept": "*/*", "Accept-Language": "es-ES"}
def st(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30); b = r.read(300); return "%s %s %r" % (r.status, r.headers.get("Content-Type"), b[:80])
    except Exception as e: return str(e)
p = urllib.request.urlopen(urllib.request.Request("https://www.visitnavarra.es/es/detalle-ruta/-/r/valle-de-roncal", headers=UA), timeout=60).read().decode("utf-8", "replace")
for m in re.finditer(r'.{0,200}\.gpx.{0,200}', p, re.I): print("CONTEXTO:", m.group(0).replace("\n", " ")[:420])
hrefs = re.findall(r'(?:href|src|data-[a-z-]+)="([^"]*?\.gpx[^"]*)"', p, re.I)
print("HREFS:", hrefs)
for h in hrefs[:2]:
    u = h if h.startswith("http") else "https://www.visitnavarra.es" + h
    pr = urllib.parse.urlsplit(u)
    for nombre, v in [("tal cual", u.replace(" ", "%20")),
                      ("quote", urllib.parse.urlunsplit((pr.scheme, pr.netloc, urllib.parse.quote(urllib.parse.unquote(pr.path), safe="/"), pr.query, ""))),
                      ("quote NFD", urllib.parse.urlunsplit((pr.scheme, pr.netloc, urllib.parse.quote(unicodedata.normalize("NFD", urllib.parse.unquote(pr.path)), safe="/"), pr.query, ""))),
                      ("plus", urllib.parse.urlunsplit((pr.scheme, pr.netloc, urllib.parse.quote_plus(urllib.parse.unquote(pr.path), safe="/"), pr.query, "")))]:
        print(nombre, "->", v[:200], "=>", st(v))
