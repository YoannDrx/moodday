"use client";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarHeart, CheckCircle } from "lucide-react";
import Link from "next/link";
import { InteractiveMockup } from "./interactive-mockup";

export function HeroHybrid() {
  const { t } = useI18n();

  return (
    <section className="bg-background relative min-h-screen overflow-hidden pt-24">
      {/* Grid background */}
      <div className="bg-grid-dark absolute inset-0 opacity-50 dark:opacity-100" />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 size-[500px] rounded-full bg-[#1D7680]/10 blur-[120px]" />
      <div className="absolute right-1/4 bottom-0 size-[400px] rounded-full bg-[#2BA09F]/10 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Text content (from MooddayHero) */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="border-primary/30 bg-primary/10 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2">
              <CalendarHeart className="text-primary size-4" />
              <span className="text-primary text-sm font-medium">
                {t("moodday.hero.badge")}
              </span>
            </div>

            {/* Title - 3 parts with teal gradient */}
            <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t("moodday.hero.title")}{" "}
              <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                {t("moodday.hero.titleHighlight")}
              </span>{" "}
              {t("moodday.hero.titleSuffix")}
            </h1>

            {/* Subtitle - Long version */}
            <p className="text-muted-foreground mb-8 text-lg">
              {t("moodday.hero.subtitle")}
            </p>

            {/* CTAs - 2 buttons */}
            <div className="flex flex-col gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group gap-2 rounded-xl px-6 py-3 font-semibold shadow-lg transition-all hover:shadow-xl",
                  "bg-gradient-to-r from-[#1D7680] to-[#2BA09F] hover:from-[#1D7680]/90 hover:to-[#2BA09F]/90",
                )}
              >
                {t("moodday.hero.ctaPrimary")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-xl border-2 px-6 py-3 font-semibold transition-colors",
                )}
              >
                {t("moodday.hero.ctaSecondary")}
              </Link>
            </div>

            {/* Trust Indicators - 3 items */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm lg:justify-start">
              <div className="text-muted-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-[#2BA09F]" />
                <span>{t("moodday.hero.trust.gdpr")}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-[#2BA09F]" />
                <span>{t("moodday.hero.trust.encrypted")}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-[#2BA09F]" />
                <span>{t("moodday.hero.trust.medicalPdf")}</span>
              </div>
            </div>
          </div>

          {/* Right - Interactive Mockup (from landing-2) */}
          <div className="relative">
            <InteractiveMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
