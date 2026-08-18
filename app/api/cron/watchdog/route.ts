import { validateCronRequest } from "@/lib/cron";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const STALE_AFTER_MS = 15 * 60 * 1000;
const ALERT_REPEAT_MS = 60 * 60 * 1000;
const ALERT_STATE_SERVICE = "watchdog-alerts";

export async function GET(request: Request) {
  const unauthorized = validateCronRequest(request);
  if (unauthorized) return unauthorized;
  if (!env.OPERATIONAL_ALERT_EMAIL || !env.RESEND_API_KEY) {
    return Response.json({ ok: true, disabled: true });
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_AFTER_MS);
  const [
    notifications,
    externalDeletions,
    operationalRetention,
    stripeReconciliation,
    caregiverAccessDigests,
    deadDeletionCount,
    overdueDeletionCount,
    deadNotificationCount,
    unresolvedEmailWebhookCount,
    failedStripeWebhookCount,
  ] = await Promise.all([
    prisma.operationalHeartbeat.findUnique({
      where: { serviceName: "notifications" },
    }),
    prisma.operationalHeartbeat.findUnique({
      where: { serviceName: "external-deletions" },
    }),
    prisma.operationalHeartbeat.findUnique({
      where: { serviceName: "operational-retention" },
    }),
    prisma.operationalHeartbeat.findUnique({
      where: { serviceName: "stripe-reconciliation" },
    }),
    prisma.operationalHeartbeat.findUnique({
      where: { serviceName: "caregiver-access-digests" },
    }),
    prisma.externalDeletionJob.count({ where: { status: "dead" } }),
    prisma.externalDeletionJob.count({
      where: {
        status: { in: ["pending", "processing", "retry"] },
        retentionUntil: { lte: now },
      },
    }),
    prisma.notificationDelivery.count({ where: { status: "dead" } }),
    prisma.emailWebhookEvent.count({
      where: { status: { in: ["retry", "failed"] } },
    }),
    prisma.stripeWebhookEvent.count({ where: { status: "failed" } }),
  ]);

  const staleNotifications =
    env.PUSH_NOTIFICATIONS_ENABLED &&
    (!notifications?.lastSuccessAt ||
      notifications.lastSuccessAt < staleBefore);
  const staleDeletions =
    !externalDeletions?.lastSuccessAt ||
    externalDeletions.lastSuccessAt < staleBefore;
  const staleStripeReconciliation =
    env.BILLING_ENABLED &&
    (!stripeReconciliation?.lastSuccessAt ||
      stripeReconciliation.lastSuccessAt <
        new Date(now.getTime() - 26 * 60 * 60 * 1000));
  const staleOperationalRetention =
    !operationalRetention?.lastSuccessAt ||
    operationalRetention.lastSuccessAt <
      new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const staleCaregiverAccessDigests =
    env.CAREGIVER_SHARING_ENABLED &&
    (!caregiverAccessDigests?.lastSuccessAt ||
      caregiverAccessDigests.lastSuccessAt <
        new Date(now.getTime() - 26 * 60 * 60 * 1000));
  const stripeReconciliationFailed =
    env.BILLING_ENABLED &&
    Boolean(
      stripeReconciliation?.lastFailureAt &&
        (!stripeReconciliation.lastSuccessAt ||
          stripeReconciliation.lastFailureAt >
            stripeReconciliation.lastSuccessAt),
    );
  const repeatedFailure =
    (env.PUSH_NOTIFICATIONS_ENABLED &&
      (notifications?.consecutiveFailures ?? 0) >= 2) ||
    (externalDeletions?.consecutiveFailures ?? 0) >= 2 ||
    (operationalRetention?.consecutiveFailures ?? 0) >= 2 ||
    (env.CAREGIVER_SHARING_ENABLED &&
      (caregiverAccessDigests?.consecutiveFailures ?? 0) >= 2) ||
    (env.BILLING_ENABLED &&
      (stripeReconciliation?.consecutiveFailures ?? 0) >= 2);
  const unhealthy =
    staleNotifications ||
    staleDeletions ||
    staleOperationalRetention ||
    staleCaregiverAccessDigests ||
    staleStripeReconciliation ||
    stripeReconciliationFailed ||
    repeatedFailure ||
    deadDeletionCount > 0 ||
    overdueDeletionCount > 0 ||
    (env.PUSH_NOTIFICATIONS_ENABLED && deadNotificationCount > 0) ||
    unresolvedEmailWebhookCount > 0 ||
    (env.BILLING_ENABLED && failedStripeWebhookCount > 0);

  const alertState = await prisma.operationalHeartbeat.upsert({
    where: { serviceName: ALERT_STATE_SERVICE },
    create: { serviceName: ALERT_STATE_SERVICE },
    update: {},
  });

  const alertDue =
    unhealthy &&
    (!alertState.lastAlertAt ||
      now.getTime() - alertState.lastAlertAt.getTime() >= ALERT_REPEAT_MS);
  const recoveryDue = !unhealthy && alertState.alertState === "alert";
  if (alertDue || recoveryDue) {
    const result = await sendEmail({
      to: env.OPERATIONAL_ALERT_EMAIL,
      subject: alertDue
        ? "[Moodday] Operational alert"
        : "[Moodday] Operational recovery",
      text: alertDue
        ? "One or more Moodday operational checks require attention. Review Vercel logs and PostgreSQL operational state."
        : "Moodday deterministic operational checks have recovered.",
      html: alertDue
        ? "<p>One or more Moodday operational checks require attention. Review Vercel logs and PostgreSQL operational state.</p>"
        : "<p>Moodday deterministic operational checks have recovered.</p>",
      tracking: {
        template: alertDue ? "operational-alert" : "operational-recovery",
      },
    });
    if (result.error) {
      return Response.json({ status: "degraded" }, { status: 503 });
    }
    await prisma.operationalHeartbeat.update({
      where: { serviceName: ALERT_STATE_SERVICE },
      data: alertDue
        ? { alertState: "alert", lastAlertAt: now }
        : {
            alertState: "healthy",
            lastRecoveryAlertAt: now,
            lastErrorCode: null,
          },
    });
  }

  return Response.json({
    status: unhealthy ? "degraded" : "ok",
    alertSent: alertDue,
    recoverySent: recoveryDue,
  });
}
