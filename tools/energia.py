# ⚡ Energía en Navarra. Se ejecuta en GitHub Actions (cada día) y escribe web/energia.js
#  1) Parques eólicos, aerogeneradores y plantas solares en servicio (IDENA, Gobierno de Navarra)
#  2) Centrales hidráulicas y otras (OpenStreetMap)
#  3) Producción real por tecnología, mes a mes (Red Eléctrica, REData) y potencia instalada
#  4) Calibración: con el viento y el sol del pasado (Open-Meteo, ERA5) se calcula cuánto "deberían"
#     haber producido los parques y se compara con lo que REE dice que produjeron de verdad.
#     El móvil usa ese número (k) para estimar la producción de cada hora con la previsión.
import io, json, time, math, re, urllib.request, urllib.parse, zipfile, collections, datetime as dt
import shapefile
from pyproj import Transformer
UA = {"User-Agent": "BasatiNA/3.0 (+https://github.com/suapedrito-z/basatina)", "Accept": "*/*"}
B = "https://idena.navarra.es/descargas/"
tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
info = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); info.append(s)
def get(u, data=None, hdr=None, timeout=120):
    h = dict(UA); h.update(hdr or {})
    with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=h), timeout=timeout) as f:
        return f.read()

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = (dx*dx+dy*dy) or 1e-12; best, idx = -1, 0
    for i in range(1, len(pts)-1):
        p = pts[i]; t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)); d = ((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)**.5
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)

def capa(key):
    z = zipfile.ZipFile(io.BytesIO(get(B + key + ".zip", timeout=180)))
    names = z.namelist(); base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
    g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base+ext).lower()][0]))
    sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252"); fields = [f[0] for f in sf.fields[1:]]
    vals = collections.defaultdict(collections.Counter); feats = []
    for sr in sf.iterShapeRecords():
        at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(fields, sr.record)}
        for k, v in at.items(): vals[k][str(v)[:60]] += 1
        s = sr.shape
        if not s.points: continue
        parts = list(s.parts or [0]) + [len(s.points)]; rings = []
        for i in range(len(parts)-1):
            pts = [[round(la, 5), round(lo, 5)] for lo, la in (tr.transform(x, y) for x, y in [p[:2] for p in s.points[parts[i]:parts[i+1]]])]
            pts = simplify(pts, 0.0003)
            if pts: rings.append(pts)
        allp = [p for r in rings for p in r]
        c = [round(sum(p[0] for p in allp)/len(allp), 4), round(sum(p[1] for p in allp)/len(allp), 4)]
        feats.append({"at": at, "r": rings, "c": c})
    log(f"\n## {key}: {len(feats)} · campos {fields}")
    for k in fields:
        log(f"- {k}: {len(vals[k])} · {list(vals[k].most_common(8))}")
    return feats

def num(v):
    try: return float(str(v).replace(",", "."))
    except Exception: return None
def pick(at, *pats):
    for p in pats:
        for k, v in at.items():
            if re.search(p, k, re.I) and v not in ("", None): return v
    return None

out = {"t": time.strftime("%Y-%m-%d %H:%M"), "parques": [], "aero": [], "solar": [], "otras": []}
DROP = {"FEATURE", "BEGINLIFE", "GEOM_LONG", "GEOM_AREA", "GEOM_PERI", "X25830", "Y25830", "OBJECTID", "FID", "ID", "SHAPE_LENG", "SHAPE_AREA"}
def limpia(at): return {k: (str(v)[:120] if isinstance(v, str) else v) for k, v in at.items() if v not in ("", None, "-", 0, 0.0, "0") and k not in DROP}

# ---------- 1) IDENA ----------
try:
    for f in capa("ENERGI_Lin_Peolico"):
        out["parques"].append({"a": limpia(f["at"]), "r": f["r"], "c": f["c"]})
except Exception as e: log("fallo parques", e)
try:
    for f in capa("ENERGI_Sym_AeroGen"):
        a = limpia(f["at"]); out["aero"].append({"a": a, "pt": f["c"]})
except Exception as e: log("fallo aerogeneradores", e)
try:
    for f in capa("ENERGI_Pol_PSolar"):
        out["solar"].append({"a": limpia(f["at"]), "r": f["r"], "c": f["c"]})
except Exception as e: log("fallo solar", e)

# ---------- 2) OSM: centrales hidráulicas, biomasa, etc. ----------
Q = """[out:json][timeout:180];area["ISO3166-2"="ES-NA"]->.a;
(nwr["power"="plant"](area.a);nwr["power"="generator"]["generator:source"~"hydro|biomass|biogas|waste"](area.a););out center tags;"""
j = None
for s in ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"] * 2:
    try:
        j = json.loads(get(s, data=urllib.parse.urlencode({"data": Q}).encode(), hdr={"Accept": "application/json"}, timeout=240)); break
    except Exception as e:
        log("overpass", s, e); time.sleep(8)
