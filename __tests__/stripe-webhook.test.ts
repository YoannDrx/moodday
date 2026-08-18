import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

import { POST } from "../app/api/webhooks/stripe/route";

const mutableEnv = env as unknown as {
  MAINTENANCE_MODE?: boolean;
  BILLING_ENABLED?: boolean;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PLUS_MONTHLY_PRICE_ID?: string;
  STRIPE_PLUS_YEARLY_PRICE_ID?: string;
};

const stripe = {
  webhooks: { constructEvent: vi.fn() },
  subscriptions: { retrieve: vi.fn() },
};

const request = (signature: string | null = "signature") =>
  new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: "raw-body",
    headers: signature ? { "stripe-signature": signature } : undefined,
  });

const event = (
  type: Stripe.Event.Type,
  object: Record<string, unknown> = {},
): Stripe.Event =>
  ({
    id: `evt_${type}`,
    type,
    created: 1_786_636_800,
    data: { object },
  }) as unknown as Stripe.Event;

const subscription = (
  overrides: Record<string, unknown> = {},
): Stripe.Subscription =>
  ({
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    metadata: { userId: "user-1" },
    status: "active",
    cancel_at_period_end: false,
    trial_start: null,
    items: {
      data: [
        {
          price: { id: "price_monthly" },
          current_period_start: 1_786_636_800,
          current_period_end: 1_789_228_800,
        },
      ],
    },
    ...overrides,
  }) as unknown as Stripe.Subscription;

