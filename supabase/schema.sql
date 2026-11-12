-- Chamboule only. This schema is not exposed by the Supabase Data API.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists chamboule_push;
revoke all on schema chamboule_push from public, anon, authenticated, service_role;

create table if not exists chamboule_push.settings (
  id boolean primary key default true check (id),
  token_hash text,
  pairing_hash text,
  pairing_expires_at timestamptz,
  subscription jsonb,
  zone text,
  morning time,
  evening time,
  revision integer not null default 0,
  test_after timestamptz,
  vapid_secret uuid references vault.secrets(id),
  cron_secret uuid not null references vault.secrets(id),
  function_url text
);

create table if not exists chamboule_push.deliveries (
  token_hash text not null,
  slot text not null check (slot in ('morning', 'evening')),
  local_date date not null,
  revision integer not null,
  attempts integer not null check (attempts between 1 and 3),
  retry_after timestamptz not null,
  sent_at timestamptz,
  primary key (token_hash, slot, local_date)
);

alter table chamboule_push.settings enable row level security;
alter table chamboule_push.deliveries enable row level security;

do $$
begin
  if not exists (select 1 from chamboule_push.settings where id) then
    insert into chamboule_push.settings (cron_secret)
      values (vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'chamboule_push_cron_v1'));
  end if;
end
$$;

-- Check today and yesterday because a short retry window can cross midnight.
-- Date + time AT TIME ZONE resolves France's daylight saving time on the server.
create or replace function chamboule_push.due_slots(at_time timestamptz)
returns table (slot text, local_date date)
language sql stable set search_path = pg_catalog as $$
  select times.slot, dates.local_date
  from chamboule_push.settings as s
  cross join lateral (values ('morning', s.morning), ('evening', s.evening)) as times(slot, at_local)
  cross join lateral (values ((at_time at time zone s.zone)::date), ((at_time at time zone s.zone)::date - 1)) as dates(local_date)
  cross join lateral (select (dates.local_date + times.at_local) at time zone s.zone as at_utc) as deadline
  left join chamboule_push.deliveries as d
    on (d.token_hash, d.slot, d.local_date) = (s.token_hash, times.slot, dates.local_date)
  where s.id and s.subscription is not null and s.vapid_secret is not null
    and deadline.at_utc > at_time - interval '15 minutes' and deadline.at_utc <= at_time
    and d.sent_at is null and (d.revision is distinct from s.revision or (d.attempts < 3 and d.retry_after <= at_time))
$$;

create or replace function chamboule_push.trigger_due()
returns void
language plpgsql volatile set search_path = pg_catalog as $$
begin
  perform net.http_post(
    url := s.function_url,
    body := '{"action":"tick"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Chamboule-Cron',
      t.epoch || '.' || encode(extensions.hmac('chamboule-push-tick:' || t.epoch, secret.decrypted_secret, 'sha256'), 'hex')),
    timeout_milliseconds := 12000
  )
  from chamboule_push.settings as s
  join vault.decrypted_secrets as secret on secret.id = s.cron_secret
  cross join lateral (select floor(extract(epoch from statement_timestamp()))::bigint::text as epoch) as t
  where s.id and s.function_url is not null
    and exists (select 1 from chamboule_push.due_slots(statement_timestamp()));
end
$$;

revoke all on function chamboule_push.due_slots(timestamptz), chamboule_push.trigger_due() from public;
