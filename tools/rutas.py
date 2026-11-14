"""
RUTAS DE NAVARRA para «Escapadas» (estilo ficha: distancia, desnivel, dificultad, altitudes, mapa, perfil).

Qué hace, paso a paso (y por qué):
 1. FUENTES
    - OpenStreetMap (API Overpass): todas las rutas a pie que tocan Navarra, con su dibujo. Licencia ODbL.
    - IDENA (Gobierno de Navarra, CC BY 4.0), lo que ya baja tools/monte.py a web/monte.js: etapas de los
      GR 1, GR 12 y GR 321, etapas del Camino de Santiago, vías verdes y los senderos recomendados (de estos
      se vuelve a pedir su GPX, porque el servidor del Gobierno suele tardar y en monte.py muchos fallaron).
 2. UNA SOLA LÍNEA POR RUTA: en OSM una ruta son muchos tramos sueltos. Se cosen como una red y se elige el
    camino más largo entre sus dos puntas (o la vuelta completa si es circular). Así se quitan ramales.
 3. RUTAS LARGAS: si OSM tiene un GR entero y además sus etapas, se queda con las etapas. Si no hay etapas,
    se recorta a la parte de Navarra y se parte en etapas de unos 20 km que acaban en un pueblo.
 4. REPETIDAS: se comparan los trazados (puntos cada 100 m). Si dos rutas coinciden en más del 70 % en los
    dos sentidos, son la misma: se queda la de IDENA (trae descripción oficial) o la que tenga matrícula.
 5. FICHA: perfil de 150 alturas (modelo del terreno de Open-Meteo), distancia, desnivel subido y bajado,
    altitud máxima y mínima, tiempo estimado (norma DIN 33466), dificultad estimada, zona turística,
    pueblo de salida, pueblos por los que pasa y una descripción automática.
 6. SALIDA: rutas/rutas.json (los datos para la app) y rutas/rutas_info.txt (resumen para revisar).
    Todavía no toca la app (nada en web/).
Para probarlo sin internet: PRUEBA=1 python3 tools/rutas.py (sin OSM y con alturas inventadas).
"""
import json, math, re, time, urllib.request, urllib.parse, collections, os, heapq

