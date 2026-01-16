const VERSION = '3.1.0'; // Bumped version for refactor
const CACHE_NAME = `minis-ipa-repo-v${VERSION}`;
const STATIC_URLS = [
    './',
    './index.html',
    './sidestore.json', // Updated from apps.json
    './assets/css/style.css',
    './assets/js/app.js',
    './manifest.json',
    'https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Strategy 1: Network-First for Data (sidestore.json)
    // Ensures users always get the latest list, falling back to cache only if offline.
    if (event.request.url.includes('sidestore.json')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Strategy 2: Cache-First for Static Assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
