import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("admin", () => {
  test("keeps the operational admin surface unavailable when its gate is closed", async ({
    page,
  }) => {
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /Exploitation Moodday/i }),
    ).toHaveCount(0);
  });
});
