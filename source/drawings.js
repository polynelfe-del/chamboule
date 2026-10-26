/* Chamboule Coach : dessins (exercices, icônes, Chouquette, boîtes). Que des chaînes SVG, aucun accès à la page. */

/* ---------- Illustrations (pictogrammes dessinés : départ puis mouvement) ---------- */
const Q = {
  head: [110, 68], neck: [[96, 74], [104, 70]], torso: [[60, 81], [96, 74]],
  armN: [[96, 74], [97, 91], [97, 108]], armF: [[93, 74], [92, 91], [92, 108]],
  legN: [[60, 81], [60, 107], [37, 107]], legF: [[57, 81], [55, 107], [33, 107]]
};
const SUP = { head: [40, 103], neck: [[47, 105], [50, 106]], torso: [[50, 106], [88, 106]],
  legN: [[88, 106], [104, 86], [118, 107]], legF: [[88, 106], [101, 87], [114, 107]], arm: [[50, 107], [66, 108], [80, 108]] };
const BIKE = '<g class="il-bike"><path d="M74 108 V68 M66 64 H82 M108 108 L110 54 M104 52 H118 M62 110 H122 M74 96 L92 92"/><circle cx="92" cy="92" r="13"/></g>';
const BENCH = '<rect class="il-prop" x="12" y="86" width="34" height="26" rx="3"/>';
const up = (x, y1, y2) => `<path class="il-arrow" d="M${x} ${y1} V${y2} M${x - 5} ${y2 + 5} L${x} ${y2} L${x + 5} ${y2 + 5}"/>`;
const down = (x, y1, y2) => `<path class="il-arrow" d="M${x} ${y1} V${y2} M${x - 5} ${y2 - 5} L${x} ${y2} L${x + 5} ${y2 - 5}"/>`;

const ILLUS = {
  transverse: { labels: ['Inspire : ventre gonflé', 'Expire : ventre rentré'], poses: [
    { h: SUP.head, b: [SUP.neck, SUP.torso], f: [SUP.legF], n: [SUP.legN, SUP.arm], over: '<path class="il-cue" d="M58 99 Q72 84 86 99"/>' + up(72, 82, 70) },
    { h: SUP.head, b: [SUP.neck, SUP.torso], f: [SUP.legF], n: [SUP.legN, SUP.arm], over: '<path class="il-cue" d="M58 100 Q72 96 86 100"/>' + down(72, 70, 82) }
  ]},
  birddog: { labels: ['Départ, dos plat', 'Bras et jambe opposés'], poses: [
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN] },
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF], n: [Q.legN], a: [[[96, 74], [114, 71], [132, 69]], [[60, 81], [36, 79], [12, 78]]] }
  ]},
  pont: { labels: ['Départ, dos au sol', 'Monte sans cambrer'], poses: [
    { h: SUP.head, b: [SUP.neck, SUP.torso], f: [SUP.legF], n: [SUP.legN, SUP.arm] },
    { h: SUP.head, b: [SUP.neck], f: [[[86, 91], [104, 84], [114, 107]]], n: [[[108, 83], [118, 107]], SUP.arm], a: [[[50, 106], [86, 91], [108, 83]]], over: up(86, 110, 99) }
  ]},
  velo: { labels: ['Buste peu penché', 'Pédale en souplesse'], poses: [
    { prop: BIKE, h: [88, 16], b: [[[74, 62], [84, 30]], [[84, 30], [86, 24]]], f: [[[83, 31], [95, 42], [106, 52]], [[74, 62], [90, 80], [87, 101]]], n: [[[84, 30], [97, 40], [108, 51]]], a: [[[74, 62], [96, 58], [97, 83]]], over: '<path class="il-crank" d="M97 83 L87 101"/>' },
    { prop: BIKE, h: [88, 16], b: [[[74, 62], [84, 30]], [[84, 30], [86, 24]]], f: [[[83, 31], [95, 42], [106, 52]], [[74, 62], [96, 58], [97, 83]]], n: [[[84, 30], [97, 40], [108, 51]]], a: [[[74, 62], [90, 80], [87, 101]]], over: '<path class="il-crank" d="M97 83 L87 101"/>' }
  ]},
  hipthrust: { labels: ['Hanches basses', 'Pousse, serre les fesses'], poses: [
    { prop: BENCH, h: [31, 76], b: [[[44, 82], [38, 79]], [[44, 82], [70, 100]]], f: [[[70, 100], [89, 85], [96, 108]]], n: [[[70, 100], [92, 84], [100, 108]], [[44, 82], [30, 82], [18, 82]]] },
    { prop: BENCH, h: [31, 76], b: [[[44, 82], [38, 79]]], f: [[[78, 80], [99, 81], [100, 108]]], n: [[[102, 80], [104, 108]], [[44, 82], [30, 82], [18, 82]]], a: [[[44, 82], [78, 80], [102, 80]]], over: up(78, 108, 94) }
  ]},
  fentes: { labels: ['Debout', 'Recule et descends'], poses: [
    { h: [80, 12], b: [[[80, 21], [80, 60]]], f: [[[78, 60], [77, 84], [76, 108], [84, 108]]], n: [[[80, 60], [81, 84], [82, 108], [90, 108]], [[80, 27], [91, 42], [84, 56]]] },
    { h: [78, 31], b: [[[78, 40], [78, 80]]], n: [[[78, 80], [102, 84], [104, 108], [112, 108]], [[78, 46], [89, 60], [82, 74]]], a: [[[78, 80], [66, 104], [44, 106]]], over: down(130, 30, 48) }
  ]},
  donkey: { labels: ['Départ, dos plat', 'Talon vers le plafond'], poses: [
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN] },
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF, Q.legF], n: [Q.armN], a: [[[60, 81], [35, 80], [34, 56]]], over: up(20, 72, 56) }
  ]},
  sumo: { labels: ['Vue de face', 'Descends, genoux ouverts'], poses: [
    { h: [80, 12], b: [[[80, 21], [80, 60]], [[66, 28], [94, 28]], [[72, 60], [88, 60]]], n: [[[72, 60], [62, 84], [54, 108], [46, 110]], [[88, 60], [98, 84], [106, 108], [114, 110]], [[66, 28], [63, 44], [80, 50]], [[94, 28], [97, 44], [80, 50]]] },
    { h: [80, 32], b: [[[80, 41], [80, 80]], [[66, 48], [94, 48]], [[72, 80], [88, 80]]], n: [[[66, 48], [63, 64], [80, 70]], [[94, 48], [97, 64], [80, 70]]], a: [[[72, 80], [52, 88], [54, 108], [46, 110]], [[88, 80], [108, 88], [106, 108], [114, 110]]], over: down(136, 34, 52) }
  ]},
  hydrant: { labels: ['Vue de dos', 'Ouvre le genou sur le côté'], poses: [
    { h: [80, 55], f: [[[66, 70], [64, 108]], [[94, 70], [96, 108]]], n: [[[71, 82], [71, 106]], [[89, 82], [89, 106]]], over: '<rect class="il-mass" x="66" y="64" width="28" height="22" rx="9"/>' },
    { h: [80, 55], f: [[[66, 70], [64, 108]], [[94, 70], [96, 108]]], n: [[[71, 82], [71, 106]]], a: [[[89, 82], [118, 90]]], over: '<rect class="il-mass" x="66" y="64" width="28" height="22" rx="9"/><path class="il-arrow" d="M104 62 L122 62 M117 57 L122 62 L117 67"/>' }
  ]}
};

