package com.polynelfe.chamboule;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public final class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            ReminderScheduler.deliver(context, intent);
        } catch (RuntimeException error) {
            Log.e("ChambouleReminders", "Impossible de traiter le rappel Android.", error);
        }
    }

    static void show(Context context, ReminderScheduler.Slot slot) {
        if (!ReminderScheduler.canNotify(context)) return;
        NotificationManager manager = ReminderScheduler.notificationManager(context);
        if (manager == null) return;

        String message = switch (slot) {
            case MORNING -> "C’est l’heure de ta routine du matin.";
            case EVENING -> "C’est l’heure de ta routine du soir.";
            case TEST -> "Ta notification de test est bien arrivée.";
        };
        Notification notification = new Notification.Builder(context, ReminderScheduler.CHANNEL)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle("Chamboule")
                .setContentText(message)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(ReminderScheduler.openRoutine(context, slot))
                .setAutoCancel(true)
                .build();
        try {
            manager.notify(slot.id, notification);
        } catch (SecurityException ignored) {
            // The user may have switched notifications off before the alarm arrived.
        }
    }
}
