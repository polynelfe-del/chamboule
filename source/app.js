/* Chamboule Coach : écrans, jeu et sauvegarde (tout ce qui touche à la page). */

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
const app = $('#app');

function lsGet() { try { const t = localStorage.getItem(LS); return t ? JSON.parse(t) : null; } catch { return null; } }
function lsSet(obj) { try { localStorage.setItem(LS, JSON.stringify(obj)); } catch {} }

let state = defaultState();
let mode = 'local';
let uid = null;
let cloudRef = null;
let downloadsApi = null;
let writeChain = Promise.resolve();
let warnedSave = false;

function body() { return JSON.parse(JSON.stringify({ v: 1, xp: state.xp, bestCombo: state.bestCombo, settings: state.settings, badges: state.badges, challenges: state.challenges, history: state.history })); }
function persist() {
  clearTimeout(persistTimer);
  const b = body();
  lsSet({ ...b, owner: uid });
  if (!cloudRef) return;
  const ref = cloudRef;
  writeChain = writeChain
    .then(() => ref.set(b).catch(e => {
      if (e && e.code === 'unavailable') return new Promise(r => setTimeout(r, 700 + Math.random() * 600)).then(() => ref.set(b));
      throw e;
    }))
    .catch(() => {
      if (!warnedSave) { warnedSave = true; toast('Sauvegarde en ligne impossible pour l’instant. Ta progression reste gardée sur cet appareil.'); }
    });
}
let persistTimer = 0;
function persistSoon() { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 600); }

async function initStore() {
  const local = lsGet();
  if (local) state = normalize(local);
  if (!window.claude) {
    // Appli du téléphone : on demande au système de ne pas effacer le stockage en cas de manque de place.
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch {}
  }
  renderScreen();
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  let db = null, user = null;
  try { [db, user, downloadsApi] = await Promise.all([c.use('db'), c.use('user'), c.use('downloads')]); } catch {}
  if (downloadsApi && ui.screen === 'summary') renderScreen({ fromSync: true });
  if (user) { try { uid = await user.id(); } catch { uid = null; } }
  if (!db || !uid) return;
  if (local && local.owner && local.owner !== uid) { state = defaultState(); renderScreen({ fromSync: true }); }
  let ref;
  try { ref = db.doc('data/users/' + uid + '/coach'); } catch { return; }
  let first = true;
  ref.onSnapshot(snap => {
    const wasFirst = first; first = false;
    cloudRef = ref; mode = 'cloud';
    if (snap.exists) {
      state = normalize(snap.data());
      lsSet({ ...body(), owner: uid });
    } else if (wasFirst && local && !local.owner && ((local.history && local.history.length) || local.xp)) {
      persist();
    }
    renderScreen({ fromSync: true });
  }, () => { cloudRef = null; mode = 'local'; renderScreen({ fromSync: true }); });
}

