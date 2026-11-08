import json, re, urllib.parse, urllib.request
UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)", "Accept": "application/json"}
def get(u, js=True, t=60):
    h = dict(UA) if js else {"User-Agent": UA["User-Agent"]}
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=t).read()
for q in ["bici", "ciclable", "ciclista", "cicloturis", "BTT", "eurovelo", "carril bici", "vías ciclistas", "ruta ciclo"]:
    try: j = json.loads(get("https://datos.gob.es/apidata/catalog/dataset/title/" + urllib.parse.quote(q) + "?_pageSize=60"))
    except Exception as e: print("!!", q, e); continue
    for it in j.get("result", {}).get("items", []):
        pub = str(it.get("publisher", ""))
        if not re.search(r"A15002917|L01312016|navarr|pamplona", pub, re.I): continue
        t = it.get("title"); t = [x.get("_value") for x in t if isinstance(x, dict) and x.get("_lang") == "es"] if isinstance(t, list) else [t]
        d = it.get("distribution", []); d = d if isinstance(d, list) else [d]
        print("DATASET [%s] %s :: %s" % (q, t[0] if t else "?", [x.get("accessURL") for x in d if isinstance(x, dict)][:4]))
for wms in ["https://idena.navarra.es/ogc/wms", "https://sig.pamplona.es/ogc/wms"]:
    try:
        x = get(wms + "?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0", False, 40).decode("utf-8", "replace")
        n = 0
        for m in re.finditer(r"<Name>([^<]+)</Name>\s*<Title>([^<]*)</Title>", x):
            if re.search(r"bici|cicl|btt|eurovelo|gravel", m.group(1) + " " + m.group(2), re.I): print("WMS", wms, m.group(1), "::", m.group(2)); n += 1
        print("WMS", wms, "OK, capas bici:", n)
    except Exception as e: print("!! WMS", wms, e)
for u in ["https://sig.pamplona.es/descargas/MOVI_Lin_RedCiclable.zip", "https://idena.navarra.es/descargas/DOTACI_Lin_PRNA.zip"]:
    try: b = get(u, False, 40); print("ZIP", u, len(b), b[:4])
    except Exception as e: print("!! ZIP", u, e)
