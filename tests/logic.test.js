// Tests automatiques de Chamboule Coach. Lancement : node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('./load')();

// Les objets du bac à sable viennent d'un autre « monde » JavaScript : on compare leur contenu en JSON.
const plain = x => JSON.parse(JSON.stringify(x));
const same = (a, b, msg) => assert.deepEqual(plain(a), plain(b), msg);
const D = (y, mo, d, h = 10) => new Date(y, mo - 1, d, h);
const iso = (...a) => D(...a).toISOString();
const NOW = D(2026, 10, 18, 12); // un dimanche
let seq = 0;
function entry(o = {}) {
  return Object.assign({ id: 'e' + (++seq), d: iso(2026, 10, 14), prog: 'dos', score: 100, xp: 100, stars: 2, perfect: 8, reps: 10,
    combo: 5, veloMin: 0, walkMin: 0, pyramids: 0, skipped: [], painEx: [], stop: false, back: null, hf: false,
    painBefore: 3, legBefore: false, pain: 3, leg: false, next: null, durS: 600 }, o);
}
function state(o = {}) { const s = api.defaultState(); Object.assign(s, o); return s; }
const run = (o) => Object.assign({ painEx: [], skipped: [], reps: 10, perfect: 10 }, o);

test('niveaux : seuils et noms', () => {
  assert.equal(api.levelInfo(0).n, 1);
  assert.equal(api.levelInfo(299).n, 1);
  assert.equal(api.levelInfo(300).n, 2);
  assert.equal(api.levelInfo(899).n, 2);
  assert.equal(api.levelInfo(900).n, 3);
  assert.equal(api.levelInfo(0).name, 'Ticket d’entrée');
  assert.equal(api.levelInfo(1e7).name, api.LEVELS[api.LEVELS.length - 1]);
  for (const xp of [0, 150, 299, 300, 5000]) { const p = api.levelInfo(xp).pct; assert.ok(p >= 0 && p <= 100, `pct ${p} pour ${xp} XP`); }
});

test('catégorie du dos après la séance', () => {
  assert.equal(api.backCat(entry({ stop: true })), 'stop');
  assert.equal(api.backCat(entry({ leg: true, pain: 1 })), 'douleur', 'symptômes dans la jambe');
  assert.equal(api.backCat(entry({ painBefore: 3, pain: 2 })), 'ok');
  assert.equal(api.backCat(entry({ painBefore: 1, pain: 2 })), 'ok', '+1 mais reste bas');
  assert.equal(api.backCat(entry({ painBefore: 3, pain: 4 })), 'sensible');
  assert.equal(api.backCat(entry({ painBefore: 3, pain: 6 })), 'douleur', '+3 points');
  assert.equal(api.backCat(entry({ painBefore: 6, pain: 7 })), 'douleur', '7/10 ou plus');
  assert.equal(api.backCat(entry({ painBefore: 3, pain: 3, next: 6 })), 'douleur', 'le lendemain compte');
  assert.equal(api.backCat(entry({ pain: null, back: 'sensible' })), 'sensible', 'anciennes séances');
});

test('XP : la qualité compte, pas le volume', () => {
  const { dos, boule, difficile } = api.PROGRAMS;
  assert.equal(api.computeXP(dos, run()), 130, 'séance complète et parfaite');
  assert.equal(api.computeXP(dos, run({ skipped: ['pont'], painEx: ['pont'] })), 130, 'passé pour douleur : aucune pénalité');
  assert.equal(api.computeXP(dos, run({ skipped: ['velo'] })), 105, 'un exercice non fait sur 4');
  assert.equal(api.computeXP(dos, run({ perfect: 5 })), 110, 'moitié des reps trop rapides');
  assert.equal(api.computeXP(boule, run()), api.computeXP(dos, run()), 'Boule qui chamboule ne rapporte pas plus');
  assert.ok(api.computeXP(difficile, run()) < api.computeXP(dos, run()), 'Jour difficile rapporte moins');
});

test('étoiles', () => {
  assert.equal(api.computeStars('pain', run()), 0, 'arrêt pour douleur');
  assert.equal(api.computeStars('done', run()), 3);
  assert.equal(api.computeStars('done', run({ skipped: ['pont'], painEx: ['pont'] })), 3, 'passer pour douleur ne coûte pas d’étoile');
  assert.equal(api.computeStars('done', run({ skipped: ['velo'] })), 2, 'un vrai saut coûte la 3e étoile');
  assert.equal(api.computeStars('done', run({ perfect: 4 })), 1);
  assert.equal(api.computeStars('done', run({ reps: 0, perfect: 0 })), 3, 'vélo seul');
});

