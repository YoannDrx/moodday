import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  locale: "fr" as "fr" | "en",
  medicationMode: "rich" as "rich" | "empty" | "loading",
  insightMode: "success" as "success" | "error" | "safety",
}));
const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  saveMoodEntry: vi.fn(),
  queueMoodEntry: vi.fn(),
  logMedIntake: vi.fn(),
  refetchMedications: vi.fn(),
  fetchInsight: vi.fn(),
  insightOptions: null as null | {
    onSuccess: (result: { data: Record<string, unknown> }) => void;
    onError: () => void;
  },
}));

const medications = [
  {
    id: "med-pending",
    name: "Traitement à prendre",
    dosage: "10 mg",
    frequency: "daily",
    intakes: [],
  },
  {
    id: "med-taken",
    name: "Traitement déjà pris",
    dosage: "5 mg",
    frequency: "daily",
    intakes: [{ id: "intake-1", skipped: false }],
  },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: state.locale,
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/features/mood/mood.action", () => ({
  saveMoodEntry: mocks.saveMoodEntry,
}));
vi.mock("@/features/pwa/offline-queue", () => ({
  queueMoodEntry: mocks.queueMoodEntry,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: () => "offline-storage-error",
}));
vi.mock("@/features/medication/medication.action", () => ({
  getTodayIntakes: vi.fn(),
  logMedIntake: mocks.logMedIntake,
}));
vi.mock("@/features/insights/ai-insight.action", () => ({
  getAiJournalInsight: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data:
      state.medicationMode === "empty"
        ? []
        : state.medicationMode === "loading"
          ? undefined
          : medications,
    isLoading: state.medicationMode === "loading",
    refetch: mocks.refetchMedications,
  }),
  useMutation: (options: {
    mutationFn: (id: string) => Promise<unknown>;
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: (id: string) => {
      void options
        .mutationFn(id)
        .then(() => options.onSuccess())
        .catch((error: Error) => options.onError(error));
    },
  }),
}));
vi.mock("next-safe-action/hooks", () => ({
  useAction: (
    _action: unknown,
    options: {
      onSuccess: (result: { data: Record<string, unknown> }) => void;
      onError: () => void;
    },
  ) => {
    mocks.insightOptions = options;
    return { execute: mocks.fetchInsight, status: "idle" };
  },
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    disabled,
    onCheckedChange,
    ...props
  }: {
    checked: boolean;
    disabled: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label": string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    />
  ),
}));

import { JournalWizard } from "@app/(logged-in)/(patient-layout)/mood/_components/journal-wizard";

const customTags = [
  {
    id: "tag-1",
    displayLabel: "Déclencheur perso",
    category: "trigger" as const,
    color: "#ff0000",
  },
  {
    id: "tag-2",
    displayLabel: "Protection perso",
    category: "protective" as const,
    color: "#00ff00",
  },
  {
    id: "tag-3",
    displayLabel: "Contexte un",
    category: "context" as const,
    color: null,
  },
  {
    id: "tag-4",
    displayLabel: "Contexte deux",
    category: "context" as const,
    color: null,
  },
  {
    id: "tag-5",
    displayLabel: "Contexte trois",
    category: "context" as const,
    color: null,
  },
];

const goToStep = async (
  user: ReturnType<typeof userEvent.setup>,
  step: number,
) => {
  await user.click(screen.getByRole("button", { name: `Étape ${step}` }));
};

