"use client";

import { useI18n } from "@/i18n/provider";
import { FileText, Pill, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { ScrollReveal } from "./shared";

export function FeaturesHorizontal() {
  const { t } = useI18n();

  const features = [
    {
      icon: <TrendingUp className="size-6" />,
      title: t("landing2.features.items.moodTracking.title"),
      description: t("landing2.features.items.moodTracking.description"),
      color: "from-primary to-primary/80",
    },
    {
      icon: <Pill className="size-6" />,
      title: t("landing2.features.items.medications.title"),
      description: t("landing2.features.items.medications.description"),
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <Users className="size-6" />,
      title: t("landing2.features.items.caregivers.title"),
      description: t("landing2.features.items.caregivers.description"),
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <FileText className="size-6" />,
      title: t("landing2.features.items.pdfExport.title"),
      description: t("landing2.features.items.pdfExport.description"),
      color: "from-primary to-emerald-500",
    },
    {
      icon: <Shield className="size-6" />,
      title: t("landing2.features.items.privacy.title"),
      description: t("landing2.features.items.privacy.description"),
      color: "from-gray-500 to-gray-600",
    },
    {
      icon: <Zap className="size-6" />,
      title: t("landing2.features.items.aiInsights.title"),
      description: t("landing2.features.items.aiInsights.description"),
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <p className="text-primary mb-4 text-sm font-medium tracking-widest uppercase">
              {t("landing2.features.badge")}
            </p>
            <h2 className="text-foreground mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
              {t("landing2.features.title")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("landing2.features.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} direction="up">
              <div className="group border-border bg-card hover:border-muted-foreground/30 relative min-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl md:min-w-0">
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />

                <div className="relative z-10">
                  <div
                    className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
