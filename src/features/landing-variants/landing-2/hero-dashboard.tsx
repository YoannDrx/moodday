"use client";

import { useI18n } from "@/i18n/provider";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { InteractiveMockup } from "./interactive-mockup";

export function HeroDashboard() {
  const { t } = useI18n();

  const stats = [
    { value: "10K+", label: t("landing2.hero.stats.users") },
    { value: "99.9%", label: t("landing2.hero.stats.uptime") },
    { value: "4.9/5", label: t("landing2.hero.stats.rating") },
  ];

  return (
    <section className="bg-background relative min-h-screen overflow-hidden pt-24">
      {/* Grid background */}
      <div className="bg-grid-dark absolute inset-0 opacity-50 dark:opacity-100" />

      {/* Gradient orbs */}
      <div className="bg-primary/10 absolute top-20 left-1/4 size-[500px] rounded-full blur-[120px]" />
      <div className="absolute right-1/4 bottom-0 size-[400px] rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[35%_65%]">
          {/* Left - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="border-primary/30 bg-primary/10 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2">
              <Sparkles className="text-primary size-4" />
              <span className="text-primary text-sm font-medium">
                {t("landing2.hero.badge")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t("landing2.hero.title")}{" "}
              <span className="from-primary bg-gradient-to-r to-emerald-500 bg-clip-text text-transparent">
                {t("landing2.hero.titleHighlight")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-muted-foreground mb-8 text-lg">
              {t("landing2.hero.subtitle")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/auth/signup"
                className="group bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all hover:shadow-lg"
              >
                {t("landing2.hero.ctaPrimary")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-colors"
              >
                {t("landing2.hero.ctaSecondary")}
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-foreground text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Interactive Mockup */}
          <div className="relative">
            <InteractiveMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
