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

/* Calisthénie : pour quand le dos ne fait plus mal. Les mouvements de base des programmes de calisthénie
   (pousser, tirer, une jambe, gainage), sans saut ni flexion du dos sous charge. */
Object.assign(EX, {
  pompes: { id: 'pompes', name: 'Pompes classiques', kind: 'reps', target: 6, sets: 2, tempo: 4,
    cue: 'Mains sous les épaules, en appui sur les pieds, corps droit des talons à la tête. Descends la poitrine près du sol, coudes à 45° du corps, puis repousse.',
    tip: 'Ventre et fesses serrés : le bas du dos ne se creuse jamais. S’il se creuse, reviens aux pompes sur les genoux.' },
  rowtable: { id: 'rowtable', name: 'Rowing sous la table', kind: 'reps', target: 6, sets: 2, tempo: 4,
    cue: 'Allongé sous une table lourde et stable, mains au bord. Corps droit, talons au sol, tire la poitrine vers le bord de la table, puis redescends lentement.',
    tip: 'Teste d’abord la table : elle ne doit ni bouger ni basculer. Genoux pliés, c’est plus facile.' },
  bulgare: { id: 'bulgare', name: 'Fente bulgare', kind: 'reps', target: 6, sides: true, sideLabel: 'jambe', sets: 2, tempo: 4,
    cue: 'Dos à une chaise calée contre un mur, pose le dessus du pied arrière sur l’assise. Descends doucement en pliant le genou avant, buste droit, puis remonte en poussant dans le talon.',
    tip: 'Une main sur un meuble au début pour l’équilibre. Le genou avant reste dans l’axe du pied.' },
  pontunejambe: { id: 'pontunejambe', name: 'Pont sur une jambe', kind: 'reps', target: 6, sides: true, sets: 2, tempo: 4,
    cue: 'Sur le dos, un pied à plat, l’autre jambe tendue en l’air. Pousse dans le talon et monte le bassin sans qu’il penche, puis redescends lentement.',
    tip: 'Le bassin reste horizontal. Si le dos tire, reviens au pont marché.' },
  lateralpieds: { id: 'lateralpieds', name: 'Planche latérale sur les pieds', kind: 'hold', target: 2, hold: 15, sides: true,
    cue: 'Sur le côté, coude sous l’épaule, jambes tendues, pieds l’un sur l’autre. Soulève les hanches pour aligner chevilles, hanches et épaules, et tiens.',
    tip: 'Respire calmement. Si les hanches descendent, repose les genoux.' },
  ours: { id: 'ours', name: 'Ours, genoux décollés', kind: 'hold', target: 3, hold: 15,
    cue: 'À quatre pattes, mains sous les épaules, genoux sous les hanches. Rentre le ventre et décolle les genoux de 2 ou 3 cm, dos plat, puis tiens en respirant.',
    tip: 'Le dos ne bouge pas, comme une table. Repose les genoux dès que ça tremble trop.' }
});
/* Exercices ajoutés après recherche : les « 3 de McGill » (Harvard Health), force et équilibre (NHS),
   étirements doux (Spine-health, Physitrack) et respiration lente à 6 par minute. */
Object.assign(EX, {
  curlup: { id: 'curlup', name: 'Relevé de tête McGill', kind: 'hold', target: 5, hold: 8,
    cue: 'Sur le dos, une jambe pliée, l’autre tendue, mains à plat sous le creux du dos. Décolle à peine la tête et les épaules, comme si ta tête reposait sur une balance, et tiens en respirant.',
    tip: 'Ce n’est pas un abdo classique : le bas du dos garde sa petite courbe sur tes mains. Change de jambe pliée à mi-séance.' },
  pointes: { id: 'pointes', name: 'Montées sur pointes', kind: 'reps', target: 12, sets: 2, tempo: 3,
    cue: 'Debout, une main sur un dossier de chaise. Monte lentement sur la pointe des pieds, tiens une seconde, puis redescends doucement.',
    tip: 'Corps bien droit, sans te pencher en avant.' },
  chaisemur: { id: 'chaisemur', name: 'Chaise contre le mur', kind: 'hold', target: 3, hold: 20,
    cue: 'Dos contre le mur, pieds à une longueur de pied devant toi. Glisse vers le bas jusqu’à mi-chemin, genoux au-dessus des chevilles, et tiens.',
    tip: 'Pas plus bas que confortable pour les genoux. Le bas du dos reste contre le mur.' },
  montee: { id: 'montee', name: 'Montée de marche', kind: 'reps', target: 8, sides: true, sideLabel: 'jambe', sets: 2, tempo: 4,
    cue: 'Face à la première marche d’un escalier, une main sur la rampe. Pose un pied sur la marche, monte en poussant sur ce talon, puis redescends lentement.',
    tip: 'Le genou reste dans l’axe du pied. Monte sans élan, buste droit.' },
  equilibre: { id: 'equilibre', name: 'Équilibre sur une jambe', kind: 'hold', target: 2, hold: 20, sides: true,
    cue: 'Debout près d’un appui, effleure-le du bout des doigts. Lève un pied du sol et tiens en regardant droit devant toi.',
    tip: 'Quand c’est facile, lâche l’appui, puis essaie les yeux fermés, toujours avec l’appui à portée de main.' },
  ischio: { id: 'ischio', name: 'Étirement de l’arrière des cuisses', kind: 'hold', target: 2, hold: 30, sides: true,
    cue: 'Sur le dos, genoux pliés. Passe une serviette sous un pied et tends doucement cette jambe vers le plafond, en tenant la serviette à deux mains.',
    tip: 'Tu sens l’arrière de la cuisse, sans douleur. Si ça tire dans la fesse ou la jambe, plie un peu le genou.' },
  piriforme: { id: 'piriforme', name: 'Étirement de la fesse', kind: 'hold', target: 2, hold: 30, sides: true,
    cue: 'Sur le dos, genoux pliés. Pose une cheville sur le genou opposé, puis ramène doucement cette jambe vers toi en tenant l’arrière de la cuisse.',
    tip: 'Tu sens la fesse s’étirer, sans forcer : trop étirer peut réveiller une sciatique. Si ça fourmille ou que ça descend dans la jambe, arrête.' },
  psoas: { id: 'psoas', name: 'Étirement de l’avant de la hanche', kind: 'hold', target: 2, hold: 30, sides: true,
    cue: 'Un genou au sol sur un coussin, l’autre pied devant. Buste droit, serre légèrement le ventre et les fesses, puis avance doucement le bassin.',
    tip: 'Le bas du dos ne se creuse pas : c’est l’avant de la hanche du genou au sol qui s’étire.' },
  livre: { id: 'livre', name: 'Livre ouvert', kind: 'reps', target: 6, sides: true, tempo: 6,
    cue: 'Allongé sur le côté, genoux pliés devant toi, bras tendus l’un sur l’autre. Ouvre lentement le bras du dessus vers l’arrière en suivant ta main des yeux, puis reviens.',
    tip: 'Les genoux restent l’un sur l’autre : c’est le haut du dos qui tourne, pas le bas.' },
  coherence: { id: 'coherence', name: 'Respiration 5 secondes', kind: 'breath', target: 30, tempo: 10,
    cue: 'Assis ou allongé, épaules relâchées. Inspire 5 secondes par le nez, puis expire 5 secondes, en suivant le cercle.',
    tip: 'Six respirations par minute. Si la tête tourne un peu, respire plus doucement.' }
});
/* Tes étirements habituels, pour décontracter le dos et le bassin. */
Object.assign(EX, {
  deuxgenoux: { id: 'deuxgenoux', name: 'Deux genoux vers la poitrine', kind: 'hold', target: 2, hold: 20,
    cue: 'Sur le dos, ramène un genou puis l’autre vers la poitrine, attrape-les avec les mains et tiens en respirant calmement. Pour sortir, repose un pied puis l’autre.',
    tip: 'Tire doucement, sans décoller la tête. Si ça réveille la douleur dans la jambe, reviens à un seul genou.' },
  genouinterieur: { id: 'genouinterieur', name: 'Genou vers l’intérieur, un puis l’autre', kind: 'reps', target: 10, tempo: 5,
    cue: 'Sur le dos, genoux pliés, pieds à plat un peu plus écartés que le bassin. Laisse doucement tomber un genou vers l’intérieur, ramène-le, puis l’autre. Une descente, une répétition.',
    tip: 'Le bassin reste posé. Va seulement là où c’est confortable : le bas du dos et les hanches se détendent.' },
  papillon: { id: 'papillon', name: 'Genoux qui s’ouvrent (papillon)', kind: 'reps', target: 6, tempo: 8,
    cue: 'Sur le dos, genoux pliés, pieds joints. Laisse les deux genoux s’ouvrir doucement sur les côtés, respire, puis ramène-les.',
    tip: 'Laisse faire la pesanteur, sans pousser sur les genoux. Un coussin sous chaque genou si ça tire trop.' }
});
EX.tirageserviette = { id: 'tirageserviette', name: 'Tirage à la serviette, sans porte', kind: 'reps', target: 8, sets: 2, tempo: 5,
  cue: 'Debout, bras tendus devant toi à hauteur de poitrine, une serviette tenue à deux mains par les bouts. Tire les coudes vers l’arrière en écartant la serviette comme pour la déchirer, serre les omoplates 2 secondes, puis relâche.',
  tip: 'Épaules basses, loin des oreilles. Le bas du dos ne bouge pas.' };

