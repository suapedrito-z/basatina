import json, urllib.request
cams = json.loads(open("web/index.html").read().split("const CAMS=")[1].split(";\n")[0])
OUT = []
for c in cams:
    for suf in ("", ("&" if "?" in c["u"] else "?") + "t=123"):
        try:
            r = urllib.request.urlopen(urllib.request.Request(c["u"] + suf, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=40)
            b = r.read(); OUT.append(f"{c['n']} {suf or '-'} {r.status} {r.headers.get('Content-Type')} {len(b)} {r.headers.get('Last-Modified')} {r.headers.get('Access-Control-Allow-Origin')}")
        except Exception as e: OUT.append(f"{c['n']} {suf or '-'} FALLO {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
