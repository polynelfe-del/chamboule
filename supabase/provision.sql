-- Run after schema.sql and the Edge Function deployment in the existing project.
-- No credential appears here. trigger_due looks up its own scoped bearer in Vault.
update chamboule_push.settings
  set function_url = 'https://ivkbevrfmzdbvrsuwmtx.supabase.co/functions/v1/chamboule-push'
  where id;

select cron.schedule('chamboule-push-v1', '* * * * *', 'select chamboule_push.trigger_due()');

-- Run independently of delivery so history also expires with no subscribed phone.
select cron.schedule(
  'chamboule-push-prune-v1',
  '17 * * * *',
  'delete from chamboule_push.deliveries where coalesce(sent_at, retry_after) < now() - interval ''7 days'''
);
