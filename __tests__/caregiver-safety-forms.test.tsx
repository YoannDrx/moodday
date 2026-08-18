import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));
const mocks = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  createObservation: vi.fn(),
  createEvent: vi.fn(),
  saveSafetyPlan: vi.fn(),
  saveEncryptedOfflineSnapshot: vi.fn(),
  onSuccess: vi.fn(),
}));

vi.mock("@/features/caregiver/caregiver.action", () => ({
  createObservation: mocks.createObservation,
  createEvent: mocks.createEvent,
}));
vi.mock("@/features/safety-plan/safety-plan.action", () => ({
  saveSafetyPlan: mocks.saveSafetyPlan,
}));
vi.mock("@/features/pwa/offline-store", () => ({
  saveEncryptedOfflineSnapshot: mocks.saveEncryptedOfflineSnapshot,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: state.locale,
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </main>
  ),
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    defaultValue,
    onValueChange,
    children,
  }: {
    defaultValue?: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      defaultValue={defaultValue ?? ""}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="" disabled>
        select
      </option>
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
  }) => (
    <option value={value}>
      {typeof children === "string" ? children : value}
    </option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
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
      switch
    </button>
  ),
}));
vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    value,
    onValueChange,
  }: {
    value: number[];
    onValueChange: (value: number[]) => void;
  }) => (
    <button
      type="button"
      aria-label={`severity-${value[0]}`}
      onClick={() => onValueChange([5])}
    >
      severity
    </button>
  ),
}));
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    disabled,
  }: {
    onSelect: (date: Date) => void;
    disabled: (date: Date) => boolean;
  }) => (
    <button
      type="button"
      onClick={() => onSelect(new Date("2026-08-10T12:00:00Z"))}
    >
      calendar:{String(disabled(new Date("2019-01-01")))}
    </button>
  ),
}));
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { SafetyPlanEditor } from "@app/(logged-in)/(patient-layout)/safety-plan/safety-plan-editor";
import { CaregiverCheckinForm } from "@/features/caregiver/caregiver-checkin-form";
import { CaregiverEventForm } from "@/features/caregiver/caregiver-event-form";

describe("caregiver contribution and safety forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    mocks.createObservation.mockResolvedValue({
      data: { id: "observation-1" },
    });
    mocks.createEvent.mockResolvedValue({ data: { id: "event-1" } });
    mocks.saveSafetyPlan.mockResolvedValue({ data: { id: "plan-1" } });
    mocks.saveEncryptedOfflineSnapshot.mockResolvedValue(undefined);
  });

  it("creates a bounded caregiver observation with explicit visibility", async () => {
    render(
      <CaregiverCheckinForm
        relationshipId="relationship-1"
        subjectName="Alice"
        onSuccess={mocks.onSuccess}
      />,
    );
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "good" } });
    fireEvent.change(selects[1], { target: { value: "high" } });
    fireEvent.change(selects[2], { target: { value: "engaged" } });
    fireEvent.change(selects[3], { target: { value: "good" } });
    fireEvent.change(
      screen.getByPlaceholderText("caregiver.checkin.notesPlaceholder"),
      {
        target: { value: "Observation factuelle" },
      },
    );
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(
      screen.getByRole("button", { name: "caregiver.checkin.submit" }),
    );

    await waitFor(() =>
      expect(mocks.createObservation).toHaveBeenCalledWith({
        relationshipId: "relationship-1",
        moodObserved: "good",
        energyObserved: "high",
        socialBehavior: "engaged",
        sleepObserved: "good",
        notes: "Observation factuelle",
        visibleToPatient: false,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("caregiver.checkin.saved");
    expect(mocks.onSuccess).toHaveBeenCalled();
  });

  it("creates a dated caregiver event and validates its description", async () => {
    render(
      <CaregiverEventForm
        relationshipId="relationship-1"
        subjectName="Alice"
        onSuccess={mocks.onSuccess}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "milestone" },
    });
    fireEvent.click(screen.getByRole("button", { name: "severity-3" }));
    fireEvent.click(screen.getByRole("button", { name: /calendar:true/ }));
    fireEvent.change(
      screen.getByPlaceholderText("caregiver.event.descriptionPlaceholder"),
      {
        target: { value: "Événement factuel suffisamment détaillé" },
      },
    );
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(
      screen.getByRole("button", { name: "caregiver.event.submit" }),
    );

    await waitFor(() =>
      expect(mocks.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          relationshipId: "relationship-1",
          eventType: "milestone",
          severity: 5,
          description: "Événement factuel suffisamment détaillé",
          visibleToPatient: false,
        }),
      ),
    );
    expect(mocks.createEvent.mock.calls[0]?.[0].eventDate).toContain(
      "2026-08-10",
    );
  });

  it("surfaces caregiver server and network failures", async () => {
    mocks.createObservation.mockResolvedValueOnce({ serverError: "Forbidden" });
    const view = render(
      <CaregiverCheckinForm
        relationshipId="relationship-1"
        subjectName="Alice"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "caregiver.checkin.submit" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Forbidden"),
    );
    view.unmount();

    mocks.createEvent.mockRejectedValueOnce(new Error("network"));
    render(
      <CaregiverEventForm
        relationshipId="relationship-1"
        subjectName="Alice"
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "milestone" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("caregiver.event.descriptionPlaceholder"),
      {
        target: { value: "Description longue et factuelle" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "caregiver.event.submit" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "caregiver.event.saveError",
      ),
    );
  });

  it("normalizes and saves the personal safety plan locally and remotely", async () => {
    const initialPlan = {
      warningSigns: ["Isolement"],
      copingStrategies: ["Respirer"],
      safePlaces: ["Parc"],
      trustedContacts: [{ name: "Bob", detail: "06 00 00 00 00" }],
      professionalContacts: [{ name: "Médecin", detail: "01 00 00 00 00" }],
      lastReviewedAt: new Date("2026-08-01T00:00:00Z"),
    } as never;
    render(<SafetyPlanEditor initialPlan={initialPlan} ownerId="owner-1" />);
    await waitFor(() =>
      expect(mocks.saveEncryptedOfflineSnapshot).toHaveBeenCalledWith(
        "owner-1",
        "safety-plan",
        expect.objectContaining({ warningSigns: ["Isolement"] }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Mes signaux personnels"), {
      target: { value: " Isolement \n\n Fatigue " },
    });
    fireEvent.change(screen.getByLabelText(/Contacts de confiance/), {
      target: { value: "Bob — 06 00\nligne invalide\nAlice - alice@test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enregistrer et marquer comme revu" }),
    );

    await waitFor(() =>
      expect(mocks.saveSafetyPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          warningSigns: ["Isolement", "Fatigue"],
          trustedContacts: [
            { name: "Bob", detail: "06 00" },
            { name: "Alice", detail: "alice@test" },
          ],
          markReviewed: true,
        }),
      ),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Plan enregistré");
  });

  it("keeps safety-plan errors stable and renders the English crisis copy", async () => {
    state.locale = "en";
    mocks.saveSafetyPlan.mockResolvedValue({ serverError: "Plan refused" });
    render(<SafetyPlanEditor initialPlan={null} ownerId="owner-1" />);
    expect(
      screen.getByText("Moodday is not an emergency service"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Save and mark as reviewed" }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Plan refused"),
    );
  });
});