if j:
    cnt = collections.Counter()
    for e in j["elements"]:
        t = e.get("tags", {}); src = t.get("plant:source") or t.get("generator:source") or "?"
        cnt[src] += 1
        if src in ("wind", "solar"): continue   # esas vienen de IDENA
        c = e.get("center") or {"lat": e.get("lat"), "lon": e.get("lon")}
        if c.get("lat") is None: continue
        out["otras"].append({"src": src, "n": t.get("name") or t.get("name:es") or "", "mw": t.get("plant:output:electricity") or t.get("generator:output:electricity") or "",
                             "op": t.get("operator") or "", "pt": [round(c["lat"], 4), round(c["lon"], 4)], "w": t.get("wikipedia") or ""})
    log("\n## OSM centrales:", cnt)
    for o in out["otras"][:200]: log(" *", o)

# ---------- 3) REE ----------
REE = "https://apidatos.ree.es/es/datos/"
def ree(path, tries=3):
    for i in range(tries):
        try: return json.loads(get(REE + path, hdr={"Accept": "application/json"}, timeout=90))
        except Exception as e:
            log("REE fallo", path[:90], e); time.sleep(6)
    return None
hoy = dt.date.today(); mens = {}
for y in range(2019, hoy.year + 1):
    jj = ree(f"generacion/estructura-generacion?start_date={y}-01-01T00:00&end_date={y}-12-31T23:59&time_trunc=month&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14")
    if not jj: continue
    for inc in jj.get("included", []):
        t = inc["attributes"]["title"]
        for v in inc["attributes"]["values"]:
            mens.setdefault(t, {})[v["datetime"][:7]] = round(v["value"], 1)
meses = sorted({m for d in mens.values() for m in d})
out["ree"] = {"meses": meses, "tec": {t: [d.get(m) for m in meses] for t, d in mens.items()}}
log("\n## REE meses", len(meses), meses[:1], meses[-1:], list(mens))
# producción por días (si REE lo da para Navarra)
dias = {}
for back in (1,):
    a = (hoy.replace(day=1) - dt.timedelta(days=32*back)).replace(day=1); b = (a + dt.timedelta(days=32)).replace(day=1) - dt.timedelta(days=1)
    jj = ree(f"generacion/estructura-generacion?start_date={a}T00:00&end_date={b}T23:59&time_trunc=day&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14", 1)
    if jj:
        for inc in jj.get("included", []):
            for v in inc["attributes"]["values"]: dias.setdefault(inc["attributes"]["title"], {})[v["datetime"][:10]] = round(v["value"], 1)
if dias:
    dd = sorted({x for d in dias.values() for x in d})
    out["reeDia"] = {"dias": dd, "tec": {t: [d.get(x) for x in dd] for t, d in dias.items()}}
log("## REE días:", len(dias) and len(out["reeDia"]["dias"]))
# potencia instalada
pot = {}
for y in range(hoy.year-1, hoy.year):
    for tt in ("year",):
        jj = ree(f"generacion/potencia-instalada?start_date={y}-01-01T00:00&end_date={y}-12-31T23:59&time_trunc={tt}&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14", 1)
        if jj:
            for inc in jj.get("included", []):
                for v in inc["attributes"]["values"]: pot.setdefault(inc["attributes"]["title"], {})[v["datetime"][:7]] = round(v["value"], 1)
            break
out["pot"] = pot
log("## REE potencia instalada:", {k: list(v.items())[-2:] for k, v in pot.items()})

# ---------- 4) calibración con el tiempo pasado ----------
def mwp(p):  # potencia del parque (MW) leyendo el campo que la tenga
    v = pick(p["a"], r"^POT", r"MW", r"POTENC")
    x = num(v)
    if x and x > 500: x = x / 1000   # venía en kW
    return x
def curva(v):  # curva de potencia típica de un aerogenerador (fracción de la potencia nominal)
    if v is None or v < 3 or v > 25: return 0.0
    if v >= 12: return 1.0
    return (v**3 - 27) / (12**3 - 27)
def om_hist(pts, var, a, b):
    lat = ",".join(str(p[0]) for p in pts); lon = ",".join(str(p[1]) for p in pts)
    u = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={a}&end_date={b}&hourly={var}&wind_speed_unit=ms&timezone=Europe%2FMadrid"
    for i in range(4):
        try:
            r = json.loads(get(u, timeout=240)); return r if isinstance(r, list) else [r]
        except Exception as e:
            log("open-meteo reintento", i, e); time.sleep(20)
    raise RuntimeError("open-meteo no responde")
