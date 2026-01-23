"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { authAction } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";

const aiInsightSchema = z.object({
  mood: z.number().min(0).max(10),
  energy: z.number().min(0).max(10).optional(),
  anxiety: z.number().min(0).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

const buildFallbackInsight = (input: z.infer<typeof aiInsightSchema>) => {
  const parts: string[] = [];

  if (input.anxiety !== undefined && input.anxiety >= 7) {
    parts.push(
      "Votre niveau d'anxiete est eleve aujourd'hui. Essayez une pause calme ou un exercice de respiration.",
    );
  }

  if (input.energy !== undefined && input.energy <= 4) {
    parts.push(
      "L'energie semble basse. Un rythme plus doux et une bonne hydratation peuvent aider.",
    );
  }

  if (input.sleepHours !== undefined && input.sleepHours < 6) {
    parts.push(
      "Le sommeil a ete court. Si possible, accordez-vous un moment de repos plus tot ce soir.",
    );
  }

  if (parts.length === 0) {
    parts.push(
      "Continuez a noter vos ressentis. Ces donnees vous aideront a mieux comprendre vos patterns.",
    );
  }

  return parts.join(" ");
};

export const getAiJournalInsight = authAction
  .inputSchema(aiInsightSchema)
  .action(async ({ parsedInput }) => {
    const fallback = buildFallbackInsight(parsedInput);

    if (!env.OPENAI_API_KEY) {
      return { message: fallback, source: "heuristic" as const };
    }

    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    const model = env.AI_INSIGHTS_MODEL ?? "gpt-4o-mini";

    const prompt = `Tu es un assistant bienveillant pour un journal de sante mentale.
Donne une courte observation (2-3 phrases) en francais, sans diagnostic ni conseil medical.
Sois doux, non culpabilisant, et pratique.

Donnees:
- Humeur: ${parsedInput.mood}/10
- Energie: ${parsedInput.energy ?? "n/a"}/10
- Anxiete: ${parsedInput.anxiety ?? "n/a"}/10
- Sommeil: ${parsedInput.sleepHours ?? "n/a"}h, qualite ${parsedInput.sleepQuality ?? "n/a"}/5
- Tags: ${(parsedInput.tags ?? []).join(", ") || "n/a"}
- Notes: ${parsedInput.notes ?? ""}

Reponds uniquement par le texte de l'observation.`;

    try {
      const { text } = await generateText({
        model: openai(model),
        prompt,
        maxTokens: 120,
        temperature: 0.4,
      });

      const message = text.trim();
      if (!message) {
        return { message: fallback, source: "heuristic" as const };
      }

      return { message, source: "ai" as const };
    } catch {
      return { message: fallback, source: "heuristic" as const };
    }
  });
