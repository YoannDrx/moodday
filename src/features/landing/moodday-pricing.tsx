"use client";

import { buttonVariants } from "@/components/ui/button";
import { useHydration } from "@/hooks/use-hydration";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Heart,
  type LucideIcon,
  Sparkles,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const planIcons: LucideIcon[] = [Heart, Sparkles, Star];
const planKeys = ["free", "premium", "family"] as const;
const planPrices = [
  { monthly: 0, yearly: 0 },
  { monthly: 4.99, yearly: 39.99 },
  { monthly: 9.99, yearly: 79.99 },
];
const planLinks = [
  "/auth/signup?plan=free",
  "/auth/signup?plan=premium",
  "/contact?plan=family",
];
const planPopular = [false, true, false];

export function MooddayPricing() {
  const { t, tm } = useI18n();
  const isHydrated = useHydration();
  const [isYearly, setIsYearly] = useState(true);

  const plans = planKeys.map((key, index) => ({
    name: t(`moodday.pricing.plans.${key}.name`),
    description: t(`moodday.pricing.plans.${key}.description`),
    price: planPrices[index],
    features: tm<string[]>(`moodday.pricing.plans.${key}.features`) ?? [],
    cta: t(`moodday.pricing.plans.${key}.cta`),
    ctaLink: planLinks[index],
    popular: planPopular[index],
    icon: planIcons[index],
  }));

  return (
    <section id="pricing" className="relative py-20 lg:py-32">
      {/* Background */}
      <div className="via-lavender/10 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={isHydrated ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="bg-lavender/30 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            {t("moodday.pricing.badge")}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            {t("moodday.pricing.title")}{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              {t("moodday.pricing.titleHighlight")}
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("moodday.pricing.subtitle")}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <span
            className={cn(
              "text-sm font-medium",
              !isYearly ? "text-gray-900 dark:text-gray-100" : "text-gray-500",
            )}
          >
            {t("moodday.pricing.monthly")}
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={cn(
              "relative h-8 w-14 rounded-full transition-colors",
              isYearly ? "bg-primary" : "bg-gray-300 dark:bg-gray-600",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-6 rounded-full bg-white shadow transition-transform",
                isYearly ? "left-7" : "left-1",
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium",
              isYearly ? "text-gray-900 dark:text-gray-100" : "text-gray-500",
            )}
          >
            {t("moodday.pricing.yearly")}
            <span className="bg-sage/10 text-sage ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold">
              {t("moodday.pricing.discount")}
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={isHydrated ? { opacity: 0, y: 20 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PricingCard plan={plan} isYearly={isYearly} t={t} />
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.p
          initial={isHydrated ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {t("moodday.pricing.trustBadge")}
        </motion.p>
      </div>
    </section>
  );
}

type PlanType = {
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  features: string[];
  cta: string;
  ctaLink: string;
  popular: boolean;
  icon: LucideIcon;
};

function PricingCard({
  plan,
  isYearly,
  t,
}: {
  plan: PlanType;
  isYearly: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const price = isYearly ? plan.price.yearly : plan.price.monthly;
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "glass-card relative flex h-full flex-col rounded-3xl p-8",
        plan.popular ? "ring-primary shadow-lg ring-2" : "shadow-soft",
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg">
            {t("moodday.pricing.mostPopular")}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className={cn(
            "mb-4 inline-flex size-12 items-center justify-center rounded-2xl",
            plan.popular
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          <Icon className="size-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {plan.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {price === 0 ? plan.name : `${price}€`}
          </span>
          {price > 0 && (
            <span className="text-sm text-gray-500">
              {isYearly
                ? t("moodday.pricing.perYear")
                : t("moodday.pricing.perMonth")}
            </span>
          )}
        </div>
        {isYearly && price > 0 && (
          <p className="text-sage mt-1 text-xs">
            {t("moodday.pricing.equivalent", {
              price: (price / 12).toFixed(2),
            })}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              className={cn(
                "mt-0.5 size-5 shrink-0",
                plan.popular ? "text-primary" : "text-sage",
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaLink}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full gap-2 rounded-2xl",
          plan.popular
            ? "bg-primary hover:bg-primary/90"
            : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200",
        )}
      >
        {plan.cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
