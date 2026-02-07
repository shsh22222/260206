const CACHE_NAME = 'selflove-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/animations.css',
  './js/data.js',
  './js/storage.js',
  './js/app.js',
  './js/affirmation.js',
  './js/journal.js',
  './js/challenge.js',
  './js/mirror.js',
  './js/stats.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
