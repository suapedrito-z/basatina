# Agenda cultural de Navarra para la app (agenda/cultura.json).
# Junta dos agendas públicas:
#   · Cultura Navarra (Gobierno de Navarra): https://www.culturanavarra.es/es/agenda  (día a día, toda Navarra)
#   · Ayuntamiento de Pamplona: https://www.pamplona.es/actualidad/eventos  (solo los del tema «Cultura»)
# Los eventos que se meten a mano desde la app (id sin prefijo «cn»/«pa») se conservan siempre.
# Si una fuente falla, se quedan sus eventos anteriores.
import html, json, os, re, time, datetime, urllib.request

PATH = "agenda/cultura.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36 BasatiNA"}
HOY = datetime.date.today()
DIAS = int(os.environ.get("CULTURA_DIAS", "45"))   # cuántos días hacia delante
HASTA = HOY + datetime.timedelta(days=DIAS)

def get(url, enc="utf-8", timeout=40):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read().decode(enc, "replace")
        except Exception as e:
            err = e; time.sleep(2 + i * 3)
    raise err

def txt(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()

def cat_de(s):
    s = (s or "").lower()
    for c, pat in (("coro", r"\bcoro|coral|abesbatza"), ("concierto", r"concierto|música|musica|kontzert|recital|orquesta|gaita|jota"),
                   ("danza", r"danza|ballet|dantza"), ("cine", r"\bcine|proyecci|película|documental|zine"),
                   ("teatro", r"teatro|títeres|titeres|monólogo|monologo|circo|narraci|cuentacuentos|clown|antzerki"),
                   ("expo", r"exposici|arte contempor|instalaci|pintura|escultura|erakusket|fotograf"),
                   ("charla", r"conferencia|charla|mesa redonda|presentaci|encuentro|club de lectura|coloquio|jornada|congreso|recital poético|poes")):
        if re.search(pat, s):
            return c
    return "otros"

NOCULT = r"mercadillo|semana de los bares|bares rojillos|escuela de formaci|\bcursos?\b|inscripci|feria de|campeonato|carrera|torneo"

def ymd(d, m, y):
    return "%04d-%02d-%02d" % (int(y), int(m), int(d))

# ---------------- Cultura Navarra ----------------
def traer_cn():
    ev = {}
    d = HOY
    while d <= HASTA:
        try:
            h = get("https://www.culturanavarra.es/es/agenda/" + d.isoformat(), enc="cp1252")
        except Exception as e:
            print("cn", d, e); d += datetime.timedelta(days=1); continue
        for b in h.split('<div class="agenda_evento')[1:]:
            a = re.search(r'<h4><a href="([^"]+)">(.*?)</a>', b, re.S)
            if not a:
                continue
            url = "https://www.culturanavarra.es/" + a.group(1).lstrip("/")
            if url in ev:
                continue
            fe = re.findall(r"(\d\d)/(\d\d)/(\d{4})", txt((re.search(r'class="fecha">(.*?)</span>', b, re.S) or [None, ""])[1]))
            if not fe:
                continue
            f = ymd(*fe[0]); ff = ymd(*fe[-1]) if len(fe) > 1 else ""
            tipo = txt((re.search(r"<h3>(.*?)</h3>", b, re.S) or [None, ""])[1])
            loc = txt((re.search(r'class="localidad">(.*?)</div>', b, re.S) or [None, ""])[1])
            ent = txt((re.search(r'class="entradilla">(.*?)</div>', b, re.S) or [None, ""])[1])
            # «ARTAJONA» / «MENDAVIA Vestíbulo Ayuntamiento» / «Biblioteca de Navarra. Sala…» (en Pamplona)
            w = loc.split(" "); k = 0
            while k < len(w) and (w[k] == "/" or (len(w[k]) > 1 and w[k] == w[k].upper() and re.search(r"[A-ZÁÉÍÓÚÑ]", w[k]))):
                k += 1
            pueblo = " ".join(w[:k]).title().replace(" / ", "/") if k else ""
            lugar = " ".join(w[k:]).strip(" .")
            if not pueblo and " - " in loc:
                pueblo, lugar = [x.strip(" .") for x in loc.split(" - ", 1)]
            if not pueblo and re.search(r"Biblioteca de Navarra|Archivo Real|Museo de Navarra|Filmoteca|Baluarte|Gayarre|Ciudadela|Planetario", loc):
                pueblo = "Pamplona"
            ev[url] = {"id": "cn" + re.sub(r"[^a-z0-9]", "", a.group(1).split("/")[-1])[:40] + f.replace("-", ""),
                       "t": txt(a.group(2)).strip("“”\"« »"), "cat": cat_de(tipo + " " + ent), "f": f, "ff": ff if ff != f else "", "h": "",
                       "lugar": lugar, "pueblo": pueblo, "url": url, "desc": (ent if ent.lower() != tipo.lower() else "")[:160], "src": "Cultura Navarra"}
        d += datetime.timedelta(days=1)
        time.sleep(0.4)
    # hora y entradilla de los de un solo día (en la ficha)
    for e in ev.values():
        if e["ff"]:
            continue
        try:
            h = get(e["url"], enc="cp1252")
            m = re.search(r"\d{4}\s*-\s*(\d{1,2}:\d\d)\s*h", txt(h))
            if m and m.group(1).zfill(5) != "00:00":
                e["h"] = m.group(1).zfill(5)
        except Exception as x:
            print("cn ficha", e["url"], x)
        time.sleep(0.3)
    return list(ev.values())

# ---------------- Ayuntamiento de Pamplona ----------------
def traer_pa():
    out, vistos = [], set()
    for p in range(0, 40):
        h = get("https://www.pamplona.es/actualidad/eventos?page=%d" % p)
        arts = h.split('<div class="views-row"><article')[1:]
        if not arts:
            break
        pasado = 0
        for a in arts:
            t = re.search(r'<h3><a href="([^"]+)"[^>]*>(.*?)</a>', a, re.S)
            if not t:
                continue
            temas = re.findall(r">([^<>]+)</a>", (re.search(r"field--name-field-theme.*?</section>", a, re.S) or [""])[0])
            if "Cultura" not in temas:
                continue
            if re.search(NOCULT, txt(t.group(2)), re.I):
                continue
            ds = re.findall(r'<time datetime="(\d{4}-\d\d-\d\d)', a)
            if not ds:
                continue
            f, ff = ds[0], (ds[-1] if len(ds) > 1 and ds[-1] != ds[0] else "")
            if f > HASTA.isoformat():
                pasado += 1; continue
            if (ff or f) < HOY.isoformat():
                continue
            url = "https://www.pamplona.es" + t.group(1)
            if url in vistos:
                continue
            vistos.add(url)
            ent = txt((re.search(r"field-event-info.*?<a [^>]*>([^<]+)</a>", a, re.S) or [None, ""])[1])
            parts = [x.strip() for x in txt(t.group(2)).split(" - ")]
            tipo = parts[0]
            if len(parts) >= 3:
                tit = " - ".join(parts[1:-1])
            elif len(parts) == 2:
                tit = parts[1]
            else:
                tit = parts[0]
            out.append({"id": "pa" + re.sub(r"[^a-z0-9]", "", t.group(1).split("/")[-1])[:40] + f.replace("-", ""), "t": tit, "cat": cat_de(txt(t.group(2))),
                        "f": f, "ff": ff, "h": "", "lugar": ent or (parts[-1] if len(parts) >= 3 else ""), "pueblo": "Pamplona", "url": url,
                        "desc": tipo if tipo != tit else "", "src": "Ayuntamiento de Pamplona"})
        if pasado == len(arts):
            break
        time.sleep(0.4)
    for e in out:
        if e["ff"]:
            continue
        try:
            m = re.search(r"\d{4}\s*-\s*(\d{1,2}:\d\d)\s*h", txt(get(e["url"]))[:3000])
            if m and m.group(1).zfill(5) != "00:00":
                e["h"] = m.group(1).zfill(5)
        except Exception as x:
            print("pa ficha", e["url"], x)
        time.sleep(0.3)
    return out

# ---------------- juntar ----------------
old = json.load(open(PATH)) if os.path.exists(PATH) else {"eventos": []}
E = old.get("eventos", [])
manual = [e for e in E if not str(e.get("id", "")).startswith(("cn", "pa"))]
nuevos = {}
for pre, fn in (("cn", traer_cn), ("pa", traer_pa)):
    try:
        L = fn(); print(pre, len(L), "eventos")
    except Exception as x:
        print("ERROR", pre, x); L = [e for e in E if str(e.get("id", "")).startswith(pre)]
    nuevos[pre] = L
norm = lambda s: re.sub(r"[^a-z0-9]", "", html.unescape(s or "").lower().translate(str.maketrans("áéíóúüñ", "aeiouun")))
# si un evento de Pamplona ya sale en Cultura Navarra (mismo día y título), se queda el de Cultura Navarra
cnk = [(e["f"], norm(e["t"])) for e in nuevos["cn"]]
pa = [e for e in nuevos["pa"] if not any(f == e["f"] and len(t) > 8 and (t in norm(e["t"]) or norm(e["t"]) in t) for f, t in cnk)]
ayer = (HOY - datetime.timedelta(days=1)).isoformat()
todo = [e for e in manual + nuevos["cn"] + pa if (e.get("ff") or e.get("f", "")) >= ayer]
vis, uni = set(), []
for e in todo:
    k = (e.get("f"), norm(e.get("t")))
    if k not in vis:
        vis.add(k); uni.append(e)
todo = uni
todo.sort(key=lambda e: (e["f"], e.get("h") or "99", e["t"]))
os.makedirs("agenda", exist_ok=True)
json.dump({"eventos": todo, "act": time.strftime("%Y-%m-%d %H:%M")}, open(PATH, "w"), ensure_ascii=False, indent=1)
print(len(todo), "eventos en total ·", len(manual), "a mano ·", len(nuevos["cn"]), "Cultura Navarra ·", len(pa), "Pamplona")