test('cœurs : un seul par jour, et semaines d’affilée', () => {
  const s = state({ history: [entry({ d: iso(2026, 10, 18, 9) }), entry({ d: iso(2026, 10, 18, 18) }), entry({ d: iso(2026, 10, 15) })] });
  assert.equal(api.weekDays(s, NOW), 2, 'deux séances le même jour = un seul cœur');
  s.settings.weeklyGoal = 2;
  s.history.push(entry({ d: iso(2026, 10, 7) }), entry({ d: iso(2026, 10, 9) }));
  assert.equal(api.weekStreak(s, NOW), 2);
  s.settings.weeklyGoal = 3;
  assert.equal(api.weekStreak(s, NOW), 0);
});

test('défis de la semaine : tirage stable, +50 XP une seule fois, vieux défis oubliés', () => {
  const picked = api.weekChallenges(NOW);
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked.map(c => c.id)).size, 3, 'trois défis différents');
  same(api.weekChallenges(D(2026, 10, 13)).map(c => c.id), picked.map(c => c.id), 'même tirage toute la semaine');

  // Une semaine qui remplit tous les défis possibles.
  const days = [12, 13, 14].map(d => iso(2026, 10, d));
  const s = state({
    xp: 0,
    challenges: { '2026-8-3': { stars3: '2026-08-04' } },
    history: [
      entry({ d: days[0], stars: 3, combo: 12, reps: 10, perfect: 10, next: 2, pain: 2, hf: true, pyramids: 2, veloMin: 8 }),
      entry({ d: days[1], stars: 3, next: 2, pain: 2, pyramids: 1, veloMin: 8, prog: 'difficile' }),
      entry({ d: days[2], stars: 2 })
    ]
  });
  s.settings.lastExport = NOW.toISOString();
  for (const c of api.CHALLENGES) assert.equal(api.chalProgress(s, c, NOW), c.goal, `défi ${c.id} rempli`);
  const won = api.evalChallenges(s, NOW);
  assert.equal(won.length, 3);
  assert.equal(s.xp, 150);
  assert.equal(api.evalChallenges(s, NOW).length, 0, 'pas deux fois');
  assert.equal(s.xp, 150);
  assert.ok(!('2026-8-3' in s.challenges), 'les semaines de plus d’un mois sont oubliées');
});

test('défis : calculés à la date donnée, jamais à l’horloge du téléphone', () => {
  const save = api.CHALLENGES.find(c => c.id === 'save1');
  const s = state();
  s.settings.lastExport = NOW.toISOString(); // dimanche 18 octobre
  assert.equal(api.chalProgress(s, save, NOW), 1, 'même semaine');
  assert.equal(api.chalProgress(s, save, D(2026, 10, 19)), 0, 'le lundi suivant, nouvelle semaine');
  assert.equal(api.chalProgress(s, save, D(2026, 10, 12)), 1, 'lundi de la même semaine');
});

test('badges : donnés une seule fois', () => {
  const s = state({ history: [entry()] });
  same(api.evalBadges(s, NOW).map(b => b.id), ['premier']);
  assert.equal(api.evalBadges(s, NOW).length, 0);
});

test('tenues de Chouquette', () => {
  same(api.unlockedOutfits(state()), ['noeud']);
  assert.ok(api.unlockedOutfits(state({ xp: 300 })).includes('noeud-or'));
  assert.ok(api.unlockedOutfits(state({ xp: 900 })).includes('lunettes'));
  assert.ok(!api.unlockedOutfits(state({ xp: 900 })).includes('couronne'));
  assert.ok(api.unlockedOutfits(state({ xp: 3000 })).includes('couronne'));
  assert.ok(api.unlockedOutfits(state({ badges: { combo10: '2026-10-01' } })).includes('bandeau'));
});

test('déroulé des séances', () => {
  const s = state();
  assert.equal(api.buildSteps(s, api.PROGRAMS.dos).length, 5, 'Reprise dos, 1 série');
  s.settings.sets = 2;
  assert.equal(api.buildSteps(s, api.PROGRAMS.dos).length, 9, 'Reprise dos, 2 séries (le vélo reste unique)');
  assert.equal(api.buildSteps(s, api.PROGRAMS.boule).length, 21);
  assert.equal(api.buildSteps(s, api.PROGRAMS.milieu).length, 6);
  assert.equal(api.buildSteps(s, api.PROGRAMS.difficile).length, 2);
  const sides = api.buildSteps(s, api.PROGRAMS.dos).filter(st => st.ex.id === 'birddog').map(st => st.side);
  same(sides, ['droit', 'gauche', 'droit', 'gauche']);
});

