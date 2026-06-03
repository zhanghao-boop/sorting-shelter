// ============================================================
// Sorting Shelter Pro — Service Worker
// Stale-while-revalidate for static assets, network-first for HTML
// Handles cache-busting ?v=N query params via ignoreSearch
// ============================================================

const CACHE_NAME = 'shelter-pro-v3';

// Base paths to pre-cache (without version queries)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/game.js',
  '/js/i18n.js',
  '/js/icons.js',
  '/js/ads.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Helper: normalize URL by stripping query params & hash for cache key
function normalizeUrl(url) {
  return url.origin + url.pathname;
}

// Install: pre-cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (fonts, APIs, analytics)
  if (url.origin !== location.origin) return;

  // Navigation requests (HTML): network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Static assets: cache-first with stale-while-revalidate, ignoring query params
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          // Store with normalized URL so future requests (with different v=) still match
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });

      if (cached) {
        // Stale-while-revalidate: serve cached, fetch new version in background
        fetched.catch(() => {});
        return cached;
      }

      return fetched;
    })
  );
});