const SUP2 = { head: [40, 103], neck: [[47, 105], [50, 106]], torso: [[50, 106], [88, 106]], legN: [[88, 106], [104, 86], [118, 107]], legF: [[88, 106], [101, 87], [114, 107]], arm: [[50, 107], [66, 108], [80, 108]] };
const CHAIR = '<path class="il-prop" d="M58 74h44v6H58z"/><path class="il-bike" d="M61 80v32M99 80v32"/>';
Object.assign(ILLUS, {
  chatvache: { labels: ['Dos rond, on expire', 'Dos creux, on inspire'], poses: [
    { h: [106, 85], b: [[[96, 74], [101, 80]]], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN], a: [[[60, 81], [78, 63], [96, 74]]], over: '<path class="il-arrow" d="M78 54 V44 M73 49 L78 44 L83 49"/>' },
    { h: [111, 64], b: [[[96, 73], [104, 68]]], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN], a: [[[60, 80], [78, 84], [96, 73]]], over: '<path class="il-arrow" d="M78 62 V72 M73 67 L78 72 L83 67"/>' }
  ]},
  rotation: { labels: ['Assis, dos long', 'Tourne doucement'], poses: [
    { prop: CHAIR, h: [80, 20], b: [[[80, 29], [80, 70]], [[64, 38], [96, 38]], [[70, 72], [90, 72]]], n: [[[70, 72], [68, 86], [68, 110]], [[90, 72], [92, 86], [92, 110]], [[64, 38], [72, 50], [92, 46]], [[96, 38], [88, 50], [68, 46]]] },
    { prop: CHAIR, h: [84, 20], b: [[[80, 29], [80, 70]], [[70, 72], [90, 72]]], n: [[[70, 72], [68, 86], [68, 110]], [[90, 72], [92, 86], [92, 110]]], a: [[[70, 39], [94, 37]], [[70, 39], [76, 50], [92, 45]], [[94, 37], [89, 50], [74, 46]]], over: '<path class="il-arrow" d="M62 10 Q80 0 98 10 M93 5 L98 10 L92 13"/>' }
  ]},
  thorax: { labels: ['Coudes rapprochés', 'Ouvre les coudes'], poses: [
    { h: [80, 16], b: [[[80, 25], [80, 64]], [[66, 32], [94, 32]], [[72, 64], [88, 64]]], n: [[[72, 64], [70, 110]], [[88, 64], [90, 110]], [[66, 32], [72, 22], [78, 14]], [[94, 32], [88, 22], [82, 14]]] },
    { h: [80, 16], b: [[[80, 25], [80, 64]], [[66, 32], [94, 32]], [[72, 64], [88, 64]]], n: [[[72, 64], [70, 110]], [[88, 64], [90, 110]]], a: [[[66, 32], [50, 22], [73, 12]], [[94, 32], [110, 22], [87, 12]]], over: '<path class="il-arrow" d="M44 34 L34 34 M39 29 L34 34 L39 39 M116 34 L126 34 M121 29 L126 34 L121 39"/>' }
  ]},
  gainage: { labels: ['Ventre relâché', 'Nombril rentré, tiens'], poses: [
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [SUP2.legF], n: [SUP2.legN, SUP2.arm], over: '<path class="il-cue" d="M58 100 Q72 89 86 100"/>' },
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [SUP2.legF], n: [SUP2.legN, SUP2.arm], over: '<path class="il-cue" d="M58 101 Q72 97 86 101"/>' + '<path class="il-arrow" d="M72 72 V84 M67 79 L72 84 L77 79"/><text class="il-t" x="104" y="62" text-anchor="middle">8 s</text>' }
  ]},
  planche: { labels: ['Sur les avant-bras et genoux', 'Dos droit, tiens'], poses: [
    { h: [112, 85], b: [[[56, 82], [100, 90]], [[100, 90], [106, 87]]], n: [[[100, 90], [100, 107], [120, 107]], [[56, 82], [56, 107], [34, 100]]] },
    { h: [112, 85], b: [[[100, 90], [106, 87]]], n: [[[100, 90], [100, 107], [120, 107]], [[50, 105], [30, 96]]], a: [[[100, 90], [75, 97.5], [50, 105]]], over: '<text class="il-t" x="76" y="74" text-anchor="middle">12 s</text>' }
  ]},
  marche: { labels: ['Pas souple', 'Bras relâchés'], poses: [
    { h: [81, 12], b: [[[80, 21], [80, 60]]], f: [[[80, 60], [72, 84], [62, 106], [69, 108]], [[80, 28], [72, 44], [70, 58]]], n: [[[80, 28], [88, 43], [94, 56]]], a: [[[80, 60], [90, 84], [96, 108], [104, 108]]] },
    { h: [81, 12], b: [[[80, 21], [80, 60]]], f: [[[80, 60], [90, 84], [96, 106], [103, 108]], [[80, 28], [88, 43], [94, 56]]], n: [[[80, 28], [72, 44], [70, 58]]], a: [[[80, 60], [72, 84], [62, 108], [70, 108]]] }
  ]}
});
/* Dos calme, Fessiers doux et Dos solide. */
const CHAIR_SIDE = '<path class="il-prop" d="M36 74h34v6H36z"/><path class="il-bike" d="M39 80v32M67 80v32M38 74V40"/>';
const SIDE_LYING = { head: [30, 99], torso: [[40, 104], [84, 104]], arm: [[44, 100], [58, 94], [70, 99]] };
const BRIDGE_UP = { torso: [[50, 106], [86, 91]], legF: [[86, 91], [104, 84], [114, 107]] };
Object.assign(ILLUS, {
  bascule: { labels: ['Dos neutre', 'Plaque le bas du dos'], poses: [
    { h: SUP2.head, b: [SUP2.neck, [[50, 106], [70, 101], [88, 106]]], f: [SUP2.legF], n: [SUP2.legN, SUP2.arm] },
    { h: SUP2.head, b: [SUP2.neck], f: [SUP2.legF], n: [SUP2.legN, SUP2.arm], a: [[[50, 107], [88, 107]]], over: down(70, 84, 97) }
  ]},
  genoupoitrine: { labels: ['Sur le dos', 'Genou vers la poitrine'], poses: [
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [SUP2.legF], n: [SUP2.legN, SUP2.arm] },
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [SUP2.legF], a: [[[88, 106], [76, 84], [92, 80]], [[50, 106], [64, 94], [76, 87]]], over: '<text class="il-t" x="118" y="70" text-anchor="middle">15 s</text>' }
  ]},
  rouleau: { labels: ['Vue de dessus', 'Genoux d’un côté'], poses: [
    { h: [24, 60], b: [[[32, 60], [86, 60]], [[40, 46], [40, 74]], [[86, 52], [86, 68]]], f: [[[40, 46], [28, 34]], [[40, 74], [28, 86]]], n: [[[86, 54], [112, 54], [122, 57]], [[86, 66], [112, 66], [122, 63]]] },
    { h: [24, 60], b: [[[32, 60], [86, 60]], [[40, 46], [40, 74]], [[86, 52], [86, 68]]], f: [[[40, 46], [28, 34]], [[40, 74], [28, 86]]], a: [[[86, 56], [106, 76], [118, 80]], [[86, 66], [100, 84], [112, 88]]], over: '<path class="il-arrow" d="M126 50 Q138 66 126 82 M120 80 L126 82 L128 76"/>' }
  ]},
  talons: { labels: ['À quatre pattes', 'Fesses vers les talons'], poses: [
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN] },
    { h: [92, 101], b: [[[84, 98], [86, 99]]], f: [[[82, 98], [100, 106], [118, 107]]], n: [[[60, 107], [38, 108]], [[84, 98], [102, 106], [122, 107]]], a: [[[60, 107], [46, 92], [84, 98]]], over: '<path class="il-arrow" d="M46 74 H30 M35 69 L30 74 L35 79"/>' }
  ]},
  coquillage: { labels: ['Sur le côté, pieds joints', 'Ouvre le genou'], poses: [
    { h: SIDE_LYING.head, b: [SIDE_LYING.torso], f: [[[84, 106], [108, 108], [86, 109]]], n: [[[84, 101], [108, 103], [87, 105]], SIDE_LYING.arm] },
    { h: SIDE_LYING.head, b: [SIDE_LYING.torso], f: [[[84, 106], [108, 108], [86, 109]]], n: [SIDE_LYING.arm], a: [[[84, 101], [104, 82], [87, 105]]], over: up(120, 98, 82) }
  ]},
  abduction: { labels: ['Sur le côté', 'Lève la jambe du dessus'], poses: [
    { h: SIDE_LYING.head, b: [SIDE_LYING.torso], f: [[[84, 106], [136, 108]]], n: [[[84, 101], [136, 103]], SIDE_LYING.arm] },
    { h: SIDE_LYING.head, b: [SIDE_LYING.torso], f: [[[84, 106], [136, 108]]], n: [SIDE_LYING.arm], a: [[[84, 101], [132, 80]]], over: up(146, 98, 82) }
  ]},
  assisdebout: { labels: ['Au bord de la chaise', 'Debout, sans les mains'], poses: [
    { prop: CHAIR_SIDE, h: [64, 24], b: [[[58, 70], [62, 36]], [[62, 36], [63, 32]]], n: [[[58, 70], [86, 72], [88, 108], [96, 108]], [[62, 40], [74, 50], [70, 42]]] },
    { prop: CHAIR_SIDE, h: [87, 14], b: [[[84, 62], [86, 26]], [[86, 26], [86, 22]]], n: [[[86, 30], [96, 40], [92, 32]]], a: [[[84, 62], [87, 86], [88, 108], [96, 108]]], over: up(120, 80, 60) }
  ]},
  gainagelat: { labels: ['Sur l’avant-bras et les genoux', 'Hanches levées, tiens'], poses: [
    { h: [32, 82], b: [[[40, 90], [74, 105]]], n: [[[40, 90], [40, 108], [62, 108]], [[74, 105], [104, 107], [88, 96]], [[40, 90], [54, 84], [66, 98]]] },
    { h: [32, 82], n: [[[40, 90], [40, 108], [62, 108]], [[104, 107], [88, 96]], [[40, 90], [54, 80], [70, 92]]], a: [[[40, 90], [72, 98], [104, 107]]], over: '<text class="il-t" x="80" y="72" text-anchor="middle">15 s</text>' }
  ]},
  birddogtenu: { labels: ['Départ, dos plat', 'Bras et jambe opposés, tiens'], poses: [
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF, Q.legF], n: [Q.armN, Q.legN] },
    { h: Q.head, b: [Q.neck, Q.torso], f: [Q.armF], n: [Q.legN], a: [[[96, 74], [114, 71], [132, 69]], [[60, 81], [36, 79], [12, 78]]], over: '<text class="il-t" x="76" y="52" text-anchor="middle">5 s</text>' }
  ]},
  pontmarche: { labels: ['Pont, bassin levé', 'Un pied décolle, le bassin reste droit'], poses: [
    { h: SUP2.head, b: [SUP2.neck, BRIDGE_UP.torso], f: [BRIDGE_UP.legF], n: [[[86, 91], [108, 83], [118, 107]], SUP2.arm] },
    { h: SUP2.head, b: [SUP2.neck, BRIDGE_UP.torso], f: [BRIDGE_UP.legF], n: [SUP2.arm], a: [[[86, 91], [100, 70], [114, 76]]], over: up(126, 84, 68) }
  ]},
  deadbug: { labels: ['Bras au plafond, genoux à 90°', 'Bras et jambe opposés s’allongent'], poses: [
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [[[86, 105], [84, 80], [106, 80]], [[48, 104], [48, 76]]], n: [[[88, 106], [88, 80], [110, 80]], [[52, 104], [52, 76]]] },
    { h: SUP2.head, b: [SUP2.neck, SUP2.torso], f: [[[86, 105], [84, 80], [106, 80]], [[48, 104], [48, 76]]], a: [[[88, 106], [138, 100]], [[52, 104], [26, 96]]] }
  ]},
  plancheplus: { labels: ['Planche sur les genoux maîtrisée', 'Sur les pieds, corps droit'], poses: [
    { h: [112, 85], b: [[[100, 90], [106, 87]]], n: [[[100, 90], [100, 107], [120, 107]], [[50, 105], [30, 96]]], a: [[[100, 90], [75, 97.5], [50, 105]]] },
    { h: [112, 85], b: [[[100, 90], [106, 87]]], n: [[[100, 90], [100, 107], [120, 107]]], a: [[[100, 90], [60, 98], [20, 106]]], over: '<text class="il-t" x="60" y="80" text-anchor="middle">10 s</text>' }
  ]},
  squatchaise: { labels: ['Debout devant la chaise', 'Effleure la chaise, remonte'], poses: [
    { prop: CHAIR_SIDE, h: [87, 14], b: [[[84, 62], [86, 26]], [[86, 26], [86, 22]]], n: [[[84, 62], [87, 86], [88, 108], [96, 108]], [[86, 30], [96, 40], [92, 32]]] },
    { prop: CHAIR_SIDE, h: [82, 26], b: [[[62, 68], [78, 36]], [[78, 36], [80, 32]]], n: [[[78, 40], [96, 44], [112, 46]]], a: [[[62, 68], [88, 76], [90, 108], [98, 108]]], over: down(120, 46, 64) }
  ]}
});
/* Haut du corps doux et versions plus difficiles. */
const WALL_R = '<path class="il-prop" d="M128 4h8v108h-8z"/>';
const WALL_R2 = '<path class="il-prop" d="M118 4h8v108h-8z"/>';
const WALL_L = '<path class="il-prop" d="M22 4h8v108h-8z"/>';
const WALL_BACK = '<rect class="il-wall" x="40" y="4" width="80" height="108" rx="4"/>';
const COUNTER = '<path class="il-prop" d="M114 56h40v6h-40z"/><path class="il-bike" d="M148 62v50"/>';
const DOOR = '<path class="il-prop" d="M126 4h10v108h-10z"/><path class="il-bike" d="M126 62h-4"/>';
const SUPPORT = '<path class="il-prop" d="M30 38h20v6H30z"/><path class="il-bike" d="M34 44v68M46 44v68"/>';
const towel = (x, y) => `<path class="il-cue" d="M${x} ${y} L122 62"/>`;
const toRight = (x, y) => `<path class="il-arrow" d="M${x} ${y} H${x + 16} M${x + 11} ${y - 5} L${x + 16} ${y} L${x + 11} ${y + 5}"/>`;
Object.assign(ILLUS, {
  murpompe: { labels: ['Bras tendus, corps droit', 'Poitrine vers le mur'], poses: [
    { prop: WALL_R, h: [94, 20], b: [[[75, 64], [90, 30]], [[90, 30], [92, 26]]], f: [[[73, 64], [64, 85], [56, 106], [63, 108]], [[88, 32], [107, 37], [126, 42]]], n: [[[75, 64], [66.5, 85], [58, 106], [66, 108]], [[90, 32], [109, 36], [128, 40]]] },
    { prop: WALL_R, h: [115, 31], b: [[[108, 40], [110.4, 36.8]]], f: [[[83.5, 70], [70, 88], [56, 106], [63, 108]]], n: [[[85.5, 69.7], [72, 88], [58, 106], [66, 108]]], a: [[[85.5, 69.7], [108, 40]], [[108, 42], [118, 57], [128, 40]]], over: toRight(58, 34) }
  ]},
  planpompe: { labels: ['Mains sur le plan de travail', 'Poitrine vers le bord'], poses: [
    { prop: COUNTER, h: [99, 31], b: [[[68.6, 69.7], [92, 40]], [[92, 40], [94.5, 37]]], f: [[[66.6, 70], [52, 88], [37, 106], [45, 108]], [[90, 43], [106, 50], [121, 56]]], n: [[[68.6, 69.7], [54.3, 87.9], [40, 106], [48, 108]], [[92, 42], [108, 49], [124, 56]]] },
    { prop: COUNTER, h: [114, 47], b: [[[106, 53], [108.5, 50]]], f: [[[74.3, 77], [56, 92], [37, 106], [45, 108]]], n: [[[76.3, 76.9], [58, 91.5], [40, 106], [48, 108]]], a: [[[76.3, 76.9], [106, 53]], [[106, 55], [112, 71], [124, 56]]], over: down(132, 22, 40) }
  ]},
  genoupompe: { labels: ['Sur les genoux, bras tendus', 'Descends, dos droit'], poses: [
    { h: [109, 64], b: [[[69.2, 89.8], [100, 70]], [[100, 70], [102.5, 68.4]]], f: [[[67, 90], [42, 106], [22, 99]], [[97, 72], [97, 90], [97, 108]]], n: [[[69.2, 89.8], [44, 106], [24, 98]], [[100, 72], [100, 90], [100, 108]]] },
    { h: [111, 92], b: [[[100, 94], [102.5, 93.5]]], f: [[[67, 101], [42, 106], [22, 99]]], n: [[[69.2, 100.6], [44, 106], [24, 98]]], a: [[[69.2, 100.6], [100, 94]], [[100, 95], [86, 100], [100, 108]]], over: down(128, 60, 78) }
  ]},
  rowserviette: { labels: ['Penché en arrière, bras tendus', 'Tire la poitrine vers la porte'], poses: [
    { prop: DOOR, h: [82, 17], b: [[[91.2, 63.1], [84, 28]], [[84, 28], [83.5, 25]]], f: [[[89, 63], [96, 85], [97, 106], [105, 108]], [[82, 31], [97, 43], [111, 54]]], n: [[[91.2, 63.1], [98, 85], [100, 106], [108, 108]], [[84, 30], [98.5, 41.5], [113, 53]]], over: towel(113, 53) },
    { prop: DOOR, h: [99, 17], b: [[[99.5, 63], [99, 28]], [[99, 28], [99, 25]]], f: [[[97.5, 63], [99, 85], [97, 106], [105, 108]]], n: [[[99.5, 63], [101, 85], [100, 106], [108, 108]]], a: [[[99, 30], [88, 46], [108, 42]]], over: towel(108, 42) + toRight(56, 40) }
  ]},
  rowpenche: { labels: ['Plus penché : plus dur', 'Tire, omoplates serrées'], poses: [
    { prop: DOOR, h: [70, 24], b: [[[89.4, 66.1], [74.2, 33.5]], [[74.2, 33.5], [73, 31]]], f: [[[87.4, 66], [98, 86], [105, 106], [113, 108]], [[72, 36], [88.5, 45], [105, 54]]], n: [[[89.4, 66.1], [100, 86], [108, 106], [116, 108]], [[74.2, 35], [90.5, 44], [106.9, 53]]], over: towel(107, 53) },
    { prop: DOOR, h: [92, 17], b: [[[100.4, 62.7], [94.1, 27.2]], [[94.1, 27.2], [93.6, 24.5]]], f: [[[98.4, 63], [102.5, 85], [105, 106], [113, 108]]], n: [[[100.4, 62.7], [104.5, 85], [108, 106], [116, 108]]], a: [[[94.1, 29], [82, 44], [104, 40]]], over: towel(104, 40) + toRight(50, 40) }
  ]},
  angesmur: { labels: ['Dos et bras contre le mur', 'Glisse les bras vers le haut'], poses: [
    { prop: WALL_BACK, h: [80, 16], b: [[[80, 25], [80, 64]], [[66, 32], [94, 32]], [[72, 64], [88, 64]]], n: [[[72, 64], [70, 110]], [[88, 64], [90, 110]], [[66, 32], [50, 34], [52, 16]], [[94, 32], [110, 34], [108, 16]]] },
    { prop: WALL_BACK, h: [80, 16], b: [[[80, 25], [80, 64]], [[66, 32], [94, 32]], [[72, 64], [88, 64]]], n: [[[72, 64], [70, 110]], [[88, 64], [90, 110]]], a: [[[66, 32], [56, 18], [50, 4]], [[94, 32], [104, 18], [110, 4]]], over: up(28, 44, 24) + up(132, 44, 24) }
  ]},
  charniere: { labels: ['Debout, dos au mur', 'Fesses vers le mur, dos droit'], poses: [
    { prop: WALL_L, h: [56, 16], b: [[[56, 62], [56, 26]], [[56, 26], [56, 24]]], f: [[[54, 62], [55, 84], [56, 106], [64, 108]]], n: [[[56, 62], [57, 84], [58, 106], [66, 108]], [[56, 30], [58, 46], [58, 62]]] },
    { prop: WALL_L, h: [73, 31], b: [[[64.6, 38.3], [67, 36.3]]], f: [[[33, 66], [52, 87], [56, 106], [64, 108]]], n: [[[34, 64], [54, 86], [58, 106], [66, 108]], [[64.6, 40], [66, 56], [67, 72]]], a: [[[34, 64], [64.6, 38.3]]], over: '<path class="il-arrow" d="M52 22 H40 M45 17 L40 22 L45 27"/>' }
  ]},
  charniereunejambe: { labels: ['Sur une jambe, main au mur', 'Penche-toi, jambe arrière tendue'], poses: [
    { prop: WALL_R2, h: [80, 16], b: [[[80, 62], [80, 26]], [[80, 26], [80, 24]]], f: [[[78, 62], [76, 84], [72, 100], [66, 100]], [[78, 30], [78, 46], [78, 60]]], n: [[[80, 62], [80, 84], [80, 106], [88, 108]], [[80, 30], [98.5, 35], [117, 40]]] },
    { prop: WALL_R2, h: [108.5, 38.4], b: [[[101.5, 43.3], [103.5, 41.9]]], n: [[[72, 64], [82, 85], [80, 106], [88, 108]], [[101.5, 45], [108, 56], [117, 52]]], a: [[[72, 64], [101.5, 43.3]], [[72, 64], [54.8, 76], [37.6, 88], [34, 84]]] }
  ]},
  fentesoutenue: { labels: ['Debout, main sur l’appui', 'Recule une jambe et descends'], poses: [
    { prop: SUPPORT, h: [88, 12], b: [[[88, 21], [88, 60]]], f: [[[86, 60], [85, 84], [84, 108], [92, 108]]], n: [[[88, 60], [89, 84], [90, 108], [98, 108]], [[88, 28], [68, 36], [48, 41]]] },
    { prop: SUPPORT, h: [86, 31], b: [[[86, 40], [86, 80]]], n: [[[86, 80], [110, 84], [112, 108], [120, 108]], [[86, 46], [67, 45], [48, 43]]], a: [[[86, 80], [74, 104], [52, 106]]], over: down(138, 30, 48) }
  ]}
});
const FRONT = { b: [[[80, 25], [80, 64]], [[66, 32], [94, 32]], [[72, 64], [88, 64]]], legs: [[[72, 64], [70, 110]], [[88, 64], [90, 110]]] };
ILLUS.tirageserviette = { labels: ['Serviette tendue devant la poitrine', 'Écarte en serrant les omoplates'], poses: [
  { h: [80, 16], b: FRONT.b, n: FRONT.legs.concat([[[66, 32], [68, 42], [74, 44]], [[94, 32], [92, 42], [86, 44]]]), over: '<path class="il-cue" d="M74 44 L86 44 M74 44 L72 56 M86 44 L88 56"/>' },
  { h: [80, 16], b: FRONT.b, n: FRONT.legs, a: [[[66, 32], [54, 42], [62, 46]], [[94, 32], [106, 42], [98, 46]]], over: '<path class="il-cue" d="M62 46 L98 46"/><path class="il-arrow" d="M44 50 H32 M37 45 L32 50 L37 55 M116 50 H128 M123 45 L128 50 L123 55"/>' }
]};
function poseSVG(p) {
  const pl = list => (list || []).map(pts => `<polyline points="${pts.map(q => q.join(',')).join(' ')}"/>`).join('');
  return `${p.prop || ''}<g class="il-far">${pl(p.f)}</g><g class="il-body">${pl(p.b)}${pl(p.n)}</g><g class="il-move">${pl(p.a)}</g><circle class="il-head" cx="${p.h[0]}" cy="${p.h[1]}" r="8"/>${p.over || ''}`;
}
function illusFull(id, cls) {
  const il = ILLUS[id]; if (!il) return '';
  const panel = (p, i) => `<g transform="translate(${i * 180},0)"><rect class="il-bg" width="160" height="120" rx="12"/><line class="il-floor" x1="8" y1="112" x2="152" y2="112"/>${poseSVG(p)}</g>`;
  return `<figure class="il-fig ${cls || ''}"><svg class="il" viewBox="0 0 340 120" aria-hidden="true">${panel(il.poses[0], 0)}<path class="il-next" d="M164 60 h12 m-5 -5 l5 5 l-5 5"/>${panel(il.poses[1], 1)}</svg><figcaption class="il-caps"><span>1. ${esc(il.labels[0])}</span><span>2. ${esc(il.labels[1])}</span></figcaption></figure>`;
}
function illusMini(id) {
  const il = ILLUS[id]; if (!il) return '';
  return `<svg class="il il-mini" viewBox="0 0 160 120" aria-hidden="true"><rect class="il-bg" width="160" height="120" rx="14"/><line class="il-floor" x1="8" y1="112" x2="152" y2="112"/>${poseSVG(il.poses[1])}</svg>`;
}

