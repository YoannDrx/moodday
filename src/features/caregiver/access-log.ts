import type { Prisma } from "@/generated/prisma";

export const CAREGIVER_ACCESS_WINDOW_MS = 15 * 60 * 1000;

export const CAREGIVER_ACCESS_RESOURCES = {
  sharedSpace: "shared_space",
} as const;

export type CaregiverAccessResource =
  (typeof CAREGIVER_ACCESS_RESOURCES)[keyof typeof CAREGIVER_ACCESS_RESOURCES];

type ActiveCaregiverRelationship = {
  id: string;
  patientId: string;
};

type CaregiverAccessLogWriter = Pick<
  Prisma.TransactionClient,
  "caregiverAccessLog"
>;

export const getCaregiverAccessBucket = (now: Date) =>
  new Date(
    Math.floor(now.getTime() / CAREGIVER_ACCESS_WINDOW_MS) *
      CAREGIVER_ACCESS_WINDOW_MS,
  );

export const buildCaregiverAccessKey = (params: {
  relationshipId: string;
  resource: CaregiverAccessResource;
  now: Date;
}) =>
  [
    params.relationshipId,
    params.resource,
    getCaregiverAccessBucket(params.now).toISOString(),
  ].join(":");

/**
 * Records only the fact that a shared caregiver space was opened. This audit
 * write intentionally accepts no medical value, free-form text or request
 * metadata, which keeps sensitive content out of the access trail by design.
 */
export const recordCaregiverSharedSpaceAccess = async (params: {
  client: CaregiverAccessLogWriter;
  caregiverId: string;
  relationships: ActiveCaregiverRelationship[];
  now?: Date;
}) => {
  if (params.relationships.length === 0) return 0;

  const now = params.now ?? new Date();
  const resource = CAREGIVER_ACCESS_RESOURCES.sharedSpace;
  const result = await params.client.caregiverAccessLog.createMany({
    data: params.relationships.map((relationship) => ({
      patientId: relationship.patientId,
      caregiverId: params.caregiverId,
      relationshipId: relationship.id,
      resource,
      accessKey: buildCaregiverAccessKey({
        relationshipId: relationship.id,
        resource,
        now,
      }),
      accessedAt: now,
    })),
    skipDuplicates: true,
  });

  return result.count;
};
