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
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          // el simulador está hecho en JavaScript
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);            // leer los archivos guardados en la app
        s.setAllowFileAccessFromFileURLs(true);// necesario para leer los mapas de inundación
        web.setWebViewClient(new WebViewClient());
        // Permite que la página abra la galería o la cámara para elegir fotos (<input type="file">)
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("image/*");
                pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                Intent chooser = Intent.createChooser(pick, "Elegir foto");
                try { startActivityForResult(chooser, PICK); } catch (Exception e) { fileCb = null; return false; }
                return true;
            }
        });
        web.addJavascriptInterface(new Net(), "AndroidNet");
        // tamaño de letra elegido en Ajustes
        s.setTextZoom(getSharedPreferences("rio", MODE_PRIVATE).getInt("zoom", 100));
        web.loadUrl(startUrl());
        // comprobación del río en segundo plano (widget y avisos)
        RiverJob.schedule(this);
    }

    /** Dirección desde la que se descargan las actualizaciones de la pantalla (repositorio público) */
    static final String BASE = "https://raw.githubusercontent.com/suapedrito-z/control-rio-arga/main/web/";

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

    private int apkVersion() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
    }

    private void callback(String id, int code, String body) {
        final String js = "window.__netCb(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(body) + ")";
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != PICK || fileCb == null) return;
        Uri[] out = null;
        if (res == RESULT_OK && data != null) {
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

    /** Lo que la página puede llamar como AndroidNet.get(url, id) y AndroidNet.share(texto). */
    public class Net {
        @JavascriptInterface
        public void get(final String url, final String id) {
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
                    callback(id, 200, res.toString());
                } catch (Exception e) {
                    callback(id, 0, "{\"ok\":false,\"error\":" + JSONObject.quote(e.toString()) + "}");
                }
            }).start();
        }

        /** Tamaño de letra: 100 normal, 115 grande, 130 muy grande */
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

        @JavascriptInterface
        public void openUrl(final String url) {
            runOnUiThread(() -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
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
