import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  changePassword: vi.fn(),
  changeEmail: vi.fn(),
  deleteUser: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
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
    mutateAsync: async (variables?: never) => options.mutationFn(variables),
  }),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    changePassword: mocks.changePassword,
    changeEmail: mocks.changeEmail,
    deleteUser: mocks.deleteUser,
  },
  useSession: () => ({ data: { user: { email: "current@example.test" } } }),
}));
vi.mock("@/features/dialog-manager/dialog-manager", () => ({
  dialogManager: { confirm: mocks.confirm },
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
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
import { ChangeEmailForm } from "@app/(logged-in)/(account-layout)/account/change-email/change-email-form";
import { ChangePasswordForm } from "@app/(logged-in)/(account-layout)/account/change-password/change-password-form";
import { DeleteAccountForm } from "@app/(logged-in)/(account-layout)/account/danger/delete-account-form";

describe("account management forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.changePassword.mockResolvedValue({ data: { status: true } });
    mocks.changeEmail.mockResolvedValue({ data: { status: true } });
    mocks.deleteUser.mockResolvedValue({ data: { status: true } });
  });

  it("changes password only after matching validation and can preserve sessions", async () => {
    render(<ChangePasswordForm />);
    fireEvent.change(screen.getByLabelText("account.password.currentLabel"), {
      target: { value: "CurrentPassword!" },
    });
    fireEvent.change(screen.getByLabelText("account.password.newLabel"), {
      target: { value: "NewPassword!123" },
    });
    fireEvent.change(screen.getByLabelText("account.password.confirmLabel"), {
      target: { value: "different-value" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "account.password.submit" }),
    );
    await waitFor(() =>
      expect(screen.getByText("account.password.mismatch")).toBeInTheDocument(),
    );
    expect(mocks.changePassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("account.password.confirmLabel"), {
      target: { value: "NewPassword!123" },
    });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(
      screen.getByRole("button", { name: "account.password.submit" }),
    );
    await waitFor(() =>
      expect(mocks.changePassword).toHaveBeenCalledWith({
        currentPassword: "CurrentPassword!",
        newPassword: "NewPassword!123",
        revokeOtherSessions: false,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("account.password.success");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("validates and changes the verified email address", async () => {
    render(<ChangeEmailForm />);
    const input = screen.getByLabelText("account.email.newLabel");
    const form = input.closest("form");
    if (!form) throw new Error("Change-email form not found");
    expect(input).toHaveValue("current@example.test");
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText("account.email.invalid")).toBeInTheDocument(),
    );
    fireEvent.change(input, { target: { value: "new@example.test" } });
    fireEvent.click(
      screen.getByRole("button", { name: "account.email.changeSubmit" }),
    );
    await waitFor(() =>
      expect(mocks.changeEmail).toHaveBeenCalledWith({
        newEmail: "new@example.test",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("account.email.verifySent");
  });

  it("requires explicit confirmation before requesting account deletion", async () => {
    render(<DeleteAccountForm />);
    fireEvent.click(
      screen.getByRole("button", { name: "account.danger.delete" }),
    );
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    const confirmation = mocks.confirm.mock.calls[0]?.[0] as {
      action: { onClick: () => Promise<void> };
    };
    await confirmation.action.onClick();
    expect(mocks.deleteUser).toHaveBeenCalledWith({
      callbackURL: "/auth/goodbye",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "account.danger.requestedTitle",
      { description: "account.danger.requestedDescription" },
    );
  });
});