/* ---------- Son, voix, vibrations ---------- */
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { AC = null; } }
  if (AC && AC.state === 'suspended') { try { AC.resume(); } catch {} }
  return AC;
}
function tone(freq, dur, type, gain, when) {
  if (!state.settings.sound) return;
  const ac = audio(); if (!ac) return;
  try {
    const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.03);
  } catch {}
}
const SFX = {
  perfect() { tone(784, .09, 'triangle', .14); tone(1175, .16, 'triangle', .12, .07); },
  fast() { tone(196, .14, 'sawtooth', .05); },
  ready() { tone(988, .14, 'sine', .11); tone(1319, .2, 'sine', .08, .1); },
  set() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, 'triangle', .13, i * .08)); },
  tick() { tone(880, .05, 'sine', .08); },
  low() { tone(330, .08, 'sine', .08); },
  go() { tone(660, .08, 'square', .06); tone(990, .14, 'square', .06, .09); },
  end() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .2, 'square', .055, i * .12)); },
  whoosh() { sweep(260, 900, .24, 'sine', .05); },
  clang() { tone(1480, .09, 'triangle', .11); tone(2220, .16, 'sine', .06, .02); },
  chamboule() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .14, 'square', .05, .3 + i * .07)); }
};
function sweep(f1, f2, dur, type, gain) {
  if (!state.settings.sound) return;
  const ac = audio(); if (!ac) return;
  try {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || .06, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + .03);
  } catch {}
}
let voiceOK = (() => { try { return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function'; } catch { return false; } })();
function say(text) {
  if (!state.settings.sound || !voiceOK) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = 1;
    speechSynthesis.speak(u);
  } catch { voiceOK = false; }
}
function hush() { try { voiceOK && speechSynthesis.cancel(); } catch {} }
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch {} }

let wl = null;
async function wakeLock(on) {
  try {
    if (on) { if ('wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener && wl.addEventListener('release', () => { wl = null; }); } }
    else if (wl) { const w = wl; wl = null; await w.release(); }
  } catch { wl = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ui.screen === 'game') wakeLock(true); });

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}
function confetti() {
  if (reduceMotion) return;
  const layer = $('#confetti');
  const colors = ['var(--ticket)', 'var(--prize)', 'var(--accent)', 'var(--ok)'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('i');
    c.className = 'conf' + (i % 3 === 1 ? ' st' : i % 3 === 2 ? ' dot' : '');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    c.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
    c.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
    c.style.animationDelay = (Math.random() * .5) + 's';
    layer.appendChild(c);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 4200);
}

/* ---------- Blocs partagés ---------- */
function redFlagsHTML(compact) {
  return `<section class="alert${compact ? ' compact' : ''}" aria-label="Signes d’alerte">
    <h2>Signes d’alerte</h2>
    <p><b>Appelle le 15 (ou le 112)</b> en cas de perte de sensibilité entre les cuisses ou autour de l’anus, de difficulté à uriner ou à te retenir, ou d’une jambe qui lâche ou faiblit de plus en plus.</p>
    ${compact ? '' : '<p><b>Consulte rapidement</b> si la douleur descend dans les deux jambes, s’accompagne de fièvre, d’une perte de poids inexpliquée ou de douleurs au ventre, ou ne se calme ni au repos ni la nuit.</p>'}
  </section>`;
}
function scaleHTML(action, value, extra) {
  const btns = Array.from({ length: 11 }, (_, n) => `<button data-action="${action}" data-v="${n}" ${extra || ''} aria-pressed="${value === n}" aria-label="${n} sur 10">${n}</button>`).join('');
  return `<div class="scale" role="group" aria-label="Douleur de 0 à 10">${btns}</div><div class="scale-legend"><span>0 = aucune douleur</span><span>10 = la pire imaginable</span></div>`;
}
function legHTML(action, value) {
  return `<div class="seg2" role="group" aria-label="Douleur ou fourmillements dans la jambe">
    <button data-action="${action}" data-v="0" aria-pressed="${value === false}">Non</button>
    <button data-action="${action}" data-v="1" aria-pressed="${value === true}">Oui</button>
  </div>`;
}

/* ---------- Écrans ---------- */
const ui = { screen: 'home', unlockOpen: null, unlockChecked: false, resetArm: false, historyAll: false, sheet: null, pre: null, nextMsg: null, summaryBack: 'home', afterPractice: null, importData: null, tab: 'play', openTickets: new Set(), allProgs: false };

function renderScreen(opts = {}) {
  if (ui.screen === 'home') app.innerHTML = homeHTML();
  else if (ui.screen === 'settings') app.innerHTML = settingsHTML();
  else if (ui.screen === 'precheck') { if (!opts.fromSync) app.innerHTML = precheckHTML(); }
  else if (ui.screen === 'summary') app.innerHTML = summaryHTML();
  else if (ui.screen === 'result' && !opts.fromSync) renderResult();
  const xpEl = ui.screen === 'home' ? $('#home-xp') : null;
  if (xpEl) {
    if (opts.fromSync || opts.still || reduceMotion) { xpEl.style.transition = 'none'; xpEl.style.width = xpEl.dataset.w + '%'; }
    else requestAnimationFrame(() => { xpEl.style.width = xpEl.dataset.w + '%'; });
  }
}

function homeHTML() {
  const lv = levelInfo(state.xp);
  const goal = state.settings.weeklyGoal;
  const wk = weekDays(state, new Date());
  const streak = weekStreak(state);
  const bulbs = Array.from({ length: Math.max(goal, wk) }, (_, i) => `<span class="bulb${i < wk ? ' lit' : ''}"></span>`).join('');
  const last = state.history[0];
  const lastCat = last ? backCat(last) : null;
  const run = painFreeRun(state);
  const pend = pendingNextDay(state);
  let notices = '';
  if (ui.nextMsg) notices += `<div class="notice warn"><b>${esc(ui.nextMsg.title)}</b><span>${esc(ui.nextMsg.text)}</span></div>`;
  if (pend) {
    notices += `<section class="card next-card" aria-label="Suivi du lendemain">
      <p class="eyebrow">Suivi du lendemain · +20 XP</p>
      <h2 class="section-title">Ton dos aujourd’hui, après ta séance de ${esc(fmtDate(pend.d))} ?</h2>
      ${scaleHTML('next', null, `data-id="${esc(pend.id)}"`)}
    </section>`;
  }
  if (last && (lastCat === 'douleur' || lastCat === 'stop') && !ui.nextMsg) {
    notices += `<div class="notice warn"><b>Ta dernière séance s’est finie avec de la douleur.</b><span>Si elle persiste ou descend dans la jambe, vois ton kiné avant de rejouer. La séance Jour difficile reste possible si elle ne réveille rien.</span></div>`;
  } else if (state.settings.sets === 1 && run >= 6) {
    notices += `<div class="notice good"><b>${run} séances de suite sans douleur.</b><span>Demande à ton kiné si tu peux passer à 2 séries. Le réglage est dans les réglages.</span></div>`;
  }
  const earned = BADGES.filter(b => state.badges[b.id]).length;
  const gear = `<button class="icon-btn" data-action="settings" aria-label="Réglages">${ICON.gear}</button>`;
  const wkDone = (state.challenges || {})[weekKey(new Date())] || {};
  const chalWon = weekChallenges(new Date(), !state.settings.bike).filter(c => wkDone[c.id]).length;
  let main;
  if (ui.tab === 'progress') {
    main = `
    <header class="top"><div class="brand"><h1>Progrès</h1><p>Défis, badges et régularité.</p></div>${gear}</header>
    ${challengesHTML()}
    ${wardrobeHTML()}
    <section aria-label="Badges">
      <div class="badges-head"><h2 class="section-title">Badges</h2><p>${earned} / ${BADGES.length}</p></div>
      <div class="badges">${BADGES.map(badgeHTML).join('')}</div>
    </section>
    <section aria-label="Jours d’entraînement par semaine">
      <h2 class="section-title">Jours d’entraînement par semaine</h2>
      ${chartHTML()}
    </section>`;
  } else if (ui.tab === 'log') {
    main = `
    <header class="top"><div class="brand"><h1>Carnet</h1><p>Tes séances et ta douleur, pour toi et ton kiné.</p></div>${gear}</header>
    <section aria-label="Historique">
      <h2 class="section-title">Historique</h2>
      ${historyHTML()}
    </section>
    <section class="rules" aria-label="Règles du jeu">
      <h2 class="section-title">Les règles du jeu</h2>
      <ul>
        <li>Le cercle se remplit pendant ta répétition. Tape quand il est jaune, un bip te prévient : la balle part et <b>fait tomber une boîte</b>. Trop tôt, elle rate.</li>
        <li>Toute la pyramide par terre : bonus <b>Chamboulé</b>. Plus lent, c’est toujours parfait.</li>
        <li>Allongé ou à quatre pattes, active <b>Mains libres</b> : l’appli rythme et compte pour toi, à voix haute.</li>
        <li>Douleur qui descend dans la jambe ou fourmillements : <b>on arrête tout de suite</b> avec le bouton Douleur. Tu gardes tes points.</li>
        <li>Un exercice passé pour douleur ne coûte aucune étoile.</li>
        <li>Ces programmes sont à faire valider par ton kiné.</li>
      </ul>
    </section>
    <section class="rules" aria-label="À éviter avec ton dos">
      <h2 class="section-title">À éviter avec ton dos</h2>
      <ul>
        <li>Crunchs, sit-ups et relevés de buste complets.</li>
        <li>Torsions rapides ou forcées, grandes extensions du bas du dos.</li>
        <li>Porter des charges depuis le sol.</li>
        <li>Tout exercice qui donne une douleur vive, qui dure après, ou qui descend dans une jambe.</li>
        <li>Rester complètement immobile plusieurs jours : bouger doucement aide plus que le repos total.</li>
      </ul>
    </section>
    <p class="foot">${mode === 'cloud' ? 'Progression sauvegardée sur ton compte, sur tous tes appareils.' : window.claude ? 'Progression sauvegardée dans ce navigateur.' : 'Progression gardée dans ce téléphone. Pense à l’exporter de temps en temps (Réglages).'}</p>`;
  } else {
    main = `
    <header class="top">
      <div class="brand">
        <h1>Chamboule<br>Coach<span class="spark-txt" aria-hidden="true">✦</span></h1>
        <p>Dos, fessiers, cardio. Un tap par répétition.</p>
      </div>
      ${gear}
    </header>

    ${todayCardHTML()}

    ${notices}
    ${backupReminderHTML()}

    <section class="card player" aria-label="Ta progression">
      <div class="player-top">
        ${lvlToken(lv.n)}
        <div class="player-main">
          <p class="eyebrow">Niveau ${lv.n}</p>
          <p class="lvl-name">${esc(lv.name)}</p>
          <div class="xpbar" role="progressbar" aria-label="Points d’expérience" aria-valuemin="0" aria-valuemax="${lv.span}" aria-valuenow="${lv.into}"><i id="home-xp" data-w="${lv.pct}"></i></div>
          <p class="xp-meta"><b>${state.xp}</b> XP · encore ${lv.next - state.xp} pour le niveau ${lv.n + 1}</p>
        </div>
      </div>
      <div class="stats3">
        <div class="stat"><b>${state.history.length}</b><span>séances</span></div>
        <div class="stat"><b>${streak}</b><span>semaines d’affilée</span></div>
        <div class="stat"><b>${state.bestCombo}</b><span>meilleur combo</span></div>
      </div>
    </section>

    <section class="card week" aria-label="Cette semaine">
      <div class="week-head"><h2 class="section-title">Cette semaine</h2><p><b>${wk}</b> / ${goal} jours</p></div>
      <div class="bulbs" aria-hidden="true">${bulbs}</div>
      <p class="week-meta">${wk >= goal ? 'Objectif atteint. Profite aussi des jours de repos, ils font partie du programme.' : `Chaque jour d’entraînement remplit un cœur, un seul par jour. Encore ${goal - wk} pour l’objectif.`}</p>
      <button class="link-row" data-action="tab" data-tab="progress"><span>Défis de la semaine : <b>${chalWon} / 3</b> gagnés</span>${ICON.chev}</button>
      ${state.settings.solideUnlocked ? '' : `<button class="link-row" data-action="show-solide"><span>Dos solide : <b>${Math.min(solidStreak(state), SOLIDE_NEEDED)} / ${SOLIDE_NEEDED}</b> séances de renfo sans douleur</span>${ICON.chev}</button>`}
    </section>

    <section class="programs" aria-label="Tous les programmes">
      <button class="link-row big" data-action="all-progs" aria-expanded="${ui.allProgs}"><span>${ui.allProgs ? 'Masquer les programmes' : `Tous les programmes (${PROG_ORDER.length})`}</span>${ICON.chev}</button>
      ${ui.allProgs ? PROG_ORDER.map(ticketHTML).join('') : ''}
    </section>

    ${redFlagsHTML(false)}`;
  }
  return `
  <div class="awning" aria-hidden="true"></div>
  <main class="page with-tabs">${main}
  </main>
  ${tabbarHTML()}
  ${ui.sheet ? exSheetHTML(ui.sheet) : ''}`;
}

function tabbarHTML() {
  const t = (id, label, icon) => `<button class="tab" data-action="tab" data-tab="${id}"${ui.tab === id ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
  return `<nav class="tabbar" aria-label="Sections"><div class="tabbar-in">${t('play', 'Jouer', ICON.tPlay)}${t('progress', 'Progrès', ICON.tTrophy)}${t('log', 'Carnet', ICON.tBook)}</div></nav>`;
}

function bikeChipHTML(id) {
  if (!hasBike(PROGRAMS[id])) return '';
  const on = state.settings.bike;
  return `<button class="bike-chip" role="switch" aria-checked="${on}" data-action="bike-toggle" aria-label="Inclure le vélo d’appartement">${ICON.bike(false)}<span>${on ? 'Avec vélo' : 'Sans vélo'}</span></button>`;
}
function todayCardHTML() {
  const sug = suggestToday(state);
  const p = progFor(state, sug.prog);
  const strip = p.exercises.map(ex => `<button class="ex-thumb" data-action="ex-open" data-ex="${ex.id}" data-prog="${p.id}" aria-label="Voir l’exercice ${esc(ex.name)} en images">${illusMini(ex.id)}</button>`).join('');
  return `<section class="card today" aria-label="Séance du jour">
    <p class="eyebrow">${sug.rest ? 'Si tu en as envie' : 'Séance du jour'}</p>
    ${buddyHTML(sug.why, sug.prog === 'difficile' || sug.rest ? 'calm' : 'happy', 'sm')}
    <div class="today-prog"><h2 class="section-title">${esc(p.name)}</h2><span class="est">≈ ${estMin(state, p)} min · ${p.exercises.length} exercice${p.exercises.length > 1 ? 's' : ''}</span>${bikeChipHTML(p.id)}</div>
    <div class="ex-strip">${strip}</div>
    <button class="btn play big" data-action="play" data-prog="${p.id}">${ICON.play} Jouer</button>
  </section>`;
}
function ticketHTML(id) {
  const p = progFor(state, id);
  const locked = (id === 'boule' && !state.settings.bouleUnlocked) || (id === 'solide' && !state.settings.solideUnlocked);
  const n = p.exercises.length, open = n === 1 || ui.openTickets.has(id);
  const strip = p.exercises.map(ex => `<button class="ex-thumb" data-action="ex-open" data-ex="${ex.id}" data-prog="${id}" aria-label="Voir l’exercice ${esc(ex.name)} en images">${illusMini(ex.id)}</button>`).join('');
  const toggle = n > 1 ? `<button class="link-btn ticket-toggle" data-action="ticket-toggle" data-prog="${id}" aria-expanded="${open}">${open ? 'Masquer le détail' : `Voir le détail des ${n} exercices`}</button>` : '';
  const list = p.exercises.map(ex => `<li><button class="ex-row" data-action="ex-open" data-ex="${ex.id}" data-prog="${id}" aria-label="Voir l’exercice ${esc(ex.name)} en images">${illusMini(ex.id)}<span class="ex-txt"><b>${esc(ex.name)}</b><span>${esc(presc(state, ex, setsFor(state, p, ex)))}</span></span>${ICON.chev}</button></li>`).join('');
  let foot;
  if (id === 'milieu' && !state.settings.milieuOk) foot = `<div class="unlock-progress"><span class="est">Avant ce programme, fais vérifier par un médecin l’origine de ta douleur au milieu du dos, surtout si elle s’accompagne de douleurs au ventre.</span><button class="btn ghost" data-action="milieu-ok">Un médecin a vérifié</button></div>`;
  else if (!locked) foot = `<div class="t-row"><span class="est">≈ ${estMin(state, p)} min · ${p.exercises.length} exercice${p.exercises.length > 1 ? 's' : ''}</span><button class="btn play" data-action="play" data-prog="${id}">${ICON.play} Jouer</button></div>`;
  else if (id === 'solide' && solidStreak(state) < SOLIDE_NEEDED) {
    const k = solidStreak(state);
    foot = `<div class="unlock-progress"><div class="chal-bar" role="progressbar" aria-label="Séances de renforcement sans douleur d’affilée" aria-valuemin="0" aria-valuemax="${SOLIDE_NEEDED}" aria-valuenow="${k}"><i style="width:${Math.round((k / SOLIDE_NEEDED) * 100)}%"></i></div><span class="est">${k} / ${SOLIDE_NEEDED} séances de renforcement d’affilée à 3/10 au plus, lendemain compris (Reprise dos, Dos du milieu, Fessiers doux)</span></div>`;
  }
  else if (ui.unlockOpen !== id) foot = `<div class="t-row"><span class="est">${id === 'solide' ? 'Ton dos va bien : prêt à débloquer' : 'À débloquer avec ton kiné'}</span><button class="btn ${id === 'solide' ? 'primary' : 'ghost'}" data-action="unlock-open" data-prog="${id}">${ICON.lock} Débloquer</button></div>`;
  else foot = unlockPanelHTML(id);
  return `
  <article class="ticket ${id}${locked ? ' locked' : ''}">
    <div class="ticket-head">
      <h3>${esc(p.name)}</h3>
      ${locked ? `<span class="lockchip">${ICON.lock} Verrouillé</span>` : `<p>${esc(p.tag)}</p>`}
    </div>
    <div class="perf" aria-hidden="true"></div>
    <div class="ticket-body">
      <p${open ? '' : ' class="clamp"'}>${esc(p.blurb)}</p>
      ${open ? `<ul class="ex-list">${list}</ul>` : `<div class="ex-strip">${strip}</div>`}
      ${toggle}
      ${locked ? '' : bikeChipHTML(id)}
      ${foot}
    </div>
  </article>`;
}

function exSheetHTML(key) {
  const [progId, exId] = key.split(':');
  const p = PROGRAMS[progId], ex = p && p.exercises.find(e => e.id === exId);
  if (!ex) return '';
  return `<div class="sheet-wrap" data-action="ex-close-bg"><div class="ex-sheet" role="dialog" aria-modal="true" aria-labelledby="ex-t">
    <div class="ex-sheet-top"><div><p class="eyebrow">${esc(p.name)}</p><h2 id="ex-t">${esc(ex.name)}</h2></div><button class="icon-btn" data-action="ex-close" aria-label="Fermer">${ICON.close}</button></div>
    ${illusFull(ex.id)}
    <p class="presc">${esc(presc(state, ex, setsFor(state, p, ex)))}</p>
    <p>${esc(ex.cue)}</p>
    ${ex.tip ? `<p class="tip">${esc(ex.tip)}</p>` : ''}
    <p class="tip">En lilas : ce qui bouge. Le côté pâle est le côté opposé.</p>
  </div></div>`;
}

function unlockPanelHTML(id) {
  const solide = id === 'solide';
  return `<div class="unlock">
    <p>${solide ? `Ton dos va bien depuis ${solidStreak(state)} séances de renforcement d’affilée. Avant de passer au niveau supérieur, demande l’accord de ton kiné.` : 'Ce programme date de novembre 2025, avant les adaptations pour ton dos. Pour ta reprise, la priorité reste la routine Reprise dos.'}</p>
    <label class="check"><input type="checkbox" id="unlock-check" ${ui.unlockChecked ? 'checked' : ''}> ${solide ? 'Mon kiné est d’accord pour que je progresse' : 'Mon kiné a validé ce programme pour ma situation actuelle'}</label>
    <div class="t-row">
      <button class="btn primary" id="unlock-confirm" data-action="unlock-confirm" data-prog="${id}" ${ui.unlockChecked ? '' : 'disabled'}>Débloquer</button>
      <button class="btn ghost" data-action="unlock-cancel">Plus tard</button>
    </div>
  </div>`;
}

/* Chouquette porte la tenue choisie, sauf si on en demande une autre (garde-robe). */
function mascot(mood, outfit) { return mascotSVG(mood, outfit || state.settings.outfit); }
function wardrobeHTML() {
  const cur = state.settings.outfit || 'noeud';
  const items = OUTFITS.map(o => {
    const open = o.test(state), on = open && o.id === cur;
    return `<button class="outfit${on ? ' on' : ''}${open ? '' : ' locked'}" data-action="outfit" data-id="${o.id}" ${open ? '' : 'disabled'} aria-pressed="${on}">${mascot('happy', o.id)}<b>${esc(o.name)}</b><span>${open ? (on ? 'Portée' : 'Mettre') : ICON.lock + esc(o.unlock)}</span></button>`;
  }).join('');
  return `<section class="card wardrobe" aria-label="Garde-robe de Chouquette">
    <div class="badges-head"><h2 class="section-title">Garde-robe de Chouquette</h2><p>${unlockedOutfits(state).length} / ${OUTFITS.length}</p></div>
    <div class="outfits">${items}</div>
  </section>`;
}
function buddyHTML(text, mood, size) {
  return `<div class="buddy ${size || ''}">${mascot(mood)}<p class="bubble"><b>Chouquette</b>${esc(text)}</p></div>`;
}

function lvlToken(n) {
  const bulbs = Array.from({ length: 10 }, (_, i) => `<span class="marq" style="--a:${i * 36}deg;--d:${(i * 0.12).toFixed(2)}s"></span>`).join('');
  return `<div class="lvl-token" aria-hidden="true">${bulbs}<b>${n}</b></div>`;
}

function challengesHTML() {
  const done = (state.challenges || {})[weekKey(new Date())] || {};
  const items = weekChallenges(new Date(), !state.settings.bike).map(c => {
    const p = chalProgress(state, c), won = !!done[c.id];
    return `<li class="chal${won ? ' won' : ''}">
      <div class="chal-txt"><b>${esc(c.name)}</b><span>${esc(c.desc)}</span>
        <div class="chal-bar" role="progressbar" aria-label="${esc(c.name)}" aria-valuemin="0" aria-valuemax="${c.goal}" aria-valuenow="${p}"><i style="width:${Math.round((p / c.goal) * 100)}%"></i></div>
        <small>${p} / ${c.goal}</small></div>
      ${won ? '<span class="stamp">Gagné</span>' : '<span class="chal-prize"><b>+50</b>XP</span>'}
    </li>`;
  }).join('');
  return `<section class="card chal-card" aria-label="Défis de la semaine">
    <div class="badges-head"><h2 class="section-title">Défis de la semaine</h2><p>nouveaux lundi</p></div>
    <ul class="chal-list">${items}</ul>
  </section>`;
}

function badgeHTML(b) {
  const got = !!state.badges[b.id];
  const glyph = b.glyph === '★' ? ICON.star('') : esc(b.glyph);
  return `<div class="badge${got ? '' : ' locked'}"><div class="medal" aria-hidden="true">${glyph}</div><b>${esc(b.name)}</b><span>${esc(b.desc)}</span><span class="sr">${got ? 'obtenu' : 'pas encore obtenu'}</span></div>`;
}

function chartHTML() {
  const goal = state.settings.weeklyGoal;
  const ws = startOfWeek(new Date());
  const m = daysByWeek(state.history);
  const weeks = [];
  for (let k = 7; k >= 0; k--) { const s = new Date(ws); s.setDate(s.getDate() - 7 * k); weeks.push({ s, c: (m.get(weekKey(s)) || new Set()).size, now: k === 0 }); }
  const max = Math.max(goal, ...weeks.map(w => w.c), 1);
  const W = 320, H = 150, pl = 20, pr = 6, pt = 14, pb = 24;
  const iw = W - pl - pr, ih = H - pt - pb, bw = iw / 8, barW = Math.min(22, bw - 10), base = pt + ih;
  const y = v => base - (v / max) * ih;
  const ticks = [...new Set([0, goal, max])].sort((a, b) => a - b);
  let g = '';
  ticks.forEach(t => { g += `<line class="c-grid" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="c-txt" x="${pl - 6}" y="${y(t) + 3.5}" text-anchor="end">${t}</text>`; });
  g += `<line class="c-goal" x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}"/><text class="c-txt" x="${W - pr}" y="${y(goal) - 5}" text-anchor="end">objectif</text>`;
  weeks.forEach((w, i) => {
    const x = pl + bw * i + (bw - barW) / 2;
    if (w.c > 0) {
      const top = y(w.c), r = Math.min(4, base - top);
      g += `<path class="c-bar${w.now ? ' now' : ''}" d="M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z"/>`;
    }
    const lbl = w.now ? 'cette sem.' : w.s.getDate() + '/' + (w.s.getMonth() + 1);
    g += `<text class="c-txt" x="${x + barW / 2}" y="${H - 6}" text-anchor="middle">${lbl}</text>`;
    const tipTxt = (w.now ? 'Cette semaine' : 'Semaine du ' + w.s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })) + ' · ' + w.c + ' jour' + (w.c > 1 ? 's' : '');
    g += `<rect class="c-hit" x="${pl + bw * i}" y="${pt}" width="${bw}" height="${ih}" tabindex="0" data-tip="${esc(tipTxt)}" data-x="${x + barW / 2}" data-y="${w.c ? y(w.c) : base}" aria-label="${esc(tipTxt)}"/>`;
  });
  const rows = weeks.map(w => `<tr><td>${w.s.toLocaleDateString('fr-FR')}</td><td>${w.c}</td></tr>`).join('');
  return `<div class="chart-wrap">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Jours d’entraînement par semaine sur les 8 dernières semaines, objectif ${goal}">${g}</svg>
    <div class="chart-tip" id="chart-tip" hidden></div>
    <table class="sr"><caption>Jours d’entraînement par semaine</caption><tr><th>Semaine du</th><th>Jours</th></tr>${rows}</table>
  </div>`;
}

