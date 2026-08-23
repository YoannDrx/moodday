import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

const identifier = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

test("shares a private-note-safe brief through a fragment token and revokes it", async ({
  browser,
  page,
}) => {
  await createTestAccount({ page, callbackURL: "/dashboard" });
  const appointmentId = identifier("appointment");
  const appointmentResponse = await page.request.post("/api/v2/appointments", {
    data: {
      operationId: identifier("operation"),
      entityId: appointmentId,
      title: "Suivi du mois",
      startsAt: "2026-08-27T09:00:00.000Z",
      timezone: "Europe/Paris",
      status: "scheduled",
      source: "moodday",
      preparationStatus: "in_progress",
    },
  });
  expect(appointmentResponse.status()).toBe(201);

  for (const question of [
    { content: "Question visible dans le brief", privateNote: false },
    { content: "SECRET QUI NE DOIT JAMAIS SORTIR", privateNote: true },
  ]) {
    // Keep positions deterministic to validate the generated brief order.
    // eslint-disable-next-line no-await-in-loop
    const response = await page.request.post(
      `/api/v2/appointments/${appointmentId}/artifacts`,
      {
        data: {
          kind: "question",
          operationId: identifier("operation"),
          questionId: identifier("question"),
          ...question,
        },
      },
    );
    expect(response.status()).toBe(201);
  }

  const briefResponse = await page.request.post(
    `/api/v2/appointments/${appointmentId}/artifacts`,
    {
      data: {
        kind: "brief",
        operationId: identifier("operation"),
        briefId: identifier("brief"),
      },
    },
  );
  expect(briefResponse.status()).toBe(201);
  const briefBody = (await briefResponse.json()) as { data: { id: string } };

  const token = "E".repeat(43);
  const shareResponse = await page.request.post(
    `/api/v2/appointment-briefs/${briefBody.data.id}/shares`,
    {
      data: {
        operationId: identifier("operation"),
        shareId: identifier("share"),
        token,
        expiresInHours: 24,
      },
    },
  );
  expect(shareResponse.status()).toBe(201);
  const shareBody = (await shareResponse.json()) as {
    data: { share: { id: string }; token: string };
  };
  expect(shareBody.data.token).toBe(token);

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  const requestedUrls: string[] = [];
  publicPage.on("request", (request) => requestedUrls.push(request.url()));
  await publicPage.goto(`/brief#${token}`);
  await expect(
    publicPage.getByRole("heading", { name: "Suivi du mois" }),
  ).toBeVisible();
  await expect(
    publicPage.getByText("Question visible dans le brief"),
  ).toBeVisible();
  await expect(
    publicPage.getByText("SECRET QUI NE DOIT JAMAIS SORTIR"),
  ).toHaveCount(0);
  expect(requestedUrls.every((url) => !url.includes(token))).toBe(true);

  const download = publicPage.waitForEvent("download");
  await publicPage
    .getByRole("button", { name: /Télécharger le PDF|Download PDF/i })
    .click();
  const artifact = await download;
  expect(artifact.suggestedFilename()).toMatch(/^moodday-brief-v1\.pdf$/);

  const revokeResponse = await page.request.delete(
    `/api/v2/appointment-briefs/${briefBody.data.id}/shares/${shareBody.data.share.id}`,
  );
  expect(revokeResponse.status()).toBe(200);
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", {
      name: /Ce brief n’est plus disponible|no longer available/i,
    }),
  ).toBeVisible();
  await publicContext.close();
});
