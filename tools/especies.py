"""
Fichas de flora, fauna y setas de Navarra para BasatiNA.

  python3 tools/especies.py   -> web/especies.js  y  tools/especies_info.txt

De dónde sale cada dato:
  · Qué especies hay y dónde/cuándo se han visto: GBIF (gbif.org), observaciones con coordenadas dentro de Navarra
    (museos, Gobierno de Navarra, iNaturalist, eBird, Observation.org…). Licencias CC0 / CC BY.
  · Nombre en castellano y euskera: GBIF (nombres comunes) y Wikipedia.
  · Explicación: resumen de Wikipedia en español (CC BY-SA 4.0, con enlace al artículo).
  · Estado de amenaza: Lista Roja de la UICN (vía GBIF).
  · Las fichas revisadas a mano de web/naturaleza-catalogo.js se añaden encima.
Las zonas se cuentan con 7 recuadros aproximados de Navarra (montaña atlántica, Pirineo, Sakana, Cuenca, Tierra Estella, Zona Media, Ribera).

Lo ejecuta GitHub Actions (.github/workflows/especies.yml) una vez al mes.
"""
import json, re, time, unicodedata, urllib.request, urllib.parse, concurrent.futures as cf, os

UA = {"User-Agent": "BasatiNA/1.0 (app gratuita sobre Navarra; +https://github.com/suapedrito-z/basatina)"}
G = "https://api.gbif.org/v1/"
INFO = []
CACHE_F = "tools/especies_cache.json"

def get(url, tries=3, js=True, timeout=60):
    for i in range(tries):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()
            return json.loads(b) if js else b
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(2 * (i + 1))
        except Exception:
            time.sleep(2 * (i + 1))
    return None

def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

# grupo de la app: (nombre en la app, tipo, taxón GBIF, rango, cuántas especies como máximo)
GRUPOS = [
    ("Aves", "Fauna", "Aves", "CLASS", 230),
    ("Mamíferos", "Fauna", "Mammalia", "CLASS", 80),
    ("Reptiles", "Fauna", "Squamata", "", 30),
    ("Reptiles", "Fauna", "Testudines", "", 6),
    ("Anfibios", "Fauna", "Amphibia", "CLASS", 22),
    ("Peces", "Fauna", "Cypriniformes", "", 20),
    ("Peces", "Fauna", "Salmoniformes", "", 6),
    ("Peces", "Fauna", "Perciformes", "", 8),
    ("Peces", "Fauna", "Centrarchiformes", "", 4),
    ("Peces", "Fauna", "Esociformes", "", 2),
    ("Peces", "Fauna", "Siluriformes", "", 3),
    ("Peces", "Fauna", "Anguilliformes", "", 1),
    ("Peces", "Fauna", "Cyprinodontiformes", "", 2),
    ("Peces", "Fauna", "Gobiiformes", "", 2),
    ("Mariposas y polillas", "Fauna", "Lepidoptera", "", 130),
    ("Libélulas", "Fauna", "Odonata", "ORDER", 55),
    ("Escarabajos", "Fauna", "Coleoptera", "ORDER", 50),
    ("Plantas con flor", "Flora", "Magnoliopsida", "CLASS", 420),
    ("Plantas con flor", "Flora", "Liliopsida", "CLASS", 130),
    ("Coníferas", "Flora", "Pinopsida", "CLASS", 15),
    ("Helechos", "Flora", "Polypodiopsida", "CLASS", 40),
    ("Setas", "Setas", "Agaricomycetes", "CLASS", 130),
]
# siempre sin pueblos (especies muy sensibles a las molestias o al expolio), además de las amenazadas según la UICN
SENSIBLES = re.compile(r"^(Gypaetus|Ursus|Tetrao|Mustela lutreola|Galemys|Dendrocopos leucotos|Neophron|Aquila|Milvus milvus|Otis|Tetrax|"
                       r"Pterocles|Falco peregrinus|Bubo|Ciconia nigra|Lutra|Emys|Mauremys|Rosalia|Lucanus|Cypripedium|Austropotamobius)", re.I)
