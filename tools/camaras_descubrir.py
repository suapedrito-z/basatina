import re, urllib.request
OUT = []
def get(u, t=90):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Accept": "*/*"})
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, f.headers.get("Content-Type", ""), f.read()
for u in ["https://administracionelectronica.navarra.es/IncCarreteras/camaras.kml", "https://administracionelectronica.navarra.es/IncCarreteras/Camaras.kml"]:
    try:
        st, ct, b = get(u); OUT.append(f"== {u} {st} {ct} {len(b)}"); OUT.append(b.decode("utf8", "ignore")[:60000]); break
    except Exception as e: OUT.append(f"fallo {u} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
