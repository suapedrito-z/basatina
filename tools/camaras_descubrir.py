# Busca el KML de cámaras del Gobierno de Navarra (GitHub Actions). Escribe tools/camaras_info.txt
import re, urllib.request, urllib.parse
OUT = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); OUT.append(s)
def get(u, t=90):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Accept": "*/*"})
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, f.headers.get("Content-Type", ""), f.read()
B = "https://administracionelectronica.navarra.es/IncCarreteras/"
try:
    st, ct, b = get(B + "Mapa.aspx?mode=cameras"); t = b.decode("utf8", "ignore"); log("mapa", st, len(t))
    for m in sorted(set(re.findall(r'["\']([^"\']*(?:\.kml|\.kmz|\.js|\.json|camar[^"\']*)[^"\']*)["\']', t, re.I)))[:120]: log("  ref", m)
    open("/tmp/mapa.html", "w").write(t)
except Exception as e: log("fallo mapa", e)
cands = re.findall(r'["\']([^"\']*CamarasCarreteras[^"\']*)["\']', open("/tmp/mapa.html").read()) if True else []
for c in cands + ["CamarasCarreteras.kml", "kml/CamarasCarreteras.kml", "Kml/CamarasCarreteras.kml", "../IncCarreteras/kml/CamarasCarreteras.kml"]:
    u = urllib.parse.urljoin(B, c)
    try:
        st, ct, b = get(u); t = b.decode("utf8", "ignore"); log("\n== KML", u, st, ct, len(t)); log(t[:30000]); break
    except Exception as e: log("fallo", u, e)
# js de la página que pueda tener la lista de cámaras
try:
    t = open("/tmp/mapa.html").read()
    for s in re.findall(r'<script[^>]+src=["\']([^"\']+)', t)[:30]:
        u = urllib.parse.urljoin(B, s)
        try:
            st, ct, b = get(u); x = b.decode("utf8", "ignore")
            if re.search(r"camar|kml", x, re.I):
                log("\n== JS", u, len(x))
                for m in re.finditer(r".{0,200}(?:camar|kml).{0,200}", x, re.I):
                    log("   ", m.group(0)[:400])
                    if len(OUT) > 3000: break
        except Exception as e: log("fallo js", u, e)
    i = t.lower().find("camar")
    while i >= 0 and len(OUT) < 3500:
        log("HTML", re.sub(r"\s+", " ", t[max(0, i-200):i+300])); i = t.lower().find("camar", i + 300)
except Exception as e: log("fallo html", e)
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
