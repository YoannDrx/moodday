import { describe, expect, it } from "vitest";
import {
  contextTagColors,
  contextTagLabels,
  contextTags,
  crisisResources,
  energyObservedLabels,
  energyObservedOptions,
  eventOptionLabels,
  eventOptions,
  eventTypeColors,
  eventTypeLabels,
  eventTypes,
  getMoodColor,
  getMoodEmoji,
  moodColors,
  moodEmojis,
  moodObservedColors,
  moodObservedLabels,
  moodObservedOptions,
  sideEffectColors,
  sideEffectLabels,
  sideEffects,
  sleepDisturbanceLabels,
  sleepDisturbances,
  sleepObservedLabels,
  sleepObservedOptions,
  sleepQualityColors,
  sleepQualityEmojis,
  sleepQualityLabels,
  sleepQualityOptions,
  socialBehaviorLabels,
  socialBehaviorOptions,
  symptomLabels,
  symptomOptions,
} from "@/lib/design-tokens";

const expectCompleteMap = <T extends readonly string[]>(
  options: T,
  map: Record<string, unknown>,
) => {
  expect(Object.keys(map).sort((a, b) => a.localeCompare(b))).toEqual(
    [...options].sort((a, b) => a.localeCompare(b)),
  );
  expect(Object.values(map).every(Boolean)).toBe(true);
};

describe("Moodday design token integrity", () => {
  it("keeps every product option mapped to a label and optional color", () => {
    expectCompleteMap(symptomOptions, symptomLabels);
    expectCompleteMap(eventOptions, eventOptionLabels);
    expectCompleteMap(sleepDisturbances, sleepDisturbanceLabels);
    expectCompleteMap(contextTags, contextTagLabels);
    expectCompleteMap(contextTags, contextTagColors);
    expectCompleteMap(sideEffects, sideEffectLabels);
    expectCompleteMap(sideEffects, sideEffectColors);
    expectCompleteMap(sleepQualityOptions, sleepQualityLabels);
    expectCompleteMap(sleepQualityOptions, sleepQualityColors);
    expectCompleteMap(sleepQualityOptions, sleepQualityEmojis);
    expectCompleteMap(moodObservedOptions, moodObservedLabels);
    expectCompleteMap(moodObservedOptions, moodObservedColors);
    expectCompleteMap(energyObservedOptions, energyObservedLabels);
    expectCompleteMap(socialBehaviorOptions, socialBehaviorLabels);
    expectCompleteMap(sleepObservedOptions, sleepObservedLabels);
    expectCompleteMap(eventTypes, eventTypeLabels);
    expectCompleteMap(eventTypes, eventTypeColors);
  });

  it("provides a color and emoji for the complete 0–10 mood scale", () => {
    expect(Object.keys(moodColors)).toHaveLength(11);
    expect(Object.keys(moodEmojis)).toHaveLength(11);

    for (let value = 0; value <= 10; value += 1) {
      expect(getMoodColor(value)).toMatch(/^#[0-9a-f]{6}$/i);
      expect(getMoodEmoji(value)).not.toBe("");
    }
  });

  it("rounds and clamps out-of-range mood values", () => {
    expect(getMoodColor(-100)).toBe(moodColors[0]);
    expect(getMoodEmoji(-0.5)).toBe(moodEmojis[0]);
    expect(getMoodColor(4.6)).toBe(moodColors[5]);
    expect(getMoodEmoji(10.8)).toBe(moodEmojis[10]);
  });

  it("keeps the mandatory French crisis resources present", () => {
    const phones = crisisResources.map((resource) => resource.phone);
    expect(phones).toContain("3114");
    expect(phones).toContain("15");
    expect(
      crisisResources.find((resource) => resource.phone === "3114"),
    ).toEqual(
      expect.objectContaining({
        url: "https://3114.fr",
        category: "hotline",
      }),
    );
  });
});
