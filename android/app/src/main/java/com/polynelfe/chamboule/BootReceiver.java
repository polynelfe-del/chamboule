package com.polynelfe.chamboule;

import android.app.AlarmManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public final class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        switch (action) {
            case Intent.ACTION_BOOT_COMPLETED:
            case Intent.ACTION_MY_PACKAGE_REPLACED:
            case Intent.ACTION_TIME_CHANGED:
            case Intent.ACTION_TIMEZONE_CHANGED:
            case AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED:
                try {
                    ReminderScheduler.rescheduleAfterSystemChange(context);
                } catch (RuntimeException error) {
                    Log.e("ChambouleReminders", "Impossible de reprogrammer les rappels Android.", error);
                }
                break;
            default:
                break;
        }
    }
}
