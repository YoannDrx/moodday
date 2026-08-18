"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getI18n } from "@/i18n/server";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getMedicationAdherenceForUser } from "@/features/medication/adherence-service";
import {
  addCivilDays,
  getCivilWeekday,
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { getExportDateRange } from "@/features/export/date-range";
import { calculateMoodStreak } from "./streak";

const getUserTimeContext = async (userId: string, days: number) => {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const timezone = getSafeTimeZone(preferences?.timezone);
  const endDate = getDateKeyForTimeZone(new Date(), timezone);
  const startDate = addCivilDays(endDate, -(days - 1));
  const { start, endExclusive } = getExportDateRange({
    startDate,
    endDate,
    timezone,
  });
  return { timezone, startDate, endDate, start, endExclusive };
};

// ===== Mood Chart Data (30 Days) =====

const getMoodChartDataSchema = z.object({
  days: z.number().int().min(1).max(365).optional().default(30),
});

export const getMoodChartData = authAction
  .inputSchema(getMoodChartDataSchema)
  .action(async ({ parsedInput: { days }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const analyticsWindowDays =
      getEntitlements(subscription).analyticsWindowDays;
    const effectiveDays = analyticsWindowDays
      ? Math.min(days, analyticsWindowDays)
      : days;
    const timeContext = await getUserTimeContext(user.id, effectiveDays);
    const since = timeContext.start;

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: since, lt: timeContext.endExclusive },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        value: true,
        note: true,
        energy: true,
        sleepHours: true,
        anxiety: true,
        createdAt: true,
      },
    });

    // Get dosage changes for markers
    const dosageChanges = await prisma.medicationHistory.findMany({
      where: {
        medication: { userId: user.id },
        changedAt: { gte: since, lt: timeContext.endExclusive },
      },
      include: {
        medication: {
          select: { name: true },
        },
      },
      orderBy: { changedAt: "asc" },
    });

    const adherencePercent = (
      await getMedicationAdherenceForUser({
        userId: user.id,
        startDate: timeContext.startDate,
        endDate: timeContext.endDate,
        timezone: timeContext.timezone,
      })
    ).percent;

    return {
      moodEntries: moodEntries.map((entry) => ({
        id: entry.id,
        value: entry.value,
        note: entry.note,
        energy: entry.energy,
        sleepHours: entry.sleepHours,
        anxiety: entry.anxiety,
        date: entry.createdAt.toISOString(),
      })),
      dosageChanges: dosageChanges.map((change) => ({
        id: change.id,
        medicationName: change.medication.name,
        previousDosage: change.previousDosage,
        newDosage: change.dosage,
        date: change.changedAt.toISOString(),
      })),
      medicationAdherence: adherencePercent,
      requestedDays: days,
      effectiveDays,
    };
  });

// ===== Dashboard Summary =====

