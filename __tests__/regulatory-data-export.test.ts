import { buildRegulatoryDataExport } from "@/features/account/regulatory-data-export";
import { buildUserDataExport } from "@/features/account/user-data-export";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/account/user-data-export", () => ({
  buildUserDataExport: vi.fn(),
}));

describe("buildRegulatoryDataExport", () => {
  beforeEach(() => {
    vi.mocked(buildUserDataExport).mockReset();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "subject-1",
    } as never);
    vi.mocked(buildUserDataExport).mockResolvedValue({
      exportMetadata: { dataVersion: "2.2" },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
    const emptyFindMany = [
      prisma.userConsent,
      prisma.session,
      prisma.account,
      prisma.passkey,
      prisma.pushSubscription,
      prisma.caregiverRelationship,
      prisma.caregiverObservation,
      prisma.caregiverEvent,
      prisma.caregiverAccessLog,
      prisma.medication,
      prisma.moodTagDefinition,
      prisma.consultationPreparation,
      prisma.aIUsage,
      prisma.notificationDelivery,
      prisma.emailLog,
      prisma.feedback,
    ];
    for (const model of emptyFindMany) {
      vi.mocked(model.findMany).mockResolvedValue([] as never);
    }
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
  });

  it("includes hidden caregiver contributions only in the controlled export", async () => {
    vi.mocked(prisma.caregiverObservation.findMany).mockResolvedValue([
      { id: "hidden-observation", visibleToPatient: false },
    ] as never);

    const result = await buildRegulatoryDataExport("subject-1");

    expect(buildUserDataExport).toHaveBeenCalledWith({ id: "subject-1" });
    expect(prisma.caregiverObservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ subjectId: "subject-1" }, { observerId: "subject-1" }],
        },
      }),
    );
    expect(result.regulatoryData.caregiverCircle.observations).toEqual([
      expect.objectContaining({ id: "hidden-observation" }),
    ]);
    expect(result.regulatoryExportMetadata.scope).toBe(
      "controlled-regulatory-export",
    );
  });

  it("selects activity metadata without authentication or push secrets", async () => {
    await buildRegulatoryDataExport("subject-1");

    const sessionSelect = vi.mocked(prisma.session.findMany).mock.calls[0]?.[0]
      ?.select;
    const accountSelect = vi.mocked(prisma.account.findMany).mock.calls[0]?.[0]
      ?.select;
    const passkeySelect = vi.mocked(prisma.passkey.findMany).mock.calls[0]?.[0]
      ?.select;
    const pushSelect = vi.mocked(prisma.pushSubscription.findMany).mock
      .calls[0]?.[0]?.select;

    expect(sessionSelect).not.toHaveProperty("token");
    expect(accountSelect).not.toHaveProperty("password");
    expect(accountSelect).not.toHaveProperty("accessToken");
    expect(accountSelect).not.toHaveProperty("refreshToken");
    expect(passkeySelect).not.toHaveProperty("publicKey");
    expect(passkeySelect).not.toHaveProperty("credentialID");
    expect(pushSelect).not.toHaveProperty("endpoint");
    expect(pushSelect).not.toHaveProperty("auth");
    expect(pushSelect).not.toHaveProperty("p256dh");
  });

  it("refuses to generate an empty artifact for an unknown subject", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(buildRegulatoryDataExport("missing")).rejects.toThrow(
      "Regulatory export subject not found",
    );
    expect(buildUserDataExport).not.toHaveBeenCalled();
  });
});
