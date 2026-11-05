# Comprueba el radar de RainViewer (GitHub Actions)
import json, urllib.request, io, zlib, struct
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 BasatiNA"}), timeout=60) as f: return f.status, dict(f.headers), f.read()
st, hd, b = get("https://api.rainviewer.com/public/weather-maps.json"); j = json.loads(b)
OUT.append(json.dumps(j)[:1500])
f = j["radar"]["past"][-1]
for z, x, y in [(7, 63, 46), (7, 63, 47), (6, 31, 23), (5, 15, 11), (4, 7, 5), (3, 3, 2)]:
    u = f'{j["host"]}{f["path"]}/256/{z}/{x}/{y}/2/1_1.png'
    try:
        st, hd, b = get(u); OUT.append(f"{z}/{x}/{y} {st} {hd.get('Content-Type')} {len(b)} bytes ACAO={hd.get('Access-Control-Allow-Origin')}")
    except Exception as e: OUT.append(f"{z}/{x}/{y} FALLO {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