FAM_SENSIBLES = {"Orchidaceae"}

# zonas de Navarra (rectángulos aproximados; las observaciones ya están filtradas a Navarra)
def _rect(w, s, e, n): return "POLYGON((%s %s,%s %s,%s %s,%s %s,%s %s))" % (w, s, e, s, e, n, w, n, w, s)
ZONAS = [("Montaña atlántica (Baztan, Bidasoa, Malerreka, Leitzaran)", _rect(-2.6, 43.0, -1.45, 43.4)),
         ("Pirineo (Roncesvalles, Aezkoa, Salazar, Roncal)", _rect(-1.45, 42.85, -0.6, 43.4)),
         ("Sakana, Urbasa y Andía", _rect(-2.6, 42.72, -1.95, 43.0)),
         ("Cuenca de Pamplona y valles prepirenaicos", "POLYGON((-1.95 42.72,-0.6 42.72,-0.6 42.85,-1.45 42.85,-1.45 43.0,-1.95 43.0,-1.95 42.72))"),
         ("Tierra Estella", _rect(-2.6, 42.38, -1.85, 42.72)),
         ("Zona Media (Tafalla, Olite, Sangüesa, Lumbier)", _rect(-1.85, 42.38, -0.6, 42.72)),
         ("Ribera y Bardenas", _rect(-2.6, 41.85, -0.6, 42.38))]

def zona(la, lo):
    """Zona de Navarra aproximada a partir de las coordenadas del pueblo."""
    if la >= 43.0 and lo < -1.45: return "Montaña atlántica (Baztan, Bidasoa, Malerreka, Leitzaran)"
    if la >= 42.85 and lo >= -1.45: return "Pirineo (Roncesvalles, Aezkoa, Salazar, Roncal)"
    if la >= 42.75 and lo < -1.95: return "Sakana, Urbasa y Andía"
    if la >= 42.72: return "Cuenca de Pamplona y valles prepirenaicos"
    if la >= 42.38 and lo < -1.85: return "Tierra Estella"
    if la >= 42.38: return "Zona Media (Tafalla, Olite, Sangüesa, Lumbier)"
    return "Ribera y Bardenas"

def pueblos():
    t = open("web/pueblos.js", encoding="utf-8").read()
    j = json.loads(t[t.index("=") + 1:].rstrip().rstrip(";"))
    M = {}
    for p in j["pueblos"]:
        for parte in re.split(r"\s*/\s*", p["n"]):
            M.setdefault(norm(parte), p["pt"])
        M.setdefault(norm(p["n"]), p["pt"])
    return M

def revisadas():
    """Fichas escritas a mano (web/naturaleza-catalogo.js)."""
    try:
        t = open("web/naturaleza-catalogo.js", encoding="utf-8").read()
        a = t.index("const fichas=") + len("const fichas="); b = t.index("];", a) + 1
        import subprocess   # es JavaScript (no JSON puro): lo lee node
        return json.loads(subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(" + t[a:b] + "))"],
                                         capture_output=True, text=True, check=True).stdout)
    except Exception as e:
        INFO.append("fichas revisadas: no se pudieron leer (%s)" % e); return []

