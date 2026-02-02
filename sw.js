const CACHE_NAME = 'lfg-tasks-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tasks.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for tasks.json to get latest data
  if (e.request.url.includes('tasks.json')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache-first for other assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