const PROGRAMS = {
  dos: { id: 'dos', name: 'Reprise dos', tag: 'Routine du 11 oct. 2026', rest: 30,
    blurb: 'Gainage doux, fessiers et cardio léger, adaptés à ton dos. À faire valider par ton kiné.',
    exercises: [EX.transverse, EX.birddog, EX.pont, EX.velo] },
  solide: { id: 'solide', name: 'Dos solide', tag: 'Niveau supérieur', rest: 30,
    blurb: 'La suite quand ton dos va bien : les mêmes muscles, un cran plus fort. Se débloque quand 8 de tes 10 dernières séances de renforcement, dont la plus récente, restent à ta douleur acceptable ou en dessous (3/10 par défaut, réglable avec ton kiné), avant, après et le lendemain, puis avec l’accord de ton kiné. Se reverrouille si la douleur revient dans la jambe.',
    exercises: [EX.birddogtenu, EX.pontmarche, EX.deadbug, EX.squatchaise, EX.plancheplus] },
  fessiers: { id: 'fessiers', name: 'Fessiers doux', tag: 'Sans charger le dos', rest: 30,
    blurb: 'Les fessiers travaillent sur le côté ou depuis une chaise, sans pression sur les disques. Une alternative douce à Boule qui chamboule. À faire valider par ton kiné.',
    exercises: [EX.coquillage, EX.abduction, EX.assisdebout, EX.gainagelat] },
  haut: { id: 'haut', name: 'Haut du corps doux', tag: 'Debout · sans charge', rest: 30,
    blurb: 'Bras, épaules et haut du dos, debout et sans charge sur la colonne, plus la charnière de hanche pour apprendre à te pencher sans plier le dos. Inspiré des programmes de calisthénie et de fiches de kinés. À faire valider par ton kiné.',
    exercises: [EX.murpompe, EX.rowserviette, EX.angesmur, EX.charniere] },
  calme: { id: 'calme', name: 'Dos calme', tag: 'Routine matin et soir · 9 min', rest: 20, lying: true,
    blurb: 'Ta routine du matin et du soir, et ta séance des jours où le dos fait mal : des étirements allongé qui décontractent le dos et le bassin. Guidée à la voix : pose le téléphone et écoute. Le matin, tu peux la faire dans ton lit avant de te lever.',
    exercises: [EX.bascule, EX.genoupoitrine, EX.deuxgenoux, EX.genouinterieur, EX.papillon, EX.rouleau, EX.talons] },
  milieu: { id: 'milieu', name: 'Dos du milieu', tag: 'Mobilité douce', rest: 20,
    blurb: 'Mobilité et gainage profond, sans crunch ni mouvement brusque. Pour la marche, la balade du chien fait déjà le travail. Pont fessier et bras-jambe opposés sont dans Reprise dos. À faire valider par ton médecin ou ton kiné.',
    exercises: [EX.chatvache, EX.rotation, EX.thorax, EX.gainage, EX.planche] },
  difficile: { id: 'difficile', name: 'Jour difficile', tag: 'Séance douce · 3 min', rest: 30,
    blurb: 'Juste la respiration, pour garder le rythme sans rien forcer. Pour les jours où le dos est sensible.',
    exercises: [{ ...EX.transverse, sets: 2 }] },
  mcgill: { id: 'mcgill', name: 'Les 3 de McGill', tag: 'Gainage qui protège le dos', rest: 30,
    blurb: 'Les trois exercices du professeur Stuart McGill, spécialiste de la colonne : relevé de tête, planche latérale sur genoux, bras-jambe opposés tenu. Ils renforcent l’endurance du tronc sans plier ni tourner le dos. À faire valider par ton kiné.',
    exercises: [EX.curlup, EX.gainagelat, EX.birddogtenu] },
  jambes: { id: 'jambes', name: 'Jambes et équilibre', tag: 'Debout · sans charge', rest: 30,
    blurb: 'Mollets, cuisses, fessiers et équilibre, debout et sans charge sur la colonne. Utile au quotidien : escaliers, se relever, promener le chien. À faire valider par ton kiné.',
    exercises: [EX.pointes, EX.chaisemur, EX.montee, EX.equilibre] },
  express: { id: 'express', name: 'Séance express', tag: '5 minutes', rest: 20,
    blurb: 'Pour les jours pressés : trois exercices de ta base, une série chacun, pour garder le rythme sans y passer du temps.',
    exercises: [EX.birddog, EX.pont, { ...EX.murpompe, sets: 1 }] },
  etirements: { id: 'etirements', name: 'Étirements du soir', tag: 'Détente · 10 min', rest: 10,
    blurb: 'Des étirements doux pour finir la journée : arrière des cuisses, fesse, avant de la hanche et haut du dos. Toujours sans douleur, en respirant calmement. Arrête si ça descend dans la jambe.',
    exercises: [EX.ischio, EX.piriforme, EX.psoas, EX.livre] },
  relax: { id: 'relax', name: 'Relaxation', tag: 'Respiration · 5 min', rest: 0,
    blurb: 'Cinq minutes de respiration lente, six par minute, pour calmer le corps quand la douleur monte, ou pour bien dormir.',
    exercises: [EX.coherence] },
  cardio: { id: 'cardio', name: 'Vélo seul', tag: 'Cardio doux', rest: 0,
    blurb: 'Juste le vélo d’appartement, résistance légère, pour les jours sans renforcement : ça compte dans tes minutes de vélo de la semaine. La durée se règle dans les Réglages.',
    exercises: [EX.velo] },
  calis: { id: 'calis', name: 'Calisthénie', tag: 'Quand le dos ne fait plus mal', rest: 45,
    blurb: 'Les mouvements de base de la calisthénie, au poids du corps : pompes, rowing, fente bulgare, pont sur une jambe, gainage. Se débloque après Dos solide, puis 10 séances de renforcement d’affilée à 2/10 de douleur au plus (avant, après et le lendemain), et l’accord de ton kiné. Se reverrouille si la douleur revient dans la jambe.',
    exercises: [EX.pompes, EX.rowtable, EX.bulgare, EX.pontunejambe, EX.lateralpieds, EX.ours] },
  boule: { id: 'boule', name: 'Boule qui chamboule', tag: 'Programme fessiers · nov. 2025', rest: 45,
    blurb: 'Ton ancien programme fessiers. Il date d’avant les adaptations pour ton dos et n’a pas été revalidé.',
    exercises: [EX.hipthrust, EX.fentes, EX.donkey, EX.sumo, EX.hydrant] },
  essai: { id: 'essai', name: 'Essai', tag: '', rest: 0, practice: true, blurb: '',
    exercises: [{ id: 'essai', name: 'Essai : 3 lancers', kind: 'reps', target: 3, tempo: 3, prescText: 'Tape 3 fois au bon moment',
      cue: 'Pas besoin de bouger. Regarde le cercle se remplir. Quand il devient jaune et que ça bipe, tape : la balle part sur les boîtes.',
      tip: 'Si tu tapes trop tôt, la balle rate. Ici, la lenteur gagne toujours.' }] }
};
const PROG_ORDER = ['dos', 'milieu', 'fessiers', 'haut', 'mcgill', 'jambes', 'express', 'cardio', 'calme', 'etirements', 'relax', 'difficile', 'solide', 'calis', 'boule'];
/* Les programmes rangés par famille dans « Tous les programmes ». */
const PROG_GROUPS = [
  { name: 'Ta routine matin et soir', ids: ['calme'] },
  { name: 'La base', ids: ['dos', 'fessiers', 'haut', 'milieu', 'mcgill', 'jambes', 'express'] },
  { name: 'Les jours doux', ids: ['etirements', 'relax', 'difficile', 'cardio'] },
  { name: 'Pour aller plus loin', ids: ['solide', 'calis'] },
  { name: 'Ancien programme', ids: ['boule'] }
];
/* Le carnet garde jusqu’à 2 000 séances (des années d’entraînement) ; l’appli prévient bien avant. */
const HISTORY_MAX = 2000;
/* Dos solide : au moins 8 séances calmes parmi les 10 dernières, dont la plus récente (à valider avec le kiné). */
const SOLIDE_NEEDED = 8, SOLIDE_WINDOW = 10;

