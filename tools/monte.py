"""
Descarga de IDENA (Gobierno de Navarra, CC BY 4.0) las capas para «Salir al monte» y las guarda en web/monte.js:
cuevas y simas, miradores, áreas recreativas, zonas de baño, bienes de interés cultural, manantiales, fuentes,
vías verdes, GR, Camino de Santiago. Escribe tools/monte_info.txt con los campos.
"""
import io, json, time, urllib.request, urllib.parse, zipfile, collections
import shapefile, sys
sys.setrecursionlimit(20000)
from pyproj import Transformer
UA = {"User-Agent": "PedritoControlRioArga/2.0 (+https://github.com/suapedrito-z/control-rio-arga)", "Accept": "*/*"}
B = "https://idena.navarra.es/descargas/"
CAPAS = ["GEOLOG_Sym_Cuevas", "DOTACI_Sym_Miradores", "FOREST_Sym_AreasRecForest", "HIDROG_Sym_ZonaBano", "PATRIM_Sym_BICarquite",
         "GEOLOG_Sym_Manantiales", "IDEMUN_Sym_Fuentes", "PATRIM_Sym_Senderismo",
         "DOTACI_Lin_VVBidasoa", "DOTACI_Lin_VVVascoNav", "DOTACI_Lin_VVIrati", "DOTACI_Lin_VVPlazaola", "DOTACI_Lin_VVTarazoni",
         "DOTACI_Lin_GR1", "DOTACI_Lin_GR12", "DOTACI_Lin_GR321", "PATRIM_Lin_CaminoSant"]
KEEP = {"GEOLOG_Sym_Cuevas": ["CODIGO", "CUEVA", "TIPO", "COTA", "MUNICIPIO", "TOPONIMIA", "LONGITUD", "PROFUNDIDA", "DESCRIPCIO"],
        "GEOLOG_Sym_Manantiales": ["MANANTIAL", "MUNICIPIO", "RIO"], "FOREST_Sym_AreasRecForest": ["NOMBRE", "DEMARCACIO", "BARBACOA", "EQUIPAMIEN", "PARKING", "VEGETACION", "ELEPAISAJE"],
        "PATRIM_Sym_BICarquite": ["BIC", "TIPO", "POBLACION"], "DOTACI_Sym_Miradores": ["RECTUR", "ZONATUR", "POBLACION", "URL"], "IDEMUN_Sym_Fuentes": ["FUENTE", "MUNICIPIO", "POTABLE"],
        "PATRIM_Sym_Senderismo": ["NOMBRE", "DESCRIPCIO", "URL", "DESCARGA"]}
DROP = {"URLPDF", "SITUACION", "FEATURE", "BEGINLIFE", "GEOM_LONG", "GEOM_AREA", "GEOM_PERI", "X25830", "Y25830", "OBJECTID", "FID", "ID"}
tr = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = (dx*dx+dy*dy) or 1e-12; best, idx = -1, 0
    for i in range(1, len(pts)-1):
        p = pts[i]; t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)); d = ((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)**.5
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
out, info = {"t": time.strftime("%Y-%m-%d")}, []
for key in CAPAS:
    print("capa", key, flush=True)
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(urllib.request.Request(B + key + ".zip", headers=UA), timeout=180).read()))
        names = z.namelist(); base = [n[:-4] for n in names if n.lower().endswith(".shp")][0]
        g = lambda ext: io.BytesIO(z.read([n for n in names if n.lower() == (base+ext).lower()][0]))
        sf = shapefile.Reader(shp=g(".shp"), dbf=g(".dbf"), encoding="cp1252"); fields = [f[0] for f in sf.fields[1:]]
        feats, vals = [], collections.defaultdict(collections.Counter)
        for sr in sf.iterShapeRecords():
            at = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(fields, sr.record)}
            for k, v in at.items(): vals[k][str(v)[:60]] += 1
            a = {k: (str(v)[:160] if isinstance(v, str) else v) for k, v in at.items() if v not in ("", None, "-", 0, 0.0, "0", "0.0") and k not in DROP and (key not in KEEP or k in KEEP[key])}
            if key == "GEOLOG_Sym_Cuevas" and "Fuera de Navarra" in str(at.get("OBSERVACIO", "")): continue
            s = sr.shape
            if not s.points: continue
            if s.shapeType in (1, 8, 11, 21) or not s.parts:
                lo, la = tr.transform(*s.points[0][:2]); feats.append({"a": a, "pt": [round(la, 4), round(lo, 4)]}); continue
            parts = list(s.parts) + [len(s.points)]; rings = []
            for i in range(len(parts)-1):
                pts = [[round(la, 5), round(lo, 5)] for lo, la in (tr.transform(x, y) for x, y in s.points[parts[i]:parts[i+1]])]
                pts = simplify(pts, 0.0004)
                if len(pts) >= 2: rings.append(pts)
            if rings: feats.append({"a": a, "r": rings})
        out[key] = {"d": vals["BEGINLIFE"].most_common(1)[0][0] if "BEGINLIFE" in vals else "", "f": feats}
        info.append(f"\n## {key}: {len(feats)} · campos {fields}")
        for k in fields:
            if k not in DROP: info.append(f"- {k}: {len(vals[k])} · {list(vals[k].most_common(6))}")
    except Exception as e:
        info.append(f"fallo {key}: {e}")
