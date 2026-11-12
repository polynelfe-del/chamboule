// Vérifie les écrans principaux dans un vrai navigateur (Chromium), au format téléphone.
// Lancé seulement sur GitHub (.github/workflows/tests.yml), où Playwright est installé pour l’occasion :
//   npm install --no-save --no-package-lock playwright@1.48.2 && npx playwright install --with-deps chromium
//   node tests/screens.js
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});

const day = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(18, 0, 0, 0); return d.toISOString(); };
const entry = (prog, n, o = {}) => Object.assign({ id: 's' + prog + n, d: day(n), prog, score: 100, xp: 80, stars: 2, reps: 20, perfect: 16, combo: 5, durS: 600,
  painBefore: 2, pain: 2, next: 2, leg: false, stop: false, skipped: [], painEx: [] }, o);
const BUSY = { v: 1, xp: 1200, bestCombo: 8, badges: {}, challenges: {}, tests: [],
  settings: { tutorialDone: true, milieuOk: true, lastExport: day(40) },
  history: [entry('haut', 1, { next: null }), entry('dos', 3), entry('fessiers', 5), entry('milieu', 7), entry('dos', 9), entry('haut', 11)] };

const problems = [];
async function step(label, fn) {
  try { await fn(); console.log('✔ ' + label); } catch (e) { problems.push(`${label} : ${String(e.message).split('\n')[0]}`); console.log('✖ ' + label); }
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => problems.push('erreur dans la page : ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console : ' + m.text()); });
  const has = async (sel, what) => { if (!(await page.locator(sel).count())) throw new Error(`${what || sel} introuvable`); };
  const click = sel => page.locator(sel).first().click();
  const load = async s => {
    await page.goto(base);
    await page.evaluate(x => { localStorage.clear(); if (x) localStorage.setItem('chamboule-coach.v1', JSON.stringify(x)); }, s);
    await page.reload();
    await page.waitForSelector('main');
  };

  await step('premier lancement : accueil et séance du jour', async () => {
    await load(null);
    await has('.today [data-action="play"]', 'bouton Jouer de la séance du jour');
  });
  await step('premier lancement : l’essai guidé démarre', async () => {
    await click('.today [data-action="play"]');
    await has('[data-action="go"]', 'écran de l’essai guidé');
  });
  await step('accueil : « À faire aujourd’hui » et Jouer visible sans défiler', async () => {
    await load(BUSY);
    await has('.todo [data-action="next"]', 'suivi du lendemain');
    const box = await page.locator('.today [data-action="play"]').first().boundingBox();
    if (!box || box.y + box.height > 812) throw new Error('le bouton Jouer est sous la ligne de flottaison');
  });
  await step('suivi du lendemain avec la zone', async () => {
    await click('.todo [data-action="next-zone"][data-z="bas"]');
    await click('.todo [data-action="next"][data-v="3"]');
    const h = await page.evaluate(() => JSON.parse(localStorage.getItem('chamboule-coach.v1')).history[0]);
    if (h.next !== 3 || !(h.zoneNext || []).includes('bas')) throw new Error('suivi mal enregistré : ' + JSON.stringify([h.next, h.zoneNext]));
  });
  await step('onglet Progrès : arbre et test de forme', async () => {
    await click('[data-action="tab"][data-tab="progress"]');
    await has('.tree .tree-node', 'arbre de progression');
    await has('.fit [data-action="test-start"]', 'test de forme');
  });
  await step('onglet Carnet : historique', async () => {
    await click('[data-action="tab"][data-tab="log"]');
    await has('.hist li', 'historique');
  });
  await step('Réglages : 6 sections, seuil de douleur', async () => {
    await click('[data-action="settings"]');
    const n = await page.locator('.fold-head').count();
    if (n !== 6) throw new Error(n + ' sections au lieu de 6');
    await click('[data-sec="douleur"]');
    await has('[data-action="pain-inc"]', 'réglage du seuil');
    await click('[data-action="home"]');
  });
  await step('avant la séance, puis le jeu', async () => {
    await click('[data-action="tab"][data-tab="play"]');
    await click('.today [data-action="play"]');
    await click('[data-action="pre-pain"][data-v="2"]');
    await click('[data-action="pre-zone"][data-z="bas"]');
    await click('[data-action="pre-leg"][data-v="0"]');
    if (await page.locator('[data-action="door-ok"]').count()) await click('[data-action="door-ok"]');
    await click('[data-action="pre-go"]');
    await has('[data-action="quit"]', 'écran de jeu');
    await click('[data-action="quit"]');
    await click('[data-action="abandon"]');
    await has('.today', 'retour à l’accueil');
  });
  await step('test de forme : écran de départ', async () => {
    await click('[data-action="tab"][data-tab="progress"]');
    await click('.fit [data-action="test-start"]');
    await has('[data-action="test-go"]', 'bouton C’est parti');
    await click('[data-action="home"]');
  });
  await step('accueil : signes d’alerte et bons gestes en fiches', async () => {
    await click('[data-action="tab"][data-tab="play"]');
    await click('.links [data-info="alerte"]');
    await has('.ex-sheet .alert', 'fiche des signes d’alerte');
    await click('[data-action="info-close"]');
    await click('.links [data-info="gestes"]');
    await has('.ex-sheet .geste', 'fiche des bons gestes');
    await click('[data-action="info-close"]');
    if (!(await page.locator('text=ne remplace pas un avis médical').count())) throw new Error('avertissement médical absent');
  });
  await step('cloche : rappels du matin et du soir', async () => {
    await click('[data-action="reminders-open"]');
    await has('#rt-matin', 'heure du matin');
    await has('#rt-soir', 'heure du soir');
    await page.fill('#rt-matin', '07:30');
    await page.locator('#rt-matin').dispatchEvent('change');
    await click('[data-action="rt-toggle"][data-slot="soir"]');
    if (!(await page.locator('#rt-soir').isDisabled())) throw new Error('le rappel du soir ne se coupe pas');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('chamboule-coach.v1')).settings);
    if (st.routineMorning !== '07:30' || st.routineEveningOn !== false) throw new Error('heures mal enregistrées : ' + JSON.stringify([st.routineMorning, st.routineEveningOn]));
    await has('text=Notifications Chamboule', 'notifications dans la cloche');
    if (await page.locator('.page a[href*="calendar.google.com"]').count()) throw new Error('la cloche utilise encore Google Agenda');
    await click('[data-action="rem-back"]');
    await has('.today', 'retour à l’accueil');
  });
  await step('notifications : activation, horaires, essai et ouverture de Dos calme', async () => {
    const pushPage = await browser.newPage({
      viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true,
      locale: 'fr-FR', timezoneId: 'Europe/Paris', serviceWorkers: 'block'
    });
    const code = '0123456789abcdef0123456789abcdef';
    const keyBytes = Buffer.alloc(65, 1);
    keyBytes[0] = 4;
    const publicKey = keyBytes.toString('base64url');
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test-chamboule';
    const calls = [];
    let saved = { active: false, paired: false, morning: null, evening: null, zone: null };
    try {
      pushPage.on('pageerror', error => problems.push('écran notifications : ' + error.message));
      await pushPage.addInitScript(({ endpoint }) => {
        Object.defineProperty(window, 'Notification', { value: {
          get permission() { return sessionStorage.getItem('mock-notification') || 'default'; },
          async requestPermission() { sessionStorage.setItem('mock-notification', 'granted'); return 'granted'; }
        } });
        Object.defineProperty(window, 'PushManager', { value: function PushManager() {} });
        const subscription = {
          get options() { return { applicationServerKey: Uint8Array.from(JSON.parse(sessionStorage.getItem('mock-push-key'))) }; },
          toJSON: () => ({ endpoint, keys: { p256dh: 'fake-public-key', auth: 'fake-auth-key' } }),
          async unsubscribe() { sessionStorage.removeItem('mock-push-key'); return true; }
        };
        const worker = {
          scope: new URL('./', location.href).href, active: true,
          pushManager: {
            async getSubscription() { return sessionStorage.getItem('mock-push-key') === null ? null : subscription; },
            async subscribe(options) {
              if (!options.userVisibleOnly) throw new Error('L’abonnement doit afficher ses notifications.');
              sessionStorage.setItem('mock-push-key', JSON.stringify([...options.applicationServerKey]));
              return subscription;
            }
          }
        };
        Object.defineProperty(navigator.serviceWorker, 'getRegistration', { value: async () => worker });
      }, { endpoint });
      await pushPage.route('**/functions/v1/chamboule-push', async route => {
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
        const request = route.request();
        if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
        if (request.method() === 'GET') { await route.fulfill({ json: { publicKey }, headers }); return; }
        const data = request.postDataJSON();
        calls.push(data);
        if (data.action === 'enable' || data.action === 'save') {
          saved = { active: true, paired: true, morning: data.morning, evening: data.evening, zone: data.zone };
        }
        if (data.action === 'disable') saved = { ...saved, active: false };
        await route.fulfill({ json: data.action === 'test' ? { sent: true } : saved, headers });
      });

      const act = action => pushPage.locator(`[data-action="${action}"]`).first();
      await pushPage.goto(base);
      await act('reminders-open').click();
      await act('push-enable').click();
      await pushPage.getByRole('alert').filter({ hasText: 'Saisis le code d’activation' }).waitFor();
      assert.equal(calls.length, 0);
      await pushPage.locator('#chamboule-push-code').fill(code);
      await act('push-enable').click();
      await pushPage.getByText('Notifications activées.', { exact: false }).waitFor();
      const [enable] = calls;
      assert.equal(enable.action, 'enable');
      assert.equal(enable.code, code);
      assert.match(enable.token, /^[\w-]{43}$/);
      assert.equal(enable.subscription.endpoint, endpoint);
      assert.deepEqual([enable.morning, enable.evening, enable.zone], ['08:00', '21:00', 'Europe/Paris']);
      assert.deepEqual(await pushPage.evaluate(() => JSON.parse(sessionStorage.getItem('mock-push-key'))), [...keyBytes]);

      await pushPage.locator('#rt-matin').fill('07:30');
      await pushPage.locator('#rt-matin').dispatchEvent('change');
      await pushPage.locator('[data-action="rt-toggle"][data-slot="soir"]').click();
      await act('push-save').click();
      await pushPage.getByText('Horaires enregistrés.', { exact: true }).waitFor();
      assert.deepEqual(calls.at(-1), { action: 'save', token: enable.token, morning: '07:30', evening: null, zone: 'Europe/Paris' });

      await pushPage.reload();
      await act('reminders-open').click();
      await pushPage.getByText('Rappels enregistrés : matin à 7 h 30.', { exact: true }).waitFor();
      await act('push-test').click();
      await pushPage.getByText('Test envoyé.', { exact: false }).waitFor();
      assert.deepEqual(calls.at(-1), { action: 'test', token: enable.token });
      await act('push-disable').click();
      await pushPage.getByText('Notifications désactivées sur ce téléphone.', { exact: true }).waitFor();
      assert.deepEqual(calls.at(-1), { action: 'disable', token: enable.token });
      assert.equal(await pushPage.evaluate(() => sessionStorage.getItem('mock-push-key')), null);

      await pushPage.goto(base + '?ouvrir=dos-calme');
      await pushPage.getByRole('heading', { name: 'Avant de jouer' }).waitFor();
      assert.equal(await pushPage.locator('main .eyebrow').first().innerText(), 'Dos calme');
      assert.equal(new URL(pushPage.url()).searchParams.has('ouvrir'), false);
    } finally {
      await pushPage.close();
    }
  });
  await step('Dos calme écourté : écran honnête, routine pas cochée', async () => {
    await load(BUSY);
    await click('.routine [data-action="play"]');
    await click('[data-action="next"][data-v="2"]');
    await click('[data-action="pre-leg"][data-v="0"]');
    await click('[data-action="pre-go"]');
    await has('.auto-go', 'départ automatique, guidé à la voix');
    await click('[data-action="go"]');
    await page.waitForTimeout(9000);
    await click('[data-action="quit"]');
    await click('[data-action="end-now"]');
    const title = await page.locator('.res-title').innerText();
    if (title !== 'Séance écourtée') throw new Error('titre : ' + title);
    await click('[data-action="ci-relief"][data-v="1"]');
    const h = await page.evaluate(() => JSON.parse(localStorage.getItem('chamboule-coach.v1')).history[0]);
    if (h.relief !== 1 || h.stars !== 1) throw new Error('ressenti mal enregistré : ' + JSON.stringify([h.relief, h.stars]));
    await click('[data-action="home"]');
    if (await page.locator('.routine .slot.done').count()) throw new Error('la routine est cochée par une séance écourtée');
  });
  await step('bilan de la semaine, puis Progrès', async () => {
    await click('[data-action="weekly-open"]');
    await click('[data-action="wk-can"][data-id="chien"]');
    for (const q of ['stiff', 'night', 'meds']) await click(`[data-action="wk-ans"][data-q="${q}"][data-v="0"]`);
    await click('[data-action="weekly-save"]');
    await has('.life .can-list li', 'ce que ton dos t’a laissé faire');
  });
  await step('résumé pour le kiné : une page clinique', async () => {
    await click('[data-action="tab"][data-tab="log"]');
    await click('.hist-actions [data-action="summary"]');
    const txt = await page.locator('#sum-text').innerText();
    for (const part of ['À DISCUTER', 'BILAN DE LA SEMAINE', 'ne remplace pas l’examen']) if (!txt.includes(part)) throw new Error('manque : ' + part);
  });

  await browser.close();
  server.close();
  if (problems.length) {
    console.error('\nProblèmes :\n- ' + problems.join('\n- '));
    // Sur GitHub, chaque problème devient aussi une annotation, lisible sans ouvrir le journal.
    if (process.env.GITHUB_ACTIONS) for (const p of problems) console.log('::error title=Écrans::' + p.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A'));
    process.exit(1);
  }
  console.log('\nTous les écrans principaux s’affichent sans erreur.');
})().catch(e => { console.error(e); process.exit(1); });
