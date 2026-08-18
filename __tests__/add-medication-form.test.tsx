import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  createMedication: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
}));
vi.mock("@tanstack/react-query", () => ({
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
  createMedication: mocks.createMedication,
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
    defaultValue,
    onValueChange,
    children,
  }: {
    value?: string;
    defaultValue?: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      value={value}
      defaultValue={defaultValue}
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

import { AddMedicationForm } from "@app/(logged-in)/(patient-layout)/medications/new/_components/add-medication-form";

const fillIdentity = () => {
  fireEvent.change(
    screen.getByPlaceholderText("medication.form.namePlaceholder"),
    {
      target: { value: "Traitement" },
    },
  );
  fireEvent.change(
    screen.getByPlaceholderText("medication.form.dosagePlaceholder"),
    {
      target: { value: "10 mg" },
    },
  );
};

describe("add medication form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000002",
    );
    mocks.createMedication.mockResolvedValue({
      data: { id: "medication-new" },
    });
  });

  it("creates a weekly treatment with lifecycle and optional inventory", async () => {
    render(<AddMedicationForm />);
    fillIdentity();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "weekly" },
    });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "3" } });

    const time = screen.getByDisplayValue("09:00");
    fireEvent.change(time, { target: { value: "08:30" } });
    const dates =
      document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dates[1], { target: { value: "2026-12-31" } });
    const numbers = screen.getAllByRole("spinbutton");
    fireEvent.change(numbers[0], { target: { value: "30" } });
    fireEvent.change(numbers[1], { target: { value: "1.5" } });
    fireEvent.change(numbers[2], { target: { value: "5" } });
    const form = document.querySelector("form");
    if (!form) {
      throw new Error("Medication form was not rendered");
    }
    // JSDOM incorrectly flags decimal `step` values as native-invalid here.
    // Submitting the form directly still exercises React Hook Form + Zod.
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.createMedication).toHaveBeenCalled());
    expect(mocks.createMedication).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Traitement",
        dosage: "10 mg",
        frequency: "weekly",
        scheduleTimes: ["08:30"],
        weeklyDay: 3,
        endDate: "2026-12-31",
        stockQuantity: 30,
        unitsPerDose: 1.5,
        lowStockThreshold: 5,
        operationId: "00000000-0000-4000-8000-000000000002",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("medication.add.success");
    expect(mocks.push).toHaveBeenCalledWith("/medications");
  });

  it("normalizes twice-daily slots and clears empty optional fields", async () => {
    render(<AddMedicationForm />);
    fillIdentity();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "twice_daily" },
    });
    const times =
      document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    expect(times).toHaveLength(2);
    fireEvent.change(times[0], { target: { value: "07:00" } });
    fireEvent.change(times[1], { target: { value: "20:00" } });
    fireEvent.click(
      screen.getByRole("button", { name: "medication.add.submit" }),
    );
    await waitFor(() =>
      expect(mocks.createMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: "twice_daily",
          scheduleTimes: ["07:00", "20:00"],
          endDate: null,
          stockQuantity: null,
          unitsPerDose: null,
          lowStockThreshold: null,
        }),
      ),
    );
  });

  it("turns PRN into an explicit unscheduled treatment", async () => {
    render(<AddMedicationForm />);
    fillIdentity();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "prn" },
    });
    expect(
      screen.queryByText("medication.form.scheduleTitle"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "medication.add.submit" }),
    );
    await waitFor(() =>
      expect(mocks.createMedication).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: "prn",
          isPRN: true,
          scheduleTimes: [],
          weeklyDay: null,
        }),
      ),
    );
  });

  it("blocks invalid required data and keeps cancellation local", async () => {
    render(<AddMedicationForm />);
    fireEvent.click(
      screen.getByRole("button", { name: "medication.add.submit" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("medication.validation.nameRequired"),
      ).toBeInTheDocument(),
    );
    expect(mocks.createMedication).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "actions.cancel" }));
    expect(mocks.back).toHaveBeenCalled();
  });

  it("surfaces server errors without navigating", async () => {
    mocks.createMedication.mockResolvedValue({
      serverError: "Creation refused",
    });
    render(<AddMedicationForm />);
    fillIdentity();
    fireEvent.click(
      screen.getByRole("button", { name: "medication.add.submit" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Creation refused"),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
