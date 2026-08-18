import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/billing/entitlements";
import type { CaregiverPermission } from "./permissions";
import {
  hasCaregiverWritePermission,
  isCaregiverRelationshipReadOnly,
} from "./permissions";

type CaregiverAuthorizationClient = Pick<
  Prisma.TransactionClient,
  "caregiverRelationship" | "subscription"
>;

export const authorizeCaregiverRelationship = async (params: {
  relationshipId: string;
  caregiverId: string;
  permission: CaregiverPermission | readonly CaregiverPermission[];
  enforceWriteAccess?: boolean;
  client?: CaregiverAuthorizationClient;
  now?: Date;
}) => {
  const client = params.client ?? prisma;
  const now = params.now ?? new Date();
  const relationship = await client.caregiverRelationship.findUnique({
    where: { id: params.relationshipId },
  });

  if (
    !relationship ||
    relationship.status !== "active" ||
    relationship.revokedAt ||
    relationship.caregiverId !== params.caregiverId ||
    (relationship.accessExpiresAt && relationship.accessExpiresAt <= now) ||
    !(typeof params.permission === "string"
      ? relationship.permissions.includes(params.permission)
      : params.permission.some((permission) =>
          relationship.permissions.includes(permission),
        ))
  ) {
    throw new Error("Caregiver access is unavailable");
  }

  const [subscription, orderedRelationships] = await Promise.all([
    client.subscription.findUnique({
      where: { referenceId: relationship.patientId },
    }),
    client.caregiverRelationship.findMany({
      where: {
        patientId: relationship.patientId,
        status: { in: ["pending", "active"] },
        revokedAt: null,
        OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: now } }],
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);
  const readOnly = isCaregiverRelationshipReadOnly({
    relationshipId: relationship.id,
    orderedRelationshipIds: orderedRelationships.map(({ id }) => id),
    caregiverLimit: getEntitlements(subscription).caregiverLimit,
  });

  const requestedPermissions =
    typeof params.permission === "string"
      ? [params.permission]
      : params.permission;
  if (
    readOnly &&
    params.enforceWriteAccess &&
    hasCaregiverWritePermission(requestedPermissions)
  ) {
    throw new Error("Caregiver relationship is read-only");
  }

  return { relationship, readOnly };
};