function backChip(h) {
  const c = backCat(h);
  return ({ ok: '<span class="chip ok">Dos OK</span>', sensible: '<span class="chip warn">Dos sensible</span>', douleur: '<span class="chip danger">Dos douloureux</span>', stop: '<span class="chip danger">Arrêt jambe</span>' })[c] || '<span class="chip muted">Dos ?</span>';
}
function miniStars(n) { return `<span class="mini-stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${[0, 1, 2].map(i => ICON.star(i < n ? 'on' : '')).join('')}</span>`; }

function historyHTML() {
  if (!state.history.length) return `<p class="empty">Ta première séance apparaîtra ici, avec ses étoiles et ta douleur avant, après et le lendemain.</p>`;
  const items = ui.historyAll ? state.history : state.history.slice(0, 6);
  const li = items.map(h => {
    const p = PROGRAMS[h.prog] || { name: h.prog };
    const bits = [];
    if (backCat(h) !== 'stop') bits.push(miniStars(Number(h.stars) || 0));
    bits.push(`+${esc(h.xp ?? h.score ?? 0)} XP`);
    if (h.painBefore != null || h.pain != null) bits.push(`· douleur ${esc(h.painBefore ?? '?')}→${esc(h.pain ?? '?')}${h.next != null ? ' · lendemain ' + esc(h.next) : ''}`);
    if (h.veloMin) bits.push(`· vélo ${fmtMin(h.veloMin)} min`);
    if (h.walkMin) bits.push(`· marche ${fmtMin(h.walkMin)} min`);
    return `<li><span class="h-date">${esc(fmtDate(h.d))}</span><div class="h-main"><b>${esc(p.name)}</b><span>${bits.join(' ')}</span></div>${backChip(h)}</li>`;
  }).join('');
  const more = state.history.length > 6 ? `<button class="link-btn" data-action="hist-toggle">${ui.historyAll ? 'Voir moins' : `Voir les ${state.history.length} séances`}</button>` : '<span></span>';
  return `<ul class="hist">${li}</ul><div class="hist-actions">${more}<button class="btn ghost" data-action="summary">Résumé pour mon kiné</button></div>`;
}

function settingsHTML() {
  const s = state.settings;
  const seg = [1, 2, 3].map(n => `<button data-action="set-sets" data-v="${n}" aria-pressed="${s.sets === n}">${n}</button>`).join('');
  return `
  <main class="page plain">
    <header class="sub-top">
      <button class="icon-btn" data-action="home" aria-label="Retour à l’accueil">${ICON.back}</button>
      <h1>Réglages</h1>
    </header>

    <section class="card set-card" aria-label="Reprise dos">
      <h2 class="section-title">Reprise dos</h2>
      <div class="set-row">
        <div><b>Séries par exercice au sol</b><small>Ta routine prévoit 1 série au départ. Ajoute-en une seulement avec l’accord de ton kiné.</small></div>
        <div class="seg" role="group" aria-label="Nombre de séries">${seg}</div>
      </div>
      <div class="set-row">
        <div><b>Vélo d’appartement</b><small>Désactive-le si tu n’as pas de vélo sous la main : il disparaît des séances jusqu’à ce que tu le remettes.</small></div>
        <button class="toggle" role="switch" aria-checked="${s.bike}" aria-label="Inclure le vélo d’appartement" data-action="bike-toggle"></button>
      </div>
      <div class="set-row"${s.bike ? '' : ' hidden'}>
        <div><b>Durée du vélo</b><small>Progression graduelle : une minute de plus de temps en temps.</small></div>
        <div class="stepper"><button data-action="velo-dec" aria-label="Moins une minute">−</button><output>${s.veloMin} min</output><button data-action="velo-inc" aria-label="Plus une minute">+</button></div>
      </div>
    </section>

    <section class="card set-card" aria-label="Jeu">
      <h2 class="section-title">Jeu</h2>
      <div class="set-row">
        <div><b>Mains libres</b><small>L’appli rythme chaque répétition et compte à voix haute. Tu n’as pas à toucher l’écran.</small></div>
        <button class="toggle" role="switch" aria-checked="${s.handsFree}" aria-label="Mains libres" data-action="hf-toggle"></button>
      </div>
      <div class="set-row">
        <div><b>Sons et voix</b><small>Bips de tempo, comptage à voix haute, fin de série.</small></div>
        <button class="toggle" role="switch" aria-checked="${s.sound}" aria-label="Sons et voix" data-action="sound-toggle"></button>
      </div>
      <div class="set-row">
        <div><b>Essai guidé</b><small>Rejouer les 3 lancers d’entraînement pour revoir le principe.</small></div>
        <button class="btn ghost" data-action="practice">Rejouer</button>
      </div>
      <div class="set-row">
        <div><b>Jours d’entraînement par semaine</b><small>Le nombre de cœurs à remplir. Un seul cœur par jour.</small></div>
        <div class="stepper"><button data-action="goal-dec" aria-label="Un jour de moins">−</button><output>${s.weeklyGoal}</output><button data-action="goal-inc" aria-label="Un jour de plus">+</button></div>
      </div>
    </section>

    <section class="card set-card" aria-label="Boule qui chamboule">
      <h2 class="section-title">Boule qui chamboule</h2>
      ${s.bouleUnlocked
        ? `<div class="set-row"><div><b>Débloqué${s.bouleUnlockedAt ? ' le ' + esc(new Date(s.bouleUnlockedAt).toLocaleDateString('fr-FR')) : ''}</b><small>Tu as indiqué que ton kiné a validé ce programme. Arrête au moindre fourmillement ou douleur dans la jambe.</small></div><button class="btn ghost" data-action="relock">${ICON.lock} Reverrouiller</button></div>`
        : (ui.unlockOpen === 'boule' ? unlockPanelHTML('boule') : `<div class="set-row"><div><b>Verrouillé</b><small>Programme fessiers de novembre 2025, pas encore revalidé pour ton dos.</small></div><button class="btn ghost" data-action="unlock-open" data-prog="boule">${ICON.lock} Débloquer</button></div>`)}
    </section>

    <section class="card set-card" aria-label="Suivi et sauvegarde">
      <h2 class="section-title">Suivi et sauvegarde</h2>
      <div class="set-row"><div><b>Résumé pour mon kiné</b><small>Les 30 derniers jours : séances, douleur avant, après et le lendemain.</small></div><button class="btn ghost" data-action="summary">Ouvrir</button></div>
      <div class="set-row"><div><b>Sauvegarde dans un fichier</b><small>Pour passer tes données d’un appareil à l’autre, par exemple vers l’appli du téléphone.</small></div>
        <div class="row-btns">${canSave() ? '<button class="btn ghost" data-action="export">Exporter</button>' : ''}<label class="btn ghost" for="import-file">Importer</label><input type="file" id="import-file" class="sr" accept=".json,application/json"></div>
      </div>
      ${ui.importData ? `<div class="notice warn"><b>Remplacer ta progression ?</b><span>Ce fichier contient ${ui.importData.history.length} séance(s) et ${ui.importData.xp} XP. Ta progression actuelle (${state.history.length} séance(s)) sera remplacée.</span></div>
      <div class="t-row"><button class="btn primary" data-action="import-confirm">Remplacer</button><button class="btn ghost" data-action="import-cancel">Annuler</button></div>` : ''}
      <p class="muted">${mode === 'cloud' ? 'Ta progression est enregistrée sur ton compte et se retrouve sur tous tes appareils. Personne d’autre ne la voit, même si tu partages le lien de l’appli.' : 'Ta progression est enregistrée dans ce navigateur seulement.'}</p>
      ${ui.resetArm
        ? `<div class="t-row"><button class="btn danger-outline" data-action="reset-confirm">Oui, tout effacer</button><button class="btn ghost" data-action="reset-cancel">Annuler</button></div>`
        : `<div><button class="btn ghost" data-action="reset-arm">Effacer ma progression</button></div>`}
    </section>
  </main>`;
}

