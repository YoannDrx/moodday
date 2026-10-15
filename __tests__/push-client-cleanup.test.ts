import { afterEach, expect, it, vi } from "vitest";
import {
  unsubscribeCurrentPush,
  purgeAuthenticatedBrowserCaches,
} from "@/features/pwa/push-client";
const originalWorker = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
);
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalWorker)
    Object.defineProperty(navigator, "serviceWorker", originalWorker);
  else Reflect.deleteProperty(navigator, "serviceWorker");
});
it("cleans a browser subscription even if remote unsubscribe fails", async () => {
  const unsubscribe = vi.fn().mockResolvedValue(true);
  const subscription = {
    endpoint: "https://push.example.test/private",
    unsubscribe,
  };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: async () => ({
        pushManager: { getSubscription: async () => subscription },
      }),
    },
  });
  vi.stubGlobal("PushManager", vi.fn());
  const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", fetchMock);
  await unsubscribeCurrentPush();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/push/unsubscribe",
    expect.objectContaining({ method: "POST" }),
  );
  expect(unsubscribe).toHaveBeenCalledOnce();
});
it("never blocks logout on an unresolved service worker", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("PushManager", vi.fn());
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration: async () => new Promise(() => undefined) },
  });
  const cleanup = unsubscribeCurrentPush();
  await vi.advanceTimersByTimeAsync(1001);
  await expect(cleanup).resolves.toBeUndefined();
});
it("purges all authenticated caches and tolerates a failed cache deletion", async () => {
  const remove = vi
    .fn()
    .mockResolvedValueOnce(true)
    .mockRejectedValueOnce(new Error("unavailable"));
  vi.stubGlobal("caches", {
    keys: async () => ["private-a", "private-b"],
    delete: remove,
  });
  await purgeAuthenticatedBrowserCaches();
  expect(remove).toHaveBeenCalledTimes(2);
});
