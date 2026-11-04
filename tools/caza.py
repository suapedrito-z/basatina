"""
Busca en el catálogo de datos abiertos (datos.gob.es, publicador Gobierno de Navarra) las capas de caza
(cotos, zonas de caza...) y, si encuentra los cotos, los guarda en web/caza.js para la app.
Escribe tools/caza_info.txt con lo encontrado. Lo ejecuta GitHub Actions.
"""
import io, json, time, urllib.request, urllib.parse, zipfile, collections
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "application/json"}
def get(url, binary=False):
    r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
    return r if binary else r.decode("utf-8", "replace")
info, urls = [], []
for q in ["cotos de caza", "caza", "cinegetic", "CAZAPE"]:
    try:
        j = json.loads(get("https://datos.gob.es/apidata/catalog/dataset/title/" + urllib.parse.quote(q) + "?_pageSize=50"))
        for it in j.get("result", {}).get("items", []):
            pub = str(it.get("publisher", ""))
            if "A15002917" not in pub.upper():
                continue
            title = it.get("title")
            dists = it.get("distribution", [])
            dists = dists if isinstance(dists, list) else [dists]
            acc = [d.get("accessURL") for d in dists if isinstance(d, dict)]
            info.append(f"- {title} :: {acc}")
            urls += [u for u in acc if isinstance(u, str)]
    except Exception as e:
        info.append(f"búsqueda '{q}' falló: {e}")
urls = sorted(set(urls))
info.append("\nURLs: " + "\n".join(urls))
# probar también nombres típicos de IDENA
for name in ["CAZAPE_Pol_Cotos", "CAZAPE_Pol_CotoCaza", "CAZAPE_Pol_Coto", "CAZAPE_Pol_CotosCaza", "CAZAPE_Pol_ZonaCaza"]:
    u = f"https://idena.navarra.es/descargas/{name}.zip"
    try:
        b = get(u, True); info.append(f"OK {u} {len(b)} bytes"); urls.append(u)
    except Exception as e:
        info.append(f"no {u}: {e}")
open("tools/caza_info.txt", "w", encoding="utf-8").write("\n".join(map(str, info)))
print("\n".join(map(str, info)))
