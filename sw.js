// sw.js - Enhanced Service Worker
const CACHE_NAME = 'minis-ipa-repo-v2';
const OFFLINE_URL = '/Minis-IPA-Repo/offline.html';
const CACHE_URLS = [
  '/Minis-IPA-Repo/',
  '/Minis-IPA-Repo/index.html',
  '/Minis-IPA-Repo/apps/repo-icon.png',
  '/Minis-IPA-Repo/manifest.json',
  '/Minis-IPA-Repo/feather.json',
  '/Minis-IPA-Repo/sidestore.json',
  '/Minis-IPA-Repo/trollapps.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with network-first strategy for manifests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first for JSON manifests
  if (url.pathname.includes('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for other resources
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
        })
        .catch(() => {
          // If offline and page request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
  }
});