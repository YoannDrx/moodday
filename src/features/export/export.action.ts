"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const getExportDataSchema = z.object({
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
});

export const getExportData = authAction
  .inputSchema(getExportDataSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get mood entries
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: "asc" },
      select: {
        value: true,
        note: true,
        createdAt: true,
      },
    });

    // Get medications and their intakes
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
      },
      include: {
        intakes: {
          where: {
            takenAt: { gte: start, lte: end },
          },
          orderBy: { takenAt: "asc" },
        },
        history: {
          where: {
            changedAt: { gte: start, lte: end },
          },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    // Get therapy sessions
    const therapySessions = await prisma.therapySession.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        notes: true,
        benefitRating: true,
      },
    });

    // Get exercise logs
    const exerciseLogs = await prisma.exerciseLog.findMany({
      where: {
        exercise: { userId: user.id },
        completedAt: { gte: start, lte: end },
      },
      include: {
        exercise: {
          select: { name: true },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    // Calculate summary stats
    const moodAvg =
      moodEntries.length > 0
        ? moodEntries.reduce((sum, e) => sum + e.value, 0) / moodEntries.length
        : null;

    const moodMin =
      moodEntries.length > 0
        ? Math.min(...moodEntries.map((e) => e.value))
        : null;

    const moodMax =
      moodEntries.length > 0
        ? Math.max(...moodEntries.map((e) => e.value))
        : null;

    // Medication adherence
    const regularMeds = medications.filter(
      (m) => !m.isArchived && m.frequency !== "prn",
    );
    const totalExpectedDoses =
      regularMeds.length *
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalTakenDoses = regularMeds.reduce(
      (sum, m) => sum + m.intakes.filter((i) => !i.skipped).length,
      0,
    );
    const adherencePercent =
      totalExpectedDoses > 0
        ? Math.min(
            100,
            Math.round((totalTakenDoses / totalExpectedDoses) * 100),
          )
        : null;

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      userName: user.name ?? "Patient",
      mood: {
        entries: moodEntries.map((e) => ({
          value: e.value,
          note: e.note,
          date: e.createdAt.toISOString(),
        })),
        stats: {
          average: moodAvg ? Math.round(moodAvg * 10) / 10 : null,
          min: moodMin,
          max: moodMax,
          count: moodEntries.length,
        },
      },
      medications: {
        list: medications
          .filter((m) => !m.isArchived)
          .map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            isPRN: m.isPRN,
            intakesCount: m.intakes.filter((i) => !i.skipped).length,
            dosageChanges: m.history.map((h) => ({
              date: h.changedAt.toISOString(),
              from: h.previousDosage,
              to: h.dosage,
            })),
          })),
        adherencePercent,
      },
      therapy: {
        sessions: therapySessions.map((s) => ({
          date: s.date.toISOString(),
          notes: s.notes,
          benefitRating: s.benefitRating,
        })),
        count: therapySessions.length,
      },
      exercises: {
        logs: exerciseLogs.map((l) => ({
          name: l.exercise.name,
          date: l.completedAt.toISOString(),
        })),
        count: exerciseLogs.length,
      },
    };
  });

// Get count preview for date range
export const getExportPreview = authAction
  .inputSchema(getExportDataSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [moodCount, therapyCount, exerciseCount] = await Promise.all([
      prisma.moodEntry.count({
        where: {
          userId: user.id,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.therapySession.count({
        where: {
          userId: user.id,
          date: { gte: start, lte: end },
        },
      }),
      prisma.exerciseLog.count({
        where: {
          exercise: { userId: user.id },
          completedAt: { gte: start, lte: end },
        },
      }),
    ]);

    return {
      moodEntries: moodCount,
      therapySessions: therapyCount,
      exerciseLogs: exerciseCount,
      total: moodCount + therapyCount + exerciseCount,
    };
  });
