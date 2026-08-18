const CACHE_NAME = "moodday-cache-v5";
const OFFLINE_URL = "/offline";
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/images/icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Authenticated/API/framework requests are never handled by the worker,
  // including top-level POST navigations such as the logout endpoint.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/invite/")
  ) {
    return;
  }

  // Only the explicit offline page is served by the worker. Application
  // navigations, redirects and authenticated pages always use the browser's
  // native network stack.
  if (request.mode === "navigate") {
    if (url.pathname === OFFLINE_URL) {
      event.respondWith(
        caches.match(OFFLINE_URL).then((cached) => cached || fetch(request)),
      );
    }
    return;
  }

  // Session, API and React Server Component responses are user-specific.
  // They must never be persisted in the shared HTTP cache.
  const acceptHeader = request.headers.get("accept") || "";
  const isRscRequest =
    acceptHeader.includes("text/x-component") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.get("rsc") === "1" ||
    request.url.includes("__rsc");
  if (isRscRequest) {
    return;
  }

  const isCacheableStaticAsset =
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest";

  if (!isCacheableStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          if (response.status === 200 && response.type !== "opaque") {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => undefined);
            });
          }
          return response;
        })
        .catch(() => Response.error());
    }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Moodday";
  const options = {
    body: data.body || "Vous avez une nouvelle notification.",
    icon: data.icon || "/images/icon.png",
    badge: data.badge || "/images/icon.png",
    data: {
      url: data.url || "/",
    },
    tag: data.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
        }
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const targetUrl =
          event.notification?.data?.url &&
          typeof event.notification.data.url === "string"
            ? event.notification.data.url
            : "/";
        if (clientList.length > 0) {
          clientList[0].focus();
          return clientList[0].navigate(targetUrl);
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
