# Junta las fichas de arboles/*.json en web/arboles.js para la app (lectura sin llave)
import json, glob, os, time
L = []
for f in sorted(glob.glob("arboles/*.json")):
    try: d = json.load(open(f))
    except Exception: continue
    d["id"] = os.path.basename(f)[:-5]; L.append(d)
open("web/arboles.js", "w").write("window.ARBOLES=" + json.dumps({"t": time.strftime("%Y-%m-%d %H:%M"), "L": L}, ensure_ascii=False, separators=(",", ":")) + ";")
print(len(L), "árboles")