/* ---------- Avant la séance ---------- */
function precheckHTML() {
  const pre = ui.pre, p = PROGRAMS[pre.prog];
  const ready = pre.pain != null && pre.leg != null;
  let outcome = '';
  if (pre.step === 'leg') {
    outcome = `<div class="notice danger"><b>Pas de renforcement aujourd’hui.</b><span>Des symptômes dans la jambe avant même de commencer, c’est à montrer à ton kiné ou à ton médecin. La respiration du transverse reste possible si elle ne réveille rien.</span></div>
      ${redFlagsHTML(true)}
      <div class="btn-col"><button class="btn primary big" data-action="home">Retour à l’accueil</button><button class="btn ghost" data-action="pre-difficile">Juste la respiration</button></div>`;
  } else if (pre.step === 'high') {
    outcome = `<div class="notice warn"><b>Ton dos est à ${pre.pain}/10 aujourd’hui.</b><span>On te conseille la séance Jour difficile, ou une journée de repos.</span></div>
      <div class="btn-col"><button class="btn primary big" data-action="pre-difficile">Jour difficile</button><button class="btn ghost" data-action="pre-force">Faire ${esc(p.name)} quand même</button><button class="btn ghost" data-action="home">Repos aujourd’hui</button></div>`;
  }
  return `<main class="page plain">
    <header class="sub-top">
      <button class="icon-btn" data-action="home" aria-label="Retour à l’accueil">${ICON.back}</button>
      <div><p class="eyebrow">${esc(p.name)}</p><h1>Avant de jouer</h1></div>
    </header>
    <section class="card set-card" aria-label="Douleur avant la séance">
      <h2 class="section-title">Ton dos, là, maintenant ?</h2>
      ${scaleHTML('pre-pain', pre.pain)}
    </section>
    <section class="card set-card" aria-label="Symptômes dans la jambe">
      <h2 class="section-title">Douleur ou fourmillements dans la jambe ?</h2>
      ${legHTML('pre-leg', pre.leg)}
    </section>
    ${hasBike(p) && !outcome ? `<section class="card set-card" aria-label="Vélo d’appartement">
      <div class="set-row">
        <div><b>Vélo d’appartement aujourd’hui ?</b><small>${state.settings.bike ? 'Inclus à la fin de la séance.' : 'Mis de côté : la séance s’arrête après le pont. Remets-le quand tu auras un vélo.'}</small></div>
        <button class="toggle" role="switch" aria-checked="${state.settings.bike}" aria-label="Inclure le vélo d’appartement" data-action="bike-toggle"></button>
      </div>
    </section>` : ''}
    ${outcome || `<button class="btn primary big" data-action="pre-go" ${ready ? '' : 'disabled'}>${ICON.play} Commencer</button>`}
  </main>`;
}

/* ---------- Résumé kiné ---------- */
function summaryHTML() {
  return `<main class="page plain">
    <header class="sub-top">
      <button class="icon-btn" data-action="summary-back" aria-label="Retour">${ICON.back}</button>
      <h1>Résumé pour mon kiné</h1>
    </header>
    <p class="muted">Les 30 derniers jours, avec uniquement ce que tu as noté dans l’appli. À montrer en séance ou à envoyer.</p>
    <pre class="summary" id="sum-text" tabindex="0">${esc(kineSummary(state))}</pre>
    <div class="btn-col">
      <button class="btn primary big" data-action="sum-copy">Copier le texte</button>
      ${canSave() ? `<button class="btn ghost" data-action="sum-dl">${window.claude ? 'Télécharger (.txt)' : 'Enregistrer en fichier (.txt)'}</button>` : ''}
      ${(!window.claude && navigator.share) ? '<button class="btn ghost" data-action="sum-share">Partager</button>' : ''}
    </div>
  </main>`;
}

/* ---------- Jeu ---------- */
let G = null;
let rafId = 0;
let tickIv = 0;
function stopLoop() { cancelAnimationFrame(rafId); clearInterval(tickIv); }

function startGame(progId, pre) {
  audio();
  const prog = progFor(state, progId);
  const steps = buildSteps(state, prog);
  G = {
    prog, steps, i: 0, phase: 'intro', line: pick(LINES.intro), hf: prog.practice ? false : !!state.settings.handsFree,
    setPerfect: 0, nCans: 0, pyramids: 0, canGeo: null, litL: -1,
    painBefore: pre ? pre.pain : null, legBefore: pre ? !!pre.leg : false,
    count: 0, taps: [], lastTap: 0, combo: 0, bestCombo: 0, score: 0, perfect: 0, fast: 0, reps: 0,
    skipped: [], painEx: [], veloSec: 0, walkSec: 0, t0: Date.now(), holdStart: null,
    restEnd: 0, switchEnd: 0, flashUntil: 0, lastRem: -1, overlay: null, pausedAt: 0,
    paused: false, pauseStart: 0, cue: 0, readyCued: false, lastMin: null,
    timer: { running: false, acc: 0, since: 0, dur: state.settings.veloMin * 60000, credited: false },
    el: {}, ready: null, hintText: null
  };
  ui.screen = 'game';
  wakeLock(true);
  renderGame();
  stopLoop();
  const loop = now => { if (ui.screen !== 'game' || !G) return; frame(now); rafId = requestAnimationFrame(loop); };
  rafId = requestAnimationFrame(loop);
  // Filet de sécurité : le chrono et les fins de série avancent même si l’écran ne redessine plus.
  tickIv = setInterval(() => { if (ui.screen === 'game' && G) frame(performance.now()); else clearInterval(tickIv); }, 250);
}

function renderGame() {
  const st = G.steps[G.i], p = G.prog;
  const pips = p.exercises.map((e, k) => {
    const cls = G.skipped.includes(e.id) ? 'skip' : k < st.ei ? 'done' : k === st.ei ? 'now' : '';
    return `<i class="${cls}"></i>`;
  }).join('');
  let inner = '';
  if (G.phase === 'intro') inner = introHTML(st);
  else if (G.phase === 'play') inner = playHTML(st);
  else if (G.phase === 'timer') inner = timerHTML(st);
  else if (G.phase === 'rest') inner = restHTML(st);
  else if (G.phase === 'switch') inner = switchHTML(st);
  const snd = state.settings.sound;
  app.innerHTML = `<div class="game">
    <div class="g-wrap">
      <div class="g-top">
        <button class="icon-btn" data-action="quit" aria-label="Quitter la séance">${ICON.close}</button>
        <div class="pips" role="img" aria-label="Exercice ${st.ei + 1} sur ${p.exercises.length}">${pips}</div>
        <button class="icon-btn" data-action="mute" aria-label="${snd ? 'Couper le son' : 'Remettre le son'}">${snd ? ICON.sound : ICON.mute}</button>
        <div class="g-score"><span class="lbl">Score</span><b id="g-score">${G.score}</b></div>
      </div>
      ${inner}
    </div>
    ${G.overlay ? overlayHTML() : ''}
    <p class="sr" aria-live="polite" id="live"></p>
  </div>`;
  G.el = {
    ring: $('#ring'), zone: $('.zone'), target: $('.target'), hint: $('#hint'), breath: $('#breath'), count: $('#count'),
    score: $('#g-score'), combo: $('#combo'), undo: $('#undo'), setdone: $('#setdone'), fx: $('#fx'), live: $('#live'),
    tclock: $('#tclock'), tstate: $('#tstate'), tpts: $('#tpts'), bike: $('.bike'), rclock: $('#rclock'), swclock: $('#swclock'),
    lanterns: $('.lanterns')
  };
  G.ready = null; G.hintText = null; G.litL = -1;
  if (G.el.zone) G.el.zone.classList.toggle('paused', G.paused);
  if (G.phase === 'timer') updateTimer(performance.now(), true);
  const focusEl = $('[data-autofocus]');
  if (focusEl && !G.overlay) { try { focusEl.focus({ preventScroll: true }); } catch {} }
}

function introHTML(st) {
  const ex = st.ex, n = G.prog.exercises.length;
  const tempoNote = ex.kind === 'timer'
    ? `<div class="tempo-note"><span class="dial" aria-hidden="true"></span><span>Lance le chrono et ${ex.id === 'velo' ? 'pédale' : 'marche'} tranquillement. Chaque minute rapporte des points, tu peux t’arrêter avant la fin.</span></div>`
    : ex.kind === 'hold'
      ? `<div class="tempo-note"><span class="dial" aria-hidden="true"></span><span>${G.hf ? `L’appli lance chaque maintien de ${ex.hold} s, compte pour toi et laisse 4 s de pause entre deux.` : `Mets-toi en place et tape pour commencer à tenir : le cercle se remplit pendant ${ex.hold} s et la répétition compte toute seule à la fin. Relâcher avant ne rapporte presque rien.`}</span></div>`
    : G.hf
      ? `<div class="tempo-note"><span class="dial" aria-hidden="true"></span><span>Pose le téléphone et écoute : l’appli rythme chaque répétition (${ex.tempo} s) et compte à voix haute. Touche l’écran pour faire pause.</span></div>`
      : `<div class="tempo-note"><span class="dial" aria-hidden="true"></span><span>Le cercle met ${ex.tempo} s à se remplir. Fais ta répétition, puis tape quand il est jaune : un bip te prévient. Plus lent, c’est toujours parfait.</span></div>`;
  const hfCard = (ex.kind === 'timer' || G.prog.practice) ? '' : `<div class="hf-card"><div><b>Mains libres</b><small>${G.hf ? 'Activé : l’appli compte pour toi.' : 'Pratique allongé ou à quatre pattes : plus besoin de toucher l’écran.'}</small></div><button class="toggle" role="switch" aria-checked="${G.hf}" aria-label="Mains libres" data-action="hf-game"></button></div>`;
  return `<div class="g-body">
    <div class="g-head">
      <p class="eyebrow">${G.prog.practice ? 'Premier lancer · rien n’est enregistré' : `Exercice ${st.ei + 1} / ${n}`}</p>
      <h2 class="g-title">${esc(ex.name)}</h2>
      <p class="presc">${esc(presc(state, ex, st.sets))}</p>
    </div>
    <div class="cue">${illusFull(ex.id)}<p>${esc(ex.cue)}</p>${ex.tip ? `<p class="tip">${esc(ex.tip)}</p>` : ''}</div>
    ${hfCard}
    ${tempoNote}
    ${buddyHTML(G.line, 'happy', 'sm')}
    <div class="g-actions">
      <button class="btn primary big" data-action="go" data-autofocus>C’est parti</button>
      <button class="btn ghost" data-action="skip">Passer cet exercice</button>
    </div>
  </div>`;
}

function targetLabel(ex) { return (G && G.hf) || ex.kind === 'hold' ? String(ex.target) : ex.free ? 'env. ' + ex.target : ex.max ? ex.target + '–' + ex.max : String(ex.target); }
function showSetDone(ex) { return !G.hf && ((ex.max && G.count >= ex.target) || (ex.free && G.count > 0)); }

function playHTML(st) {
  const ex = st.ex;
  const meta = [`Série ${st.set}/${st.sets}`];
  if (st.side) meta.push(sideText(ex, st.side));
  return `<div class="g-body">
    <div class="g-head">
      <h2 class="g-title sm">${esc(ex.name)}</h2>
      <p class="g-meta">${esc(meta.join(' · '))}${G.hf ? '<span class="hf-chip">Mains libres</span>' : ''}</p>
    </div>
    ${standHTML(ex.target, G.setPerfect)}
    <div class="zone" data-tap role="button" tabindex="0" aria-label="${G.hf ? 'Mettre en pause ou reprendre' : 'Compter une répétition'}" data-autofocus>
      <div class="target">
        <div class="disc"></div>
        ${ex.kind === 'breath' ? '<div class="breath" id="breath"></div>' : ''}
        <svg class="ring" viewBox="0 0 200 200" aria-hidden="true"><circle class="ring-bg" cx="100" cy="100" r="92"/><circle class="ring-fg" id="ring" cx="100" cy="100" r="92" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
        <div class="count"><b id="count">${G.count}</b><span>/ ${esc(targetLabel(ex))}</span></div>
      </div>
      <p class="zone-hint" id="hint"></p>
      <p class="combo" id="combo" ${G.combo >= 2 ? '' : 'hidden'}>Combo ${G.combo}</p>
      <div class="fx" id="fx"></div>
    </div>
    <div class="g-actions">
      <button class="btn primary" data-action="set-done" id="setdone" ${showSetDone(ex) ? '' : 'hidden'}>Série terminée</button>
      <div class="row3">
        <button class="btn ghost sm" data-action="undo" id="undo" aria-label="Retirer la dernière répétition" ${G.count ? '' : 'disabled'}>−1</button>
        <button class="btn danger-outline sm" data-action="pain">Douleur</button>
        <button class="btn ghost sm" data-action="skip">Passer</button>
      </div>
    </div>
  </div>`;
}

