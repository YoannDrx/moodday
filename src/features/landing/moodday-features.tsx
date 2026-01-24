"use client";

import { useHydration } from "@/hooks/use-hydration";
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
import { motion } from "motion/react";

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
  {
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  { color: "bg-sage/10 text-sage", gradient: "from-sage/20 to-sage/5" },
  {
    color: "bg-lavender/30 text-primary",
    gradient: "from-lavender/30 to-lavender/10",
  },
  {
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  { color: "bg-sage/10 text-sage", gradient: "from-sage/20 to-sage/5" },
  {
    color: "bg-lavender/30 text-primary",
    gradient: "from-lavender/30 to-lavender/10",
  },
  {
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  { color: "bg-sage/10 text-sage", gradient: "from-sage/20 to-sage/5" },
];

export function MooddayFeatures() {
  const { t, tm } = useI18n();
  const isHydrated = useHydration();

  const features = (
    tm<{ title: string; description: string }[]>("moodday.features.items") ?? []
  ).map((item, index) => ({
    icon: featureIcons[index],
    title: item.title,
    description: item.description,
    ...featureStyles[index],
  }));

  return (
    <section id="features" className="relative py-20 lg:py-32">
      {/* Background */}
      <div className="via-primary/5 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={isHydrated ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            {t("moodday.features.badge")}
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            {t("moodday.features.title")}{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              {t("moodday.features.titleHighlight")}
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("moodday.features.subtitle")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={isHydrated ? { opacity: 0, y: 20 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
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
  gradient,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  color: string;
  gradient: string;
}) {
  return (
    <div className="glass-card group shadow-soft relative h-full overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Gradient Background on Hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
          gradient,
        )}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 inline-flex size-12 items-center justify-center rounded-2xl",
            color,
          )}
        >
          <Icon className="size-6" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
