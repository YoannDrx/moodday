import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/v2/calendar/sync-service", () => ({
  synchronizeGoogleCalendar: vi.fn(),
}));

import { synchronizeDueGoogleCalendars } from "@/features/v2/calendar/background-sync";
import { synchronizeGoogleCalendar } from "@/features/v2/calendar/sync-service";

describe("V2 Google Calendar background sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.calendarConnection.findMany).mockResolvedValue([
      { id: "connection-1", userId: "user-1" },
      { id: "connection-2", userId: "user-2" },
    ] as never);
    vi.mocked(synchronizeGoogleCalendar).mockResolvedValue({} as never);
  });

  it("selects only active, due and unleased connections in a bounded batch", async () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    await expect(synchronizeDueGoogleCalendars(now)).resolves.toEqual({
      examined: 2,
      synchronized: 2,
      remaining: false,
    });

    expect(prisma.calendarConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          provider: "google",
          revokedAt: null,
          sourceConnection: { is: { status: "active" } },
          OR: [
            { lastSyncCompletedAt: null },
            {
              lastSyncCompletedAt: {
                lte: new Date("2026-08-23T11:45:00.000Z"),
              },
            },
          ],
        }),
        take: 20,
        select: { id: true, userId: true },
      }),
    );
    expect(synchronizeGoogleCalendar).toHaveBeenNthCalledWith(
      1,
      "user-1",
      "connection-1",
    );
    expect(synchronizeGoogleCalendar).toHaveBeenNthCalledWith(
      2,
      "user-2",
      "connection-2",
    );
  });

  it("finishes the batch before raising one content-free operational error", async () => {
    vi.mocked(synchronizeGoogleCalendar)
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce({} as never);

    await expect(synchronizeDueGoogleCalendars()).rejects.toMatchObject({
      name: "google_calendar_background_sync_failed",
    });
    expect(synchronizeGoogleCalendar).toHaveBeenCalledTimes(2);
  });
});
