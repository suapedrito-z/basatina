import urllib.request, re
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=60) as f: return f.headers, f.read()
B = "https://www.euskalmet.euskadi.eus"
for p in ["/scripts/custom/js/webmet00-kapilduiMap.js", "/scripts/custom/js/webmet00-const.js", "/vamet/radar_ray/webmet00-radar-lightning.js", "/vamet/radar_reflectivity/webmet00-radar-reflectivity.js"]:
    try:
        h, b = get(B + p); t = b.decode("utf8", "ignore"); OUT.append(f"\n===== {p} {len(t)}"); OUT.append(t[:7000])
    except Exception as e: OUT.append(f"fallo {p} {e}")
for p in ["/vamet/radar_ray/lightning/webmet00-0000.png", "/vamet/radar_reflectivity/max_reflect/webmet00-0000.png"]:
    try: h, b = get(B + p); OUT.append(f"IMG {p} {len(b)} {h.get('Content-Type')} {h.get('Last-Modified')} ACAO={h.get('Access-Control-Allow-Origin')}")
    except Exception as e: OUT.append(f"fallo {p} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