describe("Stripe webhook", () => {
  beforeEach(() => {
    mutableEnv.MAINTENANCE_MODE = false;
    mutableEnv.BILLING_ENABLED = true;
    mutableEnv.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mutableEnv.STRIPE_PLUS_MONTHLY_PRICE_ID = "price_monthly";
    mutableEnv.STRIPE_PLUS_YEARLY_PRICE_ID = "price_yearly";
    vi.mocked(getStripe).mockReturnValue(stripe as unknown as Stripe);
    stripe.webhooks.constructEvent.mockReset();
    stripe.subscriptions.retrieve.mockReset();
    vi.mocked(prisma.stripeWebhookEvent.create).mockResolvedValue({
      id: "claim-1",
    } as never);
    vi.mocked(prisma.stripeWebhookEvent.update).mockResolvedValue({} as never);
    vi.mocked(prisma.stripeWebhookEvent.updateMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.stripeWebhookEvent.findUniqueOrThrow).mockResolvedValue({
      id: "claim-retry",
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "user-1",
      stripeCustomerId: "cus_1",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as never);
  });

  it("defers signed events without writing during maintenance", async () => {
    mutableEnv.MAINTENANCE_MODE = true;

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(await response.json()).toEqual({ error: "Unavailable" });
    expect(getStripe).not.toHaveBeenCalled();
    expect(prisma.stripeWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("does not process signed events while billing is disabled", async () => {
    mutableEnv.BILLING_ENABLED = false;

    const response = await POST(request());

    expect(await response.json()).toEqual({ ok: true, disabled: true });
    expect(getStripe).not.toHaveBeenCalled();
    expect(prisma.stripeWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("fails closed when Stripe webhook verification is unavailable", async () => {
    mutableEnv.STRIPE_WEBHOOK_SECRET = undefined;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(getStripe).not.toHaveBeenCalled();
  });

  it("rejects missing and invalid signatures", async () => {
    expect((await POST(request(null))).status).toBe(400);

    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    expect((await POST(request("invalid"))).status).toBe(400);
  });

  it("acknowledges unsupported and expired checkout events", async () => {
    stripe.webhooks.constructEvent.mockReturnValueOnce(
      event("customer.created" as Stripe.Event.Type),
    );
    expect((await POST(request())).status).toBe(200);

    stripe.webhooks.constructEvent.mockReturnValueOnce(
      event("checkout.session.expired", {
        object: "checkout.session",
        subscription: "sub_1",
      }),
    );
    expect((await POST(request())).status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("deduplicates a previously completed event", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    vi.mocked(prisma.stripeWebhookEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await POST(request());

    expect(await response.json()).toEqual({ ok: true, duplicate: true });
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it("reclaims a failed or stale duplicate before processing", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    vi.mocked(prisma.stripeWebhookEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    vi.mocked(prisma.stripeWebhookEvent.updateMany).mockResolvedValue({
      count: 1,
    });
    stripe.subscriptions.retrieve.mockResolvedValue(subscription());

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(prisma.stripeWebhookEvent.findUniqueOrThrow).toHaveBeenCalled();
    expect(prisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
      where: { id: "claim-retry" },
      data: expect.objectContaining({ status: "processed" }),
    });
  });

  it("does not hide a non-unique claim failure", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated"),
    );
    vi.mocked(prisma.stripeWebhookEvent.create).mockRejectedValue(
      new Error("database unavailable"),
    );

    await expect(POST(request())).rejects.toThrow("database unavailable");
  });

  it("syncs an approved active subscription from Stripe's current state", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(subscription());

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { referenceId: "user-1" },
      create: expect.objectContaining({
        plan: "plus",
        billingInterval: "monthly",
        stripeCustomerId: "cus_1",
        status: "active",
        graceEndsAt: null,
        trialUsedAt: null,
      }),
      update: expect.objectContaining({ plan: "plus", status: "active" }),
    });
  });

  it.each([
    ["canceled", "free"],
    ["unpaid", "free"],
    ["incomplete_expired", "free"],
  ] as const)("removes Plus rights for %s", async (status, plan) => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.deleted", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(subscription({ status }));

    expect((await POST(request())).status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ plan, status }),
      }),
    );
  });

  it("preserves an existing grace deadline and trial history", async () => {
    const graceEndsAt = new Date("2026-08-20T00:00:00.000Z");
    const trialUsedAt = new Date("2026-08-01T00:00:00.000Z");
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      graceEndsAt,
      trialUsedAt,
    } as never);
    stripe.webhooks.constructEvent.mockReturnValue(
      event("invoice.payment_failed", {
        object: "invoice",
        subscription: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(
      subscription({ status: "past_due" }),
    );

    expect((await POST(request())).status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ graceEndsAt, trialUsedAt }),
      }),
    );
  });

  it("creates grace and trial timestamps only when applicable", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("invoice.payment_failed", {
        object: "invoice",
        parent: {
          type: "subscription_details",
          subscription_details: { subscription: { id: "sub_1" } },
        },
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(
      subscription({ status: "past_due" }),
    );
    expect((await POST(request())).status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ graceEndsAt: expect.any(Date) }),
      }),
    );

    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.created", {
        object: "subscription",
        id: "sub_trial",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(
      subscription({ id: "sub_trial", status: "trialing" }),
    );
    expect((await POST(request())).status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ trialUsedAt: expect.any(Date) }),
      }),
    );
  });

  it("maps checkout subscriptions and rejects checkout without one", async () => {
    stripe.webhooks.constructEvent.mockReturnValueOnce(
      event("checkout.session.completed", {
        object: "checkout.session",
        subscription: { id: "sub_1" },
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(subscription());
    expect((await POST(request())).status).toBe(200);

    stripe.webhooks.constructEvent.mockReturnValueOnce(
      event("checkout.session.completed", {
        object: "checkout.session",
        subscription: null,
      }),
    );
    const failed = await POST(request());
    expect(failed.status).toBe(500);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "claim-1" },
      data: {
        status: "failed",
        lastErrorCode: "checkout_missing_subscription",
      },
    });
  });

  it("acknowledges an invoice that is unrelated to a subscription", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("invoice.paid", {
        object: "invoice",
        parent: { type: "quote_details" },
      }),
    );

    expect((await POST(request())).status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it.each([
    [
      "unapproved_price",
      subscription({ items: { data: [{ price: { id: "price_other" } }] } }),
    ],
    ["missing_customer", subscription({ customer: null })],
  ] as const)("records the safe %s processing code", async (code, current) => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(current);

    expect((await POST(request())).status).toBe(500);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "claim-1" },
      data: { status: "failed", lastErrorCode: code },
    });
  });

  it.each([
    [null, "missing_user_mapping"],
    [{ userId: "missing-user" }, "unknown_user"],
  ] as const)(
    "rejects unsafe metadata mapping with %s",
    async (metadata, code) => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      stripe.webhooks.constructEvent.mockReturnValue(
        event("customer.subscription.updated", {
          object: "subscription",
          id: "sub_1",
        }),
      );
      stripe.subscriptions.retrieve.mockResolvedValue(
        subscription({ metadata: metadata ?? {} }),
      );

      expect((await POST(request())).status).toBe(500);
      expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
        where: { id: "claim-1" },
        data: { status: "failed", lastErrorCode: code },
      });
    },
  );

  it("rejects a customer mismatch and attaches a previously unmapped customer", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-1",
      stripeCustomerId: "cus_other",
    } as never);
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockResolvedValue(subscription());
    expect((await POST(request())).status).toBe(500);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "claim-1" },
      data: { status: "failed", lastErrorCode: "customer_account_mismatch" },
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-1",
      stripeCustomerId: null,
    } as never);
    expect((await POST(request())).status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_1" },
    });
  });

  it("maps unexpected provider failures to a generic code", async () => {
    stripe.webhooks.constructEvent.mockReturnValue(
      event("customer.subscription.updated", {
        object: "subscription",
        id: "sub_1",
      }),
    );
    stripe.subscriptions.retrieve.mockRejectedValueOnce(new Error("secret"));
    expect((await POST(request())).status).toBe(500);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "claim-1" },
      data: { status: "failed", lastErrorCode: "stripe_handler_failed" },
    });

    stripe.subscriptions.retrieve.mockRejectedValueOnce("non-error");
    expect((await POST(request())).status).toBe(500);
    expect(prisma.stripeWebhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "claim-1" },
      data: { status: "failed", lastErrorCode: "unknown_error" },
    });
  });
});
