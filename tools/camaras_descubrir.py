import json, urllib.request, io, subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pillow"])
from PIL import Image
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 BasatiNA"}), timeout=60) as f: return f.read()
j = json.loads(get("https://api.rainviewer.com/public/weather-maps.json")); f = j["radar"]["past"][-1]
for z, x, y in [(7, 63, 46), (7, 62, 46), (7, 64, 46), (7, 63, 47), (6, 31, 23), (4, 7, 5), (3, 3, 2)]:
    im = Image.open(io.BytesIO(get(f'{j["host"]}{f["path"]}/256/{z}/{x}/{y}/2/1_1.png'))).convert("RGBA")
    a = [p for p in im.getdata() if p[3] > 0]
    OUT.append(f"{z}/{x}/{y} {im.size} pixeles con lluvia: {len(a)} ejemplo {a[:3]}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
