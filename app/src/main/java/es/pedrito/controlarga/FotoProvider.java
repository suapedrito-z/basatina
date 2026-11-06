package es.pedrito.controlarga;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Pequeño «buzón» para la cámara: la app de cámara guarda aquí la foto que haces
 * (content://es.pedrito.controlarga.fotos/foto_xxx.jpg) y luego la página la lee.
 * Solo da acceso a la carpeta de fotos temporales de la app.
 */
public class FotoProvider extends ContentProvider {
    private File file(Uri u) throws FileNotFoundException {
        String n = u.getLastPathSegment();
        if (n == null || n.contains("/") || n.contains("..")) throw new FileNotFoundException();
        File dir = new File(getContext().getCacheDir(), "fotos");
        dir.mkdirs();
        return new File(dir, n);
    }
    @Override public boolean onCreate() { return true; }
    @Override public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
        return ParcelFileDescriptor.open(file(u), ParcelFileDescriptor.parseMode(mode.contains("w") ? "rw" : "r") | (mode.contains("w") ? ParcelFileDescriptor.MODE_CREATE : 0));
    }
    @Override public String getType(Uri u) { return "image/jpeg"; }
    @Override public Cursor query(Uri u, String[] p, String s, String[] a, String o) {
        try {
            File f = file(u);
            MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
            c.addRow(new Object[]{f.getName(), f.length()});
            return c;
        } catch (Exception e) { return null; }
    }
    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
