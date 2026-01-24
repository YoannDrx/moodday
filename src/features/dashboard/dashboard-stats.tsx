"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Pill, Calendar, Dumbbell } from "lucide-react";

import { StatCard } from "@/components/nowts/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/features/insights/insights.action";
import { useI18n } from "@/i18n/provider";

type DashboardStatsProps = {
  className?: string;
};

export function DashboardStats({ className }: DashboardStatsProps) {
  const { t } = useI18n();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const result = await getDashboardSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const moodValue =
    summary?.mood.weeklyAverage !== null
      ? `${summary?.mood.weeklyAverage}/10`
      : "--";

  const medsValue =
    summary?.medications.totalActive !== undefined &&
    summary.medications.totalActive > 0
      ? `${summary.medications.takenToday}/${summary.medications.totalActive}`
      : "--";

  const therapyValue =
    summary?.therapy.sessionsThisMonth !== undefined
      ? String(summary.therapy.sessionsThisMonth)
      : "--";

  const exerciseValue =
    summary?.exercises.completionsThisWeek !== undefined
      ? String(summary.exercises.completionsThisWeek)
      : "--";

  // Determine mood color based on average
  const moodColor =
    summary?.mood.weeklyAverage !== null &&
    summary?.mood.weeklyAverage !== undefined
      ? summary.mood.weeklyAverage >= 7
        ? "success"
        : summary.mood.weeklyAverage >= 4
          ? "warning"
          : "danger"
      : "default";

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <StatCard
        title={t("insights.dashboard.mood.title")}
        value={moodValue}
        subtitle={t("insights.dashboard.mood.average")}
        icon={Heart}
        color={moodColor as "default" | "success" | "warning" | "danger"}
      />

      <StatCard
        title={t("insights.dashboard.medications.title")}
        value={medsValue}
        subtitle={
          summary?.medications.adherencePercent
            ? t("insights.dashboard.medications.adherence", {
                percent: summary.medications.adherencePercent,
              })
            : t("insights.dashboard.medications.taken", {
                count: summary?.medications.takenToday ?? 0,
              })
        }
        icon={Pill}
        color={
          summary?.medications.adherencePercent &&
          summary.medications.adherencePercent >= 80
            ? "success"
            : "info"
        }
      />

      <StatCard
        title={t("insights.dashboard.therapy.title")}
        value={therapyValue}
        subtitle={t("insights.dashboard.therapy.sessions", {
          count: summary?.therapy.sessionsThisMonth ?? 0,
        })}
        icon={Calendar}
        color="info"
      />

      <StatCard
        title={t("insights.dashboard.exercises.title")}
        value={exerciseValue}
        subtitle={t("insights.dashboard.exercises.completed", {
          count: summary?.exercises.completionsThisWeek ?? 0,
        })}
        icon={Dumbbell}
        color={
          summary?.exercises.completionsThisWeek &&
          summary.exercises.completionsThisWeek >= 3
            ? "success"
            : "default"
        }
      />
    </div>
  );
}