const LEVELS = ['Ticket d’entrée', 'Barbe à papa', 'Pomme d’amour', 'As du chamboule-tout', 'Étoile du manège', 'Cœur de la fête', 'Grande roue', 'Feu d’artifice', 'Légende de la foire'];
const LINES = {
  intro: ['Ici, la vitesse ne rapporte rien. Le contrôle, si.', 'Lentement. C’est comme ça qu’on gagne à ce jeu.', 'Respire, et laisse le cercle se remplir.', 'Un mouvement propre vaut mieux que trois rapides.'],
  rest: ['Récup. Bois une gorgée d’eau.', 'Relâche les épaules et souffle.', 'Belle série. On reprend dans un instant.', 'Secoue les jambes, détends la nuque.']
};
const BADGES = [
  { id: 'premier', name: 'Premier ticket', desc: 'Finir une première séance', glyph: '1', test: s => doneCount(s) >= 1 },
  { id: 'combo10', name: 'Tout en contrôle', desc: '10 reps parfaites d’affilée', glyph: 'x10', test: s => s.bestCombo >= 10 },
  { id: 'etoiles', name: 'Trois étoiles', desc: 'Une séance à 3 étoiles', glyph: '★', test: s => s.history.some(h => h.stars === 3) },
  { id: 'semaine', name: 'Semaine pleine', desc: '3 jours d’entraînement dans la même semaine', glyph: '3J', test: s => [...daysByWeek(s.history).values()].some(d => d.size >= 3) },
  { id: 'suivi5', name: 'Carnet à jour', desc: '5 suivis du lendemain remplis', glyph: '5', test: s => s.history.filter(h => h.next != null).length >= 5 },
  { id: 'velo60', name: 'Roue libre', desc: '60 min de vélo au total', glyph: "60'", test: s => s.history.reduce((a, h) => a + (h.veloMin || 0), 0) >= 60 },
  { id: 's10', name: 'Habitué de la foire', desc: '10 séances terminées', glyph: '10', test: s => doneCount(s) >= 10 },
  { id: 's30', name: 'Pilier de la fête', desc: '30 séances terminées', glyph: '30', test: s => doneCount(s) >= 30 },
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
  { id: 'feel2', name: 'À l’écoute', desc: 'Noter ton ressenti après 2 séances', goal: 2, prog: w => w.filter(h => h.pain != null || h.relief != null).length },
  { id: 'pyr', name: 'Tout chambouler', desc: 'Faire tomber une pyramide entière', goal: 1, prog: w => w.filter(h => (h.pyramids || 0) > 0).length },
  { id: 'pyr3', name: 'Démolition douce', desc: 'Faire tomber 3 pyramides dans la semaine', goal: 3, prog: w => w.reduce((a, h) => a + (h.pyramids || 0), 0) },
  { id: 'stars2x', name: 'Doublé', desc: '2 séances à 2 étoiles ou plus', goal: 2, prog: w => w.filter(h => h.stars >= 2).length },
  { id: 'combo12', name: 'Combo de 12', desc: 'Enchaîner 12 répétitions parfaites', goal: 12, prog: w => Math.max(0, ...w.map(h => h.combo || 0)) },
  { id: 'days3', name: 'Trois cœurs', desc: 'Remplir 3 cœurs cette semaine', goal: 3, prog: w => new Set(w.map(h => dayKey(h.d))).size },
  { id: 'haut1', name: 'Haut du corps', desc: 'Faire une séance Haut du corps doux', goal: 1, prog: w => w.filter(h => h.prog === 'haut').length },
  { id: 'varie3', name: 'Touche-à-tout', desc: 'Faire 3 programmes différents dans la semaine', goal: 3, prog: w => new Set(w.map(h => h.prog)).size },
  { id: 'routine3', name: 'Matin et soir', desc: 'Faire Dos calme matin et soir, 3 jours cette semaine', goal: 3, prog: w => routineDays(w).complets },
  { id: 'zen', name: 'Zen', desc: 'Faire une séance Étirements du soir ou Relaxation', goal: 1, prog: w => w.filter(h => ['etirements', 'relax'].includes(h.prog)).length },
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
  hist.forEach(h => { if (!isDone(h)) return; const k = weekKey(new Date(h.d)); if (!m.has(k)) m.set(k, new Set()); m.get(k).add(dayKey(h.d)); });
  return m;
}
/* Une séance compte (cœurs, routine, défis, badges, déblocages) quand au moins les deux tiers de ses exercices
   ont été faits. Un exercice passé parce qu’il augmentait la douleur ne compte ni pour ni contre.
   Une séance écourtée reste dans le carnet et dans le résumé pour le kiné. */
const DONE_SHARE = 2 / 3;
function doneShare(h) {
  const n = h.nEx || ((PROGRAMS[h.prog] || {}).exercises || []).length || 1;
  const considered = n - (h.painEx || []).length;
  return considered > 0 ? Math.max(0, n - (h.skipped || []).length) / considered : 0;
}
function isDone(h) { return doneShare(h) >= DONE_SHARE - 1e-9; }
function doneCount(s) { return s.history.filter(isDone).length; }
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return ''; } }
function fmtDateLong(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return ''; } }
function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }
function fmtMin(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 }); }
function exName(id) { return (EX[id] || {}).name || id; }

/* ---------- État & sauvegarde ---------- */
const LS = 'chamboule-coach.v1';
function defaultState() {
  return { v: 1, xp: 0, bestCombo: 0, settings: { sets: 1, fessiersSets: 1, veloMin: 10, bike: true, weeklyGoal: 3, reminderDays: [1, 3, 5], reminderTime: '18:00', routineMorning: '08:00', routineEvening: '21:00', sound: true, handsFree: false, lyingHF: true, tutorialDone: false, bouleUnlocked: false, bouleUnlockedAt: null, solideUnlocked: false, solideUnlockedAt: null, calisUnlocked: false, calisUnlockedAt: null, milieuOk: false, milieuOkAt: null, lastExport: null, exportSnooze: null, outfit: 'noeud', rungs: {}, stepReset: {}, painMax: 3, painMaxAt: null, noDoor: false, doorChecked: false, noTable: false, tableChecked: false, kineReview: null, kineSnooze: null }, badges: {}, challenges: {}, history: [], tests: [], maint: {}, weekly: [] };
}
/* Tout ce qui vient d’un fichier importé ou du stockage est revérifié et converti au bon type :
   aucune valeur lue n’arrive telle quelle dans la page. */
const EX_IDS = new Set(Object.keys(EX));
const BADGE_IDS = new Set(BADGES.map(b => b.id));
const CHAL_IDS = new Set(CHALLENGES.map(c => c.id));
const BACKS = ['ok', 'sensible', 'douleur', 'stop'];
/* Où a-t-on mal : deux zones du dos qui n’ont pas la même histoire, plus la fesse (la jambe a sa propre question). */
const ZONES = [{ id: 'bas', name: 'bas du dos', label: 'Bas du dos' }, { id: 'milieu', name: 'milieu du dos', label: 'Milieu du dos' }, { id: 'fesse', name: 'fesse', label: 'Fesse' }];
const ZONE_IDS = ZONES.map(z => z.id);
function zoneName(id) { return (ZONES.find(z => z.id === id) || {}).name || id; }
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
  const zs = a => Array.isArray(a) ? [...new Set(a.filter(z => ZONE_IDS.includes(z)))] : [];
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
    zoneBefore: zs(h.zoneBefore), zone: zs(h.zone), zoneNext: zs(h.zoneNext),
    durS: numOr(h.durS, 0, 86400, 0, true),
    nEx: numOr(h.nEx, 1, 40, null, true), relief: numOr(h.relief, -1, 1, null, true)
  };
}
/* Test de forme du mois : deux mesures debout, au rythme d’un bip toutes les 3 s, 20 répétitions au plus.
   On s’arrête dès qu’on ne suit plus le rythme proprement : on mesure l’endurance au bon tempo, jamais la vitesse.
   Les mesures de l’ancien test (le plus possible en 30 s, v1) restent dans l’historique mais ne sont pas comparées. */
