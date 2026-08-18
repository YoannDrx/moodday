"use server";

import {
  action,
  authAction,
  sensitiveAuthAction,
} from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/mail/send-email";
import MarkdownEmail from "@email/markdown.email";
import { getServerUrl } from "@/lib/server-url";
import { getI18n } from "@/i18n/server";
import {
  canLeaveCaregiverRelationship,
  canManageCaregiverRelationship,
  CaregiverPermissionsSchema,
  getEffectiveCaregiverPermissions,
  hasCaregiverWritePermission,
  isCaregiverRelationshipReadOnly,
} from "./permissions";
import {
  CAREGIVER_ACCESS_RESOURCES,
  recordCaregiverResourceAccess,
  recordCaregiverSharedSpaceAccess,
} from "./access-log";
import { getEntitlements } from "@/lib/billing/entitlements";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertFeatureAvailable } from "@/lib/features/availability";
import { authorizeCaregiverRelationship } from "./authorization";
import { getMedicationAdherenceForUser } from "@/features/medication/adherence-service";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { addCivilDays, getSafeTimeZone } from "@/lib/temporal/civil-date";
import { getExportDateRange } from "@/features/export/date-range";
import { env } from "@/lib/env";

const ensureCaregiverAvailable = async <T>(next: () => Promise<T>) => {
  assertFeatureAvailable("caregiverSharing");
  return next();
};

const caregiverAction = authAction.use(async ({ next }) =>
  ensureCaregiverAvailable(next),
);
const sensitiveCaregiverAction = sensitiveAuthAction.use(async ({ next }) =>
  ensureCaregiverAvailable(next),
);
const publicCaregiverAction = action.use(async ({ next }) =>
  ensureCaregiverAvailable(next),
);

const caregiverDigestPreferencesSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly"]),
});

export const getCaregiverDigestPreferences = caregiverAction.action(
  async ({ ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: {
        caregiverAccessDigestEnabled: true,
        caregiverAccessDigestFrequency: true,
      },
    });

    return {
      enabled: preferences?.caregiverAccessDigestEnabled ?? true,
      frequency:
        preferences?.caregiverAccessDigestFrequency === "daily"
          ? ("daily" as const)
          : ("weekly" as const),
    };
  },
);

export const updateCaregiverDigestPreferences = caregiverAction
  .inputSchema(caregiverDigestPreferencesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        caregiverAccessDigestEnabled: parsedInput.enabled,
        caregiverAccessDigestFrequency: parsedInput.frequency,
      },
      create: {
        userId: user.id,
        caregiverAccessDigestEnabled: parsedInput.enabled,
        caregiverAccessDigestFrequency: parsedInput.frequency,
      },
    });

    return parsedInput;
  });

const getCivilWindow = (timeZone: string | null | undefined, days: number) => {
  const timezone = getSafeTimeZone(timeZone);
  const endDate = getDateKeyForTimeZone(new Date(), timezone);
  const startDate = addCivilDays(endDate, -(days - 1));
  return {
    startDate,
    endDate,
    ...getExportDateRange({ startDate, endDate, timezone }),
  };
};

// ═══════════════════════════════════════════════════════════════
// CAREGIVER RELATIONSHIP SYSTEM
// ═══════════════════════════════════════════════════════════════

// ===== Invite a Caregiver =====

const inviteCaregiverSchema = z.object({
  email: z.string().email(),
  role: z.enum(["family", "friend", "professional"]),
  label: z.string().optional(),
  permissions: CaregiverPermissionsSchema.default([
    "view_mood",
    "add_observations",
    "add_events",
  ]),
  accessExpiresAt: z.string().datetime().optional(),
  moodWindowDays: z
    .union([z.literal(7), z.literal(30), z.literal(90)])
    .default(30),
  medicationWindowDays: z
    .union([z.literal(7), z.literal(30), z.literal(90)])
    .default(30),
});

const roleLabelKeys: Record<string, string> = {
  family: "caregiver.roles.family",
  friend: "caregiver.roles.friend",
  professional: "caregiver.roles.professional",
};