def main():
    cache = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}
    # 1) Navarra en GADM (para filtrar las observaciones)
    r = get(G + "geocode/gadm/search?q=Navarra&gadmLevel=1&gadm0Gid=ESP&limit=5") or {}
    gid = next((x["id"] for x in r.get("results", []) if "navarr" in norm(x.get("name"))), None)
    if not gid:
        INFO.append("No se encontró Navarra en GADM"); open("tools/especies_info.txt", "w").write("\n".join(INFO)); return
    INFO.append("Navarra en GADM: %s" % gid)
    # 2) lista de especies por grupo (las más observadas primero)
    lista = {}; claves = []
    for nom, tipo, taxon, rango, lim in GRUPOS:
        q = {"name": taxon, "strict": "true"}
        if rango: q["rank"] = rango
        m = get(G + "species/match?" + urllib.parse.urlencode(q)) or {}
        tk = m.get("usageKey") if m.get("matchType") != "NONE" else None
        if not tk:   # sin rango ni modo estricto
            m = get(G + "species/match?" + urllib.parse.urlencode({"name": taxon})) or {}
            tk = m.get("usageKey") if m.get("matchType") == "EXACT" else None
        if not tk: INFO.append("%s: no encontrado en GBIF" % taxon); continue
        f = get(G + "occurrence/search?" + urllib.parse.urlencode({"gadmGid": gid, "taxonKey": tk, "limit": 0, "facet": "speciesKey",
                "facetLimit": lim, "occurrenceStatus": "PRESENT"})) or {}
        cnt = (f.get("facets") or [{}])[0].get("counts", [])
        INFO.append("%s (%s, clave %s): %d especies · %d observaciones en total" % (nom, taxon, tk, len(cnt), f.get("count", 0)))
        claves.append(tk)
        for c in cnt:
            k = c["name"]
            if int(c["count"]) < 3 or k in lista: continue
            lista[k] = {"g": nom, "tipo": tipo, "c": int(c["count"])}
    INFO.append("Total especies: %d" % len(lista))
    # zonas y meses: una petición por grupo y zona (o mes) con el recuento de cada especie
    ZC = {k: {} for k in lista}; MC = {k: [0] * 12 for k in lista}
    fallos = []
    def faceta(extra):
        r = get(G + "occurrence/search?" + urllib.parse.urlencode([("gadmGid", gid), ("limit", 0), ("facet", "speciesKey"), ("facetLimit", 3000)] + extra), tries=6, timeout=180)
        if r is None or ("facets" not in r):
            fallos.append(extra); return {}
        return {c["name"]: int(c["count"]) for c in ((r.get("facets") or [{}])[0].get("counts", []))}
    trabajos = [(tk, "z", zn, [("geometry", wkt)]) for tk in claves for zn, wkt in ZONAS] + [(tk, "m", m, [("month", m + 1)]) for tk in claves for m in range(12)]
    with cf.ThreadPoolExecutor(2) as ex:
        for (tk, tipo, key, extra), res in zip(trabajos, ex.map(lambda t: faceta([("taxonKey", t[0])] + t[3]), trabajos)):
            for sk, n in res.items():
                if sk not in lista: continue
                if tipo == "z": ZC[sk][key] = ZC[sk].get(key, 0) + n
                else: MC[sk][key] += n
    INFO.append("Recuentos por zona y mes: %d peticiones · fallidas: %d %s" % (len(trabajos), len(fallos), [str(f)[:80] for f in fallos[:10]]))
    cache.pop("_gadm", None)

    def ficha(k):
        e = lista[k]; cc = cache.get(k) or {}
        if "s" not in cc:
            sp = get(G + "species/" + k) or {}
            cc["s"] = sp.get("canonicalName") or sp.get("scientificName") or ""
            cc["fam"] = sp.get("family") or ""
            vn = (get(G + "species/%s/vernacularNames?limit=200" % k) or {}).get("results", [])
            es = [v["vernacularName"] for v in vn if v.get("language") in ("spa", "es")]
            eu = [v["vernacularName"] for v in vn if v.get("language") in ("eus", "baq", "eu")]
            cc["es"] = es[0] if es else ""
            cc["eu"] = eu[0] if eu else ""
            iu = get(G + "species/%s/iucnRedListCategory" % k) or {}
            cc["iu"] = iu.get("code") or iu.get("category") or ""
        if "w" not in cc:
            w = None
            for t in [cc["s"], cc["es"]]:
                if not t: continue
                j = get("https://es.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(t.replace(" ", "_")))
                if j and j.get("type") == "standard" and j.get("extract"):
                    w = {"t": j.get("title", ""), "x": j["extract"], "u": (j.get("content_urls") or {}).get("mobile", {}).get("page", "")}
                    break
            cc["w"] = w
        cache[k] = cc
        meses, zonas = MC[k], ZC[k]
        return k, meses, zonas

    out = []; hechos = 0
    with cf.ThreadPoolExecutor(6) as ex:
        res = list(ex.map(ficha, list(lista)))
    for k, meses, zonas in res:
        e = lista[k]; cc = cache[k]
        if not cc.get("s"): continue
        sens = cc.get("iu") in ("CR", "EN", "VU") or SENSIBLES.search(cc["s"]) or cc.get("fam") in FAM_SENSIBLES
        n = cc["es"] or (cc["w"]["t"] if cc.get("w") and norm(cc["w"]["t"]) != norm(cc["s"]) else "") or cc["s"]
        if n != cc["s"] and " " in n and all(p[:1].isupper() for p in n.split() if len(p) > 3):   # «Buitre Leonado» -> «Buitre leonado»
            n = n.split(" ", 1)[0] + " " + n.split(" ", 1)[1].lower()
        o = {"k": int(k), "g": e["g"], "tp": e["tipo"], "s": cc["s"], "n": n[:1].upper() + n[1:], "f": cc.get("fam", ""), "c": e["c"],
             "z": sorted(zonas.items(), key=lambda z: -z[1])[:5], "m": meses}
        if cc.get("eu"): o["eu"] = cc["eu"]
        if cc.get("iu") and cc["iu"] not in ("LC", "NE", "DD"): o["iu"] = cc["iu"]
        if sens: o["sens"] = 1
        if cc.get("w"):
            x = re.sub(r"\s+", " ", cc["w"]["x"]).strip()
            if len(x) > 520: x = x[:520].rsplit(". ", 1)[0] + "."
            o["w"] = {"x": x, "u": cc["w"]["u"]}
        out.append(o); hechos += 1
    # fichas revisadas a mano
    R = revisadas(); por_s = {norm(o["s"]): o for o in out}; extra = 0
    for r in R:
        o = por_s.get(norm(r.get("cientifico")))
        rev = {"campos": r.get("campos", {}), "fuentes": r.get("fuentes", []), "zona": r.get("zona", "")}
        if o: o["rev"] = rev
        else:
            out.append({"k": 0, "g": r.get("grupo", ""), "tp": r.get("tipo", "Fauna"), "s": r.get("cientifico", ""), "n": r.get("nombre", ""),
                        "f": "", "c": 0, "z": [], "m": [0] * 12, "rev": rev}); extra += 1
    out.sort(key=lambda o: (o["tp"], o["g"], o["n"].lower()))
    INFO.append("Fichas: %d (con texto de Wikipedia: %d) · revisadas a mano: %d (%d nuevas)" % (len(out), sum(1 for o in out if o.get("w")), len(R), extra))
    json.dump(cache, open(CACHE_F, "w"), ensure_ascii=False, separators=(",", ":"))
    open("tools/especies_info.txt", "w").write("\n".join(INFO) + "\n")
    if len(out) < 50:
        print("Pocas fichas: no se toca web/especies.js"); return
    js = ("// Flora, fauna y setas de Navarra. Observaciones: GBIF.org (CC0 / CC BY). Textos: Wikipedia en español (CC BY-SA 4.0). "
          "Amenaza: Lista Roja UICN. Generado por tools/especies.py\n")
    js += "window.ESPECIES=" + json.dumps({"t": time.strftime("%Y-%m-%d"), "e": out}, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open("web/especies.js", "w", encoding="utf-8").write(js)
    print("\n".join(INFO[-3:]), "·", len(js) // 1024, "KB")

if __name__ == "__main__":
    main()
