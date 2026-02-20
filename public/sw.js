const CACHE_VERSION = "mmart-pwa-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/apple-touch-icon.png",
];

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

/* ------------------------------------------------------------------ */
/*  Fetch (cache strategy)                                             */
/* ------------------------------------------------------------------ */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Static assets: stale-while-revalidate
  const isStaticAsset =
    requestUrl.pathname.startsWith("/_next/static/") ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);

        return cached ?? networkFetch;
      }),
    );
  }
});

/* ------------------------------------------------------------------ */
/*  Push Notifications                                                 */
/* ------------------------------------------------------------------ */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};

  try {
    const parsed = event.data.json();
    payload =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : { body: String(parsed) };
  } catch (_error) {
    payload = { body: event.data.text() };
  }

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title
      : "Mmart update";
  const body = typeof payload.body === "string" ? payload.body : "";
  const tag =
    typeof payload.tag === "string" && payload.tag.trim()
      ? payload.tag
      : undefined;
  const url =
    typeof payload.url === "string" && payload.url.startsWith("/")
      ? payload.url
      : "/orders";
  const icon =
    typeof payload.icon === "string" && payload.icon.trim()
      ? payload.icon
      : "/icons/icon-192x192.png";
  const badge =
    typeof payload.badge === "string" && payload.badge.trim()
      ? payload.badge
      : "/icons/icon-192x192.png";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      icon,
      badge,
      vibrate: [200, 100, 200],
      data: { url },
    }),
  );
});

/* ------------------------------------------------------------------ */
/*  Notification Click                                                 */
/* ------------------------------------------------------------------ */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destination =
    typeof event.notification.data?.url === "string" &&
      event.notification.data.url.startsWith("/")
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Try to focus an existing window
        for (const client of windowClients) {
          if ("focus" in client) {
            try {
              const clientUrl = new URL(client.url);
              if (clientUrl.pathname.startsWith(destination)) {
                return client.focus();
              }
            } catch {
              // Invalid URL, skip
            }
          }
        }

        // If no matching window, try to focus any existing window and navigate
        for (const client of windowClients) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(destination));
          }
        }

        // Last resort: open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(destination);
        }

        return Promise.resolve();
      }),
  );
});
