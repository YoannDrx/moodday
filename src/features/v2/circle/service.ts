import type {
  CircleRelationshipDto,
  CreateCircleInvitationInput,
  SharePermission,
} from "@moodday/contracts";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const circleSelection = {
  id: true,
  invitationEmail: true,
  displayName: true,
  caregiverId: true,
  status: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  contracts: {
    orderBy: { version: "desc" as const },
    take: 1,
    select: { permissions: true },
  },
} as const;

type SelectedCircleRelationship = Prisma.CircleRelationshipGetPayload<{
  select: typeof circleSelection;
}>;

export class CircleAccessDeniedError extends Error {
  constructor() {
    super("Circle access is no longer active");
    this.name = "CircleAccessDeniedError";
  }
}

const toCircleRelationshipDto = (
  relationship: SelectedCircleRelationship,
): CircleRelationshipDto => ({
  id: relationship.id,
  invitationEmail: relationship.invitationEmail,
  displayName: relationship.displayName,
  caregiverId: relationship.caregiverId,
  status: relationship.status,
  permissions: relationship.contracts[0]?.permissions ?? [],
  expiresAt: relationship.expiresAt.toISOString(),
  acceptedAt: relationship.acceptedAt?.toISOString() ?? null,
  revokedAt: relationship.revokedAt?.toISOString() ?? null,
  createdAt: relationship.createdAt.toISOString(),
  updatedAt: relationship.updatedAt.toISOString(),
});

const deriveInvitationToken = (patientId: string, operationId: string) =>
  `moodday_circle_v1.${createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${patientId}:${operationId}`)
    .digest("base64url")}`;

const digestInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const tokenMatchesDigest = (token: string, digest: string) => {
  const received = Buffer.from(digestInvitationToken(token), "hex");
  const expected = Buffer.from(digest, "hex");
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
};

export const createCircleInvitation = async (
  patientId: string,
  input: CreateCircleInvitationInput,
) => {
  const invitationToken = deriveInvitationToken(patientId, input.operationId);
  const invitationTokenDigest = digestInvitationToken(invitationToken);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + input.durationDays * 24 * 60 * 60 * 1_000,
  );

  const relationship = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.circleRelationship.findUnique({
      where: {
        patientId_operationId: {
          patientId,
          operationId: input.operationId,
        },
      },
      select: circleSelection,
    });
    if (existing) return existing;

    return transaction.circleRelationship.create({
      data: {
        id: input.relationshipId,
        patientId,
        operationId: input.operationId,
        invitationEmail: input.invitationEmail.trim().toLowerCase(),
        invitationTokenDigest,
        displayName: input.displayName ?? null,
        expiresAt,
        contracts: {
          create: {
            version: 1,
            permissions: Array.from(new Set(input.permissions)),
            startsAt: now,
            expiresAt,
          },
        },
      },
      select: circleSelection,
    });
  });

  return {
    relationship: toCircleRelationshipDto(relationship),
    invitationToken,
  };
};

export const listCircleRelationships = async (patientId: string) => {
  const relationships = await prisma.circleRelationship.findMany({
    where: { patientId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: circleSelection,
  });
  return relationships.map(toCircleRelationshipDto);
};

export const previewCircleInvitation = async ({
  caregiverEmail,
  invitationToken,
}: {
  caregiverEmail: string;
  invitationToken: string;
}) => {
  const tokenDigest = digestInvitationToken(invitationToken);
  const relationship = await prisma.circleRelationship.findUnique({
    where: { invitationTokenDigest: tokenDigest },
    select: { ...circleSelection, invitationTokenDigest: true },
  });
  const now = new Date();
  if (
    !relationship ||
    !tokenMatchesDigest(invitationToken, relationship.invitationTokenDigest) ||
    relationship.invitationEmail !== caregiverEmail.trim().toLowerCase() ||
    relationship.status !== "invited" ||
    relationship.expiresAt <= now
  ) {
    throw new CircleAccessDeniedError();
  }
  return toCircleRelationshipDto(relationship);
};

export const acceptCircleInvitation = async ({
  caregiverId,
  caregiverEmail,
  invitationToken,
}: {
  caregiverId: string;
  caregiverEmail: string;
  invitationToken: string;
}) => {
  const tokenDigest = digestInvitationToken(invitationToken);
  return prisma.$transaction(async (transaction) => {
    const relationship = await transaction.circleRelationship.findUnique({
      where: { invitationTokenDigest: tokenDigest },
      select: {
        ...circleSelection,
        patientId: true,
        invitationTokenDigest: true,
      },
    });
    const now = new Date();
    if (
      !relationship ||
      !tokenMatchesDigest(
        invitationToken,
        relationship.invitationTokenDigest,
      ) ||
      relationship.invitationEmail !== caregiverEmail.trim().toLowerCase() ||
      relationship.status !== "invited" ||
      relationship.expiresAt <= now
    ) {
      throw new CircleAccessDeniedError();
    }

    const accepted = await transaction.circleRelationship.update({
      where: { id: relationship.id },
      data: {
        caregiverId,
        status: "active",
        acceptedAt: now,
        contracts: {
          update: {
            where: {
              relationshipId_version: {
                relationshipId: relationship.id,
                version: 1,
              },
            },
            data: { acceptedAt: now },
          },
        },
      },
      select: circleSelection,
    });
    return toCircleRelationshipDto(accepted);
  });
};

export const revokeCircleRelationship = async ({
  patientId,
  relationshipId,
  requestId,
}: {
  patientId: string;
  relationshipId: string;
  requestId?: string;
}) =>
  prisma.$transaction(async (transaction) => {
    const relationship = await transaction.circleRelationship.findFirst({
      where: { id: relationshipId, patientId },
      select: { id: true, caregiverId: true, revokedAt: true },
    });
    if (!relationship) throw new CircleAccessDeniedError();
    if (relationship.revokedAt) return;

    const revokedAt = new Date();
    await transaction.circleRelationship.update({
      where: { id: relationship.id },
      data: {
        status: "revoked",
        revokedAt,
        contracts: {
          updateMany: { where: { revokedAt: null }, data: { revokedAt } },
        },
      },
    });
    await transaction.accessLog.create({
      data: {
        patientId,
        actorId: patientId,
        relationshipId: relationship.id,
        action: "revoked",
        resourceKind: "share_contract",
        requestId,
      },
    });
  });

export const authorizeCircleAccess = async ({
  caregiverId,
  patientId,
  permission,
  resourceKind,
  requestId,
}: {
  caregiverId: string;
  patientId: string;
  permission: SharePermission;
  resourceKind: string;
  requestId?: string;
}) =>
  prisma.$transaction(async (transaction) => {
    const now = new Date();
    const relationship = await transaction.circleRelationship.findFirst({
      where: {
        patientId,
        caregiverId,
        status: "active",
        revokedAt: null,
        expiresAt: { gt: now },
        contracts: {
          some: {
            acceptedAt: { not: null },
            revokedAt: null,
            startsAt: { lte: now },
            expiresAt: { gt: now },
            permissions: { has: permission },
          },
        },
      },
      select: { id: true },
    });
    if (!relationship) throw new CircleAccessDeniedError();

    await transaction.accessLog.create({
      data: {
        patientId,
        actorId: caregiverId,
        relationshipId: relationship.id,
        action: "viewed",
        resourceKind,
        requestId,
      },
    });
    return relationship;
  });
