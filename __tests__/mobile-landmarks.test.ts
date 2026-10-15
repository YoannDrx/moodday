import type {
  CheckInDto,
  DoseEventDto,
  RoutineOccurrenceDto,
} from "@moodday/contracts";
import { describe, expect, it } from "vitest";
import { buildWeeklyLandmarks } from "../apps/mobile/src/lib/landmarks";

const checkIn = (
  id: string,
  localDate: string,
  fields: Partial<CheckInDto> = {},
): CheckInDto => ({
  id,
  operationId: `operation-${id}`,
  localDate,
  timezone: "Europe/Paris",
  depth: "quick",
  valence: 0,
  activation: 0,
  irritability: 0,
  anxiety: null,
  contexts: [],
  note: "private note",
  createdAt: `${localDate}T08:00:00.000Z`,
  updatedAt: `${localDate}T08:00:00.000Z`,
  ...fields,
});
const summarize = (checkIns: CheckInDto[] = [], fields = {}) =>
  buildWeeklyLandmarks({
    today: "2026-10-27",
    checkIns,
    doseEvents: [],
    routines: [],
    ...fields,
  });

describe("mobile weekly landmarks from observed data", () => {
  it("has an honest empty state and uses seven civil days across DST", () => {
    expect(summarize()).toMatchObject({
      from: "2026-10-21",
      to: "2026-10-27",
      days: 0,
      coverage: 0,
      timeline: [],
    });
  });
  it("excludes dates outside the window, deduplicates IDs, and counts days not entries", () => {
    const first = checkIn("first", "2026-10-21");
    expect(
      summarize([
        first,
        first,
        checkIn("second", "2026-10-21"),
        checkIn("old", "2026-10-20"),
        checkIn("future", "2026-10-28"),
      ]),
    ).toMatchObject({ days: 1, scoredDays: 1, coverage: 14, checkInCount: 2 });
  });
  it("accepts zero scores, but never treats presence or missing data as a score", () => {
    expect(
      summarize([
        checkIn("scored", "2026-10-27"),
        checkIn("presence", "2026-10-26", {
          depth: "presence",
          valence: null,
          activation: null,
          irritability: null,
        }),
        checkIn("partial", "2026-10-25", { activation: null }),
      ]),
    ).toMatchObject({ days: 3, scoredDays: 1, coverage: 14 });
  });
  it("sorts local dates and omits private notes from the summary", () => {
    const result = summarize([
      checkIn("old", "2026-10-21"),
      checkIn("recent", "2026-10-27"),
    ]);
    expect(result.timeline.map((entry) => entry.id)).toEqual(["recent", "old"]);
    expect(JSON.stringify(result)).not.toContain("private note");
    expect(result.timeline[0]).toHaveProperty("timezone", "Europe/Paris");
  });
  it("counts only effective taken/PRN doses and completed routines", () => {
    const dose = {
      id: "dose",
      localDate: "2026-10-27",
      kind: "taken",
      cancelledAt: null,
    } as DoseEventDto;
    const routine = {
      id: "routine",
      localDate: "2026-10-27",
      status: "completed",
    } as RoutineOccurrenceDto;
    expect(
      summarize([], {
        doseEvents: [
          dose,
          dose,
          { ...dose, id: "prn", kind: "prn" },
          { ...dose, id: "skipped", kind: "skipped" },
          { ...dose, id: "cancelled", cancelledAt: "2026-10-27T12:00:00Z" },
        ],
        routines: [
          routine,
          routine,
          { ...routine, id: "skipped", status: "skipped" },
        ],
      }),
    ).toMatchObject({ dosesTaken: 2, routinesCompleted: 1 });
  });
});
