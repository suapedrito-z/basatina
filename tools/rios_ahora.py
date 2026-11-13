"""
Ríos «ahora» para la VERSIÓN WEB de BasatiNA (la app del móvil no lo necesita: lee el SAIH ella sola).

Por qué hace falta: el navegador no deja que una web (basatina.es) pida datos a otra (saihebro.com),
así que GitHub Actions lee el SAIH Ebro cada 20 minutos y deja el resultado en un archivo que la web sí puede leer.

  python3 tools/rios_ahora.py  -> rios-ahora.json (y rios-estaciones.json, la lista de estaciones, que se renueva cada 7 días)

Para cada río (Arga, Irati, Ega, Aragón, Ebro) elige una estación arriba, otra en medio y otra abajo
(la misma lógica que la app) y guarda su tabla de «Valores actuales» tal cual la da el SAIH;
la web la lee con la misma función que la app (fichaAdd).
Lo ejecuta .github/workflows/rios_ahora.yml y lo guarda en la rama «datos» (no ensucia la rama principal).
"""
import json, re, time, os, urllib.request, concurrent.futures as cf

SAIH = "https://www.saihebro.com"
UA = {"User-Agent": "BasatiNA/1.0 (app gratuita sobre Navarra; +https://basatina.es)", "Accept": "application/json"}
EST_F, OUT_F = "rios-estaciones.json", "rios-ahora.json"
BOX = dict(s=41.85, n=43.35, w=-2.6, e=-0.7)

# mismas búsquedas que la app (RIVDEF) y mismo «río principal» y orden aguas abajo (RZ_RIOS)
RIOS = {
    "irati":  dict(n="Irati",  busca=r"IRATI|URROBI|\bERRO\b|ARETA|SALAZAR|ITOIZ|IRABIA|ZATOYA|ANDU[ÑN]A|EZKA|ESCA\b", prin=r"IRATI",       orden=lambda s: -s["lat"]),
    "ega":    dict(n="Ega",    busca=r"\bEGA\b|UREDERRA|IRANZU",                                               prin=r"\bEGA\b",     orden=lambda s: -s["lat"]),
    "aragon": dict(n="Aragón", busca=r"ARAG[OÓ]N|\bESCA\b|ZIDACOS|CIDACOS|ONSELLA|\bYESA\b",                    prin=r"ARAG[OÓ]N",   orden=lambda s: -s["lon"]),
    "ebro":   dict(n="Ebro",   busca=r"^EBRO\b|QUEILES|ALHAMA|ODR[OÓ]N|LINARES",                                prin=r"^EBRO",       orden=lambda s: s["lon"]),
}
ARGA = [["alta", ["A159", "A152"]], ["media", ["A313", "A323", "A324"]], ["baja", ["A004", "A069"]]]
NOMBRES_ARGA = {"A159": "ARGA - URDANIZ", "A152": "ARGA - EUGI", "A313": "ARGA - PAMPLONA", "A323": "ARGA - PAMPLONA",
                "A324": "ARGA - PAMPLONA", "A004": "ARGA - FUNES", "A069": "ARGA - PERALTA"}


def get(path, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(SAIH + path, headers=UA), timeout=40) as f:
                return json.loads(f.read().decode("utf-8", "replace"))
        except Exception as e:
            if i == tries - 1:
                print("  fallo", path, e)
            time.sleep(2 + 3 * i)
    return None


