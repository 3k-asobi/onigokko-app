const CACHE_NAME = 'onigokko-v2'; // 👈 バージョンを v2 に変更して古いキャッシュをリセット
const urlsToCache = [
  './',
  './index.html',
  './game.html',
  './style.css',
  './app.js',
  './game-common.js',
  './game-normal.js',
  './site.webmanifest',
  './title-logo.png',
  './apple-touch-icon.png'
];

// インストール時にキャッシュを保存
self.addEventListener('install', (event) => {
  // 古いキャッシュを即座に上書きできるようにスキップ処理を追加
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 新しい Service Worker が有効化されたら古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// リクエスト時にキャッシュがあればそこから返す（オフライン対応）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});