# ---------------------------------------------------------------------------------------------
# PERFIL DE LAS RUTAS: se baja el GPX de cada ruta recomendada y de cada etapa de GR y se calcula
# distancia, desnivel subido y bajado, altitudes, si es circular, el perfil (150 alturas a la misma
# distancia entre sí) y el trazado para dibujarlo. Si el GPX no trae alturas, se piden a Open-Meteo.
# ---------------------------------------------------------------------------------------------
import math, re
def km(a, b):  # distancia en km entre dos puntos [lat, lon] (fórmula del haversine)
    p1, p2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1]-a[1]); dp = p2-p1
    return 12742 * math.asin(min(1, math.sqrt(math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2)))
def gpx_pts(txt):  # puntos [lat, lon, altura|None] del track (o de la ruta si no hay track)
    for tag in ("trkpt", "rtept"):
        pts = []
        for m in re.finditer(r"<(?:\w+:)?%s\b([^>]*?)(?:/>|>(.*?)</(?:\w+:)?%s>)" % (tag, tag), txt, re.S):
            la = re.search(r"lat\s*=\s*[\"']([-\d.]+)", m.group(1)); lo = re.search(r"lon\s*=\s*[\"']([-\d.]+)", m.group(1))
            if not la or not lo: continue
            e = re.search(r"<(?:\w+:)?ele>\s*([-\d.]+)", m.group(2) or "")
            pts.append([float(la.group(1)), float(lo.group(1)), float(e.group(1)) if e else None])
        if len(pts) >= 2: return pts
    return []
def om_elev(pts):  # alturas del modelo del terreno de Open-Meteo, de 100 en 100 puntos
    out = []
    for i in range(0, len(pts), 100):
        ch = pts[i:i+100]
        u = "https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(f"{p[0]:.5f}" for p in ch) + "&longitude=" + ",".join(f"{p[1]:.5f}" for p in ch)
        for intento in range(4):   # Open-Meteo a veces tarda en contestar: hasta 4 intentos
            try:
                out += json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read())["elevation"]; break
            except Exception:
                if intento == 3: raise
                time.sleep(8)
        time.sleep(1)
    return out
