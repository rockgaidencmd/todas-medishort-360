/* ══════════════════════════════════════════════════════════════
   SERVICE WORKER · Simulador Dräger Evita 4 — MEDISHORT360
   Estrategia: cache-first para los recursos propios (la app debe
   funcionar completa sin conexión) con actualización en segundo
   plano. Todos los recursos son locales: no hay dependencias
   externas, por lo que el simulador es 100 % offline.
══════════════════════════════════════════════════════════════ */

// Sube este número en cada despliegue: fuerza a descartar la caché anterior
const VERSION = '5';
const CACHE = 'evita4-sim-v' + VERSION;

const RECURSOS = [
  './',
  './index.html',
  './style.css?v=5',
  './app.js?v=5',
  './activacion.js?v=5',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(RECURSOS.map(r => c.add(r))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: red primero para recoger actualizaciones, cache como respaldo
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Resto de recursos: cache primero + revalidación en segundo plano
  event.respondWith(
    caches.match(req).then(cacheado => {
      const red = fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(req, copia));
          }
          return res;
        })
        .catch(() => cacheado);
      return cacheado || red;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
