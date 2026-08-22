import type {
  CreateSupportRequestInput,
  SupportRequestDto,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CircleAccessDeniedError } from "../circle/service";

const supportRequestSelection = {
  id: true,
  patientId: true,
  caregiverId: true,
  relationshipId: true,
  operationId: true,
  kind: true,
  message: true,
  status: true,
  requestedFor: true,
  respondedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedSupportRequest = Prisma.SupportRequestGetPayload<{
  select: typeof supportRequestSelection;
}>;

const toSupportRequestDto = (
  request: SelectedSupportRequest,
): SupportRequestDto => ({
  ...request,
  requestedFor: request.requestedFor?.toISOString() ?? null,
  respondedAt: request.respondedAt?.toISOString() ?? null,
  completedAt: request.completedAt?.toISOString() ?? null,
  createdAt: request.createdAt.toISOString(),
  updatedAt: request.updatedAt.toISOString(),
});

export const createSupportRequest = async (
  patientId: string,
  input: CreateSupportRequestInput,
) =>
  prisma.$transaction(async (transaction) => {
    const existing = await transaction.supportRequest.findUnique({
      where: {
        patientId_operationId: {
          patientId,
          operationId: input.operationId,
        },
      },
      select: supportRequestSelection,
    });
    if (existing) return toSupportRequestDto(existing);

    const now = new Date();
    const relationship = await transaction.circleRelationship.findFirst({
      where: {
        id: input.relationshipId,
        patientId,
        caregiverId: { not: null },
        status: "active",
        revokedAt: null,
        expiresAt: { gt: now },
        contracts: {
          some: {
            acceptedAt: { not: null },
            revokedAt: null,
            startsAt: { lte: now },
            expiresAt: { gt: now },
            permissions: { has: "support_requests" },
          },
        },
      },
      select: { id: true, caregiverId: true },
    });
    if (!relationship?.caregiverId) throw new CircleAccessDeniedError();

    const request = await transaction.supportRequest.create({
      data: {
        patientId,
        caregiverId: relationship.caregiverId,
        relationshipId: relationship.id,
        operationId: input.operationId,
        kind: input.kind,
        message: input.message ?? null,
        requestedFor: input.requestedFor ? new Date(input.requestedFor) : null,
      },
      select: supportRequestSelection,
    });
    return toSupportRequestDto(request);
  });

export const listSupportRequests = async (userId: string) => {
  const now = new Date();
  const requests = await prisma.supportRequest.findMany({
    where: {
      OR: [
        { patientId: userId },
        {
          caregiverId: userId,
          relationship: {
            is: {
              status: "active",
              revokedAt: null,
              expiresAt: { gt: now },
              contracts: {
                some: {
                  acceptedAt: { not: null },
                  revokedAt: null,
                  startsAt: { lte: now },
                  expiresAt: { gt: now },
                  permissions: { has: "support_requests" },
                },
              },
            },
          },
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    select: supportRequestSelection,
  });
  return requests.map(toSupportRequestDto);
};

export const respondToSupportRequest = async ({
  caregiverId,
  supportRequestId,
  status,
  requestId,
}: {
  caregiverId: string;
  supportRequestId: string;
  status: "accepted" | "declined" | "completed";
  requestId?: string;
}) =>
  prisma.$transaction(async (transaction) => {
    const now = new Date();
    const existing = await transaction.supportRequest.findFirst({
      where: {
        id: supportRequestId,
        caregiverId,
        relationship: {
          is: {
            status: "active",
            revokedAt: null,
            expiresAt: { gt: now },
            contracts: {
              some: {
                acceptedAt: { not: null },
                revokedAt: null,
                startsAt: { lte: now },
                expiresAt: { gt: now },
                permissions: { has: "support_requests" },
              },
            },
          },
        },
      },
      select: {
        patientId: true,
        relationshipId: true,
        status: true,
      },
    });
    if (!existing?.relationshipId) throw new CircleAccessDeniedError();
    if (
      (status === "completed" && existing.status !== "accepted") ||
      (status !== "completed" && existing.status !== "pending")
    ) {
      throw new CircleAccessDeniedError();
    }

    const updated = await transaction.supportRequest.update({
      where: { id: supportRequestId },
      data: {
        status,
        respondedAt: status === "completed" ? undefined : now,
        completedAt: status === "completed" ? now : undefined,
      },
      select: supportRequestSelection,
    });
    await transaction.accessLog.create({
      data: {
        patientId: existing.patientId,
        actorId: caregiverId,
        relationshipId: existing.relationshipId,
        action: "responded",
        resourceKind: "support_request",
        requestId,
      },
    });
    return toSupportRequestDto(updated);
  });
