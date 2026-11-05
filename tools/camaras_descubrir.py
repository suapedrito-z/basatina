import json, urllib.request, time, re, os
K = json.load(open("config/aemet.json"))["key"]
OUT = []; os.makedirs("tools/tmp", exist_ok=True)
def get(u, h=None, raw=False):
    hd = {"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}; hd.update(h or {})
    with urllib.request.urlopen(urllib.request.Request(u, headers=hd), timeout=60) as f:
        b = f.read(); return b if raw else b.decode("utf8", "ignore")
for c in ["ss", "sa"]:
    try:
        j = json.loads(get(f"https://opendata.aemet.es/opendata/api/red/radar/regional/{c}", {"api_key": K}))
        b = get(j["datos"], raw=True); open(f"tools/tmp/aemet_{c}.img", "wb").write(b); OUT.append(f"{c} {len(b)}")
    except Exception as e: OUT.append(f"{c} FALLO {e}")
    time.sleep(2)
for u in ["https://www.euskalmet.euskadi.eus/radar/", "https://www.euskalmet.euskadi.eus/observacion/radar/", "https://www.euskalmet.euskadi.eus/inicio/"]:
    try:
        t = get(u); OUT.append(f"\n== {u} {len(t)}")
        for m in sorted(set(re.findall(r'["\'(]([^"\'()\s]*(?:radar|Radar|RADAR)[^"\'()\s]*)["\')]', t)))[:80]: OUT.append("  " + m)
    except Exception as e: OUT.append(f"fallo {u} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
