"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import {
  ADDITIONAL_FEATURES,
  LIMITS_CONFIG,
  type AppAuthPlanData,
} from "@/lib/auth/stripe/auth-plans-data";
import { BILLING_URL } from "@/lib/LINKS";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { LoadingButton } from "../form/submit-button";
import { upgradeUserAction } from "./plans.action";

export type PricingMode = "landing" | "dashboard";

export function PricingCard({
  plan,
  isYearly,
  mode = "dashboard",
}: {
  plan: AppAuthPlanData;
  isYearly?: boolean;
  mode?: PricingMode;
}) {
  const { locale, t, tm } = useI18n();
  // Get the current user (only needed in dashboard mode)
  const { data: session } = useSession();

  const { execute: upgradeUser, isPending } = useAction(upgradeUserAction, {
    onSuccess: (result) => {
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error) => {
      toast.error(error.error.serverError ?? t("pricingCard.upgradeError"));
    },
  });

  // Calculate pricing details
  const monthlyPrice = plan.price;
  const yearlyPrice = plan.yearlyPrice ?? plan.price * 12;
  const displayPrice = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const originalPrice = isYearly ? monthlyPrice : null;

  // Calculate discount percentage
  const calculateDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const annualCost = monthlyPrice * 12;
    const discount = ((annualCost - yearlyPrice) / annualCost) * 100;
    return Math.round(discount);
  };

  const discount = calculateDiscount(plan.price, plan.yearlyPrice ?? 0);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: plan.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  const additionalFeatures =
    tm<{ label: string; description: string }[]>(
      `plans.additionalFeatures.${plan.name}`,
    ) ?? [];
  const additionalIcons =
    ADDITIONAL_FEATURES[plan.name as keyof typeof ADDITIONAL_FEATURES];

  return (
    <Card
      className={cn(
        "flex flex-col pb-0 transition-all duration-200 hover:shadow-lg",
        plan.isPopular && "border-primary relative overflow-hidden shadow-md",
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-5 right-0">
          <div className="bg-primary text-primary-foreground rounded-l-full px-4 py-1 text-xs font-semibold">
            {t("pricingCard.mostPopular")}
          </div>
        </div>
      )}

      <CardHeader className={cn("pb-0")}>
        <CardTitle className="text-2xl capitalize">
          {t(`plans.names.${plan.name}`)}
        </CardTitle>
        <CardDescription className="mt-1.5">
          {t(`plans.descriptions.${plan.name}`)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-6">
        <div className="mb-8">
          <div className="flex items-baseline">
            <span className="text-5xl font-bold tracking-tight">
              {formatCurrency(displayPrice)}
            </span>
            <span className="text-muted-foreground ml-1.5">
              {t("pricingCard.perMonth")}
            </span>
          </div>

          {isYearly && originalPrice !== null && originalPrice > 0 && (
            <div className="mt-2 flex items-center">
              <span className="text-muted-foreground mr-2 line-through">
                {formatCurrency(originalPrice)} {t("pricingCard.perMonth")}
              </span>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                {t("pricingCard.save", { percent: `${discount}%` })}
              </Badge>
            </div>
          )}

          {isYearly && yearlyPrice > 0 && (
            <p className="text-muted-foreground mt-2 text-sm">
              {t("pricingCard.billedYearly", {
                amount: formatCurrency(yearlyPrice),
              })}
            </p>
          )}

          {plan.freeTrial && (
            <div className="bg-primary/10 text-primary mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
              <Clock className="mr-1.5 size-3.5" />
              {t("pricingCard.freeTrial", { days: plan.freeTrial.days })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h4 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            {t("pricingCard.includes")}
          </h4>

          <ul className="space-y-5">
            {/* Generate features from limits object */}
            {Object.entries(plan.limits).map(([key, value]) => {
              const limitConfig =
                LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];

              const Icon = limitConfig.icon;

              return (
                <li key={key} className="flex items-start">
                  <div className="text-primary mt-0.5 mr-3 size-5 shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {t(`plans.limits.${key}.label`, {
                        value: value as number,
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t(`plans.limits.${key}.description`)}
                    </p>
                  </div>
                </li>
              );
            })}

            {/* Additional features based on plan */}
            {additionalIcons.map((Icon, index) => {
              const translated = additionalFeatures.at(index);

              if (!translated) {
                return null;
              }

              return (
                <li key={index} className="flex items-start">
                  <div className="text-primary mt-0.5 mr-3 size-5 shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{translated.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {translated.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-6 pb-8">
        {mode === "landing" ? (
          <Link
            href={`/auth/signup?plan=${plan.name}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full text-base font-medium",
              plan.isPopular ? "bg-primary hover:bg-primary/90" : "",
            )}
          >
            {plan.price === 0
              ? t("pricingCard.ctaFree")
              : isYearly
                ? t("pricingCard.ctaYearly")
                : t("pricingCard.ctaMonthly")}
          </Link>
        ) : (
          <LoadingButton
            loading={isPending}
            size="lg"
            className={cn(
              "w-full text-base font-medium",
              plan.isPopular ? "bg-primary hover:bg-primary/90" : "",
            )}
            onClick={() => {
              if (!session?.user) {
                toast.error(t("pricingCard.signInRequired"));
                return;
              }
              upgradeUser({
                plan: plan.name,
                annual: isYearly,
                successUrl: `${BILLING_URL}/success`,
                cancelUrl: `${BILLING_URL}/cancel`,
              });
            }}
          >
            {plan.price === 0
              ? t("pricingCard.ctaFree")
              : isYearly
                ? t("pricingCard.ctaYearly")
                : t("pricingCard.ctaMonthly")}
          </LoadingButton>
        )}
      </CardFooter>
    </Card>
  );
}
