import type { MedicationDto } from "@moodday/contracts";
import {
  defaultLocalReminderPreferences,
  planLocalNotifications,
} from "../apps/mobile/src/lib/notification-planner";
import { describe, expect, it } from "vitest";

const timestamp = "2026-08-23T08:00:00.000Z";
const medication = (overrides: Partial<MedicationDto> = {}): MedicationDto => ({
  id: "medication-1",
  name: "Traitement privé",
  dosage: "100 mg",
  frequency: "daily",
  isPrn: false,
  isArchived: false,
  scheduleTimes: ["09:00"],
  weeklyDay: null,
  startDate: null,
  endDate: null,
  stockQuantity: null,
  unitsPerDose: null,
  lowStockThreshold: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});

describe("mobile local notification planner", () => {
  it("plans no notification before the user explicitly enables reminders", () => {
    expect(
      planLocalNotifications({
        medications: [medication()],
        now: new Date(2026, 7, 23, 8, 0),
        preferences: defaultLocalReminderPreferences,
      }),
    ).toEqual([]);
  });

  it("deduplicates treatment times and never embeds treatment data", () => {
    const planned = planLocalNotifications({
      medications: [
        medication(),
        medication({ id: "medication-2", name: "Autre traitement" }),
      ],
      now: new Date(2026, 7, 23, 8, 0),
      medicationHorizonDays: 1,
      preferences: {
        ...defaultLocalReminderPreferences,
        enabled: true,
      },
    });

    expect(planned.filter((item) => item.kind === "medication")).toHaveLength(
      2,
    );
    expect(JSON.stringify(planned)).not.toContain("Traitement privé");
    expect(JSON.stringify(planned)).not.toContain("Autre traitement");
    expect(planned.find((item) => item.kind === "daily_check_in")?.route).toBe(
      "/",
    );
  });

  it("respects treatment dates, PRN exclusions and weekly scheduling", () => {
    const sunday = new Date(2026, 7, 23, 8, 0);
    const planned = planLocalNotifications({
      medications: [
        medication({
          id: "weekly",
          frequency: "weekly",
          weeklyDay: 1,
          scheduleTimes: ["10:00"],
        }),
        medication({ id: "prn", isPrn: true, frequency: "prn" }),
        medication({ id: "ended", endDate: "2026-08-22" }),
      ],
      now: sunday,
      medicationHorizonDays: 2,
      preferences: {
        ...defaultLocalReminderPreferences,
        enabled: true,
        dailyCheckIn: false,
      },
    });

    expect(planned).toHaveLength(1);
    expect(planned[0]?.date?.getDay()).toBe(1);
    expect(planned[0]?.identifier).toContain("2026-08-24T10-00");
  });

  it("caps the finite medication queue to protect the iOS pending limit", () => {
    const planned = planLocalNotifications({
      medications: [medication()],
      now: new Date(2026, 7, 23, 8, 0),
      medicationHorizonDays: 90,
      maximumMedicationNotifications: 10,
      preferences: {
        ...defaultLocalReminderPreferences,
        enabled: true,
        dailyCheckIn: false,
      },
    });

    expect(planned).toHaveLength(10);
  });
});
