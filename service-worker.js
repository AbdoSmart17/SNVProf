// service-worker.js - الإصدار المصحح v4
const CACHE_NAME = 'teacher-app-cache-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/com.html',
    '/monthly-plan.html',
    '/teacher-tasks.html',
    '/note.html',
    '/style.css',
    '/home.css',
    '/tasks.css',
    '/note.css',
    '/script.js',
    '/data.js',
    '/teacher-tasks-script.js',
    '/monthly-plan-script.js',
    '/note.js',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml'
];

// الموارد الخارجية التي نريد تخزينها
const externalResources = [
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
    console.log('🔄 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Service Worker: Cache opened');
                // تخزين الملفات الأساسية أولاً
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('✅ Service Worker: All core files cached');
                        // محاولة تخزين الموارد الخارجية (لا توقف التثبيت إذا فشلت)
                        return Promise.allSettled(
                            externalResources.map(url => 
                                fetch(url).then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }).catch(error => {
                                    console.warn(`⚠️ Service Worker: Failed to cache external resource ${url}:`, error);
                                    return Promise.resolve(); // لا ترفض التثبيت بسبب فشل مورد خارجي
                                })
                            )
                        );
                    })
                    .catch(error => {
                        console.error('❌ Service Worker: Cache addAll failed:', error);
                        // حتى إذا فشل تخزين بعض الملفات، نكمل التثبيت
                        return Promise.resolve();
                    });
            })
            .then(() => {
                console.log('✅ Service Worker: Installation completed');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activation completed');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    // تجاهل طلبات غير GET
    if (event.request.method !== 'GET') {
        return;
    }

    // تجاهل طلبات Chrome extensions
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // استراتيجية التخزين: Network First مع fallback إلى Cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // إذا كانت الاستجابة ناجحة، قم بتحديث الكاش
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // إذا فشل fetch، ابحث في الكاش
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            console.log('📦 Service Worker: Serving from cache:', event.request.url);
                            return cachedResponse;
                        }
                        
                        // إذا لم يتم العثور على الصفحة في الكاش، ارجع إلى index.html لتطبيقات SPA
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // للموارد الأخرى، ارجع رسالة خطأ مناسبة
                        return new Response('Resource not available offline', {
                            status: 408,
                            statusText: 'Offline'
                        });
                    });
            })
    );
});

// استمع لرسائل من الصفحة
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// معالجة الأخطاء العالمية في Service Worker
self.addEventListener('error', event => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
});
