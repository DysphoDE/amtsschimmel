/* Amtsschimmel – Service Worker: online immer frisch (Netz zuerst, mit Zeitlimit), offline aus dem Zwischenspeicher. */
const VERSION = 'amtsschimmel-50cef5bbca';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/util.js', 'js/data.js', 'js/systems.js', 'js/content.js', 'js/achievements.js',
  'js/core.js', 'js/icons.js', 'js/audio.js', 'js/desk.js', 'js/ui.js', 'js/main.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await Promise.race([fetch(req, { cache: 'no-cache' }), timeout(4000)]);
      if (res && res.ok) { const c = await caches.open(VERSION); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await caches.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
