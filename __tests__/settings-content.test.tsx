import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  loading: false,
  notificationsEnabled: true,
  notificationPermission: "granted" as NotificationPermission,
  theme: "light",
}));
const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  setTheme: vi.fn(),
  setPushContentMode: vi.fn(),
  requestPermission: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  setAiInsightsConsent: vi.fn(),
  updateProfile: vi.fn(),
  updateDisplayPreferences: vi.fn(),
  openStripePortalAction: vi.fn(),
  cancelSubscriptionAction: vi.fn(),
}));

const preferences = {
  notificationsEnabled: true,
  dailyCheckInReminder: true,
  dailyCheckInTime: "08:00",
  medicationReminders: true,
  medicationReminderTime: "20:00",
  timezone: "Pacific/Auckland",
  theme: "dark",
  defaultChartPeriod: 30,
};
const subscription = {
  plan: "plus",
  status: "active",
  periodEnd: "2026-09-13T00:00:00.000Z",
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey[0];
    const data =
      key === "email-preferences"
        ? { available: true, unsubscribed: false }
        : key === "subscription-summary"
          ? subscription
          : {
              ...preferences,
              notificationsEnabled: state.notificationsEnabled,
            };
    return { data, isLoading: state.loading };
  },
  useMutation: (options: {
    mutationFn: (variables?: never) => Promise<unknown>;
    onSuccess?: (result: unknown, variables?: never) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: (variables?: never) => {
      void options
        .mutationFn(variables)
        .then((result) => options.onSuccess?.(result, variables))
        .catch((error: Error) => options.onError?.(error));
    },
  }),
}));
vi.mock("@/features/preferences/preferences.action", () => ({
  getUserPreferences: vi.fn(),
  updateNotificationPreferences: mocks.updateNotificationPreferences,
  updateDisplayPreferences: mocks.updateDisplayPreferences,
}));
vi.mock("@/features/insights/ai-insight.action", () => ({
  setAiInsightsConsent: mocks.setAiInsightsConsent,
}));
vi.mock("@/features/profile/profile.action", () => ({
  updateProfile: mocks.updateProfile,
  getSubscriptionSummary: vi.fn(),
}));
vi.mock(
  "@app/(logged-in)/(account-layout)/account/billing/billing.action",
  () => ({
    openStripePortalAction: mocks.openStripePortalAction,
    cancelSubscriptionAction: mocks.cancelSubscriptionAction,
  }),
);
vi.mock("@/lib/actions/actions-utils", () => ({
  resolveActionResult: async (
    promise: Promise<{ data?: unknown; serverError?: string }>,
  ) => {
    const result = await promise;
    if (result.serverError) throw new Error(result.serverError);
    return result.data;
  },
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-settings",
        name: "Alice",
        email: "alice@example.test",
        image: null,
      },
    },
  }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: state.theme, setTheme: mocks.setTheme }),
}));
vi.mock("@/features/pwa/push-content-mode", () => ({
  getPushContentMode: () => "generic",
  setPushContentMode: mocks.setPushContentMode,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    locale: "fr",
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    tm: (key: string) =>
      key === "settings.subscription.features"
        ? ["Feature A", "Feature B"]
        : [],
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@/components/nowts/page-layout", () => ({
  PageLayout: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
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
    disabled,
    onCheckedChange,
    ...props
  }: {
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      aria-label={props["aria-label"]}
    >
      switch
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
vi.mock("@/features/images/image-form-item", () => ({
  ImageFormItem: ({ onChange }: { onChange: (url: string) => void }) => (
    <button
      type="button"
      onClick={() => onChange("https://cdn.test/avatar.png")}
    >
      image-picker
    </button>
  ),
}));
vi.mock(
  "@app/(logged-in)/(account-layout)/account/danger/delete-account-form",
  () => ({
    DeleteAccountForm: () => <div>delete-account-form</div>,
  }),
);
vi.mock(
  "@app/(logged-in)/(account-layout)/account/email/toggle-email-checkbox",
  () => ({
    ToggleEmailCheckbox: ({ unsubscribed }: { unsubscribed: boolean }) => (
      <div>email-toggle:{String(unsubscribed)}</div>
    ),
  }),
);
vi.mock(
  "@app/(logged-in)/(account-layout)/account/email/mail-account.action",
  () => ({
    getEmailPreferencesAction: vi.fn(),
  }),
);

import { AppearanceContent } from "@app/(logged-in)/(patient-layout)/settings/appearance/_components/appearance-content";
import { NotificationsContent } from "@app/(logged-in)/(patient-layout)/settings/notifications/_components/notifications-content";
import { PrivacyContent } from "@app/(logged-in)/(patient-layout)/settings/privacy/_components/privacy-content";
import { ProfileContent } from "@app/(logged-in)/(patient-layout)/settings/profile/_components/profile-content";
import { SubscriptionContent } from "@app/(logged-in)/(patient-layout)/settings/subscription/_components/subscription-content";

describe("production settings surfaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.loading = false;
    state.notificationsEnabled = true;
    state.notificationPermission = "granted";
    state.theme = "light";
    mocks.updateNotificationPreferences.mockResolvedValue({
      data: preferences,
    });
    mocks.setAiInsightsConsent.mockResolvedValue({ data: { accepted: true } });
    mocks.updateProfile.mockResolvedValue({ serverError: "Profile refused" });
    mocks.updateDisplayPreferences.mockResolvedValue({ data: preferences });
    mocks.openStripePortalAction.mockResolvedValue({ data: {} });
    mocks.cancelSubscriptionAction.mockResolvedValue({ data: {} });
    mocks.requestPermission.mockImplementation(
      async () => state.notificationPermission,
    );
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        get permission() {
          return "default";
        },
        requestPermission: mocks.requestPermission,
      },
    });
  });

  it("updates all notification choices and the per-device privacy mode", async () => {
    render(<NotificationsContent />);
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(4);
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    fireEvent.click(switches[2]);
    fireEvent.click(switches[3]);
    const times =
      document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    fireEvent.change(times[0], { target: { value: "07:15" } });
    fireEvent.change(times[1], { target: { value: "21:30" } });

    await waitFor(() =>
      expect(mocks.updateNotificationPreferences).toHaveBeenCalledTimes(5),
    );
    expect(mocks.updateNotificationPreferences).toHaveBeenCalledWith({
      notificationsEnabled: false,
    });
    expect(mocks.updateNotificationPreferences).toHaveBeenCalledWith({
      dailyCheckInTime: "07:15",
    });
    expect(mocks.setPushContentMode).toHaveBeenCalledWith(
      "user-settings",
      "detailed",
    );
    expect(screen.getByText("email-toggle:false")).toBeInTheDocument();
  });

  it("does not enable push when browser permission is denied", async () => {
    state.notificationsEnabled = false;
    state.notificationPermission = "denied";
    render(<NotificationsContent />);
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "settings.notifications.permissionDenied",
      ),
    );
    expect(mocks.updateNotificationPreferences).not.toHaveBeenCalled();
  });

  it("stores independent AI and journal-note consents", async () => {
    render(
      <PrivacyContent
        initialAiEnabled
        initialJournalNotesEnabled={false}
        aiAvailable
        importAvailable
      />,
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "settings.privacy.aiNotes" }),
    );
    await waitFor(() =>
      expect(mocks.setAiInsightsConsent).toHaveBeenCalledWith({
        enabled: true,
        includeJournalNotes: true,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("settings.privacy.aiSaved");
    expect(
      screen.getByRole("link", { name: /Import contrôlé/ }),
    ).toHaveAttribute("href", "/settings/import");
    expect(
      screen.getByRole("link", { name: /settings\.privacy\.exportJson/ }),
    ).toHaveAttribute("download");
  });

  it("keeps unavailable privacy capabilities out of the interface", () => {
    render(
      <PrivacyContent
        initialAiEnabled={false}
        initialJournalNotesEnabled={false}
        aiAvailable={false}
        importAvailable={false}
      />,
    );
    expect(
      screen.queryByText("settings.privacy.aiTitle"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Import contrôlé")).not.toBeInTheDocument();
    expect(screen.getByText("delete-account-form")).toBeInTheDocument();
  });

  it("updates theme and the bounded chart period", async () => {
    render(<AppearanceContent />);
    fireEvent.click(screen.getByRole("button", { name: "theme.zen" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "90" } });
    await waitFor(() =>
      expect(mocks.updateDisplayPreferences).toHaveBeenCalledWith({
        theme: "zen",
      }),
    );
    expect(mocks.updateDisplayPreferences).toHaveBeenCalledWith({
      defaultChartPeriod: 90,
    });
    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(mocks.setTheme).toHaveBeenCalledWith("zen");
  });

  it("validates profile payloads and preserves a custom IANA timezone", async () => {
    render(<ProfileContent />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByDisplayValue("Alice"), {
      target: { value: "Alice Martin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "image-picker" }));
    fireEvent.click(
      screen.getByRole("button", { name: "settings.profile.save" }),
    );
    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        name: "Alice Martin",
        timezone: "Pacific/Auckland",
        image: "https://cdn.test/avatar.png",
      }),
    );
    expect(mocks.toastError).toHaveBeenCalledWith("Profile refused");
  });

  it("renders subscription state and routes portal actions through the server", async () => {
    render(<SubscriptionContent />);
    expect(
      screen.getByText(/settings.subscription.status.active/),
    ).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "settings.subscription.changePlan" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "actions.cancel" }));
    await waitFor(() =>
      expect(mocks.openStripePortalAction).toHaveBeenCalled(),
    );
    expect(mocks.cancelSubscriptionAction).toHaveBeenCalled();
  });

  it("masks all subscription actions while billing is unavailable", () => {
    render(<SubscriptionContent billingEnabled={false} />);
    expect(
      screen.getByText("settings.subscription.unavailableTitle"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "settings.subscription.changePlan",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "actions.cancel" }),
    ).not.toBeInTheDocument();
    expect(mocks.openStripePortalAction).not.toHaveBeenCalled();
    expect(mocks.cancelSubscriptionAction).not.toHaveBeenCalled();
  });

  it("uses loading placeholders for asynchronous settings", () => {
    state.loading = true;
    const { rerender } = render(<NotificationsContent />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]'),
    ).not.toHaveLength(0);
    rerender(<AppearanceContent />);
    rerender(<ProfileContent />);
    rerender(<SubscriptionContent />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]'),
    ).not.toHaveLength(0);
  });
});
