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
