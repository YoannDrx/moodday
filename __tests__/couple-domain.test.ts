import {
  addDays,
  avoidHintsForNeeds,
  checkInNotification,
  civilDateInTimeZone,
  completedCycleLengths,
  computeCycle,
  daysBetween,
  describePmsWindow,
  gestureNotification,
  isWithinQuietHours,
  labelForNeed,
  learnPmsWindow,
  minutesUntilQuietHoursEnd,
  nextAllyLesson,
  projectDuoEntitlement,
  projectPartnerView,
  suggestGestures,
  type CheckInPoint,
  type PeriodInput,
} from "@moodday/domain";
import { describe, expect, it } from "vitest";

const periodsEvery = (start: string, length: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    startDate: addDays(start, index * length),
    endDate: addDays(start, index * length + 4),
  })) satisfies PeriodInput[];

describe("civil date arithmetic", () => {
  it("never shifts a day across the Paris DST change", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("reads the civil date in the user's time zone", () => {
    const lateEvening = new Date("2026-10-30T23:30:00Z");
    expect(civilDateInTimeZone(lateEvening, "Europe/Paris")).toBe("2026-10-31");
    expect(civilDateInTimeZone(lateEvening, "America/New_York")).toBe(
      "2026-10-30",
    );
  });
});

describe("cycle engine", () => {
  it("knows nothing before the first declared period", () => {
    const snapshot = computeCycle({ today: "2026-10-30", periods: [] });
    expect(snapshot.phase).toBe("unknown");
    expect(snapshot.confidence).toBe("none");
    expect(snapshot.nextPeriodStart).toBeNull();
  });

  it("uses the typical length while only one period is known", () => {
    const snapshot = computeCycle({
      today: "2026-10-20",
      periods: [{ startDate: "2026-10-01", endDate: "2026-10-05" }],
      typicalCycleLength: 30,
    });
    expect(snapshot.cycleDay).toBe(20);
    expect(snapshot.nextPeriodStart).toBe("2026-10-31");
    expect(snapshot.daysUntilNextPeriod).toBe(11);
    expect(snapshot.phase).toBe("between");
    expect(snapshot.confidence).toBe("low");
  });

  it("averages the last cycles and becomes confident when regular", () => {
    const periods = periodsEvery("2026-03-01", 29, 6);
    const lastStart = periods.at(-1)?.startDate ?? "2026-03-01";
    const snapshot = computeCycle({
      today: addDays(lastStart, 24),
      periods,
    });
    expect(snapshot.averageCycleLength).toBe(29);
    expect(snapshot.averagePeriodLength).toBe(5);
    expect(snapshot.confidence).toBe("high");
    expect(snapshot.daysUntilNextPeriod).toBe(5);
    expect(snapshot.inPmsWindow).toBe(true);
    expect(snapshot.phase).toBe("before");
  });

  it("reports an ongoing period and a late period", () => {
    const open = computeCycle({
      today: "2026-10-03",
      periods: [{ startDate: "2026-10-01", endDate: null }],
    });
    expect(open.phase).toBe("period");
    expect(open.periodOngoing).toBe(true);

    const late = computeCycle({
      today: "2026-11-05",
      periods: [{ startDate: "2026-10-01", endDate: "2026-10-05" }],
    });
    expect(late.phase).toBe("late");
  });

  it("ignores implausible gaps when averaging", () => {
    expect(
      completedCycleLengths([
        { startDate: "2026-01-01", endDate: null },
        { startDate: "2026-01-29", endDate: null },
        { startDate: "2026-05-01", endDate: null },
      ]),
    ).toEqual([28]);
  });

  it("ignores periods declared in the future", () => {
    const snapshot = computeCycle({
      today: "2026-10-10",
      periods: [
        { startDate: "2026-10-01", endDate: "2026-10-04" },
        { startDate: "2026-12-01", endDate: null },
      ],
    });
    expect(snapshot.lastPeriodStart).toBe("2026-10-01");
  });
});

describe("personal premenstrual window", () => {
  const periods = periodsEvery("2026-06-01", 28, 4);
  const difficultBefore = (days: number): CheckInPoint[] =>
    periods.slice(1).flatMap((period) =>
      Array.from({ length: 10 }, (_, index) => {
        const offset = index + 1;
        return {
          localDate: addDays(period.startDate, -offset),
          state: offset <= days ? ("fragile" as const) : ("ok" as const),
        };
      }),
    );

  it("stays on the default window without two observed cycles", () => {
    expect(learnPmsWindow(periods.slice(0, 2), difficultBefore(5))).toEqual({
      daysBefore: 7,
      source: "default",
      cyclesAnalysed: 1,
    });
  });

  it("learns the window from her own check-ins", () => {
    const window = learnPmsWindow(periods, difficultBefore(5));
    expect(window).toEqual({
      daysBefore: 5,
      source: "personal",
      cyclesAnalysed: 3,
    });
    expect(describePmsWindow(window)).toContain("J-5");
  });

  it("does not invent a window when nothing stands out", () => {
    expect(learnPmsWindow(periods, difficultBefore(0)).source).toBe("default");
    expect(describePmsWindow(learnPmsWindow(periods, []))).toBeNull();
  });
});

describe("catalogue and gestures", () => {
  it("suggests gestures from needs first, then from the state", () => {
    const suggestions = suggestGestures(["dinner", "hot_water_bottle"], "hard");
    expect(suggestions.map((gesture) => gesture.key)).toEqual([
      "dinner",
      "hot_water_bottle",
      "here",
    ]);
    expect(suggestGestures([], "ok").map((gesture) => gesture.key)).toEqual([
      "thinking_of_you",
      "outing",
      "dinner",
    ]);
  });

  it("resolves custom needs and derives what to avoid", () => {
    expect(
      labelForNeed("custom:abc", [{ id: "abc", label: "Un bain chaud" }]),
    ).toBe("Un bain chaud");
    expect(labelForNeed("unknown")).toBeNull();
    expect(avoidHintsForNeeds(["no_heavy_topics", "listen"])).toHaveLength(2);
  });
});

describe("partner projection", () => {
  const cycle = computeCycle({
    today: "2026-10-26",
    periods: [{ startDate: "2026-10-01", endDate: "2026-10-05" }],
  });
  const base = {
    shareSymptoms: false,
    pausedUntil: null,
    now: new Date("2026-10-26T12:00:00Z"),
    ownerName: "Léa",
    cycle,
    checkIn: {
      id: "c1",
      state: "fragile" as const,
      symptoms: ["cramps"],
      needs: ["calm", "dinner"],
      updatedAt: new Date("2026-10-26T10:00:00Z"),
    },
  };

  it("hides the check-in entirely at the cycle-only level", () => {
    const view = projectPartnerView({ ...base, level: "cycle_only" });
    expect(view.status).toBe("active");
    if (view.status !== "active") return;
    expect(view.today).toBeNull();
    expect(view.checkedInPrivately).toBe(true);
  });

  it("shares the state without needs at the middle level", () => {
    const view = projectPartnerView({ ...base, level: "cycle_state" });
    if (view.status !== "active") throw new Error("expected active");
    expect(view.today?.stateLabel).toBe("Fragile");
    expect(view.today?.needs).toEqual([]);
    expect(view.today?.avoid).toEqual([]);
  });

  it("shares needs, never symptoms unless allowed, never the note", () => {
    const view = projectPartnerView({ ...base, level: "cycle_state_needs" });
    if (view.status !== "active") throw new Error("expected active");
    expect(view.today?.needs.map((need) => need.key)).toEqual([
      "calm",
      "dinner",
    ]);
    expect(view.today?.symptoms).toEqual([]);
    expect(JSON.stringify(view)).not.toContain("privateNote");

    const withSymptoms = projectPartnerView({
      ...base,
      level: "cycle_state_needs",
      shareSymptoms: true,
    });
    if (withSymptoms.status !== "active") throw new Error("expected active");
    expect(withSymptoms.today?.symptoms).toEqual(["Crampes"]);
  });

  it("reveals nothing while sharing is paused", () => {
    const view = projectPartnerView({
      ...base,
      level: "cycle_state_needs",
      pausedUntil: new Date("2026-10-27T12:00:00Z"),
    });
    expect(view).toEqual({
      status: "paused",
      ownerName: "Léa",
      pausedUntil: "2026-10-27T12:00:00.000Z",
    });
  });
});

describe("notification rules", () => {
  it("respects quiet hours across midnight", () => {
    expect(isWithinQuietHours("23:15")).toBe(true);
    expect(isWithinQuietHours("07:59")).toBe(true);
    expect(isWithinQuietHours("08:00")).toBe(false);
    expect(minutesUntilQuietHoursEnd("23:00")).toBe(9 * 60);
    expect(minutesUntilQuietHoursEnd("12:00")).toBe(0);
  });

  it("keeps lock-screen text generic by default", () => {
    const generic = checkInNotification({
      ownerName: "Léa",
      state: "hard",
      firstNeedLabel: "Du calme",
      detailed: false,
    });
    expect(generic.body).toBe("Léa a partagé son point du jour.");
    expect(generic.title).not.toContain("difficile");

    const detailed = checkInNotification({
      ownerName: "Léa",
      state: "hard",
      firstNeedLabel: "Du calme",
      detailed: true,
    });
    expect(detailed.title).toBe("Léa : difficile");
    expect(
      gestureNotification({
        senderName: "Tom",
        gestureLabel: "X",
        detailed: false,
      }).body,
    ).toBe("Tom t'a envoyé un geste.");
  });
});

describe("ally programme and entitlement", () => {
  it("returns the first lesson not yet completed", () => {
    expect(nextAllyLesson([])?.day).toBe(1);
    expect(nextAllyLesson(["jour-1-le-spm-sans-cliches"])?.day).toBe(2);
  });

  it("projects the Duo entitlement from subscription sources", () => {
    const now = new Date("2026-10-30T00:00:00Z");
    expect(projectDuoEntitlement([], now).active).toBe(false);
    const active = projectDuoEntitlement(
      [
        {
          provider: "stripe",
          status: "active",
          currentPeriodEndsAt: new Date("2026-11-30T00:00:00Z"),
        },
      ],
      now,
    );
    expect(active).toMatchObject({
      entitlement: "duo",
      active: true,
      manageWith: "stripe",
    });
  });
});
