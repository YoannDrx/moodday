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
  const accessLogCutoff = before(now, 365);
  const stripeCutoff = before(now, 395);
  const completedJobCutoff = before(now, 30);
  const regulatoryAuditCutoff = before(now, 365);

  const [
    expiredRegulatoryExports,
    emailLogs,
    emailWebhookEvents,
    accessLogs,
    stripeWebhookEvents,
    externalDeletionJobs,
    operationalJobRuns,
    notificationDeliveries,
    expiredVerifications,
    regulatoryExportAudits,
    rateLimitCounters,
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
    prisma.accessLog.deleteMany({
      where: { createdAt: { lt: accessLogCutoff } },
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
    prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.regulatoryExportAudit.deleteMany({
      where: {
        status: { in: ["delivered", "expired", "failed"] },
        updatedAt: { lt: regulatoryAuditCutoff },
      },
    }),
    // All configured auth/app windows are at most one hour. Keep a full day
    // to avoid resetting an active limit; only expired technical counters leave.
    prisma.rateLimit.deleteMany({
      where: { lastRequest: { lt: BigInt(before(now, 1).getTime()) } },
    }),
  ]);

  return {
    updated: {
      expiredRegulatoryExports: expiredRegulatoryExports.count,
    },
    deleted: {
      emailLogs: emailLogs.count,
      emailWebhookEvents: emailWebhookEvents.count,
      accessLogs: accessLogs.count,
      stripeWebhookEvents: stripeWebhookEvents.count,
      externalDeletionJobs: externalDeletionJobs.count,
      operationalJobRuns: operationalJobRuns.count,
      notificationDeliveries: notificationDeliveries.count,
      expiredVerifications: expiredVerifications.count,
      regulatoryExportAudits: regulatoryExportAudits.count,
      rateLimitCounters: rateLimitCounters.count,
    },
  };
};