function timerHTML(st) {
  const ex = st.ex;
  return `<div class="g-body">
    <div class="g-head">
      <h2 class="g-title sm">${esc(ex.name)}</h2>
      <p class="g-meta">${ex.id === 'velo' ? state.settings.veloMin + ' min · résistance légère · buste peu penché' : timerMin(state, ex) + ' min · à ton rythme'}</p>
    </div>
    <div class="lanterns" aria-hidden="true">${Array.from({ length: Math.min(timerMin(state, ex), 20) }, () => '<span class="bulb sm"></span>').join('')}</div>
    <div class="zone" data-tap role="button" tabindex="0" aria-label="Démarrer ou mettre en pause le chrono" data-autofocus>
      <div class="target">
        <div class="disc"></div>
        <svg class="ring" viewBox="0 0 200 200" aria-hidden="true"><circle class="ring-bg" cx="100" cy="100" r="92"/><circle class="ring-fg" id="ring" cx="100" cy="100" r="92" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
        <div class="count">${ex.id === 'velo' ? ICON.bike(G.timer.running) : ''}<b class="clock" id="tclock">${fmtClock(G.timer.dur / 1000)}</b><span id="tstate"></span></div>
      </div>
      <p class="zone-hint" id="tpts">+0 pt</p>
      <div class="fx" id="fx"></div>
    </div>
    <div class="g-actions">
      <button class="btn primary" data-action="timer-done">J’ai fini</button>
      <div class="row3">
        <button class="btn ghost sm" data-action="timer-toggle" id="ttoggle">${G.timer.running ? 'Pause' : 'Démarrer'}</button>
        <button class="btn danger-outline sm" data-action="pain">Douleur</button>
        <button class="btn ghost sm" data-action="skip">Passer</button>
      </div>
    </div>
  </div>`;
}

function restHTML(st) {
  const ex = st.ex;
  const rem = Math.max(0, Math.ceil((G.restEnd - performance.now()) / 1000));
  return `<div class="g-body g-center">
    <p class="eyebrow">Récupération</p>
    <p class="rest-clock" id="rclock">${rem}</p>
    ${buddyHTML(G.line, 'calm', 'sm')}
    <p class="next">À suivre : ${esc(ex.name)} · série ${st.set}/${st.sets}${st.side ? ' · ' + esc(sideText(ex, st.side)) : ''}</p>
    <div class="g-actions">
      <button class="btn primary big" data-action="go" data-autofocus>C’est reparti</button>
      <button class="btn ghost" data-action="rest-add">+15 s de récup</button>
    </div>
  </div>`;
}

function switchHTML(st) {
  const rem = Math.max(0, Math.ceil((G.switchEnd - performance.now()) / 1000));
  return `<div class="g-body g-center">
    <p class="eyebrow">Change de côté</p>
    <h2 class="g-title">${esc(sideText(st.ex, st.side))}</h2>
    <p class="next">Même exercice, l’autre côté. Ça repart dans <b id="swclock">${rem}</b> s.</p>
    <div class="g-actions"><button class="btn primary big" data-action="go" data-autofocus>Go</button></div>
  </div>`;
}

function overlayHTML() {
  if (G.overlay === 'pain') return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="ov-t"><div class="sheet">
    <h2 id="ov-t">Qu’est-ce que tu ressens ?</h2>
    <button class="choice danger" data-action="pain-stop"><b>Ça descend dans la jambe ou ça fourmille</b><span>On arrête la séance tout de suite. Tu gardes tes points.</span></button>
    <button class="choice warn" data-action="pain-skip"><b>Ce mouvement augmente ma douleur</b><span>On passe cet exercice, sans perdre d’étoile, et on le note pour ton kiné.</span></button>
    <button class="choice" data-action="overlay-close"><b>Fausse alerte</b><span>Je reprends doucement.</span></button>
    ${redFlagsHTML(true)}
  </div></div>`;
  return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="ov-t"><div class="sheet">
    <h2 id="ov-t">Quitter la séance ?</h2>
    <button class="choice" data-action="end-now"><b>Terminer maintenant</b><span>Tes points sont gardés. Les exercices restants comptent comme non faits.</span></button>
    <button class="choice danger" data-action="abandon"><b>Quitter sans enregistrer</b><span>Rien n’est gardé de cette séance.</span></button>
    <button class="choice" data-action="overlay-close"><b>Reprendre</b><span>Retour au jeu.</span></button>
  </div></div>`;
}

function setText(el, txt) { if (el && el.textContent !== String(txt)) el.textContent = txt; }

function frame(now) {
  if (G.overlay) return;
  if (G.flashUntil) { if (now >= G.flashUntil) { G.flashUntil = 0; advance(); } return; }
  if (G.phase === 'play') { if (!G.paused) updateRing(now); }
  else if (G.phase === 'timer') updateTimer(now);
  else if (G.phase === 'rest') {
    const rem = Math.max(0, Math.ceil((G.restEnd - now) / 1000));
    setText(G.el.rclock, rem);
    if (rem !== G.lastRem) { if (rem > 0 && rem <= 3) SFX.tick(); G.lastRem = rem; }
    if (now >= G.restEnd) beginPlay();
  } else if (G.phase === 'switch') {
    setText(G.el.swclock, Math.max(0, Math.ceil((G.switchEnd - now) / 1000)));
    if (now >= G.switchEnd) beginPlay();
  }
}

function setHint(h) { if (h !== G.hintText) { G.hintText = h; setText(G.el.hint, h); } }
function startHold(now) { G.holdStart = now; G.lastSec = -1; SFX.go(); buzz(20); if (G.hf) say('Tiens'); }
function updateHold(now, ex) {
  const el = G.el;
  if (G.holdStart == null) {
    if (el.ring) el.ring.style.strokeDashoffset = '100';
    if (G.hf && now - G.lastTap >= 4000) { startHold(now); return; }
    setHint(G.hf ? 'Relâche… le prochain maintien démarre tout seul' : (G.count ? 'Relâche, puis tape pour le suivant' : 'Mets-toi en place, puis tape pour tenir'));
    return;
  }
  const t = (now - G.holdStart) / 1000;
  if (el.ring) el.ring.style.strokeDashoffset = String(100 - 100 * Math.min(1, t / ex.hold));
  const left = Math.max(0, Math.ceil(ex.hold - t));
  if (left !== G.lastSec) { if (G.lastSec !== -1 && left > 0 && left <= 3) SFX.tick(); G.lastSec = left; }
  setHint(`Tiens… ${left} s`);
  if (t >= ex.hold) {
    G.holdStart = null;
    const rec = scoreRep(true);
    G.lastTap = now;
    buzz(25); launch(true); cheer(true);
    if (G.hf) say(String(G.count));
    pop('TENU ♥', '+' + rec.pts, true);
    hit(); refreshPlay();
    setText(el.live, `${G.count} sur ${ex.target}`);
    if (G.count >= ex.target) finishSet();
  }
}
function updateRing(now) {
  const ex = G.steps[G.i].ex, el = G.el;
  if (ex.kind === 'hold') { updateHold(now, ex); return; }
  const t = Math.max(0, (now - G.lastTap) / 1000);
  const prog = Math.min(1, t / ex.tempo);
  if (el.ring) el.ring.style.strokeDashoffset = String(100 - 100 * prog);
  const ready = t >= ex.tempo * 0.85;
  if (ready !== G.ready) { G.ready = ready; el.zone && el.zone.classList.toggle('ready', ready); }
  let hint;
  if (ex.kind === 'breath') {
    const half = ex.tempo / 2;
    let sc;
    if (t < half) { hint = 'Inspire par le nez…'; sc = 0.5 + 0.5 * (t / half); }
    else if (t < ex.tempo) { hint = 'Expire longuement, rentre le ventre…'; sc = 1 - 0.5 * ((t - half) / half); }
    else { hint = 'Tape à la fin de l’expiration'; sc = 0.5; }
    if (el.breath) el.breath.style.transform = `scale(${sc.toFixed(3)})`;
  } else if (G.hf) {
    hint = 'Fais ta répétition lentement…';
  } else {
    hint = ready ? 'Tape quand ta répétition est finie' : 'Lentement, contrôle le mouvement…';
  }
  if (G.hf) {
    if (ex.kind === 'breath') {
      if (G.cue < 1) { G.cue = 1; say('Inspire'); }
      if (G.cue < 2 && t >= ex.tempo / 2) { G.cue = 2; say('Expire'); }
    } else if (G.cue < 1) { G.cue = 1; SFX.low(); }
    if (t >= ex.tempo) { autoRep(now); return; }
  } else if (ready && !G.readyCued) {
    G.readyCued = true; SFX.ready(); buzz(15);
  }
  if (hint !== G.hintText) { G.hintText = hint; setText(el.hint, hint); }
}

function beginPlay() {
  G.phase = 'play'; G.count = 0; G.taps = []; G.lastTap = performance.now();
  G.cue = 0; G.readyCued = false; G.paused = false;
  G.setPerfect = 0; G.nCans = G.steps[G.i].ex.target || 0; G.holdStart = null;
  SFX.go();
  renderGame();
}

function scoreRep(good) {
  const rec = { prevLast: G.lastTap, prevCombo: G.combo, good, pts: 0 };
  if (good) { G.combo++; G.perfect++; G.setPerfect++; rec.pts = 10 * Math.min(3, 1 + Math.floor((G.combo - 1) / 5)); }
  else { G.combo = 0; G.fast++; rec.pts = 2; }
  G.bestCombo = Math.max(G.bestCombo, G.combo);
  G.score += rec.pts; G.count++; G.reps++; G.taps.push(rec);
  G.cue = 0; G.readyCued = false;
  return rec;
}

function tap() {
  if (G.flashUntil || G.phase !== 'play') return;
  const ex = G.steps[G.i].ex, now = performance.now();
  if (ex.kind === 'hold') {
    if (G.holdStart == null) { startHold(now); return; }
    G.holdStart = null;
    const rec = scoreRep(false);
    G.lastTap = now;
    SFX.fast(); buzz([15, 40, 15]); launch(false); cheer(false);
    pop('TROP COURT', '+' + rec.pts, false, 'Tiens jusqu’au bout');
    hit(); refreshPlay();
    if (G.count >= ex.target) finishSet();
    return;
  }
  const good = (now - G.lastTap) / 1000 >= ex.tempo * 0.85;
  const rec = scoreRep(good);
  G.lastTap = now;
  const mult = rec.pts / 10;
  if (good) buzz(25); else { SFX.fast(); buzz([15, 40, 15]); }
  launch(good);
  cheer(good);
  pop(good ? (G.setPerfect > G.nCans ? 'BONUS' : mult > 1 ? 'PARFAIT ×' + mult : 'PARFAIT ♥') : 'RATÉ, TROP VITE', '+' + rec.pts, good, good ? null : 'Ralentis');
  if (good && G.combo >= 3) sparks();
  hit(); refreshPlay();
  setText(G.el.live, `${G.count} sur ${targetLabel(ex)}, ${good ? 'parfait' : 'trop vite'}`);
  const limit = ex.free ? Infinity : (ex.max || ex.target);
  if (G.count >= limit) finishSet();
}

function autoRep(now) {
  const ex = G.steps[G.i].ex;
  const rec = scoreRep(true);
  G.lastTap = now;
  buzz(20);
  launch(true);
  cheer(true);
  if (ex.kind !== 'breath') say(String(G.count));
  pop(rec.pts > 10 ? 'PARFAIT ×' + rec.pts / 10 : 'PARFAIT ♥', '+' + rec.pts, true);
  hit(); refreshPlay();
  setText(G.el.live, `${G.count} sur ${ex.target}`);
  if (G.count >= ex.target) finishSet();
}

function togglePause() {
  const now = performance.now();
  if (G.paused) { G.lastTap += now - G.pauseStart; if (G.holdStart != null) G.holdStart += now - G.pauseStart; G.paused = false; G.hintText = null; SFX.go(); }
  else { G.paused = true; G.pauseStart = now; hush(); setText(G.el.hint, 'En pause. Touche l’écran pour reprendre'); }
  if (G.el.zone) G.el.zone.classList.toggle('paused', G.paused);
}

function undo() {
  const r = G.taps.pop(); if (!r) return;
  G.score -= r.pts; G.count--; G.reps--;
  if (r.good) { G.perfect--; G.setPerfect--; restoreCan(G.setPerfect); } else G.fast--;
  G.combo = r.prevCombo; G.lastTap = r.prevLast; G.holdStart = null;
  refreshPlay();
}

function refreshPlay() {
  const el = G.el, ex = G.steps[G.i].ex;
  setText(el.count, G.count);
  setText(el.score, G.score);
  if (el.undo) el.undo.disabled = !G.count;
  if (el.setdone) el.setdone.hidden = !showSetDone(ex);
  if (el.combo) { el.combo.hidden = G.combo < 2; setText(el.combo, 'Combo ' + G.combo); }
}

