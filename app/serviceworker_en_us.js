const cache_name = 'rightmindmath_en_us_v02';
const assets = [
    // localized assets
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

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cache_name);
    await cache.addAll(assets);
  })());
});


self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cache_name);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(assets);
  })());
});


self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }
    const response = await fetch(e.request);
    const cache = await caches.open(cache_name);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});


self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key === cache_name) { return; }
      return caches.delete(key);
    }))
  }));
});
