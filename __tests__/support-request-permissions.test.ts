import { beforeEach, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSupportRequest,
  listSupportRequests,
  respondToSupportRequest,
} from "@/features/v2/support-requests/service";
const now = new Date("2026-10-02T12:00:00Z");
const row = {
  id: "request",
  patientId: "patient",
  caregiverId: "caregiver",
  relationshipId: "relationship",
  status: "pending",
  createdAt: now,
  updatedAt: now,
  requestedFor: null,
  respondedAt: null,
  completedAt: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    callback(prisma),
  );
});
it("requires an active accepted permission before sending a request and retries idempotently", async () => {
  const input = {
    operationId: "operation",
    relationshipId: "relationship",
    kind: "presence" as const,
  };
  vi.mocked(prisma.supportRequest.findUnique).mockResolvedValue(row as never);
  expect(await createSupportRequest("patient", input)).toMatchObject({
    id: "request",
  });
  expect(prisma.circleRelationship.findFirst).not.toHaveBeenCalled();
  vi.mocked(prisma.supportRequest.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.circleRelationship.findFirst).mockResolvedValue(null);
  await expect(createSupportRequest("patient", input)).rejects.toThrow();
  expect(prisma.supportRequest.create).not.toHaveBeenCalled();
  vi.mocked(prisma.circleRelationship.findFirst).mockResolvedValue({
    id: "relationship",
    caregiverId: "caregiver",
  } as never);
  vi.mocked(prisma.supportRequest.create).mockResolvedValue(row as never);
  await createSupportRequest("patient", {
    ...input,
    message: "Synthetic",
    requestedFor: now.toISOString(),
  });
  expect(prisma.supportRequest.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        patientId: "patient",
        caregiverId: "caregiver",
        requestedFor: now,
      }),
    }),
  );
  expect(prisma.circleRelationship.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        patientId: "patient",
        status: "active",
        revokedAt: null,
        contracts: expect.objectContaining({
          some: expect.objectContaining({
            permissions: { has: "support_requests" },
          }),
        }),
      }),
    }),
  );
});
it.each(["accepted", "declined", "completed"] as const)(
  "checks the previous state and logs a %s response",
  async (status) => {
    const input = {
      caregiverId: "caregiver",
      supportRequestId: "request",
      status,
      requestId: "trace",
    };
    vi.mocked(prisma.supportRequest.findFirst).mockResolvedValue(null);
    await expect(respondToSupportRequest(input)).rejects.toThrow();
    vi.mocked(prisma.supportRequest.findFirst).mockResolvedValue({
      ...row,
      status: "completed",
    } as never);
    await expect(respondToSupportRequest(input)).rejects.toThrow();
    vi.mocked(prisma.supportRequest.findFirst).mockResolvedValue({
      ...row,
      status: status === "completed" ? "accepted" : "pending",
    } as never);
    vi.mocked(prisma.supportRequest.update).mockResolvedValue({
      ...row,
      status,
      respondedAt: now,
      completedAt: now,
    } as never);
    expect(await respondToSupportRequest(input)).toMatchObject({
      status,
      respondedAt: now.toISOString(),
      completedAt: now.toISOString(),
    });
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: {
        patientId: "patient",
        actorId: "caregiver",
        relationshipId: "relationship",
        action: "responded",
        resourceKind: "support_request",
        requestId: "trace",
      },
    });
  },
);
it("lists only owned requests or requests with a still-active caregiver contract", async () => {
  vi.mocked(prisma.supportRequest.findMany).mockResolvedValue([
    { ...row, requestedFor: now },
  ] as never);
  expect(await listSupportRequests("caregiver")).toMatchObject([
    { requestedFor: now.toISOString() },
  ]);
  expect(prisma.supportRequest.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      take: 100,
      where: {
        OR: [
          { patientId: "caregiver" },
          expect.objectContaining({
            caregiverId: "caregiver",
            relationship: expect.objectContaining({
              is: expect.objectContaining({ revokedAt: null }),
            }),
          }),
        ],
      },
    }),
  );
});
