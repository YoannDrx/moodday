"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Coffee,
  Moon,
  Quote,
  Smile,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "./shared";

type JourneyStep = "morning" | "midday" | "evening";

export function SectionJourneyEnhanced() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState<JourneyStep>("morning");

  const journeySteps: Record<
    JourneyStep,
    {
      icon: React.ReactNode;
      time: string;
      title: string;
      description: string;
      color: string;
      bgColor: string;
      mockup: React.ReactNode;
    }
  > = {
    morning: {
      icon: <Sun className="size-5" />,
      time: t("landing2.journey.morning.time"),
      title: t("landing2.journey.morning.title"),
      description: t("landing2.journey.morning.description"),
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-500/10",
      mockup: <MorningMockup />,
    },
    midday: {
      icon: <Coffee className="size-5" />,
      time: t("landing2.journey.midday.time"),
      title: t("landing2.journey.midday.title"),
      description: t("landing2.journey.midday.description"),
      color: "from-[#1D7680] to-[#2BA09F]",
      bgColor: "bg-[#1D7680]/10",
      mockup: <MiddayMockup />,
    },
    evening: {
      icon: <Moon className="size-5" />,
      time: t("landing2.journey.evening.time"),
      title: t("landing2.journey.evening.title"),
      description: t("landing2.journey.evening.description"),
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-500/10",
      mockup: <EveningMockup />,
    },
  };

  const steps: JourneyStep[] = ["morning", "midday", "evening"];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              {t("landing2.journey.title")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("landing2.journey.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop Layout - Timeline + Mockup */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-16">
            {/* Left - Vertical Timeline */}
            <div className="relative">
              <div className="space-y-8">
                {steps.map((stepKey, idx) => {
                  const step = journeySteps[stepKey];
                  const isActive = activeStep === stepKey;

                  return (
                    <ScrollReveal
                      key={stepKey}
                      delay={idx * 150}
                      direction="left"
                    >
                      <button
                        onClick={() => setActiveStep(stepKey)}
                        className={cn(
                          "group relative flex w-full gap-6 rounded-2xl p-4 text-left transition-all duration-300",
                          isActive ? "bg-card shadow-lg" : "hover:bg-muted/50",
                        )}
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10">
                          <div
                            className={cn(
                              "flex size-12 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-300",
                              step.color,
                              isActive
                                ? "scale-110 shadow-lg ring-4 ring-white dark:ring-gray-900"
                                : "opacity-70 group-hover:opacity-100",
                            )}
                          >
                            <span className="text-white">{step.icon}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={cn(
                                "font-mono text-sm font-semibold",
                                isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {step.time}
                            </span>
                          </div>
                          <h3
                            className={cn(
                              "mb-1 text-lg font-bold transition-colors",
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {step.title}
                          </h3>
                          <p
                            className={cn(
                              "text-sm transition-colors",
                              isActive
                                ? "text-muted-foreground"
                                : "text-muted-foreground/70",
                            )}
                          >
                            {step.description}
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        {isActive && (
                          <div className="bg-primary absolute top-1/2 -right-2 size-4 -translate-y-1/2 rotate-45" />
                        )}
                      </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>

            {/* Right - Interactive Mockup */}
            <ScrollReveal delay={300} direction="right">
              <div className="border-border bg-card sticky top-24 overflow-hidden rounded-3xl border p-6 shadow-xl">
                <div
                  className={cn(
                    "rounded-2xl p-6 transition-colors duration-500",
                    journeySteps[activeStep].bgColor,
                  )}
                >
                  {journeySteps[activeStep].mockup}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Mobile Layout - Horizontal Swipe */}
        <div className="lg:hidden">
          {/* Step indicators */}
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((stepKey) => {
              const step = journeySteps[stepKey];
              const isActive = activeStep === stepKey;

              return (
                <button
                  key={stepKey}
                  onClick={() => setActiveStep(stepKey)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 transition-all",
                    isActive ? "bg-card shadow-md" : "bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      step.color,
                    )}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm",
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.time}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <ScrollReveal>
            <div
              className={cn(
                "border-border bg-card rounded-2xl border p-6 transition-colors duration-500",
                journeySteps[activeStep].bgColor,
              )}
            >
              <h3 className="text-foreground mb-2 text-xl font-bold">
                {journeySteps[activeStep].title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {journeySteps[activeStep].description}
              </p>
              {journeySteps[activeStep].mockup}
            </div>
          </ScrollReveal>
        </div>

        {/* Testimonial */}
        <ScrollReveal delay={500}>
          <div className="mx-auto mt-20 max-w-2xl">
            <div className="border-border bg-card relative rounded-2xl border p-8">
              <Quote className="text-primary/20 absolute top-4 left-4 size-8" />

              <blockquote className="text-foreground relative z-10 mb-6 text-center text-xl italic">
                &ldquo;{t("landing2.journey.testimonial.quote")}&rdquo;
              </blockquote>

              <div className="flex items-center justify-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-400">
                  <span className="text-lg font-bold text-white">M</span>
                </div>

                <div className="text-left">
                  <p className="text-foreground font-semibold">
                    {t("landing2.journey.testimonial.author")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("landing2.journey.testimonial.role")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function MorningMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-muted-foreground mb-2 text-sm">
          {t("landing2.mockup.moodPanel.title")}
        </p>
        <div className="flex items-center justify-center gap-3">
          {["😞", "😐", "🙂", "😊", "😄"].map((emoji, idx) => (
            <button
              key={idx}
              className={cn(
                "flex size-12 items-center justify-center rounded-xl text-2xl transition-all",
                idx === 3
                  ? "scale-110 bg-white shadow-lg ring-2 ring-amber-400 dark:bg-gray-800"
                  : "bg-white/50 hover:bg-white hover:shadow dark:bg-gray-800/50",
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white/50 p-4 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="size-5 text-amber-500" />
            <span className="text-foreground text-sm font-medium">
              {t("landing2.journey.mockups.moodLogged")}
            </span>
          </div>
          <span className="font-mono text-sm text-amber-600">
            {t("landing2.journey.mockups.moodLoggedTime")}
          </span>
        </div>
      </div>
    </div>
  );
}

function MiddayMockup() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-white/50 dark:bg-gray-800/50">
        <div className="from-primary/20 to-primary/5 bg-gradient-to-r p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-primary size-5" />
              <span className="text-foreground font-medium">
                {t("landing2.journey.mockups.medReminderTitle")}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {t("landing2.journey.mockups.medReminderNow")}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-foreground mb-2 font-semibold">
            {t("landing2.journey.mockups.medReminderName")}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {t("landing2.journey.mockups.medReminderFrequency")}
            </span>
            <button className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90">
              {t("landing2.journey.mockups.medReminderConfirm")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white/50 p-4 dark:bg-gray-800/50">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <span className="text-lg">✓</span>
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">
            {t("landing2.journey.mockups.medTakenName")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("landing2.journey.mockups.medTakenTime")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EveningMockup() {
  const { t } = useI18n();
  const moodData = [45, 58, 62, 55, 72, 78, 75];
  const days = [
    t("landing2.journey.mockups.weekdays.mon"),
    t("landing2.journey.mockups.weekdays.tue"),
    t("landing2.journey.mockups.weekdays.wed"),
    t("landing2.journey.mockups.weekdays.thu"),
    t("landing2.journey.mockups.weekdays.fri"),
    t("landing2.journey.mockups.weekdays.sat"),
    t("landing2.journey.mockups.weekdays.sun"),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white/50 p-4 dark:bg-gray-800/50">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-purple-500" />
            <span className="text-foreground text-sm font-medium">
              {t("landing2.journey.mockups.weeklyTrend")}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            +8%
          </span>
        </div>

        <div className="flex h-20 items-end justify-between gap-1">
          {moodData.map((value, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-purple-500 to-indigo-500 transition-all"
                style={{ height: `${value}%` }}
              />
              <span className="text-muted-foreground text-xs">{days[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white/50 p-4 dark:bg-gray-800/50">
        <p className="text-foreground mb-1 text-sm font-medium">
          {t("landing2.journey.mockups.insightTitle")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("landing2.journey.mockups.insightDescription")}
        </p>
      </div>
    </div>
  );
}
