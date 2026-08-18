import { describe, expect, it } from "vitest";

import {
  getEffectivePlan,
  getEntitlements,
  normalizePlanCode,
} from "../src/lib/billing/entitlements";

const baseSubscription = {
  plan: "plus",
  status: "active",
  periodEnd: new Date("2026-09-01T00:00:00.000Z"),
  cancelAtPeriodEnd: false,
  graceEndsAt: null,
};

describe("billing entitlements", () => {
  it("normalizes historical paid plans without granting unknown plans", () => {
    expect(normalizePlanCode("pro")).toBe("plus");
    expect(normalizePlanCode("ultra")).toBe("plus");
    expect(normalizePlanCode("enterprise")).toBe("free");
  });

  it.each(["active", "trialing"])("grants Plus for %s", (status) => {
    expect(getEffectivePlan({ ...baseSubscription, status })).toBe("plus");
  });

  it("keeps Plus until the end of a canceled billing period", () => {
    expect(
      getEffectivePlan(
        { ...baseSubscription, cancelAtPeriodEnd: true },
        new Date("2026-08-20T00:00:00.000Z"),
      ),
    ).toBe("plus");
    expect(
      getEffectivePlan(
        { ...baseSubscription, cancelAtPeriodEnd: true },
        new Date("2026-09-02T00:00:00.000Z"),
      ),
    ).toBe("free");
  });

  it("applies a bounded grace period to past-due subscriptions", () => {
    const pastDue = {
      ...baseSubscription,
      status: "past_due",
      graceEndsAt: new Date("2026-08-14T00:00:00.000Z"),
    };
    expect(
      getEffectivePlan(pastDue, new Date("2026-08-10T00:00:00.000Z")),
    ).toBe("plus");
    expect(
      getEffectivePlan(pastDue, new Date("2026-08-15T00:00:00.000Z")),
    ).toBe("free");
  });

  it.each(["canceled", "unpaid", "paused", "incomplete_expired"])(
    "falls back to Free for %s",
    (status) => {
      expect(getEffectivePlan({ ...baseSubscription, status })).toBe("free");
    },
  );

  it("never limits essential medication tracking", () => {
    expect(getEntitlements(null).analyticsWindowDays).toBe(30);
    expect(getEntitlements(null).caregiverLimit).toBe(1);
  });
});
