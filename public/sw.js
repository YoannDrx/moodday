const CACHE_NAME = "moodday-cache-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_ASSETS = ["/", OFFLINE_URL, "/manifest.json", "/images/icon.png"];

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

  // Ne pas intercepter les requêtes de navigation (pages HTML)
  // pour éviter les problèmes de redirection (auth, etc.)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  if (request.url.includes("/_next/")) {
    event.respondWith(fetch(request));
    return;
  }

  const acceptHeader = request.headers.get("accept") || "";
  const isRscRequest =
    acceptHeader.includes("text/x-component") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.get("rsc") === "1" ||
    request.url.includes("__rsc");
  if (isRscRequest) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          if (
            response.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => undefined);
            });
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
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
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
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
          event.notification?.data?.url && typeof event.notification.data.url === "string"
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