test('pyramides de boîtes', () => {
  for (let n = 1; n <= 15; n++) {
    const rows = api.canRows(n);
    assert.equal(rows.reduce((a, b) => a + b, 0), n, `${n} boîtes`);
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i] <= rows[i - 1], 'jamais plus large en haut');
  }
  same(api.canRows(5), [3, 2]);
  same(api.canRows(6), [3, 2, 1]);
  same(api.canRows(12), [5, 4, 3]);
});

test('prescriptions affichées', () => {
  const s = state(), E = api.EX;
  assert.equal(api.presc(s, E.transverse, 1), '5 respirations lentes');
  assert.equal(api.presc(s, E.birddog, 1), '5 répétitions par côté');
  assert.equal(api.presc(s, E.pont, 1), '6 à 8 répétitions');
  assert.equal(api.presc(s, E.velo, 1), '10 min, résistance légère');
  assert.equal(api.presc(s, E.gainage, 1), '6 maintiens de 8 s');
  assert.equal(api.presc(s, E.fentes, 3), '3 × 10 par jambe');
  assert.equal(api.presc(s, E.hydrant, 1), 'Activation, environ 10 par côté');
  assert.equal(api.sideText(E.fentes, 'droit'), 'jambe droite');
});

test('sécurité : une sauvegarde piégée est neutralisée', () => {
  const evil = '<img src=x onerror=alert(1)>';
  const s = api.normalize({
    xp: evil, bestCombo: '7',
    settings: { sets: 99, veloMin: -5, weeklyGoal: 'x', sound: 'oui', outfit: evil, bouleUnlocked: 'true', lastExport: evil },
    badges: { premier: '2026-10-01', pirate: '2026-10-01', s10: evil },
    challenges: { '2026-10-12': { stars3: '2026-10-13', pirate: '2026-10-13' }, [evil]: {} },
    history: [
      { id: evil, d: iso(2026, 10, 14), prog: '__proto__', xp: evil, score: evil, stars: evil, pain: evil, painBefore: 3, next: 11,
        skipped: ['velo', evil], painEx: [evil], leg: 'oui', back: evil },
      { d: 'pas une date', score: 10 },
      'pas un objet'
    ]
  });
  const json = JSON.stringify(s);
  assert.ok(!json.includes('<'), 'aucune balise ne survit');
  assert.equal(s.xp, 0);
  assert.equal(s.bestCombo, 7);
  same(s.settings.sets, 3);
  assert.equal(s.settings.veloMin, 3);
  assert.equal(s.settings.weeklyGoal, 3);
  assert.equal(s.settings.outfit, 'noeud');
  assert.equal(s.settings.bouleUnlocked, false, 'seul true débloque');
  same(Object.keys(s.badges), ['premier']);
  same(s.challenges, { '2026-10-12': { stars3: '2026-10-13' } });
  assert.equal(s.history.length, 1, 'les entrées invalides sont écartées');
  const h = s.history[0];
  assert.equal(h.prog, 'dos');
  assert.equal(h.xp, null);
  assert.equal(h.pain, null);
  assert.equal(h.next, 10, 'borné à 10');
  same(h.skipped, ['velo']);
  same(h.painEx, []);
  assert.equal(h.leg, null);
  assert.equal(h.back, null);
  assert.match(h.id, /^[A-Za-z0-9_-]+$/);
});

test('suivi du lendemain', () => {
  const yesterday = entry({ d: iso(2026, 10, 17) });
  assert.equal(api.pendingNextDay(state({ history: [yesterday] }), NOW).id, yesterday.id);
  assert.equal(api.pendingNextDay(state({ history: [entry({ d: iso(2026, 10, 17), next: 2 })] }), NOW), null, 'déjà répondu');
  assert.equal(api.pendingNextDay(state({ history: [entry({ d: iso(2026, 10, 13) })] }), NOW), null, 'trop ancien');
  const today = entry({ d: iso(2026, 10, 18, 9) });
  assert.equal(api.pendingNextDay(state({ history: [today, yesterday] }), NOW).id, yesterday.id, 'la séance du jour est ignorée');
});

