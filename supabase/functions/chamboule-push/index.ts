import postgres from 'npm:postgres@3.4.7';
import webpush from 'npm:web-push@3.6.7';
import { HttpError, pairingValue, scheduleValues, sha256, subscriptionValue, tokenValue } from './model.mjs';

const APP_ORIGIN = 'https://polynelfe-del.github.io';
const db = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 2, prepare: false, idle_timeout: 10 });
const BODY_LIMIT = 8192;

type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
type VapidKeys = { publicKey: string; privateKey: string };
type Slot = 'morning' | 'evening' | 'test';
type Setting = {
  token_hash: string | null;
  pairing_hash: string | null;
  pairing_valid: boolean;
  subscription: Subscription | null;
  zone: string | null;
  morning: string | null;
  evening: string | null;
  revision: number;
  test_recent: boolean;
};
type Delivery = { token_hash: string; slot: 'morning' | 'evening'; local_date: string; revision: number; subscription: Subscription };

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: {
    'Access-Control-Allow-Origin': APP_ORIGIN,
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  } });
}

async function parseInput(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType) || !request.body) {
    throw new HttpError(400, 'invalid_request', 'La demande de notification est invalide.');
  }
  const reader = request.body.getReader();
  const bytes = new Uint8Array(BODY_LIMIT);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > BODY_LIMIT) {
        await reader.cancel();
        throw new HttpError(413, 'invalid_request', 'La demande de notification est trop longue.');
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes.subarray(0, length)));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'invalid_request', 'La demande de notification est invalide.');
  } finally {
    reader.releaseLock();
  }
}

function statusFor(setting?: Setting) {
  if (!setting) return { active: false, paired: false, morning: null, evening: null, zone: null };
  return {
    active: Boolean(setting.subscription), paired: true,
    morning: setting.morning?.slice(0, 5) ?? null,
    evening: setting.evening?.slice(0, 5) ?? null,
    zone: setting.zone,
  };
}

async function vaultVapidKeys(): Promise<VapidKeys | null> {
  const [row] = await db<{ keys: VapidKeys }[]>`
    select v.decrypted_secret::jsonb as keys
    from chamboule_push.settings s join vault.decrypted_secrets v on v.id = s.vapid_secret
    where s.id
  `;
  return row?.keys ?? null;
}

async function getPublicKey() {
  // Generate exactly one pair and retain it across deployments. Existing subscriptions
  // depend on the matching private key and must not be invalidated on every request.
  const [existing] = await db<{ public_key: string }[]>`
    select v.decrypted_secret::jsonb->>'publicKey' as public_key
    from chamboule_push.settings s join vault.decrypted_secrets v on v.id = s.vapid_secret
    where s.id
  `;
  if (existing) return existing.public_key;
  return await db.begin(async (sql) => {
    const [settings] = await sql<{ vapid_secret: string | null }[]>`
      select vapid_secret from chamboule_push.settings where id for update
    `;
    if (settings.vapid_secret) {
      const [row] = await sql<{ public_key: string }[]>`
        select decrypted_secret::jsonb->>'publicKey' as public_key
        from vault.decrypted_secrets where id = ${settings.vapid_secret}
      `;
      return row.public_key;
    }
    const keys = webpush.generateVAPIDKeys();
    await sql`
      update chamboule_push.settings
      set vapid_secret = vault.create_secret(${JSON.stringify(keys)}, 'chamboule_push_vapid_v1')
      where id
    `;
    return keys.publicKey;
  });
}

