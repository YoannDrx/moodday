import { expect, test } from "@playwright/test";

test("an OAuth cancellation remains readable on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/auth/signin?error=access_denied&callbackUrl=%2Fdashboard");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /cancelled|annulée|provider|fournisseur/i }),
  ).toContainText(/annulée|cancelled/i);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("an unexpected provider error is actionable and never echoes untrusted details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/signin?error=untrusted-provider-detail");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /cancelled|annulée|provider|fournisseur/i }),
  ).toContainText(/e-mail|email/i);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /cancelled|annulée|provider|fournisseur/i }),
  ).not.toContainText("untrusted-provider-detail");
});
test("provider feedback remains visible with enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/signin?error=access_denied");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /cancelled|annulée|provider|fournisseur/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
