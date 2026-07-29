const CACHE_NAME = 'rightmindmath_en_us_v02';

const PRECACHE_ASSETS = [
    // localized assets
    './rightmindmath_en_us.html',
    './css/RMM_styles_en_us.css',
    './js_cfg/RMM_CFG_en_us.js',
    // common assets (not localized)
    './js_src/RMM_SymsNums.js',
    './js_src/RMM_ASM.js',
    './js_src/RMM_DB.js',
    './js_src/RMM_M2.js',
    './js_src/RMM_D3.js',
    './js_src/RMM_STATS.js',
    './js_src/RMM_STATSLIVE.js',
    './js_src/RMM_SYNC.js',
    './js_src/RMM_MENU.js'
];

// Install Event: Pre-cache static assets & activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

// Activate Event: Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Handle asset retrieval and dynamic caching
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Bypass caching for non-GET requests and specific external endpoints
    if (request.method !== 'GET' || request.url.includes('script.google')) {
        return;
    }

    // 2. Cache-First strategy with dynamic fallback
    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const response = await fetch(request);

                // 3. Verify valid response before caching
                if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, response.clone());
                }

                return response;
            } catch (error) {
                console.error('[ServiceWorker] Fetch failed:', request.url, error);
                throw error;
            }
        })()
    );
});
