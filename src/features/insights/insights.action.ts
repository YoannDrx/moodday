"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getI18n } from "@/i18n/server";
import { calculateAdherencePercent } from "@/features/medication/adherence";

// ===== Mood Chart Data (30 Days) =====

const getMoodChartDataSchema = z.object({
  days: z.number().optional().default(30),
});

export const getMoodChartData = authAction
  .inputSchema(getMoodChartDataSchema)
  .action(async ({ parsedInput: { days }, ctx: { user } }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: since },
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
        changedAt: { gte: since },
      },
      include: {
        medication: {
          select: { name: true },
        },
      },
      orderBy: { changedAt: "asc" },
    });

    // Medication adherence for the same period
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        frequency: { not: "prn" },
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: since },
            skipped: false,
          },
        },
      },
    });

    const adherencePercent = calculateAdherencePercent(medications, days);

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
    };
  });

// ===== Dashboard Summary =====

export const getDashboardSummary = authAction.action(
  async ({ ctx: { user } }) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    // Previous week for trend calculation
    const startOfPrevWeek = new Date(now);
    startOfPrevWeek.setDate(now.getDate() - 14);

    // Mood data (last 7 days for mini chart) - with sleep data
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek },
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

    // Medication adherence
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        frequency: { not: "prn" },
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: startOfMonth },
            skipped: false,
          },
        },
      },
    });

    const totalMeds = medications.length;
    const todayIntakes = await prisma.medIntake.count({
      where: {
        medication: { userId: user.id, isArchived: false, isPRN: false },
        takenAt: { gte: startOfDay },
        skipped: false,
      },
    });

    const adherencePercent = calculateAdherencePercent(medications, 30);

    // Therapy sessions (last session + count this month)
    const lastTherapySession = await prisma.therapySession.findFirst({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: { date: true, benefitRating: true },
    });

    const therapySessionsThisMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: startOfMonth },
      },
    });

    // Exercise activity (this week)
    const exerciseLogsThisWeek = await prisma.exerciseLog.count({
      where: {
        exercise: { userId: user.id },
        completedAt: { gte: startOfWeek },
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
        weeklyAverage: weeklyMoodAvg
          ? Math.round(weeklyMoodAvg * 10) / 10
          : null,
        trendPercent,
        entries: moodEntries.map((e) => ({
          value: e.value,
          date: e.createdAt.toISOString(),
        })),
      },
      sleep: {
        avgHours: avgSleepHours ? Math.round(avgSleepHours * 10) / 10 : null,
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
    const now = new Date();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const startOfPrevMonth = new Date(now);
    startOfPrevMonth.setDate(now.getDate() - 60);

    // Mood insights
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
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
        const day = e.createdAt.getDay();
        return day === 0 || day === 6;
      });
      const weekdayMoods = moodEntries.filter((e) => {
        const day = e.createdAt.getDay();
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

    // Medication adherence insight
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        frequency: { not: "prn" },
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: startOfMonth },
            skipped: false,
          },
        },
      },
    });

    if (medications.length > 0) {
      const adherence = calculateAdherencePercent(medications, 30);

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
    }

    // Therapy sessions comparison
    const sessionsThisMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: startOfMonth },
      },
    });

    const sessionsPrevMonth = await prisma.therapySession.count({
      where: {
        userId: user.id,
        date: { gte: startOfPrevMonth, lt: startOfMonth },
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
        completedAt: { gte: startOfMonth },
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
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  // Get all mood entries from the last 90 days
  const since = new Date(now);
  since.setDate(since.getDate() - 90);
  since.setHours(0, 0, 0, 0);

  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  // Create a set of days with entries (YYYY-MM-DD format)
  const daysWithEntries = new Set<string>();
  for (const entry of moodEntries) {
    const dateStr = entry.createdAt.toISOString().split("T")[0];
    daysWithEntries.add(dateStr);
  }

  // Calculate current streak (consecutive days ending today or yesterday)
  let streakDays = 0;
  const checkDate = new Date(now);

  // Check if today has an entry, if not start from yesterday
  const todayStr = checkDate.toISOString().split("T")[0] ?? "";
  if (!daysWithEntries.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days (max 90 days to prevent infinite loop)
  let counting = true;
  let maxIterations = 90;
  while (counting && maxIterations > 0) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (dateStr && daysWithEntries.has(dateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
      maxIterations--;
    } else {
      counting = false;
    }
  }

  // Get week progress (last 7 days, 1 = has entry, 0 = no entry)
  const weekProgress: (0 | 1)[] = [];
  const weekDate = new Date(now);
  weekDate.setDate(weekDate.getDate() - 6); // Start from 6 days ago

  for (let i = 0; i < 7; i++) {
    const dateStr = weekDate.toISOString().split("T")[0];
    weekProgress.push(daysWithEntries.has(dateStr) ? 1 : 0);
    weekDate.setDate(weekDate.getDate() + 1);
  }

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
    hasEntryToday: daysWithEntries.has(todayStr),
  };
});
