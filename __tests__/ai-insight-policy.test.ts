import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildDeterministicInsight,
  buildProviderInsightInput,
  containsMedicalRecommendation,
  getInsightDataFields,
  hasCrisisSignal,
  hasValidEvidenceRefs,
  mooddayInsightSchema,
} from "../src/lib/ai/moodday-insights";

describe("AI insight safety policy", () => {
  it.each([
    "Je veux en finir",
    "I might hurt myself",
    "pensées suicidaires",
    "self-harm tonight",
    "Je pense à me couper",
    "I would be better off dead",
  ])("routes a crisis phrase before generation: %s", (notes) => {
    expect(hasCrisisSignal({ date: "2026-08-07", mood: 2, notes })).toBe(true);
  });

  it("does not flag ordinary low-mood notes as a crisis", () => {
    expect(
      hasCrisisSignal({
        date: "2026-08-07",
        mood: 3,
        notes: "Journée fatigante et moral bas après une mauvaise nuit.",
      }),
    ).toBe(false);
  });

  it("builds a schema-valid, evidence-linked deterministic fallback", () => {
    const input = {
      date: "2026-08-07",
      mood: 5,
      anxiety: 7,
      sleepHours: 6,
    };
    const result = buildDeterministicInsight(input);
    expect(mooddayInsightSchema.safeParse(result).success).toBe(true);
    expect(
      result.observations.every((item) => item.evidenceRefs.length > 0),
    ).toBe(true);
    expect(result.cautions.join(" ")).toContain("diagnostic");
    expect(hasValidEvidenceRefs(result, input)).toBe(true);
    expect(containsMedicalRecommendation(result)).toBe(false);
  });

  it("rejects a reference absent from the supplied data", () => {
    const input = { date: "2026-08-07", mood: 5 };
    const result = buildDeterministicInsight(input);
    result.observations[0].evidenceRefs = [
      { date: "2026-08-06", metric: "sleepHours" },
    ];
    expect(hasValidEvidenceRefs(result, input)).toBe(false);
  });

  it("detects a direct diagnosis or treatment recommendation", () => {
    const result = buildDeterministicInsight({
      date: "2026-08-07",
      mood: 5,
    });
    result.summary = "Vous avez une dépression, augmentez votre dose.";
    expect(containsMedicalRecommendation(result)).toBe(true);
  });

  it.each([
    "Cela indique une dépression.",
    "This suggests a depressive disorder.",
    "Votre humeur est causée par ce traitement.",
    "Your anxiety is caused by this medication.",
    "Vous allez vous automutiler demain.",
    "You are going to hurt yourself tomorrow.",
    "Vous devriez augmenter le dosage du médicament.",
    "You should decrease the medication dose.",
  ])("rejects unsupported clinical output: %s", (summary) => {
    const result = buildDeterministicInsight({
      date: "2026-08-07",
      mood: 5,
    });
    result.summary = summary;
    expect(containsMedicalRecommendation(result)).toBe(true);
  });

  it("reports only the fields actually sent without exposing their content", () => {
    expect(
      getInsightDataFields(
        {
          date: "2026-08-07",
          mood: 5,
          energy: 0,
          tags: ["travail"],
          notes: "contenu privé",
        },
        false,
      ),
    ).toEqual(["mood", "energy", "tags"]);
    expect(
      getInsightDataFields(
        { date: "2026-08-07", mood: 5, notes: "contenu privé" },
        true,
      ),
    ).toEqual(["mood", "journalNotes"]);
  });

  it("minimizes provider input and excludes tags independently of callers", () => {
    const input = {
      date: "2026-08-07",
      mood: 5,
      energy: 4,
      tags: ["sensitive-context"],
      notes: "private note",
      locale: "en" as const,
    };
    expect(buildProviderInsightInput(input, false)).toEqual({
      date: "2026-08-07",
      mood: 5,
      energy: 4,
      anxiety: undefined,
      sleepHours: undefined,
      sleepQuality: undefined,
      locale: "en",
      notes: undefined,
    });
    expect(buildProviderInsightInput(input, true).notes).toBe("private note");
    expect(buildProviderInsightInput(input, true)).not.toHaveProperty("tags");
  });
});
