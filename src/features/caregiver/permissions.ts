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

type RelationshipAccess = {
  patientId: string;
  caregiverId: string | null;
  status: string;
  permissions: string[];
};

export const hasActiveCaregiverPermission = (params: {
  relationship: RelationshipAccess | null;
  caregiverId: string;
  patientId: string;
  permission: CaregiverPermission;
}) => {
  const { relationship, caregiverId, patientId, permission } = params;

  return Boolean(
    relationship &&
      relationship.status === "active" &&
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
    params.relationship &&
      (params.relationship.patientId === params.userId ||
        params.relationship.caregiverId === params.userId),
  );
