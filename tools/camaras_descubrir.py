import urllib.request, re, os
OUT = []; os.makedirs("tools/tmp", exist_ok=True)
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=60) as f: return f.read()
B = "https://www.euskalmet.euskadi.eus"
for n, p in [("rayos", "/vamet/radar_ray/lightning/webmet00-0000.png"), ("maxref", "/vamet/radar_reflectivity/max_reflect/webmet00-0000.png")]:
    open(f"tools/tmp/{n}.png", "wb").write(get(B + p))
t = get(B + "/scripts/webmet00-radarkapildui-script.js").decode("utf8", "ignore"); OUT.append(t[:15000])
for d in ["/vamet/radar_ray/lightning/", "/vamet/radar_reflectivity/max_reflect/"]:
    try: OUT.append(f"\n== {d}\n" + re.sub(r"<[^>]+>", " ", get(B + d).decode("utf8", "ignore"))[:1500])
    except Exception as e: OUT.append(f"fallo {d} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
