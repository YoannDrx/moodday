import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "active" as "active" | "archived" | "loading" | "error" | "missing",
}));
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  archiveMedication: vi.fn(),
  unarchiveMedication: vi.fn(),
  adjustMedicationStock: vi.fn(),
}));

const baseMedication = {
  id: "medication-1",
  name: "Traitement hebdomadaire",
  dosage: "10 mg",
  frequency: "weekly",
  isPRN: false,
  isArchived: false,
  scheduleTimes: ["08:30"],
  weeklyDay: 3,
  createdAt: "2026-08-01T12:00:00.000Z",
  startDate: "2026-08-01",
  endDate: null,
  stockQuantity: "3",
  lowStockThreshold: "5",
  inventoryEvents: [
    { id: "event-1", quantityDelta: "10", occurredAt: "2026-08-10T10:00:00Z" },
  ],
  intakeRevisions: [
    {
      id: "revision-cancel",
      action: "cancelled",
      createdAt: "2026-08-11T10:00:00Z",
    },
    {
      id: "revision-correct",
      action: "corrected",
      createdAt: "2026-08-12T10:00:00Z",
    },
  ],
  history: [{ id: "history-1", dosage: "5 mg" }],
  scheduleRevisions: [
    {
      id: "schedule-1",
      effectiveDate: "2026-08-01",
      dosage: "10 mg",
      frequency: "weekly",
      scheduleTimes: ["08:30"],
    },
  ],
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: () => ({
    data:
      state.mode === "active"
        ? baseMedication
        : state.mode === "archived"
          ? { ...baseMedication, isArchived: true }
          : undefined,
    isLoading: state.mode === "loading",
    isError: state.mode === "error",
  }),
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onError: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: () => {
      void options.mutationFn().then(options.onSuccess).catch(options.onError);
    },
  }),
}));
vi.mock("@/features/medication/medication.action", () => ({
  getMedicationById: vi.fn(),
  archiveMedication: mocks.archiveMedication,
  unarchiveMedication: mocks.unarchiveMedication,
  adjustMedicationStock: mocks.adjustMedicationStock,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/dosage-timeline", () => ({
  DosageTimeline: ({ history }: { history: unknown[] }) => (
    <div>dosage-timeline:{history.length}</div>
  ),
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { MedicationDetail } from "@app/(logged-in)/(patient-layout)/medications/[id]/_components/medication-detail";

describe("medication detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = "active";
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000004")
      .mockReturnValue("00000000-0000-4000-8000-000000000005");
    mocks.archiveMedication.mockResolvedValue({ data: { archived: true } });
    mocks.unarchiveMedication.mockResolvedValue({ data: { archived: false } });
    mocks.adjustMedicationStock.mockResolvedValue({
      data: { stockQuantity: 8 },
    });
  });

  it("renders lifecycle, low stock and immutable histories", () => {
    render(<MedicationDetail medicationId="medication-1" />);
    expect(screen.getByText("Traitement hebdomadaire")).toBeInTheDocument();
    expect(screen.getByText("medication.detail.lowStock")).toBeInTheDocument();
    expect(
      screen.getByText(/medication.weekDay.wednesday/),
    ).toBeInTheDocument();
    expect(screen.getByText("dosage-timeline:1")).toBeInTheDocument();
    expect(
      screen.getByText("medication.detail.scheduleHistory"),
    ).toBeInTheDocument();
    expect(screen.getByText(/medication.detail.cancelled/)).toBeInTheDocument();
    expect(screen.getByText(/medication.detail.corrected/)).toBeInTheDocument();
  });

  it("records a stock correction with an idempotency key", async () => {
    render(<MedicationDetail medicationId="medication-1" />);
    fireEvent.change(
      screen.getByLabelText("medication.detail.inventoryDelta"),
      {
        target: { value: "-2.5" },
      },
    );
    fireEvent.change(
      screen.getByLabelText("medication.detail.inventoryReason"),
      {
        target: { value: "correction" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "medication.detail.applyInventory" }),
    );

    await waitFor(() =>
      expect(mocks.adjustMedicationStock).toHaveBeenCalledWith({
        medicationId: "medication-1",
        quantityDelta: -2.5,
        reason: "correction",
        operationId: "00000000-0000-4000-8000-000000000004",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "medication.detail.inventoryUpdated",
    );
    expect(
      screen.getByLabelText("medication.detail.inventoryDelta"),
    ).toHaveValue(null);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["medication", "medication-1"],
    });
  });

  it("rejects zero inventory adjustments and surfaces server errors", async () => {
    render(<MedicationDetail medicationId="medication-1" />);
    const input = screen.getByLabelText("medication.detail.inventoryDelta");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(
      screen.getByRole("button", { name: "medication.detail.applyInventory" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "medication.detail.inventoryDeltaInvalid",
      ),
    );
    expect(mocks.adjustMedicationStock).not.toHaveBeenCalled();

    mocks.adjustMedicationStock.mockResolvedValue({
      serverError: "Stock refused",
    });
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.click(
      screen.getByRole("button", { name: "medication.detail.applyInventory" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Stock refused"),
    );
  });

  it("archives and restores with the appropriate cache invalidation", async () => {
    const view = render(<MedicationDetail medicationId="medication-1" />);
    const archiveButtons = screen.getAllByRole("button", {
      name: "medication.archive.confirm",
    });
    fireEvent.click(archiveButtons[archiveButtons.length - 1]);
    await waitFor(() =>
      expect(mocks.archiveMedication).toHaveBeenCalledWith({
        id: "medication-1",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/medications");

    state.mode = "archived";
    view.rerender(<MedicationDetail medicationId="medication-1" />);
    fireEvent.click(
      screen.getByRole("button", { name: "medication.detail.restore" }),
    );
    await waitFor(() =>
      expect(mocks.unarchiveMedication).toHaveBeenCalledWith({
        id: "medication-1",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "medication.unarchive.success",
    );
  });

  it("renders loading, unavailable and missing states", () => {
    state.mode = "loading";
    const view = render(<MedicationDetail medicationId="medication-1" />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]'),
    ).not.toHaveLength(0);
    state.mode = "error";
    view.rerender(<MedicationDetail medicationId="medication-1" />);
    expect(screen.getByText("common.error")).toBeInTheDocument();
    state.mode = "missing";
    view.rerender(<MedicationDetail medicationId="medication-1" />);
    expect(screen.getByText("common.error")).toBeInTheDocument();
  });
});
