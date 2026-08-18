import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mail/send-email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/server-url", () => ({
  getServerUrl: () => "https://moodday.example",
}));
vi.mock("@email/caregiver/access-digest", () => ({
  default: (props: unknown) => props,
}));
vi.mock("@/lib/env", () => ({
  env: { LEGAL_PRIVACY_VERSION: "privacy-test" },
}));

import {
  getCaregiverAccessDigestWindow,
  sendCaregiverAccessDigests,
} from "@/features/caregiver/access-digest";

const NOW = new Date("2026-08-14T12:00:00.000Z");

const candidate = (overrides: Record<string, unknown> = {}) => ({
  userId: "patient-1",
  locale: "fr",
  caregiverAccessDigestFrequency: "daily",
  lastCaregiverAccessDigestSentAt: new Date("2026-08-12T12:00:00.000Z"),
  user: { email: "patient@example.test" },
  ...overrides,
});

describe("caregiver access digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendEmail).mockResolvedValue({
      error: null,
      data: { id: "email-1" },
    });
    vi.mocked(prisma.userPreferences.update).mockResolvedValue({} as never);
  });

  it("uses bounded daily and weekly windows and rejects invalid or premature runs", () => {
    expect(
      getCaregiverAccessDigestWindow({
        frequency: "daily",
        lastSentAt: null,
        now: NOW,
      }),
    ).toEqual({
      frequency: "daily",
      since: new Date("2026-08-13T12:00:00.000Z"),
    });
    expect(
      getCaregiverAccessDigestWindow({
        frequency: "weekly",
        lastSentAt: new Date("2026-08-07T11:59:59.000Z"),
        now: NOW,
      }),
    ).toEqual({
      frequency: "weekly",
      since: new Date("2026-08-07T11:59:59.000Z"),
    });
    expect(
      getCaregiverAccessDigestWindow({
        frequency: "weekly",
        lastSentAt: new Date("2026-08-13T12:00:00.000Z"),
        now: NOW,
      }),
    ).toBeNull();
    expect(
      getCaregiverAccessDigestWindow({
        frequency: "monthly",
        lastSentAt: null,
        now: NOW,
      }),
    ).toBeNull();
  });

  it("sends only content-free counts and advances each cursor after delivery", async () => {
    vi.mocked(prisma.userPreferences.findMany).mockResolvedValue([
      candidate(),
      candidate({
        userId: "patient-2",
        locale: "en",
        caregiverAccessDigestFrequency: "weekly",
        lastCaregiverAccessDigestSentAt: null,
        user: { email: "second@example.test" },
      }),
    ] as never);
    vi.mocked(prisma.caregiverAccessLog.count)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.caregiverAccessLog.findMany)
      .mockResolvedValueOnce([
        { caregiverId: "caregiver-1" },
        { caregiverId: "caregiver-2" },
      ] as never)
      .mockResolvedValueOnce([]);

    await expect(sendCaregiverAccessDigests(NOW)).resolves.toEqual({
      examined: 2,
      sent: 1,
      withoutNewAccess: 1,
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: "patient@example.test",
      subject: "Nouveaux accès à votre espace partagé Moodday",
      html: expect.objectContaining({
        locale: "fr",
        accessCount: 3,
        caregiverCount: 2,
        caregiverUrl: "https://moodday.example/caregiver",
      }),
      tracking: {
        template: "caregiver-access-digest",
        userId: "patient-1",
      },
    });
    expect(prisma.userPreferences.update).toHaveBeenCalledOnce();
    expect(prisma.userPreferences.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          caregiverAccessDigestEnabled: true,
          user: expect.objectContaining({ emailVerified: true }),
        }),
        take: 100,
      }),
    );
  });

  it("keeps the cursor unchanged and fails the batch when delivery fails", async () => {
    vi.mocked(prisma.userPreferences.findMany).mockResolvedValue([
      candidate({ locale: "en" }),
    ] as never);
    vi.mocked(prisma.caregiverAccessLog.count).mockResolvedValue(1);
    vi.mocked(prisma.caregiverAccessLog.findMany).mockResolvedValue([
      { caregiverId: "caregiver-1" },
    ] as never);
    vi.mocked(sendEmail).mockResolvedValue({
      error: new Error("provider unavailable"),
      data: null,
    });

    await expect(sendCaregiverAccessDigests(NOW)).rejects.toMatchObject({
      name: "caregiver_access_digest_batch_failed",
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New access to your Moodday shared space",
      }),
    );
    expect(prisma.userPreferences.update).not.toHaveBeenCalled();
  });
});
