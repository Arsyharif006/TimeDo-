  // src/utils/registerServiceWorker.js

  export const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Register service worker
          const base = import.meta.env.BASE_URL;

          const registration = await navigator.serviceWorker.register(`${base}sw.js`, {
            scope: base
          });
          
    
          console.log('Service Worker registered successfully:', registration);
    
          // Update service worker jika ada versi baru
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New Service Worker available, please refresh');
              }
            });
          });
    
          return registration;
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          return null;
        }
      } else {
        console.log('Service Workers not supported');
        return null;
      }
    };
    
    // Unregister service worker (untuk development/debugging)
    export const unregisterServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
        console.log('Service Workers unregistered');
      }
    };