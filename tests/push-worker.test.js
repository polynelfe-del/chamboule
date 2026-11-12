const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const scope = 'https://example.test/chamboule/';
const worker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function runWorker(windows = []) {
  const handlers = new Map();
  const notifications = [];
  const opened = [];
  vm.runInNewContext(worker, {
    URL,
    self: {
      addEventListener: (name, callback) => handlers.set(name, callback),
      registration: {
        scope,
        showNotification: async (title, options) => notifications.push({ title, options })
      },
      clients: {
        matchAll: async () => windows,
        openWindow: async url => opened.push(url)
      }
    }
  });
  function emit(name, fields) {
    let pending;
    handlers.get(name)({ ...fields, waitUntil: work => { pending = work; } });
    return pending;
  }
  return { emit, notifications, opened };
}

test('push displays only the three fixed Chamboule messages', async () => {
  const { emit, notifications } = runWorker();
  for (const slot of ['morning', 'evening', 'test', 'constructor', 'other']) {
    await emit('push', { data: { json: () => ({ slot, body: 'ignored', url: 'https://example.org/' }) } });
  }
  await emit('push', { data: { json: () => { throw new SyntaxError('invalid payload'); } } });
  assert.deepEqual(notifications.map(({ options }) => options.tag), [
    'chamboule-routine-morning', 'chamboule-routine-evening', 'chamboule-routine-test'
  ]);
  for (const { title, options } of notifications) {
    assert.equal(title, 'Chamboule');
    assert.notEqual(options.body, 'ignored');
    assert.equal(options.data.route, 'dos-calme');
    assert.equal(options.icon, scope + 'icon-192.png');
  }
});

test('tapping a Chamboule notification opens Dos calme when the app is closed', async () => {
  const otherApp = { url: 'https://example.test/other/', focus: () => assert.fail('another app was focused') };
  const { emit, opened } = runWorker([otherApp]);
  let closed = false;
  await emit('notificationclick', { notification: { data: { route: 'dos-calme' }, close: () => { closed = true; } } });
  assert.equal(closed, true);
  assert.deepEqual(opened, [scope + '?ouvrir=dos-calme']);
});

test('tapping a Chamboule notification reuses the open app without reloading it', async () => {
  const messages = [];
  const client = {
    url: scope + 'index.html?version=2',
    focus: async () => client,
    postMessage: message => messages.push(message.type)
  };
  const { emit, opened } = runWorker([client]);
  await emit('notificationclick', { notification: { data: { route: 'dos-calme' }, close() {} } });
  assert.deepEqual(messages, ['chamboule-open-routine']);
  assert.deepEqual(opened, []);
});
