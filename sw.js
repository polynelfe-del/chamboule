// Généré par build-phone-app.js
const CACHE = 'chamboule-3738db1aad';
const SHELL = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon.png","./fonts/fredoka.woff2","./fonts/pacifico.woff2","./fonts/nunito.woff2","./fonts/nunito-italic.woff2"];

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
