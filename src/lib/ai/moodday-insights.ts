import "server-only";

import { createHmac } from "node:crypto";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { env } from "@/lib/env";

export const AI_PROMPT_VERSION = "moodday-insight-v1";
export const AI_CONSENT_VERSION = "ai-insights-2026-08";

export const insightEvidenceSchema = z.object({
  date: z.string(),
  metric: z.string(),
});

const generatedInsightSchema = z.object({
  summary: z.string().min(1).max(700),
  observations: z
    .array(
      z.object({
        label: z.string().min(1).max(240),
        evidenceRefs: z.array(insightEvidenceSchema).min(1).max(6),
      }),
    )
    .max(4),
  questionsForConsultation: z.array(z.string().max(240)).max(4),
  cautions: z.array(z.string().max(240)).max(3),
});

export const mooddayInsightSchema = generatedInsightSchema.extend({
  generatedAt: z.string(),
  model: z.string(),
  promptVersion: z.string(),
});

export type MooddayInsight = z.infer<typeof mooddayInsightSchema>;

export type InsightInput = {
  date: string;
  mood: number;
  energy?: number;
  anxiety?: number;
  sleepHours?: number;
  sleepQuality?: number;
  tags?: string[];
  notes?: string;
};

const CRISIS_PATTERNS = [
  /\b(suicid\w*|me tuer|mourir|en finir|automutil\w*|me faire du mal)\b/i,
  /\b(kill myself|suicid\w*|end my life|self[- ]?harm|hurt myself)\b/i,
];

export function hasCrisisSignal(input: InsightInput) {
  return input.notes
    ? CRISIS_PATTERNS.some((pattern) => pattern.test(input.notes ?? ""))
    : false;
}

export function buildDeterministicInsight(input: InsightInput): MooddayInsight {
  const evidence = { date: input.date, metric: "mood" };
  const observations: MooddayInsight["observations"] = [
    {
      label: `L'humeur notée aujourd'hui est de ${input.mood}/10.`,
      evidenceRefs: [evidence],
    },
  ];

  if (input.anxiety !== undefined) {
    observations.push({
      label: `Le niveau d'anxiété déclaré est de ${input.anxiety}/10.`,
      evidenceRefs: [{ date: input.date, metric: "anxiety" }],
    });
  }
  if (input.sleepHours !== undefined) {
    observations.push({
      label: `La durée de sommeil déclarée est de ${input.sleepHours} heures.`,
      evidenceRefs: [{ date: input.date, metric: "sleepHours" }],
    });
  }

  return {
    summary:
      "Cette synthèse reprend uniquement les éléments que vous avez notés aujourd'hui. Continuez à observer leur évolution sans en déduire de cause médicale.",
    observations: observations.slice(0, 4),
    questionsForConsultation: [
      "Quels changements récents souhaitez-vous signaler lors de votre prochaine consultation ?",
    ],
    cautions: [
      "Moodday ne pose pas de diagnostic et ne recommande aucune modification de traitement.",
    ],
    generatedAt: new Date().toISOString(),
    model: "deterministic",
    promptVersion: AI_PROMPT_VERSION,
  };
}

export function hasValidEvidenceRefs(
  insight: MooddayInsight,
  input: InsightInput,
) {
  const allowedMetrics = new Set(["date", "mood"]);
  if (input.energy !== undefined) allowedMetrics.add("energy");
  if (input.anxiety !== undefined) allowedMetrics.add("anxiety");
  if (input.sleepHours !== undefined) allowedMetrics.add("sleepHours");
  if (input.sleepQuality !== undefined) allowedMetrics.add("sleepQuality");
  if (input.tags !== undefined) allowedMetrics.add("tags");
  return insight.observations.every(
    (observation) =>
      observation.evidenceRefs.length > 0 &&
      observation.evidenceRefs.every(
        (reference) =>
          reference.date === input.date && allowedMetrics.has(reference.metric),
      ),
  );
}

export function containsMedicalRecommendation(insight: MooddayInsight) {
  const text = [
    insight.summary,
    ...insight.observations.map((observation) => observation.label),
    ...insight.questionsForConsultation,
    ...insight.cautions,
  ].join(" ");
  return /\b((diagnostic|diagnosis) (est|is)|you have (a|an)|vous (avez|souffrez) (d'un|d'une|de|du)|arr[eê]t\w* (le|votre) traitement|stop (taking|your medication)|augment\w* (la|votre) dose|increase your dose|diminu\w* (la|votre) dose|decrease your dose)\b/i.test(
    text,
  );
}

function createSafetyIdentifier(userId: string) {
  if (!env.AI_SAFETY_HMAC_SECRET) return null;
  return createHmac("sha256", env.AI_SAFETY_HMAC_SECRET)
    .update(userId)
    .digest("hex")
    .slice(0, 64);
}

async function isSelfHarmFlagged(client: OpenAI, notes?: string) {
  if (!notes) return false;
  const moderation = await client.moderations.create({
    model: "omni-moderation-latest",
    input: notes,
  });
  const categories = moderation.results[0]?.categories;
  return Boolean(
    categories["self-harm"] ||
      categories["self-harm/intent"] ||
      categories["self-harm/instructions"],
  );
}

export async function generateMooddayInsight(params: {
  userId: string;
  input: InsightInput;
  includeJournalNotes: boolean;
}) {
  if (
    !env.AI_INSIGHTS_ENABLED ||
    !env.OPENAI_API_KEY ||
    !env.AI_SAFETY_HMAC_SECRET
  ) {
    return {
      kind: "fallback" as const,
      insight: buildDeterministicInsight(params.input),
    };
  }

  const sanitizedInput = {
    ...params.input,
    notes: params.includeJournalNotes ? params.input.notes : undefined,
  };
  if (hasCrisisSignal(sanitizedInput)) return { kind: "crisis" as const };

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  if (await isSelfHarmFlagged(client, sanitizedInput.notes)) {
    return { kind: "crisis" as const };
  }

  const model = env.AI_INSIGHTS_MODEL ?? "gpt-5.6";
  const response = await client.responses.parse({
    model,
    store: false,
    safety_identifier: createSafetyIdentifier(params.userId) ?? undefined,
    max_output_tokens: 900,
    input: [
      {
        role: "developer",
        content:
          "Tu rédiges un bilan factuel et bienveillant pour un journal personnel non médical. Tu n'établis aucun diagnostic, pronostic, lien causal ou recommandation de traitement. Chaque observation cite au moins une date et une métrique présentes dans l'entrée. Tu distingues les observations des questions à apporter en consultation. Si les données sont insuffisantes, tu le dis. Réponds en français.",
      },
      {
        role: "user",
        content: JSON.stringify(sanitizedInput),
      },
    ],
    text: {
      format: zodTextFormat(generatedInsightSchema, "moodday_insight"),
    },
  });

  if (!response.output_parsed) throw new Error("missing_structured_output");
  const insight = mooddayInsightSchema.parse({
    ...response.output_parsed,
    generatedAt: new Date().toISOString(),
    model,
    promptVersion: AI_PROMPT_VERSION,
  });
  if (
    !hasValidEvidenceRefs(insight, sanitizedInput) ||
    containsMedicalRecommendation(insight)
  ) {
    return {
      kind: "fallback" as const,
      insight: buildDeterministicInsight(sanitizedInput),
    };
  }

  return {
    kind: "ai" as const,
    insight,
    usage: response.usage,
  };
}
