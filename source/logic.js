/* Chamboule Coach : données et logique du jeu.
   Aucun accès à la page ni au stockage ici : tout est testable dans tests/logic.test.js. */

/* ---------- Exercices ---------- */
const EX = {
  transverse: { id: 'transverse', name: 'Respiration du transverse', kind: 'breath', target: 5, tempo: 8,
    cue: 'Sur le dos, genoux pliés, pieds à plat. Inspire par le nez, puis expire longuement en rentrant doucement le bas du ventre.',
    tip: 'Suis le cercle : il grossit quand tu inspires, rapetisse quand tu expires.' },
  birddog: { id: 'birddog', name: 'Bird-dog', kind: 'reps', target: 5, sides: true, tempo: 5,
    cue: 'À quatre pattes, dos neutre. Tends lentement un bras et la jambe opposée, tiens 2 secondes, puis reviens.',
    tip: 'Le bassin ne bouge pas, comme si un verre d’eau était posé sur ton dos.' },
  pont: { id: 'pont', name: 'Pont fessier', kind: 'reps', target: 6, max: 8, tempo: 4,
    cue: 'Sur le dos, pieds à plat. Serre les fessiers et monte le bassin, sans accentuer la cambrure.',
    tip: 'Monte jusqu’à l’alignement épaules, hanches, genoux. Pas plus haut.' },
  velo: { id: 'velo', name: 'Vélo d’appartement', kind: 'timer',
    cue: 'Résistance légère, buste peu penché. Tu dois pouvoir parler en pédalant.',
    tip: 'Allonge la durée petit à petit, d’une séance à l’autre, dans les réglages.' },
  hipthrust: { id: 'hipthrust', name: 'Hip thrust', kind: 'reps', target: 12, sets: 4, tempo: 3,
    cue: 'Haut du dos appuyé sur un banc ou le canapé. Pousse le bassin vers le haut en serrant les fessiers.',
    tip: 'Menton rentré, côtes basses : pas de cambrure en haut du mouvement.' },
  fentes: { id: 'fentes', name: 'Fentes arrière', kind: 'reps', target: 10, sides: true, sideLabel: 'jambe', sets: 3, tempo: 3,
    cue: 'Recule une jambe, descends le genou arrière vers le sol, remonte en poussant sur le talon avant.',
    tip: 'Buste droit, genou avant au-dessus de la cheville.' },
  donkey: { id: 'donkey', name: 'Donkey kicks', kind: 'reps', target: 15, sides: true, sets: 3, tempo: 2,
    cue: 'À quatre pattes, pousse un talon vers le plafond, genou plié à 90°.',
    tip: 'Le dos reste plat : le mouvement vient de la fesse, pas des lombaires.' },
  sumo: { id: 'sumo', name: 'Squats sumo', kind: 'reps', target: 12, sets: 3, tempo: 3,
    cue: 'Pieds écartés, pointes vers l’extérieur. Descends buste droit, genoux dans l’axe des pieds.',
    tip: 'Descends seulement tant que ton dos reste neutre.' },
  hydrant: { id: 'hydrant', name: 'Fire hydrant', kind: 'reps', target: 10, sides: true, free: true, sets: 1, tempo: 2,
    cue: 'À quatre pattes, ouvre le genou sur le côté sans faire pivoter le bassin.',
    tip: 'Activation : arrête quand tu sens bien la fesse travailler.' },
  chatvache: { id: 'chatvache', name: 'Chat-vache', kind: 'reps', target: 6, tempo: 6,
    cue: 'À quatre pattes, mains sous les épaules. En expirant, arrondis lentement le dos ; en inspirant, creuse-le légèrement. Un aller-retour, une répétition.',
    tip: 'Petite amplitude, sans forcer dans le bas du dos.' },
  rotation: { id: 'rotation', name: 'Rotations assises', kind: 'reps', target: 5, sides: true, tempo: 4,
    cue: 'Assis, dos long, bras croisés sur la poitrine. Tourne lentement le buste d’un côté, puis reviens au centre.',
    tip: 'Sans chercher l’amplitude maximale. Le bassin reste face à l’avant.' },
  thorax: { id: 'thorax', name: 'Ouverture thoracique', kind: 'reps', target: 6, tempo: 5,
    cue: 'Assis ou debout, mains derrière la nuque. Ouvre doucement les coudes et la poitrine, puis relâche.',
    tip: 'Le bas du dos ne se creuse pas : c’est le haut du dos qui s’ouvre.' },
  gainage: { id: 'gainage', name: 'Gainage abdominal léger', kind: 'hold', target: 6, hold: 8,
    cue: 'Sur le dos, genoux pliés. En expirant, rentre doucement le nombril vers la colonne et tiens en respirant calmement.',
    tip: 'Le dos ne bouge pas : on serre seulement le ventre en profondeur. Pas de crunch.' },
  planche: { id: 'planche', name: 'Planche sur genoux', kind: 'hold', target: 2, hold: 12,
    cue: 'Coudes sous les épaules, genoux au sol, ventre rentré, dos droit des épaules aux genoux.',
    tip: 'Commence par 10 à 15 secondes. Arrête si le bas du dos se creuse.' },
  marche: { id: 'marche', name: 'Marche', kind: 'timer', minutes: 10,
    cue: 'Marche à ton rythme, épaules relâchées. Allonge la durée petit à petit tant que la douleur reste tolérable.',
    tip: 'Dehors, dans le couloir ou sur place : tout compte.' }
};

