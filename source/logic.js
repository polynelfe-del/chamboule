/* Chamboule Coach : données et logique du jeu.
   Aucun accès à la page ni au stockage ici : tout est testable dans tests/logic.test.js. */

/* ---------- Exercices ---------- */
const EX = {
  transverse: { id: 'transverse', name: 'Respiration du transverse', kind: 'breath', target: 5, tempo: 8,
    cue: 'Sur le dos, genoux pliés, pieds à plat. Inspire par le nez, puis expire longuement en rentrant doucement le bas du ventre.',
    tip: 'Suis le cercle : il grossit quand tu inspires, rapetisse quand tu expires.' },
  birddog: { id: 'birddog', name: 'Bras-jambe opposés (bird-dog)', kind: 'reps', target: 5, sides: true, tempo: 5,
    cue: 'À quatre pattes, dos neutre. Tends lentement un bras et la jambe opposée, tiens 2 secondes, puis reviens.',
    tip: 'Le bassin ne bouge pas, comme si un verre d’eau était posé sur ton dos.' },
  pont: { id: 'pont', name: 'Pont fessier', kind: 'reps', target: 6, max: 8, tempo: 4,
    cue: 'Sur le dos, pieds à plat. Serre les fessiers et monte le bassin, sans accentuer la cambrure.',
    tip: 'Monte jusqu’à l’alignement épaules, hanches, genoux. Pas plus haut.' },
  velo: { id: 'velo', name: 'Vélo d’appartement', kind: 'timer',
    cue: 'Résistance légère, buste peu penché. Tu dois pouvoir parler en pédalant.',
    tip: 'Allonge la durée petit à petit, d’une séance à l’autre, dans les réglages.' },
  hipthrust: { id: 'hipthrust', name: 'Poussée de hanches (hip thrust)', kind: 'reps', target: 12, sets: 4, tempo: 3,
    cue: 'Haut du dos appuyé sur un banc ou le canapé. Pousse le bassin vers le haut en serrant les fessiers.',
    tip: 'Menton rentré, côtes basses : pas de cambrure en haut du mouvement.' },
  fentes: { id: 'fentes', name: 'Fentes arrière', kind: 'reps', target: 10, sides: true, sideLabel: 'jambe', sets: 3, tempo: 3,
    cue: 'Recule une jambe, descends le genou arrière vers le sol, remonte en poussant sur le talon avant.',
    tip: 'Buste droit, genou avant au-dessus de la cheville.' },
  donkey: { id: 'donkey', name: 'Ruade à quatre pattes (donkey kick)', kind: 'reps', target: 15, sides: true, sets: 3, tempo: 2,
    cue: 'À quatre pattes, pousse un talon vers le plafond, genou plié à 90°.',
    tip: 'Le dos reste plat : le mouvement vient de la fesse, pas des lombaires.' },
  sumo: { id: 'sumo', name: 'Squats sumo', kind: 'reps', target: 12, sets: 3, tempo: 3,
    cue: 'Pieds écartés, pointes vers l’extérieur. Descends buste droit, genoux dans l’axe des pieds.',
    tip: 'Descends seulement tant que ton dos reste neutre.' },
  hydrant: { id: 'hydrant', name: 'Genou sur le côté (fire hydrant)', kind: 'reps', target: 10, sides: true, free: true, sets: 1, tempo: 2,
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
    tip: 'Dehors, dans le couloir ou sur place : tout compte.' },
  /* Ajoutés après recherche : fiches de kinés hospitaliers (CUH), Hinge Health, MSD, HUG Genève. */
  bascule: { id: 'bascule', name: 'Bascule du bassin', kind: 'reps', target: 8, tempo: 4,
    cue: 'Sur le dos, genoux pliés. En expirant, plaque doucement le bas du dos au sol en basculant le bassin, puis relâche.',
    tip: 'Petit mouvement, sans pousser avec les pieds ni décoller les fesses.' },
  genoupoitrine: { id: 'genoupoitrine', name: 'Genou vers la poitrine', kind: 'hold', target: 2, hold: 15, sides: true,
    cue: 'Sur le dos, genoux pliés. Ramène un genou vers la poitrine avec les mains et tiens en respirant calmement.',
    tip: 'Tire doucement, sans douleur. L’autre pied reste au sol.' },
  rouleau: { id: 'rouleau', name: 'Rotation des genoux', kind: 'reps', target: 8, tempo: 5,
    cue: 'Sur le dos, genoux pliés et serrés. Laisse lentement tomber les genoux d’un côté puis de l’autre, les épaules restent au sol.',
    tip: 'Seulement dans l’amplitude confortable. Un côté puis l’autre, deux répétitions.' },
  talons: { id: 'talons', name: 'Fesses vers les talons', kind: 'reps', target: 8, tempo: 6,
    cue: 'À quatre pattes. Recule lentement les fesses vers les talons en gardant les mains au sol, respire, puis reviens.',
    tip: 'Ne descends pas jusqu’aux talons si tes genoux n’aiment pas.' },
  coquillage: { id: 'coquillage', name: 'Coquillage', kind: 'reps', target: 10, sides: true, tempo: 3,
    cue: 'Sur le côté, hanches et genoux pliés, pieds joints. Ouvre le genou du dessus sans faire rouler le bassin, puis redescends lentement.',
    tip: 'Le bassin ne bascule pas vers l’arrière : c’est la fesse qui travaille.' },
  abduction: { id: 'abduction', name: 'Jambe levée sur le côté', kind: 'reps', target: 10, sides: true, tempo: 3,
    cue: 'Sur le côté, jambes tendues, tête posée sur le bras. Lève la jambe du dessus, pointe du pied vers l’avant, puis redescends lentement.',
    tip: 'Une petite hauteur suffit. Le dos ne se creuse pas.' },
  assisdebout: { id: 'assisdebout', name: 'Assis-debout', kind: 'reps', target: 8, tempo: 4,
    cue: 'Au bord d’une chaise calée contre un mur. Pousse dans les talons pour te lever, puis rassieds-toi en reculant les fesses.',
    tip: 'Buste droit, genoux dans l’axe des pieds. Mains sur les cuisses au début si besoin.' },
  gainagelat: { id: 'gainagelat', name: 'Gainage latéral sur genoux', kind: 'hold', target: 2, hold: 15, sides: true,
    cue: 'Sur le côté, coude sous l’épaule, genoux pliés. Soulève les hanches pour aligner épaules, hanches et genoux, et tiens.',
    tip: 'Commence par 10 à 15 secondes. Arrête si le bas du dos tire.' },
  /* Dos solide : les mêmes muscles, un cran plus fort. Verrouillé tant que le dos n’est pas stable. */
  birddogtenu: { id: 'birddogtenu', name: 'Bras-jambe opposés tenu (bird-dog)', kind: 'hold', target: 3, hold: 5, sides: true,
    cue: 'À quatre pattes, dos neutre. Tends un bras et la jambe opposée et tiens 5 secondes sans bouger le bassin.',
    tip: 'Si le bassin tourne, raccourcis le bras ou la jambe.' },
  pontmarche: { id: 'pontmarche', name: 'Pont marché', kind: 'reps', target: 6, tempo: 4,
    cue: 'En pont, bassin levé. Décolle lentement un pied de quelques centimètres, repose-le, puis l’autre, sans que le bassin penche.',
    tip: 'Si le bassin bascule, garde les deux pieds au sol : le pont simple suffit encore.' },
  deadbug: { id: 'deadbug', name: 'Bras-jambe opposés sur le dos (dead bug)', kind: 'reps', target: 6, tempo: 5,
    cue: 'Sur le dos, bras tendus vers le plafond, genoux pliés à 90° au-dessus des hanches. Allonge lentement un bras et la jambe opposée, reviens, change de côté.',
    tip: 'Le bas du dos reste plaqué au sol. Plus la jambe descend, plus c’est dur : garde-la haute au début.' },
  squatchaise: { id: 'squatchaise', name: 'Squat à la chaise', kind: 'reps', target: 8, tempo: 4,
    cue: 'Debout devant une chaise, pieds écartés de la largeur des hanches. Recule les fesses jusqu’à effleurer la chaise, puis remonte en poussant dans les talons.',
    tip: 'Buste droit, genoux dans l’axe des pieds. Tu effleures la chaise sans t’asseoir.' },
  plancheplus: { id: 'plancheplus', name: 'Planche sur les pieds', kind: 'hold', target: 3, hold: 10,
    cue: 'Sur les avant-bras, coudes sous les épaules, jambes tendues sur la pointe des pieds. Corps droit, ventre rentré.',
    tip: 'Dès que le bas du dos se creuse, repose les genoux.' }
};

