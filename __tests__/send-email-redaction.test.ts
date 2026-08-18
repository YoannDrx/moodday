import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    BETTER_AUTH_SECRET:
      "moodday-test-secret-for-operational-hmac-redaction-000000",
    EMAIL_FROM: "Moodday <hello@moodday.app>",
    NEXT_PUBLIC_EMAIL_CONTACT: "hello@moodday.app",
  },
}));

vi.mock("@/lib/mail/resend", () => ({
  resendMailAdapter: { send },
}));

describe("sendEmail operational redaction", () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ error: null, data: { id: "resend-safe-id" } });
  });

  it("sends the email but stores no recipient, subject, metadata, or provider message", async () => {
    const { sendEmail } = await import("@/lib/mail/send-email");
    await sendEmail({
      to: "Sensitive.Person@Example.com",
      subject: "Private support subject",
      html: "<p>Private message body</p>",
      tracking: {
        template: "support",
      },
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "Sensitive.Person@Example.com",
        subject: "Private support subject",
      }),
    );
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        resendId: "resend-safe-id",
        recipientReference: expect.any(String),
        to: "[redacted]",
        subject: "support",
        template: "support",
        metadata: undefined,
        error: null,
      }),
    });
    const stored = JSON.stringify(
      vi.mocked(prisma.emailLog.create).mock.calls[0]?.[0],
    );
    expect(stored).not.toContain("Sensitive.Person");
    expect(stored).not.toContain("Private support subject");
    expect(stored).not.toContain("Private message body");
  });
});
