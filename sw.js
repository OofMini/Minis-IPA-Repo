const VERSION = '3.2.0'; // Professional Edition
const CACHE_NAME = `minis-ipa-repo-v${VERSION}`;
const STATIC_URLS = [
    './',
    './index.html',
    './sidestore.json',
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
        )).then(() => {
            // Professional UX: Notify client instead of forcing logic
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED', version: VERSION });
                });
            });
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Strategy 1: Network-First for Data
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
                .catch(() => caches.match(event.request))
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
