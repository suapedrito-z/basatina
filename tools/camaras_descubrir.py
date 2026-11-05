import urllib.parse
import re, json, urllib.request
OUT = []
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 BasatiNA"}), timeout=60) as f: return f.read().decode("utf8", "ignore")
for u in ["https://doc.rainbow.ai/api-ref/scalar.html?spec=tiles", "https://doc.rainbow.ai/tile_colors/"]:
    try:
        t = get(u); OUT.append(f"== {u} {len(t)}")
        OUT += sorted(set(re.findall(r'["\']([^"\']+\.(?:json|ya?ml))["\']', t)))
        OUT.append(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t))[:3000])
        for s in sorted(set(re.findall(r'["\']([^"\']+\.(?:json|ya?ml))["\']', t))):
            su = s if s.startswith("http") else urllib.parse.urljoin(u, s)
            try: OUT.append(f"-- SPEC {su}"); OUT.append(get(su)[:12000])
            except Exception as e: OUT.append(f"fallo {su} {e}")
    except Exception as e: OUT.append(f"fallo {u} {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