const getCaregiverPlanAccess = async (relationship: {
  id: string;
  patientId: string;
}) => {
  const [subscription, orderedRelationships] = await Promise.all([
    prisma.subscription.findUnique({
      where: { referenceId: relationship.patientId },
    }),
    prisma.caregiverRelationship.findMany({
      where: {
        patientId: relationship.patientId,
        status: { in: ["pending", "active"] },
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);

  const caregiverLimit = getEntitlements(subscription).caregiverLimit;
  const readOnly = isCaregiverRelationshipReadOnly({
    relationshipId: relationship.id,
    orderedRelationshipIds: orderedRelationships.map(({ id }) => id),
    caregiverLimit,
  });

  return { caregiverLimit, readOnly };
};

const sendCaregiverInviteEmail = async (params: {
  email: string;
  inviteToken: string;
  patientName: string | null | undefined;
  role: string;
  label?: string | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) => {
  const inviteUrl = `${getServerUrl()}/invite/caregiver?token=${params.inviteToken}`;
  const patientName = params.patientName?.trim().length
    ? params.patientName
    : params.t("caregiver.inviteEmail.patientFallback");
  const roleLabel = params.t(
    roleLabelKeys[params.role] ?? "caregiver.roles.default",
  );
  const labelLine = params.label?.trim()
    ? params.t("caregiver.inviteEmail.labelLine", { label: params.label })
    : "";

  const markdown = [
    params.t("caregiver.inviteEmail.greeting"),
    "",
    params.t("caregiver.inviteEmail.intro", { patientName, roleLabel }),
    ...(labelLine ? [labelLine] : []),
    "",
    params.t("caregiver.inviteEmail.cta"),
    inviteUrl,
    "",
    params.t("caregiver.inviteEmail.ignore"),
  ].join("\n");

  await sendEmail({
    to: params.email,
    subject: params.t("caregiver.inviteEmail.subject"),
    html: MarkdownEmail({
      markdown,
      preview: params.t("caregiver.inviteEmail.preview", { patientName }),
    }),
    tracking: {
      template: "caregiver-invite",
    },
  });
};

export const inviteCaregiver = sensitiveCaregiverAction
  .inputSchema(inviteCaregiverSchema)
  .action(
    async ({
      parsedInput: {
        email: rawEmail,
        role,
        label,
        permissions,
        accessExpiresAt,
        moodWindowDays,
        medicationWindowDays,
      },
      ctx: { user },
    }) => {
      const { t, locale } = await getI18n();
      const email = rawEmail.trim().toLowerCase();
      await enforceRateLimit({
        scope: "caregiver-invite",
        identifier: user.id,
        max: 10,
        windowSeconds: 60 * 60,
      });
      // Check if user is trying to invite themselves
      if (email === user.email) {
        throw new Error(t("caregiver.errors.selfInvite"));
      }

      const inviteToken = nanoid(32);
      const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
      const result = await prisma.$transaction(
        async (transaction) => {
          const caregiverUser = await transaction.user.findUnique({
            where: { email },
            select: { id: true },
          });
          const existingRelation =
            await transaction.caregiverRelationship.findFirst({
              where: {
                patientId: user.id,
                OR: [
                  { caregiverEmail: email },
                  ...(caregiverUser ? [{ caregiverId: caregiverUser.id }] : []),
                ],
              },
            });
          const [subscription, relationshipCount] = await Promise.all([
            transaction.subscription.findUnique({
              where: { referenceId: user.id },
            }),
            transaction.caregiverRelationship.count({
              where: {
                patientId: user.id,
                status: { in: ["pending", "active"] },
                revokedAt: null,
                ...(existingRelation
                  ? { id: { not: existingRelation.id } }
                  : {}),
              },
            }),
          ]);
          const limit = getEntitlements(subscription).caregiverLimit;
          if (relationshipCount >= limit) {
            throw new Error(t("caregiver.errors.planLimitReached", { limit }));
          }
          if (existingRelation?.status === "active") {
            throw new Error(t("caregiver.errors.alreadyInCircle"));
          }
          if (
            existingRelation?.status === "pending" &&
            existingRelation.inviteExpiry &&
            existingRelation.inviteExpiry > new Date()
          ) {
            throw new Error(t("caregiver.errors.pendingInvite"));
          }

          const relationship = existingRelation
            ? await transaction.caregiverRelationship.update({
                where: { id: existingRelation.id },
                data: {
                  caregiverId: caregiverUser?.id ?? null,
                  caregiverEmail: email,
                  role,
                  label,
                  permissions,
                  status: "pending",
                  inviteToken,
                  inviteExpiry,
                  accessExpiresAt: accessExpiresAt
                    ? new Date(accessExpiresAt)
                    : null,
                  revokedAt: null,
                  revokedById: null,
                  moodWindowDays,
                  medicationWindowDays,
                },
              })
            : await transaction.caregiverRelationship.create({
                data: {
                  patientId: user.id,
                  caregiverId: caregiverUser?.id ?? null,
                  caregiverEmail: email,
                  role,
                  label,
                  permissions,
                  status: "pending",
                  inviteToken,
                  inviteExpiry,
                  accessExpiresAt: accessExpiresAt
                    ? new Date(accessExpiresAt)
                    : null,
                  moodWindowDays,
                  medicationWindowDays,
                },
              });

          await transaction.userConsent.createMany({
            data: [
              {
                userId: user.id,
                purpose: "caregiver_sharing",
                version: env.LEGAL_PRIVACY_VERSION,
                locale,
                country: env.LAUNCH_COUNTRY,
                source: "settings",
              },
            ],
            skipDuplicates: true,
          });
          return {
            id: relationship.id,
            caregiverExists: Boolean(caregiverUser),
          };
        },
        { isolationLevel: "Serializable" },
      );

      await sendCaregiverInviteEmail({
        email,
        inviteToken,
        patientName: user.name,
        role,
        label,
        t,
      });

      return {
        id: result.id,
        inviteToken,
        caregiverExists: result.caregiverExists,
      };
    },
  );

// ===== Get Invitation Info (public) =====

const inviteInfoSchema = z.object({
  inviteToken: z.string(),
});

export const getCaregiverInviteInfo = publicCaregiverAction
  .inputSchema(inviteInfoSchema)
  .action(async ({ parsedInput: { inviteToken } }) => {
    const { t } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
      include: {
        patient: { select: { name: true, email: true, image: true } },
      },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidOrExpiredInvite"));
    }

    if (relationship.inviteExpiry && relationship.inviteExpiry < new Date()) {
      throw new Error(t("caregiver.errors.inviteExpired"));
    }

    return {
      id: relationship.id,
      status: relationship.status,
      role: relationship.role,
      label: relationship.label,
      patientName: relationship.patient.name,
      patientEmail: relationship.patient.email,
      patientImage: relationship.patient.image,
      inviteExpiry: relationship.inviteExpiry?.toISOString() ?? null,
    };
  });

// ===== Accept Caregiver Invitation =====

const acceptInvitationSchema = z.object({
  inviteToken: z.string(),
});

export const acceptCaregiverInvitation = sensitiveCaregiverAction
  .inputSchema(acceptInvitationSchema)
  .action(async ({ parsedInput: { inviteToken }, ctx: { user } }) => {
    const { t, locale } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
      include: {
        patient: { select: { name: true } },
      },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidOrExpiredInvite"));
    }

    if (relationship.inviteExpiry && relationship.inviteExpiry < new Date()) {
      throw new Error(t("caregiver.errors.inviteExpired"));
    }

    if (relationship.status === "active") {
      throw new Error(t("caregiver.errors.inviteAlreadyAccepted"));
    }

    if (relationship.patientId === user.id) {
      throw new Error(t("caregiver.errors.acceptOwnInvite"));
    }

    if (
      relationship.caregiverEmail &&
      relationship.caregiverEmail !== user.email
    ) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    if (relationship.caregiverId && relationship.caregiverId !== user.id) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    const freshIdentity = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, emailVerified: true },
    });
    if (
      !freshIdentity?.emailVerified ||
      freshIdentity.email.trim().toLowerCase() !==
        relationship.caregiverEmail.trim().toLowerCase()
    ) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.caregiverRelationship.updateMany({
        where: {
          id: relationship.id,
          status: "pending",
          revokedAt: null,
          inviteToken,
        },
        data: {
          caregiverId: user.id,
          caregiverEmail: user.email,
          status: "active",
          inviteToken: null,
          inviteExpiry: null,
        },
      });
      if (updated.count !== 1) {
        throw new Error(t("caregiver.errors.invalidOrExpiredInvite"));
      }
      await transaction.userConsent.createMany({
        data: [
          {
            userId: user.id,
            purpose: "caregiver_sharing",
            version: env.LEGAL_PRIVACY_VERSION,
            locale,
            country: env.LAUNCH_COUNTRY,
            source: "settings",
          },
        ],
        skipDuplicates: true,
      });
    });

    return {
      id: relationship.id,
      patientName: relationship.patient.name,
    };
  });

