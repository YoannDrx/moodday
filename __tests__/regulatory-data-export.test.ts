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
      exportMetadata: { dataVersion: "2.3" },
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
      prisma.device,
      prisma.notificationDelivery,
      prisma.emailLog,
    ];
    for (const model of emptyFindMany) {
      vi.mocked(model.findMany).mockResolvedValue([] as never);
    }
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
  });

  it("wraps the product export with device metadata but never push tokens", async () => {
    vi.mocked(prisma.device.findMany).mockResolvedValue([
      { id: "device-1", platform: "ios" },
    ] as never);

    const result = await buildRegulatoryDataExport("subject-1");

    expect(buildUserDataExport).toHaveBeenCalledWith({ id: "subject-1" });
    const select = vi.mocked(prisma.device.findMany).mock.calls[0]?.[0]
      ?.select as Record<string, boolean>;
    expect(select.pushToken).toBeUndefined();
    expect(result.regulatoryData.devices).toEqual([
      expect.objectContaining({ id: "device-1" }),
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