/* Haut du corps doux et versions plus difficiles (échelles de progression), d’après la calisthénie et des fiches de kinés :
   debout, sans charge sur la colonne, sans saut ni flexion du dos sous charge. */
Object.assign(EX, {
  murpompe: { id: 'murpompe', name: 'Pompes contre le mur', kind: 'reps', target: 8, sets: 2, tempo: 4,
    cue: 'Debout face au mur, mains à hauteur des épaules, un peu plus écartées. Corps droit des talons à la tête, plie les coudes pour approcher la poitrine du mur, puis repousse.',
    tip: 'Rentre légèrement le ventre : le bas du dos ne se creuse pas. Recule les pieds pour rendre plus dur.' },
  planpompe: { id: 'planpompe', name: 'Pompes au plan de travail', kind: 'reps', target: 8, sets: 2, tempo: 4,
    cue: 'Mains sur le bord d’un plan de travail ou d’une table bien stable, un peu plus écartées que les épaules. Corps droit des talons à la tête, descends la poitrine vers le bord, puis repousse.',
    tip: 'Plus le support est bas, plus c’est dur. Si le bas du dos se creuse, reviens au mur.' },
  genoupompe: { id: 'genoupompe', name: 'Pompes sur les genoux', kind: 'reps', target: 6, sets: 2, tempo: 4,
    cue: 'À genoux sur un tapis, mains sous les épaules. Corps droit des genoux à la tête, descends la poitrine vers le sol, puis repousse.',
    tip: 'Ventre rentré tout du long. Si le bas du dos se creuse, reviens au plan de travail.' },
  rowserviette: { id: 'rowserviette', name: 'Rowing à la serviette', kind: 'reps', target: 8, sets: 2, tempo: 4,
    cue: 'Face à une porte fermée qui s’ouvre de l’autre côté : en tirant, tu la plaques contre son cadre. Passe une serviette solide autour de la poignée, un bout dans chaque main. Pieds près de la porte, penche-toi un peu en arrière bras tendus, puis tire la poitrine vers la porte en serrant les omoplates.',
    tip: 'Commence presque droit : plus tu te penches, plus c’est dur. Corps gainé, gestes lents pour que la serviette ne glisse pas.' },
  rowpenche: { id: 'rowpenche', name: 'Rowing à la serviette, penché', kind: 'reps', target: 8, sets: 2, tempo: 4,
    cue: 'Même installation, pieds plus près de la porte : tu es davantage penché en arrière. Tire la poitrine vers la porte en serrant les omoplates, puis redescends lentement.',
    tip: 'Corps droit comme une planche. Si la serviette glisse ou si le dos tire, reviens à la version debout.' },
  angesmur: { id: 'angesmur', name: 'Anges au mur', kind: 'reps', target: 8, sets: 2, tempo: 5,
    cue: 'Dos, tête et fesses contre le mur, pieds un peu en avant, genoux souples. Bras en chandelier contre le mur, fais-les glisser vers le haut sans les décoller, puis redescends.',
    tip: 'Ne monte que jusqu’où tout reste en contact. Le bas du dos ne se creuse pas : rentre légèrement le ventre.' },
  charniere: { id: 'charniere', name: 'Charnière de hanche', kind: 'reps', target: 8, sets: 2, tempo: 4,
    cue: 'Dos au mur, à une demi-longueur de pied. Genoux souples, recule les fesses jusqu’à toucher le mur en penchant le buste, dos bien droit, puis remonte en serrant les fesses.',
    tip: 'Tu dois sentir l’arrière des cuisses et les fesses, pas le bas du dos. C’est le bon geste pour te pencher au quotidien.' },
  charniereunejambe: { id: 'charniereunejambe', name: 'Charnière sur une jambe', kind: 'reps', target: 6, sets: 2, sides: true, sideLabel: 'jambe', tempo: 5,
    cue: 'Debout près d’un mur, une main dessus. Sur une jambe, genou souple, penche le buste en avant pendant que l’autre jambe part en arrière, dos droit, puis reviens.',
    tip: 'Le bassin reste face au sol, sans tourner. Petite amplitude au début.' },
  fentesoutenue: { id: 'fentesoutenue', name: 'Fente arrière avec appui', kind: 'reps', target: 6, sides: true, sideLabel: 'jambe', tempo: 4,
    cue: 'Une main sur le dossier d’une chaise stable ou un meuble. Recule une jambe, descends doucement le genou arrière vers le sol, puis remonte en poussant sur le talon avant.',
    tip: 'Buste droit, genou avant au-dessus de la cheville. Ne descends que là où c’est confortable.' }
});

