import type { Subscription } from "@prisma/client";

export type PlanCode = "free" | "plus";

export type Entitlements = {
  analyticsWindowDays: 30 | null;
  aiGenerationsPerMonth: 0 | 8;
  caregiverLimit: 1 | 3;
  consultationReports: boolean;
  advancedCorrelations: boolean;
  advancedNotificationRules: boolean;
};

export const PLAN_ENTITLEMENTS: Record<PlanCode, Entitlements> = {
  free: {
    analyticsWindowDays: 30,
    aiGenerationsPerMonth: 0,
    caregiverLimit: 1,
    consultationReports: false,
    advancedCorrelations: false,
    advancedNotificationRules: false,
  },
  plus: {
    analyticsWindowDays: null,
    aiGenerationsPerMonth: 8,
    caregiverLimit: 3,
    consultationReports: true,
    advancedCorrelations: true,
    advancedNotificationRules: true,
  },
};

type SubscriptionAccess = Pick<
  Subscription,
  "plan" | "status" | "periodEnd" | "cancelAtPeriodEnd" | "graceEndsAt"
>;

export function normalizePlanCode(plan?: string | null): PlanCode {
  return plan === "plus" || plan === "pro" || plan === "ultra"
    ? "plus"
    : "free";
}

export function getEffectivePlan(
  subscription?: SubscriptionAccess | null,
  now = new Date(),
): PlanCode {
  if (!subscription || normalizePlanCode(subscription.plan) !== "plus") {
    return "free";
  }

  const status = subscription.status;
  if (status === "active" || status === "trialing") {
    if (
      subscription.cancelAtPeriodEnd &&
      subscription.periodEnd &&
      subscription.periodEnd.getTime() <= now.getTime()
    ) {
      return "free";
    }
    return "plus";
  }

  if (status === "past_due") {
    return subscription.graceEndsAt &&
      subscription.graceEndsAt.getTime() > now.getTime()
      ? "plus"
      : "free";
  }

  return "free";
}

export function getEntitlements(
  subscription?: SubscriptionAccess | null,
  now = new Date(),
): Entitlements {
  return PLAN_ENTITLEMENTS[getEffectivePlan(subscription, now)];
}

export function getBillingPeriodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
