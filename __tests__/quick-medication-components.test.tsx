import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  quickOpen: true,
  editingEntry: null as null | {
    id: string;
    value: number;
    note?: string | null;
  },
  online: true,
}));
const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  confirm: vi.fn(),
  createMoodEntry: vi.fn(),
  updateMoodEntry: vi.fn(),
  deleteMoodEntry: vi.fn(),
  queueMoodEntry: vi.fn(),
  discardQueuedMoodEntry: vi.fn(),
  logMedIntake: vi.fn(),
  skipMedIntake: vi.fn(),
  deleteMedIntake: vi.fn(),
  logPRNIntake: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSuccess?: (result: unknown) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      void options
        .mutationFn()
        .then((result) => options.onSuccess?.(result))
        .catch((error: Error) => options.onError?.(error));
    },
  }),
}));
vi.mock("@/features/mood/quick-entry-store", () => ({
  useQuickEntryStore: () => ({
    isOpen: state.quickOpen,
    editingEntry: state.editingEntry,
    close: mocks.close,
  }),
}));
vi.mock("@/features/mood/mood.action", () => ({
  createMoodEntry: mocks.createMoodEntry,
  updateMoodEntry: mocks.updateMoodEntry,
  deleteMoodEntry: mocks.deleteMoodEntry,
}));
vi.mock("@/features/medication/medication.action", () => ({
  logMedIntake: mocks.logMedIntake,
  skipMedIntake: mocks.skipMedIntake,
  deleteMedIntake: mocks.deleteMedIntake,
  logPRNIntake: mocks.logPRNIntake,
}));
vi.mock("@/features/pwa/offline-queue", () => ({
  queueMoodEntry: mocks.queueMoodEntry,
  discardQueuedMoodEntry: mocks.discardQueuedMoodEntry,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: () => "offline-storage-error",
}));
vi.mock("@/features/dialog-manager/dialog-manager", () => ({
  dialogManager: { confirm: mocks.confirm },
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "quick-owner" } } }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));
vi.mock("@/components/nowts/mood-slider", () => ({
  MoodSlider: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => (
    <button type="button" onClick={() => onChange(8)}>
      mood-value:{value}
    </button>
  ),
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: (event: React.MouseEvent) => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { MedCheckbox } from "@/components/nowts/med-checkbox";
import { PRNMedicationCard } from "@/components/nowts/prn-medication-card";
import { QuickEntryModal } from "@/components/nowts/quick-entry-modal";

describe("quick mood and medication controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.quickOpen = true;
    state.editingEntry = null;
    state.online = true;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => state.online,
    });
    mocks.createMoodEntry.mockResolvedValue({ data: { id: "mood-new" } });
    mocks.updateMoodEntry.mockResolvedValue({ data: { id: "mood-edit" } });
    mocks.deleteMoodEntry.mockResolvedValue({ data: { id: "mood-deleted" } });
    mocks.queueMoodEntry.mockResolvedValue({ id: "queue-mood" });
    mocks.discardQueuedMoodEntry.mockResolvedValue(undefined);
    mocks.logMedIntake.mockResolvedValue({ data: { id: "intake-new" } });
    mocks.skipMedIntake.mockResolvedValue({ data: { id: "intake-skip" } });
    mocks.deleteMedIntake.mockResolvedValue({ data: { id: "intake-delete" } });
    mocks.logPRNIntake.mockResolvedValue({ data: { id: "prn-new" } });
  });

  it("keeps the quick modal absent while closed", () => {
    state.quickOpen = false;
    render(<QuickEntryModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates an online mood and supports undo", async () => {
    render(<QuickEntryModal />);
    fireEvent.click(screen.getByRole("button", { name: "mood-value:5" }));
    fireEvent.change(
      screen.getByPlaceholderText("mood.entry.notePlaceholder"),
      {
        target: { value: "  Une bonne journée  " },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.save" }));
    await waitFor(() =>
      expect(mocks.createMoodEntry).toHaveBeenCalledWith({
        value: 8,
        note: "Une bonne journée",
      }),
    );
    const options = mocks.toastSuccess.mock.calls[0]?.[1] as {
      action: { onClick: () => void };
    };
    options.action.onClick();
    await waitFor(() =>
      expect(mocks.deleteMoodEntry).toHaveBeenCalledWith({ id: "mood-new" }),
    );
    expect(mocks.close).toHaveBeenCalled();
  });

  it("updates and deletes an existing mood through confirmation", async () => {
    state.editingEntry = { id: "mood-existing", value: 2, note: "Avant" };
    render(<QuickEntryModal />);
    expect(
      screen.getByRole("button", { name: "mood-value:2" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.update" }));
    await waitFor(() =>
      expect(mocks.updateMoodEntry).toHaveBeenCalledWith({
        id: "mood-existing",
        value: 2,
        note: "Avant",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.delete" }));
    const confirmation = mocks.confirm.mock.calls[0]?.[0] as {
      action: { onClick: () => void };
    };
    confirmation.action.onClick();
    await waitFor(() =>
      expect(mocks.deleteMoodEntry).toHaveBeenCalledWith({
        id: "mood-existing",
      }),
    );
  });

  it("isolates offline create and blocks offline edit and deletion", async () => {
    state.online = false;
    const view = render(<QuickEntryModal />);
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.save" }));
    await waitFor(() =>
      expect(mocks.queueMoodEntry).toHaveBeenCalledWith("quick-owner", {
        value: 5,
        note: undefined,
      }),
    );
    const options = mocks.toastSuccess.mock.calls[0]?.[1] as {
      action: { onClick: () => void };
    };
    options.action.onClick();
    await waitFor(() =>
      expect(mocks.discardQueuedMoodEntry).toHaveBeenCalledWith(
        "quick-owner",
        "queue-mood",
      ),
    );

    state.editingEntry = { id: "offline-edit", value: 4, note: null };
    view.rerender(<QuickEntryModal />);
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.update" }));
    fireEvent.click(screen.getByRole("button", { name: "mood.entry.delete" }));
    expect(mocks.toastError).toHaveBeenCalledWith(
      "mood.entry.offlineEditUnavailable",
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      "mood.entry.offlineDeleteUnavailable",
    );
  });

  it("logs, skips and undoes scheduled medication intake", async () => {
    const view = render(
      <MedCheckbox medicationId="med-1" name="Matin" dosage="10 mg" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Matin/ }));
    await waitFor(() =>
      expect(mocks.logMedIntake).toHaveBeenCalledWith({
        medicationId: "med-1",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "medication.intake.skip" }),
    );
    await waitFor(() =>
      expect(mocks.skipMedIntake).toHaveBeenCalledWith({
        medicationId: "med-1",
      }),
    );

    view.rerender(
      <MedCheckbox
        medicationId="med-1"
        name="Matin"
        dosage="10 mg"
        intake={{ id: "intake-1", skipped: false }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "medication.intake.undo" }),
    );
    await waitFor(() =>
      expect(mocks.deleteMedIntake).toHaveBeenCalledWith({
        intakeId: "intake-1",
      }),
    );
  });

  it("logs PRN intake with an optional reason and expands history", async () => {
    render(
      <PRNMedicationCard
        medicationId="prn-1"
        name="Si besoin"
        dosage="5 mg"
        todayIntakes={[
          {
            id: "p1",
            takenAt: new Date("2026-08-13T08:00:00Z"),
            note: "Stress",
          },
          { id: "p2", takenAt: new Date("2026-08-13T12:00:00Z") },
        ]}
      />,
    );
    fireEvent.change(
      screen.getByPlaceholderText("medication.prn.reasonPlaceholder"),
      {
        target: { value: "Anxiété" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "medication.prn.confirm" }),
    );
    await waitFor(() =>
      expect(mocks.logPRNIntake).toHaveBeenCalledWith({
        medicationId: "prn-1",
        reason: "Anxiété",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "medication.prn.todayHistory" }),
    );
    expect(screen.getByText("Stress")).toBeInTheDocument();
  });
});