function hit() {
  const t = G.el.target; if (!t || reduceMotion) return;
  t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit');
}
function pop(big, small, good, extra) {
  const fx = G.el.fx; if (!fx) return;
  const d = document.createElement('div');
  d.className = 'pop ' + (good ? 'good' : 'bad');
  d.innerHTML = `${esc(big)}<small>${esc(small)}${extra ? ' · ' + esc(extra) : ''}</small>`;
  fx.appendChild(d);
  setTimeout(() => d.remove(), 950);
}
function sparks() {
  const fx = G.el.fx; if (!fx || reduceMotion) return;
  const colors = ['var(--ticket)', 'var(--prize)', 'var(--accent)'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('i');
    s.className = 'spark' + (i % 3 === 0 ? ' st' : '');
    const a = (Math.PI * 2 * i) / 12, r = 90 + Math.random() * 50;
    s.style.setProperty('--dx', Math.cos(a) * r + 'px');
    s.style.setProperty('--dy', Math.sin(a) * r + 'px');
    s.style.background = colors[i % 3];
    fx.appendChild(s);
    setTimeout(() => s.remove(), 750);
  }
}

function standHTML(n, knocked) {
  if (!n) { G.canGeo = null; return ''; }
  const rows = canRows(n);
  const canH = Math.min(40, Math.floor(104 / rows.length)), canW = Math.round(canH * 0.78), gap = 3;
  const cans = [];
  rows.forEach((k, r) => { const total = k * canW + (k - 1) * gap; for (let j = 0; j < k; j++) cans.push({ r, x: -total / 2 + j * (canW + gap), y: 10 + r * canH }); });
  const order = cans.sort((a, b) => b.r - a.r || a.x - b.x);
  G.canGeo = { canW, canH, list: order };
  return `<div class="stand" aria-hidden="true"><div class="stand-back"></div>${order.map((c, i) => `<div class="can c${c.r % 2}${i < knocked ? ' gone' : ''}" id="can-${i}" style="left:calc(50% + ${c.x}px);bottom:${c.y}px;width:${canW}px;height:${canH}px">${CAN_SVG}</div>`).join('')}<div class="stand-buddy" id="stand-buddy">${mascot('happy')}</div><div class="plank"></div></div>`;
}
function throwBall(i, hitIt) {
  const stand = $('.stand'), geo = G.canGeo; if (!stand || !geo) return;
  const c = geo.list[i], can = $('#can-' + i); if (!c) return;
  if (reduceMotion) { if (hitIt && can) can.classList.add('gone'); return; }
  const ball = document.createElement('i'); ball.className = 'ball'; stand.appendChild(ball);
  const miss = hitIt ? 0 : (Math.random() < .5 ? -1 : 1) * (geo.canW + 22);
  const tx = c.x + geo.canW / 2 + miss, ty = -(c.y + geo.canH * (hitIt ? .5 : 1.3) + 26);
  requestAnimationFrame(() => requestAnimationFrame(() => { ball.style.transform = `translate(${tx}px,${ty}px)`; }));
  setTimeout(() => {
    if (can && hitIt) {
      const dir = Math.random() < .5 ? -1 : 1;
      can.style.setProperty('--kx', dir * (50 + Math.random() * 70) + 'px');
      can.style.setProperty('--ky', (-30 + Math.random() * 50) + 'px');
      can.style.setProperty('--kr', dir * (120 + Math.random() * 160) + 'deg');
      can.classList.add('down');
      if (G && G.steps[G.i].ex.kind !== 'breath') SFX.clang();
    } else if (can) { can.classList.remove('wobble'); void can.offsetWidth; can.classList.add('wobble'); }
    ball.style.opacity = '0';
    setTimeout(() => ball.remove(), 250);
  }, 280);
}
function launch(good) {
  const quiet = G.steps[G.i].ex.kind === 'breath';
  if (good) {
    if (G.setPerfect <= G.nCans) { if (!quiet) SFX.whoosh(); throwBall(G.setPerfect - 1, true); }
    else if (!quiet) SFX.perfect();
  } else if (G.setPerfect < G.nCans) { SFX.whoosh(); throwBall(G.setPerfect, false); }
}
let cheerT = 0;
function cheer(good) {
  const el = $('#stand-buddy'); if (!el) return;
  el.innerHTML = mascot(good ? 'wow' : 'calm');
  if (!reduceMotion) { el.classList.remove('hop', 'shake'); void el.offsetWidth; el.classList.add(good ? 'hop' : 'shake'); }
  clearTimeout(cheerT);
  cheerT = setTimeout(() => { const e2 = $('#stand-buddy'); if (e2) e2.innerHTML = mascot('happy'); }, 800);
}
function restoreCan(i) { const c = $('#can-' + i); if (c) c.classList.remove('down', 'gone', 'wobble'); }
function finishSet() {
  const all = G.nCans > 0 && G.setPerfect >= G.nCans;
  if (all) G.pyramids++;
  stepDone(all ? 'CHAMBOULÉ !' : 'SÉRIE OK', all ? 30 : 20, all);
  if (all) { SFX.chamboule(); setTimeout(() => { if (G) sparks(); }, 300); }
}

function stepDone(label, pts, withMascot) {
  G.score += pts;
  setText(G.el.score, G.score);
  SFX.set(); buzz([30, 50, 60]);
  const fx = G.el.fx;
  if (fx) { const f = document.createElement('div'); f.className = 'flash'; f.innerHTML = `${withMascot ? mascot('wow') : ''}<b>${esc(label)}</b><span>+${pts}</span>`; fx.appendChild(f); }
  sparks();
  G.flashUntil = performance.now() + 1150;
}

function advance() {
  const prev = G.steps[G.i];
  G.i++;
  if (G.i >= G.steps.length) { finish('done'); return; }
  const cur = G.steps[G.i];
  G.count = 0; G.taps = []; G.paused = false;
  if (cur.ex !== prev.ex) { G.phase = 'intro'; G.line = pick(LINES.intro); if (G.hf) say('Exercice suivant : ' + cur.ex.name); }
  else if (cur.set !== prev.set) { G.phase = 'rest'; G.restEnd = performance.now() + G.prog.rest * 1000; G.lastRem = -1; G.line = pick(LINES.rest); if (G.hf) say('Récupération'); }
  else { G.phase = 'switch'; G.switchEnd = performance.now() + 3000; if (G.hf) say('Change de côté'); }
  renderGame();
}

function skipExercise(fromPain) {
  G.flashUntil = 0;
  const ex = G.steps[G.i].ex;
  if (!G.skipped.includes(ex.id)) G.skipped.push(ex.id);
  if (fromPain && !G.painEx.includes(ex.id)) G.painEx.push(ex.id);
  if (ex.kind === 'timer') { G.timer.running = false; G.timer.credited = true; G.resumeTimer = false; }
  let j = G.i; while (j < G.steps.length && G.steps[j].ex === ex) j++;
  G.i = j - 1;
  G.overlay = null;
  hush();
  advance();
}

/* Vélo */
function addTimerSec(sec) { if (G.steps[G.i].ex.id === 'velo') G.veloSec += sec; else G.walkSec += sec; }
function timerElapsed(now) { const t = G.timer; return Math.min(t.dur, t.acc + (t.running ? now - t.since : 0)); }
function toggleTimer() {
  const t = G.timer, now = performance.now();
  if (t.credited) return;
  if (t.running) { t.acc += now - t.since; t.running = false; }
  else { t.since = now; t.running = true; SFX.go(); }
  if (G.el.bike) G.el.bike.classList.toggle('spin', t.running);
  setText($('#ttoggle'), t.running ? 'Pause' : 'Reprendre');
  updateTimer(now, true);
}
function updateTimer(now) {
  const t = G.timer, el = G.el;
  if (t.credited) return;
  const e = timerElapsed(now);
  setText(el.tclock, fmtClock((t.dur - e) / 1000));
  if (el.ring) el.ring.style.strokeDashoffset = String(100 - 100 * (e / t.dur));
  const mins = Math.floor(e / 60000);
  setText(el.tpts, '+' + mins * 10 + ' pts · ' + mins + ' min');
  setText(el.tstate, t.running ? 'Tape pour la pause' : (e > 0 ? 'En pause' : 'Tape pour lancer'));
  if (el.lanterns) {
    const bulbs = el.lanterns.children, lit = Math.floor((e / t.dur) * bulbs.length + 1e-6);
    if (lit !== G.litL) { G.litL = lit; for (let i = 0; i < bulbs.length; i++) bulbs[i].classList.toggle('lit', i < lit); }
  }
  if (t.running && mins !== G.lastMin) {
    if (G.lastMin != null && mins > 0) {
      SFX.tick();
      const left = Math.round((t.dur - e) / 60000);
      if (G.hf && left > 0) say(`Encore ${left} minute${left > 1 ? 's' : ''}`);
    }
    G.lastMin = mins;
  }
  if (e >= t.dur && !t.credited) creditTimer(true);
}
function creditTimer(full) {
  const t = G.timer;
  const e = timerElapsed(performance.now());
  if (t.running) { t.acc = e; t.running = false; }
  t.credited = true;
  addTimerSec(e / 1000);
  if (G.el.bike) G.el.bike.classList.remove('spin');
  const pts = Math.floor(e / 60000) * 10 + (full ? 30 : 0);
  stepDone(full ? 'OBJECTIF ATTEINT' : (G.steps[G.i].ex.id === 'velo' ? 'BIEN ROULÉ' : 'BIEN MARCHÉ'), pts);
}

function openOverlay(kind) {
  G.overlay = kind; G.pausedAt = performance.now();
  hush();
  if (G.timer.running) { G.timer.acc += G.pausedAt - G.timer.since; G.timer.running = false; G.resumeTimer = true; }
  renderGame();
  const first = $('.sheet .choice'); if (first) first.focus();
}
function closeOverlay() {
  const d = performance.now() - G.pausedAt;
  G.restEnd += d; G.switchEnd += d;
  if (G.paused) G.pauseStart += d; else { G.lastTap += d; if (G.holdStart != null) G.holdStart += d; }
  if (G.flashUntil) G.flashUntil += d;
  if (G.resumeTimer) { G.timer.since = performance.now(); G.timer.running = true; G.resumeTimer = false; }
  G.overlay = null;
  renderGame();
}

function finish(reason) {
  stopLoop();
  wakeLock(false);
  hush();
  if (G.prog.practice) { endPractice(); return; }
  if (G.phase === 'timer' && !G.timer.credited) {
    const e = timerElapsed(performance.now());
    G.timer.credited = true; G.timer.running = false;
    if (e > 0) { addTimerSec(e / 1000); G.score += Math.floor(e / 60000) * 10; }
  }
  if (reason !== 'done') {
    const from = G.flashUntil ? G.i + 1 : G.i;
    for (let k = from; k < G.steps.length; k++) { const id = G.steps[k].ex.id; if (!G.skipped.includes(id)) G.skipped.push(id); }
  }
  if (!G.reps && G.veloSec + G.walkSec < 30 && reason !== 'pain') {
    G = null; ui.screen = 'home'; renderScreen(); window.scrollTo(0, 0);
    toast('Séance vide : rien n’a été enregistré.');
    return;
  }
  const stars = computeStars(reason, G);
  const sameDay = state.history.some(h => dayKey(h.d) === dayKey(new Date()));
  const minutes = Math.min(estMin(state, G.prog), Math.max(1, Math.round((Date.now() - G.t0) / 60000)));
  const xp = computeXP(G.prog, G, minutes, sameDay);
  const entry = {
    id: 's' + Date.now().toString(36), d: new Date().toISOString(), prog: G.prog.id,
    score: G.score, xp, stars, perfect: G.perfect, reps: G.reps, combo: G.bestCombo,
    veloMin: Math.round(G.veloSec / 6) / 10, walkMin: Math.round(G.walkSec / 6) / 10, skipped: [...G.skipped], painEx: [...G.painEx],
    stop: reason === 'pain', back: reason === 'pain' ? 'stop' : null, hf: G.hf, pyramids: G.pyramids,
    painBefore: G.painBefore, legBefore: G.legBefore, pain: null, leg: null, next: null,
    durS: Math.round((Date.now() - G.t0) / 1000)
  };
  const before = levelInfo(state.xp);
  const outfitsBefore = unlockedOutfits(state);
  state.xp += xp;
  state.bestCombo = Math.max(state.bestCombo, G.bestCombo);
  state.history.unshift(entry);
  if (state.history.length > 300) state.history.length = 300;
  const fresh = evalBadges(state);
  const chal = evalChallenges(state);
  persist();
  const newOutfits = OUTFITS.filter(o => o.test(state) && !outfitsBefore.includes(o.id));
  const relocked = reason === 'pain' && relockSolide();
  R = { relocked, entry, before, after: levelInfo(state.xp), badges: fresh, challenges: chal, outfits: newOutfits, reason, animate: true, ci: { pain: null, leg: null }, sameDay };
  if (relocked) persist();
  G = null;
  ui.screen = 'result';
  renderResult();
  window.scrollTo(0, 0);
  if (reason !== 'pain') { SFX.end(); if (stars >= 2 || R.after.n > before.n) confetti(); }
}

