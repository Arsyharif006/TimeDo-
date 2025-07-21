// public/sw.js
// Service worker untuk mendukung timer di latar belakang

// Versi cache
const CACHE_NAME = 'todo-list-harian-v1';

// File yang ingin di-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalasi service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Aktifkan service worker segera
  self.skipWaiting();
});

// Aktivasi service worker
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
  // Mengklaim klien untuk kontrol langsung
  self.clients.claim();
});

// Fetch event - menggunakan cache terlebih dahulu, lalu jaringan
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Kembalikan cache jika ditemukan
        if (response) {
          return response;
        }
        // Jika tidak ada di cache, fetch dari jaringan
        return fetch(event.request);
      })
  );
});

// Message event - untuk komunikasi dengan halaman
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'START_TIMER') {
    // Mulai timer di background
    const { taskId, duration } = event.data;
    console.log(`SW: Starting background timer for task ${taskId}, duration: ${duration}s`);
    
    // Timer dalam service worker untuk tetap berjalan meskipun halaman tertutup
    const startTime = Date.now();
    const timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Kirim update ke semua klien yang terbuka
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_UPDATE',
            taskId,
            elapsed,
            remaining: Math.max(0, duration - elapsed)
          });
        });
        
        // Jika timer habis, bersihkan interval
        if (duration - elapsed <= 0) {
          clearInterval(timerId);
          
          // Beritahu klien bahwa timer selesai
          clients.forEach(client => {
            client.postMessage({
              type: 'TIMER_COMPLETED',
              taskId
            });
          });
        }
      });
    }, 1000);
    
    // Simpan ID timer untuk bisa dihentikan nanti
    self.__timers = self.__timers || {};
    self.__timers[taskId] = timerId;
    
  } else if (event.data && event.data.type === 'PAUSE_TIMER') {
    // Hentikan timer di background
    const { taskId } = event.data;
    console.log(`SW: Pausing background timer for task ${taskId}`);
    
    // Bersihkan interval
    if (self.__timers && self.__timers[taskId]) {
      clearInterval(self.__timers[taskId]);
      delete self.__timers[taskId];
    }
  }
});

// Perhatikan ketika device menjadi online/offline
self.addEventListener('online', () => {
  console.log('SW: Device is now online');
});

self.addEventListener('offline', () => {
  console.log('SW: Device is now offline');
});