/**
 * InflaTrack Service Worker
 * Place this file in the same directory as infltrack.html
 * It enables full offline functionality and "Add to Home Screen" PWA installation.
 */

const CACHE = 'infltrack-v2';
const PRECACHE = [
  './',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
];

// Install: pre-cache the app shell and Chart.js
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(err => console.warn('[SW] Pre-cache partial failure:', err)))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// Fetch: cache-first with network fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Skip non-http requests (chrome-extension, etc.)
  if (!url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached); // Network failed, return cached

      // Cache-first: return cached immediately, update in background
      return cached || networkFetch;
    })
  );
});
