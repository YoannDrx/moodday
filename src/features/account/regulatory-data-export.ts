import { buildUserDataExport } from "@/features/account/user-data-export";
import { prisma } from "@/lib/prisma";

/**
 * Builds the separately controlled regulatory export. This function is not
 * reachable from a web route or the admin UI. Authentication secrets, session
 * tokens, provider tokens, TOTP material, passkey keys and push endpoints are
 * intentionally excluded even from this export.
 */
export async function buildRegulatoryDataExport(userId: string) {
  const subject = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!subject) throw new Error("Regulatory export subject not found");
  const productExport = await buildUserDataExport({ id: userId });
  const regulatoryData = await prisma.$transaction(async (tx) => {
    const [
      consents,
      authActivity,
      caregiverRelationships,
      caregiverObservations,
      caregiverEvents,
      caregiverAccessLog,
      medicationLifecycle,
      moodTags,
      consultations,
      safetyPlan,
      aiUsage,
      notificationDeliveries,
      emailDeliveries,
      feedback,
      subscription,
    ] = await Promise.all([
      tx.userConsent.findMany({
        where: { userId },
        orderBy: { acceptedAt: "asc" },
        select: {
          purpose: true,
          version: true,
          locale: true,
          country: true,
          source: true,
          acceptedAt: true,
          revokedAt: true,
        },
      }),
      Promise.all([
        tx.session.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
          },
        }),
        tx.account.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            accountId: true,
            providerId: true,
            scope: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        tx.passkey.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            deviceType: true,
            backedUp: true,
            transports: true,
            createdAt: true,
            aaguid: true,
          },
        }),
        tx.pushSubscription.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            deviceId: true,
            locale: true,
            contentMode: true,
            trustedDevice: true,
            enabledAt: true,
            disabledAt: true,
            expirationTime: true,
            userAgent: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]),
      tx.caregiverRelationship.findMany({
        where: { OR: [{ patientId: userId }, { caregiverId: userId }] },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          patientId: true,
          caregiverId: true,
          caregiverEmail: true,
          role: true,
          label: true,
          permissions: true,
          status: true,
          inviteExpiry: true,
          accessExpiresAt: true,
          revokedAt: true,
          revokedById: true,
          moodWindowDays: true,
          medicationWindowDays: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      tx.caregiverObservation.findMany({
        where: { OR: [{ subjectId: userId }, { observerId: userId }] },
        orderBy: { createdAt: "asc" },
      }),
      tx.caregiverEvent.findMany({
        where: { OR: [{ subjectId: userId }, { reporterId: userId }] },
        orderBy: { createdAt: "asc" },
      }),
      tx.caregiverAccessLog.findMany({
        where: { OR: [{ patientId: userId }, { caregiverId: userId }] },
        orderBy: { accessedAt: "asc" },
        select: {
          id: true,
          patientId: true,
          caregiverId: true,
          relationshipId: true,
          resource: true,
          accessedAt: true,
        },
      }),
      tx.medication.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          stockQuantity: true,
          unitsPerDose: true,
          lowStockThreshold: true,
          scheduleRevisions: { orderBy: { createdAt: "asc" } },
          inventoryEvents: { orderBy: { occurredAt: "asc" } },
          intakeRevisions: { orderBy: { createdAt: "asc" } },
        },
      }),
      tx.moodTagDefinition.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      tx.consultationPreparation.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      tx.safetyPlan.findUnique({ where: { userId } }),
      tx.aIUsage.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          requestKey: true,
          periodKey: true,
          status: true,
          model: true,
          promptVersion: true,
          inputTokens: true,
          outputTokens: true,
          latencyMs: true,
          safetyCategory: true,
          createdAt: true,
        },
      }),
      tx.notificationDelivery.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          deliveryKey: true,
          status: true,
          attempts: true,
          claimedAt: true,
          sentAt: true,
          failedAt: true,
          nextAttemptAt: true,
          lastErrorCode: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      tx.emailLog.findMany({
        where: { userId },
        orderBy: { sentAt: "asc" },
        select: {
          template: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          openedAt: true,
          clickedAt: true,
          bouncedAt: true,
          complainedAt: true,
        },
      }),
      tx.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          review: true,
          message: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      tx.subscription.findUnique({
        where: { referenceId: userId },
        select: {
          plan: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          cancelAtPeriodEnd: true,
          billingInterval: true,
          trialUsedAt: true,
          graceEndsAt: true,
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const [sessions, connectedAccounts, passkeys, pushDevices] = authActivity;
    return {
      consents,
      authenticationActivity: {
        sessions,
        connectedAccounts,
        passkeys,
        pushDevices,
      },
      caregiverCircle: {
        relationships: caregiverRelationships,
        observations: caregiverObservations,
        events: caregiverEvents,
        accessLog: caregiverAccessLog,
      },
      medicationLifecycle,
      moodTags,
      consultations,
      safetyPlan,
      aiUsage,
      notificationDeliveries,
      emailDeliveries,
      feedback,
      subscription,
    };
  });

  return {
    regulatoryExportMetadata: {
      generatedAt: new Date().toISOString(),
      formatVersion: "1.0",
      applicationName: "Moodday",
      scope: "controlled-regulatory-export",
      excludedSecurityMaterial: [
        "password hashes and password reset tokens",
        "session and provider access tokens",
        "TOTP secrets and recovery codes",
        "passkey public keys and credential identifiers",
        "push endpoints and encryption keys",
        "caregiver invitation tokens",
      ],
    },
    productExport,
    regulatoryData,
  };
}
