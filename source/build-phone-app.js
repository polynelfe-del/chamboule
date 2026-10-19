// Construit l'appli installable sur téléphone (PWA) à partir de build/chamboule-coach.html.
// Appelé par source/build.js, qui lance d'abord les tests et assemble la page.
// Les fichiers publiés (index.html, sw.js, icônes...) sont écrits à la racine du dépôt.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const fonts = require('./fonts.js');

const SRC = path.join(__dirname, '..', 'build', 'chamboule-coach.html');
const OUT = path.resolve(__dirname, '..');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- Page ---------- */
const src = fs.readFileSync(SRC, 'utf8');
const cut = src.indexOf('<div id="app"');
if (cut < 0) throw new Error('chamboule-coach.html : <div id="app"> introuvable');
const headPart = src.slice(0, cut).replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '')
  .replace(/<style id="fonts">[\s\S]*?<\/style>/, () => '<style id="fonts">\n' + fonts.css('files') + '\n</style>');
if (!headPart.includes('url(fonts/')) throw new Error('chamboule-coach.html : bloc des polices introuvable');
const bodyPart = src.slice(cut);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Ton coach sportif en mode jeu : dos, fessiers, cardio.">
<meta name="theme-color" content="#FFF1F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#2A0F28" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Chamboule">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" href="fonts/nunito.woff2" as="font" type="font/woff2" crossorigin>
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,-apple-system,sans-serif;overscroll-behavior-y:none}
img{max-width:100%}
[hidden]{display:none!important}
</style>
${headPart.trim()}
</head>
<body>
${bodyPart.trim()}
<script>
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);

/* ---------- Icônes (dessinées ici, sans dépendance) ---------- */
// Fond framboise, auvent blanc, cible jaune beurre, boîtes lilas.
const C = { blue: [0xc9, 0x3b, 0x7b], white: [255, 255, 255], yellow: [0xff, 0xd2, 0x5e], deep: [0xd9, 0xa2, 0x1e], pink: [0x84, 0x55, 0xe8], light: [0xff, 0xf1, 0xf7] };
const inRoundRect = (x, y, x0, y0, w, h, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r), cy = Math.min(Math.max(y, y0 + r), y0 + h - r);
  return x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h && (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
function colorAt(x, y, opts) {
  // x, y entre 0 et 1. Fond bleu, auvent rayé en haut, cible jaune, pyramide de 3 boîtes.
  let col = C.blue;
  if (opts.awning) {
    const sw = 1 / 6, k = Math.floor(x / sw), stripe = k % 2 === 0 ? C.white : C.blue;
    if (y < 0.15) col = stripe;
    const cx = (k + 0.5) * sw;
    if (y >= 0.15 && (x - cx) ** 2 + (y - 0.15) ** 2 <= (sw / 2) ** 2) col = stripe;
  }
  const s = opts.scale, cy = opts.cy, d2 = (x - 0.5) ** 2 + (y - cy) ** 2;
  if (d2 <= (0.31 * s) ** 2) col = C.yellow;
  if (d2 <= (0.255 * s) ** 2) col = C.white;
  const cw = 0.095 * s, ch = 0.12 * s, r = 0.02 * s;
  const cans = [[0.5 - cw - 0.006 * s, cy + 0.005 * s], [0.5 + 0.006 * s, cy + 0.005 * s], [0.5 - cw / 2, cy - ch + 0.003 * s]];
  for (const [x0, y0] of cans) {
    if (inRoundRect(x, y, x0, y0, cw, ch, r)) {
      col = C.pink;
      if (y > y0 + ch * 0.32 && y < y0 + ch * 0.66) col = C.white;
      if (y < y0 + ch * 0.12) col = C.yellow;
    }
  }
  const py = cy + 0.005 * s + ch + 0.012 * s;
  if (inRoundRect(x, y, 0.5 - 0.16 * s, py, 0.32 * s, 0.025 * s, 0.01 * s)) col = C.deep;
  return col;
}
function render(size, opts) {
  const N = 4, px = Buffer.alloc(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let r = 0, g = 0, b = 0;
    for (let sj = 0; sj < N; sj++) for (let si = 0; si < N; si++) {
      const c = colorAt((i + (si + 0.5) / N) / size, (j + (sj + 0.5) / N) / size, opts);
      r += c[0]; g += c[1]; b += c[2];
    }
    const o = (j * size + i) * 4;
    px[o] = Math.round(r / (N * N)); px[o + 1] = Math.round(g / (N * N)); px[o + 2] = Math.round(b / (N * N)); px[o + 3] = 255;
  }
  return png(size, size, px);
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const full = { awning: true, scale: 1, cy: 0.6 };
const safe = { awning: false, scale: 0.82, cy: 0.52 };
fs.writeFileSync(path.join(OUT, 'icon-192.png'), render(192, full));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), render(512, full));
fs.writeFileSync(path.join(OUT, 'icon-512-maskable.png'), render(512, safe));
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), render(180, full));

/* ---------- Manifeste ---------- */
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Chamboule Coach',
  short_name: 'Chamboule',
  description: 'Ton coach sportif en mode jeu : dos, fessiers, cardio.',
  lang: 'fr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#FFF1F7',
  theme_color: '#FFF1F7',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

/* ---------- Service worker : fonctionne hors ligne, se met à jour tout seul ---------- */
// Le numéro de version change dès qu'un fichier publié ou ce script change : l'appli du téléphone se met à jour.
const hash = crypto.createHash('sha1').update(html);
for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png']) hash.update(fs.readFileSync(path.join(OUT, f)));
for (const f of fonts.FACES) hash.update(fs.readFileSync(path.join(fonts.DIR, f.file)));
hash.update(fs.readFileSync(__filename));
const version = hash.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sw.js'), `// Généré par build-phone-app.js
const CACHE = 'chamboule-${version}';
const SHELL = ${JSON.stringify(['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png'].concat(fonts.FACES.map(f => './fonts/' + f.file)))};

// cache: 'reload' : on prend toujours la version fraîche sur GitHub, jamais une copie gardée par le navigateur.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      // À chaque ouverture avec du réseau, on revérifie la page auprès de GitHub (no-cache).
      e.respondWith(fetch(req.url, { cache: 'no-cache' })
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
`);

console.log('Appli construite dans', OUT, '(version ' + version + ')');
for (const f of fs.readdirSync(OUT)) { const st = fs.statSync(path.join(OUT, f)); if (st.isFile()) console.log('  ' + f.padEnd(24) + st.size + ' octets'); }
