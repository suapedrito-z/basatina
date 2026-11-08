"""
Datos abiertos del Gobierno de Navarra (datosabiertos.navarra.es, CKAN) para BasatiNA.

  python3 tools/abiertos.py --explorar   -> escribe tools/abiertos_info.txt con los recursos y campos de cada conjunto
  python3 tools/abiertos.py              -> descarga y guarda web/abiertos.js (alojamientos, restaurantes, museos,
                                            arte y monumentos, festivos)

Usa la API de CKAN (package_show) para encontrar los archivos de cada conjunto a partir de su nombre,
así si el Gobierno cambia el archivo no hay que tocar nada aquí.
"""
import json, sys, time, urllib.request, urllib.parse, io, csv, re

UA = {"User-Agent": "BasatiNA/1.0 (+https://github.com/suapedrito-z/basatina)", "Accept": "*/*"}
API = "https://datosabiertos.navarra.es/api/3/action/"
CONJ = {
    "hotel": "establecimientos-hoteleros-en-activo-del-registro-de-turismo-de-navarra",
    "rural": "casas-rurales-en-activo-del-registro-de-turismo-de-navarra",
    "apart": "apartamentos-turisticos-en-activo-del-registro-de-turismo-de-navarra",
    "albergue": "albergues-turisticos-en-activo-del-registro-de-turismo-de-navarra",
    "camping": "campamentos-de-turismo-campings-en-activo-del-registro-de-turismo-de-navarra",
    "rest": "restaurantes-inscritos-en-el-registro-de-turismo-de-navarra",
    "museo": "museos-de-navarra-",
    "arte": "arte-y-monumentos",
    "festivos": "calendario-de-dias-festivos-de-la-comunidad-foral-de-navarra",
    "recetas": "productos-t-picos-y-recetas",
}

def get(url, tries=4):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        except Exception as e:
            print("  reintento", i + 1, url, e, flush=True); time.sleep(5 * (i + 1))
    raise RuntimeError("no se pudo descargar " + url)

def paquete(slug):
    return json.loads(get(API + "package_show?id=" + urllib.parse.quote(slug)))["result"]

def filas(res_id):
    """Todas las filas de un recurso del datastore (JSON de CKAN)."""
    j = json.loads(get("https://datosabiertos.navarra.es/datastore/dump/%s?format=json" % res_id).decode("utf-8-sig"))
    campos = [f["id"] for f in j.get("fields", [])]
    return [dict(zip(campos, r)) for r in j.get("records", [])]

def explorar():
    out = []
    for k, slug in CONJ.items():
        out.append("=" * 80 + "\n" + k + "  " + slug)
        try:
            p = paquete(slug)
            for r in p.get("resources", []):
                out.append("  - %s | %s | datastore=%s | %s | %s" % (r.get("name"), r.get("format"), r.get("datastore_active"), r.get("id"), r.get("url")))
                if r.get("datastore_active"):
                    try:
                        F = filas(r["id"])
                        out.append("    filas: %d" % len(F))
                        for f in F[:2]:
                            out.append("    " + json.dumps(f, ensure_ascii=False)[:1500])
                    except Exception as e:
                        out.append("    ERROR filas " + str(e))
                elif (r.get("format") or "").upper() in ("KML", "JSON", "GEOJSON", "CSV"):
                    try:
                        b = get(r["url"])[:1500].decode("utf-8", "replace")
                        out.append("    muestra: " + b.replace("\n", " ")[:1500])
                    except Exception as e:
                        out.append("    ERROR muestra " + str(e))
        except Exception as e:
            out.append("  ERROR " + str(e))
        time.sleep(1)
    open("tools/abiertos_info.txt", "w").write("\n".join(out) + "\n")
    print("\n".join(out))

# ---------------------------------------------------------------- descarga para la app
import unicodedata, html as H
NOPUB = "no se consiente"
def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()
def limpio(v):
    v = (v or "").strip() if isinstance(v, str) else ("" if v is None else str(v))
    return "" if NOPUB in v.lower() else v
def texto(htm, n=1600):
    t = re.sub(r"<br\s*/?>", "\n", htm or "", flags=re.I); t = re.sub(r"<[^>]+>", "", t); t = H.unescape(t)
    t = re.sub(r"\n\s*\n+", "\n", t).strip()
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"

# Coordenadas de los pueblos (web/pueblos.js, del Nomenclátor de IDENA) para situar lo que solo trae el nombre del pueblo
P = open("web/pueblos.js", encoding="utf-8").read(); P = json.loads(P[P.index("{"):P.rindex("}") + 1])
IDX, MUNI = {}, {}
for p in P["pueblos"]:
    for alt in [p["n"]] + p["n"].split("/"):
        IDX.setdefault(norm(alt), p["pt"])
for k, m in P["municipios"].items():
    pts = [p["pt"] for p in P["pueblos"] if p["m"] == k]
    if pts:
        for alt in [m["n"]] + m["n"].split("/"):
            MUNI.setdefault(norm(alt), IDX.get(norm(alt)) or pts[0])
SIN = []
def donde(loc, muni=""):
    for cand in [loc] + (loc or "").split("/") + [muni] + (muni or "").split("/"):
        c = norm(cand)
        if not c: continue
        if c in IDX: return IDX[c]
        if c in MUNI: return MUNI[c]
    SIN.append(loc or muni); return None

def recurso(slug, nombre=None):
    p = paquete(slug)
    R = [r for r in p["resources"] if r.get("datastore_active") and (nombre is None or nombre in (r.get("name") or ""))]
    return filas(R[0]["id"])