// ===== Decline Caregiver Invitation =====

export const declineCaregiverInvitation = caregiverAction
  .inputSchema(acceptInvitationSchema)
  .action(async ({ parsedInput: { inviteToken }, ctx: { user } }) => {
    const { t } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidInvite"));
    }

    if (
      relationship.caregiverEmail &&
      relationship.caregiverEmail !== user.email
    ) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    if (relationship.caregiverId && relationship.caregiverId !== user.id) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    await prisma.caregiverRelationship.update({
      where: { id: relationship.id },
      data: {
        status: "declined",
        inviteToken: null,
        inviteExpiry: null,
      },
    });

    return { success: true };
  });

// ===== Get My Caregivers (as patient) =====

export const getMyCaregivers = caregiverAction.action(
  async ({ ctx: { user } }) => {
    const [relationships, subscription, orderedRelationships] =
      await Promise.all([
        prisma.caregiverRelationship.findMany({
          where: {
            patientId: user.id,
          },
          include: {
            caregiver: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.subscription.findUnique({
          where: { referenceId: user.id },
        }),
        prisma.caregiverRelationship.findMany({
          where: {
            patientId: user.id,
            status: { in: ["pending", "active"] },
          },
          select: { id: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
      ]);
    const caregiverLimit = getEntitlements(subscription).caregiverLimit;
    const orderedRelationshipIds = orderedRelationships.map(({ id }) => id);

    return relationships.map((r) => {
      const readOnlyByPlan = isCaregiverRelationshipReadOnly({
        relationshipId: r.id,
        orderedRelationshipIds,
        caregiverLimit,
      });

      return {
        id: r.id,
        caregiverId: r.caregiverId,
        caregiverName: r.caregiver?.name ?? null,
        caregiverEmail: r.caregiver?.email ?? r.caregiverEmail,
        caregiverImage: r.caregiver?.image ?? null,
        role: r.role,
        label: r.label,
        permissions: getEffectiveCaregiverPermissions(
          r.permissions,
          readOnlyByPlan,
        ),
        readOnlyByPlan,
        status: r.status,
        accessExpiresAt: r.accessExpiresAt?.toISOString() ?? null,
        revokedAt: r.revokedAt?.toISOString() ?? null,
        moodWindowDays: r.moodWindowDays,
        medicationWindowDays: r.medicationWindowDays,
        createdAt: r.createdAt.toISOString(),
      };
    });
  },
);

// ===== Get My Patients (as caregiver) =====

export const getMyPatients = caregiverAction.action(
  async ({ ctx: { user } }) => {
    const relationships = await prisma.$transaction(async (tx) => {
      const activeRelationships = await tx.caregiverRelationship.findMany({
        where: {
          caregiverId: user.id,
          status: "active",
          revokedAt: null,
          OR: [
            { accessExpiresAt: null },
            { accessExpiresAt: { gt: new Date() } },
          ],
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      await recordCaregiverSharedSpaceAccess({
        client: tx,
        caregiverId: user.id,
        relationships: activeRelationships,
      });

      return activeRelationships;
    });

    const planAccess = await Promise.all(
      relationships.map(async (relationship) =>
        getCaregiverPlanAccess(relationship),
      ),
    );

    return relationships.map((r, index) => {
      const readOnlyByPlan = planAccess[index]?.readOnly ?? true;

      return {
        id: r.id,
        patientId: r.patientId,
        patientName: r.patient.name,
        patientEmail: r.patient.email,
        patientImage: r.patient.image,
        role: r.role,
        label: r.label,
        permissions: getEffectiveCaregiverPermissions(
          r.permissions,
          readOnlyByPlan,
        ),
        readOnlyByPlan,
        accessExpiresAt: r.accessExpiresAt?.toISOString() ?? null,
        moodWindowDays: r.moodWindowDays,
        medicationWindowDays: r.medicationWindowDays,
        createdAt: r.createdAt.toISOString(),
      };
    });
  },
);

// ===== Get Caregiver Access Log (patient only) =====

const getCaregiverAccessLogSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const getCaregiverAccessLog = caregiverAction
  .inputSchema(getCaregiverAccessLogSchema)
  .action(async ({ parsedInput: { limit }, ctx: { user } }) => {
    const entries = await prisma.caregiverAccessLog.findMany({
      where: { patientId: user.id },
      orderBy: { accessedAt: "desc" },
      take: limit,
      select: {
        id: true,
        resource: true,
        accessedAt: true,
        caregiver: {
          select: { name: true, image: true },
        },
        relationship: {
          select: { label: true },
        },
      },
    });

    return entries.map((entry) => {
      const relationshipLabel = entry.relationship?.label?.trim();

      return {
        id: entry.id,
        caregiverName:
          relationshipLabel && relationshipLabel.length > 0
            ? relationshipLabel
            : entry.caregiver.name,
        caregiverImage: entry.caregiver.image,
        resource: entry.resource,
        accessedAt: entry.accessedAt.toISOString(),
      };
    });
  });

// ===== Update Caregiver Permissions =====

const updatePermissionsSchema = z.object({
  relationshipId: z.string(),
  permissions: CaregiverPermissionsSchema,
  label: z.string().optional(),
  accessExpiresAt: z.string().datetime().nullable().optional(),
  moodWindowDays: z
    .union([z.literal(7), z.literal(30), z.literal(90)])
    .optional(),
  medicationWindowDays: z
    .union([z.literal(7), z.literal(30), z.literal(90)])
    .optional(),
});

export const updateCaregiverPermissions = sensitiveCaregiverAction
  .inputSchema(updatePermissionsSchema)
  .action(
    async ({
      parsedInput: {
        relationshipId,
        permissions,
        label,
        accessExpiresAt,
        moodWindowDays,
        medicationWindowDays,
      },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      // Verify the user owns this relationship (is the patient)
      const relationship = await prisma.caregiverRelationship.findUnique({
        where: { id: relationshipId },
      });

      if (
        !relationship ||
        !canManageCaregiverRelationship({ relationship, userId: user.id })
      ) {
        throw new Error(
          t("caregiver.errors.relationshipNotFoundOrUnauthorized"),
        );
      }

      const { readOnly } = await getCaregiverPlanAccess(relationship);
      if (readOnly && hasCaregiverWritePermission(permissions)) {
        throw new Error(t("caregiver.errors.readOnlyAfterDowngrade"));
      }

      const updated = await prisma.caregiverRelationship.update({
        where: { id: relationshipId },
        data: {
          permissions,
          label: label ?? relationship.label,
          accessExpiresAt:
            accessExpiresAt === undefined
              ? relationship.accessExpiresAt
              : accessExpiresAt
                ? new Date(accessExpiresAt)
                : null,
          moodWindowDays: moodWindowDays ?? relationship.moodWindowDays,
          medicationWindowDays:
            medicationWindowDays ?? relationship.medicationWindowDays,
        },
      });

      return {
        id: updated.id,
        permissions: updated.permissions,
        accessExpiresAt: updated.accessExpiresAt?.toISOString() ?? null,
        moodWindowDays: updated.moodWindowDays,
        medicationWindowDays: updated.medicationWindowDays,
      };
    },
  );

// ===== Remove Caregiver Relationship =====

const removeRelationshipSchema = z.object({
  relationshipId: z.string(),
});

export const removeCaregiverRelationship = sensitiveCaregiverAction
  .inputSchema(removeRelationshipSchema)
  .action(async ({ parsedInput: { relationshipId }, ctx: { user } }) => {
    const { t } = await getI18n();
    // Verify the user is either the patient or the caregiver
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.relationshipNotFound"));
    }

    if (!canLeaveCaregiverRelationship({ relationship, userId: user.id })) {
      throw new Error(t("caregiver.errors.relationshipDeleteNotAllowed"));
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.caregiverRelationship.update({
        where: { id: relationshipId },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          revokedById: user.id,
          inviteToken: null,
          inviteExpiry: null,
        },
      });
    });

    return { success: true };
  });

// ===== Create Observation =====

const createObservationSchema = z.object({
  relationshipId: z.string().min(1),
  moodObserved: z.string().optional(),
  energyObserved: z.string().optional(),
  socialBehavior: z.string().optional(),
  sleepObserved: z.string().optional(),
  notes: z.string().max(5000).optional(),
  visibleToPatient: z.boolean().default(true),
});

export const createObservation = caregiverAction
  .inputSchema(createObservationSchema)
  .action(
    async ({
      parsedInput: {
        relationshipId,
        moodObserved,
        energyObserved,
        socialBehavior,
        sleepObserved,
        notes,
        visibleToPatient,
      },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      const { relationship } = await authorizeCaregiverRelationship({
        relationshipId,
        caregiverId: user.id,
        permission: "add_observations",
        enforceWriteAccess: true,
      }).catch(() => {
        throw new Error(t("caregiver.errors.notAllowedObserve"));
      });

      const observation = await prisma.caregiverObservation.create({
        data: {
          observerId: user.id,
          subjectId: relationship.patientId,
          moodObserved,
          energyObserved,
          socialBehavior,
          sleepObserved,
          notes,
          visibleToPatient,
        },
      });

      return observation;
    },
  );

// ===== Create Event =====

const createEventSchema = z.object({
  relationshipId: z.string().min(1),
  eventType: z.string().min(1).max(100),
  severity: z.number().min(1).max(5),
  description: z.string().min(1).max(2000),
  eventDate: z.string().optional(),
  visibleToPatient: z.boolean().default(true),
});

export const createEvent = caregiverAction
  .inputSchema(createEventSchema)
  .action(
    async ({
      parsedInput: {
        relationshipId,
        eventType,
        severity,
        description,
        eventDate,
        visibleToPatient,
      },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      const { relationship } = await authorizeCaregiverRelationship({
        relationshipId,
        caregiverId: user.id,
        permission: "add_events",
        enforceWriteAccess: true,
      }).catch(() => {
        throw new Error(t("caregiver.errors.notAllowedReportEvent"));
      });

      const event = await prisma.caregiverEvent.create({
        data: {
          reporterId: user.id,
          subjectId: relationship.patientId,
          eventType,
          severity,
          description,
          eventDate: eventDate ? new Date(eventDate) : new Date(),
          visibleToPatient,
        },
      });

      return event;
    },
  );

// ===== Get Activity (Observations + Events) =====

const getActivitySchema = z.object({
  days: z.number().int().min(1).max(90).optional().default(30),
  limit: z.number().int().min(1).max(100).optional().default(20),
  scope: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("patient") }),
    z.object({ kind: z.literal("relationship"), relationshipId: z.string() }),
  ]),
});

export const getCaregiverActivity = caregiverAction
  .inputSchema(getActivitySchema)
  .action(async ({ parsedInput: { days, limit, scope }, ctx: { user } }) => {
    return prisma.$transaction(async (transaction) => {
      const relationship =
        scope.kind === "relationship"
          ? (
              await authorizeCaregiverRelationship({
                relationshipId: scope.relationshipId,
                caregiverId: user.id,
                permission: [
                  "view_mood",
                  "view_medications",
                  "add_observations",
                  "add_events",
                ],
                client: transaction,
              })
            ).relationship
          : null;
      const caregiverView = Boolean(relationship);
      const subjectId = relationship?.patientId ?? user.id;
      const preferences = await transaction.userPreferences.findUnique({
        where: { userId: subjectId },
        select: { timezone: true },
      });
      const window = getCivilWindow(preferences?.timezone, days);
      const observationFilter = relationship
        ? { observerId: user.id, subjectId: relationship.patientId }
        : { subjectId: user.id, visibleToPatient: true };
      const eventFilter = relationship
        ? { reporterId: user.id, subjectId: relationship.patientId }
        : { subjectId: user.id, visibleToPatient: true };

      const [observations, events] = await Promise.all([
        transaction.caregiverObservation.findMany({
          where: {
            ...observationFilter,
            createdAt: { gte: window.start, lt: window.endExclusive },
          },
          include: {
            subject: { select: { name: true, image: true } },
            observer: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        transaction.caregiverEvent.findMany({
          where: {
            ...eventFilter,
            createdAt: { gte: window.start, lt: window.endExclusive },
          },
          include: {
            subject: { select: { name: true, image: true } },
            reporter: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      ]);

      if (relationship) {
        await recordCaregiverResourceAccess({
          client: transaction,
          caregiverId: user.id,
          relationship,
          resource: CAREGIVER_ACCESS_RESOURCES.activity,
        });
      }

      return [
        ...observations.map((observation) => ({
          type: "observation" as const,
          id: observation.id,
          subjectName: caregiverView
            ? observation.subject.name
            : observation.observer.name,
          subjectImage: caregiverView
            ? observation.subject.image
            : observation.observer.image,
          moodObserved: observation.moodObserved,
          energyObserved: observation.energyObserved,
          notes: observation.notes,
          createdAt: observation.createdAt.toISOString(),
        })),
        ...events.map((event) => ({
          type: "event" as const,
          id: event.id,
          subjectName: caregiverView ? event.subject.name : event.reporter.name,
          subjectImage: caregiverView
            ? event.subject.image
            : event.reporter.image,
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          eventDate: event.eventDate.toISOString(),
          createdAt: event.createdAt.toISOString(),
        })),
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    });
  });

// ===== Get Observations Received (for patient view) =====

const receivedActivitySchema = getActivitySchema.pick({
  days: true,
  limit: true,
});

export const getReceivedObservations = caregiverAction
  .inputSchema(receivedActivitySchema)
  .action(async ({ parsedInput: { days, limit }, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const window = getCivilWindow(preferences?.timezone, days);

    const observations = await prisma.caregiverObservation.findMany({
      where: {
        subjectId: user.id,
        visibleToPatient: true,
        createdAt: { gte: window.start, lt: window.endExclusive },
      },
      include: {
        observer: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return observations.map((o) => ({
      id: o.id,
      observerName: o.observer.name,
      observerImage: o.observer.image,
      moodObserved: o.moodObserved,
      energyObserved: o.energyObserved,
      socialBehavior: o.socialBehavior,
      sleepObserved: o.sleepObserved,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
    }));
  });

// ===== Get Summary Stats =====

const getSummarySchema = z.object({
  scope: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("patient") }),
    z.object({ kind: z.literal("relationship"), relationshipId: z.string() }),
  ]),
});

export const getCaregiverSummary = caregiverAction
  .inputSchema(getSummarySchema)
  .action(async ({ parsedInput: { scope }, ctx: { user } }) => {
    const relationship =
      scope.kind === "relationship"
        ? (
            await authorizeCaregiverRelationship({
              relationshipId: scope.relationshipId,
              caregiverId: user.id,
              permission: [
                "view_mood",
                "view_medications",
                "add_observations",
                "add_events",
              ],
            })
          ).relationship
        : null;
    const subjectId = relationship?.patientId ?? user.id;
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: subjectId },
      select: { timezone: true },
    });
    const weekWindow = getCivilWindow(preferences?.timezone, 7);
    const monthWindow = getCivilWindow(preferences?.timezone, 30);

    const observationFilter = relationship
      ? { observerId: user.id, subjectId: relationship.patientId }
      : { subjectId: user.id, visibleToPatient: true };

    const eventFilter = relationship
      ? { reporterId: user.id, subjectId: relationship.patientId }
      : { subjectId: user.id, visibleToPatient: true };

    // Observations count
    const observationsThisWeek = await prisma.caregiverObservation.count({
      where: {
        ...observationFilter,
        createdAt: { gte: weekWindow.start, lt: weekWindow.endExclusive },
      },
    });

    const observationsThisMonth = await prisma.caregiverObservation.count({
      where: {
        ...observationFilter,
        createdAt: { gte: monthWindow.start, lt: monthWindow.endExclusive },
      },
    });

    // Events count
    const eventsThisMonth = await prisma.caregiverEvent.count({
      where: {
        ...eventFilter,
        createdAt: { gte: monthWindow.start, lt: monthWindow.endExclusive },
      },
    });

    // Recent concerning events
    const concerningEvents = await prisma.caregiverEvent.count({
      where: {
        ...eventFilter,
        severity: { gte: 4 },
        createdAt: { gte: monthWindow.start, lt: monthWindow.endExclusive },
      },
    });

    if (relationship) {
      await recordCaregiverResourceAccess({
        client: prisma,
        caregiverId: user.id,
        relationship,
        resource: CAREGIVER_ACCESS_RESOURCES.activity,
      });
    }

    return {
      observationsThisWeek,
      observationsThisMonth,
      eventsThisMonth,
      concerningEvents,
    };
  });

// ===== Explicitly shared patient summaries =====

const sharedSummarySchema = z.object({
  relationshipId: z.string().min(1),
  days: z.number().int().min(1).max(90).optional().default(30),
});

export const getSharedMoodSummary = caregiverAction
  .inputSchema(sharedSummarySchema)
  .action(async ({ parsedInput, ctx: { user } }) =>
    prisma.$transaction(async (transaction) => {
      const { relationship } = await authorizeCaregiverRelationship({
        relationshipId: parsedInput.relationshipId,
        caregiverId: user.id,
        permission: "view_mood",
        client: transaction,
      });
      const days = Math.min(parsedInput.days, relationship.moodWindowDays, 90);
      const preferences = await transaction.userPreferences.findUnique({
        where: { userId: relationship.patientId },
        select: { timezone: true },
      });
      const timezone = getSafeTimeZone(preferences?.timezone);
      const endDate = getDateKeyForTimeZone(new Date(), timezone);
      const startDate = addCivilDays(endDate, -(days - 1));
      const { start: since, endExclusive } = getExportDateRange({
        startDate,
        endDate,
        timezone,
      });

      const entries = await transaction.moodEntry.findMany({
        where: {
          userId: relationship.patientId,
          createdAt: { gte: since, lt: endExclusive },
        },
        select: { value: true, energy: true, anxiety: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
      await recordCaregiverResourceAccess({
        client: transaction,
        caregiverId: user.id,
        relationship,
        resource: CAREGIVER_ACCESS_RESOURCES.moodSummary,
      });

      const byDay = new Map<
        string,
        {
          moodTotal: number;
          energyTotal: number;
          energyCount: number;
          count: number;
        }
      >();
      entries.forEach((entry) => {
        const day = getDateKeyForTimeZone(entry.createdAt, timezone);
        const aggregate = byDay.get(day) ?? {
          moodTotal: 0,
          energyTotal: 0,
          energyCount: 0,
          count: 0,
        };
        aggregate.moodTotal += entry.value;
        aggregate.count += 1;
        if (entry.energy !== null) {
          aggregate.energyTotal += entry.energy;
          aggregate.energyCount += 1;
        }
        byDay.set(day, aggregate);
      });

      return {
        relationshipId: relationship.id,
        days,
        daily: [...byDay.entries()].map(([date, aggregate]) => ({
          date,
          moodAverage:
            Math.round((aggregate.moodTotal / aggregate.count) * 10) / 10,
          energyAverage:
            aggregate.energyCount > 0
              ? Math.round(
                  (aggregate.energyTotal / aggregate.energyCount) * 10,
                ) / 10
              : null,
          entryCount: aggregate.count,
        })),
      };
    }),
  );

export const getSharedMedicationSummary = caregiverAction
  .inputSchema(sharedSummarySchema)
  .action(async ({ parsedInput, ctx: { user } }) =>
    prisma.$transaction(async (transaction) => {
      const { relationship } = await authorizeCaregiverRelationship({
        relationshipId: parsedInput.relationshipId,
        caregiverId: user.id,
        permission: "view_medications",
        client: transaction,
      });
      const days = Math.min(
        parsedInput.days,
        relationship.medicationWindowDays,
        90,
      );
      const preferences = await transaction.userPreferences.findUnique({
        where: { userId: relationship.patientId },
        select: { timezone: true },
      });
      const timezone = getSafeTimeZone(preferences?.timezone);
      const endDate = getDateKeyForTimeZone(new Date(), timezone);
      const startDate = addCivilDays(endDate, -(days - 1));

      const medications = await transaction.medication.findMany({
        where: { userId: relationship.patientId, isArchived: false },
        select: {
          id: true,
          name: true,
          dosage: true,
          frequency: true,
          isArchived: true,
          intakes: {
            where: {
              scheduledForDate: { gte: startDate, lte: endDate },
              skipped: false,
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      const adherence = await getMedicationAdherenceForUser({
        userId: relationship.patientId,
        startDate,
        endDate,
        timezone,
        client: transaction,
      });
      await recordCaregiverResourceAccess({
        client: transaction,
        caregiverId: user.id,
        relationship,
        resource: CAREGIVER_ACCESS_RESOURCES.medicationSummary,
      });

      return {
        relationshipId: relationship.id,
        days,
        adherencePercent: adherence.percent,
        medications: medications.map((medication) => ({
          id: medication.id,
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          active: !medication.isArchived,
          takenCount: medication.intakes.length,
        })),
      };
    }),
  );
