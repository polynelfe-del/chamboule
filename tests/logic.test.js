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

test('XP : au temps joué, la qualité compte, enchaîner ne paie pas', () => {
  const { dos, boule, difficile } = api.PROGRAMS;
  assert.equal(api.computeXP(dos, run(), 14), 160, 'séance complète et parfaite');
  assert.equal(api.computeXP(dos, run({ skipped: ['pont'], painEx: ['pont'] }), 14), 160, 'passé pour douleur : aucune pénalité');
  assert.equal(api.computeXP(dos, run({ skipped: ['velo'] }), 14), 125, 'un exercice non fait sur 4');
  assert.equal(api.computeXP(dos, run({ perfect: 5 }), 14), 132, 'moitié des reps trop rapides');
  assert.equal(api.computeXP(boule, run(), 20), api.computeXP(dos, run(), 15), 'au-delà de 15 min, le volume ne rapporte plus');
  assert.equal(api.computeXP(difficile, run(), 2), 40);
  assert.equal(api.computeXP(difficile, run(), 2, true), 10, 'deuxième séance du jour : moitié, sans bonus');
  const perMin = (p, m) => api.computeXP(p, run(), m) / m;
  assert.ok(perMin(difficile, 2) < 2 * perMin(dos, 14), 'la séance la plus courte n’écrase plus les autres à la minute');
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
  const withBike = api.weekChallenges(D(2026, 10, 19)).map(c => c.id), noBike = api.weekChallenges(D(2026, 10, 19), true).map(c => c.id);
  assert.ok(withBike.includes('velo15'), 'semaine du 19 octobre : défi vélo tiré');
  assert.ok(!noBike.includes('velo15'), 'sans vélo, il est remplacé');
  assert.equal(new Set(noBike).size, 3);
  same(noBike.filter(id => withBike.includes(id)), withBike.filter(id => id !== 'velo15'), 'les deux autres défis ne changent pas');

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
  assert.equal(api.buildSteps(s, api.PROGRAMS.calme).length, 5, 'Dos calme');
  assert.equal(api.buildSteps(s, api.PROGRAMS.fessiers).length, 7, 'Fessiers doux');
  assert.equal(api.buildSteps(s, api.PROGRAMS.solide).length, 6, 'Dos solide');
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
  assert.equal(api.presc(s, E.gainagelat, 1), '2 maintiens de 15 s par côté');
  assert.equal(api.presc(s, E.birddogtenu, 1), '3 maintiens de 5 s par côté');
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

test('Dos solide : série de séances sans douleur pour le débloquer', () => {
  const ok = o => entry(Object.assign({ painBefore: 3, pain: 2, next: 2 }, o));
  const ten = o => Array.from({ length: 10 }, () => ok(o));
  assert.equal(api.solidStreak(state({ history: ten() })), 10);
  assert.equal(api.solidStreak(state({ history: ten({ painBefore: 6, pain: 6, next: 6 }) })), 0, 'douleur constante à 6/10 : ce n’est pas « sans douleur »');
  assert.equal(api.solidStreak(state({ history: ten({ next: null }) })), 0, 'sans suivi du lendemain, rien ne compte');
  assert.equal(api.solidStreak(state({ history: [ok({ next: null }), ok(), ok()] })), 2, 'le lendemain pas encore noté : la série attend');
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ painBefore: 4, pain: 4, next: 4 }), ok()] })), 1, '4/10 casse la série');
  assert.equal(api.SOLIDE_NEEDED, 10);
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ prog: 'boule' }), ok({ prog: 'milieu' })] })), 3, 'tous les programmes comptent');
  assert.equal(api.solidStreak(state({ history: [ok(), entry({ pain: null }), ok()] })), 2, 'sans ressenti noté : ignorée, pas cassée');
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ pain: 6 }), ok(), ok()] })), 1, 'une séance douloureuse remet à zéro');
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ stop: true, pain: null }), ok()] })), 1, 'un arrêt pour la jambe remet à zéro');
  assert.equal(api.solidStreak(state({ history: [ok({ next: 6 }), ok()] })), 0, 'le lendemain douloureux compte');
  assert.equal(api.solidStreak(state({ history: [ok({ painEx: ['pont'], skipped: ['pont'] })] })), 0, 'exercice passé pour douleur');
  assert.equal(api.normalize({ settings: { solideUnlocked: 'true' } }).settings.solideUnlocked, false, 'seul true débloque');
  const breath = Array.from({ length: 10 }, () => ok({ prog: 'difficile' }));
  assert.equal(api.solidStreak(state({ history: breath })), 0, '10 séances de respiration ne débloquent rien');
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ prog: 'calme' }), ok({ prog: 'fessiers' })] })), 2, 'une séance douce sans douleur ne casse pas la série');
  assert.equal(api.solidStreak(state({ history: [ok(), ok({ prog: 'calme', pain: 7 }), ok()] })), 1, 'une séance douce douloureuse la casse');
});

