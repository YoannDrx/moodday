import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildDeterministicInsight,
  containsMedicalRecommendation,
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
});
