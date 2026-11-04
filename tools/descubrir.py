"""Lista datasets de IDENA (datos.gob.es) y capas WMS para: senderos, cuevas, fuentes, cascadas, áreas recreativas,
refugios, miradores, patrimonio, Camino de Santiago, zonas de baño, incendios. Escribe tools/descubrir.txt"""
import json, re, ssl, urllib.parse, urllib.request
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "application/json"}
def get(u, js=True):
    h = dict(UA) if js else {"User-Agent": UA["User-Agent"]}
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120).read().decode("utf-8", "replace")
out, seen = [], set()
KW = ["sender", "GR ", "PR-NA", "SL-NA", "camino de santiago", "cavidad", "cueva", "sima", "fuente", "manantial", "cascada", "nacedero",
      "área recreativa", "areas recreativas", "refugio", "mirador", "paisaje", "patrimonio", "castillo", "puente", "ermita", "bien de interés",
      "baño", "incendio", "vía verde", "itinerario", "geológic", "lugares de interés"]
for q in KW:
    try:
        j = json.loads(get("https://datos.gob.es/apidata/catalog/dataset/title/" + urllib.parse.quote(q.strip()) + "?_pageSize=60"))
    except Exception as e:
        out.append(f"!! {q}: {e}"); continue
    for it in j.get("result", {}).get("items", []):
        if "A15002917" not in str(it.get("publisher", "")).upper():
            continue
        t = it.get("title"); t = [x.get("_value") for x in t if isinstance(x, dict) and x.get("_lang") == "es"] if isinstance(t, list) else [t]
        d = it.get("distribution", []); d = d if isinstance(d, list) else [d]
        acc = [x.get("accessURL") for x in d if isinstance(x, dict) and str(x.get("accessURL", "")).lower().endswith(".zip")]
        key = (t[0] if t else "") + str(acc)
        if key in seen or not acc: continue
        seen.add(key); out.append(f"[{q.strip()}] {t[0] if t else '?'} :: {acc}")
try:
    x = get("https://idena.navarra.es/ogc/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0", False)
    out.append("\n## WMS")
    for m in re.finditer(r"<Layer[^>]*>\s*<Name>([^<]+)</Name>\s*<Title>([^<]*)</Title>", x):
        if re.search(r"sender|camino|cavid|cueva|sima|fuente|manant|cascad|nacede|recreat|refugio|mirador|patrim|castill|puente|ermita|baño|incend|vía verde|itinerar|geolog|kárstic", m.group(1) + " " + m.group(2), re.I):
            out.append(f"- {m.group(1)} :: {m.group(2)}")
except Exception as e:
    out.append(f"!! WMS {e}")
open("tools/descubrir.txt", "w", encoding="utf-8").write("\n".join(out)); print("\n".join(out))