const PROGRAMS = {
  dos: { id: 'dos', name: 'Reprise dos', tag: 'Routine du 11 oct. 2026', rest: 30, xpBase: 100,
    blurb: 'Gainage doux, fessiers et cardio léger, adaptés à ton dos. À faire valider par ton kiné.',
    exercises: [EX.transverse, EX.birddog, EX.pont, EX.velo] },
  milieu: { id: 'milieu', name: 'Dos du milieu', tag: 'Mobilité douce', rest: 20, xpBase: 100,
    blurb: 'Mobilité et gainage profond, sans crunch ni mouvement brusque. Pour la marche, la balade du chien fait déjà le travail. Pont fessier et bird-dog sont dans Reprise dos. À faire valider par ton médecin ou ton kiné.',
    exercises: [EX.chatvache, EX.rotation, EX.thorax, EX.gainage, EX.planche] },
  difficile: { id: 'difficile', name: 'Jour difficile', tag: 'Séance douce · 3 min', rest: 30, xpBase: 50,
    blurb: 'Juste la respiration, pour garder le rythme sans rien forcer. Pour les jours où le dos est sensible.',
    exercises: [{ ...EX.transverse, sets: 2 }] },
  boule: { id: 'boule', name: 'Boule qui chamboule', tag: 'Programme fessiers · nov. 2025', rest: 45, xpBase: 100,
    blurb: 'Ton ancien programme fessiers. Il date d’avant les adaptations pour ton dos et n’a pas été revalidé.',
    exercises: [EX.hipthrust, EX.fentes, EX.donkey, EX.sumo, EX.hydrant] },
  essai: { id: 'essai', name: 'Essai', tag: '', rest: 0, xpBase: 0, practice: true, blurb: '',
    exercises: [{ id: 'essai', name: 'Essai : 3 lancers', kind: 'reps', target: 3, tempo: 3, prescText: 'Tape 3 fois au bon moment',
      cue: 'Pas besoin de bouger. Regarde le cercle se remplir. Quand il devient jaune et que ça bipe, tape : la balle part sur les boîtes.',
      tip: 'Si tu tapes trop tôt, la balle rate. Ici, la lenteur gagne toujours.' }] }
};
const PROG_ORDER = ['dos', 'milieu', 'difficile', 'boule'];

