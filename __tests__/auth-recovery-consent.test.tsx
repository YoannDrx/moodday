import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "fr" as "fr" | "en" }));
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  executeConsent: vi.fn(),
  resetPassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  verifyTotp: vi.fn(),
  verifyBackupCode: vi.fn(),
  deleteUser: vi.fn(),
  unsubscribeCurrentPush: vi.fn(),
  purgeOfflineDataForOwner: vi.fn(),
  purgeAuthenticatedBrowserCaches: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: (variables?: never) => Promise<unknown>;
    onSuccess?: (result: unknown) => void;
    onError?: (error: Error) => void;
  }) => ({
    isPending: false,
    mutate: (variables?: never) => {
      void options
        .mutationFn(variables)
        .then((result) => options.onSuccess?.(result))
        .catch((error: Error) => options.onError?.(error));
    },
  }),
}));
vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({ execute: mocks.executeConsent, isPending: false }),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    resetPassword: mocks.resetPassword,
    requestPasswordReset: mocks.requestPasswordReset,
    deleteUser: mocks.deleteUser,
    twoFactor: {
      verifyTotp: mocks.verifyTotp,
      verifyBackupCode: mocks.verifyBackupCode,
    },
  },
  useSession: () => ({ data: { user: { id: "delete-owner" } } }),
}));
vi.mock("@/features/pwa/offline-store", () => ({
  purgeOfflineDataForOwner: mocks.purgeOfflineDataForOwner,
}));
vi.mock("@/features/pwa/push-client", () => ({
  unsubscribeCurrentPush: mocks.unsubscribeCurrentPush,
  purgeAuthenticatedBrowserCaches: mocks.purgeAuthenticatedBrowserCaches,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ locale: state.locale, t: (key: string) => key }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock("@app/auth/consent/consent.action", () => ({
  acceptRequiredConsents: vi.fn(),
}));

import { ConfirmDeletePage } from "@app/auth/confirm-delete/confirm-delete-page";
import { ConsentForm } from "@app/auth/consent/consent-form";
import { ForgetPasswordPage } from "@app/auth/forget-password/forget-password-page";
import { ResetPasswordPage } from "@app/auth/reset-password/reset-password-page";
import { TwoFactorChallenge } from "@app/auth/two-factor/two-factor-challenge";

describe("auth recovery, consent and deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.locale = "fr";
    mocks.resetPassword.mockResolvedValue({ data: { status: true } });
    mocks.requestPasswordReset.mockResolvedValue({ data: { status: true } });
    mocks.verifyTotp.mockResolvedValue({ data: { token: "ok" } });
    mocks.verifyBackupCode.mockResolvedValue({ data: { token: "ok" } });
    mocks.deleteUser.mockRejectedValue(new Error("Deletion refused"));
    mocks.unsubscribeCurrentPush.mockResolvedValue(undefined);
    mocks.purgeOfflineDataForOwner.mockResolvedValue(undefined);
    mocks.purgeAuthenticatedBrowserCaches.mockResolvedValue(undefined);
  });

  it("requests a non-enumerating password reset", async () => {
    render(<ForgetPasswordPage />);
    fireEvent.change(
      screen.getByPlaceholderText("auth.form.emailPlaceholder"),
      {
        target: { value: "alice@example.test" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "auth.forgetPassword.submit" }),
    );
    await waitFor(() =>
      expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
        email: "alice@example.test",
        redirectTo: "/auth/reset-password",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/auth/verify");
  });

  it("validates and submits a replacement password", async () => {
    const view = render(<ResetPasswordPage token="reset-token" />);
    fireEvent.change(
      screen.getByPlaceholderText("auth.resetPassword.passwordPlaceholder"),
      {
        target: { value: "short" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "auth.resetPassword.submit" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText("auth.resetPassword.passwordMin"),
      ).toBeInTheDocument(),
    );
    fireEvent.change(
      screen.getByPlaceholderText("auth.resetPassword.passwordPlaceholder"),
      {
        target: { value: "LongPassword!123" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "auth.resetPassword.submit" }),
    );
    await waitFor(() =>
      expect(mocks.resetPassword).toHaveBeenCalledWith({
        token: "reset-token",
        newPassword: "LongPassword!123",
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/auth/signin");
    view.unmount();

    render(<ResetPasswordPage token="" />);
    expect(mocks.push).toHaveBeenCalledWith("/auth/forget-password");
  });

  it("supports TOTP and one-time recovery codes", async () => {
    const view = render(<TwoFactorChallenge />);
    const input = screen.getByLabelText("Code TOTP");
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() =>
      expect(mocks.verifyTotp).toHaveBeenCalledWith({
        code: "123456",
        trustDevice: false,
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");

    fireEvent.click(
      screen.getByRole("button", { name: "Utiliser un code de récupération" }),
    );
    fireEvent.change(screen.getByLabelText("Code de récupération"), {
      target: { value: " RECOVERY-1 " },
    });
    mocks.verifyBackupCode.mockResolvedValueOnce({
      error: { message: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() =>
      expect(mocks.verifyBackupCode).toHaveBeenCalledWith({
        code: "RECOVERY-1",
        trustDevice: false,
      }),
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Le code est invalide ou expiré.",
    );
    view.unmount();
  });

  it("requires all four versioned consent decisions", () => {
    state.locale = "en";
    render(<ConsentForm />);
    const submit = screen.getByRole("button", { name: "Accept and continue" });
    expect(submit).toBeDisabled();
    for (const checkbox of screen.getAllByRole("checkbox"))
      fireEvent.click(checkbox);
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(mocks.executeConsent).toHaveBeenCalledWith({
      age18Accepted: true,
      termsAccepted: true,
      privacyAccepted: true,
      healthDataConsentAccepted: true,
      locale: "en",
    });
  });

  it("rejects invalid deletion links and keeps failures recoverable", async () => {
    const view = render(<ConfirmDeletePage />);
    expect(mocks.push).toHaveBeenCalledWith("/settings/privacy");
    view.unmount();

    render(<ConfirmDeletePage token="delete-token" />);
    fireEvent.click(
      screen.getByRole("button", { name: "auth.confirmDelete.confirm" }),
    );
    await waitFor(() =>
      expect(mocks.deleteUser).toHaveBeenCalledWith({ token: "delete-token" }),
    );
    expect(mocks.toastError).toHaveBeenCalledWith("Deletion refused");
    expect(screen.getByText("Deletion refused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.cancel" }));
    expect(mocks.push).toHaveBeenCalledWith("/settings/privacy");
  });
});
