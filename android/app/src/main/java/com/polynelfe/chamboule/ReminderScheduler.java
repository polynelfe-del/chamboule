package com.polynelfe.chamboule;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.SystemClock;

import org.json.JSONException;
import org.json.JSONObject;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZonedDateTime;

public final class ReminderScheduler {
    public static final String EXTRA_ROUTINE_SLOT = "chamboule_routine_slot";
    static final String ACTION_ALARM = "com.polynelfe.chamboule.REMINDER_ALARM";
    private static final String ACTION_OPEN = "com.polynelfe.chamboule.OPEN_ROUTINE";
    private static final String EXTRA_TRIGGER = "alarm_trigger";
    private static final String PREFS = "chamboule_native_reminders_v1";
    private static final String ENABLED = "enabled";
    private static final String CONFIGURED = "configured";
    private static final int TEST_DELAY_SECONDS = 25;
    private static final long RESUME_GRACE_MS = 60 * 60 * 1000L;
    static final String CHANNEL = "chamboule_daily";

    enum Slot {
        MORNING("morning", 101, "06:30"),
        EVENING("evening", 102, "18:29"),
        TEST("test", 103, null);

        final String value;
        final int id;
        final String defaultTime;

        Slot(String value, int id, String defaultTime) {
            this.value = value;
            this.id = id;
            this.defaultTime = defaultTime;
        }

        static Slot parse(String value) {
            for (Slot slot : values()) if (slot.value.equals(value)) return slot;
            return null;
        }

        String alarmKey() { return value + "_trigger"; }
        String deliveredKey() { return value + "_delivered_date"; }
    }

    private ReminderScheduler() {}

    public static synchronized JSONObject status(Context context) {
        SharedPreferences settings = settings(context);
        JSONObject result = new JSONObject();
        put(result, "enabled", settings.getBoolean(ENABLED, false));
        put(result, "morning", time(settings, Slot.MORNING));
        put(result, "evening", time(settings, Slot.EVENING));
        put(result, "permission", canNotify(context) ? "granted" : "denied");
        put(result, "exact", canScheduleExact(context));
        return result;
    }

    public static synchronized JSONObject save(Context context, String morning, String evening) {
        String morningTime = checkedTime(morning);
        String eveningTime = checkedTime(evening);
        SharedPreferences settings = settings(context);
        commit(settings.edit().putBoolean(CONFIGURED, true)
                .putBoolean(ENABLED, morningTime != null || eveningTime != null)
                .putString(Slot.MORNING.value, morningTime).putString(Slot.EVENING.value, eveningTime));
        scheduleDays(context, false);
        return status(context);
    }

    public static synchronized JSONObject disable(Context context) {
        commit(settings(context).edit().putBoolean(ENABLED, false));
        scheduleDays(context, false);
        cancelAlarm(context, Slot.TEST);
        NotificationManager manager = notificationManager(context);
        if (manager != null) {
            for (Slot slot : Slot.values()) manager.cancel(slot.id);
        }
        return status(context);
    }

    public static synchronized JSONObject test(Context context) {
        if (!canNotify(context)) {
            throw new IllegalStateException("Autorise les notifications de Chamboule dans les paramètres Android.");
        }
        long trigger = SystemClock.elapsedRealtime() + TEST_DELAY_SECONDS * 1000L;
        scheduleAlarm(context, Slot.TEST, AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger);
        JSONObject result = status(context);
        put(result, "testScheduled", true);
        put(result, "testDelaySeconds", TEST_DELAY_SECONDS);
        return result;
    }

    public static synchronized void reschedule(Context context) {
        scheduleDays(context, true);
    }

    static synchronized void rescheduleAfterSystemChange(Context context) {
        scheduleDays(context, false);
    }

    static synchronized void deliver(Context context, Intent intent) {
        if (!ACTION_ALARM.equals(intent.getAction())) return;
        Slot slot = Slot.parse(intent.getStringExtra(EXTRA_ROUTINE_SLOT));
        if (slot == null) return;
        long trigger = intent.getLongExtra(EXTRA_TRIGGER, 0);
        SharedPreferences settings = settings(context);
        if (trigger <= 0 || settings.getLong(slot.alarmKey(), 0) != trigger) return;

        if (slot == Slot.TEST) {
            commit(settings.edit().remove(slot.alarmKey()));
            ReminderReceiver.show(context, slot);
            return;
        }
        if (!settings.getBoolean(ENABLED, false) || time(settings, slot) == null) return;
        ZonedDateTime now = ZonedDateTime.now();
        String today = now.toLocalDate().toString();
        String scheduledDay = Instant.ofEpochMilli(trigger).atZone(now.getZone()).toLocalDate().toString();
        boolean send = today.equals(scheduledDay) && !today.equals(settings.getString(slot.deliveredKey(), null));
        if (send) commit(settings.edit().putString(slot.deliveredKey(), today));
        try {
            if (send) ReminderReceiver.show(context, slot);
        } finally {
            scheduleDay(context, slot, now, false);
        }
    }

