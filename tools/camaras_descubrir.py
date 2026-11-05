import urllib.request, re, urllib.parse
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile"}), timeout=60) as f: return f.headers.get("Content-Type",""), f.read()
B = "https://www.euskalmet.euskadi.eus/observacion/radar-kapildui-precipitaciones/"
ct, b = get(B); t = b.decode("utf8", "ignore"); OUT.append(f"{B} {len(t)}")
refs = sorted(set(re.findall(r'(?:src|href|data-[\w-]+)=["\']([^"\']+)["\']', t)))
for r in refs:
    if re.search(r"radar|kapildui|\.png|\.gif|\.jpg|\.json|\.js|api", r, re.I): OUT.append("  " + r)
for m in re.finditer(r".{0,200}(?:kapildui|radar).{0,300}", re.sub(r"\s+", " ", t), re.I):
    OUT.append("  > " + m.group(0)[:500])
    if len(OUT) > 400: break
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
