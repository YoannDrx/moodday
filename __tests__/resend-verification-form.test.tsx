import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendVerificationEmail: vi.fn(),
  session: { data: null as null | { user: { email: string } } },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { sendVerificationEmail: mocks.sendVerificationEmail },
  useSession: () => mocks.session,
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}));

import { ResendVerificationForm } from "../app/auth/verify/resend-verification-form";

describe("ResendVerificationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.data = null;
  });

  it("asks for the address when signed out and confirms the resend", async () => {
    mocks.sendVerificationEmail.mockResolvedValue({ data: {}, error: null });
    render(<ResendVerificationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText("auth.verify.resendLabel"),
      "new@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "auth.verify.resendSubmit" }),
    );

    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith({
      email: "new@example.com",
      callbackURL: expect.stringContaining("/dashboard"),
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "auth.verify.resendSent",
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("uses the session address and shows a delivery failure", async () => {
    mocks.session.data = { user: { email: "signed@example.com" } };
    mocks.sendVerificationEmail.mockResolvedValue({
      data: null,
      error: { status: 500, message: "verification_email_delivery_failed" },
    });
    render(<ResendVerificationForm />);

    expect(
      screen.queryByLabelText("auth.verify.resendLabel"),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "auth.verify.resendSubmit" }));

    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "signed@example.com" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "auth.verify.resendFailed",
    );
    expect(
      screen.getByRole("button", { name: "auth.verify.resendSubmit" }),
    ).toBeEnabled();
  });
});
