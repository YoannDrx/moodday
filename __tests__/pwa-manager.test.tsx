import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: { user: { id: "user-alice" } } as { user: { id: string } } | null,
  preferences: { notificationsEnabled: true, locale: "fr" } as {
    notificationsEnabled: boolean;
    locale: string;
  } | null,
  setOwner: vi.fn(),
  compact: vi.fn(),
  syncMood: vi.fn(),
  syncActions: vi.fn(),
  unsubscribe: vi.fn(),
  getContentMode: vi.fn(),
  register: vi.fn(),
  update: vi.fn(),
  getSubscription: vi.fn(),
  subscribe: vi.fn(),
  serviceWorkerAdd: vi.fn(),
  serviceWorkerRemove: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mocks.preferences }),
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: mocks.session }),
}));
vi.mock("@/features/preferences/preferences.action", () => ({
  getUserPreferences: vi.fn(),
}));
vi.mock("@/features/pwa/offline-store", () => ({
  compactOfflineOperations: mocks.compact,
  setActiveOfflineOwner: mocks.setOwner,
}));
vi.mock("@/features/pwa/offline-queue", () => ({
  syncQueuedMoodEntries: mocks.syncMood,
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  syncQueuedActions: mocks.syncActions,
}));
vi.mock("@/features/pwa/push-client", () => ({
  unsubscribeCurrentPush: mocks.unsubscribe,
}));
vi.mock("@/features/pwa/push-content-mode", () => ({
  getPushContentMode: mocks.getContentMode,
}));

import { PwaManager } from "@/features/pwa/pwa-manager";

describe("PWA manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.session = { user: { id: "user-alice" } };
    mocks.preferences = { notificationsEnabled: true, locale: "fr" };
    mocks.getContentMode.mockReturnValue("generic");
    mocks.compact.mockResolvedValue(undefined);
    mocks.syncMood.mockResolvedValue(undefined);
    mocks.syncActions.mockResolvedValue(undefined);
    mocks.unsubscribe.mockResolvedValue(undefined);
    mocks.update.mockResolvedValue(undefined);
    mocks.register.mockResolvedValue({ update: mocks.update });
    mocks.getSubscription.mockResolvedValue(null);
    mocks.subscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: "https://push.test/alice",
        keys: { p256dh: "key", auth: "auth" },
      }),
    });
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: mocks.register,
        ready: Promise.resolve({
          pushManager: {
            getSubscription: mocks.getSubscription,
            subscribe: mocks.subscribe,
          },
        }),
        addEventListener: mocks.serviceWorkerAdd,
        removeEventListener: mocks.serviceWorkerRemove,
      },
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: vi.fn().mockResolvedValue({ ok: true }),
    });
  });

  it("isolates the offline owner, synchronizes online and registers generic push", async () => {
    const view = render(
      <PwaManager pushNotificationsEnabled vapidPublicKey="AQID" />,
    );
    await waitFor(() =>
      expect(mocks.setOwner).toHaveBeenCalledWith("user-alice"),
    );
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith("/sw.js"));
    await waitFor(() =>
      expect(mocks.compact).toHaveBeenCalledWith("user-alice"),
    );
    expect(mocks.syncMood).toHaveBeenCalledWith("user-alice");
    expect(mocks.syncActions).toHaveBeenCalledWith("user-alice");
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const firstRequest = vi.mocked(globalThis.fetch).mock.calls[0]?.[1];
    expect(JSON.parse(String(firstRequest?.body))).toMatchObject({
      endpoint: "https://push.test/alice",
      locale: "fr",
      contentMode: "generic",
      trustedDevice: false,
    });
    expect(window.localStorage.getItem("moodday.push.device-id")).toBeTruthy();

    act(() => {
      window.dispatchEvent(
        new CustomEvent("moodday:push-content-mode", {
          detail: { ownerId: "user-alice", mode: "detailed" },
        }),
      );
    });
    await waitFor(() =>
      expect(vi.mocked(globalThis.fetch).mock.calls.length).toBeGreaterThan(1),
    );
    const detailedRequest = vi.mocked(globalThis.fetch).mock.calls.at(-1)?.[1];
    expect(JSON.parse(String(detailedRequest?.body))).toMatchObject({
      contentMode: "detailed",
      trustedDevice: true,
    });

    const messageHandler = mocks.serviceWorkerAdd.mock.calls.find(
      ([eventName]) => eventName === "message",
    )?.[1] as ((event: MessageEvent) => void) | undefined;
    act(() =>
      messageHandler?.(
        new MessageEvent("message", {
          data: { type: "PUSH_SUBSCRIPTION_CHANGED" },
        }),
      ),
    );
    await waitFor(() =>
      expect(mocks.subscribe.mock.calls.length).toBeGreaterThan(1),
    );
    view.unmount();
    expect(mocks.serviceWorkerRemove).toHaveBeenCalledWith(
      "message",
      messageHandler,
    );
  });

  it("unsubscribes a disabled preference and ignores another account's mode event", async () => {
    mocks.preferences = { notificationsEnabled: false, locale: "en" };
    render(<PwaManager pushNotificationsEnabled vapidPublicKey="AQID" />);
    await waitFor(() => expect(mocks.unsubscribe).toHaveBeenCalled());
    act(() => {
      window.dispatchEvent(
        new CustomEvent("moodday:push-content-mode", {
          detail: { ownerId: "user-bob", mode: "detailed" },
        }),
      );
      window.dispatchEvent(new Event("online"));
    });
    expect(mocks.getContentMode).toHaveBeenCalledWith("user-alice");
  });

  it("keeps generic state when signed out and does not subscribe behind a kill switch", async () => {
    mocks.session = null;
    render(<PwaManager pushNotificationsEnabled={false} />);
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith("/sw.js"));
    expect(mocks.setOwner).not.toHaveBeenCalled();
    expect(mocks.subscribe).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
