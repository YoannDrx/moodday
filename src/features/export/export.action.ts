"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { calculateMedicationAdherence } from "@/features/medication/adherence";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getEntitlements } from "@/lib/billing/entitlements";
import { ActionError } from "@/lib/errors/action-error";
import {
  getCivilDateRangeDayCount,
  parseCivilDateKey,
} from "@/lib/temporal/civil-date";
import { z } from "zod";
import { getExportDateRange } from "./date-range";
import type { ConsultationExportData } from "./export-types";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    try {
      parseCivilDateKey(value);
      return true;
    } catch {
      return false;
    }
  });
const exportRangeSchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema,
  })
  .refine(({ startDate, endDate }) => startDate <= endDate)
  .refine(({ startDate, endDate }) => {
    try {
      return getCivilDateRangeDayCount(startDate, endDate) <= 365;
    } catch {
      return false;
    }
  });

const getExportDataSchema = z.intersection(
  exportRangeSchema,
  z.object({
    purpose: z.enum(["csv", "consultation-report", "preview"]),
    preparationId: z.string().optional(),
  }),
);

export const getExportData = authAction
  .inputSchema(getExportDataSchema)
  .action(
    async ({
      parsedInput: { startDate, endDate, purpose, preparationId },
      ctx: { user },
    }) => {
      await enforceRateLimit({
        scope: "consultation-export",
        identifier: user.id,
        max: 10,
        windowSeconds: 60 * 60,
      });
      if (purpose !== "csv") {
        const subscription = await prisma.subscription.findUnique({
          where: { referenceId: user.id },
        });
        if (!getEntitlements(subscription).consultationReports) {
          throw new ActionError("Consultation reports require Moodday Plus");
        }
      }
      const preparation = preparationId
        ? await prisma.consultationPreparation.findFirst({
            where: { id: preparationId, userId: user.id },
          })
        : null;
      if (preparationId && !preparation) {
        throw new ActionError("Consultation preparation not found");
      }
      if (
        preparation &&
        (preparation.periodStartDate !== startDate ||
          preparation.periodEndDate !== endDate)
      ) {
        throw new ActionError("Consultation preparation period mismatch");
      }
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
          anxiety: true,
          sleepHours: true,
          sleepQuality: true,
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
              OR: [
                { scheduledForDate: { gte: startDate, lte: endDate } },
                {
                  scheduledForDate: null,
                  takenAt: { gte: start, lt: endExclusive },
                },
              ],
            },
            orderBy: { takenAt: "asc" },
          },
          history: {
            where: {
              changedAt: { gte: start, lt: endExclusive },
            },
            orderBy: { changedAt: "asc" },
          },
          scheduleRevisions: {
            where: { effectiveDate: { lte: endDate } },
            orderBy: { effectiveDate: "asc" },
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
          ? moodEntries.reduce((sum, e) => sum + e.value, 0) /
            moodEntries.length
          : null;

      const moodMin =
        moodEntries.length > 0
          ? Math.min(...moodEntries.map((e) => e.value))
          : null;

      const moodMax =
        moodEntries.length > 0
          ? Math.max(...moodEntries.map((e) => e.value))
          : null;

      const moodChange =
        moodEntries.length >= 2
          ? moodEntries[moodEntries.length - 1].value - moodEntries[0].value
          : null;

      // Medication adherence
      const adherence = calculateMedicationAdherence({
        medications,
        startDate,
        endDate,
        todayDate: getDateKeyForTimeZone(new Date(), timezone),
      });

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
        preparation: preparation
          ? {
              id: preparation.id,
              title: preparation.title,
              scheduledFor: preparation.scheduledFor?.toISOString() ?? null,
              questions: preparation.questions,
              importantEvents: preparation.importantEvents,
              personalNotes: preparation.personalNotes,
              status: preparation.status,
            }
          : null,
        mood: {
          entries: moodEntries.map((e) => ({
            value: e.value,
            energy: e.energy,
            anxiety: e.anxiety,
            sleepHours: e.sleepHours,
            sleepQuality: e.sleepQuality,
            note: e.note,
            date: e.createdAt.toISOString(),
          })),
          stats: {
            average: moodAvg !== null ? Math.round(moodAvg * 10) / 10 : null,
            min: moodMin,
            max: moodMax,
            count: moodEntries.length,
            change: moodChange,
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
          adherencePercent: adherence.percent,
          expectedDoses: adherence.expectedDoses,
          takenDoses: adherence.takenDoses,
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
    },
  );

// Get count preview for date range
export const getExportPreview = authAction
  .inputSchema(exportRangeSchema)
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
