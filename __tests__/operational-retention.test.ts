import { applyOperationalRetention } from "@/lib/operations/retention";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("applyOperationalRetention", () => {
  beforeEach(() => {
    const deleted = { count: 1 };
    vi.mocked(prisma.emailLog.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.emailWebhookEvent.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.caregiverAccessLog.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.aIUsage.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.stripeWebhookEvent.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.externalDeletionJob.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.operationalJobRun.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.notificationDelivery.deleteMany).mockResolvedValue(
      deleted,
    );
    vi.mocked(prisma.medicationMutationReceipt.deleteMany).mockResolvedValue(
      deleted,
    );
    vi.mocked(prisma.verification.deleteMany).mockResolvedValue(deleted);
    vi.mocked(prisma.regulatoryExportAudit.updateMany).mockResolvedValue(
      deleted,
    );
    vi.mocked(prisma.regulatoryExportAudit.deleteMany).mockResolvedValue(
      deleted,
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (operations) =>
      Array.isArray(operations) ? Promise.all(operations) : operations(prisma),
    );
  });

  it("deletes only technical records older than their documented cutoffs", async () => {
    const now = new Date("2026-08-13T12:00:00.000Z");

    await expect(applyOperationalRetention(now)).resolves.toEqual({
      updated: {
        expiredRegulatoryExports: 1,
      },
      deleted: {
        emailLogs: 1,
        emailWebhookEvents: 1,
        caregiverAccessLogs: 1,
        aiUsage: 1,
        stripeWebhookEvents: 1,
        externalDeletionJobs: 1,
        operationalJobRuns: 1,
        notificationDeliveries: 1,
        medicationMutationReceipts: 1,
        expiredVerifications: 1,
        regulatoryExportAudits: 1,
      },
    });
    const daysBefore = (days: number) =>
      new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    expect(prisma.emailLog.deleteMany).toHaveBeenCalledWith({
      where: { sentAt: { lt: daysBefore(90) } },
    });
    expect(prisma.emailWebhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: daysBefore(90) } },
    });
    expect(prisma.caregiverAccessLog.deleteMany).toHaveBeenCalledWith({
      where: { accessedAt: { lt: daysBefore(365) } },
    });
    expect(prisma.aIUsage.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: daysBefore(365) } },
    });
    expect(prisma.stripeWebhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: daysBefore(395) } },
    });
    expect(prisma.externalDeletionJob.deleteMany).toHaveBeenCalledWith({
      where: {
        status: "succeeded",
        completedAt: { lt: daysBefore(30) },
      },
    });
    expect(prisma.operationalJobRun.deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["succeeded", "dead"] },
        finishedAt: { lt: daysBefore(30) },
      },
    });
    expect(prisma.notificationDelivery.deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["sent", "failed", "dead"] },
        updatedAt: { lt: daysBefore(90) },
      },
    });
    expect(prisma.medicationMutationReceipt.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: daysBefore(30) } },
    });
    expect(prisma.verification.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: now } },
    });
    expect(prisma.regulatoryExportAudit.updateMany).toHaveBeenCalledWith({
      where: { status: "generated", expiresAt: { lte: now } },
      data: { status: "expired", downloadTokenDigest: null },
    });
    expect(prisma.regulatoryExportAudit.deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["delivered", "expired", "failed"] },
        updatedAt: { lt: daysBefore(365) },
      },
    });
  });
});
