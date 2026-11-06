# Genera web/version.json: la lista de archivos de la pantalla con su "huella" (sha1).
# La app compara esta lista con la suya y descarga solo lo que ha cambiado.
import hashlib, json, os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
web = os.path.join(root, "web")
vf = os.path.join(web, "version.json")
old = json.load(open(vf)) if os.path.exists(vf) else {"version": 0, "files": {}}
files = {f: hashlib.sha1(open(os.path.join(web, f), "rb").read()).hexdigest()
         for f in sorted(os.listdir(web)) if f != "version.json" and not f.startswith(".")}
apk = int(re.search(r"versionCode (\d+)", open(os.path.join(root, "app", "build.gradle")).read()).group(1))
version = old["version"] + (1 if files != old.get("files") else 0)
out = {"version": version, "apk": apk, "files": files,
       "apkUrl": "https://github.com/suapedrito-z/basatina/releases/latest/download/BasatiNA.apk"}
json.dump(out, open(vf, "w"), indent=1)
print("pantalla v%d · app v%d · %d archivos" % (version, apk, len(files)))
