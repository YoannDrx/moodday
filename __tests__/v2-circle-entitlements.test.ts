import { prisma } from "@/lib/prisma";
import {
  authorizeCircleAccess,
  CircleAccessDeniedError,
  createCircleInvitation,
  previewCircleInvitation,
  revokeCircleRelationship,
} from "@/features/v2/circle/service";
import { getV2PlusEntitlement } from "@/features/v2/entitlements/service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_SECRET:
      "circle-tests-only-secret-with-at-least-thirty-two-characters",
  },
}));

const createdAt = new Date("2026-08-22T08:00:00.000Z");
const expiresAt = new Date("2026-09-21T08:00:00.000Z");
const relationship = {
  id: "relationship-1",
  invitationEmail: "proche@example.com",
  displayName: "Camille",
  caregiverId: null,
  status: "invited" as const,
  expiresAt,
  acceptedAt: null,
  revokedAt: null,
  createdAt,
  updatedAt: createdAt,
  contracts: [{ permissions: ["support_requests" as const] }],
};

describe("Mood Day V2 Circle and entitlements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores only an invitation digest and replays a stable invitation token", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.circleRelationship.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.circleRelationship.create).mockResolvedValue(
      relationship as never,
    );

    const input = {
      operationId: "operation-circle-1",
      relationshipId: "relationship-1",
      invitationEmail: " Proche@Example.com ",
      displayName: "Camille",
      permissions: ["support_requests" as const],
      durationDays: 30,
    };
    const first = await createCircleInvitation("patient-1", input);

    vi.mocked(prisma.circleRelationship.findUnique).mockResolvedValueOnce(
      relationship as never,
    );
    const replay = await createCircleInvitation("patient-1", input);

    expect(first.invitationToken).toBe(replay.invitationToken);
    expect(first.invitationToken).toMatch(/^moodday_circle_v1\./);
    expect(prisma.circleRelationship.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invitationEmail: "proche@example.com",
          invitationTokenDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(
      vi.mocked(prisma.circleRelationship.create).mock.calls[0]?.[0]?.data,
    ).not.toHaveProperty("invitationToken");
  });

  it("revokes the relationship and every live contract in one transaction", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.circleRelationship.findFirst).mockResolvedValue({
      id: "relationship-1",
      caregiverId: "caregiver-1",
      revokedAt: null,
    } as never);
    vi.mocked(prisma.circleRelationship.update).mockResolvedValue({} as never);
    vi.mocked(prisma.accessLog.create).mockResolvedValue({} as never);

    await revokeCircleRelationship({
      patientId: "patient-1",
      relationshipId: "relationship-1",
      requestId: "request-1",
    });

    expect(prisma.circleRelationship.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "relationship-1" },
        data: expect.objectContaining({
          status: "revoked",
          contracts: {
            updateMany: {
              where: { revokedAt: null },
              data: { revokedAt: expect.any(Date) },
            },
          },
        }),
      }),
    );
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "revoked",
        resourceKind: "share_contract",
      }),
    });
  });

  it("checks the live contract again before caregiver access", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.circleRelationship.findFirst).mockResolvedValue(null);

    await expect(
      authorizeCircleAccess({
        caregiverId: "caregiver-1",
        patientId: "patient-1",
        permission: "mood_summary",
        resourceKind: "mood_summary",
      }),
    ).rejects.toBeInstanceOf(CircleAccessDeniedError);
    expect(prisma.accessLog.create).not.toHaveBeenCalled();
    expect(prisma.circleRelationship.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
          revokedAt: null,
          contracts: {
            some: expect.objectContaining({
              acceptedAt: { not: null },
              revokedAt: null,
              permissions: { has: "mood_summary" },
            }),
          },
        }),
      }),
    );
  });

  it("does not preview a contract for an unknown or mismatched invitation", async () => {
    vi.mocked(prisma.circleRelationship.findUnique).mockResolvedValue(null);

    await expect(
      previewCircleInvitation({
        caregiverEmail: "autre@example.com",
        invitationToken:
          "moodday_circle_v1.token-that-is-long-enough-for-the-contract",
      }),
    ).rejects.toBeInstanceOf(CircleAccessDeniedError);
  });

  it("projects all active purchase sources without trusting a client flag", async () => {
    vi.mocked(prisma.subscriptionSource.findMany).mockResolvedValue([
      {
        provider: "stripe",
        status: "active",
        currentPeriodEndsAt: new Date("2026-09-22T00:00:00.000Z"),
      },
      {
        provider: "app_store",
        status: "active",
        currentPeriodEndsAt: new Date("2026-10-22T00:00:00.000Z"),
      },
    ] as never);

    await expect(
      getV2PlusEntitlement("user-1", new Date("2026-08-22T00:00:00.000Z")),
    ).resolves.toMatchObject({
      active: true,
      duplicateSubscription: true,
      sourceProviders: ["stripe", "app_store"],
      manageWith: null,
    });
    expect(prisma.subscriptionSource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });
});
