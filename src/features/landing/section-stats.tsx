"use client";

import { useI18n } from "@/i18n/provider";
import { AnimatedCounter, ScrollReveal } from "./shared";

export function SectionStats() {
  const { t } = useI18n();

  const stats = [
    {
      value: 10000,
      suffix: "+",
      label: t("landing2.stats.users"),
    },
    {
      value: 2,
      suffix: "M+",
      label: t("landing2.stats.checkins"),
    },
    {
      value: 99.9,
      suffix: "%",
      label: t("landing2.stats.uptime"),
      decimals: 1,
    },
    {
      value: 4.9,
      suffix: "/5",
      label: t("landing2.stats.rating"),
      decimals: 1,
    },
  ];

  return (
    <section className="border-border bg-background border-y py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} direction="up">
              <div className="text-center">
                <p className="text-foreground mb-2 text-3xl font-bold md:text-4xl lg:text-5xl">
                  <AnimatedCounter
                    end={stat.value}
                    duration={2500}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                  />
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