    static PendingIntent openRoutine(Context context, Slot slot) {
        Intent intent = new Intent(context, MainActivity.class).setAction(ACTION_OPEN)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra(EXTRA_ROUTINE_SLOT, slot.value);
        return PendingIntent.getActivity(context, slot.id, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static NotificationManager notificationManager(Context context) {
        return context.getSystemService(NotificationManager.class);
    }

    static boolean canNotify(Context context) {
        NotificationManager manager = notificationManager(context);
        if (manager == null) return false;
        ensureChannel(manager);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
        return manager.areNotificationsEnabled() && channel != null && channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
    }

    private static void ensureChannel(NotificationManager manager) {
        NotificationChannel channel = new NotificationChannel(CHANNEL, "Rappels Chamboule", NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Tes rappels du matin et du soir");
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    private static void scheduleDays(Context context, boolean preserveDueAlarm) {
        ZonedDateTime now = ZonedDateTime.now();
        scheduleDay(context, Slot.MORNING, now, preserveDueAlarm);
        scheduleDay(context, Slot.EVENING, now, preserveDueAlarm);
    }

    private static void scheduleDay(Context context, Slot slot, ZonedDateTime now, boolean preserveDueAlarm) {
        SharedPreferences settings = settings(context);
        String value = time(settings, slot);
        if (!settings.getBoolean(ENABLED, false) || value == null) {
            cancelAlarm(context, slot);
            return;
        }
        long nowMs = now.toInstant().toEpochMilli();
        String deliveredDay = settings.getString(slot.deliveredKey(), null);
        ZonedDateTime next = nextOccurrence(LocalTime.parse(value), now, deliveredDay);
        long previous = settings.getLong(slot.alarmKey(), 0);
        // Keep an alarm Android might deliver just after its target when the activity resumes.
        if (preserveDueAlarm && previous > 0 && nowMs >= previous && nowMs - previous < RESUME_GRACE_MS
                && !now.toLocalDate().toString().equals(deliveredDay)
                && now.toLocalDate().equals(Instant.ofEpochMilli(previous).atZone(now.getZone()).toLocalDate())
                && alarmIntent(context, slot, 0, PendingIntent.FLAG_NO_CREATE) != null) {
            return;
        }
        scheduleAlarm(context, slot, AlarmManager.RTC_WAKEUP, next.toInstant().toEpochMilli());
    }

    static ZonedDateTime nextOccurrence(LocalTime time, ZonedDateTime now, String deliveredDay) {
        ZonedDateTime candidate = now.toLocalDate().atTime(time).atZone(now.getZone());
        if (!candidate.isAfter(now) || now.toLocalDate().toString().equals(deliveredDay)) {
            return now.toLocalDate().plusDays(1).atTime(time).atZone(now.getZone());
        }
        return candidate;
    }

    private static void scheduleAlarm(Context context, Slot slot, int type, long trigger) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms == null) throw new IllegalStateException("Android ne peut pas programmer de rappel sur ce téléphone.");
        PendingIntent pending = alarmIntent(context, slot, trigger, PendingIntent.FLAG_CANCEL_CURRENT);
        commit(settings(context).edit().putLong(slot.alarmKey(), trigger));
        if (canScheduleExact(context)) {
            try {
                alarms.setExactAndAllowWhileIdle(type, trigger, pending);
                return;
            } catch (SecurityException ignored) {
                // Permission can be revoked while the app returns from system settings.
            }
        }
        alarms.setAndAllowWhileIdle(type, trigger, pending);
    }

    private static boolean canScheduleExact(Context context) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        return alarms != null && (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms());
    }

    private static PendingIntent alarmIntent(Context context, Slot slot, long trigger, int flags) {
        Intent intent = new Intent(context, ReminderReceiver.class).setAction(ACTION_ALARM)
                .putExtra(EXTRA_ROUTINE_SLOT, slot.value).putExtra(EXTRA_TRIGGER, trigger);
        return PendingIntent.getBroadcast(context, slot.id, intent, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void cancelAlarm(Context context, Slot slot) {
        PendingIntent pending = alarmIntent(context, slot, 0, PendingIntent.FLAG_NO_CREATE);
        if (pending != null) {
            AlarmManager alarms = context.getSystemService(AlarmManager.class);
            if (alarms != null) alarms.cancel(pending);
            pending.cancel();
        }
        SharedPreferences settings = settings(context);
        if (settings.contains(slot.alarmKey())) commit(settings.edit().remove(slot.alarmKey()));
    }

    private static SharedPreferences settings(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static String time(SharedPreferences settings, Slot slot) {
        return settings.getBoolean(CONFIGURED, false) ? settings.getString(slot.value, null) : slot.defaultTime;
    }

    private static String checkedTime(String value) {
        if (value == null || value.isEmpty()) return null;
        if (!value.matches("(?:[01][0-9]|2[0-3]):[0-5][0-9]")) {
            throw new IllegalArgumentException("Choisis une heure valide au format 06:30.");
        }
        return value;
    }

    private static void commit(SharedPreferences.Editor editor) {
        if (!editor.commit()) throw new IllegalStateException("Android n’a pas pu enregistrer les rappels.");
    }

    private static void put(JSONObject object, String name, Object value) {
        try {
            object.put(name, value == null ? JSONObject.NULL : value);
        } catch (JSONException error) {
            throw new IllegalStateException("Les réglages des rappels sont indisponibles.", error);
        }
    }
}