def perfil(pts, N=150):
    d = [0.0]
    for i in range(1, len(pts)): d.append(d[-1] + km(pts[i-1], pts[i]))
    tot = d[-1]
    if tot < 0.2: return None
    # muestreo a la misma distancia (N puntos) interpolando lat, lon y altura
    smp, j = [], 0
    for k in range(N):
        t = tot * k / (N-1)
        while j < len(d)-2 and d[j+1] < t: j += 1
        f = 0 if d[j+1] == d[j] else (t-d[j]) / (d[j+1]-d[j]); a, b = pts[j], pts[j+1]
        ea = a[2] if a[2] is not None else b[2]; eb = b[2] if b[2] is not None else a[2]
        smp.append([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, None if ea is None else ea+(eb-ea)*f])
    src = "gpx"
    if sum(p[2] is None for p in smp) > N * .2:
        el = om_elev(smp); src = "mdt"
        for p, e in zip(smp, el): p[2] = e
    last = 0
    for p in smp:  # rellena huecos sueltos
        if p[2] is None: p[2] = last
        last = p[2]
    # desnivel con «histéresis» de 5 m para que el ruido del GPS no lo infle
    up = dn = 0.0; ref = smp[0][2]
    for p in smp[1:]:
        if p[2] - ref >= 5: up += p[2]-ref; ref = p[2]
        elif ref - p[2] >= 5: dn += ref-p[2]; ref = p[2]
    el = [p[2] for p in smp]
    return {"km": round(tot, 2), "up": round(up), "dn": round(dn), "mx": round(max(el)), "mn": round(min(el)), "a0": round(el[0]),
            "c": 1 if km(pts[0], pts[-1]) < 0.3 else 0, "src": src}, [round(e) for e in el]
RUTAS = ["PATRIM_Sym_Senderismo", "DOTACI_Lin_GR1", "DOTACI_Lin_GR12", "DOTACI_Lin_GR321"]
ok = bad = 0; fallos = collections.Counter()  # fallos seguidos por servidor: a los 4 se deja de intentar
for key in RUTAS:
    for f in (out.get(key) or {}).get("f", []):
        u = f["a"].get("DESCARGA", "")
        if not re.search(r"\.gpx$", u, re.I): continue
        host = urllib.parse.urlparse(u).netloc
        if fallos[host] >= 4: bad += 1; continue
        try:
            raw = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20).read().decode("utf-8", "replace")
            pts = gpx_pts(raw); r = perfil(pts) if pts else None
            if not r: raise ValueError("GPX sin puntos")
            f["s"], f["pf"] = r
            if key == "PATRIM_Sym_Senderismo":  # trazado para dibujarlo en el mapa
                f["r"] = [simplify([[round(p[0], 5), round(p[1], 5)] for p in pts], 0.00015)]
            ok += 1; fallos[host] = 0; print("perfil", ok, f["s"]["km"], "km", u, flush=True)
        except Exception as e:
            bad += 1; fallos[host] += 1; info.append(f"perfil fallo {key} {u}: {e}"); print("perfil fallo", u, e, flush=True)
        time.sleep(0.3)
info.append(f"\nPerfiles de ruta: {ok} bien, {bad} fallos")
# ---------------------------------------------------------------------------------------------
# CAMINO DE SANTIAGO y VÍAS VERDES: no tienen GPX, solo la línea (en trozos sueltos). Se unen los trozos
# en una sola línea ordenada, el Camino se parte en sus etapas clásicas y las alturas salen del
# modelo del terreno (Open-Meteo). Así también tienen perfil, distancia y desniveles.
# ---------------------------------------------------------------------------------------------
import heapq
def red(rings, junta=2.5):
    """Red de la ruta: cada vértice es un nudo, unido a sus vecinos de trozo y a los vértices de otros
    trozos que estén a menos de «junta» km (así se cosen los trozos aunque no coincidan exactamente)."""
    V = [p for r in rings for p in r]; adj = {i: [] for i in range(len(V))}; k = 0; ring_of = []
    for ri, r in enumerate(rings):
        for t in range(len(r)):
            ring_of.append(ri)
            if t: adj[k].append((k - 1, km(V[k - 1], V[k]))); adj[k - 1].append((k, km(V[k - 1], V[k])))
            k += 1
    for a in range(len(V)):
        for b in range(a + 1, len(V)):
            if ring_of[a] != ring_of[b]:
                d = km(V[a], V[b])
                if d < junta: adj[a].append((b, d * 3)); adj[b].append((a, d * 3))   # los «cosidos» cuentan triple: se usan solo si hace falta
    # si aún quedan grupos de trozos sueltos (huecos grandes en el dibujo), se cosen por sus puntos más cercanos
    while True:
        vis = {0}; pila = [0]
        while pila:
            u = pila.pop()
            for v, _ in adj[u]:
                if v not in vis: vis.add(v); pila.append(v)
        if len(vis) == len(V): break
        x, y = min(((x, y) for x in vis for y in range(len(V)) if y not in vis), key=lambda t: km(V[t[0]], V[t[1]]))
        d = km(V[x], V[y]); adj[x].append((y, d * 3)); adj[y].append((x, d * 3))
    return V, adj
