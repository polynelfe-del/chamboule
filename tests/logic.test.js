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
  let wk = D(2026, 10, 19);
  for (let k = 0; k < 80 && !api.weekChallenges(wk).some(c => c.id === 'velo15'); k++) wk = new Date(wk.getTime() + 7 * 86400000);
  const withBike = api.weekChallenges(wk).map(c => c.id), noBike = api.weekChallenges(wk, true).map(c => c.id);
  assert.ok(withBike.includes('velo15'), 'une semaine avec le défi vélo');
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
      entry({ d: days[2], stars: 2, prog: 'haut' }),
      entry({ d: days[2], stars: 1, prog: 'relax' })
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
  assert.equal(api.buildSteps(s, api.PROGRAMS.calme).length, 8, 'Dos calme : 7 étirements, genou vers la poitrine de chaque côté');
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
  assert.equal(api.suggestToday(state({ history: [ok('dos', 5, { pain: 8 })] }), NOW).prog, 'dos', 'vieille douleur ; Reprise dos pas faite depuis 3 jours : elle passe en premier');
  assert.equal(api.suggestToday(state({ history: [ok('fessiers', 1), ok('haut', 2), ok('dos', 4)] }), NOW).prog, 'dos', 'la routine du kiné revient au moins tous les 3 jours');
  const checked = o => { const x = state(o); x.settings.milieuOk = true; return x; };
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1), ok('fessiers', 4)] }), NOW).prog, 'haut', 'Haut du corps doux jamais fait : proposé');
  assert.equal(api.suggestToday(state({ history: [ok('dos', 1), ok('haut', 2), ok('fessiers', 4), ok('mcgill', 1), ok('jambes', 2)] }), NOW).prog, 'fessiers', 'Dos du milieu jamais proposé sans avis médical');
  assert.equal(api.suggestToday(checked({ history: [ok('dos', 1), ok('haut', 2), ok('fessiers', 4), ok('mcgill', 1), ok('jambes', 2)] }), NOW).prog, 'milieu', 'jamais fait passe en premier');
  assert.equal(api.suggestToday(checked({ history: [ok('dos', 1), ok('milieu', 2), ok('haut', 4), ok('fessiers', 5), ok('mcgill', 1), ok('jambes', 2)] }), NOW).prog, 'fessiers', 'le moins récent');
  assert.equal(api.normalize({ settings: { milieuOk: 'oui' } }).settings.milieuOk, false, 'seul true ouvre Dos du milieu');
  assert.match(api.kineSummary(state(), NOW), /Dos du milieu : en attente d’une vérification médicale/);
  const s = checked({ history: [ok('dos', 1), ok('milieu', 2), ok('haut', 4), ok('fessiers', 5), ok('mcgill', 1), ok('jambes', 2)] });
  s.settings.solideUnlocked = true;
  assert.equal(api.suggestToday(s, NOW).prog, 'solide', 'Dos solide entre dans la rotation une fois débloqué');
  for (const p of api.SUGGEST_ROTATION || []) assert.ok(api.PROGRAMS[p]);
});

test('suivi du lendemain : toutes les séances du même jour', () => {
  const a = entry({ d: iso(2026, 10, 17, 19) }), b = entry({ d: iso(2026, 10, 17, 9) }), c = entry({ d: iso(2026, 10, 16) });
  const s = state({ history: [a, b, c], xp: 1000 });
  assert.equal(api.applyNext(s, a.id, 2, NOW).id, a.id);
  assert.equal(a.next, 2);
  assert.equal(b.next, 2, 'la séance du matin est suivie aussi');
  assert.equal(c.next, null, 'pas celle de la veille');
  assert.equal(s.xp, 1020, '+20 XP une seule fois');
  assert.equal(api.applyNext(s, a.id, 5, NOW), null, 'déjà répondu');
});