def estaciones():
    """Lista de estaciones por río, con posición. Se reutiliza 7 días para no cargar al SAIH."""
    try:
        c = json.load(open(EST_F))
        if time.time() - c["t"] < 7 * 86400 and all(c["rios"].get(r) for r in RIOS):
            return c["rios"]
    except Exception:
        pass
    b = get("/api/common/getBusquedas")
    todas = [e for e in (b or {}).get("BUSQUEDA", []) if e.get("TIPO") == "_ficha" and e.get("TIPO_REMOTA") in ("A", "E")]
    print("buscador del SAIH:", len(todas), "estaciones")
    out = {}
    for r, d in RIOS.items():
        L = {e["CODIGO_ESTACION"]: e for e in todas if re.search(d["busca"], e["NOMBRE_ESTACION"], re.I)}
        def info(e):
            j = get("/api/ficha/procesarTablaInfoGeneral?estacion=" + e["CODIGO_ESTACION"]) or {}
            h = j.get("INFO_GENERAL") or ""
            la = re.search(r"data-lat='([-\d.]+)'", h); lo = re.search(r"data-lng='([-\d.]+)'", h)
            ca = re.search(r"Comunidad Aut[oó]noma</td>\s*<td>([^<]*)", h)
            return dict(code=e["CODIGO_ESTACION"], name=e["NOMBRE_ESTACION"], tipo=e["TIPO_REMOTA"],
                        lat=float(la.group(1)) if la else None, lon=float(lo.group(1)) if lo else None,
                        ca=(ca.group(1).strip() if ca else ""))
        with cf.ThreadPoolExecutor(4) as ex:
            st = list(ex.map(info, L.values()))
        st = [x for x in st if x["lat"] is not None and x["lon"] is not None]
        if r == "ebro":
            nav = [x for x in st if re.search("navarra", x["ca"], re.I)]
            st = nav or [x for x in st if BOX["s"] <= x["lat"] <= BOX["n"] and BOX["w"] <= x["lon"] <= BOX["e"]]
        else:
            st = [x for x in st if BOX["s"] <= x["lat"] <= BOX["n"] and BOX["w"] <= x["lon"] <= BOX["e"]]
        print(f"  {d['n']}: {len(L)} con ese nombre, {len(st)} en Navarra")
        out[r] = st
    if any(out.values()):
        json.dump({"t": time.time(), "rios": out}, open(EST_F, "w"), ensure_ascii=False)
    return out


def zonas(r, st):
    """Arriba / medio / abajo: igual que la app (solo aforos del río principal, ordenados aguas abajo, en tres trozos)."""
    d = RIOS[r]
    st = [x for x in st if x["tipo"] != "E" and not re.search("EMBALSE|PRESA", x["name"], re.I)]
    pr = [x for x in st if re.search(d["prin"], x["name"], re.I)]
    if len(pr) >= 2:
        st = pr
    st.sort(key=d["orden"])
    n = len(st)
    trozos = [st[:-(-n // 3)], st[-(-n // 3):-(-2 * n // 3)], st[-(-2 * n // 3):]]
    return [[z, [x["code"] for x in g]] for z, g in zip(["alta", "media", "baja"], trozos) if g]


def tiene_valor(html):
    """¿Trae caudal o nivel con número? (lo mismo que mira la app para enseñar la estación)"""
    for fila in re.split(r"<tr>", html, flags=re.I)[1:]:
        desc = re.search(r"aria-label='Señal ([^']*)'", fila); val = re.search(r"aria-label='Valor (-?[\d.,]+)", fila)
        if desc and val and re.search("CAUDAL|NIVEL", desc.group(1), re.I):
            return True
    return False


def main():
    est = estaciones()
    out = {"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "fuente": "SAIH Ebro (Confederación Hidrográfica del Ebro)",
           "rios": {}, "fichas": {}}
    nombres = dict(NOMBRES_ARGA)
    for r, st in est.items():
        for x in st:
            nombres[x["code"]] = x["name"]
    todas = [["arga", ARGA]] + [[r, zonas(r, est.get(r) or [])] for r in RIOS]
    for r, zs in todas:
        elegidas = []
        for z, codes in zs:
            for c in codes[:4]:
                j = get("/api/ficha/procesarTablaValoresActuales?estacion=" + c, tries=2)
                h = (j or {}).get("VALORES_ACTUALES") or ""
                if h and tiene_valor(h):
                    out["fichas"][c] = {"name": nombres.get(c, c), "html": h}
                    elegidas.append([z, c])
                    break
        out["rios"][r] = elegidas
        print(f"{r}: " + ", ".join(f"{z} {c}" for z, c in elegidas))
    if not out["fichas"]:
        raise SystemExit("El SAIH no ha dado ningún dato: no se toca el archivo anterior.")
    json.dump(out, open(OUT_F, "w"), ensure_ascii=False)
    print("guardado", OUT_F, len(out["fichas"]), "estaciones")


if __name__ == "__main__":
    main()
