import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  locale: "fr" as "fr" | "en",
  mode: "rich" as "rich" | "empty" | "loading" | "access-error",
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  inviteCaregiver: vi.fn(),
  updateCaregiverPermissions: vi.fn(),
  updateCaregiverDigestPreferences: vi.fn(),
  removeCaregiverRelationship: vi.fn(),
  mutations: [] as ReturnType<typeof vi.fn>[],
}));

const richData = {
  patients: [
    {
      id: "relationship-patient",
      patientName: "Alice",
      patientEmail: "alice@moodday.invalid",
      patientImage: null,
    },
  ],
  summary: {
    observationsThisWeek: 2,
    observationsThisMonth: 5,
    eventsThisMonth: 3,
    concerningEvents: 1,
  },
  activity: [
    {
      id: "observation-1",
      type: "observation",
      subjectName: "Alice",
      subjectImage: null,
      moodObserved: "good",
      energyObserved: "normal",
      notes: "Journée stable",
      createdAt: "2026-08-12T10:00:00.000Z",
    },
    {
      id: "event-critical",
      type: "event",
      subjectName: "Alice",
      subjectImage: null,
      eventType: "crisis",
      description: "Événement important",
      severity: 4,
      createdAt: "2026-08-11T10:00:00.000Z",
    },
    {
      id: "event-medium",
      type: "event",
      subjectName: "Alice",
      subjectImage: null,
      eventType: "conflict",
      description: "Événement moyen",
      severity: 3,
      createdAt: "2026-08-10T10:00:00.000Z",
    },
    {
      id: "event-low",
      type: "event",
      subjectName: "Alice",
      subjectImage: null,
      eventType: "milestone",
      description: "Événement faible",
      severity: 1,
      createdAt: "2026-08-09T10:00:00.000Z",
    },
  ],
  caregivers: [
    {
      id: "caregiver-active",
      label: "Camille",
      caregiverName: null,
      caregiverEmail: "camille@moodday.invalid",
      caregiverImage: null,
      status: "active",
      role: "family",
      permissions: ["view_mood", "add_observations"],
      moodWindowDays: 30,
      medicationWindowDays: 7,
      accessExpiresAt: "2026-09-01T23:59:59.000Z",
    },
    {
      id: "caregiver-pending",
      label: null,
      caregiverName: "Morgan",
      caregiverEmail: "morgan@moodday.invalid",
      caregiverImage: null,
      status: "pending",
      role: "custom-role",
      permissions: ["view_mood"],
      moodWindowDays: 30,
      medicationWindowDays: 30,
      accessExpiresAt: null,
    },
  ],
  accessLog: [
    {
      id: "access-1",
      caregiverName: "Camille",
      caregiverImage: null,
      resource: "mood_summary",
      accessedAt: "2026-08-13T08:00:00.000Z",
    },
  ],
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey[0];
    const isLoading = state.mode === "loading";
    const empty = state.mode === "empty";
    const data =
      key === "my-patients"
        ? empty
          ? []
          : richData.patients
        : key === "caregiver-summary"
          ? empty
            ? undefined
            : richData.summary
          : key === "caregiver-activity"
            ? empty
              ? []
              : richData.activity
            : key === "my-caregivers"
              ? empty
                ? []
                : richData.caregivers
              : key === "caregiver-access-log"
                ? empty
                  ? []
                  : richData.accessLog
                : key === "caregiver-digest-preferences"
                  ? { enabled: true, frequency: "weekly" }
                  : undefined;
    return {
      data,
      isLoading,
      isError: key === "caregiver-access-log" && state.mode === "access-error",
    };
  },
  useMutation: (options: {
    mutationFn: (value?: string) => Promise<unknown>;
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => {
    const mutate = vi.fn((value?: string) => {
      void options
        .mutationFn(value)
        .then(() => options.onSuccess())
        .catch((error: Error) => options.onError(error));
    });
    mocks.mutations.push(mutate);
    return { mutate, isPending: false };
  },
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
vi.mock("@/features/caregiver/caregiver.action", () => ({
  getCaregiverAccessLog: vi.fn(),
  getCaregiverActivity: vi.fn(),
  getCaregiverDigestPreferences: vi.fn(),
  getCaregiverSummary: vi.fn(),
  getMyCaregivers: vi.fn(),
  getMyPatients: vi.fn(),
  inviteCaregiver: mocks.inviteCaregiver,
  removeCaregiverRelationship: mocks.removeCaregiverRelationship,
  updateCaregiverPermissions: mocks.updateCaregiverPermissions,
  updateCaregiverDigestPreferences: mocks.updateCaregiverDigestPreferences,
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <main>
      <h1>{title}</h1>
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
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
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
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ onValueChange }: { onValueChange: (value: string) => void }) => (
    <button type="button" onClick={() => onValueChange("friend")}>
      choose-friend
    </button>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
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
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { CaregiverContent } from "@app/(logged-in)/(patient-layout)/caregiver/_components/caregiver-content";

describe("caregiver dashboard content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutations.length = 0;
    state.locale = "fr";
    state.mode = "rich";
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.inviteCaregiver.mockResolvedValue({
      data: { id: "relationship-new" },
    });
    mocks.removeCaregiverRelationship.mockResolvedValue({
      data: { success: true },
    });
    mocks.updateCaregiverDigestPreferences.mockResolvedValue({
      data: { enabled: true, frequency: "weekly" },
    });
    mocks.updateCaregiverPermissions.mockResolvedValue({
      data: { id: "caregiver-active" },
    });
  });

  it("renders patient, activity, permission trail and severity states", () => {
    render(<CaregiverContent />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "caregiver.dashboard.title",
    );
    expect(screen.getAllByText("Alice")).not.toHaveLength(0);
    expect(screen.getAllByText("Camille")).not.toHaveLength(0);
    expect(screen.getByText("Journée stable")).toBeInTheDocument();
    expect(screen.getByText("Événement important")).toBeInTheDocument();
    expect(screen.getByText("Événement moyen")).toBeInTheDocument();
    expect(screen.getByText("Événement faible")).toBeInTheDocument();
    expect(
      screen.getByText("caregiver.dashboard.accessLog.moodSummary"),
    ).toBeInTheDocument();
    expect(screen.getByText("caregiver.roles.family")).toBeInTheDocument();
    expect(screen.getByText(/custom-role/)).toBeInTheDocument();
  });

  it("submits a normalized invitation and immediately revokes a relationship", async () => {
    const user = userEvent.setup();
    render(<CaregiverContent />);

    await user.click(
      screen.getByRole("button", {
        name: /caregiver\.dashboard\.actions\.invite\.title/,
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("caregiver.dashboard.inviteDialog.emailLabel"),
      "helper@moodday.invalid",
    );
    await user.type(
      screen.getByLabelText("caregiver.dashboard.inviteDialog.labelLabel"),
      "Mon proche",
    );
    await user.click(screen.getByRole("button", { name: "choose-friend" }));
    await user.click(
      screen.getByRole("button", {
        name: "caregiver.dashboard.inviteDialog.send",
      }),
    );

    await waitFor(() =>
      expect(mocks.inviteCaregiver).toHaveBeenCalledWith({
        email: "helper@moodday.invalid",
        role: "friend",
        label: "Mon proche",
        permissions: ["view_mood", "add_observations", "add_events"],
        moodWindowDays: 30,
        medicationWindowDays: 30,
        accessExpiresAt: undefined,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "caregiver.dashboard.toasts.inviteSent",
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "caregiver.dashboard.circle.removeConfirm",
      })[0],
    );
    await waitFor(() =>
      expect(mocks.removeCaregiverRelationship).toHaveBeenCalledWith({
        relationshipId: "caregiver-active",
      }),
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["caregiver-access-log"],
    });
  });

  it("shows and updates exact permissions, windows and expiry", async () => {
    const user = userEvent.setup();
    render(<CaregiverContent />);

    expect(
      screen.getAllByText("caregiver.dashboard.permissions.viewMood"),
    ).not.toHaveLength(0);
    expect(
      screen.getByText(
        'caregiver.dashboard.permissions.windows:{"mood":30,"medication":7}',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: 'caregiver.dashboard.permissions.manageAccessibleLabel:{"name":"Camille"}',
      }),
    );
    const dialog = screen.getByRole("dialog");
    const medicationPermission = within(dialog).getByRole("checkbox", {
      name: "caregiver.dashboard.permissions.viewMedications",
    });
    await user.click(medicationPermission);
    await user.click(
      within(dialog).getByRole("button", { name: "actions.save" }),
    );

    await waitFor(() =>
      expect(mocks.updateCaregiverPermissions).toHaveBeenCalledWith(
        expect.objectContaining({
          relationshipId: "caregiver-active",
          permissions: ["view_mood", "add_observations", "view_medications"],
          moodWindowDays: 30,
          medicationWindowDays: 7,
          accessExpiresAt: "2026-09-01T23:59:59.000Z",
        }),
      ),
    );
  });

  it("updates the patient-facing access digest preferences", async () => {
    const user = userEvent.setup();
    render(<CaregiverContent />);

    await user.click(
      screen.getByRole("checkbox", {
        name: "caregiver.dashboard.digest.enabled",
      }),
    );
    await waitFor(() =>
      expect(mocks.updateCaregiverDigestPreferences).toHaveBeenCalledWith({
        enabled: false,
        frequency: "weekly",
      }),
    );

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: "caregiver.dashboard.digest.frequency",
      }),
      "daily",
    );
    await waitFor(() =>
      expect(mocks.updateCaregiverDigestPreferences).toHaveBeenCalledWith({
        enabled: true,
        frequency: "daily",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "caregiver.dashboard.digest.saved",
    );
  });

  it("renders empty, loading and access-error states", () => {
    state.mode = "empty";
    const { unmount } = render(<CaregiverContent />);
    expect(
      screen.getByText("caregiver.dashboard.activity.emptyTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("caregiver.dashboard.circle.empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("caregiver.dashboard.accessLog.empty"),
    ).toBeInTheDocument();
    unmount();

    state.mode = "loading";
    const loading = render(<CaregiverContent />);
    expect(
      document.querySelectorAll("[data-slot='skeleton']").length,
    ).toBeGreaterThanOrEqual(0);
    loading.unmount();

    state.mode = "access-error";
    render(<CaregiverContent />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "caregiver.dashboard.accessLog.error",
    );
  });

  it("surfaces invitation errors through a localized toast", async () => {
    mocks.inviteCaregiver.mockResolvedValueOnce({
      serverError: "invite-failed",
    });
    const user = userEvent.setup();
    render(<CaregiverContent />);

    await user.click(
      screen.getByRole("button", {
        name: /caregiver\.dashboard\.actions\.invite\.title/,
      }),
    );
    await user.type(
      screen.getByLabelText("caregiver.dashboard.inviteDialog.emailLabel"),
      "helper@moodday.invalid",
    );
    await user.click(
      screen.getByRole("button", {
        name: "caregiver.dashboard.inviteDialog.send",
      }),
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("invite-failed"),
    );
  });

  it("surfaces revocation errors through a localized toast", async () => {
    mocks.removeCaregiverRelationship.mockResolvedValueOnce({
      serverError: "remove-failed",
    });
    const user = userEvent.setup();
    render(<CaregiverContent />);

    await user.click(
      screen.getAllByRole("button", {
        name: "caregiver.dashboard.circle.removeConfirm",
      })[0],
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("remove-failed"),
    );
  });
});
