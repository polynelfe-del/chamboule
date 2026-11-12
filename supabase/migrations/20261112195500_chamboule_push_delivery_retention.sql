-- Existing Chamboule deployment. This job only removes expired delivery rows.
-- It runs even when the phone is disabled, unpaired, or no reminder is due.
select cron.schedule(
  'chamboule-push-prune-v1',
  '17 * * * *',
  'delete from chamboule_push.deliveries where coalesce(sent_at, retry_after) < now() - interval ''7 days'''
);
