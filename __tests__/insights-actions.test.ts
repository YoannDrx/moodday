import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  getMedicationAdherenceForUser: vi.fn(),
  isAiInsightsAvailableForUser: vi.fn(),
  buildDeterministicInsight: vi.fn(),
  generateMooddayInsight: vi.fn(),
  getInsightDataFields: vi.fn(),
  hasCrisisSignal: vi.fn(),
  claimAiInsightUsage: vi.fn(),
  markAiUsageBlockedForCrisis: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));
vi.mock("@/i18n/server", () => ({
  getI18n: async () => ({
    t: (key: string) => key,
    locale: "fr",
  }),
}));
vi.mock("@/features/medication/adherence-service", () => ({
  getMedicationAdherenceForUser: mocks.getMedicationAdherenceForUser,
}));
vi.mock("@/lib/features/availability", () => ({
  isAiInsightsAvailableForUser: mocks.isAiInsightsAvailableForUser,
}));
vi.mock("@/lib/ai/moodday-insights", () => ({
  AI_PROMPT_VERSION: "prompt-test",
  buildDeterministicInsight: mocks.buildDeterministicInsight,
  generateMooddayInsight: mocks.generateMooddayInsight,
  getInsightDataFields: mocks.getInsightDataFields,
  hasCrisisSignal: mocks.hasCrisisSignal,
}));
vi.mock("@/features/insights/ai-usage-admission", () => ({
  claimAiInsightUsage: mocks.claimAiInsightUsage,
  markAiUsageBlockedForCrisis: mocks.markAiUsageBlockedForCrisis,
}));
vi.mock("@/lib/env", () => ({
  env: {
    AI_CONSENT_VERSION: "ai-consent-test",
    AI_INSIGHTS_MODEL: "gpt-test",
    LAUNCH_COUNTRY: "FR",
  },
}));

import {
  getDashboardSummary,
  getMoodChartData,
  getPatternInsights,
  getStreakData,
} from "@/features/insights/insights.action";
import {
  getAiJournalInsight,
  setAiInsightsConsent,
} from "@/features/insights/ai-insight.action";

const user = { id: "insights-user", email: "user@moodday.invalid" };
const currentEntryDate = new Date();
type ActionHandler<T = unknown> = (args: {
  parsedInput?: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(
  handler: unknown,
  args: Parameters<ActionHandler<T>>[0],
) => (handler as ActionHandler<T>)(args);

const plusSubscription = {
  plan: "plus",
  status: "active",
  periodEnd: new Date("2030-09-01T00:00:00.000Z"),
  cancelAtPeriodEnd: false,
  graceEndsAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  actionClient.inputSchema.mockReturnValue(actionClient);
  actionClient.action.mockImplementation((handler) => handler);
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    typeof callback === "function"
      ? callback(prisma as never)
      : Promise.all(callback),
  );
  vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
    locale: "fr",
    timezone: "Europe/Paris",
  } as never);
  mocks.getMedicationAdherenceForUser.mockResolvedValue({
    expected: 10,
    taken: 9,
    percent: 90,
  });
  mocks.isAiInsightsAvailableForUser.mockReturnValue(true);
  mocks.hasCrisisSignal.mockReturnValue(false);
  mocks.buildDeterministicInsight.mockReturnValue({
    summary: "Heuristic summary",
    generatedAt: "2026-08-13T00:00:00.000Z",
    observations: [],
  });
  mocks.getInsightDataFields.mockReturnValue(["mood", "energy"]);
  mocks.claimAiInsightUsage.mockResolvedValue({
    admitted: true,
    usageId: "usage-1",
  });
  vi.mocked(prisma.aIUsage.update).mockResolvedValue({} as never);
});

