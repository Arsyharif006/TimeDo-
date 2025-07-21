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
          // Default options
          const defaultOptions = {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200], // Vibrasi default (boleh dihapus kalau tidak perlu)
            renotify: true,
            requireInteraction: false,
            silent: false,
            ...options
          };

          // 🔧 PERBAIKAN: Hapus vibrate jika silent: true
          if (defaultOptions.silent && 'vibrate' in defaultOptions) {
            delete defaultOptions.vibrate;
          }

          // Buat notifikasi
          const notification = new Notification(title, defaultOptions);

          // Event handlers
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

          // Auto close after duration
          if (!options.persistent) {
            setTimeout(() => {
              notification.close();
            }, options.duration || 10000);
          }

          resolve(notification);
        } catch (error) {
          console.error("Error creating notification:", error);
          reject(error);
        }
      } else {
        reject(new Error("Izin notifikasi tidak diberikan"));
      }
    });
  },


  // Timer notification dengan update berkala
  startTimerNotification: function (taskId, taskTitle, timeRemaining) {
    // Hentikan notifikasi timer yang sudah ada untuk task ini
    this.stopTimerNotification(taskId);

    // Buat notifikasi awal
    const tag = `timer-${taskId}`;
    const updateNotification = () => {
      const timeString = formatTimeForNotification(timeRemaining);

      this.sendNotification(
        `⏱️ ${taskTitle}`,
        {
          body: `Sisa waktu: ${timeString}`,
          tag: tag, // Tag yang sama akan update notifikasi yang ada
          renotify: false, // Jangan bunyi ulang saat update
          persistent: true,
          requireInteraction: false,
          vibrate: false, // Tidak vibrasi untuk update
          silent: true, // Update tanpa suara
          data: {
            taskId,
            timeRemaining
          }
        }
      ).then(notification => {
        // Store reference
        this.activeTimerNotifications.set(taskId, {
          notification,
          intervalId: null
        });
      }).catch(error => {
        console.error("Error creating timer notification:", error);
      });
    };

    // Update notifikasi pertama kali
    updateNotification();

    // Update setiap 30 detik untuk mobile (hemat battery)
    const intervalId = setInterval(() => {
      timeRemaining -= 30;
      if (timeRemaining > 0) {
        updateNotification();
      } else {
        this.stopTimerNotification(taskId);
        this.timerComplete(taskTitle);
      }
    }, 30000); // Update setiap 30 detik

    // Store interval ID
    const timerData = this.activeTimerNotifications.get(taskId);
    if (timerData) {
      timerData.intervalId = intervalId;
    }
  },

  // Stop timer notification
  stopTimerNotification: function (taskId) {
    const timerData = this.activeTimerNotifications.get(taskId);
    if (timerData) {
      if (timerData.notification) {
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
        vibrate: false,
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
        vibrate: [500, 200, 500, 200, 500], // Pattern vibrasi kuat
        tag: 'timer-complete',
        renotify: true
      }
    );
  },

  timerStarted: function (taskTitle, duration) {
    return this.sendNotification(
      '▶️ Timer Dimulai',
      {
        body: `Timer untuk "${taskTitle}" (${duration} menit) telah dimulai.`,
        tag: 'timer-started'
      }
    );
  },

  timerPaused: function (taskTitle, timeRemaining) {
    const timeString = formatTimeForNotification(timeRemaining);
    return this.sendNotification(
      '⏸️ Timer Dijeda',
      {
        body: `"${taskTitle}" dijeda. Sisa waktu: ${timeString}`,
        tag: 'timer-paused'
      }
    );
  },

  taskAdded: function (taskTitle, day) {
    return this.sendNotification(
      '✅ Tugas Ditambahkan',
      {
        body: `"${taskTitle}" untuk hari ${day} telah ditambahkan.`,
        tag: 'task-added'
      }
    );
  },

  taskCompleted: function (taskTitle) {
    return this.sendNotification(
      '🎉 Tugas Selesai!',
      {
        body: `Tugas "${taskTitle}" telah selesai. Bagus sekali!`,
        vibrate: [200, 100, 200],
        tag: 'task-completed'
      }
    );
  },

  // Test notification untuk settings
  testNotification: function () {
    return this.sendNotification(
      '🔔 Test Notifikasi',
      {
        body: 'Notifikasi berhasil diaktifkan! Anda akan menerima pemberitahuan untuk timer dan tugas.',
        vibrate: [200, 100, 200]
      }
    );
  }
};

// Export service
export default NotificationService;