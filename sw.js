const CACHE_NAME = 'document-deadline-manager-v1';
const BASE = '/document-deadline-manager/';
const STATIC = [BASE, BASE+'index.html', BASE+'manifest.json', BASE+'icons/icon-192x192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => {
    if (!r || r.status !== 200) return r;
    const cl = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(e.request, cl)); return r;
  }).catch(() => caches.match(BASE+'index.html'))));
});