def descargar():
    from pyproj import Transformer
    utm = Transformer.from_crs("EPSG:25830", "EPSG:4326", always_xy=True)
    out = {"t": time.strftime("%Y-%m-%d")}
    # 🛏️ alojamientos: [tipo, nombre, categoría, dirección, localidad, zona, plazas, lat, lon, web, teléfono]
    al = []
    for tipo in ["hotel", "rural", "apart", "albergue", "camping"]:
        for f in recurso(CONJ[tipo]):
            pt = donde(f.get("LOCALIDAD"), f.get("MUNICIPIO")) or [None, None]
            al.append([tipo, limpio(f.get("NOMBRE")), limpio(f.get("CATEGORIA")) or limpio(f.get("MODALIDAD")), limpio(f.get("DIRECCION")),
                       limpio(f.get("LOCALIDAD")), limpio(f.get("SUB_ZONA")), int(f.get("PLAZAS") or 0) if str(f.get("PLAZAS") or "0").isdigit() else 0,
                       pt[0], pt[1], limpio(f.get("WEB")), limpio(f.get("TELEFONO_RESERVAS_1"))])
        time.sleep(1)
    out["aloj"] = al
    # 🍽️ restaurantes: [nombre, categoría, especialidad, dirección, localidad, zona, lat, lon, web, teléfono]
    out["rest"] = []
    for f in recurso(CONJ["rest"]):
        pt = donde(f.get("LOCALIDAD"), f.get("MUNICIPIO")) or [None, None]
        out["rest"].append([limpio(f.get("NOMBRE")), limpio(f.get("CATEGORIA")), limpio(f.get("Especialidad")), limpio(f.get("DIRECCION")),
                            limpio(f.get("LOCALIDAD")), limpio(f.get("SUB_ZONA")), pt[0], pt[1], limpio(f.get("WEB")), limpio(f.get("TELEFONO_RESERVAS_1"))])
    # 🏛️ museos (con horario y precio)
    out["museos"] = []
    for f in recurso(CONJ["museo"]):
        pt = donde(f.get("LOCALIDAD")) or [None, None]
        nom = limpio(f.get("NOMBRE")); nom = nom.title() if nom.isupper() else nom
        out["museos"].append({"n": nom, "loc": limpio(f.get("LOCALIDAD")), "dir": limpio(f.get("DIRECCION")), "tel": limpio(f.get("TELEFONO")),
                              "web": limpio(f.get("WEB")), "hor": texto(limpio(f.get("HORARIO")), 900), "pre": texto(limpio(f.get("PRECIO")), 300),
                              "des": texto(limpio(f.get("DESCRIPCION")), 900), "lat": pt[0], "lon": pt[1]})
    # 🏰 arte y monumentos: [nombre, tipo, estilo, localidad, zona, lat, lon]  (coordenadas UTM 30N -> grados)
    out["arte"] = []
    for f in recurso(CONJ["arte"]):
        try: lon, lat = utm.transform(float(f["GEORR_X"]), float(f["GEORR_Y"])); lat, lon = round(lat, 5), round(lon, 5)
        except Exception: lat = lon = None
        loc = limpio(f.get("NombreLocalidad")); loc = loc.title() if loc.isupper() else loc
        out["arte"].append([limpio(f.get("Nombre")), limpio(f.get("Tipo")), limpio(f.get("ESTILO")), loc, limpio(f.get("DescripZona")), lat, lon])
    # 🎉 festivos locales por año: {"2026": [["Abáigar", "01-22"], ...]}
    MES = {m: i + 1 for i, m in enumerate(["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"])}
    out["festivos"] = {}
    for r in paquete(CONJ["festivos"])["resources"]:
        y = re.match(r"(\d{4})", r.get("name") or "")
        if not (y and r.get("datastore_active")) or int(y.group(1)) < int(time.strftime("%Y")) - 1: continue
        L = []
        for f in filas(r["id"]):
            m, d = MES.get(norm(f.get("MES"))), str(f.get("DIA") or "").strip()
            if m and d.isdigit(): L.append([(f.get("LOCALIDAD") or "").strip().title(), "%02d-%02d" % (m, int(d))])
        out["festivos"][y.group(1)] = L
    # 🥘 productos típicos y recetas
    out["recetas"] = [{"n": limpio(f.get("Nombre")), "tipo": limpio(f.get("Tipo")), "sub": limpio(f.get("Subtipo")), "do": f.get("DenominacionOrigen") == "S",
                       "txt": texto(f.get("DescripImpresion"), 1600)} for f in recurso(CONJ["recetas"])]
    s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    open("web/abiertos.js", "w", encoding="utf-8").write("// Datos abiertos del Gobierno de Navarra (datosabiertos.navarra.es, CC BY 4.0). Generado por tools/abiertos.py\nwindow.ABIERTOS=" + s + ";\n")
    info = "alojamientos %d · restaurantes %d · museos %d · arte %d · festivos %s · recetas %d\nSin situar (%d): %s" % (
        len(out["aloj"]), len(out["rest"]), len(out["museos"]), len(out["arte"]), {k: len(v) for k, v in out["festivos"].items()}, len(out["recetas"]),
        len(set(SIN)), ", ".join(sorted(set(x for x in SIN if x)))[:3000])
    print(info); open("tools/abiertos_info.txt", "a").write("\n" + "=" * 80 + "\nRESUMEN\n" + info + "\n")

if __name__ == "__main__":
    if "--explorar" in sys.argv:
        explorar()
    else:
        descargar()
