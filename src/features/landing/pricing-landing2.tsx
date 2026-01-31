"use client";

import { buttonVariants } from "@/components/ui/button";
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
import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "./shared";

const planIcons: LucideIcon[] = [Heart, Sparkles, Star];
const planKeys = ["free", "pro", "family"] as const;
const planPrices = [
  { monthly: 0, annual: 0 },
  { monthly: 9.99, annual: 7.99 },
  { monthly: 19.99, annual: 14.99 },
];
const planLinks = [
  "/auth/signup?plan=free",
  "/auth/signup?plan=pro",
  "/contact?plan=family",
];
const planPopular = [false, true, false];

export function PricingLanding2() {
  const { t, tm } = useI18n();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = planKeys.map((key, index) => ({
    name: t(`landing2.pricing.plans.${key}.name`),
    description: t(`landing2.pricing.plans.${key}.description`),
    price: planPrices[index],
    features: tm<string[]>(`landing2.pricing.plans.${key}.features`) ?? [],
    cta: t(`landing2.pricing.plans.${key}.cta`),
    ctaLink: planLinks[index],
    popular: planPopular[index],
    icon: planIcons[index],
  }));

  return (
    <section id="pricing" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-primary mb-4 text-sm font-medium tracking-widest uppercase">
              {t("landing2.pricing.badge")}
            </p>
            <h2 className="text-foreground mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
              {t("landing2.pricing.title")}
            </h2>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
              {t("landing2.pricing.subtitle")}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  !isAnnual ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t("landing2.pricing.toggle.monthly")}
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={cn(
                  "relative h-8 w-14 rounded-full transition-colors",
                  isAnnual ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-6 rounded-full bg-white shadow transition-transform",
                    isAnnual ? "left-7" : "left-1",
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isAnnual ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t("landing2.pricing.toggle.annual")}
                <span className="ml-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t("landing2.pricing.toggle.discount")}
                </span>
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={index * 100} direction="up">
              <PricingCard plan={plan} isAnnual={isAnnual} t={t} />
            </ScrollReveal>
          ))}
        </div>

        {/* Trust Badge */}
        <ScrollReveal delay={400}>
          <p className="text-muted-foreground mt-12 text-center text-sm">
            {t("landing2.pricing.trustBadge")}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

type PlanType = {
  name: string;
  description: string;
  price: { monthly: number; annual: number };
  features: string[];
  cta: string;
  ctaLink: string;
  popular: boolean;
  icon: LucideIcon;
};

function PricingCard({
  plan,
  isAnnual,
  t,
}: {
  plan: PlanType;
  isAnnual: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const price = isAnnual ? plan.price.annual : plan.price.monthly;
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-8 transition-all duration-300",
        plan.popular
          ? "border-primary from-primary/10 shadow-primary/10 bg-gradient-to-b to-transparent shadow-lg"
          : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-lg",
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold shadow-lg">
            <Sparkles className="size-3" />
            {t("landing2.pricing.popular")}
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
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-6" />
        </div>
        <h3 className="text-foreground text-xl font-bold">{plan.name}</h3>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-foreground text-4xl font-bold">
            {price === 0 ? plan.name : `${price}€`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground text-sm">
              {t("landing2.pricing.perMonth")}
            </span>
          )}
        </div>
        {isAnnual && price > 0 && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {t("landing2.pricing.billedAnnually", {
              amount: (price * 12).toFixed(0),
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
                plan.popular
                  ? "text-primary"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            />
            <span className="text-muted-foreground text-sm">{feature}</span>
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
            : "bg-muted text-foreground hover:bg-muted/80",
        )}
      >
        {plan.cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
