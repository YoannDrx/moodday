import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  updateOnboardingProgress: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  completeOnboarding: vi.fn(),
  saveMoodEntry: vi.fn(),
  createMedication: vi.fn(),
  inviteCaregiver: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: (variables?: never) => Promise<unknown>;
    onSuccess?: (result: unknown) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutateAsync: async (variables?: never) => options.mutationFn(variables),
    mutate: (variables?: never) => {
      void options
        .mutationFn(variables)
        .then((result) => options.onSuccess?.(result))
        .catch((error) => options.onError?.(error as Error));
    },
  }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));
vi.mock("@/features/preferences/preferences.action", () => ({
  updateOnboardingProgress: mocks.updateOnboardingProgress,
  updateNotificationPreferences: mocks.updateNotificationPreferences,
  completeOnboarding: mocks.completeOnboarding,
}));
vi.mock("@/features/mood/mood.action", () => ({
  saveMoodEntry: mocks.saveMoodEntry,
}));
vi.mock("@/features/medication/medication.action", () => ({
  createMedication: mocks.createMedication,
}));
vi.mock("@/features/caregiver/caregiver.action", () => ({
  inviteCaregiver: mocks.inviteCaregiver,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      switch:{String(checked)}
    </button>
  ),
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
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

import { OnboardingWizard } from "@app/(logged-in)/onboarding/_components/onboarding-wizard";

const renderWizard = (features = { push: true, caregiver: true }) =>
  render(
    <OnboardingWizard
      pushNotificationsEnabled={features.push}
      caregiverSharingEnabled={features.caregiver}
    />,
  );

const next = () =>
  fireEvent.click(screen.getByRole("button", { name: /onboarding\.next/ }));
const advanceToMedication = async () => {
  next();
  await waitFor(() =>
    expect(screen.getByText("onboarding.steps.mood.title")).toBeInTheDocument(),
  );
  next();
  await waitFor(() =>
    expect(
      screen.getByText("onboarding.steps.medications.title"),
    ).toBeInTheDocument(),
  );
};
describe("onboarding wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    mocks.updateOnboardingProgress.mockResolvedValue({ data: {} });
    mocks.updateNotificationPreferences.mockResolvedValue({ data: {} });
    mocks.completeOnboarding.mockResolvedValue({ data: {} });
    mocks.saveMoodEntry.mockResolvedValue({ data: {} });
    mocks.createMedication.mockResolvedValue({ data: {} });
    mocks.inviteCaregiver.mockResolvedValue({ data: {} });
  });

  it("completes the five-step product setup with bounded, explicit data", async () => {
    renderWizard();
    expect(
      screen.getByText("onboarding.steps.welcome.title"),
    ).toBeInTheDocument();
    next();

    const ranges = screen.getAllByRole("slider");
    fireEvent.change(ranges[0], { target: { value: "1" } });
    fireEvent.change(ranges[1], { target: { value: "8" } });
    fireEvent.change(
      screen.getByPlaceholderText("onboarding.mood.notePlaceholder"),
      {
        target: { value: "  Note personnelle  " },
      },
    );
    next();
    await waitFor(() =>
      expect(mocks.saveMoodEntry).toHaveBeenCalledWith({
        value: 1,
        note: "Note personnelle",
        anxiety: 8,
      }),
    );

    fireEvent.change(
      screen.getByPlaceholderText("onboarding.medication.namePlaceholder"),
      {
        target: { value: "  Traitement  " },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("onboarding.medication.dosagePlaceholder"),
      {
        target: { value: "  10 mg  " },
      },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "weekly" },
    });
    next();
    await waitFor(() =>
      expect(mocks.createMedication).toHaveBeenCalledWith({
        name: "Traitement",
        dosage: "10 mg",
        frequency: "weekly",
        operationId: "00000000-0000-4000-8000-000000000001",
      }),
    );

    const switches = screen.getAllByRole("switch");
    switches.forEach((control) => fireEvent.click(control));
    const textInputs = screen.getAllByRole("textbox");
    fireEvent.change(textInputs[0], {
      target: { value: "aidant@moodday.invalid" },
    });
    fireEvent.change(textInputs[1], { target: { value: "Mon aidant" } });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "friend" },
    });
    next();

    await waitFor(() => {
      expect(mocks.updateNotificationPreferences).toHaveBeenCalledWith({
        notificationsEnabled: false,
        dailyCheckInReminder: false,
        dailyCheckInTime: "09:00",
        medicationReminders: false,
        medicationReminderTime: "09:00",
      });
      expect(mocks.inviteCaregiver).toHaveBeenCalledWith({
        email: "aidant@moodday.invalid",
        role: "friend",
        label: "Mon aidant",
      });
    });
    expect(
      screen.getByText("onboarding.steps.ready.title"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /onboarding\.start/ }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("onboarding.complete");
    expect(mocks.updateOnboardingProgress).toHaveBeenLastCalledWith({
      step: 4,
    });
  });

  it("supports explicit skipping of optional medication and preference steps", async () => {
    renderWizard();
    await advanceToMedication();
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    await waitFor(() =>
      expect(
        screen.getByText("onboarding.steps.ready.title"),
      ).toBeInTheDocument(),
    );
    expect(mocks.createMedication).not.toHaveBeenCalled();
    expect(mocks.updateNotificationPreferences).not.toHaveBeenCalled();
  });

  it("rejects partial medication and malformed caregiver data without advancing", async () => {
    renderWizard();
    await advanceToMedication();
    fireEvent.change(
      screen.getByPlaceholderText("onboarding.medication.namePlaceholder"),
      {
        target: { value: "Traitement" },
      },
    );
    next();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "onboarding.errors.missingMedicationInfo",
    );
    expect(
      screen.getByText("onboarding.steps.medications.title"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "not-an-email" },
    });
    next();
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "onboarding.errors.invalidInviteEmail",
      ),
    );
    expect(mocks.inviteCaregiver).not.toHaveBeenCalled();
    expect(
      screen.getByText("onboarding.steps.preferences.title"),
    ).toBeInTheDocument();
  });

  it("surfaces action and completion failures through stable messages", async () => {
    mocks.saveMoodEntry.mockResolvedValue({ serverError: "Mood refused" });
    renderWizard();
    next();
    next();
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Mood refused"),
    );
    expect(screen.getByText("onboarding.steps.mood.title")).toBeInTheDocument();
  });

  it("maps non-Error failures and completion errors without navigation", async () => {
    mocks.saveMoodEntry.mockRejectedValue("unexpected");
    const first = renderWizard();
    next();
    next();
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("common.unexpectedError"),
    );
    first.unmount();

    vi.clearAllMocks();
    mocks.saveMoodEntry.mockResolvedValue({ data: {} });
    mocks.updateOnboardingProgress.mockResolvedValue({ data: {} });
    mocks.completeOnboarding.mockResolvedValue({
      serverError: "Completion refused",
    });
    renderWizard();
    next();
    next();
    await waitFor(() =>
      expect(
        screen.getByText("onboarding.steps.medications.title"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    fireEvent.click(screen.getByRole("button", { name: /onboarding\.start/ }));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Completion refused"),
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("omits unavailable push and caregiver setup and never calls their actions", async () => {
    renderWizard({ push: false, caregiver: false });
    next();
    next();
    await waitFor(() =>
      expect(
        screen.getByText("onboarding.steps.medications.title"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));

    expect(
      screen.getByText("onboarding.steps.ready.title"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("onboarding.steps.preferences.title"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(mocks.updateNotificationPreferences).not.toHaveBeenCalled();
    expect(mocks.inviteCaregiver).not.toHaveBeenCalled();
  });

  it("keeps push and caregiver onboarding controls independently gated", async () => {
    const pushOnly = renderWizard({ push: true, caregiver: false });
    await advanceToMedication();
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    expect(screen.getAllByRole("switch")).toHaveLength(3);
    expect(
      screen.queryByPlaceholderText(
        "onboarding.preferences.invite.emailPlaceholder",
      ),
    ).not.toBeInTheDocument();
    pushOnly.unmount();

    renderWizard({ push: false, caregiver: true });
    await advanceToMedication();
    fireEvent.click(screen.getByRole("button", { name: "onboarding.skip" }));
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "onboarding.preferences.invite.emailPlaceholder",
      ),
    ).toBeInTheDocument();
  });
});
