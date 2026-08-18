import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mail/send-email", () => ({ sendEmail: vi.fn() }));

import { GET } from "../app/api/cron/watchdog/route";

const mutableEnv = env as unknown as {
  CRON_SECRET?: string;
  OPERATIONAL_ALERT_EMAIL?: string;
  RESEND_API_KEY?: string;
  PUSH_NOTIFICATIONS_ENABLED: boolean;
  CAREGIVER_SHARING_ENABLED: boolean;
  BILLING_ENABLED: boolean;
  NODE_ENV: string;
};

const request = (secret = "cron-test") =>
  new Request("http://localhost/api/cron/watchdog", {
    headers: { authorization: `Bearer ${secret}` },
  });

const healthyHeartbeat = () => ({
  lastSuccessAt: new Date(),
  lastFailureAt: null,
  consecutiveFailures: 0,
});

const configureHealthyState = () => {
  vi.mocked(prisma.operationalHeartbeat.findUnique)
    .mockResolvedValueOnce(healthyHeartbeat() as never)
    .mockResolvedValueOnce(healthyHeartbeat() as never)
    .mockResolvedValueOnce(healthyHeartbeat() as never)
    .mockResolvedValueOnce(healthyHeartbeat() as never)
    .mockResolvedValueOnce(healthyHeartbeat() as never);
  vi.mocked(prisma.externalDeletionJob.count).mockResolvedValue(0);
  vi.mocked(prisma.notificationDelivery.count).mockResolvedValue(0);
  vi.mocked(prisma.emailWebhookEvent.count).mockResolvedValue(0);
  vi.mocked(prisma.stripeWebhookEvent.count).mockResolvedValue(0);
};

describe("operational watchdog", () => {
  beforeEach(() => {
    mutableEnv.CRON_SECRET = "cron-test";
    mutableEnv.OPERATIONAL_ALERT_EMAIL = "ops@example.test";
    mutableEnv.RESEND_API_KEY = "resend-test";
    mutableEnv.PUSH_NOTIFICATIONS_ENABLED = true;
    mutableEnv.CAREGIVER_SHARING_ENABLED = true;
    mutableEnv.BILLING_ENABLED = true;
    mutableEnv.NODE_ENV = "test";
    vi.mocked(prisma.operationalHeartbeat.findUnique).mockReset();
    vi.mocked(prisma.operationalHeartbeat.upsert).mockReset();
    vi.mocked(prisma.operationalHeartbeat.update).mockReset();
    vi.mocked(prisma.externalDeletionJob.count).mockReset();
    vi.mocked(prisma.notificationDelivery.count).mockReset();
    vi.mocked(prisma.emailWebhookEvent.count).mockReset();
    vi.mocked(prisma.stripeWebhookEvent.count).mockReset();
    vi.mocked(sendEmail).mockReset();
    vi.mocked(prisma.operationalHeartbeat.upsert).mockResolvedValue({
      alertState: "healthy",
      lastAlertAt: null,
    } as never);
    vi.mocked(prisma.operationalHeartbeat.update).mockResolvedValue(
      {} as never,
    );
    vi.mocked(sendEmail).mockResolvedValue({
      error: null,
      data: { id: "email-1" },
    });
  });

  it("rejects an invalid cron secret", async () => {
    expect((await GET(request("wrong"))).status).toBe(401);
    expect(prisma.operationalHeartbeat.findUnique).not.toHaveBeenCalled();
  });

  it("stays explicitly disabled without an alert destination or provider", async () => {
    mutableEnv.OPERATIONAL_ALERT_EMAIL = undefined;
    let response = await GET(request());
    expect(await response.json()).toEqual({ ok: true, disabled: true });

    mutableEnv.OPERATIONAL_ALERT_EMAIL = "ops@example.test";
    mutableEnv.RESEND_API_KEY = undefined;
    response = await GET(request());
    expect(await response.json()).toEqual({ ok: true, disabled: true });
  });

  it("reports a healthy state without sending mail", async () => {
    configureHealthyState();

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      alertSent: false,
      recoverySent: false,
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.emailWebhookEvent.count).toHaveBeenCalledWith({
      where: { status: { in: ["retry", "failed"] } },
    });
  });

  it("sends one generic alert for stale and failed operational state", async () => {
    const stale = new Date(Date.now() - 48 * 60 * 60 * 1000);
    vi.mocked(prisma.operationalHeartbeat.findUnique)
      .mockResolvedValueOnce({
        lastSuccessAt: stale,
        consecutiveFailures: 2,
      } as never)
      .mockResolvedValueOnce({
        lastSuccessAt: stale,
        consecutiveFailures: 2,
      } as never)
      .mockResolvedValueOnce({
        lastSuccessAt: stale,
        consecutiveFailures: 2,
      } as never)
      .mockResolvedValueOnce({
        lastSuccessAt: stale,
        consecutiveFailures: 2,
      } as never)
      .mockResolvedValueOnce({
        lastSuccessAt: stale,
        lastFailureAt: new Date(),
        consecutiveFailures: 2,
      } as never);
    vi.mocked(prisma.externalDeletionJob.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    vi.mocked(prisma.notificationDelivery.count).mockResolvedValue(1);
    vi.mocked(prisma.emailWebhookEvent.count).mockResolvedValue(1);
    vi.mocked(prisma.stripeWebhookEvent.count).mockResolvedValue(1);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "degraded",
      alertSent: true,
      recoverySent: false,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ops@example.test",
        subject: "[Moodday] Operational alert",
        tracking: { template: "operational-alert" },
      }),
    );
    expect(prisma.operationalHeartbeat.update).toHaveBeenCalledWith({
      where: { serviceName: "watchdog-alerts" },
      data: expect.objectContaining({ alertState: "alert" }),
    });
  });

  it("rate-limits repeated alerts", async () => {
    configureHealthyState();
    vi.mocked(prisma.externalDeletionJob.count)
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.operationalHeartbeat.upsert).mockResolvedValue({
      alertState: "alert",
      lastAlertAt: new Date(),
    } as never);

    const response = await GET(request());

    expect(await response.json()).toEqual({
      status: "degraded",
      alertSent: false,
      recoverySent: false,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends a recovery notification after all checks recover", async () => {
    configureHealthyState();
    vi.mocked(prisma.operationalHeartbeat.upsert).mockResolvedValue({
      alertState: "alert",
      lastAlertAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    } as never);

    const response = await GET(request());

    expect(await response.json()).toEqual({
      status: "ok",
      alertSent: false,
      recoverySent: true,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[Moodday] Operational recovery",
        tracking: { template: "operational-recovery" },
      }),
    );
    expect(prisma.operationalHeartbeat.update).toHaveBeenCalledWith({
      where: { serviceName: "watchdog-alerts" },
      data: expect.objectContaining({
        alertState: "healthy",
        lastRecoveryAlertAt: expect.any(Date),
      }),
    });
  });

  it("returns degraded when alert delivery itself fails", async () => {
    configureHealthyState();
    vi.mocked(prisma.externalDeletionJob.count)
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    vi.mocked(sendEmail).mockResolvedValue({
      error: new Error("provider unavailable"),
      data: null,
    });

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "degraded" });
    expect(prisma.operationalHeartbeat.update).not.toHaveBeenCalled();
  });
});
