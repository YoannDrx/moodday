"use client";

import { useI18n } from "@/i18n/provider";
import { Coffee, Moon, Quote, Sun } from "lucide-react";
import { ScrollReveal } from "../shared";

export function SectionMarieJourney() {
  const { t } = useI18n();

  const journeySteps = [
    {
      icon: <Sun className="size-6" />,
      time: t("landing2.journey.morning.time"),
      title: t("landing2.journey.morning.title"),
      description: t("landing2.journey.morning.description"),
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: <Coffee className="size-6" />,
      time: t("landing2.journey.midday.time"),
      title: t("landing2.journey.midday.title"),
      description: t("landing2.journey.midday.description"),
      color: "from-primary to-emerald-500",
      bgColor: "bg-primary/10",
    },
    {
      icon: <Moon className="size-6" />,
      time: t("landing2.journey.evening.time"),
      title: t("landing2.journey.evening.title"),
      description: t("landing2.journey.evening.description"),
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-500/10",
    },
  ];

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

        {/* Timeline */}
        <div className="relative">
          {/* Connection line - only visible on md and up */}
          <div className="via-primary absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-amber-400 to-purple-500 md:block" />

          <div className="grid gap-8 md:grid-cols-3">
            {journeySteps.map((step, idx) => (
              <ScrollReveal key={idx} delay={idx * 150} direction="up">
                <div className="group relative">
                  {/* Card */}
                  <div
                    className={`border-border bg-card relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${step.bgColor}`}
                  >
                    {/* Time badge */}
                    <div className="bg-background/80 mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-white`}
                      >
                        {step.icon}
                      </div>
                      <span className="text-foreground font-mono text-sm font-semibold">
                        {step.time}
                      </span>
                    </div>

                    <h3 className="text-foreground mb-2 text-xl font-bold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>

                    {/* Decorative gradient */}
                    <div
                      className={`absolute -right-8 -bottom-8 size-32 rounded-full bg-gradient-to-br ${step.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                    />
                  </div>

                  {/* Timeline dot - only visible on md and up */}
                  <div className="absolute -bottom-12 left-1/2 hidden -translate-x-1/2 md:block">
                    <div
                      className={`size-4 rounded-full bg-gradient-to-br ${step.color} ring-background ring-4`}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
                {/* Avatar with gradient */}
                <div className="relative">
                  <div className="from-primary size-12 rounded-full bg-gradient-to-br to-emerald-500" />
                  <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-xs">
                    ⭐
                  </div>
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
