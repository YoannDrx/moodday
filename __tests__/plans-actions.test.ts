import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  assertFeatureAvailable: vi.fn(),
  enforceRateLimit: vi.fn(),
  assertConfiguredStripePrice: vi.fn(),
  getPlanFromPriceId: vi.fn((id: string) =>
    id.startsWith("price_moodday") ? "plus" : null,
  ),
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { list: vi.fn(), create: vi.fn() } },
    subscriptions: { list: vi.fn() },
  },
}));

vi.mock("@/lib/actions/safe-actions", () => ({
  sensitiveAuthAction: actionClient,
}));
vi.mock("@/lib/features/availability", () => ({
  assertFeatureAvailable: mocks.assertFeatureAvailable,
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/lib/billing/catalog", () => ({
  BILLING_CATALOG_VERSION: "2026-08",
  assertConfiguredStripePrice: mocks.assertConfiguredStripePrice,
  getPlanFromPriceId: mocks.getPlanFromPriceId,
}));
vi.mock("@/lib/server-url", () => ({
  getServerUrl: () => "https://moodday.invalid",
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => mocks.stripe }));
vi.mock("@/lib/env", () => ({ env: { STRIPE_TAX_ENABLED: true } }));

import { upgradeUserAction } from "@/features/plans/plans.action";

const user = {
  id: "user-1",
  email: "user@moodday.invalid",
  name: "Camille",
};
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(parsedInput: Record<string, unknown>) =>
  (upgradeUserAction as unknown as Handler<T>)({
    parsedInput,
    ctx: { user },
  });

const checkoutInput = {
  plan: "plus",
  annual: false,
  successUrl: "/settings/subscription",
  cancelUrl: "/pricing",
};

const dbUser = {
  stripeCustomerId: "cus_1",
  email: user.email,
  name: user.name,
  subscription: null,
};

describe("Moodday Plus checkout action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertConfiguredStripePrice.mockResolvedValue({
      id: "price_moodday_monthly",
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
    mocks.stripe.checkout.sessions.list.mockResolvedValue({ data: [] });
    mocks.stripe.subscriptions.list.mockResolvedValue({ data: [] });
    mocks.stripe.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.invalid/session",
    });
  });

  it("creates a new Stripe customer and an eligible annual trial checkout", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...dbUser,
      stripeCustomerId: null,
    } as never);
    mocks.stripe.customers.create.mockResolvedValue({ id: "cus_new" });
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    mocks.assertConfiguredStripePrice.mockResolvedValue({
      id: "price_moodday_yearly",
    });

    await expect(
      invoke({
        ...checkoutInput,
        annual: true,
        successUrl: "/settings/subscription?source=pricing",
      }),
    ).resolves.toEqual({
      url: "https://checkout.stripe.invalid/session",
    });

    expect(mocks.assertFeatureAvailable).toHaveBeenCalledWith("billing");
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith({
      scope: "stripe-checkout",
      identifier: user.id,
      max: 5,
      windowSeconds: 3600,
    });
    expect(mocks.stripe.customers.create).toHaveBeenCalledWith({
      email: user.email,
      name: user.name,
      metadata: { app: "moodday", userId: user.id },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        line_items: [{ price: "price_moodday_yearly", quantity: 1 }],
        payment_method_collection: "if_required",
        automatic_tax: { enabled: true },
        success_url:
          "https://moodday.invalid/settings/subscription?source=pricing&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://moodday.invalid/pricing",
        subscription_data: expect.objectContaining({
          trial_period_days: 14,
          trial_settings: {
            end_behavior: { missing_payment_method: "cancel" },
          },
        }),
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining(
          "moodday-checkout-user-1-yearly-",
        ),
      }),
    );
  });

  it("reuses a matching open checkout rather than creating a duplicate", async () => {
    mocks.stripe.checkout.sessions.list.mockResolvedValue({
      data: [
        {
          mode: "subscription",
          client_reference_id: user.id,
          url: "https://checkout.stripe.invalid/open",
        },
      ],
    });

    await expect(invoke(checkoutInput)).resolves.toEqual({
      url: "https://checkout.stripe.invalid/open",
    });
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it.each(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"])(
    "blocks a second Moodday subscription in %s state",
    async (status) => {
      mocks.stripe.subscriptions.list.mockResolvedValue({
        data: [
          {
            status,
            trial_start: null,
            items: { data: [{ price: { id: "price_moodday_monthly" } }] },
          },
        ],
      });

      await expect(invoke(checkoutInput)).rejects.toThrow(
        "subscription already exists",
      );
      expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
    },
  );

  it("does not grant another trial after local or provider trial history", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...dbUser,
      subscription: {
        trialUsedAt: new Date("2026-01-01T00:00:00.000Z"),
        stripeSubscriptionId: "sub_old",
      },
    } as never);
    mocks.stripe.subscriptions.list.mockResolvedValue({
      data: [
        {
          status: "canceled",
          trial_start: 1_700_000_000,
          items: { data: [{ price: { id: "price_moodday_monthly" } }] },
        },
        {
          status: "active",
          trial_start: null,
          items: { data: [{ price: { id: "price_unrelated" } }] },
        },
      ],
    });

    await invoke(checkoutInput);
    expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_collection: "always",
        subscription_data: expect.not.objectContaining({
          trial_period_days: expect.anything(),
        }),
      }),
      expect.any(Object),
    );
  });

  it("fails closed when the local user or checkout URL is missing", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    await expect(invoke(checkoutInput)).rejects.toThrow("User not found");

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(dbUser as never);
    mocks.stripe.checkout.sessions.create.mockResolvedValueOnce({ url: null });
    await expect(invoke(checkoutInput)).rejects.toThrow(
      "Failed to create checkout session",
    );
  });
});