async function changeSettings(action: string, token: string, input: Record<string, unknown>) {
  const schedule = action === 'enable' || action === 'save' ? scheduleValues(input) : null;
  const subscription = action === 'enable' ? subscriptionValue(input.subscription) : null;
  const code = action === 'enable' ? pairingValue(input.code) : null;
  const pairingHash = code ? await sha256(code) : null;
  if (schedule) {
    const [zone] = await db`select 1 from pg_timezone_names where name = ${schedule.zone}`;
    if (!zone) throw new HttpError(400, 'invalid_zone', 'Le fuseau horaire de ton téléphone est introuvable.');
  }
  return await db.begin(async (sql) => {
    const [settings] = await sql<Setting[]>`
      select *, pairing_expires_at > now() as pairing_valid, test_after > now() as test_recent
      from chamboule_push.settings where id for update
    `;
    const known = settings.token_hash === token;
    if (action === 'status') return statusFor(known ? settings : undefined);
    if (!known && action !== 'enable') throw new HttpError(403, 'not_paired', 'Associe ce téléphone depuis la cloche de Chamboule.');
    if (action === 'enable') {
      if (!known && !pairingHash) throw new HttpError(403, 'pairing_required', 'Saisis ton code d’association Chamboule.');
      if (!known && (!settings.pairing_valid || settings.pairing_hash !== pairingHash)) {
        throw new HttpError(403, 'pairing_invalid', 'Ce code d’association est incorrect ou a déjà été utilisé.');
      }
      const [updated] = await sql<Setting[]>`
        update chamboule_push.settings set
          token_hash = ${token}, subscription = ${sql.json(subscription!)},
          pairing_hash = case when ${known} then pairing_hash else null end,
          pairing_expires_at = case when ${known} then pairing_expires_at else null end,
          zone = ${schedule!.zone}, morning = ${schedule!.morning}, evening = ${schedule!.evening},
          revision = revision + 1, test_after = null
        where id returning *
      `;
      return statusFor(updated);
    }
    if (action === 'save') {
      if (!settings.subscription) throw new HttpError(409, 'not_active', 'Active les notifications de Chamboule sur ce téléphone.');
      const [updated] = await sql<Setting[]>`
        update chamboule_push.settings set zone = ${schedule!.zone},
          morning = ${schedule!.morning}, evening = ${schedule!.evening}, revision = revision + 1
        where id returning *
      `;
      return statusFor(updated);
    }
    const [updated] = await sql<Setting[]>`
      update chamboule_push.settings set subscription = null, revision = revision + 1, test_after = null
      where id returning *
    `;
    return statusFor(updated);
  });
}

async function push(subscription: Subscription, slot: Slot, keys: VapidKeys, localDate?: string) {
  const details = webpush.generateRequestDetails(subscription, JSON.stringify({ slot }), {
    TTL: slot === 'test' ? 60 : 900,
    urgency: 'high',
    topic: localDate ? `chamboule-${slot}-${localDate.replaceAll('-', '')}` : 'chamboule-test',
    vapidDetails: { subject: `${APP_ORIGIN}/chamboule/`, ...keys },
  });
  // Using the runtime fetch avoids the Node HTTPS transport and never follows redirects.
  const headers = new Headers(details.headers);
  headers.delete('Content-Length');
  const response = await fetch(details.endpoint, {
    method: 'POST', headers, body: new Uint8Array(details.body),
    redirect: 'error', signal: AbortSignal.timeout(8000),
  });
  await response.body?.cancel();
  return response.status;
}

async function expire(token: string, revision: number) {
  await db`update chamboule_push.settings set subscription = null, revision = revision + 1
    where id and token_hash = ${token} and revision = ${revision}`;
}

async function testPush(token: string) {
  const setting = await db.begin(async (sql) => {
    const [current] = await sql<Setting[]>`
      select token_hash, subscription, revision, test_after > now() as test_recent
      from chamboule_push.settings where id for update
    `;
    if (current.token_hash !== token) throw new HttpError(403, 'not_paired', 'Associe ce téléphone depuis la cloche de Chamboule.');
    if (!current.subscription) throw new HttpError(409, 'not_active', 'Active les notifications de Chamboule sur ce téléphone.');
    if (current.test_recent) throw new HttpError(429, 'test_recent', 'Attends trente secondes avant de refaire un test.');
    await sql`update chamboule_push.settings set test_after = now() + interval '30 seconds' where id`;
    return current;
  });
  const keys = await vaultVapidKeys();
  if (!keys) throw new HttpError(503, 'service_unavailable', 'Le service de notifications est indisponible. Réessaie plus tard.');
  const response = await push(setting.subscription!, 'test', keys).catch(() => 0);
  if (response === 404 || response === 410) {
    await expire(token, setting.revision);
    throw new HttpError(410, 'subscription_expired', 'Le téléphone a perdu son abonnement. Réactive les notifications.');
  }
  if (response < 200 || response >= 300) {
    throw new HttpError(502, 'delivery_failed', 'Le test n’a pas été envoyé. Réessaie dans un instant.');
  }
  return { sent: true };
}

