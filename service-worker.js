// service-worker.js - الإصدار المحسن
const CACHE_NAME = 'teacher-app-cache-v3';
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
  '/icons/icon-512.png',
  '/icons/icon-192.png',
  '/images/hero-image.png',
  '/images/idea.png',
  '/images/note.png',
  '/images/task.png',
  '/images/time.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.log('Cache addAll error:', error);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // معالجة طلبات التنقل (الصفحات)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // معالجة الطلبات الأخرى
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // التحقق من أن الاستجابة صالحة
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // استجابة صالحة، نضيفها للكاش
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      }).catch(() => {
        // في حالة الفشل، نعود للصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
