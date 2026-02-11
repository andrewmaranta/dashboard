const CACHE_NAME = 'liferpg-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Alegreya+Sans:wght@300;400;700&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  // Try network first, then cache (Network-First Strategy for fresh data)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful network responses
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
             // Only cache GET requests
             if(e.request.method === 'GET') cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
