const CACHE = 'relearning-physics-v5';
const CDN = [
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];
const SHELL = ['./','./index.html','./app.js','./styles.css','./manifest.json','./logo.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled([...SHELL, ...CDN].map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  if (sameOrigin) {
    e.respondWith(fetch(e.request).then(r => { const cl=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cl)); return r; }).catch(()=>caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => { const cl=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cl)); return r; })));
  }
});
