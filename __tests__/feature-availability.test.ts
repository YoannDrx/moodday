import { env } from "@/lib/env";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  assertFeatureAvailable,
  getClientVisibleFeatures,
  getFeatureAvailability,
  isAiInsightsAvailableForUser,
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
      "ACCOUNT_IMPORT_ENABLED",
      "ADMIN_ENABLED",
      "AI_INSIGHTS_ENABLED",
      "BILLING_ENABLED",
      "CAREGIVER_SHARING_ENABLED",
      "PUSH_NOTIFICATIONS_ENABLED",
      "OPENAI_API_KEY",
      "AI_SAFETY_HMAC_SECRET",
      "AI_INTERNAL_USER_IDS",
      "STRIPE_PRODUCT_TAX_CODE",
      ...Object.keys(billingConfiguration),
      ...Object.keys(pushConfiguration),
    ]) {
      mutableEnv[key] = undefined;
    }
    mutableEnv.AI_ROLLOUT_MODE = "internal";
    mutableEnv.STRIPE_TAX_ENABLED = false;
  });

  it.each([
    ["accountImport", "ACCOUNT_IMPORT_ENABLED"],
    ["admin", "ADMIN_ENABLED"],
  ] as const)("honors the %s flag", (feature, flag) => {
    expect(getFeatureAvailability(feature)).toEqual({
      enabled: false,
      reason: "disabled_by_flag",
    });
    mutableEnv[flag] = true;
    expect(getFeatureAvailability(feature)).toEqual({
      enabled: true,
      reason: "available",
    });
  });

  it("requires caregiver email and cron configuration after its flag is enabled", () => {
    mutableEnv.CAREGIVER_SHARING_ENABLED = true;
    expect(getFeatureAvailability("caregiverSharing")).toEqual({
      enabled: false,
      reason: "incomplete_configuration",
    });

    mutableEnv.RESEND_API_KEY = "resend";
    mutableEnv.CRON_SECRET = "cron";
    expect(getFeatureAvailability("caregiverSharing")).toEqual({
      enabled: true,
      reason: "available",
    });
  });

  it("requires both AI secrets after the AI flag is enabled", () => {
    mutableEnv.AI_INSIGHTS_ENABLED = true;
    mutableEnv.OPENAI_API_KEY = "   ";
    expect(getFeatureAvailability("aiInsights")).toEqual({
      enabled: false,
      reason: "incomplete_configuration",
    });

    mutableEnv.OPENAI_API_KEY = "openai";
    mutableEnv.AI_SAFETY_HMAC_SECRET = "hmac";
    expect(getFeatureAvailability("aiInsights")).toEqual({
      enabled: true,
      reason: "available",
    });
  });

  it("keeps AI restricted to the internal allowlist until public rollout", () => {
    mutableEnv.AI_INSIGHTS_ENABLED = true;
    mutableEnv.OPENAI_API_KEY = "openai";
    mutableEnv.AI_SAFETY_HMAC_SECRET = "hmac";
    mutableEnv.AI_INTERNAL_USER_IDS = "internal-1, internal-2";

    expect(isAiInsightsAvailableForUser("internal-2")).toBe(true);
    expect(isAiInsightsAvailableForUser("external")).toBe(false);
    mutableEnv.AI_ROLLOUT_MODE = "public";
    expect(isAiInsightsAvailableForUser("external")).toBe(true);
  });

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
    mutableEnv.CAREGIVER_SHARING_ENABLED = true;
    mutableEnv.RESEND_API_KEY = "resend";
    mutableEnv.CRON_SECRET = "cron";

    expect(getClientVisibleFeatures()).toEqual({
      billing: false,
      caregiverSharing: true,
      pushNotifications: false,
    });
    expect(() => assertFeatureAvailable("billing")).toThrow(
      "Feature unavailable: disabled_by_flag",
    );
    expect(() => assertFeatureAvailable("caregiverSharing")).not.toThrow();
  });
});
