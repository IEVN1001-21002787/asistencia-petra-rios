/* Guarda la app en el celular para que abra sin internet. Cambia VERSION al publicar cambios. */
const VERSION = 'asistencia-v2.7.0';
const ARCHIVOS = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Archivos propios: responde con la copia guardada y la actualiza en segundo plano. La API no pasa por aquí. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then((cache) => cache.match(req, { ignoreSearch: true }).then((guardada) => {
    const red = fetch(req).then((resp) => {
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    }).catch(() => guardada || cache.match('./index.html'));
    return guardada || red;
  })));
});
