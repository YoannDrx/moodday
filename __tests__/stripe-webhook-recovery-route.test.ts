import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/cron", () => ({ validateCronRequest: vi.fn(() => null) }));
vi.mock("@/lib/operations/job-runner", () => ({
  runOperationalJob: vi.fn(
    async ({ task }: { task: () => Promise<Record<string, number>> }) => ({
      skipped: false as const,
      result: await task(),
    }),
  ),
}));
vi.mock("@/lib/billing/stripe-webhook-processor", () => ({
  processStripeWebhookEvent: vi.fn(),
  getSafeStripeWebhookErrorCode: vi.fn(() => "stripe_handler_failed"),
}));

import {
  getSafeStripeWebhookErrorCode,
  processStripeWebhookEvent,
} from "@/lib/billing/stripe-webhook-processor";
import { validateCronRequest } from "@/lib/cron";
import { GET } from "../app/api/cron/stripe-webhooks/route";

const mutableEnv = env as unknown as { BILLING_ENABLED: boolean };
const stripeEvent = {
  id: "evt_recovery",
  type: "customer.subscription.updated",
  data: { object: { object: "subscription", id: "sub_1" } },
} as unknown as Stripe.Event;
const stripe = {
  events: { retrieve: vi.fn() },
};
const candidate = {
  id: "webhook-row-1",
  eventId: "evt_recovery",
  type: "customer.subscription.updated",
  attempts: 2,
};
const request = new Request(
  "https://moodday.invalid/api/cron/stripe-webhooks",
  { headers: { authorization: "Bearer cron-test" } },
);

describe("Stripe webhook recovery cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.BILLING_ENABLED = true;
    vi.mocked(validateCronRequest).mockReturnValue(null);
    vi.mocked(getStripe).mockReturnValue(stripe as unknown as Stripe);
    stripe.events.retrieve.mockResolvedValue(stripeEvent);
    vi.mocked(prisma.stripeWebhookEvent.findMany).mockResolvedValue([
      candidate,
    ] as never);
    vi.mocked(prisma.stripeWebhookEvent.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.stripeWebhookEvent.update).mockResolvedValue({} as never);
    vi.mocked(processStripeWebhookEvent).mockResolvedValue({ ignored: false });
  });

  it("recovers a failed or interrupted event from Stripe by ID", async () => {
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      examined: 1,
      processed: 1,
    });
    expect(stripe.events.retrieve).toHaveBeenCalledWith("evt_recovery");
    expect(processStripeWebhookEvent).toHaveBeenCalledWith(stripeEvent);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "webhook-row-1" },
      data: { status: "processed", processedAt: expect.any(Date) },
    });
  });

  it("does not process an event claimed by another worker", async () => {
    vi.mocked(prisma.stripeWebhookEvent.updateMany).mockResolvedValue({
      count: 0,
    });

    const response = await GET(request);

    expect(await response.json()).toEqual({
      ok: true,
      examined: 1,
      processed: 0,
    });
    expect(stripe.events.retrieve).not.toHaveBeenCalled();
  });

  it("quarantines an exhausted event without leaking provider details", async () => {
    vi.mocked(prisma.stripeWebhookEvent.findMany).mockResolvedValue([
      { ...candidate, attempts: 7 },
    ] as never);
    stripe.events.retrieve.mockRejectedValue(new Error("provider secret"));

    await expect(GET(request)).rejects.toThrow(
      "stripe_webhook_recovery_failed",
    );
    expect(getSafeStripeWebhookErrorCode).toHaveBeenCalled();
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "webhook-row-1" },
      data: { status: "dead", lastErrorCode: "stripe_handler_failed" },
    });
  });

  it("fails closed before reading the queue when cron auth is invalid", async () => {
    vi.mocked(validateCronRequest).mockReturnValue(
      Response.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(prisma.stripeWebhookEvent.findMany).not.toHaveBeenCalled();
  });

  it("does not read the queue while billing is disabled", async () => {
    mutableEnv.BILLING_ENABLED = false;

    const response = await GET(request);

    expect(await response.json()).toEqual({ ok: true, disabled: true });
    expect(prisma.stripeWebhookEvent.findMany).not.toHaveBeenCalled();
  });
});
