const CACHE_NAME = 'minis-ipa-repo-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';
const MAX_DYNAMIC_CACHE_SIZE = 50;

const STATIC_URLS = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/style.css',
    './assets/js/app.js',
    'https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'
];

// Helper to limit cache size
async function limitCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxSize) {
        await cache.delete(keys[0]);
        await limitCacheSize(cacheName, maxSize);
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_URLS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests for dynamic caching to prevent opaque response issues
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('github.io')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((networkResponse) => {
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    // Only cache valid responses
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                        limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
                    }
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('./offline.html');
            }
        })
    );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
