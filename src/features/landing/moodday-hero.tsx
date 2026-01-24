"use client";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarHeart,
  CheckCircle,
  Moon,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export function MooddayHero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Background Blobs */}
      <div className="blob blob-primary absolute -top-32 -right-32" />
      <div className="blob blob-lavender absolute bottom-0 -left-32" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <CalendarHeart className="size-4" />
              <span>{t("moodday.hero.badge")}</span>
            </div>

            {/* Main Title */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-gray-100">
              {t("moodday.hero.title")}{" "}
              <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                {t("moodday.hero.titleHighlight")}
              </span>{" "}
              {t("moodday.hero.titleSuffix")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600 lg:mx-0 dark:text-gray-400">
              {t("moodday.hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "shadow-soft gap-2 rounded-2xl px-8 py-6 text-base font-bold",
                )}
              >
                {t("moodday.hero.ctaPrimary")}
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-2 px-8 py-6 text-base font-semibold",
                )}
              >
                {t("moodday.hero.ctaSecondary")}
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 lg:justify-start dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-sage size-4" />
                <span>{t("moodday.hero.trust.gdpr")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-sage size-4" />
                <span>{t("moodday.hero.trust.encrypted")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-sage size-4" />
                <span>{t("moodday.hero.trust.medicalPdf")}</span>
              </div>
            </div>
          </div>

          {/* Right Content - Interactive Mockup */}
          <div className="relative">
            {/* Main Dashboard Card */}
            <div className="glass-card shadow-soft relative z-10 rounded-3xl p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t("moodday.hero.mockup.greeting")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("moodday.hero.mockup.question")}
                  </p>
                </div>
                <div className="bg-primary/10 flex size-12 items-center justify-center rounded-2xl">
                  <CalendarHeart className="text-primary size-6" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <StatCard
                  icon={<TrendingUp className="text-primary size-5" />}
                  label={t("moodday.hero.mockup.mood")}
                  value="7.2"
                  suffix="/10"
                  trend="+0.4"
                  trendLabel={t("moodday.hero.mockup.vsLastWeek")}
                  trendColor="text-sage"
                />
                <StatCard
                  icon={<CheckCircle className="text-sage size-5" />}
                  label={t("moodday.hero.mockup.adherence")}
                  value="98"
                  suffix="%"
                  sublabel={`28 ${t("moodday.hero.mockup.days")}`}
                />
                <StatCard
                  icon={<Moon className="text-primary size-5" />}
                  label={t("moodday.hero.mockup.sleep")}
                  value="7.5"
                  suffix="h"
                  sublabel={`${t("moodday.hero.mockup.quality")}: 8/10`}
                />
              </div>

              {/* Mood Slider Preview */}
              <div className="rounded-2xl bg-white/50 p-4 dark:bg-gray-800/50">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    {t("moodday.hero.mockup.moodToday")}
                  </span>
                  <span className="text-2xl">😊</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="from-primary to-sage absolute top-0 left-0 h-full w-[72%] rounded-full bg-gradient-to-r" />
                  <div className="bg-primary absolute top-1/2 left-[72%] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-lg dark:border-gray-800" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>{t("moodday.hero.mockup.veryLow")}</span>
                  <span>{t("moodday.hero.mockup.stable")}</span>
                  <span>{t("moodday.hero.mockup.excellent")}</span>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="glass-card shadow-soft absolute -bottom-4 -left-4 z-20 flex items-center gap-3 rounded-2xl p-4">
              <div className="bg-sage/10 flex size-10 items-center justify-center rounded-xl">
                <CheckCircle className="text-sage size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t("moodday.hero.mockup.medication")}
                </p>
                <p className="text-sage text-xs">
                  {t("moodday.hero.mockup.takenAt")}
                </p>
              </div>
            </div>

            <div className="glass-card shadow-soft absolute top-4 -right-4 z-20 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                {t("moodday.hero.mockup.nextSession")}
              </p>
              <p className="text-primary text-sm font-bold">
                {t("moodday.hero.mockup.doctor")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  trend,
  trendLabel,
  trendColor,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  trend?: string;
  trendLabel?: string;
  trendColor?: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/50 p-3 dark:bg-gray-800/50">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-1.5">
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        <span className="text-xs font-normal text-gray-400">{suffix}</span>
      </p>
      {trend && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            trendColor,
          )}
        >
          <TrendingUp className="size-3" />
          {trend} {trendLabel}
        </p>
      )}
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}
