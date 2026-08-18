import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

const getSeriousViolations = async (page: Page) => {
  await page.evaluate(async () => {
    const finiteAnimations = document.getAnimations().filter((animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations;
      return iterations !== Number.POSITIVE_INFINITY;
    });
    await Promise.race([
      Promise.all(
        finiteAnimations.map(async (animation) =>
          animation.finished.catch(() => undefined),
        ),
      ),
      new Promise<void>((resolve) => setTimeout(resolve, 500)),
    ]);
  });
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
};

const expectNoSeriousViolations = async (page: Page) => {
  const blocking = await getSeriousViolations(page);
  expect(
    blocking,
    `${page.url()}\n${blocking
      .map((violation) => `${violation.id}: ${violation.help}`)
      .join("\n")}`,
  ).toEqual([]);
};

const publicPages = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/legal/privacy",
  "/legal/terms",
  "/legal/subprocessors",
  "/status",
  "/help",
  "/offline",
  "/crisis",
] as const;

for (const pathname of publicPages) {
  test(`${pathname} has no serious automated accessibility violation`, async ({
    page,
  }) => {
    const response = await page.goto(pathname);
    expect(response?.status()).toBeLessThan(400);
    await expectNoSeriousViolations(page);
  });
}

test("crisis resources remain public without an account", async ({ page }) => {
  await page.goto("/crisis");
  await expect(page.locator('a[href="tel:3114"]')).toBeVisible();
  await expect(page.locator('a[href="tel:15"]').first()).toBeVisible();
  await expect(page.locator('a[href="tel:112"]').first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/auth\/signin/);
});

const authenticatedPages = [
  "/dashboard",
  "/mood",
  "/mood/history",
  "/medications",
  "/medications/today",
  "/therapy",
  "/exercises",
  "/trends",
  "/consultation",
  "/safety-plan",
  "/caregiver",
  "/export",
  "/settings/security",
  "/settings/privacy",
  "/settings/offline",
  "/settings/import",
  "/pricing",
] as const;

test("main authenticated pages have no serious automated accessibility violation", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await createTestAccount({ page, callbackURL: "/dashboard" });
  const failures: string[] = [];
  for (const pathname of authenticatedPages) {
    // The account is deliberately reused so the audit covers a coherent,
    // authenticated navigation session instead of synthetic isolated markup.
    // eslint-disable-next-line no-await-in-loop
    const response = await page.goto(pathname);
    expect(response?.status(), pathname).toBeLessThan(400);
    // eslint-disable-next-line no-await-in-loop
    const blocking = await getSeriousViolations(page);
    if (blocking.length > 0) {
      failures.push(
        `${pathname}: ${blocking
          .map(
            (violation) =>
              `${violation.id} (${violation.nodes.length} node(s)): ${violation.help}; ${violation.nodes
                .map(
                  (node) =>
                    `${node.html} [target=${node.target.join(" > ")}; ${node.failureSummary ?? "no failure summary"}]`,
                )
                .join(" | ")}`,
          )
          .join(", ")}`,
      );
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});
