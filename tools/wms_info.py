"""Lista las capas WMS de IDENA relacionadas con bosques/vegetación (para el mapa forestal de la app)."""
import re, urllib.request
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)"}
out = []
for url in ["https://idena.navarra.es/ogc/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0",
            "https://wms.mapama.gob.es/sig/Biodiversidad/MFE/wms.aspx?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0"]:
    try:
        x = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read().decode("utf-8", "replace")
        out.append(f"## {url} ({len(x)} car.)")
        for m in re.finditer(r"<Layer[^>]*>\s*<Name>([^<]+)</Name>\s*<Title>([^<]*)</Title>(.*?)</Layer>", x, re.S):
            name, title, rest = m.group(1), m.group(2), m.group(3)
            if re.search(r"forest|vegeta|bosque|arbol|árbol|MFE|habitat|hábitat|cubierta|ocupaci|uso", name + " " + title, re.I):
                q = "queryable" if 'queryable="1"' in m.group(0)[:200] else ""
                out.append(f"- {name} :: {title} {q}")
    except Exception as e:
        out.append(f"fallo {url}: {e}")
open("tools/wms_info.txt", "w", encoding="utf-8").write("\n".join(out))
print("\n".join(out))