const LEVELS = ['Ticket d’entrée', 'Barbe à papa', 'Pomme d’amour', 'As du chamboule-tout', 'Étoile du manège', 'Cœur de la fête', 'Grande roue', 'Feu d’artifice', 'Légende de la foire'];
const LINES = {
  intro: ['Ici, la vitesse ne rapporte rien. Le contrôle, si.', 'Lentement. C’est comme ça qu’on gagne à ce jeu.', 'Respire, et laisse le cercle se remplir.', 'Un mouvement propre vaut mieux que trois rapides.'],
  rest: ['Récup. Bois une gorgée d’eau.', 'Relâche les épaules et souffle.', 'Belle série. On reprend dans un instant.', 'Secoue les jambes, détends la nuque.']
};
const BADGES = [
  { id: 'premier', name: 'Premier ticket', desc: 'Finir une première séance', glyph: '1', test: s => s.history.length >= 1 },
  { id: 'combo10', name: 'Tout en contrôle', desc: '10 reps parfaites d’affilée', glyph: 'x10', test: s => s.bestCombo >= 10 },
  { id: 'etoiles', name: 'Trois étoiles', desc: 'Une séance à 3 étoiles', glyph: '★', test: s => s.history.some(h => h.stars === 3) },
  { id: 'semaine', name: 'Semaine pleine', desc: '3 jours d’entraînement dans la même semaine', glyph: '3J', test: s => [...daysByWeek(s.history).values()].some(d => d.size >= 3) },
  { id: 'suivi5', name: 'Carnet à jour', desc: '5 suivis du lendemain remplis', glyph: '5', test: s => s.history.filter(h => h.next != null).length >= 5 },
  { id: 'velo60', name: 'Roue libre', desc: '60 min de vélo au total', glyph: "60'", test: s => s.history.reduce((a, h) => a + (h.veloMin || 0), 0) >= 60 },
  { id: 's10', name: 'Habitué de la foire', desc: '10 séances terminées', glyph: '10', test: s => s.history.length >= 10 },
  { id: 's30', name: 'Pilier de la fête', desc: '30 séances terminées', glyph: '30', test: s => s.history.length >= 30 },
  { id: 'chamboule', name: 'Boule qui chamboule', desc: 'Première séance du programme fessiers', glyph: 'BQC', test: s => s.history.some(h => h.prog === 'boule') }
];

