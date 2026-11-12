const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const SOURCE = readFileSync(join(__dirname, '../source/push-client.js'), 'utf8');
const SCOPE = 'https://polynelfe-del.github.io/chamboule/';
const PUBLIC_KEY = Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 9)]);
const CODE = '0123abcd'.repeat(4);
const TOKEN_KEY = 'chamboule-push-token-v1';
const SAVED_TOKEN = 'a'.repeat(43);
const SCHEDULE = { zone: 'Europe/Paris', morning: '08:00', evening: '21:00' };
const ACTIVE = { active: true, paired: true, ...SCHEDULE };

function fixture({ token, permission = 'default', backend, existing = false, firstLoad = false, linked = true, oldWorker = false } = {}) {
  const calls = [];
  const store = new Map(token ? [[TOKEN_KEY, token]] : []);
  const session = new Map();
  const location = new URL(SCOPE + (linked ? '#activer=' + CODE : ''));
  const pushData = { endpoint: 'https://fcm.googleapis.com/fcm/send/fake', keys: { p256dh: 'sample', auth: 'sample' } };
  const current = {
    toJSON: () => pushData,
    options: { applicationServerKey: Uint8Array.from(PUBLIC_KEY).buffer },
    unsubscribe: async () => { calls.push('unsubscribe'); push = null; return true; }
  };
  let push = existing ? current : null;
  const compatible = {
    postMessage(message, [port]) {
      assert.equal(message, 'chamboule-push-capability');
      port.postMessage('chamboule-push-v2');
      port.close();
    }
  };
  const worker = {
    scope: SCOPE,
    active: oldWorker ? {} : compatible,
    update() { calls.push('update'); this.active = compatible; },
    pushManager: {
      getSubscription: async () => push,
      subscribe: async (options) => {
        assert.equal(options.userVisibleOnly, true);
        assert.deepEqual(Buffer.from(options.applicationServerKey), PUBLIC_KEY);
        calls.push('subscribe');
        push = current;
        return push;
      }
    }
  };
  const ctx = vm.createContext({
    AbortController, atob, btoa, clearTimeout, setTimeout, URL, MessageChannel,
    window: {
      isSecureContext: true, PushManager() {}, crypto: webcrypto, location,
      history: { replaceState(_state, _title, url) { location.href = url; } },
      Notification: {
        permission,
        requestPermission() { calls.push('permission'); this.permission = 'granted'; return Promise.resolve('granted'); }
      }
    },
    navigator: { serviceWorker: {
      getRegistration: async () => firstLoad ? undefined : worker,
      ready: Promise.resolve(worker)
    } },
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    sessionStorage: { getItem: key => session.get(key) || null, setItem: (key, value) => session.set(key, value), removeItem: key => session.delete(key) },
    fetch: async (url, options) => {
      assert.equal(new URL(url).pathname, '/functions/v1/chamboule-push');
      assert.equal(options.credentials, 'omit');
      const body = options.body && JSON.parse(options.body);
      calls.push(body || 'key');
      if (!body) return new Response(JSON.stringify({ publicKey: PUBLIC_KEY.toString('base64url') }));
      return backend ? backend(body) : new Response(JSON.stringify(ACTIVE));
    }
  });
  const api = vm.runInContext(`${SOURCE}\nCHAMBOULE_PUSH`, ctx);
  return { api, calls, store, pushData, location };
}

test('asks permission within the activation click, waits for the worker, and sends only pairing data and the schedule', async () => {
  const { api, calls, store, pushData, location } = fixture({ firstLoad: true });
  assert.equal(api.openedWithLink, true);
  assert.equal(location.hash, '');
  const enabled = api.enable({ ...SCHEDULE, history: 'private' });
  assert.deepEqual(calls, ['permission']);
  assert.equal((await enabled).active, true);
  assert.equal(calls[1], 'key');
  assert.equal(calls[2], 'subscribe');
  const token = store.get(TOKEN_KEY);
  assert.match(token, /^[\w-]{43}$/);
  assert.deepEqual(calls[3], { action: 'enable', token, code: CODE, subscription: pushData, ...SCHEDULE });
  assert.equal(api.hasLink(), false);
});

test('status preserves the server schedule when local reception is unavailable', async () => {
  const { api, calls } = fixture({ token: SAVED_TOKEN, permission: 'granted' });
  const status = await api.status();
  assert.equal(status.active, true);
  assert.equal(status.receivable, false);
  assert.equal(status.paired, true);
  assert.equal(status.morning, '08:00');
  assert.deepEqual(calls, [{ action: 'status', token: SAVED_TOKEN }]);
});

test('retains the browser subscription on a failed disable and unsubscribes after confirmation', async () => {
  let fail = true;
  const { api, calls } = fixture({ token: SAVED_TOKEN, permission: 'granted', existing: true, backend: () => fail
    ? new Response(JSON.stringify({ error: 'details', code: 'service_unavailable' }), { status: 503 })
    : new Response(JSON.stringify({ ...ACTIVE, active: false })) });
  await assert.rejects(api.disable(), { code: 'service_unavailable' });
  assert.equal(calls.includes('unsubscribe'), false);
  fail = false;
  assert.equal((await api.disable()).active, false);
  assert.equal(calls.at(-1), 'unsubscribe');
});

test('keeps the same device token after a temporary server error and retries without resubscribing', async () => {
  let fail = true;
  const { api, calls, store } = fixture({ permission: 'granted', backend: () => fail
    ? new Response(JSON.stringify({ error: 'Réessaie.', code: 'service_unavailable' }), { status: 503 })
    : new Response(JSON.stringify(ACTIVE)) });
  await assert.rejects(api.enable(SCHEDULE), { code: 'service_unavailable' });
  const token = store.get(TOKEN_KEY);
  fail = false;
  assert.equal((await api.enable(SCHEDULE)).active, true);
  assert.equal(calls.at(-1).token, token);
  assert.equal(calls.filter(call => call === 'subscribe').length, 1);
});

test('updates the previous agenda worker before subscribing', async () => {
  const { api, calls } = fixture({ oldWorker: true });
  await api.enable(SCHEDULE);
  assert.equal(calls[0], 'permission');
  assert.ok(calls.indexOf('update') < calls.indexOf('subscribe'));
});

test('opening the public app alone does not request permissions or create a subscription', async () => {
  const { api, calls } = fixture({ linked: false });
  await assert.rejects(api.enable(SCHEDULE), { code: 'pairing_required' });
  assert.deepEqual(calls, []);
});
