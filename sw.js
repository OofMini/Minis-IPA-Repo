const VERSION = '3.0.1';
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

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${VERSION}...`);
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS))
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log(`[SW] Deleting old cache: ${key}`);
                    return caches.delete(key);
                }
            })
        ))
    );
    self.clients.claim();
});

// Fetch Event: Strategy Router
self.addEventListener('fetch', (event) => {
    // Strategy 1: Stale-While-Revalidate for Data (apps.json)
    if (event.request.url.includes('apps.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
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

// Listen for skipWaiting messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});