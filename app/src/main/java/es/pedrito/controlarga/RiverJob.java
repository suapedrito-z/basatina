package es.pedrito.controlarga;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Trabajo en segundo plano: cada 15 minutos (aunque la app esté cerrada) Android lo despierta,
 * lee del SAIH el caudal del Arga en Burlada y el embalse de Eugui, actualiza el widget
 * y, si los avisos están activados, manda una notificación cuando el río pasa de los umbrales.
 */
public class RiverJob extends JobService {
    static final int JOB_ID = 2611, JOB_NOW = 2612;
    static final String SAIH = "https://www.saihebro.com/api/ficha/procesarTablaValoresActuales?estacion=";
    static final String CHANNEL = "avisos_rio";

    /** Programa la comprobación periódica (Android no deja menos de 15 minutos) */
    static void schedule(Context c) {
        try { schedule0(c); } catch (Exception ignored) {}   // si falla, la app sigue funcionando
    }
    static void schedule0(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js.getPendingJob(JOB_ID) != null) return;
        js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, RiverJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPeriodic(15 * 60 * 1000L)
                .setPersisted(true)          // sigue funcionando después de reiniciar el móvil
                .build());
    }

    /** Una comprobación ahora mismo (al poner el widget o abrir la app) */
    static void runNow(Context c) {
        try { runNow0(c); } catch (Exception ignored) {}
    }
    static void runNow0(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        js.schedule(new JobInfo.Builder(JOB_NOW, new ComponentName(c, RiverJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setOverrideDeadline(5000)
                .build());
    }

    @Override
    public boolean onStartJob(final JobParameters p) {
        new Thread(() -> {
            try { check(this); } catch (Exception ignored) {}
            try { checkRoads(this); } catch (Exception ignored) {}
            try { checkSnow(this); } catch (Exception ignored) {}
            try { checkFinde(this); } catch (Exception ignored) {}
            try { checkDato(this); } catch (Exception ignored) {}
            jobFinished(p, false);
        }).start();
        return true;   // el trabajo sigue en otro hilo
    }

    @Override
    public boolean onStopJob(JobParameters p) { return true; }

    static String get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(20000); c.setReadTimeout(30000);
        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) ControlRioArga/2.0");
        InputStream in = c.getInputStream();
        return MainActivity.readAll(in);
    }

    /** Busca en la tabla de la ficha la fila cuyo nombre contiene "clave" y devuelve su valor */
    static double value(String html, String clave) {
        for (String row : html.split("<tr>")) {
            Matcher n = Pattern.compile("aria-label='Señal ([^']*)'").matcher(row);
            Matcher v = Pattern.compile("aria-label='Valor (-?[\\d.,]+)").matcher(row);
            if (n.find() && v.find() && n.group(1).toUpperCase().contains(clave))
                return Double.parseDouble(v.group(1).replace(".", "").replace(",", "."));
        }
        return Double.NaN;
    }

    static void check(Context c) throws Exception {
        SharedPreferences sp = c.getSharedPreferences("rio", MODE_PRIVATE);
        String burlada = new JSONObject(get(SAIH + "A313")).optString("VALORES_ACTUALES");
        double q = value(burlada, "CAUDAL");
        double pct = Double.NaN;
        try { pct = value(new JSONObject(get(SAIH + "E025")).optString("VALORES_ACTUALES"), "% VOLUMEN"); } catch (Exception ignored) {}
        if (Double.isNaN(q)) return;
        long now = System.currentTimeMillis();

        // ¿cuánto ha subido en la última hora? guardamos una referencia cada hora
        long refT = sp.getLong("refT", 0);
        double refQ = sp.getFloat("refQ", (float) q);
        double subida = q - refQ;
        SharedPreferences.Editor e = sp.edit();
        if (now - refT > 60 * 60 * 1000L) { e.putLong("refT", now); e.putFloat("refQ", (float) q); }
        e.putFloat("q", (float) q).putLong("qT", now);
        if (!Double.isNaN(pct)) e.putFloat("pct", (float) pct);
        e.apply();
        RiverWidget.updateAll(c);

        // avisos
        JSONObject cfg;
        try { cfg = new JSONObject(sp.getString("alerts", "{}")); } catch (Exception ex) { cfg = new JSONObject(); }
        if (!cfg.optBoolean("on", false)) return;
        double qAma = cfg.optDouble("qAma", 150), qRoj = cfg.optDouble("qRoj", 300), qSub = cfg.optDouble("subida", 30);
        int level = q >= qRoj ? 2 : q >= qAma ? 1 : 0;
        int last = sp.getInt("lastLevel", 0);
        String fq = String.format(java.util.Locale.forLanguageTag("es-ES"), "%.0f", q);
        if (level > last) {
            notify(c, level == 2 ? "🔴 Arga en Burlada: " + fq + " m³/s" : "🟡 Arga en Burlada: " + fq + " m³/s",
                    level == 2 ? "Ha pasado de " + (int) qRoj + " m³/s. Sigue los avisos oficiales (112, CHE)." : "Ha pasado de " + (int) qAma + " m³/s. Atento a la evolución.", 1);
        } else if (level < last) {
            notify(c, "🟢 El Arga baja: " + fq + " m³/s en Burlada", "Ha bajado del umbral de aviso.", 1);
        }
        sp.edit().putInt("lastLevel", level).apply();
        long lastRise = sp.getLong("lastRise", 0);
        if (subida >= qSub && now - lastRise > 3 * 60 * 60 * 1000L) {
            notify(c, "📈 El Arga sube rápido en Burlada", String.format(java.util.Locale.forLanguageTag("es-ES"), "+%.0f m³/s en la última hora (ahora %s m³/s).", subida, fq), 2);
            sp.edit().putLong("lastRise", now).apply();
        }
    }

    static JSONObject cfg(Context c) {
        try { return new JSONObject(c.getSharedPreferences("rio", MODE_PRIVATE).getString("alerts", "{}")); } catch (Exception ex) { return new JSONObject(); }
    }

    /** Avisa de las incidencias nuevas (cortes, obras, accidentes…) en las carreteras que ha elegido el usuario */
    static void checkRoads(Context c) throws Exception {
        JSONObject cfg = cfg(c);
        org.json.JSONArray roads = cfg.optJSONArray("roads");
        if (!cfg.optBoolean("on", false) || roads == null || roads.length() == 0) return;
        java.util.Set<String> mine = new java.util.HashSet<>();
        for (int i = 0; i < roads.length(); i++) mine.add(roads.optString(i).toUpperCase().replace(" ", ""));
        SharedPreferences sp = c.getSharedPreferences("rio", MODE_PRIVATE);
        boolean first = !sp.contains("incSeen");
        String seen = sp.getString("incSeen", ",");
        org.json.JSONArray L = new JSONObject(get("https://administracionelectronica.navarra.es/IncCarreteras/api/incidents")).getJSONArray("incidencia");
        StringBuilder now = new StringBuilder(",");
        int n = 0;
        for (int i = 0; i < L.length(); i++) {
            JSONObject x = L.getJSONObject(i);
            if (!x.optBoolean("publicable", true)) continue;
            String road = x.optString("cod_carretera_actual").toUpperCase().replace(" ", "");
            if (!mine.contains(road)) continue;
            String id = x.optString("id_incidencia");
            now.append(id).append(",");
            if (first || seen.contains("," + id + ",")) continue;
            String tit = x.optString("titulo").trim(), des = x.optString("descripcion").trim();
            if (tit.isEmpty()) tit = x.optString("tipo");
            notify(c, "🚧 " + road + ": " + tit, des.isEmpty() ? x.optString("afeccion") : des, 300 + (n++ % 20));
        }
        sp.edit().putString("incSeen", now.toString()).apply();
    }

    /** La víspera (desde las 17:00) avisa si mañana se espera nieve en los puertos elegidos */
    static void checkSnow(Context c) throws Exception {
        JSONObject cfg = cfg(c);
        org.json.JSONArray P = cfg.optJSONArray("snow");
        if (!cfg.optBoolean("on", false) || P == null || P.length() == 0) return;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (cal.get(java.util.Calendar.HOUR_OF_DAY) < 17) return;
        String today = String.format(java.util.Locale.US, "%tF", cal);
        SharedPreferences sp = c.getSharedPreferences("rio", MODE_PRIVATE);
        if (today.equals(sp.getString("snowDay", ""))) return;
        StringBuilder la = new StringBuilder(), lo = new StringBuilder();
        for (int i = 0; i < P.length(); i++) { org.json.JSONArray q = P.getJSONArray(i); if (i > 0) { la.append(','); lo.append(','); } la.append(q.optDouble(1)); lo.append(q.optDouble(2)); }
        String body = get("https://api.open-meteo.com/v1/forecast?latitude=" + la + "&longitude=" + lo + "&daily=snowfall_sum&forecast_days=2&timezone=Europe%2FMadrid");
        org.json.JSONArray arr = body.trim().startsWith("[") ? new org.json.JSONArray(body) : new org.json.JSONArray().put(new JSONObject(body));
        StringBuilder txt = new StringBuilder();
        for (int i = 0; i < arr.length() && i < P.length(); i++) {
            double cm = arr.getJSONObject(i).getJSONObject("daily").getJSONArray("snowfall_sum").optDouble(1, 0);
            if (cm >= 1) txt.append(txt.length() > 0 ? " · " : "").append(P.getJSONArray(i).optString(0)).append(String.format(java.util.Locale.forLanguageTag("es-ES"), " %.0f cm", cm));
        }
        sp.edit().putString("snowDay", today).apply();
        if (txt.length() > 0) notify(c, "❄️ Mañana se espera nieve en los puertos", txt + ". Antes de salir, mira el estado de las carreteras (848 423 500).", 400);
    }

    /** Los jueves desde las 18:00: ¿viene buen fin de semana para el monte en el pueblo elegido? */
    static void checkFinde(Context c) throws Exception {
        JSONObject cfg = cfg(c);
        org.json.JSONArray f = cfg.optJSONArray("finde");
        if (!cfg.optBoolean("on", false) || f == null || f.length() < 3) return;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (cal.get(java.util.Calendar.DAY_OF_WEEK) != java.util.Calendar.THURSDAY || cal.get(java.util.Calendar.HOUR_OF_DAY) < 18) return;
        String today = String.format(java.util.Locale.US, "%tF", cal);
        SharedPreferences sp = c.getSharedPreferences("rio", MODE_PRIVATE);
        if (today.equals(sp.getString("findeDay", ""))) return;
        JSONObject d = new JSONObject(get("https://api.open-meteo.com/v1/forecast?latitude=" + f.optDouble(1) + "&longitude=" + f.optDouble(2)
                + "&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_gusts_10m_max&forecast_days=4&timezone=Europe%2FMadrid")).getJSONObject("daily");
        sp.edit().putString("findeDay", today).apply();
        // índices 2 y 3 = sábado y domingo (hoy es jueves)
        boolean bueno = true; StringBuilder t = new StringBuilder();
        String[] dias = {"Sábado", "Domingo"};
        for (int k = 0; k < 2; k++) {
            int i = k + 2;
            double ll = d.getJSONArray("precipitation_sum").optDouble(i, 0), pr = d.getJSONArray("precipitation_probability_max").optDouble(i, 0);
            double tx = d.getJSONArray("temperature_2m_max").optDouble(i, 15), tn = d.getJSONArray("temperature_2m_min").optDouble(i, 5), ra = d.getJSONArray("wind_gusts_10m_max").optDouble(i, 0);
            if (ll >= 1 || pr >= 40 || tx > 32 || tx < 4 || ra > 60) bueno = false;
            t.append(k > 0 ? " · " : "").append(dias[k]).append(String.format(java.util.Locale.forLanguageTag("es-ES"), " %.0f°/%.0f°%s", tx, tn, ll >= 0.5 ? String.format(java.util.Locale.forLanguageTag("es-ES"), ", %.0f mm", ll) : ""));
        }
        if (bueno) notify(c, "🥾 Buen finde para el monte en " + f.optString(0), t + ". ¡A disfrutarlo!", 410);
    }

    /* ---------- 📜 Dato del día ----------
       Cada mañana (a la hora elegida en Ajustes) manda un dato histórico o curioso de Navarra.
       Lee efemerides/navarra.json de GitHub (si no hay internet, usa la última copia guardada).
       Misma lógica que web/efemerides.js: dato del día (MM-DD) o, si no hay, una curiosidad. */
    static final String DATO_URL = "https://raw.githubusercontent.com/suapedrito-z/basatina/main/efemerides/navarra.json";
    static final String CH_DATO = "dato_dia";
    // OJO: la misma lista que EF_NO en web/efemerides.js. MAYÚSCULAS = siglas.
    static final String[] NO_DATO = {"elecci", "electoral", "partido politico", "parlament", "gobierno", "diputacion", "congreso de los diputados", "senado", "ministr", "alcald", "concejal",
            "presidente del", "presidenta del", "votacion", "referendum", "guerra", "batalla", "atentad", "terroris", "franquis", "dictadura", "golpe de estado", "fusilad",
            "carlis", "requete", "republica", "independentis", "nacionalis", "huelga", "manifestacion", "ETA", "UPN", "PSN", "PSOE", "PNV", "EH Bildu", "Bildu", "Geroa", "Podemos", "Vox", "PP"};

    static String nrm(String s) {
        return java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(java.util.Locale.ROOT);
    }

    static boolean datoMalo(JSONObject x, org.json.JSONArray extra) {
        String txt = x.optString("t") + " " + x.optString("txt"), n = nrm(txt);
        java.util.List<String> L = new java.util.ArrayList<>(java.util.Arrays.asList(NO_DATO));
        if (extra != null) for (int i = 0; i < extra.length(); i++) L.add(extra.optString(i));
        for (String w : L) {
            if (w == null || w.isEmpty()) continue;
            boolean siglas = w.equals(w.toUpperCase(java.util.Locale.ROOT)) && w.matches(".*[A-Z].*");
            if (siglas) { if (Pattern.compile("(^|[^A-Za-z])" + Pattern.quote(w) + "([^A-Za-z]|$)").matcher(txt).find()) return true; }
            else if (Pattern.compile("(^|[^a-z])" + Pattern.quote(nrm(w))).matcher(n).find()) return true;
        }
        return false;
    }

    static void checkDato(Context c) throws Exception {
        JSONObject cfg = cfg(c);
        if (!cfg.optBoolean("dato", false)) return;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (cal.get(java.util.Calendar.HOUR_OF_DAY) < cfg.optInt("datoH", 9)) return;
        String today = String.format(java.util.Locale.US, "%tF", cal);
        SharedPreferences sp = c.getSharedPreferences("rio", MODE_PRIVATE);
        if (today.equals(sp.getString("datoDay", ""))) return;
        String body;
        try {
            body = get(DATO_URL + "?t=" + (System.currentTimeMillis() / 3600000L));
            new JSONObject(body);                       // comprobamos que es un JSON válido antes de guardarlo
            sp.edit().putString("datoJson", body).apply();
        } catch (Exception ex) {
            body = sp.getString("datoJson", "");
            if (body.isEmpty()) return;                  // sin internet y sin copia: ya lo intentará en 15 minutos
        }
        JSONObject D = new JSONObject(body);
        org.json.JSONArray ex = D.optJSONArray("prohibidas");
        String k = String.format(java.util.Locale.US, "%02d-%02d", cal.get(java.util.Calendar.MONTH) + 1, cal.get(java.util.Calendar.DAY_OF_MONTH));
        java.util.List<JSONObject> L = new java.util.ArrayList<>();
        JSONObject dias = D.optJSONObject("dias");
        org.json.JSONArray hoy = dias == null ? null : dias.optJSONArray(k);
        if (hoy != null) for (int i = 0; i < hoy.length(); i++) { JSONObject x = hoy.optJSONObject(i); if (x != null && !x.optString("t").isEmpty() && !datoMalo(x, ex)) L.add(x); }
        String titulo; JSONObject x = null; String sem = null;
        // 1º «Personaje de la semana»: semanas = [{desde:"AAAA-MM-DD" (sábado), personaje, dias:[7 datos]}]
        org.json.JSONArray S = D.optJSONArray("semanas");
        java.util.Calendar hoy0 = java.util.Calendar.getInstance();
        hoy0.set(cal.get(java.util.Calendar.YEAR), cal.get(java.util.Calendar.MONTH), cal.get(java.util.Calendar.DAY_OF_MONTH), 12, 0, 0);
        if (S != null) for (int j = 0; j < S.length() && x == null; j++) {
            JSONObject s = S.optJSONObject(j); if (s == null) continue;
            Matcher m = Pattern.compile("^(\\d{4})-(\\d\\d)-(\\d\\d)$").matcher(s.optString("desde"));
            if (!m.find()) continue;
            java.util.Calendar ini = java.util.Calendar.getInstance();
            ini.set(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)) - 1, Integer.parseInt(m.group(3)), 12, 0, 0);
            long i = Math.round((hoy0.getTimeInMillis() - ini.getTimeInMillis()) / 86400000.0);
            if (i < 0 || i > 6) continue;
            org.json.JSONArray sd = s.optJSONArray("dias");
            JSONObject y = sd == null ? null : sd.optJSONObject((int) i);
            String per = s.optString("personaje");
            if (y != null && !y.optString("t").isEmpty() && !datoMalo(y, ex) && !datoMalo(new JSONObject().put("t", per), ex)) { x = y; sem = per + " (" + (i + 1) + "/7)"; }
        }
        if (x != null) {
            titulo = "⭐ " + sem + ": " + x.optString("t");
        } else if (!L.isEmpty()) {
            x = L.get(cal.get(java.util.Calendar.YEAR) % L.size());
            titulo = "📜 Tal día como hoy" + (x.has("a") ? " (" + x.optInt("a") + ")" : "") + ": " + x.optString("t");
        } else {
            org.json.JSONArray cu = D.optJSONArray("curiosidades");
            if (cu != null) for (int i = 0; i < cu.length(); i++) { JSONObject y = cu.optJSONObject(i); if (y != null && !y.optString("t").isEmpty() && !datoMalo(y, ex)) L.add(y); }
            if (L.isEmpty()) return;
            x = L.get(cal.get(java.util.Calendar.DAY_OF_YEAR) % L.size());
            titulo = "💡 Dato curioso de Navarra: " + x.optString("t");
        }
        sp.edit().putString("datoDay", today).apply();
        notifyDato(c, titulo, x.optString("txt"));
    }

    /** Canal propio y más discreto que el de los avisos del río (no suena como una alarma) */
    static void notifyDato(Context c, String title, String text) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH_DATO) == null) {
            NotificationChannel ch = new NotificationChannel(CH_DATO, "Dato del día", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Un dato histórico o curioso de Navarra cada mañana");
            nm.createNotificationChannel(ch);
        }
        PendingIntent pi = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, CH_DATO) : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_river).setContentTitle(title).setContentText(text)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi).setAutoCancel(true);
        try { nm.notify(500, b.build()); } catch (SecurityException ignored) {}
    }

    static void notify(Context c, String title, String text, int id) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Avisos del río", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Avisos cuando el Arga pasa de los umbrales que elijas");
            nm.createNotificationChannel(ch);
        }
        PendingIntent pi = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, CHANNEL) : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_river).setContentTitle(title).setContentText(text)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi).setAutoCancel(true);
        try { nm.notify(id, b.build()); } catch (SecurityException ignored) {}
    }
}
