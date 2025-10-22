// Service Worker for caching and offline functionality
const CACHE_NAME = 'unit-decoder-v1';
const API_CACHE_NAME = 'unit-decoder-api-v1';

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/js/unit.js',
    '/js/pending.js',
    '/index.html',
    '/unit.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests with cache-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets with cache-first strategy
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // For other requests, use network-first
    event.respondWith(fetch(request));
});

async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Check if cache is still fresh (5 minutes for search, 1 hour for others)
        const cacheTime = cachedResponse.headers.get('sw-cache-time');
        const isSearchRequest = request.url.includes('/api/search');
        const maxAge = isSearchRequest ? 5 * 60 * 1000 : 60 * 60 * 1000;
        
        if (cacheTime && Date.now() - parseInt(cacheTime) < maxAge) {
            return cachedResponse;
        }
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone response and add cache timestamp
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });
            
            await cache.put(request, cachedResponse);
        }
        
        return networkResponse;
    } catch (error) {
        // Return cached response if network fails
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match('/404.html');
        }
        throw error;
    }
}
