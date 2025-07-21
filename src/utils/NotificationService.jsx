// src/utils/NotificationService.js

// Memastikan browser mendukung notifikasi
const checkNotificationSupport = () => {
  return 'Notification' in window;
};

// Helper untuk format waktu
const formatTimeForNotification = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  } else if (minutes > 0) {
    return `${minutes} menit ${remainingSeconds} detik`;
  } else {
    return `${remainingSeconds} detik`;
  }
};

const NotificationService = {
  // Cek apakah notifikasi didukung browser
  isSupported: checkNotificationSupport(),

  // State untuk tracking timer notifications
  activeTimerNotifications: new Map(),

  // Minta izin notifikasi
  requestPermission: function () {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        console.log("Browser tidak mendukung notifikasi desktop");
        reject(new Error("Browser tidak mendukung notifikasi"));
        return;
      }

      // Jika sudah diizinkan, langsung return granted
      if (Notification.permission === 'granted') {
        resolve('granted');
        return;
      }

      // Jika belum ditolak, minta izin
      if (Notification.permission !== 'denied') {
        Notification.requestPermission()
          .then(permission => {
            resolve(permission);
          })
          .catch(error => {
            console.error("Error requesting notification permission:", error);
            reject(error);
          });
      } else {
        resolve(Notification.permission);
      }
    });
  },

  sendNotification: function (title, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error("Notifikasi tidak didukung"));
        return;
      }

      if (Notification.permission === 'granted') {
        try {
          // Default options untuk mobile compatibility
          const defaultOptions = {
            icon: `${import.meta.env.BASE_URL}favicon.png`,
            badge: `${import.meta.env.BASE_URL}favicon.png`, // Badge untuk mobile
            dir: 'ltr', // Direction text
            lang: 'id-ID', // Bahasa Indonesia
            requireInteraction: false,
            silent: false,
            ...options
          };

          // PERBAIKAN: Jika ada renotify, pastikan ada tag
          if (defaultOptions.renotify && !defaultOptions.tag) {
            defaultOptions.tag = `notification-${Date.now()}`;
          }

          // PERBAIKAN: Hapus vibrate jika silent: true
          if (defaultOptions.silent && defaultOptions.vibrate) {
            delete defaultOptions.vibrate;
          }

          // PERBAIKAN: Untuk mobile, gunakan Service Worker jika tersedia
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Kirim notifikasi via Service Worker untuk better mobile support
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, defaultOptions)
                .then(() => resolve())
                .catch(error => {
                  console.error("Service Worker notification error:", error);
                  // Fallback ke Notification API biasa
                  const notification = new Notification(title, defaultOptions);
                  this.setupNotificationHandlers(notification, options);
                  resolve(notification);
                });
            });
          } else {
            // Gunakan Notification API biasa
            const notification = new Notification(title, defaultOptions);
            this.setupNotificationHandlers(notification, options);
            
            // Auto close jika tidak persistent
            if (!options.persistent) {
              setTimeout(() => {
                notification.close();
              }, options.duration || 10000);
            }
            
            resolve(notification);
          }
        } catch (error) {
          console.error("Error creating notification:", error);
          reject(error);
        }
      } else {
        reject(new Error("Izin notifikasi tidak diberikan"));
      }
    });
  },

  // Setup notification event handlers
  setupNotificationHandlers: function(notification, options) {
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    notification.onclose = () => {
      if (options.onClose) options.onClose();
    };

    notification.onerror = (error) => {
      console.error("Notification error:", error);
      if (options.onError) options.onError(error);
    };
  },

  // Timer notification dengan update berkala
  startTimerNotification: function (taskId, taskTitle, timeRemaining) {
    // Hentikan notifikasi timer yang sudah ada untuk task ini
    this.stopTimerNotification(taskId);

    // Buat notifikasi awal
    const tag = `timer-${taskId}`;
    let lastNotificationTime = Date.now();
    
    const updateNotification = () => {
      const timeString = formatTimeForNotification(timeRemaining);
      const now = Date.now();
      
      // Untuk mobile, jangan update terlalu sering
      if (now - lastNotificationTime < 5000) return; // Minimal 5 detik antar update
      
      lastNotificationTime = now;

      this.sendNotification(
        `⏱️ ${taskTitle}`,
        {
          body: `Sisa waktu: ${timeString}`,
          tag: tag,
          renotify: false, // Jangan bunyi ulang
          persistent: true,
          requireInteraction: false,
          silent: true, // Update tanpa suara
          data: {
            taskId,
            timeRemaining
          }
        }
      ).then(notification => {
        // Store reference jika notification object dikembalikan
        if (notification && notification.close) {
          this.activeTimerNotifications.set(taskId, {
            notification,
            intervalId: null
          });
        }
      }).catch(error => {
        console.error("Error creating timer notification:", error);
      });
    };

    // Update notifikasi pertama kali
    updateNotification();

    // Update setiap 30 detik
    const intervalId = setInterval(() => {
      timeRemaining -= 30;
      if (timeRemaining > 0) {
        updateNotification();
      } else {
        this.stopTimerNotification(taskId);
        this.timerComplete(taskTitle);
      }
    }, 30000);

    // Store interval ID
    const timerData = this.activeTimerNotifications.get(taskId) || {};
    timerData.intervalId = intervalId;
    this.activeTimerNotifications.set(taskId, timerData);
  },

  // Stop timer notification
  stopTimerNotification: function (taskId) {
    const timerData = this.activeTimerNotifications.get(taskId);
    if (timerData) {
      if (timerData.notification && timerData.notification.close) {
        timerData.notification.close();
      }
      if (timerData.intervalId) {
        clearInterval(timerData.intervalId);
      }
      this.activeTimerNotifications.delete(taskId);
    }
  },

  // Update timer notification
  updateTimerNotification: function (taskId, taskTitle, timeRemaining) {
    const tag = `timer-${taskId}`;
    const timeString = formatTimeForNotification(timeRemaining);

    return this.sendNotification(
      `⏱️ ${taskTitle}`,
      {
        body: `Sisa waktu: ${timeString}`,
        tag: tag,
        renotify: false,
        silent: true,
        requireInteraction: false,
        data: {
          taskId,
          timeRemaining
        }
      }
    );
  },

  // Helper functions untuk jenis notifikasi umum
  timerComplete: function (taskTitle) {
    return this.sendNotification(
      '⏰ Timer Selesai!',
      {
        body: `Tugas "${taskTitle}" telah selesai.`,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        tag: 'timer-complete',
        renotify: true,
        silent: false // Bunyi untuk timer complete
      }
    );
  },

  timerStarted: function (taskTitle, duration) {
    return this.sendNotification(
      '▶️ Timer Dimulai',
      {
        body: `Timer untuk "${taskTitle}" (${duration} menit) telah dimulai.`,
        tag: 'timer-started',
        vibrate: [200, 100, 200],
        requireInteraction: false
      }
    );
  },

  timerPaused: function (taskTitle, timeRemaining) {
    const timeString = formatTimeForNotification(timeRemaining);
    return this.sendNotification(
      '⏸️ Timer Dijeda',
      {
        body: `"${taskTitle}" dijeda. Sisa waktu: ${timeString}`,
        tag: 'timer-paused',
        vibrate: [200],
        requireInteraction: false
      }
    );
  },

  taskAdded: function (taskTitle, day) {
    return this.sendNotification(
      '✅ Tugas Ditambahkan',
      {
        body: `"${taskTitle}" untuk hari ${day} telah ditambahkan.`,
        tag: 'task-added',
        requireInteraction: false
      }
    );
  },

  taskCompleted: function (taskTitle) {
    return this.sendNotification(
      '🎉 Tugas Selesai!',
      {
        body: `Tugas "${taskTitle}" telah selesai. Selamat!`,
        vibrate: [200, 100, 200],
        tag: 'task-completed',
        requireInteraction: false
      }
    );
  },

  // Test notification untuk settings
  testNotification: function () {
    return this.sendNotification(
      '🔔 Test Notifikasi',
      {
        body: 'Notifikasi berhasil diaktifkan! Anda akan menerima pemberitahuan untuk timer dan tugas.',
        vibrate: [200, 100, 200],
        tag: 'test-notification', // PERBAIKAN: Tambahkan tag
        requireInteraction: false
      }
    );
  }
};

// Export service
export default NotificationService;