const FIT_TESTS = [
  { id: 'chaise', name: 'Assis-debout au rythme', short: 'assis-debout', ex: 'assisdebout', tempo: 3, v1max: 60,
    cue: 'Assis au milieu d’une chaise calée contre un mur, bras croisés sur la poitrine. À chaque bip, lève-toi complètement puis rassieds-toi, en suivant le rythme. Arrête dès que tu ne suis plus le rythme proprement : l’appli compte pour toi, 20 au plus.' },
  { id: 'mur', name: 'Pompes contre le mur au rythme', short: 'pompes au mur', ex: 'murpompe', tempo: 3, v1max: 120,
    cue: 'Face au mur, mains à hauteur des épaules, corps droit. À chaque bip, une pompe lente et contrôlée. Arrête dès que tu ne suis plus le rythme proprement : l’appli compte pour toi, 20 au plus.' }
];
const TEST_CAP = 20, TEST_VERSION = 2, TEST_EVERY_DAYS = 28, TEST_XP = 30;
function cleanTest(t) {
  if (!t || typeof t !== 'object') return null;
  const d = isoOr(t.d); if (!d) return null;
  const v = t.v === TEST_VERSION ? TEST_VERSION : 1;
  const out = { d, v };
  FIT_TESTS.forEach(f => { out[f.id] = numOr(t[f.id], 0, v === TEST_VERSION ? TEST_CAP : f.v1max, null, true); });
  out.pain = numOr(t.pain, 0, 10, null, true);
  return FIT_TESTS.some(f => out[f.id] != null) ? out : null;
}
function testDue(s, now = new Date()) {
  if (s.history.length < 3) return false;
  const last = (s.tests || [])[0];
  return !last || now.getTime() - Date.parse(last.d) >= TEST_EVERY_DAYS * 86400000;
}
/* Bilan de la semaine : trois questions utiles au médecin et au kiné, et ce que ton dos t’a laissé faire. */
const WEEKLY = {
  stiff: { q: 'Le matin, ton dos reste raide combien de temps ?', a: ['Moins de 15 min', '15 à 30 min', '30 min à 1 h', 'Plus d’une heure'] },
  night: { q: 'Ton dos t’a réveillé la nuit ?', a: ['Aucune nuit', '1 ou 2 nuits', '3 nuits ou plus'] },
  meds: { q: 'Tu as pris des antidouleurs ?', a: ['Aucun', 'Certains jours', 'Tous les jours'] }
};
const CAN = [
  { id: 'chien', label: 'Promener le chien sans gêne' }, { id: 'nuit', label: 'Dormir une nuit entière' },
  { id: 'assis', label: 'Rester assis une heure' }, { id: 'courses', label: 'Porter les courses' },
  { id: 'menage', label: 'Faire le ménage' }, { id: 'escaliers', label: 'Monter les escaliers' }, { id: 'velo', label: 'Faire du vélo' }
];
const WEEKLY_XP = 20;
function cleanWeekly(w) {
  if (!w || typeof w !== 'object') return null;
  const d = isoOr(w.d); if (!d) return null;
  const out = { d };
  for (const k of Object.keys(WEEKLY)) { out[k] = numOr(w[k], 0, WEEKLY[k].a.length - 1, null, true); if (out[k] == null) return null; }
  out.can = Array.isArray(w.can) ? [...new Set(w.can.filter(x => CAN.some(c => c.id === x)))] : [];
  return out;
}
/* Proposé une fois par semaine, à partir de 3 séances faites. */
function weeklyDue(s, now = new Date()) {
  if (doneCount(s) < 3) return false;
  const last = (s.weekly || [])[0];
  if (!last) return true;
  const a = new Date(last.d), b = new Date(now); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
  return (b - a) / 86400000 >= 6.5;
}
function cleanSettings(s, d) {
  s = s && typeof s === 'object' ? s : {};
  return {
    sets: numOr(s.sets, 1, 3, d.sets, true), fessiersSets: numOr(s.fessiersSets, 1, 2, d.fessiersSets, true), veloMin: numOr(s.veloMin, 3, 45, d.veloMin, true), bike: s.bike !== false, weeklyGoal: numOr(s.weeklyGoal, 1, 7, d.weeklyGoal, true),
    sound: typeof s.sound === 'boolean' ? s.sound : d.sound, handsFree: s.handsFree === true, lyingHF: s.lyingHF !== false, tutorialDone: s.tutorialDone === true,
    bouleUnlocked: s.bouleUnlocked === true, bouleUnlockedAt: isoOr(s.bouleUnlockedAt),
    solideUnlocked: s.solideUnlocked === true, solideUnlockedAt: isoOr(s.solideUnlockedAt),
    calisUnlocked: s.calisUnlocked === true && s.solideUnlocked === true, calisUnlockedAt: isoOr(s.calisUnlockedAt),
    milieuOk: s.milieuOk === true, milieuOkAt: isoOr(s.milieuOkAt),
    lastExport: isoOr(s.lastExport), exportSnooze: isoOr(s.exportSnooze),
    reminderDays: Array.isArray(s.reminderDays) ? [...new Set(s.reminderDays.filter(x => Number.isInteger(x) && x >= 0 && x <= 6))].sort((a, b) => a - b) : d.reminderDays.slice(),
    reminderTime: typeof s.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime) ? s.reminderTime : d.reminderTime,
    routineMorning: typeof s.routineMorning === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.routineMorning) ? s.routineMorning : d.routineMorning,
    routineEvening: typeof s.routineEvening === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.routineEvening) ? s.routineEvening : d.routineEvening,
    outfit: typeof s.outfit === 'string' && OUTFITS.some(o => o.id === s.outfit) ? s.outfit : 'noeud',
    painMax: numOr(s.painMax, 2, 6, d.painMax, true), painMaxAt: isoOr(s.painMaxAt),
    noDoor: s.noDoor === true, doorChecked: s.doorChecked === true,
    noTable: s.noTable === true, tableChecked: s.tableChecked === true,
    kineReview: isoOr(s.kineReview), kineSnooze: isoOr(s.kineSnooze),
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
    history: Array.isArray(raw.history) ? raw.history.slice(0, HISTORY_MAX).map(cleanEntry).filter(Boolean) : [],
    tests: Array.isArray(raw.tests) ? raw.tests.slice(0, 60).map(cleanTest).filter(Boolean) : [],
    maint: Object.fromEntries(Object.entries(raw.maint && typeof raw.maint === 'object' ? raw.maint : {})
      .filter(([k, v]) => /^\d{4}-\d{2}:[a-z]+$/.test(k) && STEP_PROGS.includes(k.split(':')[1]) && typeof v === 'string' && DAY_RE.test(v))),
    weekly: Array.isArray(raw.weekly) ? raw.weekly.slice(0, 60).map(cleanWeekly).filter(Boolean) : []
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
/* Après Dos calme, on ne redemande pas un chiffre : « plus détendu, pareil ou plus douloureux » (relief 1, 0, -1). */
function backCat(h) {
  if (h.stop || h.back === 'stop') return 'stop';
  if (h.pain == null && h.relief == null) return h.back || null;
  if (h.leg) return 'douleur';
  const before = h.painBefore ?? h.pain;
  const rank = v => (v >= 7 || (before != null && v - before >= 3)) ? 2 : (before != null && v - before >= 1 && v > 2) ? 1 : 0;
  const now = h.pain != null ? rank(h.pain) : h.relief === -1 ? 1 : 0;
  const worst = Math.max(now, h.next != null ? rank(h.next) : 0);
  return ['ok', 'sensible', 'douleur'][worst];
}
/* Programmes qui prouvent que le dos encaisse du renforcement. La respiration et la mobilité ne comptent pas. */
const STRENGTH_PROGS = ['dos', 'milieu', 'fessiers', 'mcgill', 'solide', 'calis', 'boule'];
/* Une séance « sans douleur » : douleur acceptable au plus (3/10 par défaut, réglable avec le kiné) avant, après et le lendemain,
   sans aggravation par rapport au départ, sans symptôme dans la jambe
   ni exercice passé pour douleur. Renvoie 'count' quand le lendemain est noté, 'wait' tant qu’il manque, 'break' sinon,
   et null quand aucun ressenti n’a été noté. */
