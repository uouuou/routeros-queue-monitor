/**
 * Service Worker for RouterOS Queue Monitor
 * 提供离线支持和缓存管理
 */

const CACHE_NAME = 'queue-monitor-v2.0.0';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安装事件
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: 缓存文件');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活事件
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: 删除旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有响应，返回缓存的版本
                if (response) {
                    return response;
                }

                // 否则发起网络请求
                return fetch(event.request);
            })
    );
});