test('séances de suite sans douleur', () => {
  const s = state({ history: [entry({ pain: 2 }), entry({ pain: 3, prog: 'boule' }), entry({ pain: 2 }), entry({ pain: 7 }), entry({ pain: 1 })] });
  assert.equal(api.painFreeRun(s), 2, 's’arrête à la première séance douloureuse ; les autres programmes ne comptent pas');
});

test('rappel de sauvegarde', () => {
  const now = NOW.getTime(), day = 86400000;
  const s = state({ history: [entry(), entry(), entry()] });
  assert.equal(api.backupDue(s, now, true), false, 'jamais dans la version Claude');
  assert.equal(api.backupDue(state({ history: [entry()] }), now, false), false, 'moins de 3 séances');
  assert.equal(api.backupDue(s, now, false), true, 'jamais exporté');
  s.settings.lastExport = new Date(now - 10 * day).toISOString();
  assert.equal(api.backupDue(s, now, false), false);
  s.settings.lastExport = new Date(now - 31 * day).toISOString();
  assert.equal(api.backupDue(s, now, false), true);
  s.settings.exportSnooze = new Date(now + day).toISOString();
  assert.equal(api.backupDue(s, now, false), false, 'repoussé');
});

test('résumé pour le kiné', () => {
  const s = state({ history: [
    entry({ d: iso(2026, 10, 16), painBefore: 3, pain: 2, next: 1, skipped: ['pont'], painEx: ['pont'] }),
    entry({ d: iso(2026, 8, 1), painBefore: 9, pain: 9 })
  ] });
  const txt = api.kineSummary(s, NOW);
  assert.match(txt, /Douleur : 3 → 2 → 1/);
  assert.match(txt, /Passé pour douleur : Pont fessier/);
  assert.match(txt, /Séances : 1, sur 1 jour/);
  assert.doesNotMatch(txt, /9 → 9/, 'seulement les 30 derniers jours');
  assert.doesNotMatch(txt, /mot-retire/i, 'pas de diagnostic');
});

test('cohérence des données', () => {
  const uniq = (arr, what) => assert.equal(new Set(arr).size, arr.length, `identifiants ${what} en double`);
  uniq(api.BADGES.map(b => b.id), 'badges');
  uniq(api.CHALLENGES.map(c => c.id), 'défis');
  uniq(api.OUTFITS.map(o => o.id), 'tenues');
  for (const id of api.PROG_ORDER) assert.ok(api.PROGRAMS[id], `programme ${id}`);
  for (const p of Object.values(api.PROGRAMS)) {
    assert.ok(p.exercises.length > 0, `${p.id} vide`);
    if (p.practice) continue;
    assert.ok(p.xpBase > 0 && p.rest >= 0, `${p.id} : XP et repos`);
    for (const ex of p.exercises) {
      const il = api.ILLUS[ex.id];
      assert.ok(il, `dessin manquant pour ${ex.id}`);
      assert.equal(il.poses.length, 2, `${ex.id} : 2 positions`);
      assert.equal(il.labels.length, 2, `${ex.id} : 2 légendes`);
      if (ex.kind === 'hold') assert.ok(ex.hold > 0 && ex.target > 0, `${ex.id} : maintien`);
      if (ex.kind === 'reps' || ex.kind === 'breath') assert.ok(ex.tempo > 0 && ex.target > 0, `${ex.id} : tempo`);
      if (ex.kind === 'timer') assert.ok(ex.id === 'velo' || ex.minutes > 0, `${ex.id} : durée`);
      assert.ok(ex.cue && ex.cue.length > 20, `${ex.id} : consigne`);
    }
  }
  for (const o of api.OUTFITS) assert.ok(api.OUTFIT_SVG[o.id], `dessin de tenue ${o.id}`);
  const empty = state();
  for (const c of api.CHALLENGES) {
    assert.ok(c.goal > 0, `défi ${c.id} : objectif`);
    assert.equal(api.chalProgress(empty, c, NOW), 0, `défi ${c.id} : vide au départ`);
  }
});

test('dessins', () => {
  assert.match(api.illusFull('pont'), /^<figure class="il-fig[^"]*"><svg/);
  assert.match(api.illusMini('birddog'), /^<svg class="il il-mini"/);
  for (const o of api.OUTFITS) assert.match(api.mascotSVG('happy', o.id), /<svg class="mascot"/);
  assert.equal(api.esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});
