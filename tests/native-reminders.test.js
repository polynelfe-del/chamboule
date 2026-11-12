const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../source/native-reminders.js'), 'utf8');

function fixture(start = 'default', grant = 'granted') {
  const window = new EventTarget();
  let permission = start;
  const calls = [];
  window.ChambouleAndroid = {
    status: () => JSON.stringify({ permission }),
    requestPermissions() {
      calls.push('permission');
      queueMicrotask(() => {
        permission = grant;
        window.dispatchEvent(new Event('chamboule-native-notifications'));
      });
    },
    save(morning, evening) {
      calls.push([morning, evening]);
      return JSON.stringify({ active: true, morning, evening, permission });
    },
    disable: () => JSON.stringify({ active: false }),
    test: () => JSON.stringify({ testScheduled: true, testDelaySeconds: 25 })
  };
  const api = vm.runInNewContext(source + '\nCHAMBOULE_PUSH', { window, setTimeout, clearTimeout });
  return { api, calls };
}

test('one native activation click requests permission, then saves the local schedule', async () => {
  const { api, calls } = fixture();
  assert.equal(api.native, true);
  assert.equal((await api.enable({ morning: '06:30', evening: '18:29' })).active, true);
  assert.deepEqual(calls, ['permission', ['06:30', '18:29']]);
  assert.equal((await api.test()).testDelaySeconds, 25);
  assert.equal((await api.disable()).active, false);
});

test('permission refusal leaves reminders unscheduled', async () => {
  const { api, calls } = fixture('default', 'denied');
  await assert.rejects(api.enable({ morning: '06:30', evening: '18:29' }), /réglages Android/);
  assert.deepEqual(calls, ['permission']);
});

test('an off slot is sent empty to Android and no prompt reappears after approval', async () => {
  const { api, calls } = fixture('granted');
  await api.enable({ morning: '06:30', evening: null });
  assert.deepEqual(calls, [['06:30', '']]);
});