test('vélo d’appartement optionnel', () => {
  const s = state();
  assert.equal(s.settings.bike, true, 'inclus par défaut');
  assert.ok(api.progFor(s, 'dos').exercises.some(e => e.id === 'velo'));
  s.settings.bike = false;
  const dos = api.progFor(s, 'dos');
  assert.deepEqual(Array.from(dos.exercises, e => e.id), ['transverse', 'birddog', 'pont']);
  assert.ok(api.PROGRAMS.dos.exercises.some(e => e.id === 'velo'), 'le programme d’origine reste intact');
  assert.ok(!api.buildSteps(s, dos).some(st => st.ex && st.ex.id === 'velo'), 'aucune étape vélo');
  assert.ok(api.estMin(s, dos) < api.estMin(state(), api.PROGRAMS.dos), 'séance plus courte');
  assert.equal(api.progFor(s, 'fessiers'), api.PROGRAMS.fessiers, 'les autres programmes ne changent pas');
  assert.equal(api.normalize({ settings: { bike: false } }).settings.bike, false, 'le choix est gardé');
  assert.equal(api.normalize({ settings: {} }).settings.bike, true);
  assert.match(api.kineSummary(s, NOW), /vélo mis de côté/);
});

test('séance du jour proposée par Chouquette', () => {
  const day = n => iso(2026, 10, 18 - n);
  const ok = (prog, n, o) => entry(Object.assign({ prog, d: day(n), painBefore: 3, pain: 2 }, o));
  assert.equal(api.suggestToday(state(), NOW).prog, 'dos', 'première fois : routine de base');
  const today = api.suggestToday(state({ history: [entry({ d: iso(2026, 10, 18, 9) })] }), NOW);
  assert.equal(today.prog, 'calme'); assert.equal(today.rest, true, 'séance déjà faite aujourd’hui');
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1, { pain: 7 })] }), NOW).prog, 'difficile', 'douleur récente');
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1, { stop: true })] }), NOW).prog, 'difficile', 'arrêt pour la jambe');
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1, { pain: 4 })] }), NOW).prog, 'calme', 'dos sensible');
  assert.equal(api.suggestToday(state({ history: [ok('dos', 5, { pain: 8 })] }), NOW).prog, 'fessiers', 'vieille douleur : rotation normale');
  const checked = o => { const x = state(o); x.settings.milieuOk = true; return x; };
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1), ok('fessiers', 3)] }), NOW).prog, 'fessiers', 'Dos du milieu jamais proposé sans avis médical');
  assert.equal(api.suggestToday(checked({ history: [ok('dos', 1), ok('fessiers', 3)] }), NOW).prog, 'milieu', 'jamais fait passe en premier');
  assert.equal(api.suggestToday(checked({ history: [ok('dos', 1), ok('milieu', 2), ok('fessiers', 4)] }), NOW).prog, 'fessiers', 'le moins récent');
  assert.equal(api.normalize({ settings: { milieuOk: 'oui' } }).settings.milieuOk, false, 'seul true ouvre Dos du milieu');
  assert.match(api.kineSummary(state(), NOW), /Dos du milieu : en attente d’une vérification médicale/);
  const s = checked({ history: [ok('dos', 1), ok('milieu', 2), ok('fessiers', 3)] });
  s.settings.solideUnlocked = true;
  assert.equal(api.suggestToday(s, NOW).prog, 'solide', 'Dos solide entre dans la rotation une fois débloqué');
  for (const p of api.SUGGEST_ROTATION || []) assert.ok(api.PROGRAMS[p]);
});

test('séances de suite sans douleur', () => {
  const s = state({ history: [entry({ pain: 2, next: 2 }), entry({ pain: 3, prog: 'boule', next: 2 }), entry({ pain: 2, next: 2 }), entry({ pain: 7, next: 2 }), entry({ pain: 1, next: 1 })] });
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
  same(require('../source/privacy.js')(txt), [], 'pas de diagnostic');
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
    assert.ok(p.rest >= 0, `${p.id} : repos`);
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
