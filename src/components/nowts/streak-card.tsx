"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type StreakCardProps = {
  streakDays: number;
  weekProgress: number[]; // Array of 7 numbers (0-1) representing daily completion
  title?: string;
  subtitle?: string;
  className?: string;
};

/**
 * StreakCard - Display user's tracking streak
 *
 * Based on the Moodday design system:
 * - Gradient primary background
 * - White text
 * - Flame icon decoration
 * - Weekly progress bars
 *
 * @example
 * ```tsx
 * <StreakCard
 *   streakDays={23}
 *   weekProgress={[1, 1, 1, 1, 1, 1, 0]}
 *   title="Consistency"
 *   subtitle="Great pace! Your tracking has been complete for 3 weeks."
 * />
 * ```
 */
export function StreakCard({
  streakDays,
  weekProgress,
  title,
  subtitle,
  className,
}: StreakCardProps) {
  const { t } = useI18n();
  const completedDays = weekProgress.filter((p) => p >= 1).length;
  const defaultTitle = t("streak.title");
  const dayLabel =
    streakDays === 1 ? t("streak.daySingular") : t("streak.dayPlural");

  return (
    <section
      className={cn(
        "shadow-soft relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] p-8 text-white",
        className,
      )}
    >
      {/* Decorative flame icon */}
      <div className="absolute -top-4 -right-4 rotate-12 opacity-10">
        <Flame className="size-32" />
      </div>

      <div className="relative z-10">
        <p className="mb-1 text-xs font-bold tracking-widest text-[var(--primary-light)] uppercase">
          {title ?? defaultTitle}
        </p>
        <h3 className="mb-4 text-3xl font-bold">
          🔥 {streakDays} {dayLabel}
        </h3>

        {subtitle && (
          <p className="mb-6 text-sm leading-relaxed text-[var(--primary-light)]">
            {subtitle}
          </p>
        )}

        {/* Weekly progress bars */}
        <div className="flex gap-1">
          {weekProgress.map((progress, index) => (
            <div
              key={index}
              className="h-1.5 flex-grow overflow-hidden rounded-full bg-white/20"
            >
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[10px] font-medium tracking-widest text-[var(--primary-light)] uppercase">
          {t("streak.weekProgress", {
            completed: completedDays,
          })}
        </p>
      </div>
    </section>
  );
}
