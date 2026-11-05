# Junta lo que Pedro y Sonia escriben en pueblos/*.json en un solo archivo para la app (web/agenda.js):
# fechas de fiestas de cada pueblo y la lista de pueblos que ya tienen historia o fotos.
import json, glob, os, time
fiestas, con = [], []
for f in sorted(glob.glob("pueblos/*.json")):
    try: d = json.load(open(f))
    except Exception: continue
    slug = os.path.basename(f)[:-5]
    for x in d.get("fiestasF", []):
        if x.get("ini"): fiestas.append({"s": slug, "p": d.get("n", slug), "n": x.get("n", ""), "ini": x["ini"], "fin": x.get("fin") or x["ini"]})
    if any(d.get(k) for k in ("historia", "curiosidades", "fiestas", "gastronomia")) or d.get("fotos"):
        con.append({"s": slug, "p": d.get("n", slug), "f": len(d.get("fotos", []))})
open("web/agenda.js", "w").write("window.AGENDA=" + json.dumps({"t": time.strftime("%Y-%m-%d %H:%M"), "fiestas": fiestas, "con": con}, ensure_ascii=False, separators=(",", ":")) + ";")
print(len(fiestas), "fiestas ·", len(con), "pueblos con contenido")
