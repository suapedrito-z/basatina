import re, json, urllib.request
OUT = []
def get(u, t=90, h=None):
    hd = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Accept": "application/json, */*"}; hd.update(h or {})
    r = urllib.request.Request(u, headers=hd)
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, dict(f.headers), f.read()
B = "https://administracionelectronica.navarra.es/IncCarreteras/"
for c in ["api/incidents", "api/incidents?lang=es"]:
    try:
        st, hd, b = get(B + c, h={"Origin": "https://localhost"}); t = b.decode("utf8", "ignore")
        OUT.append(f"\n===== {c} {st} {hd.get('Content-Type')} ACAO={hd.get('Access-Control-Allow-Origin')} {len(t)}"); OUT.append(t[:15000])
    except Exception as e: OUT.append(f"fallo {c} {e}")
try:
    st, hd, b = get(B + "bundles/js?v=tMLrKv2WBNMT5rXQvCbt7g1lUqoRQitIdaOzvrLARRQ1"); j = b.decode("utf8", "ignore")
    i = j.find("api/incidents"); OUT.append("\n===== bundle alrededor de api/incidents"); OUT.append(j[max(0, i-3000):i+6000])
    for m in sorted(set(re.findall(r"incident\.(\w+)", j))): OUT.append("campo " + m)
except Exception as e: OUT.append(f"fallo bundle {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
