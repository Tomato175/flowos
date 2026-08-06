// 心流OS Service Worker — PWA 离线支持
const CACHE_NAME = 'flowos-v1.0.0';
const URLS_TO_CACHE = [
  '/flowos/',
  '/flowos/today',
  '/flowos/notes',
  '/flowos/focus',
  '/flowos/tasks',
  '/flowos/goals',
  '/flowos/habits',
  '/flowos/photos',
  '/flowos/music',
  '/flowos/settings',
  '/flowos/manifest.webmanifest',
  '/flowos/icon-192.png',
  '/flowos/icon-512.png',
];

// 安装：缓存关键页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// 拦截请求：网络优先，回退到缓存
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/flowos/')))
  );
});