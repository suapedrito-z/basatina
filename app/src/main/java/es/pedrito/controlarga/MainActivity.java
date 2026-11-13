package es.pedrito.controlarga;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import android.net.Uri;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * La app es una "ventana" (WebView) que muestra el simulador, que va guardado dentro de la app.
 * Además le da a la página una herramienta que una web normal no tiene: pedir datos a otras webs
 * (Open-Meteo, SAIH Ebro) directamente desde el móvil, con la conexión de casa.
 */
public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> fileCb;   // para elegir fotos desde la página (editor de pueblos)
    private static final int PICK = 41;
    private static final int GEO = 42;
    private static final int CAM = 43;
    private static final int INST = 44;   // permiso «instalar apps desconocidas» para actualizar la app
    private String apkPendiente;
    private Uri camUri; private File camFile; private boolean camMulti, pickImg = true;
    private android.webkit.GeolocationPermissions.Callback geoCb;   // «Qué hay cerca de mí»
    private String geoOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, ex) -> {
            java.io.StringWriter sw = new java.io.StringWriter(); ex.printStackTrace(new java.io.PrintWriter(sw));
            getSharedPreferences("rio", MODE_PRIVATE).edit().putString("crash", sw.toString()).commit();
            if (prev != null) prev.uncaughtException(t, ex);
        });
        web = new WebView(this);
        // Android 15/16 dibujan la app debajo de la barra de estado y de la de botones (edge-to-edge):
        // la WebView va dentro de un marco que deja libre ese hueco (y el del teclado).
        final android.widget.FrameLayout marco = new android.widget.FrameLayout(this);
        marco.setBackgroundColor(0xFFFFFFFF);
        marco.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        setContentView(marco);
        marco.setOnApplyWindowInsetsListener((v, ins) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets b = ins.getInsets(android.view.WindowInsets.Type.systemBars()
                        | android.view.WindowInsets.Type.displayCutout() | android.view.WindowInsets.Type.ime());
                v.setPadding(b.left, b.top, b.right, b.bottom);
            } else {
                v.setPadding(ins.getSystemWindowInsetLeft(), ins.getSystemWindowInsetTop(), ins.getSystemWindowInsetRight(), ins.getSystemWindowInsetBottom());
            }
            return ins;
        });
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            // iconos oscuros en las barras, que ahora tienen fondo claro
            int claro = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            getWindow().getInsetsController().setSystemBarsAppearance(claro, claro);
        }
        // botón/gesto «atrás»: desde Android 13 (y obligatorio en 16) se avisa así
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    () -> { if (web.canGoBack()) web.goBack(); else moveTaskToBack(true); });
        }

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          // el simulador está hecho en JavaScript
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);            // leer los archivos guardados en la app
        s.setAllowFileAccessFromFileURLs(true);// necesario para leer los mapas de inundación
        s.setGeolocationEnabled(true);         // «Qué hay cerca de mí»
        // Seguridad: dentro de la app solo se abren las pantallas propias (file://). Cualquier enlace a otra web,
        // teléfono o correo se abre fuera (navegador, marcador...), para que ninguna web ajena use el puente AndroidNet.
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest r) {
                return abrirFuera(r.getUrl().toString());
            }
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) { return abrirFuera(url); }
        });
        // Permite que la página abra la galería o la cámara para elegir fotos (<input type="file">)
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                camMulti = p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE;
                // fotos (lo normal) o cualquier archivo (p. ej. la copia de datos .json)
                String[] at = p.getAcceptTypes();
                pickImg = at == null || at.length == 0 || at[0] == null || at[0].isEmpty() || at[0].startsWith("image");
                if (!pickImg) { openPicker(); return true; }
                // primero pedimos permiso de cámara (solo la primera vez); luego se abre el selector
                if (checkSelfPermission(android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{android.Manifest.permission.CAMERA}, CAM);
                    return true;
                }
                openPicker();
                return true;
            }
            // la página pide la ubicación: si Android ya dio permiso, se contesta que sí; si no, se pregunta al usuario
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback cb) {
                if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
                        || checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    cb.invoke(origin, true, false); return;
                }
                geoOrigin = origin; geoCb = cb;
                requestPermissions(new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION}, GEO);
            }
        });
        web.addJavascriptInterface(new Net(), "AndroidNet");
        // tamaño de letra elegido en Ajustes
        s.setTextZoom(getSharedPreferences("rio", MODE_PRIVATE).getInt("zoom", 100));
        web.loadUrl(startUrl());
        // comprobación del río en segundo plano (widget y avisos)
        RiverJob.schedule(this);
    }

    /** true si el enlace no es una pantalla propia: se abre con otra app (y nunca dentro de BasatiNA) */
    private boolean abrirFuera(String url) {
        if (url == null || url.startsWith("file://") || url.startsWith("about:") || url.startsWith("javascript:")) return false;
        if (url.matches("(?i)^(https?|mailto|tel|geo):.*")) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) {}
        }
        return true;   // cualquier otro tipo de enlace se bloquea
    }

    /** Dirección desde la que se descargan las actualizaciones de la pantalla (repositorio público) */
    static final String BASE = "https://raw.githubusercontent.com/suapedrito-z/basatina/main/web/";

    static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    private int versionOf(InputStream in) {
        try { return new JSONObject(readAll(in)).optInt("version", 0); } catch (Exception e) { return 0; }
    }

    /** Usa la pantalla descargada si es más nueva que la que venía dentro del APK */
    private String startUrl() {
        int bundled = 0, downloaded = 0;
        try { bundled = versionOf(getAssets().open("version.json")); } catch (Exception ignored) {}
        File m = new File(getFilesDir(), "web/version.json");
        if (m.exists()) try { downloaded = versionOf(new FileInputStream(m)); } catch (Exception ignored) {}
        if (downloaded > bundled) return "file://" + new File(getFilesDir(), "web/index.html").getAbsolutePath();
        return "file:///android_asset/index.html";
    }

    /** true si la app se instaló desde Google Play (entonces las versiones nuevas llegan por Play, no por el APK) */
    private boolean fromPlay() {
        try {
            String i = android.os.Build.VERSION.SDK_INT >= 30
                    ? getPackageManager().getInstallSourceInfo(getPackageName()).getInstallingPackageName()
                    : getPackageManager().getInstallerPackageName(getPackageName());
            return "com.android.vending".equals(i);
        } catch (Exception e) { return false; }
    }

    private int apkVersion() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
    }

    private void callback(String id, int code, String body) {
        final String js = "window.__netCb(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(body) + ")";
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    // Selector de fotos: galería + «Hacer foto» con la cámara (si hay permiso)
    private void openPicker() {
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType(pickImg ? "image/*" : "*/*");
        pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, camMulti);
        Intent chooser = Intent.createChooser(pick, pickImg ? "Hacer o elegir foto" : "Elegir archivo");
        camUri = null; camFile = null;
        if (pickImg && checkSelfPermission(android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            try {
                File dir = new File(getCacheDir(), "fotos"); dir.mkdirs();
                for (File f : dir.listFiles()) if (System.currentTimeMillis() - f.lastModified() > 86400000L) f.delete();
                camFile = new File(dir, "foto_" + System.currentTimeMillis() + ".jpg");
                camUri = Uri.parse("content://" + getPackageName() + ".fotos/" + camFile.getName());
                Intent cam = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
                cam.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, camUri);
                cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                cam.setClipData(android.content.ClipData.newRawUri("foto", camUri));
                if (cam.resolveActivity(getPackageManager()) != null)
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                else { camUri = null; camFile = null; }
            } catch (Exception e) { camUri = null; camFile = null; }
        }
        try { startActivityForResult(chooser, PICK); } catch (Exception e) { if (fileCb != null) fileCb.onReceiveValue(null); fileCb = null; }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == CAM) { if (fileCb != null) openPicker(); return; }
        if (req == GEO && geoCb != null) {
            boolean ok = false;
            for (int r : res) ok |= r == android.content.pm.PackageManager.PERMISSION_GRANTED;
            geoCb.invoke(geoOrigin, ok, false); geoCb = null;
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == INST) {   // vuelve de la pantalla del permiso
            String u = apkPendiente; apkPendiente = null;
            if (u != null && puedeInstalar()) descargarEInstalar(u);
            else apkAviso("fin", "Sin ese permiso no se puede instalar. Puedes volver a intentarlo cuando quieras.");
            return;
        }
        if (req != PICK || fileCb == null) return;
        Uri[] out = null;
        boolean camOk = camFile != null && camFile.exists() && camFile.length() > 0;
        if (res == RESULT_OK && camOk && (data == null || (data.getData() == null && (data.getClipData() == null || camUri.equals(data.getClipData().getItemAt(0).getUri()))))) {
            out = new Uri[]{camUri};
        } else if (res == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount(); out = new Uri[n];
                for (int i = 0; i < n; i++) out[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) out = new Uri[]{data.getData()};
        }
        fileCb.onReceiveValue(out);
        fileCb = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    /* ===== Actualizar la app sin pasar por Chrome =====
       1) Android pide UNA vez el permiso «instalar apps desconocidas» para BasatiNA (abre él solo el interruptor).
       2) La app descarga BasatiNA.apk en su carpeta privada, enseñando el progreso.
       3) Comprueba que el archivo es de verdad BasatiNA y abre el instalador de Android: solo queda tocar «Instalar». */
    private boolean puedeInstalar() {
        return android.os.Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls();
    }

    private void apkAviso(String tipo, String txt) {
        final String js = "window.__apk&&window.__apk(" + JSONObject.quote(tipo) + "," + JSONObject.quote(txt) + ")";
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    private void descargarEInstalar(final String url) {
        new Thread(() -> {
            File dir = new File(getCacheDir(), "fotos"); dir.mkdirs();
            File apk = new File(dir, "BasatiNA.apk");
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true); c.setConnectTimeout(20000); c.setReadTimeout(30000);
                if (c.getResponseCode() != 200) throw new Exception("error " + c.getResponseCode());
                long total = c.getContentLengthLong(), hecho = 0; int ultimo = -1;
                try (InputStream in = c.getInputStream(); FileOutputStream o = new FileOutputStream(apk)) {
                    byte[] b = new byte[65536]; int n;
                    while ((n = in.read(b)) > 0) {
                        o.write(b, 0, n); hecho += n;
                        int pc = total > 0 ? (int) (hecho * 100 / total) : -1;
                        if (pc != ultimo && pc % 5 == 0) { ultimo = pc; apkAviso("prog", String.valueOf(pc)); }
                    }
                }
                // seguridad: solo se instala si el archivo es BasatiNA (el mismo nombre de paquete que esta app)
                android.content.pm.PackageInfo pi = getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), 0);
                if (pi == null || !getPackageName().equals(pi.packageName)) { apk.delete(); throw new Exception("el archivo no es BasatiNA"); }
                runOnUiThread(() -> {
                    try {
                        Uri u = Uri.parse("content://" + getPackageName() + ".fotos/BasatiNA.apk");
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setDataAndType(u, "application/vnd.android.package-archive");
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                        apkAviso("fin", "");
                    } catch (Exception e) { apkAviso("fin", "No se pudo abrir el instalador: " + e.getMessage()); }
                });
            } catch (Exception e) {
                apkAviso("fin", "No se pudo descargar (" + e.getMessage() + "). ¿Hay internet?");
            }
        }).start();
    }

    /** Lo que la página puede llamar como AndroidNet.get(url, id) y AndroidNet.share(texto). */
    public class Net {
        @JavascriptInterface
        public void get(final String url, final String id) {
            // Seguridad: solo direcciones de internet (nunca archivos del propio móvil)
            if (url == null || !url.matches("(?i)^https?://.*")) { callback(id, 0, "ERROR: solo http/https"); return; }
            // Las conexiones se hacen en segundo plano para no congelar la pantalla
            new Thread(() -> {
                int code = 0;
                String body;
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(20000);
                    c.setReadTimeout(30000);
                    c.setInstanceFollowRedirects(true);
                    c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) ControlRioArga/1.0");
                    c.setRequestProperty("Accept", "*/*");
                    code = c.getResponseCode();
                    InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    if (in != null) {
                        byte[] buf = new byte[16384];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        in.close();
                    }
                    body = new String(out.toByteArray(), StandardCharsets.UTF_8);
                } catch (Exception e) {
                    body = "ERROR: " + e;
                }
                // Devolvemos el resultado a la página
                final String js = "window.__netCb(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(body) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        /** Descarga solo los archivos de la pantalla que han cambiado y avisa a la página */
        @JavascriptInterface
        public void updateWeb(final String id) {
            new Thread(() -> {
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(BASE + "version.json?t=" + System.currentTimeMillis()).openConnection();
                    c.setConnectTimeout(20000); c.setReadTimeout(30000);
                    if (c.getResponseCode() != 200) { callback(id, c.getResponseCode(), "{\"ok\":false}"); return; }
                    JSONObject remote = new JSONObject(readAll(c.getInputStream()));
                    File dir = new File(getFilesDir(), "web"); dir.mkdirs();
                    File lm = new File(dir, "version.json");
                    JSONObject local = new JSONObject(), bundled = new JSONObject();
                    if (lm.exists()) try { local = new JSONObject(readAll(new FileInputStream(lm))); } catch (Exception ignored) {}
                    try { bundled = new JSONObject(readAll(getAssets().open("version.json"))); } catch (Exception ignored) {}
                    JSONObject rf = remote.getJSONObject("files");
                    JSONObject lf = local.optJSONObject("files"), bf = bundled.optJSONObject("files");
                    int current = Math.max(local.optInt("version", 0), bundled.optInt("version", 0));
                    int changed = 0;
                    if (remote.optInt("version", 0) > current) {
                        java.util.Iterator<String> it = rf.keys();
                        while (it.hasNext()) {
                            String name = it.next(), sha = rf.getString(name);
                            // Seguridad: solo nombres de archivo simples (sin carpetas ni «..»)
                            if (!name.matches("[A-Za-z0-9._-]+") || name.contains("..")) continue;
                            File f = new File(dir, name);
                            if (lm.exists() && lf != null && sha.equals(lf.optString(name)) && f.exists()) continue;
                            InputStream in;
                            if (bf != null && sha.equals(bf.optString(name))) {
                                in = getAssets().open(name);          // igual que el que trae el APK: se copia
                            } else {
                                HttpURLConnection d = (HttpURLConnection) new URL(BASE + name + "?v=" + sha).openConnection();
                                d.setConnectTimeout(20000); d.setReadTimeout(60000);
                                in = d.getInputStream();               // ha cambiado: se descarga
                                changed++;
                            }
                            File tmp = new File(dir, name + ".part");
                            FileOutputStream o = new FileOutputStream(tmp);
                            byte[] buf = new byte[65536]; int n; while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
                            o.close(); in.close();
                            f.delete(); tmp.renameTo(f);
                        }
                        // la lista de versiones se guarda al final: si algo falla, se sigue usando la pantalla anterior
                        FileOutputStream o = new FileOutputStream(lm);
                        o.write(remote.toString().getBytes(StandardCharsets.UTF_8)); o.close();
                    }
                    JSONObject res = new JSONObject();
                    res.put("ok", true); res.put("changed", changed);
                    res.put("web", remote.optInt("version", 0));
                    res.put("apk", remote.optInt("apk", 0)); res.put("myApk", apkVersion());
                    res.put("apkUrl", remote.optString("apkUrl", ""));
                    res.put("play", fromPlay());
                    callback(id, 200, res.toString());
                } catch (Exception e) {
                    callback(id, 0, "{\"ok\":false,\"error\":" + JSONObject.quote(e.toString()) + "}");
                }
            }).start();
        }

        /** Tamaño de letra: 100 normal, 115 grande, 130 muy grande */
        /** Envía una foto (JPEG en base64) a un servicio como «multipart/form-data» (identificar plantas con Pl@ntNet) */
        @JavascriptInterface
        public void postImage(final String url, final String b64, final String field, final String extra, final String id) {
            if (url == null || !url.matches("(?i)^https://.*")) { callback(id, 0, ""); return; }
            new Thread(() -> {
                int code = 0; String body;
                try {
                    byte[] img = android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
                    String bd = "----BasatiNA" + System.currentTimeMillis();
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(20000); c.setReadTimeout(60000); c.setDoOutput(true); c.setRequestMethod("POST");
                    c.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + bd);
                    c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) BasatiNA/3.2");
                    java.io.OutputStream o = c.getOutputStream();
                    o.write(("--" + bd + "\r\nContent-Disposition: form-data; name=\"" + field + "\"; filename=\"foto.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n").getBytes("UTF-8"));
                    o.write(img); o.write("\r\n".getBytes("UTF-8"));
                    // campos de texto extra: «nombre=valor&nombre=valor»
                    if (extra != null && !extra.isEmpty()) for (String kv : extra.split("&")) {
                        int i = kv.indexOf('='); if (i < 0) continue;
                        o.write(("--" + bd + "\r\nContent-Disposition: form-data; name=\"" + kv.substring(0, i) + "\"\r\n\r\n" + kv.substring(i + 1) + "\r\n").getBytes("UTF-8"));
                    }
                    o.write(("--" + bd + "--\r\n").getBytes("UTF-8")); o.close();
                    code = c.getResponseCode();
                    InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
                    body = in == null ? "" : readAll(in);
                } catch (Exception e) { body = ""; }
                callback(id, code, body);
            }).start();
        }

        /** Abre otra app instalada (Merlin, Google Lens…); si no está, su página en Google Play */
        @JavascriptInterface
        public void openApp(final String pkg) {
            runOnUiThread(() -> {
                try {
                    Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
                    if (i == null) i = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://play.google.com/store/apps/details?id=" + pkg));
                    startActivity(i);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void setTextZoom(final int z) {
            getSharedPreferences("rio", MODE_PRIVATE).edit().putInt("zoom", z).apply();
            runOnUiThread(() -> web.getSettings().setTextZoom(z));
        }

        /** Guarda la configuración de avisos y, si se activan, pide permiso para notificar */
        @JavascriptInterface
        public void setAlerts(final String json) {
            getSharedPreferences("rio", MODE_PRIVATE).edit().putString("alerts", json).apply();
            try {
                if (new JSONObject(json).optBoolean("on") && android.os.Build.VERSION.SDK_INT >= 33
                        && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED)
                    runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7));
            } catch (Exception ignored) {}
            RiverWidget.updateAll(MainActivity.this);
        }

        @JavascriptInterface
        public void testAlert() {
            RiverJob.notify(MainActivity.this, "🔔 Prueba de aviso", "Así te llegarán los avisos del río Arga.", 9);
        }

        /** Versión de la pantalla que se está usando */
        @JavascriptInterface
        public int webVersion() {
            int bundled = 0, downloaded = 0;
            try { bundled = versionOf(getAssets().open("version.json")); } catch (Exception ignored) {}
            File m = new File(getFilesDir(), "web/version.json");
            if (m.exists()) try { downloaded = versionOf(new FileInputStream(m)); } catch (Exception ignored) {}
            return Math.max(bundled, downloaded);
        }

        /** Último fallo de la app (para la zona técnica) */
        @JavascriptInterface
        public String lastCrash() { return getSharedPreferences("rio", MODE_PRIVATE).getString("crash", ""); }

        @JavascriptInterface
        public void reload() { runOnUiThread(() -> web.loadUrl(startUrl())); }

        @JavascriptInterface
        public int appVersion() { return apkVersion(); }

        /** Descarga e instala la versión nueva de la app (solo desde las versiones publicadas en GitHub de BasatiNA). */
        @JavascriptInterface
        public void installApk(final String url) {
            if (url == null || !url.startsWith("https://github.com/suapedrito-z/basatina/")) return;
            runOnUiThread(() -> {
                if (puedeInstalar()) { descargarEInstalar(url); return; }
                apkPendiente = url;
                try {
                    startActivityForResult(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + getPackageName())), INST);
                } catch (Exception e) { apkPendiente = null; descargarEInstalar(url); }
            });
        }

        @JavascriptInterface
        public void openUrl(final String url) {
            // Seguridad: solo webs, correo, teléfono y mapas
            if (url == null || !url.matches("(?i)^(https?|mailto|tel|geo):.*")) return;
            runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) {} });
        }

        /** Guarda un archivo que hace la página (p. ej. un PDF) y abre «Compartir» para guardarlo en Drive, enviarlo por correo... */
        @JavascriptInterface
        public void shareFile(final String name, final String b64, final String mime) {
            runOnUiThread(() -> {
                try {
                    String n = name.replaceAll("[^A-Za-z0-9._-]", "_");
                    File dir = new File(getCacheDir(), "fotos");
                    dir.mkdirs();
                    try (FileOutputStream o = new FileOutputStream(new File(dir, n))) {
                        o.write(android.util.Base64.decode(b64, android.util.Base64.DEFAULT));
                    }
                    Uri u = Uri.parse("content://" + getPackageName() + ".fotos/" + n);
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType(mime);
                    i.putExtra(Intent.EXTRA_STREAM, u);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(i, "Guardar o enviar"));
                } catch (Exception e) {
                    android.widget.Toast.makeText(MainActivity.this, "No se pudo crear el archivo", android.widget.Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            // Abre el menú de "Compartir" de Android (WhatsApp, Claude, correo...)
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Compartir"));
            });
        }
    }
}
