import type { Subscription } from "@/generated/prisma";
import {
  Calendar,
  FileText,
  Pill,
  Sparkles,
  Users,
} from "lucide-react";
import type { PlanCode } from "@/lib/billing/entitlements";
import {
  sendTrialConvertedEmail,
  sendTrialExpiredEmail,
  sendTrialWelcomeEmail,
  sendSubscriptionCanceledEmail,
} from "./subscription-emails";

const DEFAULT_LIMIT = {
  medications: -1,
  historyDays: 30,
  caregivers: 1,
};

export type PlanLimit = typeof DEFAULT_LIMIT;

type HookCtx = {
  req: Request;
  userId: string;
  stripeCustomerId: string;
  subscriptionId: string;
};

export type AppAuthPlan = {
  priceId?: string | undefined;
  lookupKey?: string | undefined;
  annualDiscountPriceId?: string | undefined;
  annualDiscountLookupKey?: string | undefined;
  name: PlanCode;
  limits?: Record<string, number> | undefined;
  group?: string;
  freeTrial?: {
    days: number;
    onTrialStart?: (subscription: Subscription, ctx: HookCtx) => Promise<void>;
    onTrialEnd?: (
      data: {
        subscription: Subscription;
      },
      ctx: HookCtx,
    ) => Promise<void>;
    onTrialExpired?: (
      subscription: Subscription,
      ctx: HookCtx,
    ) => Promise<void>;
  };
  onSubscriptionCanceled?: (
    subscription: Subscription,
    ctx: HookCtx,
  ) => Promise<void>;
} & {
  description?: string;
  isPopular?: boolean;
  price: number;
  yearlyPrice?: number;
  currency: string;
  isHidden?: boolean;
  limits: PlanLimit;
};

export const AUTH_PLANS: AppAuthPlan[] = [
  {
    name: "free",
    limits: DEFAULT_LIMIT,
    price: 0,
    currency: "EUR",
    yearlyPrice: 0,
  },
  {
    name: "plus",
    isPopular: true,
    priceId: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_PLUS_YEARLY_PRICE_ID ?? "",
    limits: {
      medications: -1, // Illimité
      historyDays: -1, // Illimité
      caregivers: 3,
    },
    freeTrial: {
      days: 14,
      onTrialStart: sendTrialWelcomeEmail,
      onTrialExpired: sendTrialExpiredEmail,
      onTrialEnd: sendTrialConvertedEmail,
    },
    onSubscriptionCanceled: sendSubscriptionCanceledEmail,
    price: 7.99,
    yearlyPrice: 59.99,
    currency: "EUR",
  },
];

// Limits transformation object
export const LIMITS_CONFIG: Record<
  keyof PlanLimit,
  {
    icon: React.ElementType;
  }
> = {
  medications: {
    icon: Pill,
  },
  historyDays: {
    icon: Calendar,
  },
  caregivers: {
    icon: Users,
  },
};

// Additional features by plan
export const ADDITIONAL_FEATURES = {
  free: [Sparkles, FileText],
  plus: [FileText, Sparkles, Users],
};

export const getPlanLimits = (plan: PlanCode = "free"): PlanLimit => {
  const planLimits = AUTH_PLANS.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
