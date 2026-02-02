import type { Subscription } from "@/generated/prisma";
import {
  Calendar,
  FileText,
  HeadphonesIcon,
  Pill,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  sendTrialConvertedEmail,
  sendTrialExpiredEmail,
  sendTrialWelcomeEmail,
} from "./subscription-emails";

const DEFAULT_LIMIT = {
  medications: 2,
  historyDays: 7,
  caregivers: 0,
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
  name: string;
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
    name: "pro",
    isPopular: true,
    priceId: process.env.STRIPE_PRO_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_PRO_YEARLY_PLAN_ID ?? "",
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
    price: 9.99,
    yearlyPrice: 95.9,
    currency: "EUR",
  },
  {
    name: "ultra",
    isPopular: false,
    priceId: process.env.STRIPE_ULTRA_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_ULTRA_YEARLY_PLAN_ID ?? "",
    limits: {
      medications: -1, // Illimité
      historyDays: -1, // Illimité
      caregivers: -1, // Illimité
    },
    freeTrial: {
      days: 14,
      onTrialStart: sendTrialWelcomeEmail,
      onTrialExpired: sendTrialExpiredEmail,
      onTrialEnd: sendTrialConvertedEmail,
    },
    price: 19.99,
    yearlyPrice: 191.9,
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
  pro: [FileText, Sparkles, HeadphonesIcon],
  ultra: [Zap, FileText],
};

export const getPlanLimits = (plan = "free"): PlanLimit => {
  const planLimits = AUTH_PLANS.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
