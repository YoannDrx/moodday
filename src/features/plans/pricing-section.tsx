"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/provider";
import { AUTH_PLANS_DATA } from "@/lib/auth/stripe/auth-plans-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { PricingCard, type PricingMode } from "./pricing-card";

export function Pricing({ mode = "dashboard" }: { mode?: PricingMode }) {
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useI18n();

  return (
    <section className="from-background to-muted/20 w-full bg-gradient-to-b py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("pricing.title")}
            </h2>
            <p className="text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("pricing.description")}
            </p>
          </div>

          <div className="bg-muted/50 mt-8 flex w-full max-w-sm flex-wrap items-center justify-center gap-2 rounded-3xl p-2 sm:w-auto sm:max-w-none sm:flex-nowrap sm:gap-4 sm:rounded-full">
            <span
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4",
                !isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {t("pricing.monthly")}
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <div
              className={cn(
                "flex items-center rounded-full px-3 py-2 transition-all duration-200 sm:px-4",
                isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-sm font-medium">{t("pricing.yearly")}</span>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary ml-2"
              >
                {t("pricing.save", { percent: "37%" })}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {AUTH_PLANS_DATA.filter((p) => !p.isHidden).map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              mode={mode}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">{t("pricing.footer")}</p>
          <p className="text-muted-foreground mt-2">
            {t("pricing.customPlan")}{" "}
            <Link
              href="/contact"
              className="text-primary font-medium hover:underline"
            >
              {t("pricing.contact")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
