/**
 * Minimal service worker: caches the app shell for offline launch and lets
 * the UI keep showing the last-known ISS/pass data (via localStorage +
 * fallback TLE) when there's no network. Live TLE/position data is
 * intentionally NOT cached here — /api/tle already caches server-side, and
 * caching stale orbital data client-side would silently degrade accuracy.
 */
const CACHE_NAME = "isscope-shell-v1";
const APP_SHELL = ["/", "/sky", "/iss", "/passes", "/settings", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache API calls — always want fresh orbital data when online.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
