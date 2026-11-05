import urllib.request, re, os, time
OUT = []; os.makedirs("tools/tmp", exist_ok=True)
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=60) as f: return dict(f.headers), f.read()
B = "https://www.euskalmet.euskadi.eus/vamet/radar_kapildui_detail/intensity/today/"
h, b = get(B); t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b.decode("utf8", "ignore")))
OUT.append(repr(b[:1500])); L = re.findall(r"(webmet00-(\d{4})\.png)\s+([\d-]+ [\d:]+)\s+([\d.]+[KM]?)", t)
OUT.append(f"UTC ahora {time.strftime('%H:%M', time.gmtime())}")
OUT += [" ".join(x) for x in L]
if not L: open("tools/camaras_info.txt","w").write("\n".join(OUT)); raise SystemExit
small = [x for x in L if not x[3].startswith("13")]
for x in [small[-1], small[-2]] + [y for y in L if y[3].startswith("13")][:1]:
    hh, bb = get(B + x[0]); open("tools/tmp/" + x[0], "wb").write(bb); OUT.append(f"bajada {x[0]} {len(bb)} {hh.get('Last-Modified')}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