def camino(V, adj, a, b):
    """Camino más corto por la red entre los nudos a y b (Dijkstra). Devuelve la lista de puntos."""
    dist = {a: 0}; prev = {}; h = [(0, a)]
    while h:
        d, u = heapq.heappop(h)
        if u == b: break
        if d > dist.get(u, 1e9): continue
        for v, w in adj[u]:
            if d + w < dist.get(v, 1e9): dist[v] = d + w; prev[v] = u; heapq.heappush(h, (d + w, v))
    if b not in dist: return None
    out = [b]
    while out[-1] != a: out.append(prev[out[-1]])
    return [V[i] for i in reversed(out)]
def cerca(V, la, lo): return min(range(len(V)), key=lambda i: km(V[i], (la, lo)))
def encadenar(rings):
    """Una sola línea de punta a punta: del extremo de trozo más alejado al otro, por la propia ruta."""
    V, adj = red(rings)
    if len(V) < 2: return max(rings, key=len)
    # los dos puntos más alejados entre sí son las dos puntas de la ruta
    a, b = max(((x, y) for x in range(len(V)) for y in range(x + 1, len(V))), key=lambda t: km(V[t[0]], V[t[1]]))
    return camino(V, adj, a, b) or max(rings, key=len)
def perfil_linea(pts):
    return perfil([[p[0], p[1], None] for p in pts])
ETAPAS = {"francés": [("Orreaga/Roncesvalles", 43.0090, -1.3190), ("Zubiri", 42.9300, -1.5030), ("Pamplona", 42.8186, -1.6440),
                      ("Puente la Reina/Gares", 42.6720, -1.8150), ("Estella-Lizarra", 42.6713, -2.0322), ("Los Arcos", 42.5690, -2.1920), ("Viana", 42.5160, -2.3710)],
          "aragonés": [("Sangüesa/Zangoza", 42.5750, -1.2830), ("Monreal/Elo", 42.7020, -1.5070), ("Puente la Reina/Gares", 42.6720, -1.8150)]}
etapas = []
try:
    for f in out["PATRIM_Lin_CaminoSant"]["f"]:
        rama = "francés" if "franc" in f["a"].get("TRAMO", "").lower() else "aragonés"
        V, adj = red(f["r"])
        ext = [i for i in range(len(V)) if len(adj[i]) <= 1]
        # entrada en Navarra: el francés por el norte (Luzaide) y el aragonés por el este; salida: el extremo más al oeste
        ini = max(ext, key=lambda i: V[i][0]) if rama == "francés" else max(ext, key=lambda i: V[i][1])
        fin = min(ext, key=lambda i: V[i][1])
        nudos = [ini] + [cerca(V, la, lo) for _, la, lo in ETAPAS[rama]] + [fin]
        nombres = ["Entrada en Navarra"] + [n for n, _, _ in ETAPAS[rama]] + ["Salida de Navarra"]
        n = 0
        for k in range(len(nudos) - 1):
            seg = camino(V, adj, nudos[k], nudos[k + 1]); na, nb = nombres[k], nombres[k + 1]
            if not seg or sum(km(seg[i - 1], seg[i]) for i in range(1, len(seg))) < 3: continue   # trocitos de menos de 3 km
            n += 1
            try: r = perfil_linea(seg)
            except Exception as e: r = None; info.append(f"sin alturas {rama} etapa {n}: {e}")
            g = {"a": {"TRAMO": f"Camino {rama} · etapa {n}: {na} – {nb}", "LUGARINI": na, "LUGARFIN": nb}, "r": [seg]}
            if r: g["s"], g["pf"] = r
            etapas.append(g); info.append(f"Camino {rama} etapa {n}: {na} – {nb}: {r[0]['km'] if r else '?'} km")
    out["CAMINO_ETAPAS"] = {"d": "", "f": etapas}
except Exception as e:
    info.append(f"fallo Camino: {e}")