test('progression automatique', () => {
  const day = n => iso(2026, 10, 18 - n);
  const calm = (prog, n, o) => entry(Object.assign({ prog, d: day(n), painBefore: 2, pain: 2, next: 2 }, o));
  const runs = (prog, k, from = 1, o) => Array.from({ length: k }, (_, i) => calm(prog, from + i, o));
  assert.equal(api.stepLevel(state({ history: runs('fessiers', 2) }), 'fessiers'), 0);
  assert.equal(api.stepLevel(state({ history: runs('fessiers', 3) }), 'fessiers'), 1, '3 séances calmes : un cran');
  assert.equal(api.stepLevel(state({ history: runs('fessiers', 9) }), 'fessiers'), 2, 'deux crans au plus');
  assert.equal(api.stepLevel(state({ history: runs('fessiers', 3, 1, { next: null }) }), 'fessiers'), 0, 'sans suivi du lendemain');
  assert.equal(api.stepLevel(state({ history: runs('fessiers', 3, 1, { skipped: ['coquillage'] }) }), 'fessiers'), 0, 'séance incomplète');
  assert.equal(api.stepLevel(state({ history: [calm('dos', 1, { painBefore: 5, pain: 5, next: 5 })].concat(runs('fessiers', 6, 2)) }), 'fessiers'), 1, 'une séance à 5/10 fait redescendre d’un cran');
  assert.equal(api.stepLevel(state({ history: runs('calme', 9) }), 'calme'), 0, 'pas de progression sur la mobilité');
  const s = state({ history: runs('fessiers', 3) });
  const f = api.progFor(s, 'fessiers'), by = id => f.exercises.find(e => e.id === id);
  assert.equal(f.level, 1);
  assert.equal(by('coquillage').target, 11, 'une répétition de plus');
  assert.equal(by('gainagelat').hold, 18, 'quelques secondes de maintien en plus');
  assert.equal(api.PROGRAMS.fessiers.exercises[0].target, 10, 'le programme d’origine reste intact');
  const d = api.progFor(state({ history: runs('dos', 9) }), 'dos'), ex = id => d.exercises.find(e => e.id === id);
  assert.equal(ex('pont').target, 8, 'pont : jamais au-delà de la fourchette du kiné');
  assert.equal(ex('birddog').target, 5, 'bras-jambe opposés : prescription du kiné inchangée');
  assert.equal(api.presc(state(), ex('pont'), 1), '8 répétitions');
  s.settings.fessiersSets = 2;
  assert.equal(api.setsFor(s, api.PROGRAMS.fessiers, api.EX.coquillage), 2, '2e série Fessiers doux');
  assert.equal(api.normalize({ settings: { fessiersSets: 5 } }).settings.fessiersSets, 2);
  assert.match(api.kineSummary(s, NOW), /Fessiers doux palier 1\/2/);
});

test('repos et bonus de Chouquette', () => {
  const e = (n, prog = 'dos') => entry({ d: iso(2026, 10, 18 - n, 18), prog, painBefore: 2, pain: 2, next: 2 });
  assert.equal(api.suggestToday(state({ history: [e(1), e(2, 'fessiers'), e(3)] }), NOW).rest, true, 'trois jours d’affilée : repos');
  assert.notEqual(api.suggestToday(state({ history: [e(1), e(2, 'fessiers')] }), NOW).rest, true, 'deux jours : pas encore');
  assert.notEqual(api.suggestToday(state({ history: [e(1), e(3, 'fessiers'), e(4)] }), NOW).rest, true, 'avec un jour de pause : pas de repos imposé');
  assert.equal(api.suggestBonus({ prog: 'fessiers' }, 'fessiers', 'done'), api.SUGGEST_BONUS);
  assert.equal(api.suggestBonus({ prog: 'fessiers' }, 'dos', 'done'), 0, 'autre programme');
  assert.equal(api.suggestBonus({ prog: 'calme', rest: true }, 'calme', 'done'), 0, 'pas de bonus un jour de repos');
  assert.equal(api.suggestBonus({ prog: 'fessiers' }, 'fessiers', 'early'), 0, 'séance écourtée');
});

