# Busca cámaras/webcams de Navarra (se ejecuta en GitHub Actions). Escribe tools/camaras_info.txt
import re, urllib.request, urllib.parse
OUT = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); OUT.append(s)
def get(u, t=60):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Accept": "*/*", "Accept-Language": "es-ES,es"})
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, f.headers.get("Content-Type", ""), f.read()

# 1) DGT (DATEX2)
for u in ["https://infocar.dgt.es/datex2/dgt/CCTVSiteTablePublication/all/content.xml", "http://infocar.dgt.es/datex2/dgt/CCTVSiteTablePublication/all/content.xml"]:
    try:
        st, ct, b = get(u, 120); t = b.decode("utf8", "ignore"); log("\n== DGT", u, st, len(t))
        recs = re.split(r"<(?:_0:)?cctvCameraMetadataRecord\b", t)
        log("registros", len(recs) - 1); log("EJEMPLO", re.sub(r"\s+", " ", recs[1][:2500]) if len(recs) > 1 else t[:2000])
        n = 0
        for r in recs[1:]:
            if re.search(r"Navarra|NAVARRA|Pamplona|Tudela", r):
                n += 1
                if n <= 80: log("NAV", re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " | ", r))[:600])
        log("Navarra:", n); break
    except Exception as e: log("fallo DGT", u, e)

# 2) páginas con cámaras de Navarra: sacar las imágenes
PAGES = ["https://www.enterat.com/servicios/webcams-pamplona-navarra.php", "https://www.enterat.com/servicios/camaras-trafico-navarra.php",
         "https://www.alberguesyrefugios.com/contacto", "https://www.alberguesyrefugios.com/webcams", "https://www.alberguesyrefugios.com/",
         "https://www.larrabelagua.com/", "https://www.larra-belagua.com/", "https://www.valledelroncal.es/webcams", "https://www.vallederoncal.es/",
         "https://www.windy.com/webcams/1519730803", "https://www.windy.com/webcams/1610092408",
         "https://www.navarra.es/es/carreteras", "https://www.navarra.es/es/web/carreteras/camaras", "https://carreteras.navarra.es/",
         "https://www.trafikoa.eus/", "https://www.meteonavarra.es/webcams", "https://www.meteoroncal.com/", "https://www.abodi.es/",
         "https://www.turismo.navarra.es/esp/organice-viaje/webcams/", "https://www.visitnavarra.es/es/webcams"]
for u in PAGES:
    try:
        st, ct, b = get(u); t = b.decode("utf8", "ignore")
        imgs = sorted(set(re.findall(r'(?:src|data-src|href)=["\']([^"\']+\.(?:jpg|jpeg|png|php\?[^"\']*|cgi[^"\']*)(?:\?[^"\']*)?)["\']', t, re.I)))
        cams = [x for x in imgs if re.search(r"cam|web|trafic|camara|snap|live|image", x, re.I)]
        ifr = sorted(set(re.findall(r'<iframe[^>]+src=["\']([^"\']+)', t, re.I)))
        log(f"\n== {u} {st} {ct} len {len(t)} imgs {len(imgs)} cams {len(cams)}")
        for x in cams[:80]: log("  img", x)
        for x in ifr[:20]: log("  iframe", x)
        tit = re.findall(r'(?:alt|title)=["\']([^"\']{4,80})["\']', t)
        log("  titulos", sorted(set(x for x in tit if re.search(r"cam|webcam|c[aá]mara", x, re.I)))[:60])
    except Exception as e: log("fallo", u, e)
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
