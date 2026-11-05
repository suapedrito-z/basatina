import json, urllib.request, time
K = json.load(open("config/aemet.json"))["key"]
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 BasatiNA", "api_key": K}), timeout=60) as f: return f.read().decode("utf8", "ignore")
for c in ["bi", "ss", "vi", "sa", "za", "vd", "as", "ba"]:
    try:
        j = json.loads(get(f"https://opendata.aemet.es/opendata/api/red/radar/regional/{c}")); OUT.append(f"{c} {j.get('estado')} {j.get('descripcion')} {j.get('datos','')}")
    except Exception as e: OUT.append(f"{c} FALLO {e}")
    time.sleep(2)
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
