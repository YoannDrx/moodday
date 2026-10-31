import {
  buildUserDataExport,
  createUserDataExportStream,
} from "@/features/account/user-data-export";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("buildUserDataExport", () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@example.test",
    } as never);
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      role: "cycle_owner",
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([]);
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.period.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyCheckIn.findMany).mockResolvedValue([]);
    vi.mocked(prisma.customNeed.findMany).mockResolvedValue([]);
    vi.mocked(prisma.coupleLink.findMany).mockResolvedValue([]);
    vi.mocked(prisma.gesture.findMany).mockResolvedValue([]);
    vi.mocked(prisma.allyProgress.findMany).mockResolvedValue([]);
    vi.mocked(prisma.accessLog.findMany).mockResolvedValue([]);
  });

  it("exports the cycle, check-ins with the private note, and the duo", async () => {
    vi.mocked(prisma.period.findMany).mockResolvedValue([
      { id: "period-1", startDate: new Date("2026-10-01") },
    ] as never);
    vi.mocked(prisma.dailyCheckIn.findMany).mockResolvedValue([
      { id: "check-1", state: "fragile", privateNote: "rien que pour moi" },
    ] as never);
    vi.mocked(prisma.gesture.findMany).mockResolvedValue([
      { id: "gesture-1", kind: "dinner" },
    ] as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.exportMetadata).toEqual(
      expect.objectContaining({
        dataVersion: "3.0",
        applicationName: "Moodday",
        userId: "user-1",
        timezone: "Europe/Paris",
      }),
    );
    expect(result.cycle.periods).toHaveLength(1);
    // The owner's export is the one place where her private note appears.
    expect(result.checkIns).toEqual([
      expect.objectContaining({ privateNote: "rien que pour moi" }),
    ]);
    expect(result.couple.gestures).toHaveLength(1);
    expect(prisma.coupleLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ ownerId: "user-1" }, { supporterId: "user-1" }] },
      }),
    );
    expect(prisma.gesture.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ senderId: "user-1" }, { recipientId: "user-1" }] },
      }),
    );
  });

  it("never exports invitation codes or device push tokens", async () => {
    await buildUserDataExport({ id: "user-1" });

    const linkSelect = vi.mocked(prisma.coupleLink.findMany).mock.calls[0]?.[0]
      ?.select as Record<string, boolean>;
    expect(linkSelect.inviteCodeDigest).toBeUndefined();
    const result = await buildUserDataExport({ id: "user-1" });
    expect(result.exportMetadata.excludedSecurityData).toEqual(
      expect.arrayContaining([
        "authentication sessions and credentials",
        "couple invitation codes",
        "push subscription secrets and device push tokens",
      ]),
    );
  });

  it("uses a null timezone when preferences are absent", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    const result = await buildUserDataExport({ id: "user-1" });
    expect(result.exportMetadata.timezone).toBeNull();
    expect(result.preferences).toBeNull();
  });

  it("streams every page inside one snapshot and applies backpressure", async () => {
    const rows = Array.from({ length: 251 }, (_, index) => ({
      id: `check-${index}`,
      privateNote: "x".repeat(300),
    }));
    vi.mocked(prisma.dailyCheckIn.findMany)
      .mockResolvedValueOnce(rows.slice(0, 250) as never)
      .mockResolvedValueOnce(rows.slice(250) as never);
    const response = new Response(createUserDataExportStream({ id: "user-1" }));
    const result = await response.json();
    expect(result.checkIns).toEqual(rows);
    expect(prisma.dailyCheckIn.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        take: 250,
        skip: 1,
        cursor: { id: "check-249" },
        orderBy: { id: "asc" },
        where: { userId: "user-1" },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "RepeatableRead" }),
    );
  });

  it("propagates a failed snapshot to the download instead of returning truncated JSON", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(
      new Error("snapshot unavailable"),
    );
    await expect(
      new Response(createUserDataExportStream({ id: "user-1" })).text(),
    ).rejects.toThrow("snapshot unavailable");
  });

  it("cancels a slow download and lets the transaction unwind", async () => {
    vi.mocked(prisma.dailyCheckIn.findMany).mockResolvedValueOnce(
      Array.from({ length: 250 }, (_, index) => ({
        id: `check-${index}`,
        privateNote: "x".repeat(300),
      })) as never,
    );
    let unwound = false;
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      try {
        return await callback(prisma);
      } finally {
        unwound = true;
      }
    });
    const reader = createUserDataExportStream({ id: "user-1" }).getReader();
    await reader.read();
    await reader.cancel();
    await vi.waitFor(() => expect(unwound).toBe(true));
  });
});
