import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";

import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("finishes import, journal tags, consultation PDF and the offline safety plan", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });
  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({ where: { email: userData.email } }),
    { maxAttempts: 5, delayMs: 250, backoff: true },
  );
  await prisma.subscription.create({
    data: {
      id: `e2e-product-plus-${user.id}`,
      referenceId: user.id,
      plan: "plus",
      status: "active",
      periodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await page.goto("/settings/import");
  await expect(
    page.getByRole("heading", { name: /Importer des données|Import data/i }),
  ).toBeVisible();
  await page.getByLabel(/JSON Moodday v2 ou CSV/i).setInputFiles({
    name: "moodday.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "date,value,note,energy,anxiety,tags\n2026-08-12T08:00:00.000Z,0,SENTINELLE_IMPORT_PHASE_5,0,0,forêt|repos",
    ),
  });
  await page.getByRole("button", { name: /Prévisualiser|Preview/i }).click();
  await expect(page.getByText(/1 ligne\(s\) valide\(s\)|1 valid row/i)).toBeVisible();
  await page
    .getByRole("button", { name: /Confirmer l’import|Confirm import/i })
    .click();
  await expect
    .poll(async () =>
      prisma.moodEntry.count({
        where: { userId: user.id, note: "SENTINELLE_IMPORT_PHASE_5" },
      }),
    )
    .toBe(1);

  await page.goto("/mood/history");
  await expect(page.getByText("SENTINELLE_IMPORT_PHASE_5")).toBeVisible();
  await page.getByLabel(/Recherche dans les notes|Search notes/i).fill("SENTINELLE_IMPORT");
  await page.getByRole("button", { name: /Appliquer|Apply/i }).click();
  await expect(page.getByText("SENTINELLE_IMPORT_PHASE_5")).toBeVisible();
  await page.getByLabel(/Libellé|Label/i).fill("Balade en forêt");
  await page.getByLabel(/Catégorie|Category/i).selectOption("protective");
  await page.getByRole("button", { name: /Ajouter|Add/i }).click();
  await expect(page.getByText(/Balade en forêt · protective/i)).toBeVisible();

  await page.goto("/mood");
  await page.getByRole("button", { name: /Étape 4|Step 4/i }).click();
  const customTag = page.getByRole("button", { name: "Balade en forêt" });
  await expect(customTag).toBeVisible();
  await customTag.click();
  await expect(customTag).toHaveAttribute("aria-pressed", "true");

  await page.goto("/consultation");
  await page.getByLabel(/^Titre$|^Title$/i).fill("Consultation de suivi");
  await page
    .getByLabel(/Mes questions|My questions/i)
    .fill("Comment décrire mes variations ?\nQuelles informations relire ?");
  await page
    .getByLabel(/Notes personnelles|Personal notes/i)
    .fill("SENTINELLE_NOTE_CONSULTATION");
  await page
    .getByLabel(/Événements importants|Selected important events/i)
    .fill("Reprise du travail à temps partiel");
  await page
    .getByRole("button", { name: /Enregistrer le brouillon|Save draft/i })
    .click();
  await expect(page.getByRole("heading", { name: "Consultation de suivi" })).toBeVisible();
  await expect
    .poll(async () =>
      prisma.consultationPreparation.findFirst({
        where: { userId: user.id, title: "Consultation de suivi" },
      }),
    )
    .not.toBeNull();

  const pdfDownloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page
    .getByRole("link", { name: /Télécharger le PDF|Download PDF/i })
    .click();
  const pdfDownload = await pdfDownloadPromise;
  const pdfStream = await pdfDownload.createReadStream();
  const pdfChunks: Buffer[] = [];
  for await (const chunk of pdfStream) {
    pdfChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  expect(Buffer.concat(pdfChunks).subarray(0, 4).toString("ascii")).toBe("%PDF");

  await page.getByRole("button", { name: /Marquer terminée|Mark completed/i }).click();
  await expect
    .poll(async () => {
      const value = await prisma.consultationPreparation.findFirst({
        where: { userId: user.id, title: "Consultation de suivi" },
        select: { status: true },
      });
      return value?.status;
    })
    .toBe("completed");

  await page.goto("/safety-plan");
  await page.getByLabel(/Mes signaux personnels|My warning signs/i).fill("Isolement inhabituel");
  await page
    .getByLabel(/Stratégies qui peuvent m’apaiser|Coping strategies/i)
    .fill("Marcher dix minutes");
  await page
    .getByLabel(/Lieux où je me sens en sécurité|Places where I feel safe/i)
    .fill("Chez Camille");
  await page
    .getByLabel(/Contacts de confiance|Trusted contacts/i)
    .fill("Camille — 06 00 00 00 00");
  await page
    .getByRole("button", {
      name: /Enregistrer et marquer comme revu|Save and mark as reviewed/i,
    })
    .click();
  await expect(page.getByText(/Plan enregistré|Safety plan saved/i)).toBeVisible();
  await expect
    .poll(async () => prisma.safetyPlan.count({ where: { userId: user.id } }))
    .toBe(1);
  await expect
    .poll(async () =>
      page.evaluate(() =>
        Array.from({ length: localStorage.length }, (_, index) =>
          localStorage.key(index),
        ).some((key) => key?.includes("snapshot.v2") === true),
      ),
    )
    .toBe(true);
  const localStorageDump = await page.evaluate(() =>
    Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index);
      return key ? `${key}:${localStorage.getItem(key)}` : "";
    }).join("\n"),
  );
  expect(localStorageDump).not.toContain("Isolement inhabituel");

  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: /Mon plan de sécurité personnel/i }),
  ).toBeVisible();
  await expect(page.getByText("Isolement inhabituel")).toBeVisible();
  await expect(page.getByText("Marcher dix minutes")).toBeVisible();
  await expect(page.getByText(/Moodday n’est pas un service d’urgence/i)).toBeVisible();
});
