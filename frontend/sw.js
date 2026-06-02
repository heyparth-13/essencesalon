const CACHE_NAME = 'essence-admin-v1';
const ASSETS = [
    '/admin.html',
    '/attendance.html',
    '/assets/css/admin.css',
    '/assets/css/attendance.css',
    '/assets/js/admin.js',
    '/assets/js/attendance.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
    
    event.respondWith(
        fetch(event.request).catch(async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) return cachedResponse;
            return fetch(event.request);
        })
    );
});
