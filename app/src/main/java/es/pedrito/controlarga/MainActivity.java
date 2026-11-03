package es.pedrito.controlarga;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          // el simulador está hecho en JavaScript
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);            // leer los archivos guardados en la app
        s.setAllowFileAccessFromFileURLs(true);// necesario para leer los mapas de inundación
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Net(), "AndroidNet");
        web.loadUrl("file:///android_asset/index.html");
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