describe("journal wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    state.medicationMode = "rich";
    state.insightMode = "success";
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    mocks.saveMoodEntry.mockResolvedValue({ data: { id: "mood-1" } });
    mocks.queueMoodEntry.mockResolvedValue({ id: "queued-1" });
    mocks.logMedIntake.mockResolvedValue({ data: { id: "intake-new" } });
    mocks.refetchMedications.mockResolvedValue(undefined);
    mocks.fetchInsight.mockImplementation((input: Record<string, unknown>) => {
      if (state.insightMode === "error") {
        mocks.insightOptions?.onError();
        return;
      }
      mocks.insightOptions?.onSuccess({
        data:
          state.insightMode === "safety"
            ? { message: "Ressources de sécurité", source: "safety" }
            : {
                message: "Insight factuel",
                source: "ai",
                transparency: {
                  generatedAt: "2026-08-13T10:00:00.000Z",
                  date: "2026-08-13",
                  dataFields: ["mood", "energy", "journalNotes"],
                },
              },
      });
      return input;
    });
  });

  it("walks through all five steps and saves a complete bounded online entry", async () => {
    const user = userEvent.setup();
    render(<JournalWizard aiAvailable={true} customTags={customTags} />);

    expect(
      screen
        .getByLabelText("mood.journal.step1.moodLabel")
        .closest(".animate-in"),
    ).not.toHaveClass("fade-in");

    fireEvent.change(screen.getByLabelText("mood.journal.step1.moodLabel"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("mood.journal.step1.energyLabel"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText("mood.journal.step1.anxietyLabel"), {
      target: { value: "2" },
    });
    expect(screen.getByText("😔")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("mood.journal.step1.moodLabel"), {
      target: { value: "8" },
    });
    expect(screen.getByText("😊")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "actions.continue" }));
    expect(screen.getByText("mood.journal.step2.title")).toBeInTheDocument();
    const unlabeledButtons = screen.getAllByRole("button", { name: "" });
    await user.click(unlabeledButtons[0]);
    await user.click(unlabeledButtons[1]);
    await user.click(unlabeledButtons[4]);
    const disturbance = screen.getByRole("button", {
      name: "labels.sleepDisturbances.nightmares",
    });
    await user.click(disturbance);
    await user.click(disturbance);

    await goToStep(user, 3);
    await user.click(
      screen.getByRole("button", { name: "mood.journal.step3.markTaken" }),
    );
    await waitFor(() =>
      expect(mocks.logMedIntake).toHaveBeenCalledWith({
        medicationId: "med-pending",
      }),
    );
    await user.type(
      screen.getByPlaceholderText("mood.journal.step3.sideEffectsPlaceholder"),
      "fatigue, nausée,  ",
    );

    await goToStep(user, 4);
    const symptom = screen.getByRole("button", {
      name: "labels.symptoms.anxiety",
    });
    await user.click(symptom);
    await user.click(symptom);
    const event = screen.getByRole("button", { name: "labels.events.work" });
    await user.click(event);
    await user.click(event);
    await user.click(screen.getByRole("button", { name: "Déclencheur perso" }));
    await user.click(screen.getByRole("button", { name: "Protection perso" }));

    await goToStep(user, 5);
    const notes = screen.getByPlaceholderText("mood.journal.step5.placeholder");
    fireEvent.change(notes, { target: { value: "n".repeat(600) } });
    expect(notes).toHaveValue("n".repeat(500));
    await user.click(
      screen.getByRole("switch", { name: "mood.journal.insight.includeNotes" }),
    );
    await waitFor(() => expect(mocks.fetchInsight).toHaveBeenCalled());
    expect(screen.getByText("Insight factuel")).toBeInTheDocument();
    expect(
      screen.getByText("mood.journal.insight.aiDisclaimer"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mood\.journal\.insight\.dataUsed/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /actions\.finish/ }));
    await waitFor(() =>
      expect(mocks.saveMoodEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 8,
          energy: 8,
          anxiety: 2,
          note: "n".repeat(500),
          sideEffects: ["fatigue", "nausée"],
          tags: ["Déclencheur perso", "Protection perso"],
        }),
      ),
    );
    expect(mocks.routerPush).toHaveBeenCalledWith("/dashboard");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("mood.journal.saved");
  });

  it("queues the same structured payload offline and surfaces storage errors", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const user = userEvent.setup();
    render(<JournalWizard aiAvailable={false} customTags={[]} />);
    await goToStep(user, 5);
    await user.click(screen.getByRole("button", { name: /actions\.finish/ }));
    await waitFor(() =>
      expect(mocks.queueMoodEntry).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ value: 5, note: undefined }),
      ),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("mood.entry.offlineSaved");

    mocks.queueMoodEntry.mockRejectedValueOnce(new Error("quota"));
    await user.click(screen.getByRole("button", { name: /actions\.finish/ }));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("offline-storage-error"),
    );
  });

  it("uses deterministic insight fallback and safety output without requiring AI", async () => {
    state.insightMode = "error";
    const user = userEvent.setup();
    const { unmount } = render(
      <JournalWizard aiAvailable={false} customTags={[]} />,
    );
    await goToStep(user, 5);
    await waitFor(() =>
      expect(
        screen.getByText("mood.journal.insight.fallback"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("switch", {
        name: "mood.journal.insight.includeNotes",
      }),
    ).not.toBeInTheDocument();
    unmount();

    state.insightMode = "safety";
    render(<JournalWizard aiAvailable={true} customTags={[]} />);
    await goToStep(user, 5);
    await waitFor(() =>
      expect(screen.getByText("Ressources de sécurité")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("mood.journal.insight.aiDisclaimer"),
    ).not.toBeInTheDocument();
  });

  it("renders medication loading and empty states and reports intake failures", async () => {
    const user = userEvent.setup();
    state.medicationMode = "loading";
    const loading = render(
      <JournalWizard aiAvailable={false} customTags={[]} />,
    );
    await goToStep(user, 3);
    expect(screen.queryByText("Traitement à prendre")).not.toBeInTheDocument();
    loading.unmount();

    state.medicationMode = "empty";
    const empty = render(<JournalWizard aiAvailable={false} customTags={[]} />);
    await goToStep(user, 3);
    expect(screen.getByText("mood.journal.step3.noMeds")).toBeInTheDocument();
    empty.unmount();

    state.medicationMode = "rich";
    mocks.logMedIntake.mockResolvedValueOnce({ serverError: "intake-failed" });
    render(<JournalWizard aiAvailable={false} customTags={[]} />);
    await goToStep(user, 3);
    await user.click(
      screen.getByRole("button", { name: "mood.journal.step3.markTaken" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("intake-failed"),
    );
  });

  it("enforces the shared maximum of twenty standard and custom tags", async () => {
    const user = userEvent.setup();
    render(<JournalWizard aiAvailable={true} customTags={customTags} />);
    await goToStep(user, 4);

    const symptomButtons = [
      "anxiety",
      "irritability",
      "ruminations",
      "agitation",
      "brain_fog",
      "tension",
      "sadness",
      "euphoria",
    ].map((key) =>
      screen.getByRole("button", { name: `labels.symptoms.${key}` }),
    );
    symptomButtons.forEach((button) => fireEvent.click(button));
    const eventButtons = [
      "work",
      "family",
      "sport",
      "alcohol",
      "conflict",
      "social_outing",
      "bad_news",
      "success",
    ].map((key) =>
      screen.getByRole("button", { name: `labels.events.${key}` }),
    );
    eventButtons.forEach((button) => fireEvent.click(button));
    await user.click(screen.getByRole("button", { name: "Déclencheur perso" }));
    await user.click(screen.getByRole("button", { name: "Protection perso" }));
    await user.click(screen.getByRole("button", { name: "Contexte un" }));
    await user.click(screen.getByRole("button", { name: "Contexte deux" }));
    await user.click(screen.getByRole("button", { name: "Contexte trois" }));

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Vous pouvez sélectionner jusqu’à 20 tags.",
    );
  });
});
