"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    return {
      moodEntries: moodEntries.map((entry) => ({
        id: entry.id,
        value: entry.value,
        note: entry.note,
        date: entry.createdAt.toISOString(),
      })),
      dosageChanges: dosageChanges.map((change) => ({
        id: change.id,
        medicationName: change.medication.name,
        previousDosage: change.previousDosage,
        newDosage: change.dosage,
        date: change.changedAt.toISOString(),
      })),
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

    // Mood data (last 7 days for mini chart)
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek },
      },
      orderBy: { createdAt: "asc" },
      select: { value: true, createdAt: true },
    });

    const weeklyMoodAvg =
      moodEntries.length > 0
        ? moodEntries.reduce((sum, e) => sum + e.value, 0) / moodEntries.length
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

    // Calculate expected doses and actual taken
    const totalMeds = medications.length;
    const todayIntakes = await prisma.medIntake.count({
      where: {
        medication: { userId: user.id, isArchived: false },
        takenAt: { gte: startOfDay },
        skipped: false,
      },
    });

    // Calculate monthly adherence (simplistic: taken / (meds * 30 days))
    const monthlyIntakes = medications.reduce(
      (sum, m) => sum + m.intakes.length,
      0,
    );
    const expectedMonthly = totalMeds * 30;
    const adherencePercent =
      expectedMonthly > 0
        ? Math.min(100, Math.round((monthlyIntakes / expectedMonthly) * 100))
        : null;

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
        entries: moodEntries.map((e) => ({
          value: e.value,
          date: e.createdAt.toISOString(),
        })),
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

      if (avgMood >= 7) {
        insights.push({
          type: "mood",
          message: `Humeur moyenne de ${avgMood.toFixed(1)}/10 ce mois - continue comme ça !`,
          trend: "up",
        });
      } else if (avgMood >= 5) {
        insights.push({
          type: "mood",
          message: `Humeur moyenne de ${avgMood.toFixed(1)}/10 ce mois`,
          trend: "neutral",
        });
      } else {
        insights.push({
          type: "mood",
          message: `Humeur moyenne de ${avgMood.toFixed(1)}/10 - rappelle-toi que les hauts et les bas font partie du chemin`,
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
            message:
              "Humeur plus haute le weekend - le repos te fait du bien !",
            trend: "up",
          });
        } else if (weekdayAvg > weekendAvg + 1) {
          insights.push({
            type: "mood",
            message: "Humeur plus stable en semaine - la routine t'aide",
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
      const totalIntakes = medications.reduce(
        (sum, m) => sum + m.intakes.length,
        0,
      );
      const expected = medications.length * 30;
      const adherence = Math.min(
        100,
        Math.round((totalIntakes / expected) * 100),
      );

      if (adherence >= 90) {
        insights.push({
          type: "medication",
          message: `Observance médicaments : ${adherence}% ce mois - excellent !`,
          trend: "up",
        });
      } else if (adherence >= 70) {
        insights.push({
          type: "medication",
          message: `Observance médicaments : ${adherence}% ce mois`,
          trend: "neutral",
        });
      } else if (adherence > 0) {
        insights.push({
          type: "medication",
          message: `Observance médicaments : ${adherence}% - chaque prise compte`,
          trend: "down",
        });
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
          message: `${sessionsThisMonth} séances ce mois (vs ${sessionsPrevMonth} le mois dernier) - beau travail !`,
          trend: "up",
        });
      } else if (sessionsThisMonth === sessionsPrevMonth) {
        insights.push({
          type: "therapy",
          message: `${sessionsThisMonth} séances ce mois - tu maintiens le rythme`,
          trend: "neutral",
        });
      } else {
        insights.push({
          type: "therapy",
          message: `${sessionsThisMonth} séances ce mois`,
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
        message: `${exerciseLogsThisMonth} exercices complétés ce mois - continue !`,
        trend: exerciseLogsThisMonth >= 10 ? "up" : "neutral",
      });
    }

    return insights;
  },
);
