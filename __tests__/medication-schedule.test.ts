import {
  buildMedicationDoseSlots,
  createMedicationReminderKey,
  createScheduledDoseKey,
  getDateKeyForTimeZone,
  hasOfflineDoseConflict,
  normalizeScheduleTimesForFrequency,
} from "@/features/medication/schedule";
import { describe, expect, it } from "vitest";

describe("medication schedule", () => {
  it("builds one pending dose for a daily medication", () => {
    const slots = buildMedicationDoseSlots(
      {
        id: "med_1",
        frequency: "daily",
        createdAt: new Date(2026, 4, 16),
        intakes: [],
      },
      "2026-05-16",
    );

    expect(slots).toEqual([
      expect.objectContaining({
        doseIndex: 0,
        labelKey: "medication.doseSlot.once",
        scheduledForDate: "2026-05-16",
        scheduledTime: "09:00",
        status: "pending",
      }),
    ]);
  });

  it("normalizes schedule times for each frequency", () => {
    expect(normalizeScheduleTimesForFrequency("daily", ["08:30"])).toEqual([
      "08:30",
    ]);
    expect(
      normalizeScheduleTimesForFrequency("twice_daily", ["07:00"]),
    ).toEqual(["07:00", "20:00"]);
    expect(
      normalizeScheduleTimesForFrequency("twice_daily", ["bad", "21:00"]),
    ).toEqual(["21:00", "20:00"]);
    expect(normalizeScheduleTimesForFrequency("prn", ["09:00"])).toEqual([]);
  });

  it("maps legacy intake rows without a dose index to the first dose", () => {
    const slots = buildMedicationDoseSlots(
      {
        id: "med_1",
        frequency: "twice_daily",
        createdAt: new Date(2026, 4, 16),
        intakes: [
          {
            id: "intake_1",
            takenAt: new Date(2026, 4, 16, 9),
            skipped: false,
            scheduledForDate: null,
            doseIndex: null,
          },
        ],
      },
      "2026-05-16",
    );

    expect(slots).toHaveLength(2);
    expect(slots[0]?.status).toBe("taken");
    expect(slots[1]?.status).toBe("pending");
  });

  it("only schedules weekly medication on the configured weekday", () => {
    const medication = {
      id: "med_1",
      frequency: "weekly",
      createdAt: new Date(2026, 4, 16),
      weeklyDay: 0,
      scheduleTimes: ["18:30"],
      intakes: [],
    };

    expect(buildMedicationDoseSlots(medication, "2026-05-16")).toHaveLength(0);
    expect(buildMedicationDoseSlots(medication, "2026-05-17")).toEqual([
      expect.objectContaining({
        labelKey: "medication.doseSlot.weekly",
        scheduledTime: "18:30",
      }),
    ]);
  });

  it("creates timezone-aware date keys", () => {
    const instant = new Date("2026-05-16T23:30:00.000Z");

    expect(getDateKeyForTimeZone(instant, "Europe/Paris")).toBe("2026-05-17");
    expect(getDateKeyForTimeZone(instant, "America/New_York")).toBe(
      "2026-05-16",
    );
  });

  it("creates a stable scheduled dose key", () => {
    expect(createScheduledDoseKey("med_1", "2026-05-16", 1)).toBe(
      "med_1:2026-05-16:1",
    );
  });

  it("detects when an offline dose would overwrite a newer server state", () => {
    expect(hasOfflineDoseConflict("operation_1", "operation_1")).toBe(false);
    expect(hasOfflineDoseConflict("operation_2", "operation_1")).toBe(true);
    expect(hasOfflineDoseConflict(null, "operation_1")).toBe(true);
  });

  it("creates a stable medication reminder key", () => {
    expect(createMedicationReminderKey("med_1", "2026-05-16", 1, "20:00")).toBe(
      "2026-05-16:med_1:1:20:00",
    );
  });
});
