import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queuePartnerNotification: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_SECRET: "synthetic-test-secret-for-couple-codes-0000" },
}));
vi.mock("@/features/couple/notify.service", () => ({
  queuePartnerNotification: mocks.queuePartnerNotification,
  checkInDeliveryKey: (ownerId: string, date: Date) =>
    `partner-checkin:${ownerId}:${date.toISOString().slice(0, 10)}`,
}));

import { saveCheckIn } from "@/features/couple/check-in.service";
import { startPeriod } from "@/features/couple/cycle.service";
import { sendGesture } from "@/features/couple/gesture.service";
import {
  acceptInvite,
  createInvite,
  endLink,
  updateSharing,
} from "@/features/couple/link.service";
import { readPartnerView } from "@/features/couple/partner-view.service";
import { CoupleError } from "@/features/couple/shared";

const profile = (role: "cycle_owner" | "supporter") =>
  vi.mocked(prisma.profile.findUnique).mockResolvedValue({ role } as never);

const checkInInput = {
  operationId: "operation-0001",
  localDate: "2026-10-30",
  timezone: "Europe/Paris",
  state: "fragile" as const,
  symptoms: ["fatigue", "unknown-symptom"],
  needs: ["calm", "dinner", "custom:not-mine"],
  privateNote: "  rien que pour moi  ",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    typeof callback === "function" ? callback(prisma) : Promise.all(callback),
  );
  vi.mocked(prisma.$executeRaw).mockResolvedValue(0 as never);
  vi.mocked(prisma.customNeed.findMany).mockResolvedValue([]);
});

describe("Mon point (check-in)", () => {
  it("refuses a check-in written by the partner", async () => {
    profile("supporter");
    await expect(
      saveCheckIn("tom", checkInInput, "2026-10-30"),
    ).rejects.toBeInstanceOf(CoupleError);
    expect(prisma.dailyCheckIn.create).not.toHaveBeenCalled();
  });

  it("refuses dates far from today", async () => {
    profile("cycle_owner");
    await expect(
      saveCheckIn(
        "lea",
        { ...checkInInput, localDate: "2026-10-01" },
        "2026-10-30",
      ),
    ).rejects.toMatchObject({ code: "date_out_of_range" });
  });

  it("keeps only known catalogue keys and the owner's custom needs", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.dailyCheckIn.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dailyCheckIn.create).mockResolvedValue({
      id: "c1",
    } as never);

    await saveCheckIn("lea", checkInInput, "2026-10-30");

    expect(prisma.dailyCheckIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "lea",
        state: "fragile",
        symptoms: ["fatigue"],
        needs: ["calm", "dinner"],
        privateNote: "rien que pour moi",
        localDate: new Date("2026-10-30T00:00:00.000Z"),
      }),
    });
  });

  it("returns the stored check-in when the same operation is replayed", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.dailyCheckIn.findUnique).mockResolvedValueOnce({
      id: "already-there",
    } as never);

    const result = await saveCheckIn("lea", checkInInput, "2026-10-30");

    expect(result).toEqual({
      checkIn: { id: "already-there" },
      created: false,
    });
    expect(prisma.dailyCheckIn.create).not.toHaveBeenCalled();
    expect(prisma.dailyCheckIn.update).not.toHaveBeenCalled();
  });

  it("updates the day's check-in on a second save", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.dailyCheckIn.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "today" } as never);
    vi.mocked(prisma.dailyCheckIn.update).mockResolvedValue({
      id: "today",
    } as never);

    const result = await saveCheckIn("lea", checkInInput, "2026-10-30");

    expect(result.created).toBe(false);
    expect(prisma.dailyCheckIn.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "today" } }),
    );
  });
});

describe("cycle", () => {
  it("never lets the partner declare her period", async () => {
    profile("supporter");
    await expect(
      startPeriod("tom", "2026-10-30", "2026-10-30"),
    ).rejects.toMatchObject({
      code: "cycle_owner_only",
    });
  });

  it("refuses a period declared in the future", async () => {
    profile("cycle_owner");
    await expect(
      startPeriod("lea", "2026-11-02", "2026-10-30"),
    ).rejects.toMatchObject({
      code: "future_date",
    });
  });
});