for key in ["DOTACI_Lin_VVBidasoa", "DOTACI_Lin_VVVascoNav", "DOTACI_Lin_VVIrati", "DOTACI_Lin_VVPlazaola", "DOTACI_Lin_VVTarazoni"]:
    for f in (out.get(key) or {}).get("f", []):
        try:
            if sum(km(r_[i - 1], r_[i]) for r_ in f["r"] for i in range(1, len(r_))) < 2: continue   # restos sueltos
            L = encadenar(f["r"]); r = perfil_linea(L)
            if r: f["s"], f["pf"] = r; f["r"] = [L]
            info.append(f"{key}: {r[0]['km'] if r else '?'} km")
        except Exception as e:
            info.append(f"fallo {key}: {e}")
# ---------------------------------------------------------------------------------------------
# PETILLA DE ARAGÓN: municipio navarro dentro de Zaragoza, en dos enclaves (Petilla y Los Bastanes).
# Se saca su término de OpenStreetMap y se apunta el centro de cada trozo en monte_info.txt.
# ---------------------------------------------------------------------------------------------
try:
    q = '[out:json][timeout:60];rel["boundary"="administrative"]["admin_level"="8"]["name"="Petilla de Aragón"];out geom;'
    j = None
    for s in ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"] * 3:
        if j: break
        time.sleep(5)
        try:
            j = json.loads(urllib.request.urlopen(urllib.request.Request(s, data=("data=" + urllib.parse.quote(q)).encode(), headers=UA), timeout=60).read()); break
        except Exception as e:
            info.append(f"overpass {s}: {e}")
    ways = [[(g["lat"], g["lon"]) for g in m["geometry"]] for el in j["elements"] for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
    # junta los trozos de borde que se tocan: cada grupo es un enclave
    grupos = []
    for w in ways:
        hit = [g for g in grupos if any(min(km(p, q2) for q2 in g[::5] + [g[-1]]) < 0.05 for p in (w[0], w[-1]))]
        nuevo = list(w)
        for g in hit: nuevo += g; grupos.remove(g)
        grupos.append(nuevo)
    # une los trozos de borde por sus extremos para formar el contorno cerrado de cada enclave
    resto = [list(w) for w in ways]; anillos = []
    while resto:
        r = resto.pop(0)
        while True:
            for i, w in enumerate(resto):
                if km(r[-1], w[0]) < 0.01: r += w[1:]
                elif km(r[-1], w[-1]) < 0.01: r += w[::-1][1:]
                elif km(r[0], w[-1]) < 0.01: r = w[:-1] + r
                elif km(r[0], w[0]) < 0.01: r = w[::-1][:-1] + r
                else: continue
                resto.pop(i); break
            else: break
        anillos.append(simplify([[round(p[0], 5), round(p[1], 5)] for p in r], 0.0002))
    anillos.sort(key=lambda g: -max(p[0] for p in g))
    info.append("PETILLA_ANILLOS=" + json.dumps(anillos, separators=(",", ":")))
    for g in sorted(grupos, key=lambda g: -max(p[0] for p in g)):
        la = [p[0] for p in g]; lo = [p[1] for p in g]
        info.append(f"PETILLA enclave: centro {(min(la)+max(la))/2:.4f},{(min(lo)+max(lo))/2:.4f} · caja {min(la):.4f}-{max(la):.4f} / {min(lo):.4f}-{max(lo):.4f} · {len(g)} puntos")
except Exception as e:
    info.append(f"PETILLA fallo: {e}")
txt = "// Salir al monte (© Gobierno de Navarra · IDENA, CC BY 4.0). Generado por tools/monte.py\nwindow.MONTE_GEO=" + json.dumps(out, ensure_ascii=False, separators=(",", ":"), default=str) + ";\n"
open("web/monte.js", "w", encoding="utf-8").write(txt)
info.append(f"\nmonte.js: {len(txt)//1024} KB  ·  " + ", ".join(f"{k}:{len(v['f'])}" for k, v in out.items() if isinstance(v, dict)))
open("tools/monte_info.txt", "w", encoding="utf-8").write("\n".join(map(str, info))); print("\n".join(map(str, info)))
