import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compact: vi.fn(),
  getActions: vi.fn(),
  getMoods: vi.fn(),
  syncActions: vi.fn(),
  syncMoods: vi.fn(),
  retry: vi.fn(),
  discard: vi.fn(),
  notify: vi.fn(),
  toastSuccess: vi.fn(),
  toastWarning: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  createObjectURL: vi.fn((_blob: Blob) => "blob:diagnostic"),
  revokeObjectURL: vi.fn(),
  anchorClick: vi.fn(),
}));

const operation = (
  id: string,
  status: "pending" | "syncing" | "failed" | "conflict",
  createdAt: string,
) => ({
  id,
  ownerId: "user-1",
  schemaVersion: 2,
  kind: "action",
  status,
  retryCount: status === "pending" ? 0 : 2,
  createdAt,
  updatedAt: createdAt,
  payload: { type: "med_intake" },
});

vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: "fr",
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    warning: mocks.toastWarning,
    error: mocks.toastError,
    info: mocks.toastInfo,
  },
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  getQueuedActions: mocks.getActions,
  syncQueuedActions: mocks.syncActions,
}));
vi.mock("@/features/pwa/offline-queue", () => ({
  getQueuedMoodEntries: mocks.getMoods,
  syncQueuedMoodEntries: mocks.syncMoods,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  compactOfflineOperations: mocks.compact,
  discardOfflineOperation: mocks.discard,
  retryOfflineOperation: mocks.retry,
}));
vi.mock("@/features/pwa/offline-events", () => ({
  OFFLINE_QUEUE_CHANGED_EVENT: "moodday:offline-queue-changed",
  notifyOfflineQueueChanged: mocks.notify,
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { OfflineSyncContent } from "@app/(logged-in)/(patient-layout)/settings/offline/_components/offline-sync-content";

describe("offline synchronization settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 512, quota: 4096 }),
      },
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: mocks.createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: mocks.revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      mocks.anchorClick,
    );
    mocks.compact.mockResolvedValue(undefined);
    mocks.getActions.mockResolvedValue([
      operation("action-pending", "pending", "2026-08-10T08:00:00.000Z"),
      operation("action-failed", "failed", "2026-08-12T08:00:00.000Z"),
      operation("action-conflict", "conflict", "2026-08-13T08:00:00.000Z"),
    ]);
    mocks.getMoods.mockResolvedValue([
      {
        ...operation("mood-syncing", "syncing", "2026-08-11T08:00:00.000Z"),
        kind: "mood",
        payload: { value: 0 },
      },
    ]);
    mocks.syncActions.mockResolvedValue({ remaining: 0 });
    mocks.syncMoods.mockResolvedValue({ remaining: 0 });
    mocks.retry.mockResolvedValue(undefined);
    mocks.discard.mockResolvedValue(undefined);
  });

  it("loads only safe queue metadata and renders every operational state", async () => {
    render(<OfflineSyncContent ownerId="user-1" />);

    expect(
      screen.getByRole("status", { name: "settings.offline.loading" }),
    ).toHaveAttribute("aria-busy", "true");
    await waitFor(() =>
      expect(
        screen.getAllByText("settings.offline.operation.med_intake"),
      ).toHaveLength(3),
    );
    expect(
      screen.getByText("settings.offline.operation.mood"),
    ).toBeInTheDocument();
    for (const status of ["pending", "syncing", "failed", "conflict"]) {
      expect(
        screen.getByText(`settings.offline.status.${status}`),
      ).toBeInTheDocument();
    }
    expect(mocks.compact).toHaveBeenCalledWith("user-1");
    expect(screen.queryByText(/payload|value.*0/i)).not.toBeInTheDocument();
  });

  it("synchronizes all queues and distinguishes complete, incomplete and failed runs", async () => {
    const user = userEvent.setup();
    render(<OfflineSyncContent ownerId="user-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("settings.offline.status.pending"),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: /settings\.offline\.retryAll/ }),
    );
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "settings.offline.syncComplete",
      ),
    );

    mocks.syncActions.mockResolvedValueOnce({ remaining: 1 });
    await user.click(
      screen.getByRole("button", { name: /settings\.offline\.retryAll/ }),
    );
    await waitFor(() =>
      expect(mocks.toastWarning).toHaveBeenCalledWith(
        "settings.offline.syncIncomplete",
      ),
    );

    mocks.syncActions.mockRejectedValueOnce(new Error("network"));
    await user.click(
      screen.getByRole("button", { name: /settings\.offline\.retryAll/ }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "settings.offline.syncError",
      ),
    );
  });

  it("retries and discards individual operations with queue-change notification", async () => {
    const user = userEvent.setup();
    render(<OfflineSyncContent ownerId="user-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("settings.offline.status.pending"),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getAllByRole("button", { name: "settings.offline.retry" })[0],
    );
    await waitFor(() =>
      expect(mocks.retry).toHaveBeenCalledWith("user-1", "action-pending"),
    );
    expect(mocks.notify).toHaveBeenCalled();
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      "settings.offline.retryStarted",
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "settings.offline.confirmDiscard",
      })[0],
    );
    await waitFor(() =>
      expect(mocks.discard).toHaveBeenCalledWith("user-1", "action-pending"),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "settings.offline.discarded",
    );
  });

  it("reacts to browser connectivity and does not synchronize while offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<OfflineSyncContent ownerId="user-1" />);
    await waitFor(() =>
      expect(screen.getByText("settings.offline.offline")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /settings\.offline\.retryAll/ }),
    ).toBeDisabled();

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    fireEvent(window, new Event("online"));
    await waitFor(() =>
      expect(screen.getByText("settings.offline.online")).toBeInTheDocument(),
    );
  });

  it("downloads a redacted diagnostic and reports browser storage failures", async () => {
    const user = userEvent.setup();
    render(<OfflineSyncContent ownerId="user-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("settings.offline.status.pending"),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", {
        name: /settings\.offline\.downloadDiagnostic/,
      }),
    );
    await waitFor(() => expect(mocks.createObjectURL).toHaveBeenCalled());
    const blob = mocks.createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(mocks.anchorClick).toHaveBeenCalled();
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith("blob:diagnostic");
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "settings.offline.diagnosticReady",
    );

    vi.mocked(navigator.storage.estimate).mockRejectedValueOnce(
      new Error("quota unavailable"),
    );
    await user.click(
      screen.getByRole("button", {
        name: /settings\.offline\.downloadDiagnostic/,
      }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "settings.offline.diagnosticError",
      ),
    );
  });

  it("recovers from queue load failures and renders the empty state", async () => {
    mocks.compact.mockRejectedValueOnce(new Error("indexeddb unavailable"));
    const user = userEvent.setup();
    render(<OfflineSyncContent ownerId="user-1" />);
    await waitFor(() =>
      expect(
        screen.getByText("settings.offline.loadErrorTitle"),
      ).toBeInTheDocument(),
    );
    mocks.getActions.mockResolvedValue([]);
    mocks.getMoods.mockResolvedValue([]);
    await user.click(
      screen.getByRole("button", { name: "settings.offline.retry" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("settings.offline.emptyTitle"),
      ).toBeInTheDocument(),
    );
  });
});
