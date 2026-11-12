// Généré par build-phone-app.js
const CACHE = 'chamboule-9bd9ead35c';
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

const ROUTINE_MESSAGES = {
  morning: 'Ta routine du matin t’attend.',
  evening: 'Ta routine du soir t’attend.',
  test: 'Ta notification de test est bien arrivée.'
};
self.addEventListener('message', event => {
  if (event.data === 'chamboule-push-capability') event.ports[0]?.postMessage('chamboule-push-v2');
});
self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  const { slot, date } = payload || {};
  if (typeof slot !== 'string' || !Object.hasOwn(ROUTINE_MESSAGES, slot)) return;
  // Separate each day's reminder while grouping repeated deliveries of the same occurrence.
  const day = typeof date === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)
    ? date : new Date().toISOString().slice(0, 10);
  event.waitUntil(self.registration.showNotification('Chamboule', {
    body: ROUTINE_MESSAGES[slot],
    icon: new URL('icon-192.png', self.registration.scope).href,
    tag: 'chamboule-routine-' + slot + (slot === 'test' ? '' : '-' + day),
    data: { route: 'dos-calme' }
  }));
});
self.addEventListener('notificationclick', event => {
  if (event.notification.data?.route !== 'dos-calme') return;
  event.notification.close();
  event.waitUntil((async () => {
    const destination = new URL(self.registration.scope);
    destination.searchParams.set('ouvrir', 'dos-calme');
    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) {
      const url = new URL(client.url);
      if (url.origin !== destination.origin ||
          (url.pathname !== destination.pathname && url.pathname !== destination.pathname + 'index.html')) continue;
      const focused = await client.focus().catch(() => null);
      if (!focused) continue;
      focused.postMessage({ type: 'chamboule-open-routine' });
      return;
    }
    await self.clients.openWindow(destination.href);
  })());
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
