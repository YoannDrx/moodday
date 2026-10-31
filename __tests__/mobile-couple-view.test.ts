import { describe, expect, it } from "vitest";
import {
  allyProgress,
  cycleLine,
  formatInviteCode,
  isCompleteInviteCode,
  normalizeInviteInput,
  partnerPreview,
  sharingPreview,
  toggleWithLimit,
} from "../apps/mobile/src/lib/couple-view";

describe("native couple presentation", () => {
  it("previews what her partner will see, from her sharing level", () => {
    const base = {
      partnerName: "Tom",
      paused: false,
      state: "fragile" as const,
      needs: ["hug", "dinner"],
    };
    expect(partnerPreview({ ...base, level: "cycle_state_needs" })).toBe(
      "Tom verra : « fragile » et « un câlin », « qu'on gère le dîner ».",
    );
    expect(partnerPreview({ ...base, level: "cycle_state" })).toBe(
      "Tom verra : « fragile ». Tes besoins restent pour toi.",
    );
    expect(partnerPreview({ ...base, level: "cycle_only" })).toBe(
      "Avec ton niveau de partage, Tom voit seulement ton cycle.",
    );
    expect(
      partnerPreview({ ...base, level: "cycle_state_needs", paused: true }),
    ).toMatch(/pause/u);
    expect(
      partnerPreview({ ...base, partnerName: null, level: null }),
    ).toBeNull();
  });

  it("never lists the private note in the sharing preview", () => {
    for (const level of [
      "cycle_only",
      "cycle_state",
      "cycle_state_needs",
    ] as const) {
      expect(sharingPreview(level, true).join(" ")).not.toMatch(/note/iu);
    }
    expect(sharingPreview("cycle_only", true)).not.toContain("Tes symptômes");
    expect(sharingPreview("cycle_state", true)).toContain("Tes symptômes");
  });

  it("caps needs at two without reordering earlier choices", () => {
    expect(toggleWithLimit(["hug", "calm"], "space", 2)).toEqual([
      "hug",
      "calm",
    ]);
    expect(toggleWithLimit(["hug", "calm"], "hug", 2)).toEqual(["calm"]);
    expect(toggleWithLimit(["hug"], "calm", 2)).toEqual(["hug", "calm"]);
  });

  it("normalises invite codes the way the server parses them", () => {
    expect(normalizeInviteInput("abcd efgh")).toBe("ABCD-EFGH");
    expect(normalizeInviteInput("ab")).toBe("AB");
    expect(isCompleteInviteCode("ABCD-EFGH")).toBe(true);
    expect(isCompleteInviteCode("ABCDEFGH")).toBe(true);
    expect(isCompleteInviteCode("ABCD-EFG")).toBe(false);
    expect(formatInviteCode("abcdefgh")).toBe("ABCD-EFGH");
  });

  it("previews her own custom needs by label", () => {
    expect(
      partnerPreview({
        partnerName: "Tom",
        level: "cycle_state_needs",
        paused: false,
        state: "hard",
        needs: ["custom:n1"],
        customNeeds: [{ id: "n1", label: "Un bain chaud" }],
      }),
    ).toBe("Tom verra : « difficile » et « un bain chaud ».");
  });

  it("describes her cycle day without inventing a date", () => {
    expect(
      cycleLine({
        cycleDay: null,
        daysUntilNextPeriod: null,
        periodOngoing: false,
        phase: "unknown",
      }),
    ).toMatch(/Note tes prochaines règles/u);
    expect(
      cycleLine({
        cycleDay: 24,
        daysUntilNextPeriod: 1,
        periodOngoing: false,
        phase: "before",
      }),
    ).toBe("Jour 24 · règles prévues dans ~1 jour");
  });

  it("derives Ally progress from the next lesson and the completed count", () => {
    const progress = allyProgress({
      completedLessons: 2,
      nextLesson: {
        slug: "jour-3-les-phrases-qui-blessent",
        day: 3,
        title: "",
      },
    });
    expect(progress.done).toBe(2);
    expect(progress.isCompleted("jour-1-le-spm-sans-cliches")).toBe(true);
    expect(progress.isCompleted("jour-3-les-phrases-qui-blessent")).toBe(false);
    expect(allyProgress({ completedLessons: 7, nextLesson: null }).done).toBe(
      7,
    );
  });
});