const QUIET_MAX = 3;
function quietState(h, max = QUIET_MAX) {
  if (h.pain == null && h.relief == null && !h.stop) return null;
  if (backCat(h) !== 'ok' || (h.painEx && h.painEx.length)) return 'break';
  if (Math.max(h.painBefore ?? 0, h.pain ?? 0, h.next ?? 0) > max) return 'break';
  return h.next == null ? 'wait' : 'count';
}
/* Alerte sérieuse : symptômes dans la jambe, arrêt pour douleur, ou douleur qui a beaucoup monté. */
function seriousAlert(h) { return h.legBefore === true || ['douleur', 'stop'].includes(backCat(h)); }
/* Dos solide : séances de renforcement calmes parmi les 10 dernières séances jugées (renforcement suivi le lendemain,
   ou n’importe quelle séance au-dessus du seuil). Une alerte sérieuse remet tout à zéro ; une séance faite à moitié
   ne compte pas. Tant que la plus récente n’est pas calme, on reste juste en dessous du nombre demandé. */
function solidStreak(s) {
  let calm = 0, seen = 0, first = null;
  for (const h of s.history) {
    if (seriousAlert(h)) break;
    const q = quietState(h, s.settings.painMax);
    const strength = STRENGTH_PROGS.includes(h.prog) && isDone(h);
    if (q === 'break') { seen++; if (first === null) first = false; }
    else if (q === 'count' && strength) { seen++; calm++; if (first === null) first = true; }
    if (seen >= SOLIDE_WINDOW) break;
  }
  return first === false ? Math.min(calm, SOLIDE_NEEDED - 1) : calm;
}
/* Séance du jour proposée par Chouquette : la douleur récente d’abord, puis le programme fait le moins récemment. */
const SUGGEST_ROTATION = ['dos', 'fessiers', 'milieu', 'haut', 'mcgill', 'jambes'];
function suggestToday(s, now = new Date()) {
  const last = s.history[0];
  if (!last) return { prog: 'dos', why: 'Coucou, moi c’est Chouquette ! Pour commencer, ta routine de base, tout en douceur.' };
  /* Ce qui a été vraiment fait décide du programme ; la douleur, elle, compte même pour une séance écourtée. */
  const done = s.history.filter(isDone);
  /* La routine Dos calme du matin ou du soir ne compte pas comme la séance du jour. */
  if (done.some(h => dayKey(h.d) === dayKey(now) && h.prog !== ROUTINE_PROG)) {
    return { prog: 'calme', rest: true, why: 'Ton cœur du jour est déjà rempli. Repos, ou quelques minutes de Dos calme si le dos est raide.' };
  }
  const recent = now.getTime() - new Date(last.d).getTime() < 3 * 86400000;
  const cat = backCat(last);
  if (recent && (cat === 'douleur' || cat === 'stop')) {
    return { prog: 'difficile', why: 'Ton dos a été douloureux à la dernière séance. Aujourd’hui, juste la respiration, et on voit demain.' };
  }
  if (recent && cat === 'sensible') return { prog: 'calme', why: 'Ton dos était un peu sensible la dernière fois : place aux mouvements doux.' };
  const dayBefore = n => { const d = new Date(now); d.setDate(d.getDate() - n); return dayKey(d); };
  if ([1, 2, 3].every(n => done.some(h => h.prog !== ROUTINE_PROG && dayKey(h.d) === dayBefore(n)))) {
    return { prog: 'calme', rest: true, why: 'Trois jours d’affilée : aujourd’hui, je te conseille le repos. La balade du chien suffit ; si tu as envie de bouger, un peu de Vélo seul, et si le dos est raide, quelques minutes de Dos calme.' };
  }
  /* Cardio : si tu as un vélo et que tu n’as pas pédalé depuis 4 jours, Chouquette propose le Vélo seul. */
  const rode = h => (h.veloMin || 0) > 0;
  if (s.settings.bike && s.history.some(rode) && !s.history.some(h => rode(h) && now.getTime() - Date.parse(h.d) < 4 * 86400000)) {
    return { prog: 'cardio', why: 'Pas de vélo depuis 4 jours : un peu de cardio doux aujourd’hui, à ton rythme.' };
  }
  /* Reprise dos, la routine du kiné, revient au moins tous les 3 jours. */
  const lastDos = done.find(h => h.prog === 'dos');
  if (!lastDos || now.getTime() - Date.parse(lastDos.d) >= 3 * 86400000) {
    return { prog: 'dos', why: (s.settings.bike ? 'Ta routine de base : respiration, bras-jambe opposés, pont et vélo.' : 'Ta routine de base : respiration, bras-jambe opposés et pont, sans le vélo.') + ' Elle revient au moins tous les 3 jours.' };
  }
  /* Dos du milieu n’est proposé qu’une fois l’avis médical déclaré. */
  const pool = SUGGEST_ROTATION.filter(id => id !== 'milieu' || s.settings.milieuOk).concat(s.settings.solideUnlocked ? ['solide'] : [], s.settings.calisUnlocked ? ['calis'] : []);
  const lastDone = id => { const h = done.find(x => x.prog === id); return h ? new Date(h.d).getTime() : 0; };
  const prog = pool.slice().sort((a, b) => lastDone(a) - lastDone(b))[0];
  const why = {
    dos: s.settings.bike ? 'Ta routine de base : respiration, bras-jambe opposés, pont et vélo.' : 'Ta routine de base : respiration, bras-jambe opposés et pont, sans le vélo.',
    fessiers: 'Au tour des fessiers, sans charger le dos.',
    milieu: 'Un peu de mobilité et de gainage pour le dos du milieu.',
    haut: 'Au tour du haut du corps : bras, épaules et haut du dos, debout.',
    mcgill: 'Les 3 de McGill : du gainage qui protège le dos.',
    jambes: 'Jambes et équilibre, debout : pour les escaliers et les balades.',
    solide: 'Ton dos va bien : on passe un cran au-dessus.',
    calis: 'Ton dos ne fait plus mal : place à la calisthénie.'
  }[prog];
  return { prog, why };
}
/* Bonus quand on suit jusqu’au bout la séance proposée par Chouquette (jamais un jour de repos). */
const SUGGEST_BONUS = 15;
function suggestBonus(sug, progId, reason) { return sug && !sug.rest && sug.prog === progId && reason === 'done' ? SUGGEST_BONUS : 0; }
function painFreeRun(s) {
  let n = 0;
  for (const h of s.history) {
    if (h.prog !== 'dos' || !isDone(h)) continue;
    const q = quietState(h, s.settings.painMax);
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
/* Ce qu’on sait déjà de ton dos aujourd’hui, pour ne pas reposer la question à chaque séance :
   la dernière douleur notée à une séance du jour, sinon le suivi du lendemain donné aujourd’hui.
   Après une séance qui a fait mal ou des symptômes dans la jambe, on redemande tout. */
function todayBack(s, now = new Date()) {
  const k = dayKey(now);
  const h = s.history.find(x => dayKey(x.d) === k && (x.pain ?? x.painBefore) != null);
  if (h) {
    if (h.relief === -1 || ['douleur', 'stop'].includes(backCat(h))) return null;
    const after = h.pain != null, leg = after ? h.leg : h.legBefore;
    return { pain: after ? h.pain : h.painBefore, leg: leg === false ? false : null, zones: ((after ? h.zone : h.zoneBefore) || []).slice(), at: h.d, from: 'seance' };
  }
  const n = s.history.find(x => x.next != null && x.nextAt && dayKey(x.nextAt) === k);
  return n ? { pain: n.next, leg: null, zones: (n.zoneNext || []).slice(), at: n.nextAt, from: 'suivi' } : null;
}
/* Note le suivi du lendemain sur la séance et sur les autres séances du même jour encore sans suivi (+20 XP une fois). */
function applyNext(s, id, v, now = new Date(), zones = []) {
  const h = s.history.find(x => x.id === id);
  if (!h || h.next != null) return null;
  const day = dayKey(h.d), at = now.toISOString();
  s.history.filter(x => x.next == null && dayKey(x.d) === day).forEach(x => { x.next = v; x.nextAt = at; x.zoneNext = v > 0 ? zones.slice() : []; x.back = backCat(x); });
  h.xp = (h.xp || 0) + 20; s.xp += 20;
  return h;
}
function weekEntries(s, now = new Date()) { const k = weekKey(now); return s.history.filter(h => weekKey(new Date(h.d)) === k); }
/* Les défis ne comptent que les séances vraiment faites (au moins les deux tiers des exercices). */
function chalProgress(s, c, now = new Date()) { return Math.min(c.goal, c.prog(weekEntries(s, now).filter(isDone), s, now)); }
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
const STEP_PROGS = ['dos', 'fessiers', 'milieu', 'haut', 'mcgill', 'jambes', 'solide', 'calis'];
/* Calisthénie : seulement après Dos solide, puis 10 séances de renforcement d’affilée faites depuis, à 2/10 au plus
   avant, après et le lendemain (même si le seuil de progression a été monté avec le kiné). */
const CALIS_NEEDED = 10, CALIS_PAIN = 2;
function calisStreak(s) {
  if (!s.settings.solideUnlocked) return 0;
  const since = Date.parse(s.settings.solideUnlockedAt || '') || 0;
  let n = 0;
  for (const h of s.history) {
    if (Date.parse(h.d) <= since) break;
    const q = quietState(h, Math.min(CALIS_PAIN, s.settings.painMax));
    if (q === 'break') break;
    if (q === 'count' && STRENGTH_PROGS.includes(h.prog) && isDone(h)) n++;
  }
  return n;
}
const STEP_EVERY = 3, STEP_MAX = 2;
/* Pendant qu’un écran se dessine, chaque palier n’est calculé qu’une fois (l’état ne change pas pendant ce temps).
   L’appli ouvre ce petit cache avant de dessiner et le ferme juste après ; ailleurs, le calcul est toujours refait. */
let STEP_MEMO = null;
function memoStart() { STEP_MEMO = new Map(); }
function memoEnd() { STEP_MEMO = null; }
function stepLevel(s, progId) {
  if (STEP_MEMO && STEP_MEMO.has(progId)) return STEP_MEMO.get(progId);
  const lvl = stepLevelRaw(s, progId);
  if (STEP_MEMO) STEP_MEMO.set(progId, lvl);
  return lvl;
}
function stepLevelRaw(s, progId) {
  if (!STEP_PROGS.includes(progId)) return 0;
  const since = Date.parse((s.settings.stepReset || {})[progId] || '') || 0;
  let lvl = 0, run = 0;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const h = s.history[i];
    if (Date.parse(h.d) <= since) continue;
    const q = quietState(h, s.settings.painMax);
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
/* Échelles de progression (principe de la calisthénie) : chaque mouvement a des versions de plus en plus dures,
   et mène (next) à un exercice du programme Calisthénie, le sommet de l’arbre.
   Au dernier cran d’un programme, ses versions suivantes peuvent se débloquer, avec l’accord du kiné ;
   les crans de ce programme repartent alors de zéro. On peut toujours revenir à la version précédente. */
const LADDERS = [
  { id: 'pousser', name: 'Pousser', prog: 'haut', rungs: ['murpompe', 'planpompe', 'genoupompe'], next: 'pompes' },
  { id: 'tirer', name: 'Tirer', prog: 'haut', rungs: ['rowserviette', 'rowpenche'], next: 'rowtable' },
  { id: 'pencher', name: 'Se pencher', prog: 'haut', rungs: ['charniere', 'charniereunejambe'], next: 'pontunejambe' },
  { id: 'squat', name: 'S’accroupir', prog: 'fessiers', rungs: ['assisdebout', 'squatchaise', 'fentesoutenue'], next: 'bulgare' },
  { id: 'gainage', name: 'Gainage', prog: 'milieu', rungs: ['planche', 'plancheplus'], next: 'ours' }
];
function rungOf(s, l) { return Math.min(l.rungs.length - 1, (s.settings.rungs || {})[l.id] || 0); }
function laddersOf(progId) { return LADDERS.filter(l => l.prog === progId); }
function rungsReady(s, progId) {
  return stepLevel(s, progId) >= STEP_MAX ? laddersOf(progId).filter(l => rungOf(s, l) < l.rungs.length - 1 && !(l.id === 'tirer' && s.settings.noDoor)) : [];
}
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
  /* Sans porte adaptée, le rowing est remplacé par le tirage à la serviette. */
  /* Sans table adaptée, le rowing sous la table redevient le rowing penché à la serviette (ou le tirage, sans porte). */
  if (s.settings.noTable) exercises = exercises.map(ex => ex.id === 'rowtable' ? EX.rowpenche : ex);
  if (s.settings.noDoor) { const pull = LADDERS.find(l => l.id === 'tirer').rungs; exercises = exercises.map(ex => pull.includes(ex.id) ? EX.tirageserviette : ex); }
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
/* Routine quotidienne : Dos calme matin et soir. Avant 17 h, c’est la routine du matin ; après, celle du soir.
   Elle ne compte que si elle a été vraiment faite (au moins les deux tiers des étirements).
   Chaque passage rapporte 30 XP au plus : c’est une habitude, pas une course aux points. */
const ROUTINE_PROG = 'calme', ROUTINE_SPLIT_HOUR = 17, ROUTINE_XP = 30;
function routineSlot(d) { return new Date(d).getHours() < ROUTINE_SPLIT_HOUR ? 'matin' : 'soir'; }
function routineDays(list) {
  const days = new Map();
  list.filter(h => h.prog === ROUTINE_PROG && isDone(h)).forEach(h => { const k = dayKey(h.d); if (!days.has(k)) days.set(k, new Set()); days.get(k).add(routineSlot(h.d)); });
  const v = [...days.values()];
  return { matins: v.filter(x => x.has('matin')).length, soirs: v.filter(x => x.has('soir')).length, complets: v.filter(x => x.size === 2).length };
}
function routineToday(s, now = new Date()) {
  const done = s.history.filter(h => h.prog === ROUTINE_PROG && isDone(h) && dayKey(h.d) === dayKey(now));
  return { matin: done.some(h => routineSlot(h.d) === 'matin'), soir: done.some(h => routineSlot(h.d) === 'soir'), now: routineSlot(now) };
}
function routineWeek(s, now = new Date()) { return routineDays(weekEntries(s, now)); }
function computeXP(prog, r, minutes, repeat) {
  const considered = prog.exercises.map(e => e.id).filter(id => !r.painEx.includes(id));
  const done = considered.filter(id => !r.skipped.includes(id)).length;
  const completion = considered.length ? done / considered.length : 0;
  const quality = r.reps ? r.perfect / r.reps : 1;
  if (prog.id === ROUTINE_PROG) return Math.round(ROUTINE_XP * completion * (0.6 + 0.4 * quality));
  const xp = Math.round(10 * Math.min(XP_MINUTES_CAP, minutes) * completion * (0.6 + 0.4 * quality));
  return repeat ? Math.round(xp / 2) : xp + 20;
}
/* Étoiles : la part faite compte d’abord. Moins des deux tiers des exercices : une étoile, quelle que soit la qualité. */
function computeStars(reason, r, nEx) {
  if (reason === 'pain') return 0;
  if (nEx && !isDone({ nEx, skipped: r.skipped, painEx: r.painEx })) return 1;
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
/* Fichier agenda (.ics) : un rappel répété chaque semaine aux jours et à l’heure choisis, à l’heure locale du téléphone.
   Toujours le même identifiant, avec un numéro de version qui monte : l’agenda remplace l’ancien rappel au lieu d’en ajouter un. */
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
/* Rappels de la routine : Dos calme chaque jour, le matin et le soir, aux heures choisies. */
function routineICS(morning, evening, now = new Date()) {
  const local = d => '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const utc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ev = (slot, time) => {
    const [hh, mm] = time.split(':').map(Number);
    const start = new Date(now); start.setHours(hh, mm, 0, 0);
    if (start <= now) start.setDate(start.getDate() + 1);
    return ['BEGIN:VEVENT', 'UID:chamboule-routine-' + slot + '@polynelfe-del.github.io', 'SEQUENCE:' + Math.floor(now.getTime() / 60000),
      'DTSTAMP:' + utc(now), 'DTSTART:' + local(start), 'DTEND:' + local(new Date(start.getTime() + 10 * 60000)), 'RRULE:FREQ=DAILY',
      'SUMMARY:Dos calme du ' + slot, 'DESCRIPTION:Ta routine du ' + slot + ', 9 minutes',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Dos calme du ' + slot, 'TRIGGER:PT0S', 'END:VALARM', 'END:VEVENT'];
  };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chamboule Coach//FR', 'CALSCALE:GREGORIAN', ...ev('matin', morning), ...ev('soir', evening), 'END:VCALENDAR', ''].join('\r\n');
}
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
    'UID:chamboule-rappel@polynelfe-del.github.io', 'SEQUENCE:' + Math.floor(now.getTime() / 60000),
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
/* Point avec le kiné : la routine Reprise dos date du 11 octobre 2026 ; toutes les 4 semaines, on propose de la lui faire revoir. */
const ROUTINE_DATE = '2026-10-11T10:00:00.000Z', KINE_EVERY_DAYS = 28;
function kineDue(s, now = new Date()) {
  const st = s.settings;
  if (s.history.length < 4 || (st.kineSnooze && now.getTime() < Date.parse(st.kineSnooze))) return false;
  return now.getTime() - Date.parse(st.kineReview || ROUTINE_DATE) >= KINE_EVERY_DAYS * 86400000;
}
function routineTag(s) {
  return s.settings.kineReview ? 'Routine revue le ' + new Date(s.settings.kineReview).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : PROGRAMS.dos.tag;
}
/* Mode entretien : tout est débloqué pour un programme (dernier palier et dernières versions).
   Défi du mois : 4 séances calmes de ce programme, +40 XP une fois par mois. */
const MAINT_GOAL = 4, MAINT_XP = 40;
function monthKey(d) { const x = new Date(d); return x.getFullYear() + '-' + pad(x.getMonth() + 1); }
function atTop(s, progId) {
  return STEP_PROGS.includes(progId) && stepLevel(s, progId) >= STEP_MAX
    && laddersOf(progId).every(l => rungOf(s, l) >= l.rungs.length - 1 || (l.id === 'tirer' && s.settings.noDoor));
}
function maintProgress(s, progId, now = new Date()) {
  const mk = monthKey(now);
  return Math.min(MAINT_GOAL, s.history.filter(h => h.prog === progId && monthKey(h.d) === mk && isDone(h) && quietState(h, s.settings.painMax) === 'count').length);
}
function evalMaintenance(s, now = new Date()) {
  s.maint = s.maint || {};
  const mk = monthKey(now), won = [];
  STEP_PROGS.filter(id => atTop(s, id)).forEach(id => {
    const k = mk + ':' + id;
    if (!s.maint[k] && maintProgress(s, id, now) >= MAINT_GOAL) { s.maint[k] = dayKey(now); s.xp += MAINT_XP; won.push(id); }
  });
  const keep = new Set([0, 1, 2].map(i => monthKey(new Date(now.getFullYear(), now.getMonth() - i, 15))));
  Object.keys(s.maint).forEach(k => { if (!keep.has(k.split(':')[0])) delete s.maint[k]; });
  return won;
}
/* Alertes selon la zone : le milieu du dos à 5/10 ou plus sur n’importe quelle séance des 3 derniers jours
   (rappel des signes à surveiller au ventre), ou la fesse deux séances de suite dans les 7 derniers jours
   (comme une douleur qui commence à descendre). */
function zoneAlert(s, now = new Date()) {
  const recent = s.history.filter(h => now.getTime() - Date.parse(h.d) < 7 * 86400000);
  const has = (h, z) => (h.zone || []).includes(z) || (h.zoneNext || []).includes(z);
  const top = h => Math.max(h.pain ?? 0, h.next ?? 0);
  const mid = recent.find(h => now.getTime() - Date.parse(h.d) < 3 * 86400000 && has(h, 'milieu') && top(h) >= 5);
  if (mid) return { zone: 'milieu', pain: top(mid) };
  if (recent.length >= 2 && has(recent[0], 'fesse') && has(recent[1], 'fesse')) return { zone: 'fesse' };
  return null;
}
/* Repère cardio : minutes de vélo de la semaine en cours. */
function weekBikeMin(s, now = new Date()) { return Math.round(weekEntries(s, now).reduce((a, h) => a + (h.veloMin || 0), 0) * 10) / 10; }
/* Résumé pour le kiné ou le médecin : une page, dans leur langage, des tendances plutôt que chaque séance.
   Ne contient que ce qui a été noté dans l’appli. */
function avg1(a) { return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : null; }
function fr1(v) { return v == null ? '–' : String(v).replace('.', ','); }
function plural(n, w) { return n + ' ' + w + (n > 1 ? 's' : ''); }
function kineSummary(s, now = new Date()) {
  const from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0, 0, 0, 0);
  const list = s.history.filter(h => new Date(h.d) >= from).slice().reverse();
  const st = s.settings;
  const D = d => new Date(d).toLocaleDateString('fr-FR');
  const short = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const vals = (hs, k) => hs.map(h => h[k]).filter(v => v != null);

  /* Douleur par semaine, tendance et pic. */
  const byWeek = new Map();
  list.forEach(h => { const k = startOfWeek(new Date(h.d)).getTime(); if (!byWeek.has(k)) byWeek.set(k, []); byWeek.get(k).push(h); });
  const weeks = [...byWeek.entries()].sort((a, b) => a[0] - b[0])
    .map(([k, hs]) => ({ k, n: hs.length, before: avg1(vals(hs, 'painBefore')), after: avg1(vals(hs, 'pain')), next: avg1(vals(hs, 'next')) }));
  const lvl = w => w.before ?? w.after ?? w.next;
  const known = weeks.filter(w => lvl(w) != null);
  let trend = null;
  if (known.length >= 2) {
    const a = lvl(known[0]), b = lvl(known[known.length - 1]);
    trend = { a, b, dir: b - a >= 1 ? 'en hausse' : a - b >= 1 ? 'en baisse' : 'stable' };
  }
  let peak = null;
  list.forEach(h => [h.painBefore, h.pain, h.next].forEach(v => { if (v != null && (!peak || v > peak.v)) peak = { v, d: h.d }; }));
  const legs = list.filter(h => h.legBefore || h.leg);
  const stops = list.filter(h => backCat(h) === 'stop');
  const zoneCount = {}, painCount = {}, eff = {};
  list.forEach(h => {
    [h.zoneBefore, h.zone, h.zoneNext].forEach(z => (z || []).forEach(id => { zoneCount[id] = (zoneCount[id] || 0) + 1; }));
    (h.painEx || []).forEach(id => { painCount[id] = (painCount[id] || 0) + 1; });
    let k = null;
    if (h.relief != null) k = h.relief > 0 ? 'mieux' : h.relief < 0 ? 'pire' : 'pareil';
    else if (h.pain != null && h.painBefore != null) k = h.pain < h.painBefore ? 'mieux' : h.pain > h.painBefore ? 'pire' : 'pareil';
    if (k) { const e = eff[h.prog] || (eff[h.prog] = { mieux: 0, pareil: 0, pire: 0 }); e[k]++; }
  });
  const pc = Object.entries(painCount);
  const bil = (s.weekly || []).filter(w => new Date(w.d) >= from);
  const lastBil = bil[0];
  const low = (q, i) => WEEKLY[q].a[i].toLowerCase();

  /* Ce qui mérite d’en parler en premier. */
  const flags = [];
  if (legs.length) flags.push(`Symptômes dans la jambe : ${legs.length} fois (${legs.map(h => short(h.d)).join(', ')})`);
  if (stops.length) flags.push(`Séance arrêtée pour douleur ou fourmillements : ${stops.map(h => short(h.d)).join(', ')}`);
  if (trend && trend.dir === 'en hausse') flags.push(`Douleur en hausse : de ${fr1(trend.a)} à ${fr1(trend.b)}/10 en moyenne`);
  if (peak && peak.v >= 7) flags.push(`Pic de douleur à ${peak.v}/10 (séance du ${short(peak.d)})`);
  if (pc.length) flags.push('Exercices qui augmentent la douleur : ' + pc.map(([id, n]) => `${exName(id)} (${n})`).join(', '));
  if (((eff[ROUTINE_PROG] || {}).pire || 0) >= 2) flags.push(`Dos calme a augmenté la douleur ${eff[ROUTINE_PROG].pire} fois`);
  if (lastBil && lastBil.stiff >= 2) flags.push(`Raideur du matin : ${low('stiff', lastBil.stiff)}`);
  if (lastBil && lastBil.night >= 1) flags.push(`Réveillé la nuit par le dos : ${low('night', lastBil.night)} dans la semaine`);
  if (lastBil && lastBil.meds >= 2) flags.push('Antidouleurs tous les jours');
  const mid = list.filter(h => [['zoneBefore', 'painBefore'], ['zone', 'pain'], ['zoneNext', 'next']].some(([z, p]) => (h[z] || []).includes('milieu') && (h[p] ?? 0) >= 5));
  if (mid.length) flags.push(`Milieu du dos à 5/10 ou plus : ${mid.length} fois`);
  if (now.getTime() - Date.parse(st.kineReview || ROUTINE_DATE) >= KINE_EVERY_DAYS * 86400000) flags.push(`Routine du kiné à revoir (${st.kineReview ? 'revue le ' + D(st.kineReview) : 'prescrite le ' + D(ROUTINE_DATE)})`);

  const done = list.filter(isDone), cut = list.length - done.length;
  const days = new Set(done.map(h => dayKey(h.d))).size;
  const rt = routineDays(list);
  const bike = list.reduce((a, h) => a + (h.veloMin || 0), 0);
  const L = [];
  L.push('Suivi du dos · Chamboule Coach');
  L.push(`Du ${D(from)} au ${D(now)}. Noté par le patient dans l’appli : ne remplace pas l’examen.`);
  L.push('');
  L.push('À DISCUTER');
  (flags.length ? flags : ['Rien de particulier signalé sur la période.']).forEach(f => L.push('- ' + f));
  L.push('');
  L.push('DOULEUR DE DOS (0 à 10), moyenne par semaine : avant la séance / juste après / le lendemain');
  if (!weeks.length) L.push('Aucune séance sur la période.');
  weeks.forEach(w => L.push(`Semaine du ${short(w.k)} : ${fr1(w.before)} / ${fr1(w.after)} / ${fr1(w.next)} (${plural(w.n, 'séance')})`));
  if (trend) L.push(`Tendance : ${trend.dir} (${fr1(trend.a)} → ${fr1(trend.b)})`);
  if (peak) L.push(`Plus forte douleur notée : ${peak.v}/10 (séance du ${short(peak.d)})`);
  const zc = ZONE_IDS.filter(id => zoneCount[id]);
  L.push('Zones signalées : ' + (zc.length ? zc.map(id => `${zoneName(id)} (${zoneCount[id]})`).join(', ') : 'aucune précisée'));
  L.push('Symptômes dans la jambe : ' + (legs.length ? legs.length + ' fois' : 'aucun'));
  L.push('');
  L.push('CE QUI SOULAGE, CE QUI GÊNE (juste après la séance, comparé à avant)');
  const effRows = Object.entries(eff);
  if (!effRows.length) L.push('Pas encore de ressenti noté.');
  effRows.forEach(([id, e]) => L.push(`${(PROGRAMS[id] || { name: id }).name}${id === ROUTINE_PROG ? ' (étirements allongé, dos enroulé)' : ''} : mieux ${e.mieux}, pareil ${e.pareil}, pire ${e.pire}`));
  L.push('Exercices passés parce qu’ils augmentaient la douleur : ' + (pc.length ? pc.map(([id, n]) => `${exName(id)} (${n})`).join(', ') : 'aucun'));
  L.push('');
  L.push('BILAN DE LA SEMAINE');
  if (!bil.length) L.push('Pas encore rempli sur la période.');
  bil.slice(0, 4).forEach(w => {
    L.push(`${short(w.d)} : raideur du matin ${low('stiff', w.stiff)} · réveils la nuit : ${low('night', w.night)} · antidouleurs : ${low('meds', w.meds)}`);
    L.push(`  A pu : ${w.can.length ? w.can.map(id => CAN.find(c => c.id === id).label.toLowerCase()).join(', ') : 'rien de la liste'}`);
  });
  L.push('');
  L.push('RÉGULARITÉ');
  L.push(`Séances faites : ${done.length}, sur ${plural(days, 'jour')}${cut ? ` ; ${plural(cut, 'séance')} écourtée${cut > 1 ? 's' : ''} (moins des deux tiers des exercices)` : ''}`);
  L.push(`Routine Dos calme : ${plural(rt.matins, 'matin')}, ${plural(rt.soirs, 'soir')} (${plural(rt.complets, 'jour')} matin et soir)`);
  L.push(st.bike ? `Vélo d’appartement : ${fmtMin(bike)} min sur la période` : 'Vélo d’appartement : mis de côté pour le moment');
  const tl = (s.tests || []).slice(0, 4).reverse();
  if (tl.length) L.push('Tests de forme : ' + tl.map(t => `${D(t.d)} assis-debout ${t.chaise ?? '?'}, pompes au mur ${t.mur ?? '?'}${t.v === TEST_VERSION ? ` (au rythme, ${TEST_CAP} au plus${t.pain != null ? `, douleur après ${t.pain}/10` : ''})` : ' (ancien test : le plus possible en 30 s)'}`).join(' ; '));
  L.push('');
  L.push('PROGRAMME ACTUEL');
  L.push(`Routine du kiné (Reprise dos) prescrite le ${D(ROUTINE_DATE)}${st.kineReview ? ', revue le ' + D(st.kineReview) : ', pas encore revue'} : ${plural(st.sets, 'série')} par exercice au sol, ${st.bike ? 'vélo ' + st.veloMin + ' min' : 'sans vélo'}`);
  L.push(`Fessiers doux : ${plural(st.fessiersSets, 'série')} par exercice`);
  const up = STEP_PROGS.filter(id => stepLevel(s, id) > 0);
  L.push('Charge augmentée automatiquement, douleur restée basse : ' + (up.length ? up.map(id => `${PROGRAMS[id].name} +${stepLevel(s, id)}`).join(', ') + ' (une répétition ou quelques secondes de plus à chaque cran)' : 'aucune pour le moment'));
  const harder = LADDERS.filter(l => rungOf(s, l) > 0);
  L.push('Exercices remplacés par une version plus difficile : ' + (harder.length ? harder.map(l => `${exName(l.rungs[0])} → ${exName(l.rungs[rungOf(s, l)])}`).join(', ') : 'aucun'));
  if (st.noDoor) L.push('Rowing à la porte remplacé par le tirage à la serviette (pas de porte adaptée)');
  if (st.noTable) L.push('Rowing sous la table remplacé (pas de table adaptée)');
  L.push(`Douleur acceptable pour progresser : ${st.painMax}/10${st.painMaxAt ? ' (réglée le ' + D(st.painMaxAt) + (st.painMax > 3 ? ', accord kiné déclaré)' : ')') : ' (valeur par défaut)'}`);
  L.push(`Dos du milieu : ${st.milieuOk ? 'ouvert après vérification médicale déclarée' + (st.milieuOkAt ? ' le ' + D(st.milieuOkAt) : '') : 'en attente d’une vérification médicale'}`);
  L.push(`Dos solide : ${st.solideUnlocked ? 'débloqué' + (st.solideUnlockedAt ? ' le ' + D(st.solideUnlockedAt) : '') + ' (accord kiné déclaré)' : `verrouillé (${solidStreak(s)} séances de renforcement calmes sur les ${SOLIDE_WINDOW} dernières, ${SOLIDE_NEEDED} demandées, lendemain compris)`}`);
  L.push(`Calisthénie : ${st.calisUnlocked ? 'débloquée' + (st.calisUnlockedAt ? ' le ' + D(st.calisUnlockedAt) : '') + ' (accord kiné déclaré)' : st.solideUnlocked ? `verrouillée (${calisStreak(s)} / ${CALIS_NEEDED} séances de renforcement d’affilée à ${CALIS_PAIN}/10 au plus)` : 'verrouillée (après Dos solide)'}`);
  L.push(`Boule qui chamboule : ${st.bouleUnlocked ? 'débloqué' + (st.bouleUnlockedAt ? ' le ' + D(st.bouleUnlockedAt) : '') + ' (validation kiné déclarée)' : 'verrouillé'}`);
  return L.join('\n');
}
