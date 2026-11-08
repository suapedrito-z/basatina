# Actualiza «Qué hacer → Deporte navarro» (deporte/partidos.json). Se ejecuta los miércoles.
#  · Pelota: cartelera de la Federación Navarra de Pelota (fnpelota.com). Solo el Campeonato
#    Navarro de Clubes (sénior) de División de Honor, 1ª y 2ª; fuera Juegos Deportivos (escolares).
#  · Baloncesto: ligas sénior de la Federación Navarra de Baloncesto (2ª División, 1ª y 2ª Autonómica).
#  · Baloncesto vasco-navarro: 1ª y 2ª División de la Federación Vasca, solo partidos con equipo navarro.
#  · Balonmano: ligas sénior de la Federación Navarra de Balonmano (1ª Nacional fem., 2ª Nacional masc.).
#  · El resto (lo metido a mano) se mantiene. Se guardan los partidos de los últimos 7 días (resultados).
#  · Si una fuente falla, se conservan sus partidos de la vez anterior.
#  Campo «o» = orden de la liga dentro de su deporte (1 = la más alta).
import json, re, urllib.request, urllib.parse, datetime, os, base64, sys

PATH = "deporte/partidos.json"
UA = {"User-Agent": "Mozilla/5.0 (BasatiNA)"}
HOY = datetime.date.today()
hoy, desde, hasta = HOY.isoformat(), (HOY - datetime.timedelta(days=7)).isoformat(), (HOY + datetime.timedelta(days=75)).isoformat()

def get(url, data=None, headers=None, timeout=40):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace")

SIGLAS = {"CB", "CD", "BM", "SK", "UDC", "KKE", "IES", "CBP", "CDB", "ECA", "AD", "MKE", "SM", "SF", "SD", "UD", "CF", "FS",
          "A", "B", "C", "D", "E", "F", "H", "M", "II", "III", "BKT", "SKT", "CBASK", "UPNA", "SCD", "AT", "BBK", "JDN"}
MINUS = {"de", "del", "la", "las", "los", "y", "el", "en"}
def nombre(s):
    """«VALLE DE EGÜES A  *» → «Valle de Egües A»"""
    s = re.sub(r"\s+", " ", (s or "").replace("*", "")).strip()
    if not s or s != s.upper():
        return s
    out = []
    for i, w in enumerate(s.split(" ")):
        base = re.sub(r"[^\wÑÁÉÍÓÚÜ]", "", w)
        if base in SIGLAS or re.fullmatch(r"[A-Z]\.?([A-Z]\.)+", w):
            out.append(w)
        elif i and w.lower() in MINUS:
            out.append(w.lower())
        else:
            out.append("/".join("-".join(p[:1].upper() + p[1:].lower() for p in q.split("-")) for q in w.split("/")))
    return " ".join(out)

# ---------------- PELOTA ----------------
URL_PEL = "https://fnpelota.com/pub/cartelera.asp?idioma=ca"
def comp_pelota(txt):
    t = re.sub(r"\s+", " ", txt.upper()).strip()
    if "JDN" in t or "CADETE" in t or "JUVENIL" in t or "INFANTIL" in t or "ALEVIN" in t or "BENJAMIN" in t:
        return None  # escolares / base
    parte = re.split(r"\s*-\s*", t, maxsplit=1)
    s = parte[1] if len(parte) > 1 and "CNC" in parte[0] else t
    liga, o = "", 4
    if re.search(r"\bDH\b|DIVISION DE HONOR", s):
        liga, o = "División de Honor", 1
    else:
        m = re.search(r"\b(\d)ª", s)
        if m:
            n = int(m.group(1))
            if n > 2 and "ELIMINATORIA" not in s:
                return None  # de 3ª para abajo, fuera
            if "ELIMINATORIA" not in s:
                liga, o = "%dª" % n, n + 1
    fase = ""
    for k, v in (("SEMIFINAL", "semifinales"), ("FINAL", "final"), ("ELIMINATORIA", "eliminatorias")):
        if k in s:
            fase = v; break
    esp = re.sub(r"\bDH\b|DIVISION DE HONOR|\b\d+ª|\bLIGA\b|SEMIFINALES?|\bFINAL\b|ELIMINATORIA|PELOTA LENTA|GRUPO \d+", " ", s)
    esp = re.sub(r"\s+", " ", esp).strip(" -")
    esp = esp.replace("MASCULINA", "masc.").replace("FEMENINA", "fem.").replace("FEMENINO", "fem.")
    esp = esp[:1].upper() + esp[1:].lower() if esp else "Pelota"
    esp = esp.replace("Pcorta", "Pala corta").replace("Pgoma", "Paleta goma")
    nom = esp + (" · " + liga if liga else "") + (" · " + fase if fase else "")
    return nom, o