/* ---------- Résultat ---------- */
let R = null;
function ciMessage(e) {
  if (e.pain == null) return '';
  const b = e.painBefore ?? e.pain, d = e.pain - b;
  if (e.leg) return `<div class="notice danger"><b>Symptômes dans la jambe après la séance.</b><span>Note-le et parles-en à ton kiné avant de rejouer.</span></div>${redFlagsHTML(true)}`;
  if (e.pain >= 7 || d >= 3) return `<div class="notice danger"><b>Ta douleur a monté pendant la séance (${b} → ${e.pain}).</b><span>Repos, et vois ça avec ton kiné avant la prochaine séance.</span></div>`;
  if (d >= 1 && e.pain > 2) return `<div class="notice warn"><b>Un peu plus sensible qu’avant (${b} → ${e.pain}).</b><span>Surveille demain matin : l’appli te posera la question.</span></div>`;
  return `<div class="notice good"><b>Ton dos est stable ou mieux qu’avant (${b} → ${e.pain}).</b><span>C’est exactement ce qu’on cherche.</span></div>`;
}
function renderResult() {
  const e = R.entry, pain = R.reason === 'pain';
  const titles = { 3: 'Séance parfaite', 2: 'Belle séance', 1: 'Séance faite', 0: 'Bien fait de t’arrêter' };
  const lines = {
    3: 'Lent, propre, contrôlé. C’est exactement ce que ton dos aime.',
    2: 'Bon travail. Encore un peu plus de lenteur et c’est trois étoiles.',
    1: 'Chaque séance compte. La prochaine fois, laisse le cercle se remplir avant de taper.'
  };
  const starsHTML = pain ? '' : `<div class="stars" role="img" aria-label="${e.stars} étoile${e.stars > 1 ? 's' : ''} sur 3">${[0, 1, 2].map(i => ICON.star(i < e.stars ? 'on' : '', R.animate ? `animation-delay:${0.15 + i * 0.22}s` : 'animation:none')).join('')}</div>`;
  const lvUp = R.after.n > R.before.n ? `<div class="levelup">Niveau ${R.after.n} débloqué<b>${esc(R.after.name)}</b></div>` : '';
  const startPct = R.after.n > R.before.n ? 0 : R.before.pct;
  const badges = R.badges.length ? `<section class="card" aria-label="Nouveaux badges"><p class="eyebrow" style="text-align:center;margin-bottom:12px">Nouveau${R.badges.length > 1 ? 'x' : ''} badge${R.badges.length > 1 ? 's' : ''}</p><div class="new-badges">${R.badges.map(badgeHTML).join('')}</div></section>` : '';
  const painExNames = e.painEx.map(exName);
  const done = e.pain != null && e.leg != null;
  app.innerHTML = `<main class="page plain result">
    <div class="res-head">
      <p class="eyebrow">${pain ? 'Séance arrêtée' : (R.reason === 'early' ? 'Séance écourtée' : 'Séance terminée')} · ${esc((PROGRAMS[e.prog] || {}).name || '')}</p>
      <h1 class="res-title">${titles[pain ? 0 : e.stars]}</h1>
      ${starsHTML}
      ${pain ? buddyHTML('Tu as bien fait de t’arrêter. Je garde tes points au chaud.', 'calm') : buddyHTML(lines[e.stars], e.stars === 3 ? 'wow' : 'happy')}
    </div>
    ${pain ? `<section class="notice danger"><b>Tu as eu raison de t’arrêter. Tu gardes tes points.</b><span>Une douleur qui descend dans la jambe ou des fourmillements, c’est le signal pour stopper. Parles-en à ton kiné avant la prochaine séance. Si ça ne passe pas ou si ça s’aggrave, consulte.</span></section>${redFlagsHTML(true)}` : ''}
    <section class="card set-card" aria-label="Ressenti après la séance">
      <p class="eyebrow">Ressenti · ${done ? 'noté' : '+20 XP'}</p>
      <h2 class="section-title">Ton dos, là, maintenant ?</h2>
      ${scaleHTML('ci-pain', R.ci.pain ?? e.pain)}
      <h2 class="section-title">Douleur ou fourmillements dans la jambe ?</h2>
      ${legHTML('ci-leg', R.ci.leg ?? e.leg)}
      ${done ? ciMessage(e) : `<p class="ci-msg muted">${e.painBefore != null ? `Avant la séance, tu étais à ${e.painBefore}/10.` : 'Réponds aux deux questions, c’est gardé pour ton kiné.'}</p>`}
    </section>
    <div class="score-big"><span class="eyebrow">Score</span><b>${e.score}</b></div>
    <div class="stats3">
      <div class="stat"><b>${e.perfect}/${e.reps}</b><span>reps parfaites</span></div>
      <div class="stat"><b>${e.pyramids || 0}</b><span>pyramide${(e.pyramids || 0) > 1 ? 's' : ''} chamboulée${(e.pyramids || 0) > 1 ? 's' : ''}</span></div>
      <div class="stat"><b>${e.combo}</b><span>meilleur combo</span></div>
    </div>
    <p class="res-meta">Durée ${fmtClock(e.durS)}${e.veloMin ? ' · vélo ' + fmtMin(e.veloMin) + ' min' : ''}</p>
    <section class="card player" aria-label="Expérience">
      <div class="player-top">
        ${lvlToken(R.after.n)}
        <div class="player-main">
          <p class="eyebrow">+${e.xp} XP</p>
          <p class="lvl-name">${esc(R.after.name)}</p>
          <div class="xpbar" role="progressbar" aria-label="Points d’expérience" aria-valuemin="0" aria-valuemax="${R.after.span}" aria-valuenow="${R.after.into}"><i id="res-xp" style="width:${R.animate ? startPct : R.after.pct}%"></i></div>
          <p class="xp-meta"><b>${state.xp}</b> XP · encore ${R.after.next - state.xp} pour le niveau ${R.after.n + 1}</p>
        </div>
      </div>
    </section>
    ${lvUp}
    ${(R.challenges || []).map(c => `<div class="notice good"><b>Défi réussi : ${esc(c.name)} · +50 XP</b><span>${esc(c.desc)}</span></div>`).join('')}
    ${(R.outfits || []).map(o => `<div class="notice good new-outfit">${mascot('wow', o.id)}<div><b>Nouvelle tenue pour Chouquette : ${esc(o.name)}</b><span>Mets-la-lui dans l’onglet Progrès.</span></div></div>`).join('')}
    ${badges}
    ${R.relocked ? '<div class="notice warn"><b>Dos solide est reverrouillé.</b><span>La douleur est revenue dans la jambe : on revient aux programmes doux. Il se débloquera de nouveau après 10 séances de renforcement sans douleur et l’accord de ton kiné.</span></div>' : ''}
    ${R.sameDay ? '<div class="notice warn"><b>Deuxième séance aujourd’hui.</b><span>Elle ne remplit pas de nouveau cœur : ton dos a aussi besoin de jours de récupération.</span></div>' : ''}
    ${painExNames.length ? `<div class="notice warn"><b>Passé pour douleur, sans perte d’étoile</b><span>${esc(painExNames.join(', '))}. À signaler à ton kiné.</span></div>` : ''}
    <button class="btn primary big" data-action="home">Retour à l’accueil</button>
  </main>`;
  if (R.animate) { R.animate = false; setTimeout(() => { const i = $('#res-xp'); if (i) i.style.width = R.after.pct + '%'; }, 350); }
}

function applyCheckin() {
  const objs = new Set([R.entry, state.history.find(x => x.id === R.entry.id)].filter(Boolean));
  const first = R.entry.pain == null;
  objs.forEach(o => {
    o.pain = R.ci.pain; o.leg = !!R.ci.leg;
    if (o.leg && relockSolide()) R.relocked = true;
    o.back = backCat(o);
    if (first) o.xp = (o.xp || 0) + 20;
  });
  const outfitsBefore = unlockedOutfits(state);
  if (first) state.xp += 20;
  const fresh = evalBadges(state);
  if (fresh.length) R.badges = R.badges.concat(fresh);
  const ch = evalChallenges(state);
  if (ch.length) R.challenges = (R.challenges || []).concat(ch);
  R.outfits = (R.outfits || []).concat(OUTFITS.filter(o => o.test(state) && !outfitsBefore.includes(o.id)));
  R.after = levelInfo(state.xp);
  persist();
  renderResult();
}

/* ---------- Actions ---------- */
function relockSolide() {
  if (!state.settings.solideUnlocked) return false;
  state.settings.solideUnlocked = false; state.settings.solideUnlockedAt = null;
  return true;
}
function goHome() { ui.screen = 'home'; ui.resetArm = false; ui.pre = null; R = null; renderScreen(); window.scrollTo(0, 0); }
function openPrecheck(prog) { ui.pre = { prog, pain: null, leg: null, step: 'ask' }; ui.screen = 'precheck'; renderScreen(); window.scrollTo(0, 0); }
function endPractice() {
  const perfect = G ? G.perfect : 0;
  G = null;
  state.settings.tutorialDone = true;
  persist();
  const next = ui.afterPractice; ui.afterPractice = null;
  if (next) openPrecheck(next); else goHome();
  toast(perfect >= 3 ? 'Bien lancé ! Tu as compris le principe.' : 'Retiens bien : attends le jaune avant de taper.');
}
/* Dans Claude, un fichier passe par la capacité de téléchargement.
   Dans l’appli du téléphone, par le menu de partage (Fichiers, Mail...), sinon par un lien classique. */
