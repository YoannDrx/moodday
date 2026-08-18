import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "rich" as "rich" | "empty" | "loading" | "error",
  online: true,
  queuedCount: 0,
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  queueAction: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  getMedications: vi.fn(),
  getTodayIntakes: vi.fn(),
  getPRNMedications: vi.fn(),
  logMedIntake: vi.fn(),
  skipMedIntake: vi.fn(),
  deleteMedIntake: vi.fn(),
  logPRNIntake: vi.fn(),
}));

const slot = (
  id: string,
  status: "pending" | "taken" | "skipped",
  intakeId?: string,
) => ({
  id,
  doseIndex: id.endsWith("2") ? 1 : 0,
  scheduledForDate: "2026-08-13",
  scheduledTime: id.endsWith("2") ? null : "08:00",
  labelKey: `slot.${id}`,
  status,
  intake: intakeId
    ? {
        id: intakeId,
        takenAt: new Date("2026-08-13T08:00:00.000Z"),
        skipped: status === "skipped",
        doseIndex: 0,
        scheduledForDate: "2026-08-13",
      }
    : null,
});

const regularToday = [
  {
    id: "regular-mixed",
    name: "Traitement mixte",
    dosage: "10 mg",
    frequency: "twice_daily",
    intakes: [],
    doseSlots: [
      slot("pending-1", "pending"),
      slot("taken-2", "taken", "intake-taken"),
      slot("skipped-1", "skipped", "intake-skipped"),
    ],
  },
];
const prnToday = [
  {
    id: "prn-one",
    name: "Traitement à la demande un",
    dosage: "5 mg",
    intakes: [{ id: "prn-intake", takenAt: new Date() }],
  },
  {
    id: "prn-many",
    name: "Traitement à la demande plusieurs",
    dosage: "2 mg",
    intakes: [
      { id: "prn-a", takenAt: new Date() },
      { id: "prn-b", takenAt: new Date() },
    ],
  },
];
const medicationList = [
  {
    id: "list-pending",
    name: "Liste en attente",
    dosage: "10 mg",
    frequency: "daily",
    isPRN: false,
    isArchived: false,
    intakes: [],
    doseSlots: [slot("list-pending-1", "pending")],
  },
  {
    id: "list-taken",
    name: "Liste terminée",
    dosage: "20 mg",
    frequency: "twice_daily",
    isPRN: false,
    isArchived: false,
    intakes: [],
    doseSlots: [slot("list-taken-1", "taken")],
  },
  {
    id: "list-skipped",
    name: "Liste sautée",
    dosage: "30 mg",
    frequency: "weekly",
    isPRN: false,
    isArchived: false,
    intakes: [],
    doseSlots: [slot("list-skipped-1", "skipped")],
  },
  {
    id: "list-prn",
    name: "Liste PRN",
    dosage: "si besoin",
    frequency: "unexpected",
    isPRN: true,
    isArchived: false,
    intakes: [],
    doseSlots: [],
  },
  {
    id: "list-archived",
    name: "Liste archivée",
    dosage: "ancien",
    frequency: "daily",
    isPRN: false,
    isArchived: true,
    intakes: [],
    doseSlots: [],
  },
];

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey[0];
    const data =
      state.mode === "empty"
        ? []
        : key === "todayIntakes"
          ? regularToday
          : key === "prnMedications"
            ? prnToday
            : medicationList;
    return {
      data,
      isLoading: state.mode === "loading",
      isError: state.mode === "error",
    };
  },
  useMutation: (options: {
    mutationFn: (variables: Record<string, unknown>) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onError: (error: unknown) => void;
  }) => ({
    isPending: false,
    mutate: (variables: Record<string, unknown>) => {
      void options
        .mutationFn(variables)
        .then(options.onSuccess)
        .catch(options.onError);
    },
  }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: "fr",
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("@/hooks/use-offline-status", () => ({
  useOfflineStatus: () => ({
    isOnline: state.online,
    queuedCount: state.queuedCount,
    ownerId: "offline-owner",
  }),
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "session-owner" } } }),
}));
vi.mock("@/features/pwa/offline-actions", () => ({
  queueAction: mocks.queueAction,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  getOfflineStorageErrorMessage: () => "offline-storage-error",
}));
vi.mock("@/features/medication/medication.action", () => ({
  getMedications: mocks.getMedications,
  getTodayIntakes: mocks.getTodayIntakes,
  getPRNMedications: mocks.getPRNMedications,
  logMedIntake: mocks.logMedIntake,
  skipMedIntake: mocks.skipMedIntake,
  deleteMedIntake: mocks.deleteMedIntake,
  logPRNIntake: mocks.logPRNIntake,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    subtitle,
    headerRight,
    children,
  }: {
    title: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {headerRight}
      {children}
    </main>
  ),
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
    <h2>{children}</h2>
  ),
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      archive-switch
    </button>
  ),
}));

import { MedicationsContent } from "@app/(logged-in)/(patient-layout)/medications/_components/medications-content";
import { TodayContent } from "@app/(logged-in)/(patient-layout)/medications/today/_components/today-content";

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
  state.online = online;
};

