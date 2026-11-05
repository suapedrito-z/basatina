import urllib.request, re
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Referer": "https://www.euskalmet.euskadi.eus/observacion/radar-kapildui-precipitaciones/"}), timeout=60) as f: return f.read().decode("utf8", "ignore")
B = "https://www.euskalmet.euskadi.eus"
for p in ["/scripts/webmet00-radarkapildui-script.js", "/scripts/custom/js/webmet00-kapilduiMini.js"]:
    try:
        t = get(B + p); OUT.append(f"===== {p} {len(t)}")
        for m in re.finditer(r".{0,250}(?:getUrlFunction|getUrlLocal|http|\.png|\.gif|vamet|/media/).{0,250}", t): OUT.append("  > " + m.group(0)[:500])
    except Exception as e: OUT.append(f"fallo {p} {e}")
for d in ["/vamet/radar/", "/vamet/radar_kapildui/", "/vamet/"]:
    try: OUT.append(f"== {d}\n" + re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", get(B + d)))[:2500])
    except Exception as e: OUT.append(f"fallo {d} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
