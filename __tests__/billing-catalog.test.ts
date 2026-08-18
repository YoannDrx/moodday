import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("server-only", () => ({}));

import { isExpectedMooddayPlusPrice } from "../src/lib/billing/catalog";

function makePrice(overrides: Record<string, unknown> = {}) {
  return {
    id: "price_monthly",
    active: true,
    currency: "eur",
    unit_amount: 799,
    recurring: { interval: "month" },
    tax_behavior: "inclusive",
    lookup_key: "moodday_plus_monthly_eur_v1",
    metadata: { app: "moodday", plan: "plus", catalog_version: "1" },
    product: {
      id: "prod_moodday",
      object: "product",
      active: true,
      name: "Moodday Plus",
      metadata: {
        app: "moodday",
        plan: "plus",
        catalog_version: "1",
        lifecycle: "public",
      },
    },
    ...overrides,
  } as unknown as Stripe.Price;
}

describe("Moodday Stripe catalogue", () => {
  it("accepts only the complete allowlisted monthly product", () => {
    expect(isExpectedMooddayPlusPrice(makePrice(), "monthly")).toBe(true);
  });

  it.each([
    ["wrong amount", { unit_amount: 899 }],
    ["wrong lookup key", { lookup_key: "another_product" }],
    ["exclusive taxes", { tax_behavior: "exclusive" }],
    ["unexpanded product", { product: "prod_moodday" }],
    [
      "foreign product metadata",
      {
        product: {
          active: true,
          name: "Moodday Plus",
          metadata: {
            app: "another-app",
            plan: "plus",
            catalog_version: "1",
            lifecycle: "public",
          },
        },
      },
    ],
  ])("rejects %s", (_label, overrides) => {
    expect(isExpectedMooddayPlusPrice(makePrice(overrides), "monthly")).toBe(
      false,
    );
  });
});