describe("deterministic product insights", () => {
  it("returns bounded chart data with dosage markers and shared adherence", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      {
        id: "mood-1",
        value: 0,
        note: "synthetic",
        energy: 4,
        sleepHours: 7,
        anxiety: 2,
        createdAt: currentEntryDate,
      },
    ] as never);
    vi.mocked(prisma.medicationHistory.findMany).mockResolvedValue([
      {
        id: "history-1",
        previousDosage: "old",
        dosage: "new",
        changedAt: currentEntryDate,
        medication: { name: "Synthetic" },
      },
    ] as never);
    const result = await invoke<{
      effectiveDays: number;
      moodEntries: { value: number }[];
      medicationAdherence: number | null;
    }>(getMoodChartData, {
      parsedInput: { days: 365 },
      ctx: { user },
    });
    expect(result).toMatchObject({
      effectiveDays: 30,
      moodEntries: [{ value: 0 }],
      medicationAdherence: 90,
    });
  });

  it("aggregates the representative dashboard without losing zero values", async () => {
    vi.mocked(prisma.moodEntry.findMany)
      .mockResolvedValueOnce([
        {
          value: 0,
          createdAt: currentEntryDate,
          sleepHours: 7,
          sleepQuality: "good",
          energy: 4,
        },
        {
          value: 6,
          createdAt: currentEntryDate,
          sleepHours: 8,
          sleepQuality: "good",
          energy: 6,
        },
      ] as never)
      .mockResolvedValueOnce([{ value: 2 }] as never);
    vi.mocked(prisma.medication.count).mockResolvedValue(2);
    vi.mocked(prisma.medIntake.count).mockResolvedValue(1);
    vi.mocked(prisma.therapySession.findFirst).mockResolvedValue({
      date: currentEntryDate,
      benefitRating: 4,
    } as never);
    vi.mocked(prisma.therapySession.count).mockResolvedValue(1);
    vi.mocked(prisma.exerciseLog.count).mockResolvedValue(3);
    vi.mocked(prisma.exercise.count).mockResolvedValue(2);

    const result = await invoke<{
      mood: { weeklyAverage: number; hasEntryToday: boolean };
      medications: { adherencePercent: number | null };
    }>(getDashboardSummary, { ctx: { user } });
    expect(result.mood.weeklyAverage).toBe(3);
    expect(result.mood.hasEntryToday).toBe(true);
    expect(result.medications.adherencePercent).toBe(90);
  });

  it("builds factual pattern and streak summaries", async () => {
    vi.mocked(prisma.moodEntry.findMany)
      .mockResolvedValueOnce([
        { value: 8, createdAt: new Date("2026-08-08T10:00:00.000Z") },
        { value: 8, createdAt: new Date("2026-08-09T10:00:00.000Z") },
        { value: 7, createdAt: new Date("2026-08-02T10:00:00.000Z") },
        { value: 5, createdAt: new Date("2026-08-03T10:00:00.000Z") },
        { value: 5, createdAt: new Date("2026-08-04T10:00:00.000Z") },
        { value: 5, createdAt: new Date("2026-08-05T10:00:00.000Z") },
        { value: 5, createdAt: new Date("2026-08-06T10:00:00.000Z") },
        { value: 5, createdAt: new Date("2026-08-07T10:00:00.000Z") },
      ] as never)
      .mockResolvedValueOnce([{ createdAt: currentEntryDate }] as never);
    vi.mocked(prisma.therapySession.count)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    vi.mocked(prisma.exerciseLog.count).mockResolvedValueOnce(12);

    const patterns = await invoke<{ type: string }[]>(getPatternInsights, {
      ctx: { user },
    });
    expect(patterns.map(({ type }) => type)).toEqual(
      expect.arrayContaining(["mood", "medication", "therapy", "exercise"]),
    );
    const streak = await invoke<{ streakDays: number; subtitle: string }>(
      getStreakData,
      { ctx: { user } },
    );
    expect(streak.streakDays).toBeGreaterThanOrEqual(1);
    expect(streak.subtitle).not.toBe("");
  });
});

describe("AI insight actions", () => {
  it("records and revokes versioned AI consent atomically", async () => {
    vi.mocked(prisma.userPreferences.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.userConsent.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.userConsent.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      invoke(setAiInsightsConsent, {
        parsedInput: { enabled: true, includeJournalNotes: true },
        ctx: { user },
      }),
    ).resolves.toEqual({ enabled: true });
    expect(prisma.userConsent.upsert).toHaveBeenCalledTimes(2);

    await expect(
      invoke(setAiInsightsConsent, {
        parsedInput: { enabled: false, includeJournalNotes: false },
        ctx: { user },
      }),
    ).resolves.toEqual({ enabled: false });
    expect(prisma.userConsent.updateMany).toHaveBeenCalled();
  });

  it("returns safety resources before quota or provider use", async () => {
    mocks.hasCrisisSignal.mockReturnValueOnce(true);
    const result = await invoke<{ source: string; crisis: boolean }>(
      getAiJournalInsight,
      {
        parsedInput: { mood: 0, notes: "synthetic crisis fixture" },
        ctx: { user },
      },
    );
    expect(result).toEqual(
      expect.objectContaining({ source: "safety", crisis: true }),
    );
    expect(mocks.claimAiInsightUsage).not.toHaveBeenCalled();
  });

  it("falls back without consent and returns a transparent AI result after admission", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(
      plusSubscription as never,
    );
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([]);
    const fallback = await invoke<{ source: string; requiresConsent: boolean }>(
      getAiJournalInsight,
      {
        parsedInput: { mood: 6, includeJournalNotes: false },
        ctx: { user },
      },
    );
    expect(fallback).toMatchObject({
      source: "heuristic",
      requiresConsent: true,
    });

    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      locale: "fr",
      timezone: "Europe/Paris",
      aiInsightsEnabled: true,
      aiJournalNotesEnabled: true,
      aiConsentVersion: "ai-consent-test",
    } as never);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([
      { purpose: "ai_insights" },
      { purpose: "ai_journal_notes" },
    ] as never);
    mocks.generateMooddayInsight.mockResolvedValue({
      kind: "ai",
      insight: {
        summary: "AI summary",
        generatedAt: "2026-08-13T00:00:00.000Z",
        observations: [],
      },
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    const result = await invoke<{
      source: string;
      transparency: { dataFields: string[] };
    }>(getAiJournalInsight, {
      parsedInput: {
        mood: 6,
        energy: 5,
        notes: "synthetic",
        tags: ["must-not-leave-device"],
        includeJournalNotes: true,
      },
      ctx: { user },
    });
    expect(result).toMatchObject({
      source: "ai",
      transparency: { dataFields: ["mood", "energy"] },
    });
    expect(mocks.generateMooddayInsight).toHaveBeenCalledWith(
      expect.objectContaining({
        includeJournalNotes: true,
        input: expect.not.objectContaining({ tags: expect.anything() }),
      }),
    );
  });
});