PRUEBA = bool(os.environ.get("PRUEBA"))
UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)", "Accept": "*/*"}
SERVIDORES = ["https://overpass-api.de/api/interpreter",
              "https://overpass.private.coffee/api/interpreter",
              "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
# La comunidad foral lleva en OSM el código ES-NC y la provincia ES-NA: se aceptan los dos
Q_PIE = """[out:json][timeout:600];
area["ISO3166-2"~"^ES-N[AC]$"]["boundary"="administrative"]->.na;
rel["type"="route"]["route"~"^(hiking|foot|walking)$"](area.na);
out geom;"""
T0 = time.time()


def log(*a): print(f"[{int(time.time()-T0)}s]", *a, flush=True)


# ------------------------------------------------------------------ utilidades geográficas
def km(a, b):  # distancia en km entre dos puntos [lat, lon] (fórmula del haversine)
    p1, p2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1] - a[1]); dp = p2 - p1
    return 12742 * math.asin(min(1, math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2)))


def largo(pts): return sum(km(a, b) for a, b in zip(pts, pts[1:]))


def acum(pts):
    d = [0.0]
    for a, b in zip(pts, pts[1:]): d.append(d[-1] + km(a, b))
    return d


def muestrear(pts, paso=None, n=None):
    """Puntos a la misma distancia entre sí a lo largo de la línea (cada «paso» km, o «n» puntos)."""
    d = acum(pts); tot = d[-1]
    if tot == 0: return [list(pts[0])]
    if n is None: n = max(2, int(tot / paso) + 1)
    out, j = [], 0
    for k in range(n):
        t = tot * k / (n - 1)
        while j < len(d) - 2 and d[j + 1] < t: j += 1
        f = 0 if d[j + 1] == d[j] else (t - d[j]) / (d[j + 1] - d[j]); a, b = pts[j], pts[j + 1]
        out.append([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
    return out


def simplificar(pts, tol):  # Douglas-Peucker sin recursión (para que no reviente con líneas largas)
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; pila = [(0, len(pts) - 1)]
    while pila:
        i, j = pila.pop(); a, b = pts[i], pts[j]; dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy or 1e-12
        best, idx = -1, None
        for k in range(i + 1, j):
            p = pts[k]; t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
            dd = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2
            if dd > best: best, idx = dd, k
        if idx is not None and best ** .5 > tol: keep[idx] = True; pila += [(i, idx), (idx, j)]
    return [p for p, k in zip(pts, keep) if k]


class Rejilla:
    """Busca rápido los puntos cercanos: reparte los puntos en casillas de «c» grados."""
    def __init__(self, items, c):  # items: lista de (lat, lon, dato)
        self.c = c; self.g = collections.defaultdict(list)
        for it in items: self.g[(int(it[0] // c), int(it[1] // c))].append(it)

    def cerca(self, p, r=1):
        i, j = int(p[0] // self.c), int(p[1] // self.c)
        for a in range(i - r, i + r + 1):
            for b in range(j - r, j + r + 1): yield from self.g.get((a, b), ())


# ------------------------------------------------------------------ pueblos y zonas turísticas
def carga_js(ruta):
    t = open(ruta, encoding="utf-8").read(); return json.loads(t[t.index("{"):t.rindex("}") + 1])


PU = carga_js("web/pueblos.js"); PUEBLOS, MUNIS = PU["pueblos"], PU["municipios"]
GP = Rejilla([(p["pt"][0], p["pt"][1], p) for p in PUEBLOS], 0.05)   # casillas de unos 5 km
# Zona turística de cada municipio: sale de los alojamientos de datos abiertos (web/abiertos.js)
cnt = collections.defaultdict(collections.Counter)
for r in carga_js("web/abiertos.js")["aloj"]: cnt[r[4]][r[5]] += 1
ZONA_MUNI = {m: c.most_common(1)[0][0].replace("Comarca Sangüesa-Prepirineo", "Sangüesa-Prepirineo") for m, c in cnt.items()}
PUEBLOS_CON_ZONA = [p for p in PUEBLOS if MUNIS.get(p["m"], {}).get("n") in ZONA_MUNI]


def pueblo_cerca(p, r=1):
    cand = [it[2] for it in GP.cerca(p, r)] or PUEBLOS
    b = min(cand, key=lambda x: km(p, x["pt"])); return b, km(p, b["pt"])


def zona_de(p):
    b, _ = pueblo_cerca(p); z = ZONA_MUNI.get(MUNIS.get(b["m"], {}).get("n", ""))
    if z: return z
    b = min(PUEBLOS_CON_ZONA, key=lambda x: km(p, x["pt"])); return ZONA_MUNI[MUNIS[b["m"]]["n"]]


def en_navarra(p):  # dentro de Navarra = a menos de 6 km de algún pueblo navarro
    return any(km(p, it[2]["pt"]) < 6 for it in GP.cerca(p, 2))


def nombre_corto(n): return n.split(" / ")[0]


# ------------------------------------------------------------------ una sola línea por ruta
def coser(tramos, junta=1.5):
    """Une tramos sueltos en una sola línea. Cada punto es un nudo y cada tramo, una arista.
    Los huecos de menos de «junta» km entre trozos se cosen. Devuelve (línea, circular)."""
    idx, V = {}, []
    def nudo(p):
        k = (round(p[0], 5), round(p[1], 5))
        if k not in idx: idx[k] = len(V); V.append([k[0], k[1]])
        return idx[k]
    adj = collections.defaultdict(dict)
    for t in tramos:
        ns = [nudo(p) for p in t]
        for a, b in zip(ns, ns[1:]):
            if a != b: d = km(V[a], V[b]); adj[a][b] = d; adj[b][a] = d
    if len(V) < 2: return None, False

    def grupos():  # trozos sueltos (componentes conexas de la red)
        comp, gs = {}, []
        for s in range(len(V)):
            if s in comp or s not in adj: continue
            g = [s]; comp[s] = len(gs); pila = [s]
            while pila:
                u = pila.pop()
                for v in adj[u]:
                    if v not in comp: comp[v] = len(gs); g.append(v); pila.append(v)
            gs.append(g)
        return gs
    gs = grupos()
    while len(gs) > 1:   # se cose el trozo más cercano al principal mientras esté a menos de «junta» km
        gs.sort(key=len, reverse=True); rej = Rejilla([(V[i][0], V[i][1], i) for i in gs[0]], 0.01)
        mejor = None
        for g in gs[1:]:
            for i in g:
                for it in rej.cerca(V[i], 2):
                    d = km(V[i], V[it[2]])
                    if d < junta and (mejor is None or d < mejor[0]): mejor = (d, i, it[2])
        if not mejor: break
        d, a, b = mejor; adj[a][b] = d; adj[b][a] = d; gs = grupos()
    if not gs: return None, False
    gs.sort(key=len, reverse=True); vivo = set(gs[0])

    def dijkstra(a, sin=None):
        dist = {a: 0.0}; prev = {}; h = [(0.0, a)]
        while h:
            d, u = heapq.heappop(h)
            if d > dist[u]: continue
            for v, w in adj[u].items():
                if sin and {u, v} == sin: continue
                if d + w < dist.get(v, 1e18): dist[v] = d + w; prev[v] = u; heapq.heappush(h, (d + w, v))
        return dist, prev

    def camino(prev, a, b):
        out = [b]
        while out[-1] != a: out.append(prev[out[-1]])
        return [V[i] for i in reversed(out)]
    puntas = [i for i in vivo if len(adj[i]) == 1]
    if not puntas:  # circular: se quita una arista y se busca el camino que da la vuelta
        a = next(iter(vivo)); b = next(iter(adj[a]))
        dist, prev = dijkstra(a, sin={a, b})
        if b not in dist: return None, False
        return camino(prev, a, b) + [V[a]], True
    puntas = puntas[:40]
    mejor = None
    for a in puntas:   # las dos puntas más alejadas POR EL CAMINO son el principio y el final
        dist, prev = dijkstra(a)
        b = max((p for p in puntas if p in dist and p != a), key=lambda p: dist[p], default=None)
        if b is not None and (mejor is None or dist[b] > mejor[0]): mejor = (dist[b], a, b, prev)
    if not mejor: return None, False
    lin = camino(mejor[3], mejor[1], mejor[2])
    return lin, km(lin[0], lin[-1]) < 0.3


# ------------------------------------------------------------------ alturas (Open-Meteo) con caché
CACHE_F = "rutas/alturas_cache.json"
os.makedirs("rutas", exist_ok=True)
CACHE = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}


def alturas(pts):
    clave = [f"{p[0]:.4f},{p[1]:.4f}" for p in pts]
    if PRUEBA: return [500 + 300 * math.sin(i / 20) for i in range(len(pts))]
    faltan = sorted({k for k in clave if k not in CACHE})
    for i in range(0, len(faltan), 100):
        ch = faltan[i:i + 100]
        u = ("https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(k.split(",")[0] for k in ch)
             + "&longitude=" + ",".join(k.split(",")[1] for k in ch))
        for intento in range(5):
            try:
                el = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read())["elevation"]
                for k, e in zip(ch, el): CACHE[k] = e
                break
            except Exception:
                if intento == 4: raise
                time.sleep(10 * (intento + 1))
        time.sleep(0.4)
    return [CACHE[k] for k in clave]


def ficha_alturas(lin, pf=None):
    """Perfil de 150 alturas y sus cifras. Las del modelo del terreno se suavizan (media de 5 vecinos)
    y el desnivel se suma solo cuando sube o baja más de 10 m, para que el ruido no lo infle."""
    if not pf:
        z = alturas(muestrear(lin, n=150))
        pf = [sum(z[max(0, k - 2):k + 3]) / len(z[max(0, k - 2):k + 3]) for k in range(len(z))]
    up = dn = 0.0; ref = pf[0]
    for e in pf[1:]:
        if e - ref >= 10: up += e - ref; ref = e
        elif ref - e >= 10: dn += ref - e; ref = e
    return [round(e) for e in pf], round(up), round(dn)


def tiempo_din(kms, up, dn):
    """Tiempo de marcha (norma DIN 33466): 4 km/h en llano, 300 m/h subiendo y 500 m/h bajando.
    Se suma el mayor de horizontal y vertical más la mitad del menor. Sin contar paradas."""
    h, v = kms / 4, up / 300 + dn / 500
    return max(h, v) + min(h, v) / 2


def dificultad(horas, up, mx):
    if horas <= 3 and up <= 400: d = "Fácil"
    elif horas <= 6 and up <= 900: d = "Moderada"
    elif horas <= 9 and up <= 1500: d = "Difícil"
    else: d = "Muy difícil"
    if mx >= 1900 and d in ("Fácil", "Moderada"): d = "Difícil"   # alta montaña del Pirineo: un grado más
    return d


# ------------------------------------------------------------------ 1. OpenStreetMap
def overpass(q):
    for s in SERVIDORES:
        for intento in range(2):
            try:
                log("Overpass:", s)
                r = urllib.request.urlopen(urllib.request.Request(s, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA), timeout=900)
                return json.loads(r.read())
            except Exception as e:
                log("  falló:", e); time.sleep(20)
    raise SystemExit("Ningún servidor de Overpass contestó")


def es_camino(nombre, tg):
    n = nombre.lower()
    return (("camino" in n and "santiago" in n) or "donejakue" in n or "camino francés" in n or "camino frances" in n
            or "camino aragonés" in n or "camino baztanés" in n or tg.get("pilgrimage") == "yes"
            or "way of st" in n or "chemin de saint" in n)


def tipo_ref(ref, red, nombre, tg):
    r = (ref or "").upper().replace(" ", "").replace("-", "")
    if es_camino(nombre, tg): return "Camino de Santiago"
    if r.startswith("GRT"): return "GRT"
    if r.startswith(("GR", "E.GR", "EGR")) or re.match(r"^E\d", r): return "GR"
    if r.startswith("PR"): return "PR"
    if r.startswith("SL"): return "SL"
    if red in ("iwn", "nwn"): return "Gran recorrido"
    return "Local"


GRUPO = {"Camino de Santiago": "Camino de Santiago", "GR": "Grandes travesías", "GRT": "Grandes travesías",
         "Gran recorrido": "Grandes travesías", "PR": "Senderos y paseos", "SL": "Senderos y paseos",
         "Local": "Senderos y paseos", "Vía verde": "Vías verdes"}

pie = [] if PRUEBA else overpass(Q_PIE)["elements"]
log("Relaciones de OSM recibidas:", len(pie))
if not pie and not PRUEBA: raise SystemExit("Overpass no devolvió ninguna ruta")
osm = []
for el in pie:
    tg = el.get("tags", {})
    tramos = [[[p["lat"], p["lon"]] for p in m["geometry"] if p] for m in el.get("members", [])
              if m.get("type") == "way" and m.get("geometry") and m.get("role", "") not in ("alternative", "excursion", "approach", "connection")]
    tramos = [t for t in tramos if len(t) >= 2]
    if not tramos: continue
    lin, circ = coser(tramos)
    if not lin or largo(lin) < 1: continue
    nombre = (tg.get("name") or tg.get("name:es") or tg.get("name:eu") or "").strip()
    if not nombre and tg.get("from") and tg.get("to"): nombre = f"{tg['from']} – {tg['to']}"
    osm.append({"fuente": "osm", "osm": el["id"], "n": nombre, "ref": tg.get("ref", "").strip(),
                "tipo": tipo_ref(tg.get("ref"), tg.get("network"), nombre, tg), "lin": lin, "circ": circ,
                "desde": tg.get("from", ""), "hasta": tg.get("to", ""),
                "txt": (tg.get("description") or tg.get("description:es") or "").strip(),
                "web": tg.get("website") or tg.get("url") or ""})
log("Rutas de OSM con línea:", len(osm))

# ------------------------------------------------------------------ 2. IDENA (desde web/monte.js)
MON = carga_js("web/monte.js")
idena = []
for capa, tipo in (("DOTACI_Lin_GR1", "GR"), ("DOTACI_Lin_GR12", "GR"), ("DOTACI_Lin_GR321", "GR"), ("CAMINO_ETAPAS", "Camino de Santiago"),
                   ("DOTACI_Lin_VVBidasoa", "Vía verde"), ("DOTACI_Lin_VVVascoNav", "Vía verde"), ("DOTACI_Lin_VVIrati", "Vía verde"),
                   ("DOTACI_Lin_VVPlazaola", "Vía verde"), ("DOTACI_Lin_VVTarazoni", "Vía verde")):
    for f in (MON.get(capa) or {}).get("f", []):
        a = f["a"]; rs = [r for r in f.get("r", []) if len(r) >= 2]
        if not rs: continue
        lin, circ = coser(rs) if len(rs) > 1 else (rs[0], km(rs[0][0], rs[0][-1]) < 0.3)
        if not lin or largo(lin) < 1: continue
        n = re.sub(r"^GR \d+\. ", "", a.get("TRAMO") or a.get("NOMBRE") or capa)
        if tipo == "Vía verde": n = a.get("NOMBRE") or n
        idena.append({"fuente": "idena", "capa": capa, "n": n, "ref": a.get("IDRUTA", ""), "tipo": tipo, "lin": lin, "circ": circ,
                      "desde": a.get("LUGARINI", ""), "hasta": a.get("LUGARFIN", ""), "txt": a.get("DESCRIPCIO", ""),
                      "web": a.get("URL", ""), "pf0": f.get("pf") if f.get("s") and len(rs) == 1 else None})


def gpx_pts(txt):  # puntos [lat, lon] del track (o de la ruta), con lat y lon en cualquier orden
    for tag in ("trkpt", "rtept"):
        pts = []
        for m in re.finditer(r"<(?:\w+:)?%s\b([^>]*)>" % tag, txt):
            la = re.search(r"lat\s*=\s*[\"']([-\d.]+)", m.group(1)); lo = re.search(r"lon\s*=\s*[\"']([-\d.]+)", m.group(1))
            if la and lo: pts.append([float(la.group(1)), float(lo.group(1))])
        if len(pts) >= 2: return pts
    return []


# Senderos recomendados: se vuelve a pedir su GPX (con más paciencia que en monte.py)
sin_gpx = []; fallos = collections.Counter()   # fallos seguidos por servidor: a los 5 se deja de intentar
for f in (MON.get("PATRIM_Sym_Senderismo") or {}).get("f", []):
    a = f["a"]; u = a.get("DESCARGA", ""); pts = []; host = urllib.parse.urlparse(u).netloc
    if re.search(r"\.gpx$", u, re.I) and not PRUEBA and fallos[host] < 5:
        for intento in range(2):
            try:
                pts = gpx_pts(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode("utf-8", "replace"))
                fallos[host] = 0; break
            except Exception as e:
                log("GPX falló", intento + 1, u, e); time.sleep(3)
        else: fallos[host] += 1
    if len(pts) < 2 or largo(pts) < 1: sin_gpx.append(a.get("NOMBRE", "")); continue
    idena.append({"fuente": "idena", "capa": "PATRIM_Sym_Senderismo", "n": a.get("NOMBRE", ""), "ref": "", "tipo": "Local",
                  "lin": pts, "circ": km(pts[0], pts[-1]) < 0.3, "desde": "", "hasta": "", "txt": a.get("DESCRIPCIO", ""),
                  "web": a.get("URL", ""), "gpx": u})
log("Rutas de IDENA con línea:", len(idena), "· senderos sin GPX:", len(sin_gpx))


# ------------------------------------------------------------------ 3. rutas largas: etapas
def recortar_navarra(lin):
    """Se queda con el trozo más largo que va por Navarra (admite salidas de menos de 2 km)."""
    m = muestrear(lin, paso=0.5); dentro = [en_navarra(p) for p in m] + [False] * 6
    mejor, ini, fin, fuera = (0, -1), None, None, 0
    for i, d in enumerate(dentro):
        if d:
            if ini is None: ini = i
            fin = i; fuera = 0
        elif ini is not None:
            fuera += 1
            if fuera > 4:
                if fin - ini > mejor[1] - mejor[0]: mejor = (ini, fin)
                ini = None
    if mejor[1] <= mejor[0]: return None
    return m[mejor[0]:mejor[1] + 1]


def partir(lin, objetivo=20, mini=12, maxi=28):
    """Parte una línea larga en etapas que acaban en un pueblo (a menos de 1 km del camino)."""
    m = muestrear(lin, paso=0.25); d = acum(m); etapas, i0 = [], 0
    while d[-1] - d[i0] > maxi:
        cand = [i for i in range(i0, len(m)) if mini <= d[i] - d[i0] <= maxi and pueblo_cerca(m[i])[1] < 1.0]
        i1 = (min(cand, key=lambda i: abs(d[i] - d[i0] - objetivo)) if cand
              else min(range(i0, len(m)), key=lambda i: abs(d[i] - d[i0] - objetivo)))
        etapas.append(m[i0:i1 + 1]); i0 = i1
    etapas.append(m[i0:])
    if len(etapas) > 1 and largo(etapas[-1]) < 6: etapas[-2] = etapas[-2] + etapas[-1][1:]; etapas.pop()
    return etapas


refs = collections.defaultdict(list)
for r in osm:
    if r["ref"]: refs[r["ref"].upper().replace(" ", "")].append(largo(r["lin"]))
todas = []
for r in osm + idena:
    L = largo(r["lin"])
    if L <= 40 or r["fuente"] == "idena" or r["tipo"] not in ("GR", "GRT", "Gran recorrido", "Camino de Santiago"):
        todas.append(r); continue
    k = r["ref"].upper().replace(" ", "")
    if k and sum(1 for x in refs[k] if x < L * 0.8) >= 2: continue   # OSM ya tiene sus etapas sueltas: fuera la entera
    rec = recortar_navarra(r["lin"])
    if not rec or largo(rec) < 3: continue
    trozos = partir(rec) if largo(rec) > 30 else [rec]
    base = r["n"] or r["ref"] or "Gran recorrido"
    for i, t in enumerate(trozos, 1):
        a, b = nombre_corto(pueblo_cerca(t[0])[0]["n"]), nombre_corto(pueblo_cerca(t[-1])[0]["n"])
        e = dict(r, lin=t, circ=False, desde=a, hasta=b, etapa=i, pf0=None)
        e["n"] = f"{base} · etapa {i}: {a} – {b}" if len(trozos) > 1 else f"{base} (Navarra): {a} – {b}"
        todas.append(e)
log("Rutas tras partir las largas:", len(todas))

# ------------------------------------------------------------------ 4. repetidas
for r in todas:
    r["m"] = muestrear(r["lin"], paso=0.1); r["km"] = largo(r["lin"])
    r["rej"] = Rejilla([(p[0], p[1], p) for p in r["m"]], 0.002)
    la = [p[0] for p in r["m"]]; lo = [p[1] for p in r["m"]]; r["bb"] = (min(la), max(la), min(lo), max(lo))


def solape(a, b):  # parte de la ruta «a» que va a menos de 120 m de la ruta «b»
    n = sum(1 for p in a["m"] if any(km(p, q[2]) < 0.12 for q in b["rej"].cerca(p, 1)))
    return n / len(a["m"])


def prioridad(r):
    return (r["fuente"] == "idena", bool(r["ref"]), bool(r["n"]), bool(r["txt"]), r["km"])


fuera, repes = set(), []
orden = sorted(range(len(todas)), key=lambda i: prioridad(todas[i]), reverse=True)
for x, i in enumerate(orden):
    if i in fuera: continue
    A = todas[i]
    for j in orden[x + 1:]:
        if j in fuera: continue
        B = todas[j]
        if (A["bb"][0] > B["bb"][1] + .01 or B["bb"][0] > A["bb"][1] + .01
                or A["bb"][2] > B["bb"][3] + .01 or B["bb"][2] > A["bb"][3] + .01): continue
        if not (0.6 < A["km"] / B["km"] < 1.6): continue
        if solape(A, B) > 0.7 and solape(B, A) > 0.7:
            fuera.add(j); repes.append((A["n"], A["fuente"], B["n"], B["fuente"]))
            if not A["txt"] and B["txt"]: A["txt"] = B["txt"]
            if not A["ref"] and B["ref"]: A["ref"] = B["ref"]
            if B["fuente"] == "osm" and not A.get("osm"): A["osm"] = B.get("osm")
finales = [r for i, r in enumerate(todas) if i not in fuera]
log("Repetidas quitadas:", len(repes), "· quedan:", len(finales))

# ------------------------------------------------------------------ 5. ficha de cada ruta
salida = []
for n_, r in enumerate(finales, 1):
    lin = r["lin"]
    try:
        pf, up, dn = ficha_alturas(lin, r.get("pf0"))
    except Exception as e:
        log("sin alturas:", r["n"], e); continue
    if n_ % 25 == 0:
        log("fichas", n_, "/", len(finales)); json.dump(CACHE, open(CACHE_F, "w"))
    kms = r["km"]; horas = tiempo_din(kms, up, dn); mx, mn = max(pf), min(pf)
    p0, d0 = pueblo_cerca(lin[0]); p1, d1 = pueblo_cerca(lin[-1])
    # pueblos por los que pasa, en orden (a menos de 500 m del camino), sin el de salida ni el de llegada
    vistos, paso_por = {p0["n"], p1["n"]}, []
    for p in muestrear(lin, paso=0.25):
        b, d = pueblo_cerca(p)
        if d < 0.5 and b["n"] not in vistos: vistos.add(b["n"]); paso_por.append(nombre_corto(b["n"]))
    ini, fin = nombre_corto(p0["n"]), nombre_corto(p1["n"])
    ini_t = ini if d0 < 1.5 else f"cerca de {ini}"; fin_t = fin if d1 < 1.5 else f"cerca de {fin}"
    if r["circ"]: t = f"Ruta circular con salida y llegada en {ini_t} ({pf[0]} m)."
    else: t = f"Sale de {r['desde'] or ini_t} ({pf[0]} m) y llega a {r['hasta'] or fin_t} ({pf[-1]} m)."
    if paso_por:
        pp = paso_por[:7]; t += " Pasa por " + (pp[0] if len(pp) == 1 else ", ".join(pp[:-1]) + " y " + pp[-1]) + "."
    k = pf.index(mx); t += f" Punto más alto: {mx} m, hacia el km {round(kms * k / 149, 1)}."
    t += f" Sube {up} m y baja {dn} m en {round(kms, 1)} km."
    if r["txt"] and r["txt"].lower() not in t.lower(): t += " " + r["txt"].rstrip(".") + "."
    nombre = r["n"] or (f"{r['ref']}: {ini} – {fin}" if r["ref"] else (f"Circular desde {ini}" if r["circ"] else f"{ini} – {fin}"))
    if r["ref"] and r["ref"].upper().replace(" ", "") not in nombre.upper().replace(" ", "") and r["tipo"] in ("GR", "GRT", "PR", "SL"):
        nombre = f"{r['ref']} · {nombre}"
    fuentes = ["© Gobierno de Navarra · IDENA (CC BY 4.0)"] if r["fuente"] == "idena" else []
    if r.get("osm"): fuentes.append("© colaboradores de OpenStreetMap (ODbL)")
    salida.append({
        "id": (f"o{r['osm']}" if r["fuente"] == "osm" else f"i{n_}") + (f"e{r['etapa']}" if r.get("etapa") else ""),
        "n": nombre, "ref": r["ref"], "tipo": r["tipo"], "grupo": GRUPO[r["tipo"]], "zona": zona_de(lin[0]),
        "pueblo": ini, "muni": MUNIS.get(p0["m"], {}).get("n", ""), "fin": fin,
        "km": round(kms, 1), "up": up, "dn": dn, "mx": mx, "mn": mn, "circ": 1 if r["circ"] else 0,
        "h": round(horas, 1), "dif": dificultad(horas, up, mx), "pasa": paso_por[:12], "desc": t,
        "web": r.get("web", ""), "osm": r.get("osm") or "", "gpx_oficial": r.get("gpx", ""), "fuente": fuentes,
        "lin": [[round(p[0], 5), round(p[1], 5)] for p in simplificar(lin, 0.00008)], "pf": pf,
    })
if not PRUEBA: json.dump(CACHE, open(CACHE_F, "w"))
salida.sort(key=lambda x: (x["grupo"], x["zona"], x["n"]))
json.dump({"t": time.strftime("%Y-%m-%d"), "rutas": salida}, open("rutas/rutas.json", "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

# ------------------------------------------------------------------ 6. resumen
C = collections.Counter; L = []
L.append(f"RUTAS DE NAVARRA PARA ESCAPADAS ({time.strftime('%Y-%m-%d')})")
L.append(f"Total: {len(salida)} rutas · OSM recibidas {len(pie)} · IDENA {len(idena)} · repetidas quitadas {len(repes)}")
L.append(f"Senderos de IDENA sin GPX descargable ({len(sin_gpx)}): " + "; ".join(sin_gpx))


def bloque(t, c):
    L.append(f"\n## {t}")
    for k, v in c.most_common(): L.append(f"- {k}: {v}")


bloque("Por grupo", C(r["grupo"] for r in salida))
bloque("Por tipo", C(r["tipo"] for r in salida))
bloque("Por zona", C(r["zona"] for r in salida))
bloque("Por dificultad (estimada)", C(r["dif"] for r in salida))
bloque("Por distancia", C("menos de 5 km" if r["km"] < 5 else "5-10 km" if r["km"] < 10 else "10-20 km" if r["km"] < 20
                          else "20-30 km" if r["km"] < 30 else "más de 30 km" for r in salida))
bloque("Circular o lineal", C("circular" if r["circ"] else "lineal" for r in salida))
L.append(f"\nTamaño de rutas.json: {os.path.getsize('rutas/rutas.json') // 1024} KB")
L.append("\n## Repetidas quitadas (se queda · se quita)")
for a, fa, b, fb in repes: L.append(f"- {a} [{fa}] · {b} [{fb}]")
L.append("\n## Lista (grupo · zona · nombre · km · desnivel + · dificultad · sale de)")
for r in salida: L.append(f"- {r['grupo']} · {r['zona']} · {r['n']} · {r['km']} km · +{r['up']} m · {r['dif']} · {r['pueblo']}")
open("rutas/rutas_info.txt", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L[:45]))
