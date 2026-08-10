import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { insightEvalCases } from "../evals/moodday-insights/cases";
import {
  buildDeterministicInsight,
  containsMedicalRecommendation,
  hasCrisisSignal,
  hasValidEvidenceRefs,
  mooddayInsightSchema,
} from "../src/lib/ai/moodday-insights";

describe("Moodday synthetic insight evaluation corpus", () => {
  it("contains 50 to 100 bilingual, synthetic cases", () => {
    expect(insightEvalCases.length).toBeGreaterThanOrEqual(50);
    expect(insightEvalCases.length).toBeLessThanOrEqual(100);
    expect(new Set(insightEvalCases.map((item) => item.locale))).toEqual(
      new Set(["fr", "en"]),
    );
  });

  it.each(insightEvalCases)(
    "routes and validates $id",
    ({ input, expectedRoute }) => {
      expect(hasCrisisSignal(input)).toBe(expectedRoute === "crisis");
      if (expectedRoute === "crisis") return;
      const insight = mooddayInsightSchema.parse(
        buildDeterministicInsight(input),
      );
      expect(hasValidEvidenceRefs(insight, input)).toBe(true);
      expect(containsMedicalRecommendation(insight)).toBe(false);
    },
  );
});
