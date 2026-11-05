import re, urllib.request, urllib.parse
OUT = []
def get(u, t=90):
    r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", "Accept": "*/*"})
    with urllib.request.urlopen(r, timeout=t) as f: return f.status, f.headers.get("Content-Type", ""), f.read()
B = "https://administracionelectronica.navarra.es/IncCarreteras/"
for c in ["js/script.js", "layout/carreteras/config.json", "js/temporal.js"]:
    try: st, ct, b = get(B + c); OUT.append(f"\n===== {c} {st}"); OUT.append(b.decode("utf8", "ignore")[:12000])
    except Exception as e: OUT.append(f"fallo {c} {e}")
try:
    st, ct, b = get(B + "bundles/js?v=tMLrKv2WBNMT5rXQvCbt7g1lUqoRQitIdaOzvrLARRQ1"); j = b.decode("utf8", "ignore")
    OUT.append("\n===== bundle urls")
    for m in re.finditer(r".{0,250}url\s*[:=]\s*[\"'][^\"']+[\"'].{0,250}", j): OUT.append("  > " + m.group(0)[:520])
except Exception as e: OUT.append(f"fallo bundle {e}")
try:
    st, ct, b = get(B + "Default.aspx"); t = b.decode("utf8", "ignore")
    OUT.append("\n===== Default.aspx enlaces"); OUT += sorted(set(re.findall(r'href=["\']([^"\']+)', t)))
    OUT.append("\n===== Default.aspx texto"); OUT.append(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<script.*?</script>|<style.*?</style>", "", t)))[:6000])
except Exception as e: OUT.append(f"fallo default {e}")
open("tools/camaras_info.txt", "w").write("\n".join(OUT))