test('rappels pour l’agenda', () => {
  const ics = api.reminderICS([5, 1, 3], '18:00', NOW);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\r\n/);
  assert.match(ics, /\r\nDTSTART:20261019T180000\r\n/, 'premier rappel : lundi 19 à 18 h');
  assert.match(ics, /END:VCALENDAR\r\n$/);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, 'ligne trop longue : ' + line);
  assert.equal(api.reminderICS([], '18:00', NOW), '');
  const uid = x => x.match(/UID:[^\r]+/)[0];
  assert.equal(uid(api.reminderICS([1, 3, 5, 6], '19:30', NOW)), uid(ics), 'même identifiant : le nouveau rappel remplace l’ancien');
  assert.ok(+api.reminderICS([1], '18:00', D(2026, 10, 20)).match(/SEQUENCE:(\d+)/)[1] > +ics.match(/SEQUENCE:(\d+)/)[1], 'numéro de version qui monte');
  assert.match(api.reminderICS([0], '20:30', NOW), /DTSTART:20261018T203000/, 'aujourd’hui si l’heure n’est pas passée');
  assert.match(api.reminderICS([0], '09:00', NOW), /DTSTART:20261025T090000/, 'sinon la semaine suivante');
  same(api.normalize({ settings: { reminderDays: [9, 1, 1, 'x', 3] } }).settings.reminderDays, [1, 3]);
  assert.equal(api.normalize({ settings: { reminderTime: '25:00' } }).settings.reminderTime, '18:00');
});

test('échelles de progression', () => {
  const day = n => iso(2026, 10, 18 - n);
  const calm = (prog, n) => entry({ prog, d: day(n), painBefore: 2, pain: 2, next: 2 });
  const s = state();
  assert.equal(api.progFor(s, 'haut').exercises[0].id, 'murpompe');
  s.settings.rungs = { pousser: 1, squat: 2 };
  assert.equal(api.progFor(s, 'haut').exercises[0].id, 'planpompe', 'version suivante');
  assert.ok(api.progFor(s, 'fessiers').exercises.some(e => e.id === 'fentesoutenue'), 'troisième version');
  assert.equal(api.PROGRAMS.haut.exercises[0].id, 'murpompe', 'le programme d’origine reste intact');
  const t = state({ history: Array.from({ length: 6 }, (_, i) => calm('haut', 1 + 2 * i)) });
  assert.equal(api.stepLevel(t, 'haut'), 2);
  same(api.rungsReady(t, 'haut').map(l => l.id), ['pousser', 'tirer', 'pencher'], 'dernier cran : versions suivantes prêtes');
  same(api.rungsReady(t, 'fessiers'), [], 'pas pour un autre programme');
  t.settings.stepReset = { haut: iso(2026, 10, 18, 9) };
  assert.equal(api.stepLevel(t, 'haut'), 0, 'les crans repartent de zéro après une nouvelle version');
  same(api.rungsReady(t, 'haut'), []);
  same(api.normalize({ settings: { rungs: { pousser: 9, inconnu: 1, tirer: 'x' } } }).settings.rungs, { pousser: 2 });
  assert.match(api.kineSummary(s, NOW), /Versions des exercices : Pousser 2\/3 \(Pompes au plan de travail\)/);
});