describe("couple link", () => {
  it("creates an owner invitation with a hashed code only", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.coupleLink.create).mockResolvedValue({} as never);

    const { code } = await createInvite("lea");

    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/u);
    const data = vi.mocked(prisma.coupleLink.create).mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      ownerId: "lea",
      invitedByRole: "cycle_owner",
    });
    expect(JSON.stringify(data)).not.toContain(code.replace("-", ""));
  });

  it("refuses to invite while already in an active duo", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue({
      id: "link",
      status: "active",
    } as never);
    await expect(createInvite("lea")).rejects.toMatchObject({
      code: "already_linked",
    });
  });

  it("refuses a code coming from someone on the same side", async () => {
    profile("cycle_owner");
    vi.mocked(prisma.coupleLink.findUnique).mockResolvedValue({
      id: "link",
      status: "invited",
      ownerId: "other",
      supporterId: null,
      invitedByRole: "cycle_owner",
      inviteExpiresAt: new Date(Date.now() + 60_000),
    } as never);
    await expect(acceptInvite("lea", "ABCDEFGH")).rejects.toMatchObject({
      code: "same_role",
    });
  });

  it("refuses an expired code and one's own code", async () => {
    profile("supporter");
    vi.mocked(prisma.coupleLink.findUnique).mockResolvedValueOnce({
      status: "invited",
      inviteExpiresAt: new Date(Date.now() - 1),
    } as never);
    await expect(acceptInvite("tom", "ABCDEFGH")).rejects.toMatchObject({
      code: "invalid_code",
    });
    vi.mocked(prisma.coupleLink.findUnique).mockResolvedValueOnce({
      status: "invited",
      ownerId: null,
      supporterId: "tom",
      invitedByRole: "supporter",
      inviteExpiresAt: new Date(Date.now() + 60_000),
    } as never);
    await expect(acceptInvite("tom", "ABCDEFGH")).rejects.toMatchObject({
      code: "self_invite",
    });
  });

  it("activates the link for the complementary side and notifies the inviter", async () => {
    profile("supporter");
    vi.mocked(prisma.coupleLink.findUnique).mockResolvedValue({
      id: "link-1",
      status: "invited",
      ownerId: "lea",
      supporterId: null,
      invitedByRole: "cycle_owner",
      inviteExpiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.coupleLink.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.coupleLink.findUniqueOrThrow).mockResolvedValue({
      id: "link-1",
    } as never);

    await acceptInvite("tom", "ABCDEFGH");

    expect(prisma.coupleLink.updateMany).toHaveBeenCalledWith({
      where: { id: "link-1", status: "invited" },
      data: expect.objectContaining({
        status: "active",
        supporterId: "tom",
        inviteCodeDigest: null,
      }),
    });
    expect(mocks.queuePartnerNotification).toHaveBeenCalledWith(
      "link-accepted:link-1:lea",
    );
  });

  it("lets only the cycle owner change what is shared", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(null);
    await expect(
      updateSharing("tom", {
        level: "cycle_only",
        shareSymptoms: false,
        detailedPreviews: false,
      }),
    ).rejects.toMatchObject({ code: "no_link" });
    expect(prisma.coupleLink.findFirst).toHaveBeenCalledWith({
      where: { ownerId: "tom", status: "active" },
    });
  });

  it("lets either member end the link and tells the other one neutrally", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue({
      id: "link-1",
      ownerId: "lea",
      supporterId: "tom",
    } as never);

    await endLink("tom");

    expect(prisma.coupleLink.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "link-1" },
        data: expect.objectContaining({ status: "ended", endedById: "tom" }),
      }),
    );
    expect(mocks.queuePartnerNotification).toHaveBeenCalledWith(
      "link-ended:link-1:lea",
    );
  });
});

describe("gestures", () => {
  it("requires an active link where the sender is the supporter", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(null);
    await expect(
      sendGesture("lea", {
        operationId: "operation-0002",
        checkInId: null,
        kind: "dinner",
      }),
    ).rejects.toMatchObject({ code: "no_link" });
  });

  it("rejects gestures on a check-in hidden by the sharing level", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue({
      id: "link-1",
      ownerId: "lea",
      level: "cycle_only",
      pausedUntil: null,
    } as never);
    vi.mocked(prisma.gesture.findUnique).mockResolvedValue(null);
    await expect(
      sendGesture("tom", {
        operationId: "operation-0003",
        checkInId: "check-1",
        kind: "dinner",
      }),
    ).rejects.toMatchObject({ code: "check_in_not_visible" });
  });

  it("refuses unknown gesture kinds", async () => {
    await expect(
      sendGesture("tom", {
        operationId: "operation-0004",
        checkInId: null,
        kind: "nope",
      }),
    ).rejects.toMatchObject({ code: "unknown_gesture" });
  });
});

describe("partner view", () => {
  it("never selects the private note and logs the view without content", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue({
      id: "link-1",
      ownerId: "lea",
      supporterId: "tom",
      level: "cycle_state_needs",
      shareSymptoms: false,
      pausedUntil: null,
    } as never);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      name: "Léa Martin",
      profile: {
        role: "cycle_owner",
        displayName: "Léa",
        onboardedAt: new Date(),
      },
      preferences: { timezone: "Europe/Paris" },
    } as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.period.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyCheckIn.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyCheckIn.findUnique).mockResolvedValue({
      id: "check-1",
      state: "hard",
      symptoms: ["cramps"],
      needs: ["calm"],
      updatedAt: new Date("2026-10-30T10:00:00Z"),
    } as never);
    vi.mocked(prisma.accessLog.findFirst).mockResolvedValue(null);

    const view = await readPartnerView("tom", new Date("2026-10-30T12:00:00Z"));

    const select = vi.mocked(prisma.dailyCheckIn.findUnique).mock.calls[0]?.[0]
      .select as Record<string, boolean>;
    expect(select.privateNote).toBeUndefined();
    expect(view).toMatchObject({
      status: "active",
      ownerName: "Léa",
      today: { stateLabel: "Difficile", symptoms: [] },
    });
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: {
        ownerId: "lea",
        actorId: "tom",
        linkId: "link-1",
        action: "viewed",
        resourceKind: "partner_view",
      },
    });
  });

  it("returns nothing without an active link", async () => {
    vi.mocked(prisma.coupleLink.findFirst).mockResolvedValue(null);
    await expect(readPartnerView("tom")).resolves.toBeNull();
  });
});
