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

if __name__ == "__main__":
    if "--explorar" in sys.argv:
        explorar()
