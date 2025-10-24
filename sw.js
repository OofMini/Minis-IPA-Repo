// sw.js - Service Worker
const CACHE_NAME = 'minis-ipa-repo-v1';
const urlsToCache = [
    '/Minis-IPA-Repo/',
    '/Minis-IPA-Repo/index.html',
    '/Minis-IPA-Repo/apps/repo-icon.png',
    '/Minis-IPA-Repo/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            }
        )
    );
});