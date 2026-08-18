import { buildConsultationCsv } from "@/features/export/csv-export";
import type { ConsultationExportData } from "@/features/export/export-types";
import { describe, expect, it } from "vitest";

const data: ConsultationExportData = {
  metadata: {
    generatedAt: "2026-07-16T12:00:00.000Z",
    timezone: "Europe/Paris",
    source: "Moodday",
    formatVersion: "2.0",
  },
  period: {
    startDate: "2026-07-16",
    endDate: "2026-07-16",
    start: "2026-07-15T22:00:00.000Z",
    endExclusive: "2026-07-16T22:00:00.000Z",
  },
  userName: "Zoé",
  mood: {
    entries: [
      {
        value: 6,
        energy: 4,
        anxiety: 3,
        sleepHours: 7.5,
        sleepQuality: "good",
        note: 'Calme, mais "fatiguée"\nAprès-midi',
        date: "2026-07-16T08:30:00.000Z",
      },
    ],
    stats: { average: 6, min: 6, max: 6, count: 1, change: null },
  },
  medications: {
    list: [
      {
        name: "Traitement test",
        dosage: "10 mg",
        frequency: "daily",
        isPRN: false,
        intakesCount: 1,
        intakes: [
          {
            date: "2026-07-16T06:00:00.000Z",
            scheduledForDate: "2026-07-16",
            skipped: false,
            note: null,
          },
        ],
        dosageChanges: [],
      },
    ],
    adherencePercent: 100,
    expectedDoses: 1,
    takenDoses: 1,
  },
  therapy: { sessions: [], count: 0 },
  exercises: {
    logs: [
      {
        name: "Respiration",
        date: "2026-07-16T09:00:00.000Z",
        note: "Terminé",
      },
    ],
    count: 1,
  },
};

describe("consultation CSV export", () => {
  it("keeps every record, source and time zone in an Excel-friendly CSV", () => {
    const csv = buildConsultationCsv(data);

    expect(csv.startsWith("\uFEFFrecord_type,")).toBe(true);
    expect(csv).toContain(
      'mood,2026-07-16T08:30:00.000Z,2026-07-16 10:30,daily_check_in,6,4,recorded,"Calme, mais ""fatiguée""\nAprès-midi",Europe/Paris,Moodday',
    );
    expect(csv).toContain("medication_intake");
    expect(csv).toContain("exercise");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(4);
  });

  it("serializes therapy rows and blank nullable cells without the string null", () => {
    const csv = buildConsultationCsv({
      ...data,
      mood: { entries: [], stats: data.mood.stats },
      medications: { ...data.medications, list: [] },
      therapy: {
        sessions: [
          {
            date: "2026-07-16T10:00:00.000Z",
            notes: "Simple note",
            benefitRating: null,
          },
        ],
        count: 1,
      },
      exercises: {
        logs: [
          {
            name: "Marche",
            date: "2026-07-16T11:00:00.000Z",
            note: null,
          },
        ],
        count: 1,
      },
    });

    expect(csv).toContain("therapy_session");
    expect(csv).toContain("exercise");
    expect(csv).not.toContain(",null,");
  });
});
