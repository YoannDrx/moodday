"use server";

import { authAction } from "@/lib/actions/safe-actions";
import {
  getBillingPeriodKey,
  getEntitlements,
} from "@/lib/billing/entitlements";
import {
  AI_PROMPT_VERSION,
  buildDeterministicInsight,
  generateMooddayInsight,
  getInsightDataFields,
  hasCrisisSignal,
} from "@/lib/ai/moodday-insights";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isAiInsightsAvailableForUser } from "@/lib/features/availability";
import { ActionError } from "@/lib/errors/action-error";
import { getDateKeyForTimeZone } from "@/features/medication/schedule";
import {
  claimAiInsightUsage,
  markAiUsageBlockedForCrisis,
} from "./ai-usage-admission";

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
    if (parsedInput.enabled && !isAiInsightsAvailableForUser(user.id)) {
      throw new ActionError("AI insights are currently unavailable");
    }
    const now = new Date();
    const existingPreferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
      select: { locale: true },
    });
    const consentLocale = existingPreferences?.locale === "en" ? "en" : "fr";
    await prisma.$transaction(async (transaction) => {
      await transaction.userPreferences.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          aiInsightsEnabled: parsedInput.enabled,
          aiJournalNotesEnabled:
            parsedInput.enabled && parsedInput.includeJournalNotes,
          aiConsentVersion: parsedInput.enabled ? env.AI_CONSENT_VERSION : null,
          aiConsentAt: parsedInput.enabled ? now : null,
        },
        update: {
          aiInsightsEnabled: parsedInput.enabled,
          aiJournalNotesEnabled:
            parsedInput.enabled && parsedInput.includeJournalNotes,
          aiConsentVersion: parsedInput.enabled ? env.AI_CONSENT_VERSION : null,
          aiConsentAt: parsedInput.enabled ? now : null,
        },
      });
      if (parsedInput.enabled) {
        await transaction.userConsent.upsert({
          where: {
            userId_purpose_version: {
              userId: user.id,
              purpose: "ai_insights",
              version: env.AI_CONSENT_VERSION,
            },
          },
          create: {
            userId: user.id,
            purpose: "ai_insights",
            version: env.AI_CONSENT_VERSION,
            locale: consentLocale,
            country: env.LAUNCH_COUNTRY,
            source: "settings",
          },
          update: { acceptedAt: now, revokedAt: null, source: "settings" },
        });
      } else {
        await transaction.userConsent.updateMany({
          where: {
            userId: user.id,
            purpose: { in: ["ai_insights", "ai_journal_notes"] },
            revokedAt: null,
          },
          data: { revokedAt: now },
        });
      }
      if (parsedInput.enabled && parsedInput.includeJournalNotes) {
        await transaction.userConsent.upsert({
          where: {
            userId_purpose_version: {
              userId: user.id,
              purpose: "ai_journal_notes",
              version: env.AI_CONSENT_VERSION,
            },
          },
          create: {
            userId: user.id,
            purpose: "ai_journal_notes",
            version: env.AI_CONSENT_VERSION,
            locale: consentLocale,
            country: env.LAUNCH_COUNTRY,
            source: "settings",
          },
          update: { acceptedAt: now, revokedAt: null, source: "settings" },
        });
      } else {
        await transaction.userConsent.updateMany({
          where: {
            userId: user.id,
            purpose: "ai_journal_notes",
            revokedAt: null,
          },
          data: { revokedAt: now },
        });
      }
    });
    return { enabled: parsedInput.enabled };
  });

export const getAiJournalInsight = authAction
  .inputSchema(aiInsightSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });
    const locale: "fr" | "en" = preferences?.locale === "en" ? "en" : "fr";
    const today = getDateKeyForTimeZone(
      new Date(),
      preferences?.timezone ?? "Europe/Paris",
    );
    // Tags can carry sensitive free-form context and are not part of the
    // launch consent wording, so they remain local and are never sent.
    const { includeJournalNotes, tags: _localTags, ...metrics } = parsedInput;
    const input = { ...metrics, date: today, locale };
    const fallback = buildDeterministicInsight(input);
    const crisisMessage =
      locale === "en"
        ? "You do not have to face this alone. In France, call 3114; for immediate danger, call 15 or 112. Moodday is not an emergency service."
        : "Vous n'avez pas à rester seul·e avec ce que vous traversez. En France, appelez le 3114; en cas de danger immédiat, le 15 ou le 112. Moodday n'est pas un service d'urgence.";

    if (hasCrisisSignal(input)) {
      return {
        source: "safety" as const,
        message: crisisMessage,
        crisis: true,
      };
    }

    const [subscription, consents] = await Promise.all([
      prisma.subscription.findUnique({ where: { referenceId: user.id } }),
      prisma.userConsent.findMany({
        where: {
          userId: user.id,
          version: env.AI_CONSENT_VERSION,
          revokedAt: null,
          purpose: { in: ["ai_insights", "ai_journal_notes"] },
        },
        select: { purpose: true },
      }),
    ]);
    const entitlements = getEntitlements(subscription);
    const consentPurposes = new Set(consents.map((consent) => consent.purpose));
    const consented =
      preferences?.aiInsightsEnabled &&
      preferences.aiConsentVersion === env.AI_CONSENT_VERSION &&
      consentPurposes.has("ai_insights");

    if (
      !consented ||
      entitlements.aiGenerationsPerMonth === 0 ||
      !isAiInsightsAvailableForUser(user.id)
    ) {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        requiresConsent: !consented,
      };
    }

    const periodKey = getBillingPeriodKey();
    const requestKey = `journal:${user.id}:${today}`;
    const admission = await claimAiInsightUsage({
      userId: user.id,
      requestKey,
      periodKey,
      monthlyUserLimit: entitlements.aiGenerationsPerMonth,
      model: env.AI_INSIGHTS_MODEL ?? "gpt-5.6",
      promptVersion: AI_PROMPT_VERSION,
    });
    if (!admission.admitted && admission.reason === "monthly_quota") {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        quotaReached: true,
      };
    }
    if (!admission.admitted && admission.reason === "daily_limit") {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        dailyLimitReached: true,
      };
    }
    if (!admission.admitted) {
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
        temporarilyUnavailable: true,
      };
    }

    const startedAt = Date.now();
    try {
      const result = await generateMooddayInsight({
        userId: user.id,
        input,
        includeJournalNotes: Boolean(
          includeJournalNotes &&
            preferences.aiJournalNotesEnabled &&
            consentPurposes.has("ai_journal_notes"),
        ),
      });

      if (result.kind === "crisis") {
        await markAiUsageBlockedForCrisis({
          usageId: admission.usageId,
          requestKey,
          latencyMs: Date.now() - startedAt,
        });
        return {
          source: "safety" as const,
          message: crisisMessage,
          crisis: true,
        };
      }

      await prisma.aIUsage.update({
        where: { id: admission.usageId },
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
        transparency:
          result.kind === "ai"
            ? {
                generatedAt: result.insight.generatedAt,
                date: input.date,
                dataFields: getInsightDataFields(
                  input,
                  Boolean(
                    includeJournalNotes &&
                      preferences.aiJournalNotesEnabled &&
                      consentPurposes.has("ai_journal_notes"),
                  ),
                ),
              }
            : null,
      };
    } catch {
      await prisma.aIUsage.update({
        where: { id: admission.usageId },
        data: { status: "failed", latencyMs: Date.now() - startedAt },
      });
      return {
        source: "heuristic" as const,
        message: fallback.summary,
        insight: fallback,
      };
    }
  });