test('test de forme du mois', () => {
  const three = [1, 2, 3].map(n => entry({ d: iso(2026, 10, 18 - n * 2) }));
  assert.equal(api.testDue(state(), NOW), false, 'pas avant 3 séances');
  assert.equal(api.testDue(state({ history: three }), NOW), true, 'premier test');
  assert.equal(api.testDue(state({ history: three, tests: [{ d: iso(2026, 10, 8), chaise: 12, mur: 20 }] }), NOW), false, 'déjà fait il y a 10 jours');
  assert.equal(api.testDue(state({ history: three, tests: [{ d: iso(2026, 9, 10), chaise: 12, mur: 20 }] }), NOW), true, 'plus de 4 semaines');
  const n = api.normalize({ tests: [{ d: iso(2026, 10, 1), chaise: 500, mur: '18' }, { d: 'pas une date', chaise: 3 }, { d: iso(2026, 9, 1) }] }).tests;
  assert.equal(n.length, 1, 'mesures invalides écartées');
  assert.equal(n[0].chaise, 60); assert.equal(n[0].mur, 18);
  assert.match(api.kineSummary(state({ tests: [{ d: iso(2026, 10, 1), chaise: 14, mur: 22 }] }), NOW), /assis-debout 14, pompes au mur 22 \(ancien test/);
  const v2 = api.normalize({ tests: [{ d: iso(2026, 10, 10), v: 2, chaise: 35, mur: 12, pain: 3 }] }).tests[0];
  assert.equal(v2.chaise, api.TEST_CAP, 'nouveau test : 20 au plus');
  assert.equal(v2.pain, 3);
  assert.match(api.kineSummary(state({ tests: [v2] }), NOW), /au rythme, 20 au plus, douleur après 3\/10/);
  assert.ok(api.BADGES.find(b => b.id === 'forme').test(state({ tests: [{ d: iso(2026, 10, 1), chaise: 14 }] })));
});

test('douleur acceptable réglable avec le kiné', () => {
  const day = n => iso(2026, 10, 18 - n);
  const base4 = Array.from({ length: 12 }, (_, i) => entry({ prog: ['dos', 'fessiers', 'haut'][i % 3], d: day(1 + i), painBefore: 4, pain: 4, next: 4 }));
  const s = state({ history: base4 });
  assert.equal(api.solidStreak(s), 0, 'douleur de fond à 4/10 : rien ne compte avec le seuil par défaut');
  assert.equal(api.stepLevel(s, 'fessiers'), 0);
  s.settings.painMax = 4;
  assert.equal(api.solidStreak(s), 8, 'seuil à 4 : les séances de renforcement stables comptent');
  assert.equal(api.stepLevel(s, 'fessiers'), 1);
  const worse = state({ history: [entry({ d: day(1), painBefore: 4, pain: 5, next: 4 })] });
  worse.settings.painMax = 5;
  assert.equal(api.quietState(worse.history[0], 5), 'break', 'une aggravation pendant la séance casse toujours la série');
  assert.equal(api.normalize({ settings: { painMax: 9 } }).settings.painMax, 6, 'jamais au-delà de 6/10');
  assert.equal(api.normalize({ settings: {} }).settings.painMax, 3);
  assert.match(api.kineSummary(s, NOW), /Douleur acceptable pour progresser : 4\/10/);
});

test('rowing sans porte', () => {
  const s = state();
  assert.ok(api.progFor(s, 'haut').exercises.some(e => e.id === 'rowserviette'));
  s.settings.noDoor = true;
  const ids = api.progFor(s, 'haut').exercises.map(e => e.id);
  assert.ok(ids.includes('tirageserviette') && !ids.includes('rowserviette'), 'remplacé par le tirage à la serviette');
  s.settings.rungs = { tirer: 1 };
  assert.ok(!api.progFor(s, 'haut').exercises.some(e => e.id === 'rowpenche'), 'même avec la version penchée débloquée');
  assert.equal(((api.ILLUS.tirageserviette || {}).poses || []).length, 2, 'dessin');
  assert.equal(api.normalize({ settings: { noDoor: 'oui', doorChecked: 1 } }).settings.noDoor, false);
});

test('zone de la douleur', () => {
  const e = api.cleanEntry(entry({ zoneBefore: ['bas', 'bas', 'genou'], zone: 'bas', zoneNext: ['milieu'] }));
  same(e.zoneBefore, ['bas']); same(e.zone, []); same(e.zoneNext, ['milieu']);
  const a = entry({ d: iso(2026, 10, 17, 19) }), b = entry({ d: iso(2026, 10, 17, 9) });
  const s = state({ history: [a, b] });
  api.applyNext(s, a.id, 3, NOW, ['milieu']);
  same(a.zoneNext, ['milieu']); same(b.zoneNext, ['milieu'], 'aussi pour l’autre séance du jour');
  const c = entry({ d: iso(2026, 10, 16) }), t = state({ history: [c] });
  api.applyNext(t, c.id, 0, NOW, ['bas']);
  same(c.zoneNext, [], 'pas de zone sans douleur');
  const z = state({ history: [entry({ d: iso(2026, 10, 16), painBefore: 3, zoneBefore: ['bas'], pain: 2, zone: ['bas', 'fesse'], next: 1 })] });
  const txt = api.kineSummary(z, NOW);
  assert.match(txt, /Douleur : 3 \(bas du dos\) → 2 \(bas du dos, fesse\) → 1/);
  assert.match(txt, /Zones signalées sur la période : bas du dos \(2\), fesse \(1\)/);
  assert.match(api.kineSummary(state(), NOW), /Zones signalées sur la période : aucune précisée/);
});

test('point avec le kiné toutes les 4 semaines', () => {
  const four = [1, 2, 3, 4].map(n => entry({ d: iso(2026, 11, 6 - n) }));
  assert.equal(api.kineDue(state({ history: four }), D(2026, 11, 7)), false, 'moins de 4 semaines après la routine du 11 octobre');
  assert.equal(api.kineDue(state({ history: four }), D(2026, 11, 9)), true, '4 semaines après');
  assert.equal(api.kineDue(state({ history: four.slice(0, 2) }), D(2026, 11, 9)), false, 'pas avant 4 séances');
  const s = state({ history: four });
  s.settings.kineSnooze = D(2026, 11, 12).toISOString();
  assert.equal(api.kineDue(s, D(2026, 11, 9)), false, 'plus tard : une semaine de répit');
  s.settings.kineReview = D(2026, 11, 8).toISOString(); s.settings.kineSnooze = null;
  assert.equal(api.kineDue(s, D(2026, 11, 20)), false, 'revue récemment');
  assert.equal(api.kineDue(s, D(2026, 12, 7)), true, '4 semaines après la revue');
  assert.match(api.routineTag(s), /^Routine revue le 8 nov/);
  assert.match(api.routineTag(state()), /^Routine du 11 oct/);
  assert.match(api.kineSummary(s, D(2026, 11, 20)), /Routine Reprise dos : prescrite le 11\/10\/2026, revue avec le kiné le 08\/11\/2026/);
});

test('mode entretien et repère vélo', () => {
  const calm = d => entry({ prog: 'fessiers', d: iso(2026, 10, d), painBefore: 2, pain: 2, next: 2 });
  const s = state({ history: [16, 14, 12, 10, 8, 6].map(calm) });
  assert.equal(api.atTop(s, 'fessiers'), false, 'une version plus dure reste à débloquer');
  s.settings.rungs = { squat: 2 };
  assert.equal(api.atTop(s, 'fessiers'), true, 'dernier palier et dernière version');
  assert.equal(api.maintProgress(s, 'fessiers', NOW), api.MAINT_GOAL);
  const xp = s.xp;
  same(api.evalMaintenance(s, NOW), ['fessiers']);
  assert.equal(s.xp, xp + api.MAINT_XP);
  same(api.evalMaintenance(s, NOW), [], 'une fois par mois');
  s.maint['2026-01:fessiers'] = '2026-01-20';
  api.evalMaintenance(s, NOW);
  assert.ok(!('2026-01:fessiers' in s.maint), 'les vieux mois sont oubliés');
  const b = state({ history: [entry({ d: iso(2026, 10, 17), veloMin: 8 }), entry({ d: iso(2026, 10, 13), veloMin: 6.5 }), entry({ d: iso(2026, 10, 9), veloMin: 10 })] });
  assert.equal(api.weekBikeMin(b, NOW), 14.5, 'seulement cette semaine');
  same(api.normalize({ maint: { '2026-10:fessiers': '2026-10-18', x: '2026-10-18', '2026-10:inconnu': '2026-10-18' } }).maint, { '2026-10:fessiers': '2026-10-18' });
});

test('Calisthénie : quand le dos ne fait plus mal', () => {
  assert.equal(api.PROGRAMS.calis.exercises.length, 6);
  assert.ok(api.PROG_ORDER.includes('calis'));
  const calm = (n, o) => entry(Object.assign({ prog: ['dos', 'fessiers', 'solide'][n % 3], d: iso(2026, 10, 18 - n), painBefore: 1, pain: 1, next: 1 }, o));
  const s = state({ history: Array.from({ length: 12 }, (_, i) => calm(i + 1)) });
  assert.equal(api.calisStreak(s), 0, 'rien tant que Dos solide n’est pas débloqué');
  s.settings.solideUnlocked = true; s.settings.solideUnlockedAt = iso(2026, 10, 6, 12);
  assert.equal(api.calisStreak(s), 12 - 1, 'seulement les séances faites depuis le déblocage de Dos solide');
  s.history[3].pain = 3; s.history[3].painBefore = 3; s.history[3].next = 3;
  s.settings.painMax = 4;
  assert.equal(api.calisStreak(s), 3, '3/10 casse la série, même avec un seuil de progression monté à 4');
  assert.equal(api.normalize({ settings: { calisUnlocked: true } }).settings.calisUnlocked, false, 'jamais sans Dos solide');
  assert.equal(api.normalize({ settings: { calisUnlocked: true, solideUnlocked: true } }).settings.calisUnlocked, true);
  const u = state({ history: [entry({ prog: 'dos', d: iso(2026, 10, 17), painBefore: 1, pain: 1, next: 1 }), entry({ prog: 'haut', d: iso(2026, 10, 16), painBefore: 1, pain: 1, next: 1 }),
    entry({ prog: 'fessiers', d: iso(2026, 10, 14), painBefore: 1, pain: 1, next: 1 }), entry({ prog: 'solide', d: iso(2026, 10, 13), painBefore: 1, pain: 1, next: 1 }),
    entry({ prog: 'mcgill', d: iso(2026, 10, 17, 9), painBefore: 1, pain: 1, next: 1 }), entry({ prog: 'jambes', d: iso(2026, 10, 16, 9), painBefore: 1, pain: 1, next: 1 })] });
  u.settings.solideUnlocked = true; u.settings.calisUnlocked = true;
  assert.equal(api.suggestToday(u, NOW).prog, 'calis', 'proposée par Chouquette une fois débloquée');
  assert.match(api.kineSummary(s, NOW), /Programme Calisthénie : verrouillé \(3 \/ 10/);
  assert.match(api.kineSummary(state(), NOW), /Programme Calisthénie : verrouillé \(après Dos solide\)/);
});

test('Calisthénie : repli sans table, échelles reliées', () => {
  const s = state(); s.settings.solideUnlocked = true; s.settings.calisUnlocked = true;
  assert.ok(api.progFor(s, 'calis').exercises.some(e => e.id === 'rowtable'));
  s.settings.noTable = true;
  let ids = api.progFor(s, 'calis').exercises.map(e => e.id);
  assert.ok(ids.includes('rowpenche') && !ids.includes('rowtable'), 'sans table : rowing à la serviette penché');
  s.settings.noDoor = true;
  ids = api.progFor(s, 'calis').exercises.map(e => e.id);
  assert.ok(ids.includes('tirageserviette') && !ids.includes('rowpenche'), 'ni table ni porte : tirage à la serviette');
  for (const l of api.LADDERS) assert.ok(api.PROGRAMS.calis.exercises.some(e => e.id === l.next), `${l.id} mène à la Calisthénie`);
  assert.equal(api.normalize({ settings: { noTable: 'oui', tableChecked: 1 } }).settings.noTable, false);
  assert.match(api.kineSummary(s, NOW), /Rowing sous la table remplacé/);
});

test('alertes selon la zone de douleur', () => {
  const e = (n, o) => entry(Object.assign({ d: iso(2026, 10, 18 - n), painBefore: 2, pain: 2, next: 2 }, o));
  assert.equal(api.zoneAlert(state({ history: [e(1, { zone: ['fesse'] })] }), NOW), null, 'une seule fois : pas d’alerte');
  assert.equal(api.zoneAlert(state({ history: [e(1, { zone: ['fesse'] }), e(3, { zoneNext: ['fesse'] })] }), NOW).zone, 'fesse', 'deux séances de suite');
  assert.equal(api.zoneAlert(state({ history: [e(1, { zone: ['fesse'] }), e(10, { zone: ['fesse'] })] }), NOW), null, 'trop ancien');
  assert.equal(api.zoneAlert(state({ history: [e(1, { pain: 4, zone: ['milieu'] })] }), NOW), null, 'milieu du dos à 4/10 : pas d’alerte');
  const m = api.zoneAlert(state({ history: [e(1, { next: 6, zoneNext: ['milieu'] })] }), NOW);
  assert.equal(m.zone, 'milieu'); assert.equal(m.pain, 6);
  assert.equal(api.zoneAlert(state({ history: [e(1, { prog: 'haut' }), e(2, { pain: 6, zone: ['milieu'] })] }), NOW).zone, 'milieu', 'l’alerte tient malgré une séance depuis');
  assert.equal(api.zoneAlert(state({ history: [e(1, { prog: 'haut' }), e(4, { pain: 6, zone: ['milieu'] })] }), NOW), null, 'au-delà de 3 jours');
});

test('carnet de 2 000 séances et Vélo seul', () => {
  const many = Array.from({ length: 2100 }, (_, i) => entry({ d: new Date(2020, 0, 1 + i).toISOString() }));
  assert.equal(api.HISTORY_MAX, 2000);
  assert.equal(api.normalize({ history: many }).history.length, 2000, 'plus de 300 séances gardées');
  const s = state();
  assert.ok(api.PROG_ORDER.includes('cardio'));
  assert.equal(api.estMin(s, api.progFor(s, 'cardio')), s.settings.veloMin);
  s.settings.bike = false;
  assert.equal(api.progFor(s, 'cardio').exercises.length, 0, 'sans vélo, rien à jouer : le ticket le dit');
  assert.ok(!api.STRENGTH_PROGS.includes('cardio'), 'le vélo seul ne compte pas pour Dos solide');
});

test('Chouquette propose le Vélo seul', () => {
  const e = (prog, n, o) => entry(Object.assign({ prog, d: iso(2026, 10, 18 - n), painBefore: 2, pain: 2, next: 2 }, o));
  const s = state({ history: [e('fessiers', 1), e('haut', 3), e('dos', 6, { veloMin: 10 })] });
  assert.equal(api.suggestToday(s, NOW).prog, 'cardio', 'pas de vélo depuis 4 jours');
  s.settings.bike = false;
  assert.notEqual(api.suggestToday(s, NOW).prog, 'cardio', 'vélo mis de côté');
  const r = state({ history: [e('fessiers', 1), e('dos', 2, { veloMin: 10 }), e('haut', 6)] });
  assert.notEqual(api.suggestToday(r, NOW).prog, 'cardio', 'vélo il y a 2 jours');
  const n = state({ history: [e('fessiers', 1), e('haut', 3)] });
  assert.notEqual(api.suggestToday(n, NOW).prog, 'cardio', 'jamais de vélo : on n’insiste pas');
  const p = state({ history: [e('fessiers', 1, { pain: 7 }), e('dos', 6, { veloMin: 10 })] });
  assert.equal(api.suggestToday(p, NOW).prog, 'difficile', 'la douleur passe avant le cardio');
});

test('écrans : paliers calculés une fois, programmes rangés', () => {
  const calm = d => entry({ prog: 'fessiers', d: iso(2026, 10, d), painBefore: 2, pain: 2, next: 2 });
  const s = state({ history: [16, 14, 12].map(calm) });
  api.memoStart();
  assert.equal(api.stepLevel(s, 'fessiers'), 1);
  s.history = [];
  assert.equal(api.stepLevel(s, 'fessiers'), 1, 'gardé le temps de dessiner l’écran');
  api.memoEnd();
  assert.equal(api.stepLevel(s, 'fessiers'), 0, 'recalculé ensuite');
  const ids = api.PROG_GROUPS.flatMap(g => g.ids);
  same(ids.slice().sort(), api.PROG_ORDER.slice().sort(), 'chaque programme dans une seule famille');
  assert.equal(new Set(ids).size, ids.length);
});

test('nouveaux programmes : McGill, jambes, express, étirements, relaxation', () => {
  for (const id of ['mcgill', 'jambes', 'express', 'etirements', 'relax']) {
    assert.ok(api.PROG_ORDER.includes(id), id);
    assert.ok(api.PROG_GROUPS.some(g => g.ids.includes(id)), `${id} rangé dans une famille`);
  }
  assert.ok(api.STRENGTH_PROGS.includes('mcgill') && !api.STRENGTH_PROGS.includes('etirements'), 'McGill compte pour Dos solide, pas les étirements');
  const s = state();
  assert.ok(api.estMin(s, api.PROGRAMS.express) <= 6, 'séance express courte : ' + api.estMin(s, api.PROGRAMS.express) + ' min');
  assert.equal(api.estMin(s, api.PROGRAMS.relax), 6, 'relaxation : 5 minutes de respiration, environ 6 avec l’installation');
  assert.equal(api.presc(s, api.EX.coherence, 1), '30 respirations lentes');
  assert.equal(api.setsFor(s, api.PROGRAMS.express, api.PROGRAMS.express.exercises[2]), 1, 'une série chacun');
  assert.ok(api.CHALLENGES.some(c => c.id === 'zen'));
});

test('Dos calme : tous les étirements du dos et du bassin', () => {
  const ids = api.PROGRAMS.calme.exercises.map(e => e.id);
  for (const id of ['genouinterieur', 'papillon', 'deuxgenoux', 'bascule', 'genoupoitrine', 'rouleau', 'talons']) assert.ok(ids.includes(id), id);
  assert.ok(ids.indexOf('genouinterieur') < ids.indexOf('papillon'), 'un genou puis l’autre, puis les deux genoux qui s’ouvrent');
  assert.equal(api.estMin(api.defaultState(), api.PROGRAMS.calme), 9);
  const e = (n, o) => entry(Object.assign({ prog: 'dos', d: iso(2026, 10, 18 - n), painBefore: 3, pain: 4, next: null }, o));
  assert.equal(api.suggestToday(state({ history: [e(1)] }), NOW).prog, 'calme', 'dos sensible : Chouquette propose ces étirements');
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
  uniq(api.LADDERS.map(l => l.id), 'échelles');
  for (const l of api.LADDERS) {
    assert.ok(api.PROGRAMS[l.prog].exercises.some(e => e.id === l.rungs[0]), `${l.id} : première version dans ${l.prog}`);
    for (const id of l.rungs) {
      assert.ok(api.EX[id] && api.EX[id].cue.length > 20, `${l.id} : exercice ${id}`);
      assert.equal(((api.ILLUS[id] || {}).poses || []).length, 2, `dessin pour ${id}`);
    }
  }
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