def traer_pelota():
    h = open(os.environ["PELOTA_HTML"], encoding="utf-8", errors="replace").read() if os.environ.get("PELOTA_HTML") else get(URL_PEL, timeout=60)
    out = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S):
        cells = [re.sub(r"&nbsp;", " ", re.sub(r"<[^>]+>", "", c)).strip()
                 for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        if len(cells) < 7 or not re.match(r"\d{2}/\d{2}/\d{4}", cells[0]):
            continue
        c = comp_pelota(cells[6])
        if not c:
            continue
        p1, p2, a = cells[0].split("/")
        # la cartelera usa mes/día/año; si no cuadra, día/mes/año (la fecha más cercana a hoy)
        cand = []
        for mm, dd in ((p1, p2), (p2, p1)):
            try: cand.append(datetime.date(int(a), int(mm), int(dd)))
            except ValueError: pass
        fe = min(cand, key=lambda x: abs((x - HOY).days))
        m, d = "%02d" % fe.month, "%02d" % fe.day
        out.append({"id": "pel" + cells[0].replace("/", "") + cells[1].replace(":", "") + cells[2],
                    "dep": "pelota", "comp": c[0], "o": c[1],
                    "loc": cells[4], "vis": cells[5], "f": "%s-%s-%s" % (a, m, d),
                    "h": cells[1], "lugar": cells[3], "url": URL_PEL, "res": ""})
    return out

# ---------------- BALONCESTO (Federación Navarra) ----------------
ESB = "https://esb.optimalwayconsulting.com/fnb/1/k1tEpEWUQKXh9qMvJVS2sWofAvrICVb1"
URL_FNB = "https://www.fnbaloncesto.com/resultados-y-clasificaciones/"
def esb(p):
    return json.loads(base64.b64decode(get(ESB + p, headers={"Accept": "application/json"}))).get("messageData") or []
CAT_BC = [  # (patrón del nombre de la categoría, nombre en la app, orden)
    (r"^segunda div masculina", "2ª División masculina (fase navarra)", 5),
    (r"^senior masculino 1", "1ª Autonómica masculina", 6),
    (r"^senior femenino 1", "1ª Autonómica femenina", 6),
    (r"^senior masculino 2", "2ª Autonómica masculina", 7),
    (r"^senior femenino 2", "2ª Autonómica femenina", 7),
    (r"^copa navarra masculina", "Copa Navarra masculina", 9),
    (r"^copa navarra femenina", "Copa Navarra femenina", 9),
]
def traer_baloncesto():
    clubs = esb("/Clubs/getActiveWeb")
    meses = sorted({(HOY + datetime.timedelta(days=d)).month for d in (-7, 0, 30, 60)})
    vistos, out = set(), []
    for cl in clubs:
        for mes in meses:
            try:
                lista = esb("/Match/getMatchClubMonth/%s/%d/T" % (cl["id"], mes))
            except Exception:
                continue
            for m in lista:
                cat = re.sub(r"\s+", " ", (m.get("nameCategorySigned") or "")).strip().lower()
                ok = next((c for c in CAT_BC if re.search(c[0], cat)), None)
                if not ok or m.get("idMatch") in vistos or m.get("friendly") == "1":
                    continue
                f, h = (m.get("matchDay") or " ").split(" ")[0], (m.get("matchDay") or "  ").split(" ")[1][:5]
                if not (desde <= f <= hasta):
                    continue
                vistos.add(m["idMatch"])
                res = ""
                if f < hoy and m.get("localScore") not in (None, "") and m.get("visitorScore") not in (None, ""):
                    res = "%s-%s" % (m["localScore"], m["visitorScore"])
                lugar = nombre(m.get("nameField") or "")
                if m.get("nameTown"):
                    lugar += (", " if lugar else "") + m["nameTown"].strip()
                out.append({"id": "fnb" + str(m["idMatch"]), "dep": "balonc", "comp": ok[1], "o": ok[2],
                            "loc": nombre(m.get("nameLocalTeam")), "vis": nombre(m.get("nameVisitorTeam")),
                            "f": f, "h": "" if h == "00:00" else h, "lugar": lugar, "url": URL_FNB, "res": res})
    return out

# ---------------- BALONCESTO vasco-navarro (Federación Vasca: 1ª y 2ª División) ----------------
# Solo los partidos en los que juega un equipo navarro (club que no está en la lista de clubes vascos).
ESF = "https://esb.optimalwayconsulting.com/esf/1/GxgkvuHIaZfnRat0UN9xafd8TyzGDHjN"
URL_ESF = "https://basketbasko.com/es/liga-primera-nacional/"
def esf(p):
    return json.loads(base64.b64decode(get(ESF + p, headers={"Accept": "application/json"}, timeout=90))).get("messageData") or []
def traer_baloncesto_pv():
    vascos = {c["id"] for c in esf("/Clubs/getActiveWeb")}
    out = []
    for cat in esf("/CategoryRegistered/getVisibleWeb"):
        n = re.sub(r"\s+", " ", cat.get("categoryRegisteredName") or "").lower()
        if str(cat.get("zone")) != "1" or "(p.v.)" not in n.replace("( ", "(").replace(" )", ")"):
            continue
        fem = "fem" in n
        if n.startswith("prim"):
            comp, o = "1ª División %s (vasco-navarra)" % ("femenina" if fem else "masculina"), 4
        elif n.startswith("segunda"):
            comp, o = "2ª División %s (vasco-navarra)" % ("femenina" if fem else "masculina"), 5
        else:
            continue
        for gr in esf("/Competition/getCompetitionGroupVisibleWeb/%s" % cat["idCategoryRegistred"]):
            if "copa" in (gr.get("nameGrupCompetition") or "").lower():
                continue
            R = esf("/FCBQWeb/getAllGamesByGrupWithMatchRecords/%s" % gr["idGroup"])
            for r in ((R or {}).get("rounds") or {}).values():
                for m in (r.get("matches") or {}).values():
                    if m.get("idLocalClub") in vascos and m.get("idVisitorClub") in vascos:
                        continue
                    f, h = (m.get("matchDay") or " ").split(" ")[0], ((m.get("matchDay") or "  ").split(" ") + [""])[1][:5]
                    if not (desde <= f <= hasta):
                        continue
                    res = ""
                    if f < hoy and m.get("localScore") not in (None, "") and m.get("visitorScore") not in (None, ""):
                        res = "%s-%s" % (m["localScore"], m["visitorScore"])
                    lugar = nombre(m.get("nameField") or "")
                    if m.get("nameTown"):
                        lugar += (", " if lugar else "") + nombre(m["nameTown"])
                    out.append({"id": "fbv" + str(m["idMatch"]), "dep": "balonc", "comp": comp, "o": o,
                                "loc": nombre(m.get("nameLocalTeam")), "vis": nombre(m.get("nameVisitorTeam")),
                                "f": f, "h": "" if h == "00:00" else h, "lugar": lugar, "url": URL_ESF, "res": res})
    return out

# ---------------- BALONMANO (Federación Navarra, iSquad) ----------------
BASE_BM = "https://resultadosbalonmano.isquad.es/"
def traer_balonmano():
    pag = get(BASE_BM + "maqueta/")
    tok = re.search(r'name="client-token" content="([^"]+)"', pag).group(1)
    def api(**p):
        return json.loads(get(BASE_BM + "maqueta/json/beta.php", data=urllib.parse.urlencode(p).encode(),
                              headers={"Content-Type": "application/x-www-form-urlencoded",
                                       "Referer": BASE_BM + "maqueta/", "X-Client-Token": tok}))
    sel = api(tipo="selectores", t=31, am=0, s=1, se=0)
    out = []
    for cat in sel.get("categorias", []):
        if "CAMPEONATO TERRITORIAL" not in cat["nombre"].upper():
            continue
        comps = api(tipo="selectores", t=31, am=0, s=1, se=0, cat=cat["id"]).get("competiciones", [])
        for co in comps:
            n = co["nombre"].upper()
            if "JUVENIL" in n or "LIGA" not in n:
                continue
            if "1ª" in n and "FEMEN" in n:
                comp, o = "1ª Nacional femenina (fase navarra)", 5
            elif "2ª" in n and "MASC" in n:
                comp, o = "2ª Nacional masculina (fase navarra)", 6
            else:
                comp, o = nombre(co["nombre"]), 8
            tors = api(tipo="selectores", t=31, am=0, s=1, se=0, cat=cat["id"], comp=co["id"]).get("torneos", [])
            for t in tors:
                d = api(tipo="torneo", id=t["id"])
                for m in d.get("partidos", []):
                    f, h = (m.get("fecha") or " ").split(" ")[0], (m.get("fecha") or "  ").split(" ")[1][:5]
                    if not (desde <= f <= hasta) or not m["l"].get("n") or not m["v"].get("n"):
                        continue
                    res = "%s-%s" % (m["gl"], m["gv"]) if f < hoy and m.get("gl") is not None and m.get("gv") is not None else ""
                    out.append({"id": "bm" + str(m["id"]), "dep": "balonm", "comp": comp, "o": o,
                                "loc": nombre(m["l"]["n"]), "vis": nombre(m["v"]["n"]), "f": f,
                                "h": "" if (h == "00:00" or not m.get("confirmada")) else h,
                                "lugar": nombre(m.get("campo") or ""),
                                "url": BASE_BM + "competicion.php?id_superficie=1&seleccion=0&id_territorial=31&id=%s&id_categoria=%s&id_competicion=%s" % (t["id"], cat["id"], co["id"]),
                                "res": res})
    return out

# ---------------- Mezclar ----------------
G = {"partidos": []}
if os.path.exists(PATH):
    try: G = json.load(open(PATH))
    except Exception: pass
viejos = G.get("partidos", [])
FUENTES = [("pelota", lambda x: x.get("dep") == "pelota", traer_pelota),
           ("baloncesto", lambda x: str(x.get("id", "")).startswith("fnb"), traer_baloncesto),
           ("baloncesto vasco-navarro", lambda x: str(x.get("id", "")).startswith("fbv"), traer_baloncesto_pv),
           ("balonmano", lambda x: str(x.get("id", "")).startswith("bm"), traer_balonmano)]
P = [x for x in viejos if not any(es(x) for _, es, _ in FUENTES)]
for nom, es, traer in FUENTES:
    try:
        nuevos = traer()
        print("%s: %d partidos" % (nom, len(nuevos)))
    except Exception as e:
        nuevos = [x for x in viejos if es(x)]
        print("%s: ERROR (%s), se conservan %d" % (nom, e, len(nuevos)), file=sys.stderr)
    P += nuevos
P = [x for x in P if x.get("f", "") >= desde]
P.sort(key=lambda x: (x.get("f", ""), x.get("h") or "99", x.get("dep", "")))
json.dump({"partidos": P}, open(PATH, "w"), ensure_ascii=False, indent=1)
print("Total: %d partidos" % len(P))
