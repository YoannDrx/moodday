import { z } from "zod";

export const caregiverPermissionValues = [
  "view_mood",
  "view_medications",
  "add_observations",
  "add_events",
] as const;

export const CaregiverPermissionSchema = z.enum(caregiverPermissionValues);
export const CaregiverPermissionsSchema = z.array(CaregiverPermissionSchema);

export type CaregiverPermission = z.infer<typeof CaregiverPermissionSchema>;

const caregiverWritePermissions = new Set<string>([
  "add_observations",
  "add_events",
]);

export const isCaregiverRelationshipReadOnly = (params: {
  relationshipId: string;
  orderedRelationshipIds: string[];
  caregiverLimit: number;
}) => {
  const relationshipIndex = params.orderedRelationshipIds.indexOf(
    params.relationshipId,
  );

  return (
    relationshipIndex >= 0 &&
    relationshipIndex >= Math.max(0, params.caregiverLimit)
  );
};

export const hasCaregiverWritePermission = (permissions: readonly string[]) =>
  permissions.some((permission) => caregiverWritePermissions.has(permission));

export const getEffectiveCaregiverPermissions = (
  permissions: readonly string[],
  readOnly: boolean,
) =>
  readOnly
    ? permissions.filter(
        (permission) => !caregiverWritePermissions.has(permission),
      )
    : permissions;

type RelationshipAccess = {
  patientId: string;
  caregiverId: string | null;
  status: string;
  permissions: string[];
  accessExpiresAt?: Date | null;
  revokedAt?: Date | null;
};

export const hasActiveCaregiverPermission = (params: {
  relationship: RelationshipAccess | null;
  caregiverId: string;
  patientId: string;
  permission: CaregiverPermission;
}) => {
  const { relationship, caregiverId, patientId, permission } = params;

  return Boolean(
    relationship?.status === "active" &&
      !relationship.revokedAt &&
      (!relationship.accessExpiresAt ||
        relationship.accessExpiresAt > new Date()) &&
      relationship.caregiverId === caregiverId &&
      relationship.patientId === patientId &&
      relationship.permissions.includes(permission),
  );
};

export const canManageCaregiverRelationship = (params: {
  relationship: Pick<RelationshipAccess, "patientId"> | null;
  userId: string;
}) => params.relationship?.patientId === params.userId;

export const canLeaveCaregiverRelationship = (params: {
  relationship: Pick<RelationshipAccess, "patientId" | "caregiverId"> | null;
  userId: string;
}) =>
  Boolean(
    params.relationship?.patientId === params.userId ||
      params.relationship?.caregiverId === params.userId,
  );
