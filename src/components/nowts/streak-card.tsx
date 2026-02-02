"use client";

import { Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type StreakCardProps = {
  streakDays: number;
  weekProgress: number[]; // Array of 7 numbers (0-1) representing daily completion
  title?: string;
  subtitle?: string;
  className?: string;
};

const dayLabelsShort = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * StreakCard - Display user's tracking streak
 *
 * Design moderne avec fond clair et flamme colorée
 * pour une meilleure lisibilité et UX
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

  // Couleur de la flamme selon le niveau de streak
  const flameColor =
    streakDays >= 30
      ? "text-amber-500" // Or pour 30+ jours
      : streakDays >= 7
        ? "text-orange-500" // Orange pour 7+ jours
        : "text-orange-400"; // Orange clair pour début

  const flameBgColor =
    streakDays >= 30
      ? "bg-amber-50"
      : streakDays >= 7
        ? "bg-orange-50"
        : "bg-orange-50/50";

  return (
    <section
      className={cn(
        "shadow-soft relative overflow-hidden rounded-[32px] border-4 border-[var(--primary)] bg-white p-6",
        className,
      )}
    >
      <div className="relative z-10">
        {/* Header avec titre */}
        <p className="mb-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
          {title ?? defaultTitle}
        </p>

        {/* Zone principale avec flamme et compteur */}
        <div className="mb-5 flex items-center gap-4">
          {/* Icône flamme dans un cercle */}
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-2xl",
              flameBgColor,
            )}
          >
            <Flame className={cn("size-8", flameColor)} />
          </div>

          {/* Compteur et label */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-gray-900">
                {streakDays}
              </span>
              <span className="text-lg font-medium text-gray-600">
                {dayLabel}
              </span>
            </div>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Progression hebdomadaire avec cercles */}
        <div className="rounded-2xl border border-gray-100 bg-white/60 p-4">
          <div className="flex justify-between">
            {weekProgress.map((progress, index) => {
              const isCompleted = progress >= 1;
              const isPartial = progress > 0 && progress < 1;

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  {/* Cercle de progression */}
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : isPartial
                          ? "border-[var(--primary)]/50 bg-[var(--primary)]/10"
                          : "border-gray-200 bg-gray-50",
                    )}
                  >
                    {isCompleted && (
                      <Check className="size-4" strokeWidth={3} />
                    )}
                  </div>
                  {/* Label du jour */}
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      isCompleted ? "text-[var(--primary)]" : "text-gray-400",
                    )}
                  >
                    {dayLabelsShort[index]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Texte de progression */}
          <p className="mt-3 text-center text-xs font-medium text-gray-500">
            {t("streak.weekProgress", {
              count: completedDays,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