async function scheduledPush(request: Request) {
  const cron = request.headers.get('x-chamboule-cron') ?? '';
  const signed = /^(\d{10,11})\.([a-f0-9]{64})$/.exec(cron);
  if (!signed) throw new HttpError(403, 'forbidden', 'Accès refusé.');
  const [, epoch, signature] = signed;
  const [allowed] = await db`
    select 1 from chamboule_push.settings s join vault.decrypted_secrets v on v.id = s.cron_secret
    where s.id and abs(extract(epoch from now()) - ${epoch}::numeric) <= 120
      and encode(extensions.hmac(${'chamboule-push-tick:' + epoch}, v.decrypted_secret, 'sha256'), 'hex') = ${signature}
  `;
  if (!allowed) throw new HttpError(403, 'forbidden', 'Accès refusé.');
  const keys = await vaultVapidKeys();
  if (!keys) return { sent: 0, attempted: 0 };
  const due = await db<Delivery[]>`
    with candidates as (
      select s.token_hash, s.revision, s.subscription, d.slot, d.local_date
      from chamboule_push.settings s cross join chamboule_push.due_slots(now()) d where s.id
    ), claimed as (
      insert into chamboule_push.deliveries as old (token_hash, slot, local_date, revision, attempts, retry_after)
        select token_hash, slot, local_date, revision, 1, now() + interval '2 minutes' from candidates
      on conflict (token_hash, slot, local_date) do update set revision = excluded.revision,
        attempts = case when old.revision <> excluded.revision then 1 else old.attempts + 1 end,
        retry_after = excluded.retry_after
      where old.sent_at is null and (old.revision <> excluded.revision or (old.attempts < 3 and old.retry_after <= now()))
      returning token_hash, slot, local_date, revision
    )
    select c.token_hash, c.slot, c.local_date::text, c.revision, d.subscription
    from claimed c join candidates d using (token_hash, slot, local_date, revision)
  `;
  const results = await Promise.all(due.map(async (delivery) => {
    const [current] = await db`
      select 1 from chamboule_push.settings where id and token_hash = ${delivery.token_hash}
        and revision = ${delivery.revision} and subscription is not null
    `;
    if (!current) return false;
    const response = await push(delivery.subscription, delivery.slot, keys, delivery.local_date).catch(() => 0);
    if (response === 404 || response === 410) await expire(delivery.token_hash, delivery.revision);
    if (response < 200 || response >= 300) {
      console.warn('Chamboule scheduled push was not accepted', response);
      return false;
    }
    await db`
      update chamboule_push.deliveries set sent_at = now() where token_hash = ${delivery.token_hash}
        and slot = ${delivery.slot} and local_date = ${delivery.local_date} and revision = ${delivery.revision}
    `;
    return true;
  }));
  await db`delete from chamboule_push.deliveries where local_date < current_date - 7`;
  return { sent: results.filter(Boolean).length, attempted: due.length };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== APP_ORIGIN) return reply({ error: 'Accès refusé.', code: 'forbidden' }, 403);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': APP_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
      'Vary': 'Origin',
    } });
  }
  try {
    if (request.method === 'GET') return reply({ publicKey: await getPublicKey() });
    if (request.method !== 'POST') return reply({ error: 'Méthode non prise en charge.', code: 'method' }, 405);
    const input = await parseInput(request);
    if (input.action === 'tick') return reply(await scheduledPush(request));
    if (!['status', 'enable', 'save', 'disable', 'test'].includes(input.action)) {
      throw new HttpError(400, 'invalid_request', 'La demande de notification est invalide.');
    }
    const token = await sha256(tokenValue(input.token));
    return reply(input.action === 'test' ? await testPush(token) : await changeSettings(input.action, token, input));
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message, code: error.code }, error.status);
    console.error('Chamboule notification error', error instanceof Error ? error.name : typeof error);
    return reply({ error: 'Le service de notifications est indisponible. Réessaie plus tard.', code: 'service_unavailable' }, 503);
  }
});
