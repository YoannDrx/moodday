"use server";

import { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import {
  getBillingPeriodKey,
  getEntitlements,
} from "@/lib/billing/entitlements";
import {
  AI_CONSENT_VERSION,
  AI_PROMPT_VERSION,
  buildDeterministicInsight,
  generateMooddayInsight,
  hasCrisisSignal,
} from "@/lib/ai/moodday-insights";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const aiInsightSchema = z.object({
  mood: z.number().min(0).max(10),
  energy: z.number().min(0).max(10).optional(),
  anxiety: z.number().min(0).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  includeJournalNotes: z.boolean().default(false),
});

export const setAiInsightsConsent = authAction
  .inputSchema(
    z.object({
      enabled: z.boolean(),
      includeJournalNotes: z.boolean().default(false),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        aiInsightsEnabled: parsedInput.enabled,
        aiJournalNotesEnabled:
          parsedInput.enabled && parsedInput.includeJournalNotes,
        aiConsentVersion: parsedInput.enabled ? AI_CONSENT_VERSION : null,
        aiConsentAt: parsedInput.enabled ? new Date() : null,
      },
      update: {
        aiInsightsEnabled: parsedInput.enabled,
        aiJournalNotesEnabled:
          parsedInput.enabled && parsedInput.includeJournalNotes,
        aiConsentVersion: parsedInput.enabled ? AI_CONSENT_VERSION : null,
        aiConsentAt: parsedInput.enabled ? new Date() : null,
      },
    });
    return { enabled: parsedInput.enabled };
  });

export const getAiJournalInsight = authAction
  .inputSchema(aiInsightSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const today = new Date().toISOString().slice(0, 10);
    const input = { ...parsedInput, date: today };
    const fallback = buildDeterministicInsight(input);

    if (hasCrisisSignal(input)) {
      return {
        source: "safety" as const,
        message:
          "Vous n'avez pas à rester seul·e avec ce que vous traversez. En France, appelez le 3114; en cas de danger immédiat, le 15 ou le 112. Moodday n'est pas un service d'urgence.",
        crisis: true,
      };
    }

    const [subscription, preferences] = await Promise.all([
      prisma.subscription.findUnique({ where: { referenceId: user.id } }),
      prisma.userPreferences.findUnique({ where: { userId: user.id } }),
    ]);
    const entitlements = getEntitlements(subscription);
    const consented =
      preferences?.aiInsightsEnabled &&
      preferences.aiConsentVersion === AI_CONSENT_VERSION;

    if (
      !consented ||
      entitlements.aiGenerationsPerMonth === 0 ||
      !env.AI_INSIGHTS_ENABLED
    ) {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        requiresConsent: !consented,
      };
    }

    const periodKey = getBillingPeriodKey();
    const rollingDayStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [successfulThisMonth, recentGeneration] = await Promise.all([
      prisma.aIUsage.count({
        where: {
          userId: user.id,
          periodKey,
          status: { in: ["processing", "succeeded"] },
        },
      }),
      prisma.aIUsage.findFirst({
        where: {
          userId: user.id,
          status: { in: ["processing", "succeeded"] },
          createdAt: { gte: rollingDayStart },
        },
        select: { id: true },
      }),
    ]);
    if (successfulThisMonth >= entitlements.aiGenerationsPerMonth) {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        quotaReached: true,
      };
    }
    if (recentGeneration) {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        dailyLimitReached: true,
      };
    }

    const requestKey = `journal:${user.id}:${today}`;
    try {
      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          requestKey,
          periodKey,
          status: "processing",
          model: env.AI_INSIGHTS_MODEL ?? "gpt-5.6",
          promptVersion: AI_PROMPT_VERSION,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          source: "heuristic" as const,
          message: fallback.summary,
          insight: fallback,
          dailyLimitReached: true,
        };
      }
      throw error;
    }

    const startedAt = Date.now();
    try {
      const result = await generateMooddayInsight({
        userId: user.id,
        input,
        includeJournalNotes: Boolean(
          parsedInput.includeJournalNotes && preferences.aiJournalNotesEnabled,
        ),
      });

      if (result.kind === "crisis") {
        await prisma.aIUsage.update({
          where: { requestKey },
          data: {
            status: "blocked",
            safetyCategory: "self-harm",
            latencyMs: Date.now() - startedAt,
          },
        });
        return {
          source: "safety" as const,
          message:
            "Vous n'avez pas à rester seul·e avec ce que vous traversez. En France, appelez le 3114; en cas de danger immédiat, le 15 ou le 112. Moodday n'est pas un service d'urgence.",
          crisis: true,
        };
      }

      await prisma.aIUsage.update({
        where: { requestKey },
        data: {
          status: result.kind === "ai" ? "succeeded" : "fallback",
          inputTokens: result.kind === "ai" ? result.usage?.input_tokens : null,
          outputTokens:
            result.kind === "ai" ? result.usage?.output_tokens : null,
          latencyMs: Date.now() - startedAt,
        },
      });
      return {
        source: result.kind === "ai" ? ("ai" as const) : ("heuristic" as const),
        message: result.insight.summary,
        insight: result.insight,
      };
    } catch {
      await prisma.aIUsage.update({
        where: { requestKey },
        data: { status: "failed", latencyMs: Date.now() - startedAt },
      });
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
      };
    }
  });