const PROGRAMS = {
  dos: { id: 'dos', name: 'Reprise dos', tag: 'Routine du 11 oct. 2026', rest: 30,
    blurb: 'Gainage doux, fessiers et cardio léger, adaptés à ton dos. À faire valider par ton kiné.',
    exercises: [EX.transverse, EX.birddog, EX.pont, EX.velo] },
  solide: { id: 'solide', name: 'Dos solide', tag: 'Niveau supérieur', rest: 30,
    blurb: 'La suite quand ton dos va bien : les mêmes muscles, un cran plus fort. Se débloque après 10 séances de renforcement d’affilée à 3/10 de douleur au plus (avant, après et le lendemain), puis l’accord de ton kiné. Se reverrouille si la douleur revient dans la jambe.',
    exercises: [EX.birddogtenu, EX.pontmarche, EX.deadbug, EX.squatchaise, EX.plancheplus] },
  fessiers: { id: 'fessiers', name: 'Fessiers doux', tag: 'Sans charger le dos', rest: 30,
    blurb: 'Les fessiers travaillent sur le côté ou depuis une chaise, sans pression sur les disques. Une alternative douce à Boule qui chamboule. À faire valider par ton kiné.',
    exercises: [EX.coquillage, EX.abduction, EX.assisdebout, EX.gainagelat] },
  haut: { id: 'haut', name: 'Haut du corps doux', tag: 'Debout · sans charge', rest: 30,
    blurb: 'Bras, épaules et haut du dos, debout et sans charge sur la colonne, plus la charnière de hanche pour apprendre à te pencher sans plier le dos. Inspiré des programmes de calisthénie et de fiches de kinés. À faire valider par ton kiné.',
    exercises: [EX.murpompe, EX.rowserviette, EX.angesmur, EX.charniere] },
  calme: { id: 'calme', name: 'Dos calme', tag: 'Mobilité · 5 min', rest: 20,
    blurb: 'Des mouvements doux pour dérouiller le dos, même les jours un peu raides. Inspirés de fiches de kinés hospitaliers. Arrête si ça descend dans la jambe.',
    exercises: [EX.bascule, EX.genoupoitrine, EX.rouleau, EX.talons] },
  milieu: { id: 'milieu', name: 'Dos du milieu', tag: 'Mobilité douce', rest: 20,
    blurb: 'Mobilité et gainage profond, sans crunch ni mouvement brusque. Pour la marche, la balade du chien fait déjà le travail. Pont fessier et bras-jambe opposés sont dans Reprise dos. À faire valider par ton médecin ou ton kiné.',
    exercises: [EX.chatvache, EX.rotation, EX.thorax, EX.gainage, EX.planche] },
  difficile: { id: 'difficile', name: 'Jour difficile', tag: 'Séance douce · 3 min', rest: 30,
    blurb: 'Juste la respiration, pour garder le rythme sans rien forcer. Pour les jours où le dos est sensible.',
    exercises: [{ ...EX.transverse, sets: 2 }] },
  boule: { id: 'boule', name: 'Boule qui chamboule', tag: 'Programme fessiers · nov. 2025', rest: 45,
    blurb: 'Ton ancien programme fessiers. Il date d’avant les adaptations pour ton dos et n’a pas été revalidé.',
    exercises: [EX.hipthrust, EX.fentes, EX.donkey, EX.sumo, EX.hydrant] },
  essai: { id: 'essai', name: 'Essai', tag: '', rest: 0, practice: true, blurb: '',
    exercises: [{ id: 'essai', name: 'Essai : 3 lancers', kind: 'reps', target: 3, tempo: 3, prescText: 'Tape 3 fois au bon moment',
      cue: 'Pas besoin de bouger. Regarde le cercle se remplir. Quand il devient jaune et que ça bipe, tape : la balle part sur les boîtes.',
      tip: 'Si tu tapes trop tôt, la balle rate. Ici, la lenteur gagne toujours.' }] }
};
const PROG_ORDER = ['dos', 'milieu', 'fessiers', 'haut', 'calme', 'difficile', 'solide', 'boule'];
const SOLIDE_NEEDED = 10;

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
  { id: 'chamboule', name: 'Boule qui chamboule', desc: 'Première séance du programme fessiers', glyph: 'BQC', test: s => s.history.some(h => h.prog === 'boule') },
  { id: 'forme', name: 'En forme', desc: 'Faire un test de forme', glyph: 'T', test: s => (s.tests || []).length >= 1 }
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
  { id: 'douceur', name: 'Douceur', desc: 'Faire une séance douce : Jour difficile, Dos calme ou Dos du milieu', goal: 1, prog: w => w.filter(h => ['difficile', 'milieu', 'calme'].includes(h.prog)).length },
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
/* Sans vélo, le défi vélo de la semaine est remplacé par un autre ; les deux autres ne changent pas. */
function weekChallenges(d, noBike) {
  let h = 7;
  for (const ch of weekKey(d)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = CHALLENGES.slice(), out = [];
  const draw = () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return pool.splice(h % pool.length, 1)[0]; };
  for (let i = 0; i < 3; i++) out.push(draw());
  const v = out.findIndex(c => c.id === 'velo15');
  if (noBike && v >= 0) out[v] = draw();
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
  return { v: 1, xp: 0, bestCombo: 0, settings: { sets: 1, fessiersSets: 1, veloMin: 10, bike: true, weeklyGoal: 3, reminderDays: [1, 3, 5], reminderTime: '18:00', sound: true, handsFree: false, tutorialDone: false, bouleUnlocked: false, bouleUnlockedAt: null, solideUnlocked: false, solideUnlockedAt: null, milieuOk: false, milieuOkAt: null, lastExport: null, exportSnooze: null, outfit: 'noeud', rungs: {}, stepReset: {} }, badges: {}, challenges: {}, history: [], tests: [] };
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
/* Test de forme du mois : deux mesures de 30 secondes, debout, comparées à soi-même d’un mois sur l’autre. */
const FIT_TESTS = [
  { id: 'chaise', name: 'Assis-debout en 30 secondes', short: 'assis-debout', ex: 'assisdebout', max: 60,
    cue: 'Assis au milieu d’une chaise calée contre un mur, bras croisés sur la poitrine. Au top, lève-toi complètement puis rassieds-toi, autant de fois que possible en 30 secondes, sans te précipiter. Compte à voix haute : tu noteras le total à la fin.' },
  { id: 'mur', name: 'Pompes contre le mur en 30 secondes', short: 'pompes au mur', ex: 'murpompe', max: 120,
    cue: 'Face au mur, mains à hauteur des épaules, corps droit. Au top, fais autant de pompes contrôlées que possible en 30 secondes. Compte à voix haute : tu noteras le total à la fin.' }
];
const TEST_EVERY_DAYS = 28, TEST_XP = 30;
function cleanTest(t) {
  if (!t || typeof t !== 'object') return null;
  const d = isoOr(t.d); if (!d) return null;
  const out = { d };
  FIT_TESTS.forEach(f => { out[f.id] = numOr(t[f.id], 0, f.max, null, true); });
  return FIT_TESTS.some(f => out[f.id] != null) ? out : null;
}
function testDue(s, now = new Date()) {
  if (s.history.length < 3) return false;
  const last = (s.tests || [])[0];
  return !last || now.getTime() - Date.parse(last.d) >= TEST_EVERY_DAYS * 86400000;
}
function cleanSettings(s, d) {
  s = s && typeof s === 'object' ? s : {};
  return {
    sets: numOr(s.sets, 1, 3, d.sets, true), fessiersSets: numOr(s.fessiersSets, 1, 2, d.fessiersSets, true), veloMin: numOr(s.veloMin, 3, 45, d.veloMin, true), bike: s.bike !== false, weeklyGoal: numOr(s.weeklyGoal, 1, 7, d.weeklyGoal, true),
    sound: typeof s.sound === 'boolean' ? s.sound : d.sound, handsFree: s.handsFree === true, tutorialDone: s.tutorialDone === true,
    bouleUnlocked: s.bouleUnlocked === true, bouleUnlockedAt: isoOr(s.bouleUnlockedAt),
    solideUnlocked: s.solideUnlocked === true, solideUnlockedAt: isoOr(s.solideUnlockedAt),
    milieuOk: s.milieuOk === true, milieuOkAt: isoOr(s.milieuOkAt),
    lastExport: isoOr(s.lastExport), exportSnooze: isoOr(s.exportSnooze),
    reminderDays: Array.isArray(s.reminderDays) ? [...new Set(s.reminderDays.filter(x => Number.isInteger(x) && x >= 0 && x <= 6))].sort((a, b) => a - b) : d.reminderDays.slice(),
    reminderTime: typeof s.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime) ? s.reminderTime : d.reminderTime,
    outfit: typeof s.outfit === 'string' && OUTFITS.some(o => o.id === s.outfit) ? s.outfit : 'noeud',
    rungs: Object.fromEntries(LADDERS.map(l => [l.id, numOr((s.rungs || {})[l.id], 0, l.rungs.length - 1, 0, true)]).filter(([, v]) => v > 0)),
    stepReset: Object.fromEntries(STEP_PROGS.map(id => [id, isoOr((s.stepReset || {})[id])]).filter(([, v]) => v))
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
    history: Array.isArray(raw.history) ? raw.history.slice(0, 300).map(cleanEntry).filter(Boolean) : [],
    tests: Array.isArray(raw.tests) ? raw.tests.slice(0, 60).map(cleanTest).filter(Boolean) : []
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
/* Programmes qui prouvent que le dos encaisse du renforcement. La respiration et la mobilité ne comptent pas. */
const STRENGTH_PROGS = ['dos', 'milieu', 'fessiers', 'solide', 'boule'];
/* Une séance « sans douleur » : 3/10 au plus avant, après et le lendemain, sans aggravation, sans symptôme dans la jambe
   ni exercice passé pour douleur. Renvoie 'count' quand le lendemain est noté, 'wait' tant qu’il manque, 'break' sinon,
   et null quand aucun ressenti n’a été noté. */
const QUIET_MAX = 3;
function quietState(h) {
  if (h.pain == null && !h.stop) return null;
  if (backCat(h) !== 'ok' || (h.painEx && h.painEx.length)) return 'break';
  if (Math.max(h.painBefore ?? 0, h.pain, h.next ?? 0) > QUIET_MAX) return 'break';
  return h.next == null ? 'wait' : 'count';
}
/* Séances de renforcement « sans douleur » d’affilée. Une séance douce ou pas encore suivie le lendemain ne compte pas
   mais ne casse pas la série ; toute séance au-dessus de 3/10 la remet à zéro, quel que soit le programme. */
function solidStreak(s) {
  let n = 0;
  for (const h of s.history) {
    const q = quietState(h);
    if (q === 'break') break;
    if (q === 'count' && STRENGTH_PROGS.includes(h.prog)) n++;
  }
  return n;
}
/* Séance du jour proposée par Chouquette : la douleur récente d’abord, puis le programme fait le moins récemment. */
const SUGGEST_ROTATION = ['dos', 'fessiers', 'milieu', 'haut'];
function suggestToday(s, now = new Date()) {
  const last = s.history[0];
  if (!last) return { prog: 'dos', why: 'Coucou, moi c’est Chouquette ! Pour commencer, ta routine de base, tout en douceur.' };
  if (s.history.some(h => dayKey(h.d) === dayKey(now))) {
    return { prog: 'calme', rest: true, why: 'Ton cœur du jour est déjà rempli. Repos, ou quelques minutes de Dos calme si le dos est raide.' };
  }
  const recent = now.getTime() - new Date(last.d).getTime() < 3 * 86400000;
  const cat = backCat(last);
  if (recent && (cat === 'douleur' || cat === 'stop')) {
    return { prog: 'difficile', why: 'Ton dos a été douloureux à la dernière séance. Aujourd’hui, juste la respiration, et on voit demain.' };
  }
  if (recent && cat === 'sensible') return { prog: 'calme', why: 'Ton dos était un peu sensible la dernière fois : place aux mouvements doux.' };
  const dayBefore = n => { const d = new Date(now); d.setDate(d.getDate() - n); return dayKey(d); };
  if ([1, 2, 3].every(n => s.history.some(h => dayKey(h.d) === dayBefore(n)))) {
    return { prog: 'calme', rest: true, why: 'Trois jours d’affilée : aujourd’hui, je te conseille le repos. La balade du chien suffit, et si le dos est raide, quelques minutes de Dos calme.' };
  }
  /* Dos du milieu n’est proposé qu’une fois l’avis médical déclaré. */
  const pool = SUGGEST_ROTATION.filter(id => id !== 'milieu' || s.settings.milieuOk).concat(s.settings.solideUnlocked ? ['solide'] : []);
  const lastDone = id => { const h = s.history.find(x => x.prog === id); return h ? new Date(h.d).getTime() : 0; };
  const prog = pool.slice().sort((a, b) => lastDone(a) - lastDone(b))[0];
  const why = {
    dos: s.settings.bike ? 'Ta routine de base : respiration, bras-jambe opposés, pont et vélo.' : 'Ta routine de base : respiration, bras-jambe opposés et pont, sans le vélo.',
    fessiers: 'Au tour des fessiers, sans charger le dos.',
    milieu: 'Un peu de mobilité et de gainage pour le dos du milieu.',
    haut: 'Au tour du haut du corps : bras, épaules et haut du dos, debout.',
    solide: 'Ton dos va bien : on passe un cran au-dessus.'
  }[prog];
  return { prog, why: why + ' C’est celui que tu as fait le moins récemment.' };
}
/* Bonus quand on suit jusqu’au bout la séance proposée par Chouquette (jamais un jour de repos). */
const SUGGEST_BONUS = 15;
function suggestBonus(sug, progId, reason) { return sug && !sug.rest && sug.prog === progId && reason === 'done' ? SUGGEST_BONUS : 0; }
function painFreeRun(s) {
  let n = 0;
  for (const h of s.history) {
    if (h.prog !== 'dos') continue;
    const q = quietState(h);
    if (q === 'break' || q === null) break;
    if (q === 'count') n++;
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
/* Note le suivi du lendemain sur la séance et sur les autres séances du même jour encore sans suivi (+20 XP une fois). */
function applyNext(s, id, v, now = new Date()) {
  const h = s.history.find(x => x.id === id);
  if (!h || h.next != null) return null;
  const day = dayKey(h.d), at = now.toISOString();
  s.history.filter(x => x.next == null && dayKey(x.d) === day).forEach(x => { x.next = v; x.nextAt = at; x.back = backCat(x); });
  h.xp = (h.xp || 0) + 20; s.xp += 20;
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
  weekChallenges(now, !s.settings.bike).forEach(c => { if (!done[c.id] && chalProgress(s, c, now) >= c.goal) { done[c.id] = dayKey(now); s.xp += 50; fresh.push(c); } });
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
function setsFor(s, prog, ex) { return prog.id === 'dos' ? s.settings.sets : prog.id === 'fessiers' ? s.settings.fessiersSets : (ex.sets || 1); }
function sideText(ex, side) { return ex.sideLabel === 'jambe' ? 'jambe ' + (side === 'droit' ? 'droite' : 'gauche') : 'côté ' + side; }
/* Le programme tel qu’il sera joué : sans le vélo quand il est mis de côté dans les réglages. */
function hasBike(p) { return !!p && p.exercises.some(ex => ex.id === 'velo'); }
/* Progression automatique : un cran de plus toutes les 3 séances calmes et complètes du programme (2 crans au plus),
   un cran de moins dès qu’une séance, quel que soit le programme, dépasse 3/10. Dans Reprise dos, la routine du kiné
   ne progresse que dans la fourchette qu’il a donnée (pont : 6 à 8). La mobilité et la respiration ne progressent pas. */
const STEP_PROGS = ['dos', 'fessiers', 'milieu', 'haut', 'solide'];
const STEP_EVERY = 3, STEP_MAX = 2;
function stepLevel(s, progId) {
  if (!STEP_PROGS.includes(progId)) return 0;
  const since = Date.parse((s.settings.stepReset || {})[progId] || '') || 0;
  let lvl = 0, run = 0;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const h = s.history[i];
    if (Date.parse(h.d) <= since) continue;
    const q = quietState(h);
    if (q === 'break') { lvl = Math.max(0, lvl - 1); run = 0; continue; }
    if (q !== 'count' || h.prog !== progId || (h.skipped && h.skipped.length)) continue;
    if (++run >= STEP_EVERY) { lvl = Math.min(STEP_MAX, lvl + 1); run = 0; }
  }
  return lvl;
}
function stepped(ex, progId, lvl) {
  if (!lvl || ex.free || ex.kind === 'breath' || ex.kind === 'timer' || (progId === 'dos' && !ex.max)) return ex;
  if (ex.kind === 'hold') return Object.assign({}, ex, { hold: ex.hold + Math.max(1, Math.round(ex.hold * 0.2)) * lvl });
  return Object.assign({}, ex, { target: ex.max ? Math.min(ex.max, ex.target + lvl) : ex.target + lvl });
}
/* Échelles de progression (principe de la calisthénie) : chaque mouvement a des versions de plus en plus dures.
   Au dernier cran d’un programme, ses versions suivantes peuvent se débloquer, avec l’accord du kiné ;
   les crans de ce programme repartent alors de zéro. On peut toujours revenir à la version précédente. */
const LADDERS = [
  { id: 'pousser', name: 'Pousser', prog: 'haut', rungs: ['murpompe', 'planpompe', 'genoupompe'] },
  { id: 'tirer', name: 'Tirer', prog: 'haut', rungs: ['rowserviette', 'rowpenche'] },
  { id: 'pencher', name: 'Se pencher', prog: 'haut', rungs: ['charniere', 'charniereunejambe'] },
  { id: 'squat', name: 'S’accroupir', prog: 'fessiers', rungs: ['assisdebout', 'squatchaise', 'fentesoutenue'] },
  { id: 'gainage', name: 'Gainage', prog: 'milieu', rungs: ['planche', 'plancheplus'] }
];
function rungOf(s, l) { return Math.min(l.rungs.length - 1, (s.settings.rungs || {})[l.id] || 0); }
function laddersOf(progId) { return LADDERS.filter(l => l.prog === progId); }
function rungsReady(s, progId) { return stepLevel(s, progId) >= STEP_MAX ? laddersOf(progId).filter(l => rungOf(s, l) < l.rungs.length - 1) : []; }
/* Le programme tel qu’il sera joué : versions choisies, progression comprise, et sans le vélo quand il est mis de côté. */
function progFor(s, id) {
  const p = PROGRAMS[id];
  if (!p) return p;
  const lvl = stepLevel(s, id);
  let exercises = p.exercises;
  if (hasBike(p) && !s.settings.bike) exercises = exercises.filter(ex => ex.id !== 'velo');
  const swap = {};
  laddersOf(id).forEach(l => { const r = rungOf(s, l); if (r) swap[l.rungs[0]] = EX[l.rungs[r]]; });
  if (Object.keys(swap).length) exercises = exercises.map(ex => swap[ex.id] || ex);
  if (lvl) exercises = exercises.map(ex => stepped(ex, id, lvl));
  return exercises === p.exercises ? p : Object.assign({}, p, { exercises, level: lvl });
}
function timerMin(s, ex) { return ex.id === 'velo' ? s.settings.veloMin : (ex.minutes || 10); }
function presc(s, ex, sets) {
  if (ex.prescText) return ex.prescText;
  if (ex.kind === 'timer') return ex.id === 'velo' ? s.settings.veloMin + ' min, résistance légère' : timerMin(s, ex) + ' min, à ton rythme';
  const side = ex.sides ? ' par ' + (ex.sideLabel || 'côté') : '';
  if (ex.kind === 'hold') return (sets > 1 ? sets + ' × ' : '') + ex.target + ' maintiens de ' + ex.hold + ' s' + side;
  if (ex.kind === 'breath') return (sets > 1 ? sets + ' × ' : '') + ex.target + ' respirations lentes';
  if (ex.free) return 'Activation, environ ' + ex.target + side;
  const reps = ex.max && ex.max > ex.target ? ex.target + ' à ' + ex.max : String(ex.target);
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
/* XP d’une séance : 10 par minute jouée (15 min au plus), modulés par la qualité, +20 pour la première séance du jour.
   Une autre séance le même jour rapporte moitié moins et sans bonus : enchaîner les séances courtes ne paie pas.
   Un exercice passé pour douleur ne pénalise pas. */
const XP_MINUTES_CAP = 15;
function computeXP(prog, r, minutes, repeat) {
  const considered = prog.exercises.map(e => e.id).filter(id => !r.painEx.includes(id));
  const done = considered.filter(id => !r.skipped.includes(id)).length;
  const completion = considered.length ? done / considered.length : 0;
  const quality = r.reps ? r.perfect / r.reps : 1;
  const xp = Math.round(10 * Math.min(XP_MINUTES_CAP, minutes) * completion * (0.6 + 0.4 * quality));
  return repeat ? Math.round(xp / 2) : xp + 20;
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
/* Fichier agenda (.ics) : un rappel répété chaque semaine aux jours et à l’heure choisis, à l’heure locale du téléphone. */
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function reminderICS(days, time, now = new Date()) {
  if (!days.length) return '';
  const [hh, mm] = time.split(':').map(Number);
  const start = new Date(now); start.setHours(hh, mm, 0, 0);
  for (let k = 0; k < 8 && (!days.includes(start.getDay()) || start <= now); k++) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 20 * 60000);
  const local = d => '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const utc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const sorted = days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chamboule Coach//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:chamboule-rappel-' + sorted.join('') + '-' + time.replace(':', '') + '@chamboule',
    'DTSTAMP:' + utc(now), 'DTSTART:' + local(start), 'DTEND:' + local(end),
    'RRULE:FREQ=WEEKLY;BYDAY=' + sorted.map(d => DAY_CODES[d]).join(','),
    'SUMMARY:Séance Chamboule Coach', 'DESCRIPTION:Chouquette t’attend', 'URL:https://polynelfe-del.github.io/chamboule/',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Séance Chamboule Coach', 'TRIGGER:PT0S', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
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
  L.push(`Réglages actuels : Reprise dos ${st.sets} série${st.sets > 1 ? 's' : ''} par exercice au sol, Fessiers doux ${st.fessiersSets} série${st.fessiersSets > 1 ? 's' : ''}, ${st.bike ? 'vélo ' + st.veloMin + ' min' : 'vélo mis de côté pour le moment'}`);
  L.push('Progression automatique : ' + STEP_PROGS.map(id => PROGRAMS[id].name + ' cran ' + stepLevel(s, id) + '/' + STEP_MAX).join(', '));
  L.push('Versions des exercices : ' + LADDERS.map(l => `${l.name} ${rungOf(s, l) + 1}/${l.rungs.length} (${exName(l.rungs[rungOf(s, l)])})`).join(', '));
  const tl = (s.tests || []).slice(0, 4).reverse();
  if (tl.length) L.push('Tests de forme (30 s) : ' + tl.map(t => `${new Date(t.d).toLocaleDateString('fr-FR')} assis-debout ${t.chaise ?? '?'}, pompes au mur ${t.mur ?? '?'}`).join(' ; '));
  L.push(`Programme Dos solide : ${st.solideUnlocked ? 'débloqué' + (st.solideUnlockedAt ? ' le ' + new Date(st.solideUnlockedAt).toLocaleDateString('fr-FR') : '') + ' (accord kiné déclaré)' : 'verrouillé (' + solidStreak(s) + ' / ' + SOLIDE_NEEDED + ' séances de renforcement d’affilée à 3/10 au plus, lendemain compris)'}`);
  L.push(`Programme Dos du milieu : ${st.milieuOk ? 'ouvert après vérification médicale déclarée' + (st.milieuOkAt ? ' le ' + new Date(st.milieuOkAt).toLocaleDateString('fr-FR') : '') : 'en attente d’une vérification médicale'}`);
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
