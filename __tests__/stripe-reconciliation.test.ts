import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/billing/catalog", () => ({
  getPlanFromPriceId: (priceId: string | null) =>
    priceId === "price_approved" ? { plan: "plus" } : null,
}));

import { auditSubscriptionReconciliation } from "@/lib/billing/reconciliation";

const remote = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "sub_approved",
    status: "active",
    cancel_at_period_end: false,
    metadata: { app: "moodday", plan: "plus" },
    items: {
      data: [
        {
          price: { id: "price_approved" },
          current_period_end: 1_800_000_000,
        },
      ],
    },
    ...overrides,
  }) as unknown as Stripe.Subscription;

const local = (overrides: Record<string, unknown> = {}) => ({
  stripeSubscriptionId: "sub_approved",
  status: "active",
  priceId: "price_approved",
  periodEnd: new Date(1_800_000_000_000),
  cancelAtPeriodEnd: false,
  ...overrides,
});

describe("Stripe bidirectional reconciliation", () => {
  it("accepts matching local and remote state", () => {
    expect(
      auditSubscriptionReconciliation({ local: [local()], remote: [remote()] }),
    ).toEqual({
      checkedLocal: 1,
      checkedRemote: 1,
      mismatches: 0,
      missingRemote: 0,
      missingLocal: 0,
      ambiguousRemote: 0,
    });
  });

  it("detects each direction and an unknown Moodday price", () => {
    expect(
      auditSubscriptionReconciliation({
        local: [local({ stripeSubscriptionId: "sub_missing" })],
        remote: [
          remote(),
          remote({
            id: "sub_unknown",
            items: {
              data: [
                {
                  price: { id: "price_unknown" },
                  current_period_end: 1_800_000_000,
                },
              ],
            },
          }),
        ],
      }),
    ).toMatchObject({
      missingRemote: 1,
      missingLocal: 1,
      ambiguousRemote: 1,
    });
  });

  it("detects status, price, period and cancellation mismatches", () => {
    expect(
      auditSubscriptionReconciliation({
        local: [local({ status: "past_due" })],
        remote: [remote()],
      }).mismatches,
    ).toBe(1);
  });
});
