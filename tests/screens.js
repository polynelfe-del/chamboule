// Vérifie les écrans principaux dans un vrai navigateur (Chromium), au format téléphone.
// Lancé seulement sur GitHub (.github/workflows/tests.yml), où Playwright est installé pour l’occasion :
//   npm install --no-save --no-package-lock playwright@1.48.2 && npx playwright install --with-deps chromium
//   node tests/screens.js
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
    await has('[data-action="routine-reminders"], [data-action="gcal"]', 'bouton pour programmer');
    await click('[data-action="rem-back"]');
    await has('.today', 'retour à l’accueil');
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
  if (problems.length) { console.error('\nProblèmes :\n- ' + problems.join('\n- ')); process.exit(1); }
  console.log('\nTous les écrans principaux s’affichent sans erreur.');
})().catch(e => { console.error(e); process.exit(1); });
