"""
Terremotos y fallas activas de Navarra y alrededores. Guarda web/sismo.js y escribe tools/sismo_info.txt.
- Terremotos desde 1980: servicio FDSN del EMSC (Centro Sismológico Euromediterráneo), que reúne los datos de la
  Red Sísmica Nacional del IGN y de las redes vecinas. Los de los últimos días los pide la propia app al abrirla.
- Fallas activas (del Cuaternario): base de datos QAFI del IGME-CSIC.
"""
import json, time, urllib.parse, urllib.request
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "*/*"}
# recuadro algo mayor que Navarra (sur, oeste, norte, este) para ver también lo que pasa cerca
S, W, N, E = 41.7, -2.9, 43.6, -0.4
info = []
def get(u, t=180):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
out = {"t": time.strftime("%Y-%m-%d"), "q": [], "f": []}

# ---------- TERREMOTOS (EMSC) ----------
try:
    q = []
    for y0 in range(1980, int(time.strftime("%Y")) + 1, 10):  # por décadas para no pedir demasiado de golpe
        u = "https://www.seismicportal.eu/fdsnws/event/1/query?" + urllib.parse.urlencode({
            "format": "json", "starttime": f"{y0}-01-01", "endtime": f"{y0+10}-01-01", "minlat": S, "maxlat": N,
            "minlon": W, "maxlon": E, "minmag": 1.0, "limit": 20000, "orderby": "time-asc"})
        try:
            raw = get(u)
        except urllib.error.HTTPError as e:
            if e.code == 204: continue  # sin terremotos en esa década
            raise
        if not raw.strip(): info.append(f"terremotos {y0}: respuesta vacía"); continue
        j = json.loads(raw)
        for f in j.get("features", []):
            p = f["properties"]; lo, la = f["geometry"]["coordinates"][:2]
            if p.get("mag") is None: continue
            q.append([p["time"][:19], round(la, 3), round(lo, 3), round(abs(p.get("depth") or 0), 1), round(p["mag"], 1),
                      p.get("magtype") or "", p.get("unid") or "", (p.get("flynn_region") or "").title()])
        info.append(f"terremotos {y0}-{y0+9}: {len(q)} acumulados"); time.sleep(2)
    out["q"] = q
    big = sorted(q, key=lambda r: -r[4])[:15]
    info.append("Mayores: " + "; ".join(f"{r[0][:10]} M{r[4]} {r[7]}" for r in big))
except Exception as e:
    info.append(f"fallo terremotos: {e}")

# ---------- FALLAS ACTIVAS (IGME · QAFI v4) ----------
try:
    B = "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_QAFI/MapServer"
    capas = json.loads(get(B + "?f=json")).get("layers", [])
    info.append("capas QAFI: " + "; ".join(f"{c['id']}={c['name']}" for c in capas))
    lid = next(c["id"] for c in capas if "fault" in c["name"].lower() and not any(w in c["name"].lower() for w in ("discard", "debat", "neotect")))
    info.append(f"capa usada: {lid}")
    u = f"{B}/{lid}/query?" + urllib.parse.urlencode({
        "where": "1=1", "geometry": f"{W},{S},{E},{N}", "geometryType": "esriGeometryEnvelope", "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects", "outFields": "*", "outSR": 4326, "f": "geojson"})
    j = json.loads(get(u))
    campos = {}
    for f in j.get("features", []):
        a = {k: v for k, v in (f.get("properties") or {}).items() if v not in (None, "", " ")}
        for k, v in a.items(): campos.setdefault(k, str(v)[:50])
        g = f.get("geometry") or {}
        lines = g["coordinates"] if g.get("type") == "MultiLineString" else [g.get("coordinates") or []]
        r = [[[round(c[1], 4), round(c[0], 4)] for c in ln] for ln in lines if len(ln) >= 2]
        if r: out["f"].append({"a": {k: (str(v)[:300] if isinstance(v, str) else v) for k, v in a.items()}, "r": r})
    info.append(f"\nfallas: {len(out['f'])}\ncampos (ejemplo): " + json.dumps(campos, ensure_ascii=False))
except Exception as e:
    info.append(f"fallo fallas: {e}")

txt = ("// Terremotos (EMSC · Red Sísmica Nacional del IGN y redes vecinas) y fallas activas (IGME-CSIC, QAFI). Generado por tools/sismo.py\n"
       "window.SISMO_GEO=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
open("web/sismo.js", "w", encoding="utf-8").write(txt)
info.append(f"\nsismo.js: {len(txt)//1024} KB · {len(out['q'])} terremotos · {len(out['f'])} fallas")
open("tools/sismo_info.txt", "w", encoding="utf-8").write("\n".join(info)); print("\n".join(info))
