import {
  Calendar,
  FileText,
  HeadphonesIcon,
  Pill,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const DEFAULT_LIMIT = {
  medications: 2,
  historyDays: 7,
  caregivers: 0,
};

export type PlanLimit = typeof DEFAULT_LIMIT;

/**
 * Client-safe plan data (no server-side hooks or env vars)
 * This can be safely imported in "use client" components
 */
export type AppAuthPlanData = {
  name: string;
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
    name: "pro",
    isPopular: true,
    limits: {
      medications: -1, // Illimité
      historyDays: -1, // Illimité
      caregivers: 3,
    },
    freeTrial: {
      days: 14,
    },
    price: 9.99,
    yearlyPrice: 95.9,
    currency: "EUR",
  },
  {
    name: "ultra",
    isPopular: false,
    limits: {
      medications: -1, // Illimité
      historyDays: -1, // Illimité
      caregivers: -1, // Illimité
    },
    freeTrial: {
      days: 14,
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
  const planLimits = AUTH_PLANS_DATA.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
