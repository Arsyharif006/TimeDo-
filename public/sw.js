// public/sw.js
// Service Worker untuk handle notifikasi di mobile

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(clients.claim());
  });
  
  // Handle notifikasi click
  self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.tag);
    event.notification.close();
  
    // Focus ke window aplikasi atau buka window baru
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                client = clientList[i];
              }
            }
            return client.focus();
          }
          return clients.openWindow('/');
        })
    );
  });
  
  // Handle push events (untuk future implementation)
  self.addEventListener('push', (event) => {
    console.log('Push received:', event);
    
    let title = 'To-Do List Notification';
    let options = {
      body: 'You have a new notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
  
    if (event.data) {
      const data = event.data.json();
      title = data.title || title;
      options = { ...options, ...data.options };
    }
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  // Periodic sync untuk timer updates (jika browser support)
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-timers') {
      event.waitUntil(updateTimerNotifications());
    }
  });
  
  // Function untuk update timer notifications
  async function updateTimerNotifications() {
    // Implementasi untuk update timer notifications
    // Bisa fetch data dari IndexedDB atau communicate dengan main thread
    console.log('Updating timer notifications...');
  }