import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  online: true,
  queuedCount: 0,
  queryMode: "rich" as "rich" | "empty" | "loading",
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  refetchMedications: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  saveMoodEntry: vi.fn(),
  deleteMoodEntry: vi.fn(),
  logMedIntake: vi.fn(),
  skipMedIntake: vi.fn(),
  queueAction: vi.fn(),
  queueMoodEntry: vi.fn(),
  discardQueuedMoodEntry: vi.fn(),
}));

const summary = {
  mood: {
    hasEntryToday: false,
    weeklyAverage: 6.5,
    trendPercent: 12,
  },
  exercises: { completionsThisWeek: 3 },
  therapy: { sessionsThisMonth: 2 },
  sleep: {
    avgHours: 7.2,
    latestHours: 7.5,
    latestQuality: "good",
    avgEnergy: 6,
  },
};
const medications = [
  {
    id: "med-pending",
    name: "Traitement quotidien",
    dosage: "10 mg",
    frequency: "daily",
    doseSlots: [
      {
        id: "slot-pending",
        doseIndex: 0,
        scheduledForDate: "2026-08-13",
        scheduledTime: "08:00",
        labelKey: "medication.morning",
        status: "pending",
      },
    ],
  },
  {
    id: "med-taken",
    name: "Traitement pris",
    dosage: "5 mg",
    frequency: "twice_daily",
    doseSlots: [
      {
        id: "slot-taken",
        doseIndex: 1,
        scheduledForDate: "2026-08-13",
        scheduledTime: null,
        labelKey: "medication.evening",
        status: "taken",
      },
    ],
  },
  {
    id: "med-skipped",
    name: "Traitement sauté",
    dosage: "20 mg",
    frequency: "weekly",
    doseSlots: [
      {
        id: "slot-skipped",
        doseIndex: 0,
        scheduledForDate: "2026-08-13",
        scheduledTime: "20:00",
        labelKey: "medication.evening",
        status: "skipped",
      },
    ],
  },
];

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    const isLoading = state.queryMode === "loading";
    const empty = state.queryMode === "empty";
    const data =
      key === "dashboard-summary"
        ? empty
          ? undefined
          : summary
        : key === "mood-chart"
          ? empty
            ? { moodEntries: [], dosageChanges: [] }
            : { moodEntries: [{ value: 5 }], dosageChanges: [{ to: "10 mg" }] }
          : key === "pattern-insights"
            ? empty
              ? []
              : [
                  { message: "Observation une" },
                  { message: "Observation deux" },
                ]
            : key === "today-intakes"
              ? empty
                ? []
                : medications
              : key === "dashboard-caregivers"
                ? empty
                  ? []
                  : [
                      {
                        id: "caregiver-active",
                        label: "Camille",
                        caregiverName: null,
                        caregiverEmail: "camille@moodday.invalid",
                        caregiverImage: null,
                        status: "active",
                      },
                      {
                        id: "caregiver-pending",
                        label: null,
                        caregiverName: "Morgan",
                        caregiverEmail: "morgan@moodday.invalid",
                        caregiverImage: null,
                        status: "pending",
                      },
                    ]
                : undefined;
    return {
      data,
      isLoading,
      refetch: mocks.refetchMedications,
    };
  },
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/hooks/use-offline-status", () => ({
  useOfflineStatus: () => ({
    isOnline: state.online,
    queuedCount: state.queuedCount,
    ownerId: "user-1",
  }),
}));
vi.mock("@/components/nowts/glass-card", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  GlassCardBadge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  GlassCardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GlassCardHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  GlassCardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}));
vi.mock("@/components/nowts/mood-slider", () => ({
  MoodSlider: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => (
    <button type="button" onClick={() => onChange(3)}>
      mood:{value}
    </button>
  ),
}));
vi.mock("@/components/nowts/lazy-mood-chart", () => ({
  LazyMoodChart: ({ moodEntries }: { moodEntries: unknown[] }) => (
    <div data-testid="mood-chart">chart:{moodEntries.length}</div>
  ),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/features/mood/mood.action", () => ({
  saveMoodEntry: mocks.saveMoodEntry,
  deleteMoodEntry: mocks.deleteMoodEntry,
}));
vi.mock("@/features/medication/medication.action", () => ({
  getTodayIntakes: vi.fn(),
  logMedIntake: mocks.logMedIntake,
  skipMedIntake: mocks.skipMedIntake,
}));
vi.mock("@/features/insights/insights.action", () => ({
  getDashboardSummary: vi.fn(),
  getMoodChartData: vi.fn(),
  getPatternInsights: vi.fn(),
}));
vi.mock("@/features/caregiver/caregiver.action", () => ({
  getMyCaregivers: vi.fn(),
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  queueAction: mocks.queueAction,
}));
vi.mock("@/features/pwa/offline-queue", () => ({
  queueMoodEntry: mocks.queueMoodEntry,
  discardQueuedMoodEntry: mocks.discardQueuedMoodEntry,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: () => "offline-storage-error",
}));

import { DashboardContent } from "@app/(logged-in)/(patient-layout)/dashboard/_components/dashboard-content";

const getMedicationCard = (name: string) => {
  const card = screen.getByText(name).closest("div[class*='cursor-pointer']");
  expect(card).not.toBeNull();
  return card as HTMLElement;
};

