"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Brain,
  FileText,
  Heart,
  type LucideIcon,
  Moon,
  Pill,
  Shield,
  Users,
} from "lucide-react";
import { ScrollReveal } from "./shared";

const featureIcons: LucideIcon[] = [
  Brain,
  Pill,
  Moon,
  BarChart3,
  FileText,
  Users,
  Heart,
  Shield,
];

const featureStyles = [
  { color: "from-[#1D7680] to-[#2BA09F]" },
  { color: "from-emerald-500 to-emerald-600" },
  { color: "from-purple-500 to-purple-600" },
  { color: "from-[#1D7680] to-[#2BA09F]" },
  { color: "from-amber-500 to-amber-600" },
  { color: "from-blue-500 to-blue-600" },
  { color: "from-rose-500 to-rose-600" },
  { color: "from-gray-500 to-gray-600" },
];

export function FeaturesGrid() {
  const { t, tm } = useI18n();

  const features = (
    tm<{ title: string; description: string }[]>("moodday.features.items") ?? []
  ).map((item, index) => ({
    icon: featureIcons[index],
    title: item.title,
    description: item.description,
    ...featureStyles[index],
  }));

  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
              {t("moodday.features.badge")}
            </span>
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("moodday.features.title")}{" "}
              <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                {t("moodday.features.titleHighlight")}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("moodday.features.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* Features Grid - 4 columns on desktop */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <ScrollReveal key={idx} delay={idx * 80} direction="up">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group border-border bg-card hover:border-muted-foreground/30 relative h-full overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient background on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5",
          color,
        )}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white",
            color,
          )}
        >
          <Icon className="size-6" />
        </div>

        {/* Title */}
        <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
