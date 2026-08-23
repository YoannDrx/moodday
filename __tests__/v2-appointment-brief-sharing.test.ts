import {
  AppointmentBriefShareUnavailableError,
  createAppointmentBriefShare,
  digestAppointmentBriefShareToken,
  resolveAppointmentBriefShare,
  revokeAppointmentBriefShare,
} from "@/features/v2/appointments/brief-share-service";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const now = new Date("2026-08-23T08:00:00.000Z");
const token = "A".repeat(43);
const briefContent = {
  appointment: {
    title: "Suivi avec la psychiatre",
    startsAt: "2026-08-27T09:00:00.000Z",
    timezone: "Europe/Paris",
    clinician: "Dr Martin",
  },
  questions: [{ content: "Comment ajuster mon rythme ?" }],
  decisions: [
    {
      summary: "Observer le sommeil pendant une semaine",
      status: "open",
      dueAt: null,
    },
  ],
  generatedAt: "2026-08-23T07:00:00.000Z",
  excludedPrivateQuestionCount: 1,
} as const;

describe("Mood Day V2 appointment brief sharing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores only the token digest and replays the same operation", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointmentBrief.findFirst).mockResolvedValue({
      id: "brief-1",
    } as never);
    vi.mocked(prisma.appointmentBriefShare.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointmentBriefShare.create).mockResolvedValue({
      id: "share-1",
      briefId: "brief-1",
      expiresAt: new Date("2026-08-24T08:00:00.000Z"),
      revokedAt: null,
      accessCount: 0,
      lastAccessedAt: null,
      createdAt: now,
    } as never);

    const result = await createAppointmentBriefShare(
      "user-1",
      "brief-1",
      {
        operationId: "operation-share-1",
        shareId: "share-1",
        token,
        expiresInHours: 24,
      },
      now,
    );

    expect(result.token).toBe(token);
    expect(result.share.expiresAt).toBe("2026-08-24T08:00:00.000Z");
    const data = vi.mocked(prisma.appointmentBriefShare.create).mock
      .calls[0]?.[0]?.data;
    expect(data).toMatchObject({
      tokenDigest: digestAppointmentBriefShareToken(token),
      expiresAt: new Date("2026-08-24T08:00:00.000Z"),
    });
    expect(JSON.stringify(data)).not.toContain(`"token":"${token}"`);
  });

  it("resolves an active link, counts the access and returns only the allowlisted brief", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointmentBriefShare.findUnique).mockResolvedValue({
      id: "share-1",
      expiresAt: new Date("2026-08-24T08:00:00.000Z"),
      revokedAt: null,
      brief: {
        id: "brief-1",
        appointmentId: "appointment-1",
        operationId: "operation-brief-1",
        version: 1,
        content: briefContent,
        privateNotesExcluded: true,
        periodStart: null,
        periodEnd: null,
        createdAt: now,
      },
    } as never);
    vi.mocked(prisma.appointmentBriefShare.update).mockResolvedValue(
      {} as never,
    );

    const result = await resolveAppointmentBriefShare(token, now);

    expect(result).toMatchObject({
      expiresAt: "2026-08-24T08:00:00.000Z",
      brief: {
        privateNotesExcluded: true,
        content: {
          questions: [{ content: "Comment ajuster mon rythme ?" }],
          excludedPrivateQuestionCount: 1,
        },
      },
    });
    expect(prisma.appointmentBriefShare.update).toHaveBeenCalledWith({
      where: { id: "share-1" },
      data: { accessCount: { increment: 1 }, lastAccessedAt: now },
    });
    expect(JSON.stringify(result)).not.toContain("Note à garder pour moi");
  });

  it.each([
    { revokedAt: now, expiresAt: new Date("2026-08-24T08:00:00.000Z") },
    { revokedAt: null, expiresAt: new Date("2026-08-23T08:00:00.000Z") },
  ])("rejects revoked and expired capabilities", async (state) => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointmentBriefShare.findUnique).mockResolvedValue({
      id: "share-1",
      ...state,
      brief: {},
    } as never);

    await expect(
      resolveAppointmentBriefShare(token, now),
    ).rejects.toBeInstanceOf(AppointmentBriefShareUnavailableError);
    expect(prisma.appointmentBriefShare.update).not.toHaveBeenCalled();
  });

  it("revokes only a share owned through the brief appointment", async () => {
    vi.mocked(prisma.appointmentBriefShare.updateMany).mockResolvedValue({
      count: 1,
    });

    await expect(
      revokeAppointmentBriefShare("user-1", "brief-1", "share-1", now),
    ).resolves.toEqual({ revoked: true });
    expect(prisma.appointmentBriefShare.updateMany).toHaveBeenCalledWith({
      where: {
        id: "share-1",
        briefId: "brief-1",
        brief: { appointment: { userId: "user-1" } },
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
  });
});
