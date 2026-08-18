import { describe, expect, it } from "vitest";
import { EMAIL_URLS, getEmailBaseUrl } from "@email/utils/email-constants";

describe("email URLs", () => {
  it("uses only the canonical HTTPS Moodday origin", () => {
    expect(getEmailBaseUrl()).toBe("https://www.moodday.app");
    expect(EMAIL_URLS.logo()).toBe(
      "https://www.moodday.app/icons/android-chrome-512x512.png",
    );
    expect(EMAIL_URLS.dashboard()).toBe("https://www.moodday.app/dashboard");
    expect(EMAIL_URLS.billing()).toBe(
      "https://www.moodday.app/account/billing",
    );
    expect(
      Object.values(EMAIL_URLS).every((url) =>
        url().startsWith("https://www.moodday.app/"),
      ),
    ).toBe(true);
  });
});
