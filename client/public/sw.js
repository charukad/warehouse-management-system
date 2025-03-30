// client/public/sw.js
const CACHE_NAME = "sathira-sweet-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache when the service worker is installed
const urlsToCache = [
  "/",
  "/offline.html",
  "/src/assets/images/logo.png",
  "/manifest.json",
  // Add other critical assets
];

// Install event - cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // Only cache API requests or specific file types
  if (
    event.request.url.includes("/api/") ||
    event.request.url.match(/\.(js|css|html|png|jpg|jpeg|svg|json)$/)
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the response is valid, clone it and store it in the cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network request fails, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If it's a navigation request, serve the offline page
            if (event.request.mode === "navigate") {
              return caches.match(OFFLINE_URL);
            }

            return new Response("Network error occurred", {
              status: 408,
              headers: { "Content-Type": "text/plain" },
            });
          });
        })
    );
  }
});
