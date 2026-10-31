import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccountViaApi } from "./utils/auth-test";

/**
 * The product loop: she shares how she feels, her partner sees a filtered
 * view and answers with a gesture, she sees it and says thanks. Two browser
 * contexts stand for two people on two phones.
 */
test("she checks in, her partner answers with a gesture, she says thanks", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);
  const herContext = await browser.newContext();
  const hisContext = await browser.newContext();
  const her = await herContext.newPage();
  const him = await hisContext.newPage();

  try {
    // She arrives through the "C'est mon cycle" door and does the onboarding.
    const herAccount = await createTestAccountViaApi({
      page: her,
      baseURL,
      role: null,
    });
    await her.goto("/onboarding?porte=cycle");
    await expect(
      her.getByRole("button", { name: /C'est mon cycle/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await her.getByRole("button", { name: "Continuer" }).click();
    await her.getByLabel("Prénom ou surnom").fill("Léa");
    for (let step = 0; step < 4; step += 1) {
      // eslint-disable-next-line no-await-in-loop -- sequential wizard steps
      await her.getByRole("button", { name: "Continuer" }).click();
    }
    await her.getByRole("button", { name: "Du calme" }).click();
    await expect(her.getByText(/ton duo pourra te répondre/)).toBeVisible();
    await her.getByRole("button", { name: "Continuer" }).click();
    await expect(
      her.getByText("Ta note du jour reste toujours privée."),
    ).toBeVisible();
    await her
      .getByRole("button", { name: /Plus tard, faire mon premier point/ })
      .click();
    await her.waitForURL(/\/today$/);

    // Her first "Mon point".
    await her.getByRole("button", { name: /^Fragile/ }).click();
    await her.getByRole("button", { name: "Qu'on gère le dîner" }).click();
    await her.getByLabel("Note privée").fill("Rien que pour moi, promis.");
    await her.getByRole("button", { name: "Enregistrer mon point" }).click();
    await expect(her.getByText("Mon point du jour")).toBeVisible();

    // She invites; the code is shown once.
    await her.goto("/duo");
    await her
      .getByRole("button", { name: "Créer un code d'invitation" })
      .click();
    const codeElement = her.getByLabel(/^Code d'invitation [A-Z0-9]/);
    await expect(codeElement).toBeVisible();
    const code = (await codeElement.textContent())?.trim() ?? "";
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/u);

    // He arrives through the partner door and joins with the code.
    await createTestAccountViaApi({ page: him, baseURL, role: "supporter" });
    await him.goto(`/join?code=${code}`);
    await expect(him).toHaveURL(/\/duo\?code=/);
    await him.getByRole("button", { name: "Rejoindre" }).click();
    await expect(him.getByText("Duo actif")).toBeVisible();

    // He sees her state and her need, never her private note.
    await him.goto("/today");
    await expect(him.getByRole("heading", { name: "Fragile" })).toBeVisible();
    await expect(him.getByText(/qu'on gère le dîner/i).first()).toBeVisible();
    await expect(him.getByText("Rien que pour moi, promis.")).toHaveCount(0);
    expect(await him.content()).not.toContain("Rien que pour moi");

    await him.getByRole("button", { name: /Je m'occupe du dîner/ }).click();
    await expect(him.getByText(/Envoyé\. Léa va le voir/)).toBeVisible();

    // She sees the gesture and thanks him.
    await her.goto("/today");
    await expect(her.getByText("Je m'occupe du dîner")).toBeVisible();
    await her.getByRole("button", { name: "Merci" }).click();
    await expect(her.getByText("Merci envoyé.")).toBeVisible();

    // Every partner read is logged without content.
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: herAccount.email },
      select: { id: true },
    });
    const views = await prisma.accessLog.findMany({
      where: { ownerId: owner.id, action: "viewed" },
    });
    expect(views.length).toBeGreaterThan(0);

    // She pauses: he now sees nothing but the pause.
    await her.goto("/duo");
    await her.getByRole("button", { name: "Pause 48 h" }).click();
    await expect(her.getByText(/En pause jusqu'au/)).toBeVisible();
    await him.goto("/today");
    await expect(him.getByText(/a mis le partage en pause/)).toBeVisible();
    await expect(him.getByRole("heading", { name: "Fragile" })).toHaveCount(0);

    // He can leave the duo; she loses nothing of her own data.
    await him.goto("/duo");
    await him.getByRole("button", { name: "Arrêter le partage" }).click();
    await him.getByRole("button", { name: "Oui, arrêter" }).click();
    await expect(him.getByRole("button", { name: "Rejoindre" })).toBeVisible();
    expect(
      await prisma.dailyCheckIn.count({ where: { userId: owner.id } }),
    ).toBe(1);
  } finally {
    await herContext.close();
    await hisContext.close();
  }
});

test("a partner can never write her cycle data", async ({ page, baseURL }) => {
  await createTestAccountViaApi({ page, baseURL, role: "supporter" });
  if (!baseURL) throw new Error("baseURL is required");
  const origin = new URL(baseURL).origin;
  const checkIn = await page.request.post("/api/v2/check-in", {
    headers: { Origin: origin },
    data: {
      operationId: "partner-write-attempt",
      localDate: new Date().toISOString().slice(0, 10),
      timezone: "Europe/Paris",
      state: "hard",
    },
  });
  expect(checkIn.status()).toBe(409);
  expect((await checkIn.json()).error.code).toBe("cycle_owner_only");
  const period = await page.request.post("/api/v2/periods/start", {
    headers: { Origin: origin },
    data: { date: new Date().toISOString().slice(0, 10) },
  });
  expect(period.status()).toBe(409);
});
