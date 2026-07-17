"use server";

import { authAction } from "@/lib/actions/safe-actions";
import {
  calculateAdherencePercent,
  getInclusiveDayCount,
} from "@/features/medication/adherence";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getExportDateRange } from "./date-range";
import type { ConsultationExportData } from "./export-types";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString().slice(0, 10) === value;
  });
const getExportDataSchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema,
  })
  .refine(({ startDate, endDate }) => startDate <= endDate);

export const getExportData = authAction
  .inputSchema(getExportDataSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const { start, endExclusive, timezone } = getExportDateRange({
      startDate,
      endDate,
      timezone: preferences?.timezone,
    });

    // Get mood entries
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: start, lt: endExclusive },
      },
      orderBy: { createdAt: "asc" },
      select: {
        value: true,
        energy: true,
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
            takenAt: { gte: start, lt: endExclusive },
          },
          orderBy: { takenAt: "asc" },
        },
        history: {
          where: {
            changedAt: { gte: start, lt: endExclusive },
          },
          orderBy: { changedAt: "asc" },
        },
      },
    });

    // Get therapy sessions
    const therapySessions = await prisma.therapySession.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lt: endExclusive },
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
        completedAt: { gte: start, lt: endExclusive },
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
    const dayCount = getInclusiveDayCount(
      new Date(`${startDate}T00:00:00.000Z`),
      new Date(`${endDate}T00:00:00.000Z`),
    );
    const adherencePercent = calculateAdherencePercent(
      regularMeds.map((medication) => ({
        frequency: medication.frequency,
        intakes: medication.intakes.filter((intake) => !intake.skipped),
      })),
      dayCount,
    );

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        timezone,
        source: "Moodday",
        formatVersion: "2.0",
      },
      period: {
        startDate,
        endDate,
        start: start.toISOString(),
        endExclusive: endExclusive.toISOString(),
      },
      userName: user.name || "Patient",
      mood: {
        entries: moodEntries.map((e) => ({
          value: e.value,
          energy: e.energy,
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
            intakes: m.intakes.map((intake) => ({
              date: intake.takenAt.toISOString(),
              scheduledForDate: intake.scheduledForDate,
              skipped: intake.skipped,
              note: intake.note,
            })),
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
          note: l.note,
        })),
        count: exerciseLogs.length,
      },
    } satisfies ConsultationExportData;
  });

// Get count preview for date range
export const getExportPreview = authAction
  .inputSchema(getExportDataSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { timezone: true },
    });
    const { start, endExclusive } = getExportDateRange({
      startDate,
      endDate,
      timezone: preferences?.timezone,
    });

    const [moodCount, medicationIntakeCount, therapyCount, exerciseCount] =
      await Promise.all([
        prisma.moodEntry.count({
          where: {
            userId: user.id,
            createdAt: { gte: start, lt: endExclusive },
          },
        }),
        prisma.medIntake.count({
          where: {
            medication: { userId: user.id },
            takenAt: { gte: start, lt: endExclusive },
          },
        }),
        prisma.therapySession.count({
          where: {
            userId: user.id,
            date: { gte: start, lt: endExclusive },
          },
        }),
        prisma.exerciseLog.count({
          where: {
            exercise: { userId: user.id },
            completedAt: { gte: start, lt: endExclusive },
          },
        }),
      ]);

    return {
      moodEntries: moodCount,
      medicationIntakes: medicationIntakeCount,
      therapySessions: therapyCount,
      exerciseLogs: exerciseCount,
      total: moodCount + medicationIntakeCount + therapyCount + exerciseCount,
    };
  });
