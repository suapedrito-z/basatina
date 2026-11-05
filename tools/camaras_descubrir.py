import urllib.request, re
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=60) as f: return dict(f.headers), f.read()
B = "https://www.euskalmet.euskadi.eus/vamet/radar_kapildui_detail/"
for d in ["", "intensity/today/", "intensity/", "acumulated/today/", "long_range/today/", "long_range/", "reflectivity/today/"]:
    try:
        h, b = get(B + d); t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b.decode("utf8", "ignore")))
        OUT.append(f"== {d} ACAO={h.get('Access-Control-Allow-Origin')}\n{t[:600]} ... {t[-500:]}")
    except Exception as e: OUT.append(f"fallo {d} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
