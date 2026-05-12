const CACHE_NAME = 'essence-admin-v1';
const ASSETS = [
    '/admin.html',
    '/assets/css/admin.css',
    '/assets/js/admin.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests, network-first strategy for admin panel
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
    
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