const ICON = {
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  play: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  tPlay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/></svg>',
  tTrophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/></svg>',
  tBook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3.5M12.5 12h3.5"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  sound: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  star: (cls, style) => `<svg class="${cls || ''}" ${style ? `style="${style}"` : ''} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>`,
  bike: running => `<svg class="bike${running ? ' spin' : ''}" viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="wheel"><circle cx="13" cy="28" r="10"/><path d="M13 18v20M3 28h20"/></g><g class="wheel"><circle cx="51" cy="28" r="10"/><path d="M51 18v20M41 28h20"/></g><path d="M13 28l11-14h15l12 14M24 14l9 14h4M37 7h7M39 14l-2-7M23 10h7"/></svg>`
};

/* Garde-robe : chaque tenue ajoute des calques au dessin de Chouquette. */
const BOW = '<path class="m-bow" d="M26 9 15 3.5q-3 5.5 0 11zM26 9 37 3.5q3 5.5 0 11z"/><circle class="m-bow" cx="26" cy="9" r="3.4"/>';
const OUTFIT_SVG = {
  noeud: { top: BOW },
  'noeud-or': { top: BOW.replace(/m-bow/g, 'm-gold') },
  bandeau: { under: '<rect class="m-sweat" x="7" y="19" width="38" height="5"/><path class="m-sweat-h" d="M26 23.2 24.4 21.6a1 1 0 0 1 1.6-1.2 1 1 0 0 1 1.6 1.2z"/>' },
  lunettes: { top: BOW, face: '<g class="m-shades"><rect x="12.5" y="25.5" width="13" height="8.5" rx="4"/><rect x="26.5" y="25.5" width="13" height="8.5" rx="4"/><path d="M25.5 28.5h1"/></g><path class="m-glint" d="M15 28.6l3-1.2M29 28.6l3-1.2"/>' },
  fleur: { top: '<g class="m-flower"><circle cx="38" cy="6.4" r="3.3"/><circle cx="43.4" cy="9.8" r="3.3"/><circle cx="41.4" cy="15.4" r="3.3"/><circle cx="34.6" cy="15.4" r="3.3"/><circle cx="32.6" cy="9.8" r="3.3"/></g><circle class="m-gold" cx="38" cy="11" r="2.6"/>' },
  'coeur-lunettes': { top: BOW, face: '<path class="m-hglass" d="M19.5 35.2 14.4 30.2a3.1 3.1 0 0 1 5.1-3.7 3.1 3.1 0 0 1 5.1 3.7zM32.5 35.2 27.4 30.2a3.1 3.1 0 0 1 5.1-3.7 3.1 3.1 0 0 1 5.1 3.7z"/><path class="m-line" d="M24.6 29.5h2.8"/>' },
  chapeau: { top: '<path class="m-hat" d="M26 1.5 35.5 13.5h-19z"/><path class="m-hat-s" d="M23.2 5.6h5.6M20.4 9.6h11.2"/><circle class="m-gold" cx="26" cy="2.4" r="2.2"/>' },
  couronne: { top: '<path class="m-gold" d="M13.5 14.5V5.5l6.2 4.8L26 2.5l6.3 7.8 6.2-4.8v9z"/><circle class="m-jewel" cx="26" cy="9.5" r="1.6"/><circle class="m-jewel" cx="18" cy="11" r="1.2"/><circle class="m-jewel" cx="34" cy="11" r="1.2"/>' }
};
/* Dessin de Chouquette ; la tenue est passée explicitement. */
function mascotSVG(mood, outfit) {
  const o = OUTFIT_SVG[outfit] || OUTFIT_SVG.noeud;
  const eyes = mood === 'calm'
    ? '<path class="m-line" d="M16.5 31q3 2.6 6 0M29.5 31q3 2.6 6 0"/>'
    : mood === 'wow'
      ? '<circle class="m-eye" cx="19.5" cy="30" r="3"/><circle class="m-eye" cx="32.5" cy="30" r="3"/><circle class="m-shine" cx="20.6" cy="28.8" r="1"/><circle class="m-shine" cx="33.6" cy="28.8" r="1"/>'
      : '<ellipse class="m-eye" cx="19.5" cy="30" rx="2.4" ry="2.9"/><ellipse class="m-eye" cx="32.5" cy="30" rx="2.4" ry="2.9"/><circle class="m-shine" cx="20.4" cy="28.9" r=".9"/><circle class="m-shine" cx="33.4" cy="28.9" r=".9"/>';
  const mouth = mood === 'wow' ? '<ellipse class="m-mouth" cx="26" cy="38" rx="2.6" ry="3.1"/>' : '<path class="m-line" d="M22.6 36.5q3.4 3.6 6.8 0"/>';
  return '<svg class="mascot" viewBox="0 0 52 62" aria-hidden="true">'
    + '<rect class="m-body" x="7" y="15" width="38" height="45" rx="10"/><rect class="m-face" x="7" y="25" width="38" height="20"/>'
    + '<rect class="m-rim" x="9" y="12" width="34" height="6" rx="3"/>' + (o.under || '')
    + eyes + '<ellipse class="m-blush" cx="13.5" cy="36" rx="3.2" ry="2"/><ellipse class="m-blush" cx="38.5" cy="36" rx="3.2" ry="2"/>' + mouth
    + (o.face || '') + (o.top || '') + '</svg>';
}

/* Chamboule-tout : une pyramide de boîtes par série, une boîte par répétition parfaite. */
const CAN_SVG = '<svg viewBox="0 0 20 26" preserveAspectRatio="none"><rect class="can-body" x="1" y="1.5" width="18" height="23" rx="3"/><rect class="can-band" x="1" y="9" width="18" height="8"/><path class="can-heart" d="M10 15.6 7.5 13.2a1.55 1.55 0 0 1 2.5-1.8 1.55 1.55 0 0 1 2.5 1.8z"/><rect class="can-rim" x="2" y="1" width="16" height="2.5" rx="1.2"/></svg>';