const getEnabledIntakeButton = () => {
  const button = screen
    .getAllByLabelText("medication.intake.logged")
    .find((candidate) => !candidate.hasAttribute("disabled"));
  if (!button) throw new Error("Expected one enabled intake button");
  return button;
};

describe("medication production surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = "rich";
    state.queuedCount = 0;
    setOnline(true);
    mocks.logMedIntake.mockResolvedValue({ data: { id: "intake-new" } });
    mocks.skipMedIntake.mockResolvedValue({ data: { id: "skip-new" } });
    mocks.deleteMedIntake.mockResolvedValue({ data: { id: "deleted" } });
    mocks.logPRNIntake.mockResolvedValue({ data: { id: "prn-new" } });
    mocks.queueAction.mockResolvedValue(undefined);
  });

  it("renders all list states, logs a pending scheduled dose, and reveals archives", async () => {
    render(<MedicationsContent />);

    expect(screen.getByText("Liste en attente")).toBeInTheDocument();
    expect(screen.getByText("Liste terminée")).toBeInTheDocument();
    expect(screen.getByText("Liste sautée")).toBeInTheDocument();
    expect(screen.getByText("Liste PRN")).toBeInTheDocument();
    expect(screen.queryByText("Liste archivée")).not.toBeInTheDocument();

    const pendingRow = screen.getByText("Liste en attente").closest("a");
    fireEvent.click(pendingRow?.querySelector("button") as HTMLButtonElement);
    await waitFor(() =>
      expect(mocks.logMedIntake).toHaveBeenCalledWith(
        expect.objectContaining({
          medicationId: "list-pending",
          scheduledForDate: "2026-08-13",
        }),
      ),
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["today-intakes"],
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("medication.intake.logged");

    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByText("Liste archivée")).toBeInTheDocument();
    expect(
      screen.getByText("medication.list.hideArchived"),
    ).toBeInTheDocument();
  });

  it("queues a list intake under the signed-in owner while offline", async () => {
    setOnline(false);
    render(<MedicationsContent />);
    const pendingRow = screen.getByText("Liste en attente").closest("a");
    fireEvent.click(pendingRow?.querySelector("button") as HTMLButtonElement);

    await waitFor(() =>
      expect(mocks.queueAction).toHaveBeenCalledWith(
        "session-owner",
        expect.objectContaining({
          type: "med_intake",
          medicationId: "list-pending",
        }),
      ),
    );
    expect(mocks.logMedIntake).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "medication.intake.loggedOffline",
    );
  });

  it.each([
    ["loading", "medication.list.title"],
    ["empty", "medication.list.emptyTitle"],
    ["error", "common.error"],
  ] as const)("renders the medication list %s state", (mode, expected) => {
    state.mode = mode;
    render(<MedicationsContent />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("logs, skips, undoes and records PRN doses from the daily screen", async () => {
    render(<TodayContent />);
    expect(screen.getByText("Traitement mixte")).toBeInTheDocument();
    expect(screen.getByText("Traitement à la demande un")).toBeInTheDocument();
    expect(
      screen.getByText('medication.prn.takenTodaySingular:{"count":1}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('medication.prn.takenTodayPlural:{"count":2}'),
    ).toBeInTheDocument();

    fireEvent.click(getEnabledIntakeButton());
    fireEvent.click(screen.getByText("medication.intake.skipDose"));
    fireEvent.click(screen.getAllByText("medication.intake.undo")[0]);
    fireEvent.click(screen.getAllByText("medication.prn.logButton")[0]);

    await waitFor(() => {
      expect(mocks.logMedIntake).toHaveBeenCalled();
      expect(mocks.skipMedIntake).toHaveBeenCalled();
      expect(mocks.deleteMedIntake).toHaveBeenCalledWith({
        intakeId: "intake-taken",
      });
      expect(mocks.logPRNIntake).toHaveBeenCalledWith({
        medicationId: "prn-one",
      });
    });
  });

  it("queues all supported daily writes while offline and displays pending sync", async () => {
    setOnline(false);
    state.queuedCount = 2;
    render(<TodayContent />);
    expect(screen.getByText(/common\.offlineMode/)).toBeInTheDocument();

    fireEvent.click(getEnabledIntakeButton());
    fireEvent.click(screen.getByText("medication.intake.skipDose"));
    fireEvent.click(screen.getAllByText("medication.prn.logButton")[0]);

    await waitFor(() => expect(mocks.queueAction).toHaveBeenCalledTimes(3));
    expect(mocks.queueAction).toHaveBeenCalledWith(
      "offline-owner",
      expect.objectContaining({ type: "med_skip" }),
    );
    expect(mocks.queueAction).toHaveBeenCalledWith(
      "offline-owner",
      expect.objectContaining({ type: "med_prn_intake" }),
    );
  });

  it("maps daily provider errors through the privacy-safe storage message", async () => {
    mocks.logMedIntake.mockResolvedValue({ serverError: "provider detail" });
    render(<TodayContent />);
    fireEvent.click(getEnabledIntakeButton());
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("offline-storage-error"),
    );
  });

  it.each([
    ["loading", "medication.today.title"],
    ["empty", "medication.today.emptyTitle"],
    ["error", "common.error"],
  ] as const)("renders the daily medication %s state", (mode, expected) => {
    state.mode = mode;
    render(<TodayContent />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
