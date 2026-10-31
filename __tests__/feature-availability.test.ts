import { env } from "@/lib/env";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  assertFeatureAvailable,
  getClientVisibleFeatures,
  getFeatureAvailability,
} from "@/lib/features/availability";

const mutableEnv = env as unknown as Record<
  string,
  string | boolean | undefined
>;

const billingConfiguration = {
  STRIPE_SECRET_KEY: "sk_test",
  STRIPE_ACCOUNT_ID: "acct_test",
  STRIPE_PLUS_MONTHLY_PRICE_ID: "price_monthly",
  STRIPE_PLUS_YEARLY_PRICE_ID: "price_yearly",
  STRIPE_PORTAL_CONFIGURATION_ID: "bpc_test",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
};

const pushConfiguration = {
  VAPID_PUBLIC_KEY: "public",
  VAPID_PRIVATE_KEY: "private",
  VAPID_SUBJECT: "mailto:ops@example.test",
  CRON_SECRET: "cron",
  RESEND_API_KEY: "resend",
  OPERATIONAL_ALERT_EMAIL: "ops@example.test",
};

describe("runtime feature availability", () => {
  beforeEach(() => {
    for (const key of [
      "ADMIN_ENABLED",
      "BILLING_ENABLED",
      "PUSH_NOTIFICATIONS_ENABLED",
      "STRIPE_PRODUCT_TAX_CODE",
      ...Object.keys(billingConfiguration),
      ...Object.keys(pushConfiguration),
    ]) {
      mutableEnv[key] = undefined;
    }
    mutableEnv.STRIPE_TAX_ENABLED = false;
  });

  it.each([["admin", "ADMIN_ENABLED"]] as const)(
    "honors the %s flag",
    (feature, flag) => {
      expect(getFeatureAvailability(feature)).toEqual({
        enabled: false,
        reason: "disabled_by_flag",
      });
      mutableEnv[flag] = true;
      expect(getFeatureAvailability(feature)).toEqual({
        enabled: true,
        reason: "available",
      });
    },
  );

  it("requires the server-owned Stripe catalog and webhook configuration", () => {
    mutableEnv.BILLING_ENABLED = true;
    Object.assign(mutableEnv, billingConfiguration);
    mutableEnv.STRIPE_PLUS_YEARLY_PRICE_ID = "";
    expect(getFeatureAvailability("billing").reason).toBe(
      "incomplete_configuration",
    );

    mutableEnv.STRIPE_PLUS_YEARLY_PRICE_ID = "price_yearly";
    expect(getFeatureAvailability("billing")).toEqual({
      enabled: true,
      reason: "available",
    });
  });

  it("fails billing closed when Stripe Tax lacks a reviewed product code", () => {
    mutableEnv.BILLING_ENABLED = true;
    Object.assign(mutableEnv, billingConfiguration);
    mutableEnv.STRIPE_TAX_ENABLED = true;
    expect(getFeatureAvailability("billing").reason).toBe(
      "incomplete_configuration",
    );
    mutableEnv.STRIPE_PRODUCT_TAX_CODE = "txcd_12345678";
    expect(getFeatureAvailability("billing").enabled).toBe(true);
  });

  it("requires push delivery, cron and alert configuration together", () => {
    mutableEnv.PUSH_NOTIFICATIONS_ENABLED = true;
    Object.assign(mutableEnv, pushConfiguration);
    mutableEnv.OPERATIONAL_ALERT_EMAIL = undefined;
    expect(getFeatureAvailability("pushNotifications").reason).toBe(
      "incomplete_configuration",
    );

    mutableEnv.OPERATIONAL_ALERT_EMAIL = "ops@example.test";
    expect(getFeatureAvailability("pushNotifications")).toEqual({
      enabled: true,
      reason: "available",
    });
  });

  it("exposes only safe booleans to the browser and rejects disabled actions", () => {
    expect(getClientVisibleFeatures()).toEqual({
      billing: false,
      coupleSharing: true,
      pushNotifications: false,
    });
    expect(() => assertFeatureAvailable("billing")).toThrow(
      "Feature unavailable: disabled_by_flag",
    );
    mutableEnv.ADMIN_ENABLED = true;
    expect(() => assertFeatureAvailable("admin")).not.toThrow();
  });
});