cal = {}
try:
    fin = hoy.replace(day=1) - dt.timedelta(days=1); ini = (fin.replace(day=1) - dt.timedelta(days=330)).replace(day=1)
    eol = [p for p in out["parques"] if mwp(p)]
    grid = collections.defaultdict(float)
    for p in eol: grid[(round(p["c"][0], 1), round(p["c"][1], 1))] += mwp(p)
    pts = list(grid)
    est = collections.Counter()
    for i in range(0, len(pts), 10):
        for k, r in enumerate(om_hist(pts[i:i+10], "wind_speed_100m", ini, fin)):
            mw = grid[pts[i+k]]
            for t, v in zip(r["hourly"]["time"], r["hourly"]["wind_speed_100m"]): est[t[:7]] += mw * curva(v)
        time.sleep(2)
    real = mens.get("Eólica", {})
    pares = [(est[m], real[m]) for m in est if real.get(m)]
    if pares:
        cal["eol"] = round(sum(r for _, r in pares) / sum(e for e, _ in pares), 3)
        cal["eolMW"] = round(sum(mwp(p) for p in eol), 1)
    log("## calibración eólica", cal, [(m, round(est[m]), real.get(m)) for m in sorted(est)])
except Exception as e: log("fallo calibración eólica", e)
try:
    def smw(p):
        x = num(pick(p["a"], r"^POT", r"MW", r"POTENC"))
        if x and x > 500: x = x / 1000
        return x
    sol = [p for p in out["solar"] if smw(p)]
    grid = collections.defaultdict(float)
    for p in sol: grid[(round(p["c"][0], 1), round(p["c"][1], 1))] += smw(p)
    pts = list(grid); est = collections.Counter()
    for i in range(0, len(pts), 10):
        for k, r in enumerate(om_hist(pts[i:i+10], "shortwave_radiation", ini, fin)):
            mw = grid[pts[i+k]]
            for t, v in zip(r["hourly"]["time"], r["hourly"]["shortwave_radiation"]): est[t[:7]] += mw * (v or 0) / 1000
        time.sleep(2)
    real = mens.get("Solar fotovoltaica", {})
    pares = [(est[m], real[m]) for m in est if real.get(m)]
    if pares:
        cal["sol"] = round(sum(r for _, r in pares) / sum(e for e, _ in pares), 3)
        cal["solMW"] = round(sum(smw(p) for p in sol), 1)
    log("## calibración solar", cal)
except Exception as e: log("fallo calibración solar", e)
# si hoy no se pudo calibrar, se guarda el ajuste de la última vez
try:
    prev = json.loads(open("web/energia.js").read()[len("window.ENERGIA="):-1]).get("cal", {})
    for k, v in prev.items(): cal.setdefault(k, v)
except Exception: pass
out["cal"] = cal

# ---------- 5) formato compacto para el móvil ----------
def gi(grid, c):
    k = (round(c[0], 1), round(c[1], 1)); return k
def toint(v):
    try: return int(float(v))
    except Exception: return None
gE = collections.OrderedDict(); gS = collections.OrderedDict()
par = []
alt = collections.defaultdict(list)
for a in out["aero"]: alt[a["a"].get("PARQUE", "")].append(num(a["a"].get("ALTURA_M")) or 0)
for p in out["parques"]:
    a = p["a"]; mw = mwp(p) or 0; k = gi(gE, p["c"]); gE[k] = gE.get(k, 0) + mw
    hs = sorted(alt.get(a.get("NOMBRE", ""), [])) or [0]
    par.append({"n": a.get("NOMBRE", "").title(), "emp": a.get("PROMOTOR", ""), "mw": round(mw, 3), "na": toint(a.get("NUMAEROS")), "ano": toint(a.get("PUESTSERV")),
                "ev": a.get("EVACUACION", ""), "ra": a.get("RAIPEE", ""), "h": hs[len(hs)//2], "c": p["c"], "r": p["r"], "g": list(gE).index(k)})
sol = []
for p in out["solar"]:
    a = p["a"]; mw = num(a.get("POT_MW")) or 0; k = gi(gS, p["c"]); gS[k] = gS.get(k, 0) + mw
    sol.append({"n": a.get("NOMBRE", "").title(), "emp": a.get("PROMOTOR", ""), "mw": round(mw, 3), "ano": toint(a.get("PUESTSERV")), "ev": a.get("EVACUACION", ""),
                "c": p["c"], "r": [simplify(r, 0.0006) for r in p["r"]], "g": list(gS).index(k)})
names = [p["n"].upper() for p in par]
aer = []
for a in out["aero"]:
    q = a["a"]; pk = q.get("PARQUE", "").upper()
    aer.append([a["pt"][0], a["pt"][1], num(q.get("POT_MW")) or 0, toint(q.get("ALTURA_M")) or 0, q.get("MODELO", ""), names.index(pk) if pk in names else -1])
out = {"t": out["t"], "par": par, "sol": sol, "aer": aer, "otras": out["otras"], "ree": out["ree"], "reeDia": out.get("reeDia"), "pot": out["pot"], "cal": out["cal"],
       "gE": [[k[0], k[1], round(v, 2)] for k, v in gE.items()], "gS": [[k[0], k[1], round(v, 2)] for k, v in gS.items()]}
open("web/energia.js", "w").write("window.ENERGIA=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";")
open("tools/energia_info.txt", "w").write("\n".join(info))
log("tamaño", len(json.dumps(out)) // 1024, "KB")
