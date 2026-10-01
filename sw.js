/* Amtsschimmel – Service Worker.
   Alle Dateien werden pro Version gemeinsam zwischengespeichert und aus diesem Stand ausgeliefert,
   damit nie alte und neue Skripte gemischt werden. Eine neue Version (tools/build.mjs setzt VERSION)
   lädt im Hintergrund komplett und gilt ab dem nächsten Seitenaufruf. */
const VERSION = 'amtsschimmel-032fe39066';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/util.js', 'js/data.js', 'js/systems.js', 'js/content.js', 'js/achievements.js',
  'js/core.js', 'js/icons.js', 'js/audio.js', 'js/desk.js', 'js/ui.js', 'js/main.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await c.match('index.html'); if (idx) return idx; }
      return Response.error();
    }
  })());
});
