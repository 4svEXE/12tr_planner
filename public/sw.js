
const CACHE_NAME = '12tr-v9'; // Incremented version to force flush
const ASSETS = [
  '/',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

// Resources that might have CORS restrictions, cache separately or skip in addAll
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing new cache v9');
      // Adding assets
      cache.addAll(ASSETS).catch(err => console.error('Critical assets failed to cache', err));

      // Attempt to cache external assets without blocking
      EXTERNAL_ASSETS.forEach(url => {
        fetch(url, { mode: 'no-cors' }).then(response => {
          cache.put(url, response);
        }).catch(() => { });
      });

      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
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

self.addEventListener('fetch', (event) => {
  const urlObj = new URL(event.request.url);
  const url = event.request.url;

  // BYPASS CACHE FOR ALL LOCAL NETWORK REQUESTS (DEV MODE)
  const isLocal = urlObj.hostname === 'localhost' ||
    urlObj.hostname === '127.0.0.1' ||
    urlObj.hostname.startsWith('192.168.') ||
    urlObj.hostname.startsWith('10.') ||
    urlObj.hostname.startsWith('172.');

  if (isLocal) {
    return; // Let the browser handle it normally (network first)
  }

  // Bypass non-http protocols (like wss://, chrome-extension://)
  if (!urlObj.protocol.startsWith('http')) {
    return;
  }

  // Не кешуємо медіа (аудіо) через проблеми з Range запитами в деяких браузерах
  if (url.includes('.mp3') || url.includes('mixkit.co')) {
    return;
  }

  // Не кешуємо запити до API
  if (url.includes('generativelanguage.googleapis.com') || url.includes('google')) {
    return;
  }

  // NETWORK FIRST STRATEGY FOR ENTRY POINTS (index.html, root)
  // This ensures the user always gets the latest version if online.
  if (event.request.mode === 'navigate' || urlObj.pathname === '/' || urlObj.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with the new version
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // CACHE FIRST STRATEGY FOR OTHER ASSETS
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
         // Cache new assets on the fly
         if (networkResponse && networkResponse.status === 200) {
           const clonedResponse = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, clonedResponse);
           });
         }
         return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('/');
        }
      });
    })
  );
});
