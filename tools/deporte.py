# Actualiza «Qué hacer → Deporte navarro» (deporte/partidos.json):
#  · Pelota: cartelera de la Federación Navarra de Pelota (fnpelota.com), toda la semana.
#  · El resto de deportes se mantiene; solo se borran los partidos viejos.
import json, re, time, urllib.request, datetime, os

PATH = "deporte/partidos.json"
URL = "https://fnpelota.com/pub/cartelera.asp?idioma=ca"
hoy = datetime.date.today().isoformat()

def traer_pelota():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (BasatiNA)"})
    h = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
    out = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S):
        cells = [re.sub(r"&nbsp;", " ", re.sub(r"<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        if len(cells) < 7 or not re.match(r"\d{2}/\d{2}/\d{4}", cells[0]):
            continue
        d, m, a = cells[0].split("/")
        # comp: queda la parte legible antes del guion largo (p. ej. "MANO PAREJAS - FASE 1 JDN - ..." → "Mano parejas")
        comp = cells[6].split(" - ")[0].split(" ½ ")[0].strip()
        comp = comp[0].upper() + comp[1:].lower() if comp else "Pelota"
        out.append({"id": "pel" + cells[0].replace("/", "") + cells[1].replace(":", "") + cells[2],
                    "dep": "pelota", "comp": comp + " (pelota)",
                    "loc": cells[4], "vis": cells[5], "f": "%s-%s-%s" % (a, d, m),
                    "h": cells[1], "lugar": cells[3],
                    "url": URL, "res": ""})
    return out

G = {"partidos": []}
if os.path.exists(PATH):
    try: G = json.load(open(PATH))
    except Exception: pass
P = [x for x in G.get("partidos", []) if x.get("dep") != "pelota" and x.get("f", "") >= hoy]
pel = [x for x in traer_pelota() if x["f"] >= hoy]
P += pel
json.dump({"partidos": P}, open(PATH, "w"), ensure_ascii=False, indent=1)
print("%d partidos (%d de pelota)" % (len(P), len(pel)))