export const getDashboardSummary = authAction.action(
  async ({ ctx: { user } }) => {
    const monthContext = await getUserTimeContext(user.id, 30);
    const weekContext = await getUserTimeContext(user.id, 7);
    const previousWeekStartDate = addCivilDays(weekContext.startDate, -7);
    const previousWeekRange = getExportDateRange({
      startDate: previousWeekStartDate,
      endDate: addCivilDays(weekContext.startDate, -1),
      timezone: monthContext.timezone,
    });
    const todayRange = getExportDateRange({
      startDate: monthContext.endDate,
      endDate: monthContext.endDate,
      timezone: monthContext.timezone,
    });
    const startOfDay = todayRange.start;
    const startOfWeek = weekContext.start;
    const startOfMonth = monthContext.start;
    const startOfPrevWeek = previousWeekRange.start;

    // Mood data (last 7 days for mini chart) - with sleep data
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek, lt: weekContext.endExclusive },
      },
      orderBy: { createdAt: "asc" },
      select: {
        value: true,
        createdAt: true,
        sleepHours: true,
        sleepQuality: true,
        energy: true,
      },
    });

    // Previous week mood entries for trend
    const prevWeekMoodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfPrevWeek, lt: startOfWeek },
      },
      select: { value: true },
    });

    const weeklyMoodAvg =
      moodEntries.length > 0
        ? moodEntries.reduce((sum, e) => sum + e.value, 0) / moodEntries.length
        : null;

    const prevWeekMoodAvg =
      prevWeekMoodEntries.length > 0
        ? prevWeekMoodEntries.reduce((sum, e) => sum + e.value, 0) /
          prevWeekMoodEntries.length
        : null;

    // Calculate trend percentage
    let trendPercent: number | null = null;
    if (
      weeklyMoodAvg !== null &&
      prevWeekMoodAvg !== null &&
      prevWeekMoodAvg > 0
    ) {
      trendPercent = Math.round(
        ((weeklyMoodAvg - prevWeekMoodAvg) / prevWeekMoodAvg) * 100,
      );
    }

    // Sleep data aggregation
    const entriesWithSleep = moodEntries.filter((e) => e.sleepHours !== null);
    const avgSleepHours =
      entriesWithSleep.length > 0
        ? entriesWithSleep.reduce((sum, e) => sum + (e.sleepHours ?? 0), 0) /
          entriesWithSleep.length
        : null;

    // Latest sleep quality
    const latestWithSleep = moodEntries
      .filter((e) => e.sleepHours !== null)
      .pop();

    // Energy average
    const entriesWithEnergy = moodEntries.filter((e) => e.energy !== null);
    const avgEnergy =
      entriesWithEnergy.length > 0
        ? Math.round(
            entriesWithEnergy.reduce((sum, e) => sum + (e.energy ?? 0), 0) /
              entriesWithEnergy.length,
          )
        : null;

    const totalMeds = await prisma.medication.count({
      where: { userId: user.id, isArchived: false },
    });
    const todayIntakes = await prisma.medIntake.count({
      where: {
        medication: { userId: user.id, isArchived: false, isPRN: false },
        OR: [
          { scheduledForDate: monthContext.endDate },
          {
            scheduledForDate: null,
            takenAt: { gte: startOfDay, lt: todayRange.endExclusive },
          },
        ],
        skipped: false,
      },
    });

    const adherencePercent = (
      await getMedicationAdherenceForUser({
        userId: user.id,
        startDate: monthContext.startDate,
        endDate: monthContext.endDate,
        timezone: monthContext.timezone,
      })
    ).percent;

    // Therapy sessions (last session + count this month)
    const lastTherapySession = await prisma.therapySession.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: { date: true, benefitRating: true },
    });

    const therapySessionsThisMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lt: monthContext.endExclusive },
      },
    });

    // Exercise activity (this week)
    const exerciseLogsThisWeek = await prisma.exerciseLog.count({
      where: {
        exercise: { userId: user.id },
        completedAt: { gte: startOfWeek, lt: weekContext.endExclusive },
      },
    });

    const activeExercises = await prisma.exercise.count({
      where: {
        userId: user.id,
        isArchived: false,
      },
    });

    return {
      mood: {
        weeklyAverage:
          weeklyMoodAvg !== null ? Math.round(weeklyMoodAvg * 10) / 10 : null,
        trendPercent,
        entries: moodEntries.map((e) => ({
          value: e.value,
          date: e.createdAt.toISOString(),
        })),
        hasEntryToday: moodEntries.some(
          (entry) =>
            entry.createdAt.getTime() >= startOfDay.getTime() &&
            entry.createdAt.getTime() < todayRange.endExclusive.getTime(),
        ),
      },
      sleep: {
        avgHours:
          avgSleepHours !== null ? Math.round(avgSleepHours * 10) / 10 : null,
        latestQuality: latestWithSleep?.sleepQuality ?? null,
        latestHours: latestWithSleep?.sleepHours ?? null,
        avgEnergy,
      },
      medications: {
        totalActive: totalMeds,
        takenToday: todayIntakes,
        adherencePercent,
      },
      therapy: {
        lastSession: lastTherapySession
          ? {
              date: lastTherapySession.date.toISOString(),
              benefitRating: lastTherapySession.benefitRating,
            }
          : null,
        sessionsThisMonth: therapySessionsThisMonth,
      },
      exercises: {
        totalActive: activeExercises,
        completionsThisWeek: exerciseLogsThisWeek,
      },
    };
  },
);

// ===== Pattern Insights =====

