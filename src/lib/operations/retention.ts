import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

const before = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_MS);

/**
 * Deletes technical records after their documented operational retention.
 * Active product and health data are intentionally outside this routine.
 */
export const applyOperationalRetention = async (now = new Date()) => {
  const emailCutoff = before(now, 90);
  const caregiverAndAiCutoff = before(now, 365);
  const stripeCutoff = before(now, 395);
  const completedJobCutoff = before(now, 30);
  const regulatoryAuditCutoff = before(now, 365);

  const [
    expiredRegulatoryExports,
    emailLogs,
    emailWebhookEvents,
    caregiverAccessLogs,
    aiUsage,
    stripeWebhookEvents,
    externalDeletionJobs,
    operationalJobRuns,
    notificationDeliveries,
    medicationMutationReceipts,
    expiredVerifications,
    regulatoryExportAudits,
  ] = await prisma.$transaction([
    prisma.regulatoryExportAudit.updateMany({
      where: {
        status: "generated",
        expiresAt: { lte: now },
      },
      data: { status: "expired", downloadTokenDigest: null },
    }),
    prisma.emailLog.deleteMany({ where: { sentAt: { lt: emailCutoff } } }),
    prisma.emailWebhookEvent.deleteMany({
      where: { createdAt: { lt: emailCutoff } },
    }),
    prisma.caregiverAccessLog.deleteMany({
      where: { accessedAt: { lt: caregiverAndAiCutoff } },
    }),
    prisma.aIUsage.deleteMany({
      where: { createdAt: { lt: caregiverAndAiCutoff } },
    }),
    prisma.stripeWebhookEvent.deleteMany({
      where: { createdAt: { lt: stripeCutoff } },
    }),
    prisma.externalDeletionJob.deleteMany({
      where: {
        status: "succeeded",
        completedAt: { lt: completedJobCutoff },
      },
    }),
    prisma.operationalJobRun.deleteMany({
      where: {
        status: { in: ["succeeded", "dead"] },
        finishedAt: { lt: completedJobCutoff },
      },
    }),
    prisma.notificationDelivery.deleteMany({
      where: {
        status: { in: ["sent", "failed", "dead"] },
        updatedAt: { lt: emailCutoff },
      },
    }),
    prisma.medicationMutationReceipt.deleteMany({
      where: { createdAt: { lt: completedJobCutoff } },
    }),
    prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.regulatoryExportAudit.deleteMany({
      where: {
        status: { in: ["delivered", "expired", "failed"] },
        updatedAt: { lt: regulatoryAuditCutoff },
      },
    }),
  ]);

  return {
    updated: {
      expiredRegulatoryExports: expiredRegulatoryExports.count,
    },
    deleted: {
      emailLogs: emailLogs.count,
      emailWebhookEvents: emailWebhookEvents.count,
      caregiverAccessLogs: caregiverAccessLogs.count,
      aiUsage: aiUsage.count,
      stripeWebhookEvents: stripeWebhookEvents.count,
      externalDeletionJobs: externalDeletionJobs.count,
      operationalJobRuns: operationalJobRuns.count,
      notificationDeliveries: notificationDeliveries.count,
      medicationMutationReceipts: medicationMutationReceipts.count,
      expiredVerifications: expiredVerifications.count,
      regulatoryExportAudits: regulatoryExportAudits.count,
    },
  };
};
