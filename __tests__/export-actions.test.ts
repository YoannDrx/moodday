import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  calculateMedicationAdherence: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/features/medication/adherence", () => ({
  calculateMedicationAdherence: mocks.calculateMedicationAdherence,
}));

import {
  getExportData,
  getExportPreview,
} from "@/features/export/export.action";

const user = {
  id: "export-user",
  email: "export@moodday.invalid",
  name: "Synthetic Patient",
};
const date = new Date("2026-08-10T10:00:00.000Z");
type ActionHandler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(
  handler: unknown,
  args: Parameters<ActionHandler<T>>[0],
) => (handler as ActionHandler<T>)(args);

beforeEach(() => {
  vi.clearAllMocks();
  actionClient.inputSchema.mockReturnValue(actionClient);
  actionClient.action.mockImplementation((handler) => handler);
  vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
    timezone: "Europe/Paris",
  } as never);
  mocks.calculateMedicationAdherence.mockReturnValue({
    percent: 50,
    expectedDoses: 2,
    takenDoses: 1,
  });
});

describe("export actions", () => {
  it("builds the versioned consultation data contract from one bounded range", async () => {
    vi.mocked(prisma.consultationPreparation.findFirst).mockResolvedValue({
      id: "preparation-1",
      userId: user.id,
      title: "Consultation",
      scheduledFor: date,
      questions: ["Synthetic question"],
      importantEvents: ["Synthetic event"],
      personalNotes: "Synthetic note",
      periodStartDate: "2026-08-01",
      periodEndDate: "2026-08-10",
      status: "draft",
    } as never);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      {
        value: 0,
        energy: 4,
        anxiety: 2,
        sleepHours: 7,
        sleepQuality: "good",
        note: "Synthetic mood note",
        createdAt: date,
      },
      {
        value: 6,
        energy: 6,
        anxiety: 1,
        sleepHours: 8,
        sleepQuality: "good",
        note: null,
        createdAt: new Date("2026-08-10T18:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.medication.findMany).mockResolvedValue([
      {
        id: "medication-1",
        name: "Synthetic",
        dosage: "fixture",
        frequency: "daily",
        isPRN: false,
        isArchived: false,
        intakes: [
          {
            takenAt: date,
            scheduledForDate: "2026-08-10",
            skipped: false,
            note: null,
          },
        ],
        history: [
          {
            changedAt: date,
            previousDosage: "old",
            dosage: "fixture",
          },
        ],
        scheduleRevisions: [],
      },
    ] as never);
    vi.mocked(prisma.therapySession.findMany).mockResolvedValue([
      { date, notes: "Synthetic therapy note", benefitRating: 4 },
    ] as never);
    vi.mocked(prisma.exerciseLog.findMany).mockResolvedValue([
      {
        completedAt: date,
        note: "Synthetic exercise note",
        exercise: { name: "Respiration" },
      },
    ] as never);

    const result = await invoke<{
      metadata: { formatVersion: string };
      mood: { entries: { value: number }[]; stats: { average: number } };
      medications: { adherencePercent: number | null };
      preparation: { id: string } | null;
    }>(getExportData, {
      parsedInput: {
        startDate: "2026-08-01",
        endDate: "2026-08-10",
        purpose: "csv",
        preparationId: "preparation-1",
      },
      ctx: { user },
    });
    expect(result).toMatchObject({
      metadata: { formatVersion: "2.0" },
      mood: { entries: [{ value: 0 }, { value: 6 }], stats: { average: 3 } },
      medications: { adherencePercent: 50 },
      preparation: { id: "preparation-1" },
    });
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: user.id }),
    );
  });

  it("returns content-free preview counts", async () => {
    vi.mocked(prisma.moodEntry.count).mockResolvedValue(2);
    vi.mocked(prisma.medIntake.count).mockResolvedValue(3);
    vi.mocked(prisma.therapySession.count).mockResolvedValue(1);
    vi.mocked(prisma.exerciseLog.count).mockResolvedValue(4);
    await expect(
      invoke(getExportPreview, {
        parsedInput: { startDate: "2026-08-01", endDate: "2026-08-10" },
        ctx: { user },
      }),
    ).resolves.toEqual({
      moodEntries: 2,
      medicationIntakes: 3,
      therapySessions: 1,
      exerciseLogs: 4,
      total: 10,
    });
  });

  it("requires an effective Plus subscription for preview and consultation reports", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    await expect(
      invoke(getExportData, {
        parsedInput: {
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          purpose: "preview",
        },
        ctx: { user },
      }),
    ).rejects.toThrow("require Moodday Plus");
    expect(prisma.moodEntry.findMany).not.toHaveBeenCalled();
  });

  it("rejects a missing or period-mismatched consultation preparation", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      plan: "plus",
      status: "active",
      periodEnd: new Date("2027-01-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
    } as never);
    vi.mocked(prisma.consultationPreparation.findFirst).mockResolvedValueOnce(
      null,
    );
    await expect(
      invoke(getExportData, {
        parsedInput: {
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          purpose: "consultation-report",
          preparationId: "missing",
        },
        ctx: { user },
      }),
    ).rejects.toThrow("Consultation preparation not found");

    vi.mocked(prisma.consultationPreparation.findFirst).mockResolvedValueOnce({
      id: "preparation-1",
      periodStartDate: "2026-07-01",
      periodEndDate: "2026-07-31",
    } as never);
    await expect(
      invoke(getExportData, {
        parsedInput: {
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          purpose: "consultation-report",
          preparationId: "preparation-1",
        },
        ctx: { user },
      }),
    ).rejects.toThrow("period mismatch");
  });

  it("returns explicit empty-state statistics and excludes archived treatments", async () => {
    const anonymousUser = { ...user, name: "" };
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      plan: "plus",
      status: "trialing",
      periodEnd: null,
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
    } as never);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.medication.findMany).mockResolvedValue([
      {
        id: "archived",
        name: "Archived treatment",
        dosage: "10 mg",
        frequency: "daily",
        isPRN: false,
        isArchived: true,
        intakes: [],
        history: [],
        scheduleRevisions: [],
      },
    ] as never);
    vi.mocked(prisma.therapySession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.exerciseLog.findMany).mockResolvedValue([]);
    mocks.calculateMedicationAdherence.mockReturnValue({
      percent: null,
      expectedDoses: 0,
      takenDoses: 0,
    });

    const result = await invoke<{
      userName: string;
      preparation: null;
      mood: {
        stats: {
          average: null;
          min: null;
          max: null;
          change: null;
          count: number;
        };
      };
      medications: { list: unknown[]; adherencePercent: null };
    }>(getExportData, {
      parsedInput: {
        startDate: "2026-08-01",
        endDate: "2026-08-10",
        purpose: "consultation-report",
      },
      ctx: { user: anonymousUser },
    });

    expect(result).toMatchObject({
      userName: "Patient",
      preparation: null,
      mood: {
        stats: {
          average: null,
          min: null,
          max: null,
          change: null,
          count: 0,
        },
      },
      medications: { list: [], adherencePercent: null },
    });
  });

  it("preserves one-entry statistics, skipped intakes and nullable preparation dates", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      plan: "plus",
      status: "active",
      periodEnd: null,
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
    } as never);
    vi.mocked(prisma.consultationPreparation.findFirst).mockResolvedValue({
      id: "preparation-null-date",
      userId: user.id,
      title: "Without date",
      scheduledFor: null,
      questions: [],
      importantEvents: [],
      personalNotes: null,
      periodStartDate: "2026-08-01",
      periodEndDate: "2026-08-10",
      status: "completed",
    } as never);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      {
        value: 0,
        energy: null,
        anxiety: null,
        sleepHours: null,
        sleepQuality: null,
        note: null,
        createdAt: date,
      },
    ] as never);
    vi.mocked(prisma.medication.findMany).mockResolvedValue([
      {
        id: "medication-1",
        name: "Synthetic",
        dosage: "fixture",
        frequency: "prn",
        isPRN: true,
        isArchived: false,
        intakes: [
          {
            takenAt: date,
            scheduledForDate: null,
            skipped: true,
            note: "not taken",
          },
        ],
        history: [],
        scheduleRevisions: [],
      },
    ] as never);
    vi.mocked(prisma.therapySession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.exerciseLog.findMany).mockResolvedValue([]);

    const result = await invoke<{
      mood: { stats: { average: number; change: null } };
      preparation: { scheduledFor: null };
      medications: {
        list: { intakesCount: number; intakes: { skipped: boolean }[] }[];
      };
    }>(getExportData, {
      parsedInput: {
        startDate: "2026-08-01",
        endDate: "2026-08-10",
        purpose: "consultation-report",
        preparationId: "preparation-null-date",
      },
      ctx: { user },
    });

    expect(result.mood.stats).toEqual(
      expect.objectContaining({ average: 0, change: null }),
    );
    expect(result.preparation.scheduledFor).toBeNull();
    expect(result.medications.list[0]).toMatchObject({
      intakesCount: 0,
      intakes: [{ skipped: true }],
    });
  });
});
