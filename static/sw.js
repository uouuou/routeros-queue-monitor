/**
 * Service Worker for RouterOS Queue Monitor
 * 提供离线支持和缓存管理
 */

const CACHE_NAME = 'queue-monitor-v2.0.0';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
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

                // 尝试从网络获取
                return fetch(event.request).then(networkResponse => {
                    // 检查是否是有效的响应
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // 为了避免修改原始响应（因为它是流），需要克隆一份
                    const responseToCache = networkResponse.clone();

                    // 只缓存静态资源和HTML，不缓存API请求
                    if (!event.request.url.includes('/api/')) {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return networkResponse;
                }).catch(() => {
                    // 网络请求失败时返回离线页面或默认响应
                    return new Response('网络连接不可用，请检查您的网络连接。', {
                        headers: {'Content-Type': 'text/plain'}
                    });
                });
            })
    );
});
