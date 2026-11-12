package com.polynelfe.chamboule;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String ASSET_PATH = "/chamboule/";
    private static final String HOME = "https://" + ASSET_HOST + ASSET_PATH;
    private static final String BRIDGE = "ChambouleAndroid";
    private static final String PREFS = "chamboule-activity";
    private static final String ASKED_NOTIFICATIONS = "asked-notifications";
    private static final String PENDING_SLOT = "pending-slot";
    private static final int NOTIFICATION_PERMISSION = 31;
    private static final int OPEN_DOCUMENT = 32;
    private static final int CREATE_DOCUMENT = 33;
    private static final int MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
    private static final String POLICY = "default-src 'none'; script-src 'unsafe-inline'; "
            + "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; "
            + "manifest-src 'self'; frame-src 'none'; frame-ancestors 'none'; worker-src 'none'; "
            + "base-uri 'none'; form-action 'none'; connect-src 'none'";

    private final ExecutorService documents = Executors.newSingleThreadExecutor();
    private WebView web;
    private boolean pageReady;
    private volatile boolean notificationPromptOpen;
    private String pendingSlot;
    private FileRequest pendingDocument;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        pendingSlot = state == null ? routineSlot(getIntent()) : state.getString(PENDING_SLOT);
        web = new WebView(this);
        configureWebView();
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            web.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                int keyboard = insets.getInsets(WindowInsets.Type.ime()).bottom;
                view.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, keyboard));
                return insets;
            });
        }
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        setContentView(web);
        web.loadUrl(HOME);
    }

    private void configureWebView() {
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.isForMainFrame() || !isDocument(request.getUrl());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return "GET".equals(request.getMethod()) ? localResponse(request.getUrl()) : denied();
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap icon) {
                pageReady = false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = isDocument(Uri.parse(url));
                if (pageReady) {
                    dispatchRoutine();
                    dispatch("chamboule-native-notifications", null);
                }
            }
        });
        web.addJavascriptInterface(new ChambouleBridge(), BRIDGE);
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && ASSET_HOST.equals(uri.getHost())
                && uri.getPort() == -1 && uri.getUserInfo() == null;
    }

    private static boolean isDocument(Uri uri) {
        String path = uri.getEncodedPath();
        return isLocal(uri) && (ASSET_PATH.equals(path) || (ASSET_PATH + "index.html").equals(path));
    }

    private WebResourceResponse localResponse(Uri uri) {
        if (!isLocal(uri)) return denied();
        String path = uri.getEncodedPath();
        if (path == null || !path.startsWith(ASSET_PATH)) return denied();
        String filename = path.substring(ASSET_PATH.length());
        if (filename.isEmpty()) filename = "index.html";
        String mime;
        String encoding = null;
        switch (filename) {
            case "index.html": mime = "text/html"; encoding = "UTF-8"; break;
            case "manifest.webmanifest": mime = "application/manifest+json"; encoding = "UTF-8"; break;
            case "apple-touch-icon.png":
            case "icon-192.png":
            case "icon-512.png":
            case "icon-512-maskable.png": mime = "image/png"; break;
            case "fonts/fredoka.woff2":
            case "fonts/nunito.woff2":
            case "fonts/nunito-italic.woff2":
            case "fonts/pacifico.woff2": mime = "font/woff2"; break;
            default: return denied();
        }
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Security-Policy", POLICY);
        headers.put("Referrer-Policy", "no-referrer");
        headers.put("X-Content-Type-Options", "nosniff");
        try {
            return new WebResourceResponse(mime, encoding, 200, "OK", headers, getAssets().open("www/" + filename));
        } catch (IOException ignored) {
            return textResponse(404, "Not Found", "Cette version de Chamboule est incomplète.");
        }
    }

    private static WebResourceResponse denied() {
        return textResponse(403, "Forbidden", "Chamboule fonctionne hors connexion.");
    }

    private static WebResourceResponse textResponse(int status, String reason, String text) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason, null,
                new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String slot = routineSlot(intent);
        if (slot != null) pendingSlot = slot;
        dispatchRoutine();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        state.putString(PENDING_SLOT, pendingSlot);
        super.onSaveInstanceState(state);
    }

    private static String routineSlot(Intent intent) {
        if (intent == null) return null;
        try {
            String slot = intent.getStringExtra(ReminderScheduler.EXTRA_ROUTINE_SLOT);
            return "morning".equals(slot) || "evening".equals(slot) || "test".equals(slot) ? slot : null;
        } catch (RuntimeException ignored) { return null; }
    }

    private void dispatchRoutine() {
        if (!pageReady || pendingSlot == null) return;
        JSONObject details = new JSONObject();
        put(details, "slot", pendingSlot);
        pendingSlot = null;
        dispatch("chamboule-native-routine", details);
    }

    private void dispatch(String event, JSONObject details) {
        if (!pageReady || web == null) return;
        String payload = details == null ? "null" : details.toString().replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent(" + JSONObject.quote(event)
                + ", {detail:" + payload + "}));", null);
    }

    private SharedPreferences preferences() { return getSharedPreferences(PREFS, MODE_PRIVATE); }

    private boolean notificationsAllowed() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager manager = getSystemService(NotificationManager.class);
        return manager != null && (Build.VERSION.SDK_INT < 24 || manager.areNotificationsEnabled());
    }

    private boolean exactAlarmsAllowed() {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager manager = getSystemService(AlarmManager.class);
        return manager != null && manager.canScheduleExactAlarms();
    }

    private String notificationPermission(boolean allowed) {
        if (allowed) return "granted";
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                && (notificationPromptOpen || !preferences().getBoolean(ASKED_NOTIFICATIONS, false))) return "default";
        return "denied";
    }

    private void askNotificationPermission() {
        if (notificationPromptOpen) return;
        if (notificationsAllowed()) { refreshReminderPermissions(true); return; }
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                && (!preferences().getBoolean(ASKED_NOTIFICATIONS, false)
                || shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS))) {
            preferences().edit().putBoolean(ASKED_NOTIFICATIONS, true).apply();
            notificationPromptOpen = true;
            try { requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION); }
            catch (RuntimeException ignored) {
                notificationPromptOpen = false;
                refreshReminderPermissions(true);
            }
            return;
        }
        refreshReminderPermissions(true);
    }

    private void showNotificationSettings() {
        Intent intent = Build.VERSION.SDK_INT >= 26
                ? new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName())
                : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()));
        openSettings(intent);
    }

    private void askExactAlarmPermission() {
        if (Build.VERSION.SDK_INT >= 31 && !exactAlarmsAllowed()) {
            openSettings(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName())));
        } else {
            refreshReminderPermissions(false);
        }
    }

    private void openSettings(Intent intent) {
        try {
            startActivity(intent);
        } catch (RuntimeException ignored) {
            dispatch("chamboule-native-notifications", null);
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == NOTIFICATION_PERMISSION) {
            notificationPromptOpen = false;
            if (results.length == 0) preferences().edit().remove(ASKED_NOTIFICATIONS).apply();
            refreshReminderPermissions(true);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshReminderPermissions(false);
    }

    private void refreshReminderPermissions(boolean finished) {
        if (notificationsAllowed()) {
            try { ReminderScheduler.reschedule(this); }
            catch (SecurityException ignored) { /* Android may revoke access while the app resumes. */ }
        }
        JSONObject details = null;
        if (finished) {
            details = new JSONObject();
            put(details, "permissionFinished", true);
        }
        dispatch("chamboule-native-notifications", details);
    }

    private interface ReminderAction { JSONObject run(); }

    private String reminderResponse(ReminderAction action) {
        try {
            JSONObject status = action.run();
            boolean active = status.optBoolean("enabled");
            String permission = notificationPermission("granted".equals(status.optString("permission")));
            boolean exact = exactAlarmsAllowed();
            put(status, "active", active);
            put(status, "paired", true);
            put(status, "receivable", active && "granted".equals(permission));
            put(status, "permission", permission);
            put(status, "exactAlarm", exact);
            put(status, "zone", TimeZone.getDefault().getID());
            if (status.has("testScheduled")) put(status, "sent", status.optBoolean("testScheduled"));
            return status.toString();
        } catch (IllegalArgumentException | IllegalStateException error) {
            return errorResponse(error.getMessage() == null ? "Android ne peut pas programmer ce rappel." : error.getMessage(), "native_schedule");
        } catch (SecurityException error) {
            return errorResponse("Autorise les notifications et les alarmes dans les réglages Android.", "permission_required");
        }
    }

    private static String errorResponse(String message, String code) {
        JSONObject result = new JSONObject();
        put(result, "error", message);
        put(result, "code", code);
        return result.toString();
    }

    private static void put(JSONObject object, String name, Object value) {
        try { object.put(name, value); }
        catch (JSONException error) { throw new IllegalArgumentException(error); }
    }

    public final class ChambouleBridge {
        @JavascriptInterface public String status() { return reminderResponse(() -> ReminderScheduler.status(MainActivity.this)); }
        @JavascriptInterface public void requestPermissions() { runOnUiThread(MainActivity.this::askNotificationPermission); }
        @JavascriptInterface public void requestExactAlarm() { runOnUiThread(MainActivity.this::askExactAlarmPermission); }
        @JavascriptInterface public void openNotificationSettings() { runOnUiThread(MainActivity.this::showNotificationSettings); }
        @JavascriptInterface public String save(String morning, String evening) {
            return reminderResponse(() -> ReminderScheduler.save(MainActivity.this, morning, evening));
        }
        @JavascriptInterface public String disable() { return reminderResponse(() -> ReminderScheduler.disable(MainActivity.this)); }
        @JavascriptInterface public String test() { return reminderResponse(() -> ReminderScheduler.test(MainActivity.this)); }
        @JavascriptInterface public void importFile(String id) {
            runOnUiThread(() -> chooseDocument(new FileRequest(id, null, null, null)));
        }
        @JavascriptInterface public void exportFile(String id, String filename, String contents, String mime) {
            runOnUiThread(() -> chooseDocument(new FileRequest(id, filename, contents, mime)));
        }
    }

    private static final class FileRequest {
        final String id;
        final String filename;
        final String contents;
        final String mime;

        FileRequest(String id, String filename, String contents, String mime) {
            this.id = id;
            this.filename = filename;
            this.contents = contents;
            this.mime = mime;
        }

        boolean exporting() { return filename != null; }
    }

    private void chooseDocument(FileRequest request) {
        if (request.id == null || !request.id.matches("[A-Za-z0-9_-]{1,80}")) return;
        if (pendingDocument != null) { documentResult(request, false, "busy", null); return; }
        Intent picker;
        if (request.exporting()) {
            if (!request.filename.matches("[A-Za-z0-9_.-]{1,100}") || request.contents == null
                    || request.contents.length() > MAX_DOCUMENT_BYTES || request.mime == null
                    || !request.mime.matches("application/json|text/plain|text/calendar")) {
                documentResult(request, false, "invalid_file", null);
                return;
            }
            picker = new Intent(Intent.ACTION_CREATE_DOCUMENT).setType(request.mime).putExtra(Intent.EXTRA_TITLE, request.filename);
        } else {
            picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*")
                    .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/json", "text/plain", "application/octet-stream"});
        }
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        pendingDocument = request;
        try {
            startActivityForResult(picker, request.exporting() ? CREATE_DOCUMENT : OPEN_DOCUMENT);
        } catch (RuntimeException ignored) {
            pendingDocument = null;
            documentResult(request, false, "unavailable", null);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        FileRequest request = pendingDocument;
        if (request == null || requestCode != (request.exporting() ? CREATE_DOCUMENT : OPEN_DOCUMENT)) return;
        pendingDocument = null;
        if (resultCode != RESULT_OK) { documentResult(request, false, "declined", null); return; }
        Uri uri = data == null ? null : data.getData();
        if (uri == null || !ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) {
            documentResult(request, false, "invalid_file", null);
            return;
        }
        documents.execute(() -> accessDocument(request, uri));
    }

    private void accessDocument(FileRequest request, Uri uri) {
        try {
            if (request.exporting()) {
                byte[] bytes = request.contents.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > MAX_DOCUMENT_BYTES) throw new IOException("file too large");
                try (OutputStream output = getContentResolver().openOutputStream(uri, "w")) {
                    if (output == null) throw new IOException("file unavailable");
                    output.write(bytes);
                }
                runOnUiThread(() -> documentResult(request, true, null, null));
            } else {
                String contents = readDocument(uri);
                runOnUiThread(() -> documentResult(request, true, null, contents));
            }
        } catch (IOException | SecurityException ignored) {
            runOnUiThread(() -> documentResult(request, false, "invalid_file", null));
        }
    }

    private String readDocument(Uri uri) throws IOException {
        try (InputStream input = getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IOException("file unavailable");
            byte[] buffer = new byte[8192];
            for (int read; (read = input.read(buffer)) != -1; ) {
                if (output.size() + read > MAX_DOCUMENT_BYTES) throw new IOException("file too large");
                output.write(buffer, 0, read);
            }
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private void documentResult(FileRequest request, boolean ok, String code, String text) {
        JSONObject details = new JSONObject();
        put(details, "id", request.id);
        put(details, "ok", ok);
        if (code != null) put(details, "code", code);
        if (text != null) put(details, "text", text);
        dispatch(request.exporting() ? "chamboule-native-export" : "chamboule-native-import", details);
    }

    @Override
    protected void onDestroy() {
        pageReady = false;
        documents.shutdownNow();
        if (web != null) {
            web.removeJavascriptInterface(BRIDGE);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