function canSave() { return !!downloadsApi || !window.claude; }
function saveFile(name, text, type) {
  if (downloadsApi) return downloadsApi.save({ filename: name, data: text });
  if (window.claude) return Promise.reject({ code: 'unavailable' });
  try {
    const file = new File([text], name, { type });
    if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: name }).then(
        () => ({ status: 'shared' }),
        e => { throw { code: e && e.name === 'AbortError' ? 'declined' : 'unavailable' }; });
    }
  } catch {}
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return Promise.resolve({ status: 'saved' });
  } catch { return Promise.reject({ code: 'unavailable' }); }
}
function backupReminderHTML() {
  if (!backupDue(state, Date.now(), !!window.claude)) return '';
  return `<div class="notice warn"><b>Pense à sauvegarder ta progression.</b><span>Tes séances ne sont que dans ce téléphone. Exporte un fichier de sauvegarde et range-le dans tes fichiers ou envoie-le-toi par mail.</span>
    <div class="row-btns"><button class="btn primary" data-action="export">Exporter maintenant</button><button class="btn ghost" data-action="backup-later">Plus tard</button></div></div>`;
}
const ACTIONS = {
  settings() { ui.screen = 'settings'; ui.resetArm = false; ui.nextMsg = null; renderScreen(); window.scrollTo(0, 0); },
  home() { goHome(); },
  play(b) {
    ui.nextMsg = null;
    if (b.dataset.prog === 'milieu' && !state.settings.milieuOk) {
      ui.screen = 'home'; ui.tab = 'play'; ui.allProgs = true; renderScreen({ still: true });
      const t = $('.ticket.milieu'); if (t) t.scrollIntoView({ block: 'start' });
      return;
    }
    if (!state.settings.tutorialDone) { ui.afterPractice = b.dataset.prog; startGame('essai', null); return; }
    openPrecheck(b.dataset.prog);
  },
  practice() { ui.afterPractice = null; startGame('essai', null); },
  export() {
    saveFile('chamboule-sauvegarde-' + dayKey(new Date()) + '.json', JSON.stringify(body(), null, 1), 'application/json')
      .then(() => {
        state.settings.lastExport = new Date().toISOString(); state.settings.exportSnooze = null;
        persist(); renderScreen({ still: true }); toast('Sauvegarde exportée.');
      })
      .catch(e => { if (!e || e.code !== 'declined') toast('Export impossible ici.'); });
  },
  'backup-later'() {
    state.settings.exportSnooze = new Date(Date.now() + 7 * 86400000).toISOString();
    persist(); renderScreen({ still: true });
  },
  outfit(b) {
    const o = OUTFITS.find(x => x.id === b.dataset.id); if (!o || !o.test(state)) return;
    state.settings.outfit = o.id; persist(); renderScreen({ still: true }); toast(`Chouquette porte : ${o.name}`);
  },
  'all-progs'() { ui.allProgs = !ui.allProgs; renderScreen({ still: true }); },
  'show-solide'() {
    ui.allProgs = true; renderScreen({ still: true });
    const t = $('.ticket.solide'); if (t) t.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  },
  'ticket-toggle'(b) {
    const id = b.dataset.prog;
    if (ui.openTickets.has(id)) ui.openTickets.delete(id); else ui.openTickets.add(id);
    renderScreen({ still: true });
  },
  tab(b) { ui.tab = b.dataset.tab; ui.sheet = null; ui.nextMsg = null; renderScreen({ still: true }); window.scrollTo(0, 0); },
  'import-confirm'() {
    if (!ui.importData) return;
    state = ui.importData; ui.importData = null;
    persist(); renderScreen(); toast('Sauvegarde importée.');
  },
  'import-cancel'() { ui.importData = null; renderScreen(); },
  'sum-share'() {
    try { navigator.share({ title: 'Suivi dos', text: kineSummary(state) }).catch(() => {}); } catch {}
  },
  'pre-pain'(b) { ui.pre.pain = Number(b.dataset.v); ui.pre.step = 'ask'; renderScreen(); },
  'pre-leg'(b) { ui.pre.leg = b.dataset.v === '1'; ui.pre.step = 'ask'; renderScreen(); },
  'pre-go'() {
    const pre = ui.pre; if (pre.pain == null || pre.leg == null) return;
    if (pre.leg) { pre.step = 'leg'; renderScreen(); return; }
    if (pre.pain >= 7 && pre.prog !== 'difficile') { pre.step = 'high'; renderScreen(); return; }
    startGame(pre.prog, pre);
  },
  'pre-force'() { startGame(ui.pre.prog, ui.pre); },
  'pre-difficile'() { startGame('difficile', ui.pre); },
  'ex-open'(b) { ui.sheet = b.dataset.prog + ':' + b.dataset.ex; renderScreen({ still: true }); const c = $('.ex-sheet [data-action="ex-close"]'); if (c) c.focus(); },
  'ex-close'() { ui.sheet = null; renderScreen({ still: true }); },
  'ex-close-bg'(b, e) { if (e.target === b) ACTIONS['ex-close'](); },
  next(b) {
    const h = state.history.find(x => x.id === b.dataset.id); if (!h || h.next != null) return;
    const v = Number(b.dataset.v);
    const outfitsBefore = unlockedOutfits(state);
    h.next = v; h.nextAt = new Date().toISOString(); h.xp = (h.xp || 0) + 20; state.xp += 20;
    const base = h.painBefore ?? h.pain ?? 0;
    ui.nextMsg = (v >= 7 || v >= base + 3) ? { title: `Plus douloureux qu’avant la séance (${base} → ${v}).`, text: 'Prends un jour de repos ou fais Jour difficile, et parles-en à ton kiné.' } : null;
    h.back = backCat(h);
    evalBadges(state);
    const ch = evalChallenges(state);
    persist(); renderScreen({ still: true });
    const newOutfit = OUTFITS.find(o => o.test(state) && !outfitsBefore.includes(o.id));
    if (newOutfit) { setTimeout(() => toast(`Nouvelle tenue pour Chouquette : ${newOutfit.name} ! Va voir dans Progrès.`), 4300); }
    toast(ch.length > 1 ? `+20 XP. ${ch.length} défis réussis, +${ch.length * 50} XP !` : ch.length ? `+20 XP. Défi réussi : ${ch[0].name}, +50 XP !` : '+20 XP. Noté pour ton kiné.');
  },
  summary() { ui.summaryBack = ui.screen; ui.screen = 'summary'; renderScreen(); window.scrollTo(0, 0); },
  'summary-back'() { ui.screen = ui.summaryBack === 'settings' ? 'settings' : 'home'; renderScreen(); window.scrollTo(0, 0); },
  'sum-copy'() {
    const text = kineSummary(state);
    const fallback = () => {
      const el = $('#sum-text'); if (!el) return;
      try { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch {}
      toast('Texte sélectionné : utilise Copier de ton appareil.');
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Résumé copié.'), fallback);
      else fallback();
    } catch { fallback(); }
  },
  'sum-dl'() {
    saveFile('suivi-dos-' + dayKey(new Date()) + '.txt', kineSummary(state), 'text/plain')
      .then(() => toast('Résumé téléchargé.'))
      .catch(e => { if (!e || e.code !== 'declined') toast('Téléchargement impossible ici. Utilise Copier le texte.'); });
  },
  'unlock-open'(b) { ui.unlockOpen = b.dataset.prog || 'boule'; ui.unlockChecked = false; renderScreen({ still: true }); const c = $('#unlock-check'); if (c) c.focus(); },
  'unlock-cancel'() { ui.unlockOpen = null; ui.unlockChecked = false; renderScreen({ still: true }); },
  'unlock-confirm'(b) {
    if (!ui.unlockChecked) return;
    const id = b.dataset.prog || 'boule';
    if (id === 'solide') {
      if (solidStreak(state) < SOLIDE_NEEDED) return;
      state.settings.solideUnlocked = true; state.settings.solideUnlockedAt = new Date().toISOString();
    } else { state.settings.bouleUnlocked = true; state.settings.bouleUnlockedAt = new Date().toISOString(); }
    ui.unlockOpen = null; ui.unlockChecked = false;
    persist(); renderScreen({ still: true });
    toast(id === 'solide' ? 'Dos solide débloqué ! Au moindre retour de douleur dans la jambe, il se reverrouille.' : 'Boule qui chamboule débloqué. Arrête au moindre fourmillement.');
  },
  'milieu-ok'() {
    state.settings.milieuOk = true; state.settings.milieuOkAt = new Date().toISOString();
    persist(); renderScreen({ still: true });
    toast('Dos du milieu ouvert. Arrête si la douleur change de place ou si le ventre se manifeste.');
  },
  relock() { state.settings.bouleUnlocked = false; state.settings.bouleUnlockedAt = null; persist(); renderScreen(); },
  'hist-toggle'() { ui.historyAll = !ui.historyAll; renderScreen({ still: true }); },
  'set-sets'(b) { state.settings.sets = clamp(Number(b.dataset.v) || 1, 1, 3); persist(); renderScreen(); },
  'velo-dec'() { state.settings.veloMin = clamp(state.settings.veloMin - 1, 3, 45); persistSoon(); renderScreen(); },
  'velo-inc'() { state.settings.veloMin = clamp(state.settings.veloMin + 1, 3, 45); persistSoon(); renderScreen(); },
  'goal-dec'() { state.settings.weeklyGoal = clamp(state.settings.weeklyGoal - 1, 1, 7); persistSoon(); renderScreen(); },
  'goal-inc'() { state.settings.weeklyGoal = clamp(state.settings.weeklyGoal + 1, 1, 7); persistSoon(); renderScreen(); },
  'sound-toggle'() { state.settings.sound = !state.settings.sound; persist(); renderScreen(); if (state.settings.sound) SFX.perfect(); else hush(); },
  'bike-toggle'() {
    state.settings.bike = !state.settings.bike; persist(); renderScreen({ still: true });
    toast(state.settings.bike ? 'Vélo remis dans la Reprise dos' : 'Vélo mis de côté jusqu’à ce que tu le remettes');
  },
  'hf-toggle'() { state.settings.handsFree = !state.settings.handsFree; persist(); renderScreen(); },
  'reset-arm'() { ui.resetArm = true; renderScreen(); },
  'reset-cancel'() { ui.resetArm = false; renderScreen(); },
  'reset-confirm'() { state = defaultState(); ui.resetArm = false; persist(); renderScreen(); toast('Progression effacée.'); },
  'ci-pain'(b) { R.ci.pain = Number(b.dataset.v); if (R.ci.leg == null && R.entry.leg != null) R.ci.leg = R.entry.leg; if (R.ci.leg != null) applyCheckin(); else renderResult(); },
  'ci-leg'(b) { R.ci.leg = b.dataset.v === '1'; if (R.ci.pain == null && R.entry.pain != null) R.ci.pain = R.entry.pain; if (R.ci.pain != null) applyCheckin(); else renderResult(); },

  go() {
    if (!G) return;
    const ex = G.steps[G.i].ex;
    if (G.phase === 'intro' && ex.kind === 'timer') { G.phase = 'timer'; G.lastMin = null; G.timer = { running: false, acc: 0, since: 0, dur: timerMin(state, ex) * 60000, credited: false }; renderGame(); return; }
    beginPlay();
    // iOS ne laisse parler l’appli que si la première phrase part d’un toucher : on parle ici, tout de suite.
    if (G.hf) { if (ex.kind === 'breath') { say('Inspire'); G.cue = 1; } else say('C’est parti'); }
  },
  'hf-game'() { if (!G) return; G.hf = !G.hf; state.settings.handsFree = G.hf; persistSoon(); if (G.hf) say('Mains libres activé'); renderGame(); },
  mute() { if (!G) return; state.settings.sound = !state.settings.sound; persistSoon(); if (!state.settings.sound) hush(); renderGame(); },
  skip() { if (G) skipExercise(false); },
  undo() { if (G) undo(); },
  'set-done'() { if (G && !G.flashUntil) finishSet(); },
  'rest-add'() { if (G) { G.restEnd += 15000; G.lastRem = -1; } },
  'timer-toggle'() { if (G) toggleTimer(); },
  'timer-done'() {
    if (!G || G.timer.credited || G.flashUntil) return;
    if (timerElapsed(performance.now()) < 5000) { skipExercise(false); return; }
    creditTimer(false);
  },
  pain() { if (G) openOverlay('pain'); },
  quit() { if (G) openOverlay('quit'); },
  'overlay-close'() { if (G) closeOverlay(); },
  'pain-stop'() { if (G) { G.overlay = null; finish('pain'); } },
  'pain-skip'() { if (G) { skipExercise(true); toast('Exercice passé, sans perte d’étoile. Pense à le signaler à ton kiné.'); } },
  'end-now'() { if (G) { G.overlay = null; finish('early'); } },
  abandon() {
    if (!G) return;
    stopLoop(); wakeLock(false); hush();
    if (G.prog.practice) { endPractice(); return; }
    G = null; goHome();
    toast('Séance quittée. Rien n’a été enregistré.');
  }
};

app.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.action];
  if (fn) fn(b, e);
});
app.addEventListener('change', e => {
  if (e.target.id === 'unlock-check') {
    ui.unlockChecked = e.target.checked;
    const btn = $('#unlock-confirm'); if (btn) btn.disabled = !ui.unlockChecked;
  }
  if (e.target.id === 'import-file') {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null;
      try { obj = JSON.parse(String(rd.result)); } catch {}
      if (!obj || typeof obj !== 'object' || (!Array.isArray(obj.history) && typeof obj.xp !== 'number')) { toast('Ce fichier n’est pas une sauvegarde Chamboule Coach.'); return; }
      ui.importData = normalize(obj); renderScreen();
    };
    rd.onerror = () => toast('Lecture du fichier impossible.');
    rd.readAsText(f);
  }
});
function zoneTap() {
  if (!G || G.overlay) return;
  if (G.phase === 'play') { if (G.hf) togglePause(); else tap(); }
  else if (G.phase === 'timer') toggleTimer();
}
app.addEventListener('pointerdown', e => {
  if (ui.screen !== 'game') return;
  const z = e.target.closest('[data-tap]');
  if (!z || (e.button !== undefined && e.button !== 0)) return;
  e.preventDefault();
  zoneTap();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.sheet && ui.screen === 'home') { ACTIONS['ex-close'](); return; }
  if (ui.screen !== 'game' || !G) return;
  if (e.key === 'Escape' && G.overlay) { closeOverlay(); return; }
  if (G.overlay || (e.key !== ' ' && e.key !== 'Enter')) return;
  if (e.target.closest && e.target.closest('button, input, a')) return;
  if (G.phase === 'play' || G.phase === 'timer') { e.preventDefault(); zoneTap(); }
});

/* Infobulle du graphique */
function hideTip() { const t = $('#chart-tip'); if (t) t.hidden = true; }
function showTip(hitEl) {
  const wrap = hitEl.closest('.chart-wrap'), t = $('#chart-tip'), svg = wrap && wrap.querySelector('svg');
  if (!t || !svg) return;
  const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), k = r.width / vb.width;
  t.textContent = hitEl.dataset.tip;
  t.style.left = clamp(Number(hitEl.dataset.x) * k, 70, r.width - 70) + 'px';
  t.style.top = (Number(hitEl.dataset.y) * k) + 'px';
  t.hidden = false;
}
app.addEventListener('pointermove', e => {
  if (ui.screen !== 'home') return;
  const h = e.target.closest && e.target.closest('[data-tip]');
  if (h) showTip(h); else hideTip();
});
app.addEventListener('focusin', e => { const h = e.target.closest && e.target.closest('[data-tip]'); if (h) showTip(h); });
app.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('[data-tip]')) hideTip(); });

initStore();
