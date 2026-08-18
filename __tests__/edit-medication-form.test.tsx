import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "ready" as "ready" | "loading" | "error" | "missing",
}));
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  updateMedication: vi.fn(),
}));

const medication = {
  id: "medication-1",
  name: "Traitement initial",
  dosage: "5 mg",
  frequency: "daily",
  isPRN: false,
  scheduleTimes: ["09:00"],
  weeklyDay: null,
  startDate: "2026-08-01",
  endDate: null,
  stockQuantity: "20",
  unitsPerDose: "1",
  lowStockThreshold: "4",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: () => ({
    data: state.mode === "ready" ? medication : undefined,
    isLoading: state.mode === "loading",
    isError: state.mode === "error",
  }),
  useMutation: (options: {
    mutationFn: (variables: Record<string, unknown>) => Promise<unknown>;
    onSuccess: (result: unknown) => void;
    onError: (error: Error) => void;
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
vi.mock("@/features/medication/medication.action", () => ({
  getMedicationById: vi.fn(),
  updateMedication: mocks.updateMedication,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
}));

import { EditMedicationForm } from "@app/(logged-in)/(patient-layout)/medications/[id]/edit/_components/edit-medication-form";

const submitForm = () => {
  const form = document.querySelector("form");
  if (!form) throw new Error("Medication edit form was not rendered");
  fireEvent.submit(form);
};

describe("edit medication form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.mode = "ready";
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000003",
    );
    mocks.updateMedication.mockResolvedValue({ data: medication });
  });

  it("updates the schedule, lifecycle, inventory and revision reason", async () => {
    render(<EditMedicationForm medicationId="medication-1" />);
    fireEvent.change(
      screen.getByPlaceholderText("medication.form.namePlaceholder"),
      {
        target: { value: "Traitement modifié" },
      },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "weekly" },
    });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "2" } });
    fireEvent.change(screen.getByDisplayValue("09:00"), {
      target: { value: "07:45" },
    });
    const dates =
      document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dates[1], { target: { value: "2027-01-31" } });
    const numbers = screen.getAllByRole("spinbutton");
    fireEvent.change(numbers[0], { target: { value: "42" } });
    fireEvent.change(numbers[1], { target: { value: "2" } });
    fireEvent.change(numbers[2], { target: { value: "7" } });
    fireEvent.change(
      screen.getByPlaceholderText("medication.form.changeReasonHint"),
      {
        target: { value: "Ordonnance mise à jour" },
      },
    );
    submitForm();

    await waitFor(() =>
      expect(mocks.updateMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "medication-1",
          name: "Traitement modifié",
          frequency: "weekly",
          scheduleTimes: ["07:45"],
          weeklyDay: 2,
          endDate: "2027-01-31",
          stockQuantity: 42,
          unitsPerDose: 2,
          lowStockThreshold: 7,
          reason: "Ordonnance mise à jour",
          operationId: "00000000-0000-4000-8000-000000000003",
        }),
      ),
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["medications"],
    });
    expect(mocks.push).toHaveBeenCalledWith("/medications/medication-1");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("medication.edit.success");
  });

  it("turns an edited treatment into PRN and supports cancellation", async () => {
    render(<EditMedicationForm medicationId="medication-1" />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "prn" },
    });
    expect(
      screen.queryByText("medication.form.scheduleTitle"),
    ).not.toBeInTheDocument();
    submitForm();
    await waitFor(() =>
      expect(mocks.updateMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: "prn",
          isPRN: true,
          scheduleTimes: [],
          weeklyDay: null,
        }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "actions.cancel" }));
    expect(mocks.back).toHaveBeenCalled();
  });

  it("renders loading, error and missing-data states", () => {
    state.mode = "loading";
    const view = render(<EditMedicationForm medicationId="medication-1" />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]'),
    ).not.toHaveLength(0);
    state.mode = "error";
    view.rerender(<EditMedicationForm medicationId="medication-1" />);
    expect(screen.getByText("common.error")).toBeInTheDocument();
    state.mode = "missing";
    view.rerender(<EditMedicationForm medicationId="medication-1" />);
    expect(screen.getByText("common.error")).toBeInTheDocument();
  });

  it("surfaces a stable server error without navigating", async () => {
    mocks.updateMedication.mockResolvedValue({ serverError: "Update refused" });
    render(<EditMedicationForm medicationId="medication-1" />);
    submitForm();
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Update refused"),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
