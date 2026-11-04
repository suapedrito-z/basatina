package es.pedrito.controlarga;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Widget para la pantalla del móvil: caudal del Arga en Burlada, su color y el % de Eugui. */
public class RiverWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        RiverJob.schedule(c);
        RiverJob.runNow(c);
        updateAll(c);
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, RiverWidget.class));
        if (ids == null || ids.length == 0) return;
        SharedPreferences sp = c.getSharedPreferences("rio", Context.MODE_PRIVATE);
        float q = sp.getFloat("q", -1), pct = sp.getFloat("pct", -1);
        long t = sp.getLong("qT", 0);
        float ama = 150, roj = 300;
        try {
            org.json.JSONObject a = new org.json.JSONObject(sp.getString("alerts", "{}"));
            ama = (float) a.optDouble("qAma", 150); roj = (float) a.optDouble("qRoj", 300);
        } catch (Exception ignored) {}
        Locale es = Locale.forLanguageTag("es-ES");
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget);
        v.setTextViewText(R.id.wQ, q < 0 ? "—" : String.format(es, q < 10 ? "%.1f" : "%.0f", q));
        v.setTextViewText(R.id.wPct, pct < 0 ? "" : String.format(es, "Eugui %.0f %%", pct));
        v.setTextViewText(R.id.wT, t == 0 ? "sin datos aún" : "Burlada · " + new SimpleDateFormat("HH:mm", es).format(new Date(t)));
        v.setTextViewText(R.id.wDot, "●");
        v.setTextColor(R.id.wDot, q >= roj ? 0xFFFF3B30 : q >= ama ? 0xFFFFD84D : 0xFF3CCF7A);
        PendingIntent pi = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.wRoot, pi);
        for (int id : ids) m.updateAppWidget(id, v);
    }
}
