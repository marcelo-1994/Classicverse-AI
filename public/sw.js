self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch for PWA installability criteria
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline mode not fully supported yet.'))
  );
});
