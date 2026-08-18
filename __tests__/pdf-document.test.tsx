import { renderToBuffer } from "@react-pdf/renderer";
import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExportPDFDocument } from "@/features/export/pdf-document";
import type { ConsultationExportData } from "@/features/export/export-types";

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const renderPdf = async (document: Parameters<typeof renderToBuffer>[0]) => {
  let buffer: Buffer | undefined;
  await act(async () => {
    buffer = await renderToBuffer(document);
  });
  return buffer as Buffer;
};

const baseData: ConsultationExportData = {
  metadata: {
    generatedAt: "2026-08-13T14:00:00.000Z",
    timezone: "Europe/Paris",
    source: "Moodday",
    formatVersion: "2.0",
  },
  period: {
    startDate: "2026-08-01",
    endDate: "2026-08-13",
    start: "2026-07-31T22:00:00.000Z",
    endExclusive: "2026-08-13T22:00:00.000Z",
  },
  userName: "Camille",
  preparation: {
    id: "preparation-1",
    title: "Rendez-vous du mois",
    scheduledFor: "2026-08-20T08:30:00.000Z",
    questions: ["Comment expliquer cette période ?", "Que surveiller ?"],
    importantEvents: ["Reprise du travail"],
    personalNotes: "Penser à apporter les ordonnances.",
    status: "draft",
  },
  mood: {
    entries: Array.from({ length: 17 }, (_, index) => ({
      value: index === 0 ? 0 : (index % 10) + 1,
      energy: index === 1 ? null : index % 11,
      anxiety: index === 2 ? null : (10 - index) % 11,
      sleepHours: index === 3 ? null : 7.5,
      sleepQuality: index % 2 === 0 ? "good" : "average",
      note: index === 4 ? null : `Note quotidienne ${index}`,
      date: `2026-08-${String(index + 1).padStart(2, "0")}T08:00:00.000Z`,
    })),
    stats: {
      average: 5.2,
      min: 0,
      max: 10,
      count: 17,
      change: 1.2,
    },
  },
  medications: {
    list: [
      {
        name: "Traitement A",
        dosage: "10 mg",
        frequency: "daily",
        isPRN: false,
        intakesCount: 12,
        intakes: [],
        dosageChanges: [
          {
            date: "2026-08-05T08:00:00.000Z",
            from: null,
            to: "10 mg",
          },
        ],
      },
      {
        name: "Traitement B",
        dosage: "5 mg",
        frequency: "custom",
        isPRN: true,
        intakesCount: 1,
        intakes: [],
        dosageChanges: [],
      },
    ],
    adherencePercent: 92,
    expectedDoses: 13,
    takenDoses: 12,
  },
  therapy: {
    sessions: [
      {
        date: "2026-08-07T12:00:00.000Z",
        notes: "Une séance utile. ".repeat(20),
        benefitRating: 8,
      },
      {
        date: "2026-08-12T12:00:00.000Z",
        notes: "Travail sur les habitudes.",
        benefitRating: null,
      },
    ],
    count: 2,
  },
  exercises: {
    logs: [
      {
        name: "Respiration",
        date: "2026-08-10T16:00:00.000Z",
        note: null,
      },
    ],
    count: 1,
  },
};

describe("consultation PDF document", () => {
  it("renders a complete French report including zero mood and preparation", async () => {
    const buffer = await renderPdf(
      <ExportPDFDocument data={baseData} locale="fr" translate={t} />,
    );

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.byteLength).toBeGreaterThan(2_000);
  });

  it("renders the English empty-state report without optional sections", async () => {
    const emptyData: ConsultationExportData = {
      ...baseData,
      preparation: null,
      mood: {
        entries: [],
        stats: {
          average: null,
          min: null,
          max: null,
          count: 0,
          change: null,
        },
      },
      medications: {
        list: [],
        adherencePercent: null,
        expectedDoses: 0,
        takenDoses: 0,
      },
      therapy: { sessions: [], count: 0 },
      exercises: { logs: [], count: 0 },
    };

    const buffer = await renderPdf(
      <ExportPDFDocument data={emptyData} locale="en" translate={t} />,
    );

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.byteLength).toBeGreaterThan(1_000);
  });
});
