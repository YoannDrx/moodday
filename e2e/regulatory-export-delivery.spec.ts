import { expect, test } from "@playwright/test";

const REFERENCE = "A".repeat(43);
const TOKEN = "B".repeat(43);

// Route interception cannot observe requests passing through a registered
// service worker in WebKit. The worker is tested separately and never handles
// POST/API traffic; this test isolates the browser download contract.
test.use({ serviceWorkers: "block" });

test("the one-time regulatory export secret stays out of URLs and starts an encrypted download", async ({
  page,
}) => {
  let requestUrl = "";
  let requestBody: unknown;
  await page.route(`**/api/regulatory-export/${REFERENCE}`, async (route) => {
    requestUrl = route.request().url();
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.from("encrypted-export"),
    });
  });

  await page.goto(`/regulatory-export/${REFERENCE}#token=${TOKEN}`);

  await expect(page).toHaveURL(`/regulatory-export/${REFERENCE}`);
  await expect(page.locator("body")).not.toContainText(TOKEN);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Télécharger le fichier chiffré" })
    .click();
  const download = await downloadPromise;

  expect(requestUrl).toMatch(
    new RegExp(`/api/regulatory-export/${REFERENCE}$`),
  );
  expect(requestUrl).not.toContain(TOKEN);
  expect(requestBody).toEqual({ token: TOKEN });
  expect(download.suggestedFilename()).toBe(
    `moodday-regulatory-export-${REFERENCE.slice(0, 8)}.json.enc`,
  );
  await expect(page.getByRole("status")).toContainText(
    "Téléchargement démarré",
  );
});
