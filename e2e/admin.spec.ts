import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("admin", () => {
  // TODO: Fix admin test - Better Auth caches user role in session token,
  // so updating role in DB after signup doesn't update the session.
  // Need to either: 1) Use Better Auth admin API to update role, or
  // 2) Create admin user via DB seed before tests
  test.skip("verify admin dashboard work", async ({ page }) => {
    await createTestAccount({
      page,
      callbackURL: "/app",
      admin: true,
    });

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Take a screenshot for debugging
    await page.screenshot({
      path: "test-results/admin-debug.png",
      fullPage: true,
    });

    // Wait for the sidebar to be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // i18n: "Users" (EN) / "Utilisateurs" (FR) - use locator with href
    const usersLink = page.locator('a[href="/admin/users"]');
    await expect(usersLink).toBeVisible({ timeout: 15000 });

    // i18n: "Feedback" (EN) / "Retours" (FR) - use locator with href
    const feedbackLink = page.locator('a[href="/admin/feedback"]');
    await expect(feedbackLink).toBeVisible({ timeout: 15000 });

    await usersLink.click();
    await expect(page).toHaveURL("/admin/users");

    await feedbackLink.click();
    await expect(page).toHaveURL("/admin/feedback");
  });
});
