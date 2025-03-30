// client/public/sw.js (or wherever your service worker is located)

// Cache name - update this if you need to invalidate the cache
const CACHE_NAME = "sathira-sweet-cache-v1";

// Application assets to cache on install
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  // Add other assets you want to cache
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files...");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Fetch event - respond with cached resources or fetch from network
self.addEventListener("fetch", (event) => {
  // IMPORTANT FIX: Skip caching for POST, PUT, DELETE requests
  if (event.request.method !== "GET") {
    // For non-GET requests, just fetch from network without caching
    return event.respondWith(fetch(event.request));
  }

  // For GET requests, try cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone();

      // Make network request
      return fetch(fetchRequest).then((response) => {
        // Check if received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response because it's a one-time use stream
        const responseToCache = response.clone();

        // Open the cache and store the new response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle background sync for offline functionality if needed
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Sync event triggered", event.tag);

  // Implement background sync logic here if needed
});

// Handle push notifications if needed
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received", event);

  // Implement push notification logic here if needed
});
