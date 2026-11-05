# Busca la fuente de incidencias de carreteras del Gobierno de Navarra (GitHub Actions)
import re, urllib.request, urllib.parse
OUT = []
def get(u, t=90):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Accept": "*/*"})
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, f.headers.get("Content-Type", ""), f.read()
B = "https://administracionelectronica.navarra.es/IncCarreteras/"
for page in ["Mapa.aspx", "Mapa.aspx?mode=incidences", "Default.aspx", ""]:
    try:
        st, ct, b = get(B + page); t = b.decode("utf8", "ignore"); OUT.append(f"\n== {page} {st} {len(t)}"); OUT.append(t[:3000])
        for s in re.findall(r'src=["\']([^"\']+\.js[^"\']*)', t):
            if "sitna" in s: continue
            u = urllib.parse.urljoin(B, s)
            try:
                _, _, jb = get(u); j = jb.decode("utf8", "ignore"); OUT.append(f"\n-- JS {u} {len(j)}")
                for m in sorted(set(re.findall(r'(?:url\s*:\s*|["\'])([\w./?=&:-]*(?:\.kml|\.json|\.xml|\.ashx|\.asmx|/api/|Incidenc|Servicio|Handler)[\w./?=&:-]*)', j, re.I))): OUT.append("   " + m)
                for m in re.finditer(r".{0,160}(?:incidenc|kml|ajax|fetch\(|\$\.get|getJSON).{0,220}", j, re.I):
                    OUT.append("    > " + m.group(0)[:380])
            except Exception as e: OUT.append(f"fallo js {u} {e}")
    except Exception as e: OUT.append(f"fallo {page} {e}")
for c in ["incidencias.kml", "Incidencias.kml", "incidencias.json", "obras.kml"]:
    try:
        st, ct, b = get(B + c); OUT.append(f"\n== {c} {st} {ct} {len(b)}"); OUT.append(b.decode("utf8", "ignore")[:6000])
    except Exception as e: OUT.append(f"fallo {c} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