export const getPatternInsights = authAction.action(
  async ({ ctx: { user } }) => {
    const { t } = await getI18n();
    const monthContext = await getUserTimeContext(user.id, 30);
    const startOfMonth = monthContext.start;
    const previousRange = getExportDateRange({
      startDate: addCivilDays(monthContext.startDate, -30),
      endDate: addCivilDays(monthContext.startDate, -1),
      timezone: monthContext.timezone,
    });

    // Mood insights
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth, lt: monthContext.endExclusive },
      },
      select: { value: true, createdAt: true },
    });

    const insights: {
      type: "mood" | "medication" | "therapy" | "exercise";
      message: string;
      trend: "up" | "down" | "neutral";
    }[] = [];

    // Mood average insight
    if (moodEntries.length > 0) {
      const avgMood =
        moodEntries.reduce((sum, e) => sum + e.value, 0) / moodEntries.length;

      const avgValue = avgMood.toFixed(1);

      if (avgMood >= 7) {
        insights.push({
          type: "mood",
          message: t("insights.patterns.mood.avg.high", {
            value: avgValue,
          }),
          trend: "up",
        });
      } else if (avgMood >= 5) {
        insights.push({
          type: "mood",
          message: t("insights.patterns.mood.avg.mid", {
            value: avgValue,
          }),
          trend: "neutral",
        });
      } else {
        insights.push({
          type: "mood",
          message: t("insights.patterns.mood.avg.low", {
            value: avgValue,
          }),
          trend: "down",
        });
      }

      // Weekend vs weekday analysis
      const weekendMoods = moodEntries.filter((e) => {
        const day = getCivilWeekday(
          getDateKeyForTimeZone(e.createdAt, monthContext.timezone),
        );
        return day === 0 || day === 6;
      });
      const weekdayMoods = moodEntries.filter((e) => {
        const day = getCivilWeekday(
          getDateKeyForTimeZone(e.createdAt, monthContext.timezone),
        );
        return day !== 0 && day !== 6;
      });

      if (weekendMoods.length >= 3 && weekdayMoods.length >= 5) {
        const weekendAvg =
          weekendMoods.reduce((s, e) => s + e.value, 0) / weekendMoods.length;
        const weekdayAvg =
          weekdayMoods.reduce((s, e) => s + e.value, 0) / weekdayMoods.length;

        if (weekendAvg > weekdayAvg + 1) {
          insights.push({
            type: "mood",
            message: t("insights.patterns.mood.weekendHigher"),
            trend: "up",
          });
        } else if (weekdayAvg > weekendAvg + 1) {
          insights.push({
            type: "mood",
            message: t("insights.patterns.mood.weekdayHigher"),
            trend: "up",
          });
        }
      }
    }

    const adherence = (
      await getMedicationAdherenceForUser({
        userId: user.id,
        startDate: monthContext.startDate,
        endDate: monthContext.endDate,
        timezone: monthContext.timezone,
      })
    ).percent;

    if (adherence !== null) {
      if (adherence >= 90) {
        insights.push({
          type: "medication",
          message: t("insights.patterns.medication.high", {
            value: adherence,
          }),
          trend: "up",
        });
      } else if (adherence >= 70) {
        insights.push({
          type: "medication",
          message: t("insights.patterns.medication.mid", {
            value: adherence,
          }),
          trend: "neutral",
        });
      } else if (adherence > 0) {
        insights.push({
          type: "medication",
          message: t("insights.patterns.medication.low", {
            value: adherence,
          }),
          trend: "down",
        });
      }
    }

    // Therapy sessions comparison
    const sessionsThisMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lt: monthContext.endExclusive },
      },
    });

    const sessionsPrevMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: previousRange.start, lt: previousRange.endExclusive },
      },
    });

    if (sessionsThisMonth > 0) {
      if (sessionsThisMonth > sessionsPrevMonth) {
        insights.push({
          type: "therapy",
          message: t("insights.patterns.therapy.improved", {
            count: sessionsThisMonth,
            previous: sessionsPrevMonth,
          }),
          trend: "up",
        });
      } else if (sessionsThisMonth === sessionsPrevMonth) {
        insights.push({
          type: "therapy",
          message: t("insights.patterns.therapy.steady", {
            count: sessionsThisMonth,
          }),
          trend: "neutral",
        });
      } else {
        insights.push({
          type: "therapy",
          message: t("insights.patterns.therapy.lower", {
            count: sessionsThisMonth,
          }),
          trend: "neutral",
        });
      }
    }

    // Exercise activity
    const exerciseLogsThisMonth = await prisma.exerciseLog.count({
      where: {
        exercise: { userId: user.id },
        completedAt: { gte: startOfMonth, lt: monthContext.endExclusive },
      },
    });

    if (exerciseLogsThisMonth > 0) {
      insights.push({
        type: "exercise",
        message: t("insights.patterns.exercise.completed", {
          count: exerciseLogsThisMonth,
        }),
        trend: exerciseLogsThisMonth >= 10 ? "up" : "neutral",
      });
    }

    return insights;
  },
);

// ===== Streak Data =====

export const getStreakData = authAction.action(async ({ ctx: { user } }) => {
  const { t } = await getI18n();
  const timeContext = await getUserTimeContext(user.id, 90);

  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: timeContext.start,
        lt: timeContext.endExclusive,
      },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const todayStr = timeContext.endDate;
  const { streakDays, weekProgress, hasEntryToday } = calculateMoodStreak({
    entryDates: moodEntries.map((entry) => entry.createdAt),
    todayDate: todayStr,
    timeZone: timeContext.timezone,
  });

  // Generate subtitle based on streak
  let subtitle = "";
  if (streakDays >= 30) {
    subtitle = t("insights.streak.subtitle.long", { count: streakDays });
  } else if (streakDays >= 14) {
    subtitle = t("insights.streak.subtitle.weeks", {
      weeks: Math.floor(streakDays / 7),
    });
  } else if (streakDays >= 7) {
    subtitle = t("insights.streak.subtitle.week");
  } else if (streakDays >= 3) {
    subtitle = t("insights.streak.subtitle.goodStart", { count: streakDays });
  } else if (streakDays === 0) {
    subtitle = t("insights.streak.subtitle.zero");
  } else if (streakDays === 1) {
    subtitle = t("insights.streak.subtitle.one", { count: streakDays });
  } else {
    subtitle = t("insights.streak.subtitle.few", { count: streakDays });
  }

  return {
    streakDays,
    weekProgress,
    subtitle,
    hasEntryToday,
  };
});