describe("patient dashboard content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.online = true;
    state.queuedCount = 0;
    state.queryMode = "rich";
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.refetchMedications.mockResolvedValue(undefined);
    mocks.saveMoodEntry.mockResolvedValue({ data: { id: "mood-1" } });
    mocks.deleteMoodEntry.mockResolvedValue({ data: { success: true } });
    mocks.logMedIntake.mockResolvedValue({ data: { id: "intake-1" } });
    mocks.skipMedIntake.mockResolvedValue({ data: { id: "intake-2" } });
    mocks.queueMoodEntry.mockResolvedValue({ id: "queued-mood-1" });
    mocks.queueAction.mockResolvedValue(undefined);
    mocks.discardQueuedMoodEntry.mockResolvedValue(undefined);
  });

  it("renders complete dashboard data and handles online mood and medication writes", async () => {
    const user = userEvent.setup();
    render(<DashboardContent ownerId="user-1" />);

    expect(screen.getByText("Observation une")).toBeInTheDocument();
    expect(screen.getByText("Traitement quotidien")).toBeInTheDocument();
    expect(screen.getByText("Camille")).toBeInTheDocument();
    expect(screen.getByTestId("mood-chart")).toHaveTextContent("chart:1");
    expect(screen.getByText("7h 30m")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "mood:7" }));
    expect(screen.getByRole("button", { name: "mood:3" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("dashboard.quickMood.energyLabel"), {
      target: { value: "8" },
    });
    await user.click(
      screen.getByRole("button", { name: "dashboard.quickMood.save" }),
    );
    await waitFor(() => {
      expect(mocks.saveMoodEntry).toHaveBeenCalledWith({ value: 3, energy: 8 });
    });
    expect(mocks.invalidateQueries).toHaveBeenCalled();

    const moodToast = mocks.toastSuccess.mock.calls.find(
      ([message]) => message === "mood.entry.saved",
    );
    await act(async () => {
      moodToast?.[1]?.action?.onClick();
    });
    await waitFor(() =>
      expect(mocks.deleteMoodEntry).toHaveBeenCalledWith({ id: "mood-1" }),
    );

    await user.click(getMedicationCard("Traitement quotidien"));
    await waitFor(() => expect(mocks.logMedIntake).toHaveBeenCalled());
    await user.click(
      screen.getByRole("button", { name: "medication.intake.skipDose" }),
    );
    await waitFor(() => expect(mocks.skipMedIntake).toHaveBeenCalled());

    await user.click(getMedicationCard("Traitement pris"));
    expect(mocks.logMedIntake).toHaveBeenCalledTimes(1);
  });

  it("queues mood, medication intake and skip writes while offline and supports undo", async () => {
    state.online = false;
    state.queuedCount = 2;
    const user = userEvent.setup();
    render(<DashboardContent ownerId="user-1" />);

    expect(screen.getByText(/common\.offlineMode/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "dashboard.quickMood.save" }),
    );
    await waitFor(() =>
      expect(mocks.queueMoodEntry).toHaveBeenCalledWith("user-1", {
        value: 7,
        energy: 5,
      }),
    );

    const moodToast = mocks.toastSuccess.mock.calls.find(
      ([message]) => message === "mood.entry.offlineSaved",
    );
    await act(async () => {
      moodToast?.[1]?.action?.onClick();
    });
    await waitFor(() =>
      expect(mocks.discardQueuedMoodEntry).toHaveBeenCalledWith(
        "user-1",
        "queued-mood-1",
      ),
    );

    await user.click(getMedicationCard("Traitement quotidien"));
    await user.click(
      screen.getByRole("button", { name: "medication.intake.skipDose" }),
    );
    await waitFor(() => expect(mocks.queueAction).toHaveBeenCalledTimes(2));
    expect(mocks.logMedIntake).not.toHaveBeenCalled();
    expect(mocks.skipMedIntake).not.toHaveBeenCalled();
  });

  it("renders loading and empty product states without invented metrics", () => {
    state.queryMode = "loading";
    const { unmount } = render(<DashboardContent ownerId="user-1" />);
    expect(screen.queryByTestId("mood-chart")).not.toBeInTheDocument();
    unmount();

    state.queryMode = "empty";
    render(<DashboardContent ownerId="user-1" />);
    expect(screen.getByText("dashboard.medications.empty")).toBeInTheDocument();
    expect(
      screen.getByText("dashboard.insights.emptyTitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard.caregivers.empty")).toBeInTheDocument();
    expect(screen.getByText("dashboard.sleep.noData")).toBeInTheDocument();
  });

  it("surfaces server and storage failures without leaving the save button disabled", async () => {
    const user = userEvent.setup();
    mocks.saveMoodEntry.mockResolvedValueOnce({ serverError: "save-failed" });
    render(<DashboardContent ownerId="user-1" />);
    await user.click(
      screen.getByRole("button", { name: "dashboard.quickMood.save" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("save-failed"),
    );
    expect(
      screen.getByRole("button", { name: "dashboard.quickMood.save" }),
    ).toBeEnabled();

    mocks.logMedIntake.mockRejectedValueOnce(new Error("storage"));
    await user.click(getMedicationCard("Traitement quotidien"));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("offline-storage-error"),
    );
  });
});
