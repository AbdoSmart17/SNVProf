const CACHE_NAME = 'teacher-app-cache-v2'; // تم تحديث الإصدار إلى v2
const urlsToCache = [
    '/index.html',
    '/com.html',
    '/monthly-plan.html',
    '/teacher-tasks.html',
    '/note.html', // تمت الإضافة
    '/style.css',
    '/home.css',
    '/script.js',
    '/data.js',
    '/teacher-tasks-script.js',
    '/tasks.css',
    '/monthly-plan-script.js',
    '/note.js', // تمت الإضافة
    '/note.css', // تمت الإضافة
    '/manifest.json',
    '/icons/icon-512x512.png',
    '/images/hero-image.png',
    '/images/idea.png',
    '/images/note.png',
    '/images/task.png',
    '/images/time.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
