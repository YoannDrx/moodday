"use client";

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Push cleanup timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const unsubscribeCurrentPush = async (): Promise<void> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  // `serviceWorker.ready` may remain pending indefinitely when no active
  // registration exists (notably in WebKit). Signing out and deleting an
  // account must never depend on a push worker becoming ready.
  const registration = await withTimeout(
    navigator.serviceWorker.getRegistration(),
    1_000,
  ).catch(() => undefined);
  if (!registration || !("pushManager" in registration)) return;
  const subscription = await withTimeout(
    registration.pushManager.getSubscription(),
    1_000,
  ).catch(() => undefined);
  if (!subscription) return;

  try {
    await withTimeout(
      fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }),
      3_000,
    ).catch(() => undefined);
  } finally {
    await withTimeout(subscription.unsubscribe(), 1_000).catch(() => undefined);
  }
};

export const purgeAuthenticatedBrowserCaches = async (): Promise<void> => {
  if (!("caches" in window)) return;
  const cacheNames = await withTimeout(caches.keys(), 1_000).catch(() => []);
  await Promise.all(
    cacheNames.map(async (cacheName) =>
      withTimeout(caches.delete(cacheName), 1_000).catch(() => false),
    ),
  );
};
