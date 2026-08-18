import { ContactSupportForm } from "@/features/contact/support/contact-support-form";
import { contactSupportAction } from "@/features/contact/support/contact-support.action";
import { screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../test/setup";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null }),
}));
vi.mock("@/i18n/provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/contact/support/contact-support.action", () => ({
  contactSupportAction: vi.fn(),
}));

describe("ContactSupportForm", () => {
  it("submits the validated support request and closes the dialog", async () => {
    vi.mocked(contactSupportAction).mockResolvedValue({
      data: { message: "sent" },
    } as never);
    const onSuccess = vi.fn();
    const { user } = setup(<ContactSupportForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("auth.form.email"), "me@example.com");
    await user.type(screen.getByLabelText("support.subject"), "Question");
    await user.type(screen.getByLabelText("support.message"), "Bonjour");
    await user.click(screen.getByRole("button", { name: "support.send" }));

    await waitFor(() =>
      expect(contactSupportAction).toHaveBeenCalledWith({
        email: "me@example.com",
        subject: "Question",
        message: "Bonjour",
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(toast.success).toHaveBeenCalledWith("support.sent");
  });
});