/* Défis de la semaine : trois tirés au sort chaque lundi. Aucun ne pousse au volume ni à forcer. */
const CHALLENGES = [
  { id: 'stars3', name: 'Trois étoiles', desc: 'Réussir une séance à 3 étoiles', goal: 1, prog: w => w.filter(h => h.stars === 3).length },
  { id: 'combo8', name: 'Combo de 8', desc: 'Enchaîner 8 répétitions parfaites', goal: 8, prog: w => Math.max(0, ...w.map(h => h.combo || 0)) },
  { id: 'next2', name: 'Carnet du lendemain', desc: 'Remplir 2 suivis du lendemain', goal: 2, prog: w => w.filter(h => h.next != null).length },
  { id: 'days2', name: 'Fidèle au poste', desc: 'T’entraîner 2 jours différents', goal: 2, prog: w => new Set(w.map(h => dayKey(h.d))).size },
  { id: 'clean', name: 'Lent et propre', desc: '90 % de reps parfaites sur une séance', goal: 1, prog: w => w.filter(h => h.reps >= 8 && h.perfect / h.reps >= 0.9).length },
  { id: 'velo15', name: 'Roue libre', desc: '15 min de vélo dans la semaine', goal: 15, prog: w => Math.floor(w.reduce((a, h) => a + (h.veloMin || 0), 0)) },
  { id: 'hf1', name: 'Mains libres', desc: 'Faire une séance en mode mains libres', goal: 1, prog: w => w.filter(h => h.hf).length },
  { id: 'feel2', name: 'À l’écoute', desc: 'Noter ton ressenti après 2 séances', goal: 2, prog: w => w.filter(h => h.pain != null).length },
  { id: 'pyr', name: 'Tout chambouler', desc: 'Faire tomber une pyramide entière', goal: 1, prog: w => w.filter(h => (h.pyramids || 0) > 0).length },
  { id: 'pyr3', name: 'Démolition douce', desc: 'Faire tomber 3 pyramides dans la semaine', goal: 3, prog: w => w.reduce((a, h) => a + (h.pyramids || 0), 0) },
  { id: 'stars2x', name: 'Doublé', desc: '2 séances à 2 étoiles ou plus', goal: 2, prog: w => w.filter(h => h.stars >= 2).length },
  { id: 'combo12', name: 'Combo de 12', desc: 'Enchaîner 12 répétitions parfaites', goal: 12, prog: w => Math.max(0, ...w.map(h => h.combo || 0)) },
  { id: 'days3', name: 'Trois cœurs', desc: 'Remplir 3 cœurs cette semaine', goal: 3, prog: w => new Set(w.map(h => dayKey(h.d))).size },
  { id: 'douceur', name: 'Douceur', desc: 'Faire une séance Jour difficile ou Dos du milieu', goal: 1, prog: w => w.filter(h => h.prog === 'difficile' || h.prog === 'milieu').length },
  { id: 'save1', name: 'Prudence', desc: 'Exporter ta sauvegarde cette semaine', goal: 1, prog: (w, s, now) => (s.settings.lastExport && weekKey(new Date(s.settings.lastExport)) === weekKey(now) ? 1 : 0) }
];
/* Tenues de Chouquette : gagnées avec les niveaux et les badges, jamais avec le volume d'entraînement. */
const OUTFITS = [
  { id: 'noeud', name: 'Nœud lilas', unlock: 'Offert', test: () => true },
  { id: 'noeud-or', name: 'Nœud doré', unlock: 'Niveau 2', test: s => levelInfo(s.xp).n >= 2 },
  { id: 'bandeau', name: 'Bandeau de sport', unlock: 'Badge Tout en contrôle', test: s => !!s.badges.combo10 },
  { id: 'lunettes', name: 'Lunettes de star', unlock: 'Niveau 3', test: s => levelInfo(s.xp).n >= 3 },
  { id: 'fleur', name: 'Fleur', unlock: 'Badge Carnet à jour', test: s => !!s.badges.suivi5 },
  { id: 'coeur-lunettes', name: 'Lunettes cœur', unlock: 'Badge Trois étoiles', test: s => !!s.badges.etoiles },
  { id: 'chapeau', name: 'Chapeau de fête', unlock: 'Badge Semaine pleine', test: s => !!s.badges.semaine },
  { id: 'couronne', name: 'Couronne', unlock: 'Niveau 5', test: s => levelInfo(s.xp).n >= 5 }
];
function weekChallenges(d) {
  let h = 7;
  for (const ch of weekKey(d)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = CHALLENGES.slice(), out = [];
  for (let i = 0; i < 3; i++) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
  return out;
}

/* ---------- Utilitaires ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const pad = n => String(n).padStart(2, '0');

function startOfWeek(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function weekKey(d) { const s = startOfWeek(d); return s.getFullYear() + '-' + (s.getMonth() + 1) + '-' + s.getDate(); }
function dayKey(d) { const x = new Date(d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
function daysByWeek(hist) {
  const m = new Map();
  hist.forEach(h => { const k = weekKey(new Date(h.d)); if (!m.has(k)) m.set(k, new Set()); m.get(k).add(dayKey(h.d)); });
  return m;
}
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return ''; } }
function fmtDateLong(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return ''; } }
function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }
function fmtMin(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 }); }
function exName(id) { return (EX[id] || {}).name || id; }

/* ---------- État & sauvegarde ---------- */
const LS = 'chamboule-coach.v1';
function defaultState() {
  return { v: 1, xp: 0, bestCombo: 0, settings: { sets: 1, veloMin: 10, weeklyGoal: 3, sound: true, handsFree: false, tutorialDone: false, bouleUnlocked: false, bouleUnlockedAt: null, lastExport: null, exportSnooze: null, outfit: 'noeud' }, badges: {}, challenges: {}, history: [] };
}
/* Tout ce qui vient d’un fichier importé ou du stockage est revérifié et converti au bon type :
   aucune valeur lue n’arrive telle quelle dans la page. */
const EX_IDS = new Set(Object.keys(EX));
const BADGE_IDS = new Set(BADGES.map(b => b.id));
const CHAL_IDS = new Set(CHALLENGES.map(c => c.id));
const BACKS = ['ok', 'sensible', 'douleur', 'stop'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
function numOr(v, lo, hi, dflt, int) {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return dflt;
  let n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  if (int) n = Math.round(n);
  return Math.min(hi, Math.max(lo, n));
}
function isoOr(v) { if (typeof v !== 'string') return null; const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : null; }
function cleanDayMap(m, allowed) {
  const out = {};
  if (m && typeof m === 'object') for (const [k, v] of Object.entries(m)) if (allowed.has(k) && typeof v === 'string' && DAY_RE.test(v)) out[k] = v;
  return out;
}
function cleanEntry(h) {
  if (!h || typeof h !== 'object') return null;
  const d = isoOr(h.d); if (!d) return null;
  const ids = a => Array.isArray(a) ? [...new Set(a.filter(x => typeof x === 'string' && EX_IDS.has(x)))] : [];
  const prog = typeof h.prog === 'string' && Object.prototype.hasOwnProperty.call(PROGRAMS, h.prog) && !PROGRAMS[h.prog].practice ? h.prog : 'dos';
  return {
    id: typeof h.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(h.id) ? h.id : 's' + Date.parse(d).toString(36),
    d, prog,
    score: numOr(h.score, 0, 1e6, 0, true), xp: numOr(h.xp, 0, 1e5, null, true),
    stars: numOr(h.stars, 0, 3, 0, true), perfect: numOr(h.perfect, 0, 1e4, 0, true), reps: numOr(h.reps, 0, 1e4, 0, true),
    combo: numOr(h.combo, 0, 1e4, 0, true), veloMin: numOr(h.veloMin, 0, 600, 0, false), walkMin: numOr(h.walkMin, 0, 600, 0, false), pyramids: numOr(h.pyramids, 0, 1000, 0, true),
    skipped: ids(h.skipped), painEx: ids(h.painEx),
    stop: h.stop === true, back: BACKS.includes(h.back) ? h.back : null, hf: h.hf === true,
    painBefore: numOr(h.painBefore, 0, 10, null, true), legBefore: h.legBefore === true,
    pain: numOr(h.pain, 0, 10, null, true), leg: typeof h.leg === 'boolean' ? h.leg : null,
    next: numOr(h.next, 0, 10, null, true), nextAt: isoOr(h.nextAt),
    durS: numOr(h.durS, 0, 86400, 0, true)
  };
}
function cleanSettings(s, d) {
  s = s && typeof s === 'object' ? s : {};
  return {
    sets: numOr(s.sets, 1, 3, d.sets, true), veloMin: numOr(s.veloMin, 3, 45, d.veloMin, true), weeklyGoal: numOr(s.weeklyGoal, 1, 7, d.weeklyGoal, true),
    sound: typeof s.sound === 'boolean' ? s.sound : d.sound, handsFree: s.handsFree === true, tutorialDone: s.tutorialDone === true,
    bouleUnlocked: s.bouleUnlocked === true, bouleUnlockedAt: isoOr(s.bouleUnlockedAt),
    lastExport: isoOr(s.lastExport), exportSnooze: isoOr(s.exportSnooze),
    outfit: typeof s.outfit === 'string' && OUTFITS.some(o => o.id === s.outfit) ? s.outfit : 'noeud'
  };
}
function normalize(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const challenges = {};
  if (raw.challenges && typeof raw.challenges === 'object') {
    for (const [k, v] of Object.entries(raw.challenges)) if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)) challenges[k] = cleanDayMap(v, CHAL_IDS);
  }
  return {
    v: 1,
    xp: numOr(raw.xp, 0, 1e7, 0, true),
    bestCombo: numOr(raw.bestCombo, 0, 1e4, 0, true),
    settings: cleanSettings(raw.settings, d.settings),
    badges: cleanDayMap(raw.badges, BADGE_IDS),
    challenges,
    history: Array.isArray(raw.history) ? raw.history.slice(0, 300).map(cleanEntry).filter(Boolean) : []
  };
}

