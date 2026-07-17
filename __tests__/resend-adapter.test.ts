import { beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/lib/mail/resend");

describe("resendMailAdapter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a recoverable error when Resend is not configured", async () => {
    vi.doMock("@/lib/env", () => ({
      env: { RESEND_API_KEY: undefined },
    }));

    const { resendMailAdapter } = await import("@/lib/mail/resend");
    const result = await resendMailAdapter.send({
      from: "Moodday <hello@moodday.app>",
      to: "person@example.com",
      subject: "Test Moodday",
      html: "<p>Test</p>",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain("RESEND_API_KEY");
  });
});
