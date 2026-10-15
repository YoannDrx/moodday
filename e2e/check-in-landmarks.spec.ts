import { prisma } from "@/lib/prisma";
import { addCivilDays, getDateKeyForTimeZone } from "@/lib/temporal/civil-date";
import { expect, test } from "@playwright/test";

import { createTestAccount } from "./utils/auth-test";
import { extractPdfText } from "./utils/pdf-text";
import { retry } from "./utils/retry";

test("a quick check-in feeds Repères and the consultation PDF", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });
  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
        select: { id: true },
      }),
    { maxAttempts: 5, delayMs: 250, backoff: true },
  );
  // The consultation PDF is a Plus entitlement.
  await prisma.subscription.create({
    data: {
      id: `e2e-landmarks-plus-${user.id}`,
      referenceId: user.id,
      plan: "plus",
      status: "active",
      periodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await page.waitForURL(/\/dashboard/);
  await page
    .getByRole("button", { name: /Do a quick check-in|Faire un point rapide/i })
    .click();
  await page.getByRole("button", { name: /Mood: 8|Moral: 8/i }).click();
  await page.getByRole("button", { name: /Energy: 4|Énergie: 4/i }).click();
  await page
    .getByRole("button", { name: /Irritability: 6|Irritabilité: 6/i })
    .click();
  await page
    .getByRole("button", { name: /Save my check-in|Enregistrer mon point/i })
    .click();
  await expect
    .poll(async () => prisma.checkIn.count({ where: { userId: user.id } }), {
      timeout: 20_000,
    })
    .toBe(1);
  // Saving refreshes Today in place; navigating before that refresh settles
  // aborts the navigation in Firefox.
  await expect(
    page.getByText(/Your check-in is saved|Ton point est enregistré/i).first(),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.goto("/trends");
  await page
    .getByRole("button", { name: /^(Last 7 days|7 derniers jours)$/i })
    .first()
    .click();
  await expect(page.getByText(/^1 (entries|entrées)$/i)).toBeVisible();

  // The check-in's day comes from the browser; the report range is read in
  // the account time zone. A window around today covers both.
  const today = getDateKeyForTimeZone(new Date(), "Europe/Paris");
  const response = await page.request.get(
    `/api/export/pdf?startDate=${addCivilDays(today, -6)}&endDate=${addCivilDays(today, 1)}`,
  );
  expect(response.status()).toBe(200);
  const pdf = await response.body();
  expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
  expect(extractPdfText(pdf)).toMatch(/(énergie|energy) 4\/10/);
});
