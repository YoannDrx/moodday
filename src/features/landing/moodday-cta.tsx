"use client";

import { buttonVariants } from "@/components/ui/button";
import { useHydration } from "@/hooks/use-hydration";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarHeart } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export function MooddayCta() {
  const { t } = useI18n();
  const isHydrated = useHydration();

  return (
    <section className="relative py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={isHydrated ? { opacity: 0, y: 20 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card shadow-soft relative overflow-hidden rounded-3xl p-8 lg:p-16"
        >
          {/* Background Gradient */}
          <div className="from-primary/10 to-sage/10 absolute inset-0 bg-gradient-to-br via-transparent" />

          {/* Floating Elements */}
          <div className="bg-primary/10 absolute -top-8 -right-8 size-32 rounded-full blur-3xl" />
          <div className="bg-sage/10 absolute -bottom-8 -left-8 size-32 rounded-full blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            {/* Icon */}
            <div className="bg-primary/10 mb-6 flex size-16 items-center justify-center rounded-2xl">
              <CalendarHeart className="text-primary size-8" />
            </div>

            {/* Title */}
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
              {t("moodday.cta.title")}{" "}
              <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                {t("moodday.cta.titleHighlight")}
              </span>{" "}
              {t("moodday.cta.titleSuffix")}
            </h2>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {t("moodday.cta.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "shadow-soft gap-2 rounded-2xl px-8 py-6 text-base font-bold",
                )}
              >
                {t("moodday.cta.ctaPrimary")}
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-2xl border-2 px-8 py-6 text-base font-semibold",
                )}
              >
                {t("moodday.cta.ctaSecondary")}
              </Link>
            </div>

            {/* Trust Text */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              {t("moodday.cta.trust")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
