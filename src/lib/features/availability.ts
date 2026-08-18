import "server-only";

import { env } from "@/lib/env";
import { ActionError } from "@/lib/errors/action-error";

export type RuntimeFeature =
  | "accountImport"
  | "admin"
  | "aiInsights"
  | "billing"
  | "caregiverSharing"
  | "pushNotifications";

export type FeatureAvailability = {
  enabled: boolean;
  reason: "available" | "disabled_by_flag" | "incomplete_configuration";
};

const available = (): FeatureAvailability => ({
  enabled: true,
  reason: "available",
});

const disabledByFlag = (): FeatureAvailability => ({
  enabled: false,
  reason: "disabled_by_flag",
});

const incompleteConfiguration = (): FeatureAvailability => ({
  enabled: false,
  reason: "incomplete_configuration",
});

const hasValues = (...values: (string | undefined)[]) =>
  values.every((value) => Boolean(value?.trim()));

export function getFeatureAvailability(
  feature: RuntimeFeature,
): FeatureAvailability {
  switch (feature) {
    case "accountImport":
      return env.ACCOUNT_IMPORT_ENABLED ? available() : disabledByFlag();
    case "admin":
      return env.ADMIN_ENABLED ? available() : disabledByFlag();
    case "aiInsights":
      if (!env.AI_INSIGHTS_ENABLED) return disabledByFlag();
      return hasValues(env.OPENAI_API_KEY, env.AI_SAFETY_HMAC_SECRET)
        ? available()
        : incompleteConfiguration();
    case "billing":
      if (!env.BILLING_ENABLED) return disabledByFlag();
      return hasValues(
        env.STRIPE_SECRET_KEY,
        env.STRIPE_ACCOUNT_ID,
        env.STRIPE_PLUS_MONTHLY_PRICE_ID,
        env.STRIPE_PLUS_YEARLY_PRICE_ID,
        env.STRIPE_PORTAL_CONFIGURATION_ID,
        env.STRIPE_WEBHOOK_SECRET,
      ) &&
        (!env.STRIPE_TAX_ENABLED || hasValues(env.STRIPE_PRODUCT_TAX_CODE))
        ? available()
        : incompleteConfiguration();
    case "caregiverSharing":
      if (!env.CAREGIVER_SHARING_ENABLED) return disabledByFlag();
      return hasValues(env.RESEND_API_KEY, env.CRON_SECRET)
        ? available()
        : incompleteConfiguration();
    case "pushNotifications":
      if (!env.PUSH_NOTIFICATIONS_ENABLED) return disabledByFlag();
      return hasValues(
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
        env.VAPID_SUBJECT,
        env.CRON_SECRET,
        env.RESEND_API_KEY,
        env.OPERATIONAL_ALERT_EMAIL,
      )
        ? available()
        : incompleteConfiguration();
  }
}

export function isAiInsightsAvailableForUser(userId: string) {
  if (!getFeatureAvailability("aiInsights").enabled) return false;
  if (env.AI_ROLLOUT_MODE === "public") return true;
  return new Set(
    (env.AI_INTERNAL_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ).has(userId);
}

export const getClientVisibleFeatures = () => ({
  billing: getFeatureAvailability("billing").enabled,
  caregiverSharing: getFeatureAvailability("caregiverSharing").enabled,
  pushNotifications: getFeatureAvailability("pushNotifications").enabled,
});

export const assertFeatureAvailable = (feature: RuntimeFeature) => {
  const availability = getFeatureAvailability(feature);
  if (!availability.enabled) {
    throw new ActionError(`Feature unavailable: ${availability.reason}`);
  }
};