/* ---------- Calculs ----------
   Fonctions pures : elles reçoivent l’état (s) et la date (now) au lieu de les lire elles-mêmes.
   Elles sont couvertes par les tests de tests/logic.test.js. */
function threshold(n) { return 150 * n * (n - 1); }
function levelInfo(xp) {
  let n = 1; while (xp >= threshold(n + 1)) n++;
  const base = threshold(n), next = threshold(n + 1);
  return { n, name: LEVELS[Math.min(n - 1, LEVELS.length - 1)], base, next, into: xp - base, span: next - base, pct: Math.round(((xp - base) / (next - base)) * 100) };
}
function weekDays(s, d) { return (daysByWeek(s.history).get(weekKey(d)) || new Set()).size; }
function weekStreak(s, now = new Date()) {
  const m = daysByWeek(s.history), goal = s.settings.weeklyGoal;
  const size = d => (m.get(weekKey(d)) || new Set()).size;
  const w = startOfWeek(now); let n = 0;
  if (size(w) >= goal) n++;
  w.setDate(w.getDate() - 7);
  while (size(w) >= goal) { n++; w.setDate(w.getDate() - 7); }
  return n;
}
/* Catégorie du dos après la séance, à partir de la douleur notée de 0 à 10 (après et le lendemain). */
function backCat(h) {
  if (h.stop || h.back === 'stop') return 'stop';
  if (h.pain == null) return h.back || null;
  if (h.leg) return 'douleur';
  const before = h.painBefore ?? h.pain;
  const rank = v => (v >= 7 || v - before >= 3) ? 2 : (v - before >= 1 && v > 2) ? 1 : 0;
  const worst = Math.max(rank(h.pain), h.next != null ? rank(h.next) : 0);
  return ['ok', 'sensible', 'douleur'][worst];
}
function painFreeRun(s) {
  let n = 0;
  for (const h of s.history) {
    if (h.prog !== 'dos') continue;
    const okNext = h.next == null || h.next <= (h.painBefore ?? h.pain ?? 0) + 1;
    if (backCat(h) === 'ok' && okNext && !(h.painEx && h.painEx.length)) n++; else break;
  }
  return n;
}
function pendingNextDay(s, now = new Date()) {
  const today = dayKey(now);
  const h = s.history.find(x => dayKey(x.d) !== today);
  if (!h || h.next != null) return null;
  if (now.getTime() - new Date(h.d).getTime() > 3 * 86400000) return null;
  return h;
}
function weekEntries(s, now = new Date()) { const k = weekKey(now); return s.history.filter(h => weekKey(new Date(h.d)) === k); }
function chalProgress(s, c, now = new Date()) { return Math.min(c.goal, c.prog(weekEntries(s, now), s, now)); }
/* Donne les défis réussis cette semaine (+50 XP chacun, une seule fois) et oublie les semaines de plus d’un mois. */
function evalChallenges(s, now = new Date()) {
  const k = weekKey(now);
  s.challenges = s.challenges || {};
  const done = s.challenges[k] || (s.challenges[k] = {});
  const fresh = [];
  weekChallenges(now).forEach(c => { if (!done[c.id] && chalProgress(s, c, now) >= c.goal) { done[c.id] = dayKey(now); s.xp += 50; fresh.push(c); } });
  const keep = new Set(); const w = startOfWeek(now);
  for (let i = 0; i < 4; i++) { keep.add(weekKey(w)); w.setDate(w.getDate() - 7); }
  Object.keys(s.challenges).forEach(x => { if (!keep.has(x)) delete s.challenges[x]; });
  return fresh;
}
function evalBadges(s, now = new Date()) {
  const fresh = [];
  BADGES.forEach(b => { if (!s.badges[b.id] && b.test(s)) { s.badges[b.id] = dayKey(now); fresh.push(b); } });
  return fresh;
}
function unlockedOutfits(s) { return OUTFITS.filter(o => o.test(s)).map(o => o.id); }
function setsFor(s, prog, ex) { return prog.id === 'dos' ? s.settings.sets : (ex.sets || 1); }
function sideText(ex, side) { return ex.sideLabel === 'jambe' ? 'jambe ' + (side === 'droit' ? 'droite' : 'gauche') : 'côté ' + side; }
function timerMin(s, ex) { return ex.id === 'velo' ? s.settings.veloMin : (ex.minutes || 10); }
function presc(s, ex, sets) {
  if (ex.prescText) return ex.prescText;
  if (ex.kind === 'timer') return ex.id === 'velo' ? s.settings.veloMin + ' min, résistance légère' : timerMin(s, ex) + ' min, à ton rythme';
  if (ex.kind === 'hold') return (sets > 1 ? sets + ' × ' : '') + ex.target + ' maintiens de ' + ex.hold + ' s';
  const side = ex.sides ? ' par ' + (ex.sideLabel || 'côté') : '';
  if (ex.kind === 'breath') return (sets > 1 ? sets + ' × ' : '') + ex.target + ' respirations lentes';
  if (ex.free) return 'Activation, environ ' + ex.target + side;
  const reps = ex.max ? ex.target + ' à ' + ex.max : String(ex.target);
  return sets > 1 ? sets + ' × ' + reps + side : reps + ' répétitions' + side;
}
function estMin(s, p) {
  let t = 0;
  p.exercises.forEach(ex => {
    if (ex.kind === 'timer') { t += timerMin(s, ex) * 60; return; }
    const sets = setsFor(s, p, ex);
    t += sets * (ex.max || ex.target) * (ex.kind === 'hold' ? ex.hold + 4 : ex.tempo) * (ex.sides ? 2 : 1) + (sets - 1) * p.rest + 30;
  });
  return Math.max(2, Math.round(t / 60));
}
/* Déroulé d’une séance : une étape par série et par côté ; un chrono compte pour une seule étape. */
function buildSteps(s, prog) {
  const steps = [];
  prog.exercises.forEach((ex, ei) => {
    if (ex.kind === 'timer') { steps.push({ ex, ei, set: 1, sets: 1, side: null }); return; }
    const sets = setsFor(s, prog, ex);
    for (let n = 1; n <= sets; n++) (ex.sides ? ['droit', 'gauche'] : [null]).forEach(side => steps.push({ ex, ei, set: n, sets, side }));
  });
  return steps;
}
/* XP d’une séance : la qualité compte, pas le volume. Un exercice passé pour douleur ne pénalise pas. */
function computeXP(prog, r) {
  const considered = prog.exercises.map(e => e.id).filter(id => !r.painEx.includes(id));
  const done = considered.filter(id => !r.skipped.includes(id)).length;
  const completion = considered.length ? done / considered.length : 0;
  const quality = r.reps ? r.perfect / r.reps : 1;
  return Math.round(prog.xpBase * completion * (0.6 + 0.4 * quality)) + 30;
}
function computeStars(reason, r) {
  if (reason === 'pain') return 0;
  const quality = r.reps ? r.perfect / r.reps : 1;
  const realSkips = r.skipped.filter(id => !r.painEx.includes(id));
  return quality >= 0.8 && !realSkips.length ? 3 : quality >= 0.5 ? 2 : 1;
}
/* Pyramide de boîtes : rangées du bas vers le haut, n boîtes au total. */
function canRows(n) {
  const rows = []; let left = n, b = Math.ceil((Math.sqrt(8 * n + 1) - 1) / 2);
  while (left > 0) { const k = Math.min(b, left); rows.push(k); left -= k; b = Math.max(1, b - 1); }
  return rows;
}
function backupDue(s, now, inClaude) {
  if (inClaude || s.history.length < 3) return false;
  const st = s.settings;
  if (st.exportSnooze && now < Date.parse(st.exportSnooze)) return false;
  return !st.lastExport || now - Date.parse(st.lastExport) > 30 * 86400000;
}
/* Résumé texte des 30 derniers jours, pour le kiné. Ne contient que ce qui a été noté dans l’appli. */
function kineSummary(s, now = new Date()) {
  const from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0, 0, 0, 0);
  const list = s.history.filter(h => new Date(h.d) >= from).slice().reverse();
  const days = new Set(list.map(h => dayKey(h.d))).size;
  const st = s.settings;
  const L = [];
  L.push('Suivi Chamboule Coach');
  L.push(`Période : du ${from.toLocaleDateString('fr-FR')} au ${now.toLocaleDateString('fr-FR')}`);
  L.push(`Séances : ${list.length}, sur ${days > 1 ? days + ' jours différents' : days + ' jour'}`);
  L.push(`Réglages actuels : ${st.sets} série${st.sets > 1 ? 's' : ''} par exercice au sol, vélo ${st.veloMin} min`);
  L.push(`Programme Boule qui chamboule : ${st.bouleUnlocked ? 'débloqué' + (st.bouleUnlockedAt ? ' le ' + new Date(st.bouleUnlockedAt).toLocaleDateString('fr-FR') : '') + ' (validation kiné déclarée)' : 'verrouillé'}`);
  L.push('');
  L.push('Douleur de dos notée de 0 à 10 : avant la séance → juste après → le lendemain.');
  L.push('');
  if (!list.length) L.push('Aucune séance sur la période.');
  const painCount = {};
  list.forEach(h => {
    const p = PROGRAMS[h.prog] || { name: h.prog };
    L.push(`${fmtDateLong(h.d)} · ${p.name}${h.hf ? ' (mains libres)' : ''}`);
    L.push(`  Douleur : ${h.painBefore ?? '?'} → ${h.pain ?? '?'} → ${h.next ?? '?'}`);
    if (h.legBefore) L.push('  Symptômes dans la jambe AVANT la séance');
    if (h.leg) L.push('  Symptômes dans la jambe APRÈS la séance');
    if (backCat(h) === 'stop') L.push('  Séance arrêtée : douleur dans la jambe ou fourmillements');
    if (h.painEx && h.painEx.length) { L.push('  Passé pour douleur : ' + h.painEx.map(exName).join(', ')); h.painEx.forEach(id => { painCount[id] = (painCount[id] || 0) + 1; }); }
    const other = (h.skipped || []).filter(id => !(h.painEx || []).includes(id));
    if (other.length) L.push('  Non fait : ' + other.map(exName).join(', '));
    if (h.veloMin) L.push(`  Vélo : ${fmtMin(h.veloMin)} min`);
    if (h.walkMin) L.push(`  Marche : ${fmtMin(h.walkMin)} min`);
  });
  L.push('');
  const pc = Object.entries(painCount);
  L.push('Exercices passés pour douleur sur la période : ' + (pc.length ? pc.map(([id, n]) => `${exName(id)} (${n})`).join(', ') : 'aucun'));
  return L.join('\n');
}
