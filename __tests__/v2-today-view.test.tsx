import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ online: false }));
const mocks = vi.hoisted(() => ({
  queueAction: vi.fn(),
  execute: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/features/v2/check-ins/check-in.action", () => ({
  createV2CheckIn: vi.fn(),
}));
vi.mock("@/hooks/use-offline-status", () => ({
  useOfflineStatus: (ownerId: string) => ({
    isOnline: state.online,
    ownerId,
    queuedCount: 0,
  }),
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  queueAction: mocks.queueAction,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: (
    _error: unknown,
    messages: { fallback: string },
  ) => messages.fallback,
}));
vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({ execute: mocks.execute, isPending: false }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/brand/brand-illustration", () => ({
  BrandIllustration: () => <div aria-hidden="true" />,
}));

import { TodayView } from "@/features/v2/today/today-view";

const props = {
  ownerId: "user-1",
  firstName: "Camille",
  dateLabel: "samedi 22 août",
  localDate: "2026-08-22",
  timezone: "Europe/Paris",
  locale: "fr" as const,
  initialCheckIn: null,
  nextAppointment: null,
};

describe("V2 Today view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.online = false;
    mocks.queueAction.mockResolvedValue({ id: "action:check-in-1" });
  });

  it("encrypts a complete quick check-in in the offline action queue", async () => {
    const user = userEvent.setup();
    render(<TodayView {...props} />);

    await user.click(
      screen.getByRole("button", { name: "Faire un point rapide" }),
    );
    await user.click(screen.getByRole("button", { name: "Moral: 8 sur 10" }));
    await user.click(screen.getByRole("button", { name: "Énergie: 4 sur 10" }));
    await user.click(
      screen.getByRole("button", { name: "Irritabilité: 6 sur 10" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Enregistrer mon point" }),
    );

    await waitFor(() =>
      expect(mocks.queueAction).toHaveBeenCalledWith(
        "user-1",
        {
          type: "v2_check_in",
          depth: "quick",
          localDate: "2026-08-22",
          timezone: "Europe/Paris",
          valence: 8,
          activation: 4,
          irritability: 6,
          anxiety: undefined,
          contexts: [],
          note: undefined,
        },
        { timeZone: "Europe/Paris" },
      ),
    );
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Enregistré hors ligne"),
    );
    expect(
      screen.getByRole("button", { name: "Faire un autre point" }),
    ).toBeVisible();
  });

  it("keeps the online mutation on the canonical V2 contract", async () => {
    state.online = true;
    const user = userEvent.setup();
    render(<TodayView {...props} locale="en" />);

    await user.click(screen.getByRole("button", { name: "I’m here" }));

    expect(mocks.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: expect.any(String),
        depth: "presence",
        localDate: "2026-08-22",
        timezone: "Europe/Paris",
        contexts: [],
      }),
    );
    expect(mocks.queueAction).not.toHaveBeenCalled();
  });
});
