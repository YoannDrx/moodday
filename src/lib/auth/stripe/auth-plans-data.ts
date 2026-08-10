import {
  Calendar,
  FileText,
  Pill,
  Sparkles,
  Users,
} from "lucide-react";
import type { PlanCode } from "@/lib/billing/entitlements";

const DEFAULT_LIMIT = {
  medications: -1,
  historyDays: 30,
  caregivers: 1,
};

export type PlanLimit = typeof DEFAULT_LIMIT;

/**
 * Client-safe plan data (no server-side hooks or env vars)
 * This can be safely imported in "use client" components
 */
export type AppAuthPlanData = {
  name: PlanCode;
  description?: string;
  isPopular?: boolean;
  price: number;
  yearlyPrice?: number;
  currency: string;
  isHidden?: boolean;
  limits: PlanLimit;
  freeTrial?: {
    days: number;
  };
};

export const AUTH_PLANS_DATA: AppAuthPlanData[] = [
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
    limits: {
      medications: -1, // Illimité
      historyDays: -1, // Illimité
      caregivers: 3,
    },
    freeTrial: {
      days: 14,
    },
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
  const planLimits = AUTH_PLANS_DATA.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
