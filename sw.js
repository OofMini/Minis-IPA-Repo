const VERSION = '3.0.4'; // Bumped version to force update
const CACHE_NAME = `minis-ipa-repo-v${VERSION}`;
const STATIC_URLS = [
    './',
    './index.html',
    './apps.json',
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
    if (event.request.url.includes('apps.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // SECURITY FIX: Only cache successful responses (Status 200)
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // NETWORK FAILURE FIX: Return cached data if offline
                    return cachedResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

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