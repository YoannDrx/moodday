import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("exports complete user data without authentication or notification secrets", async ({
  page,
}) => {
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
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, timezone: "Europe/Paris" },
    update: { timezone: "Europe/Paris" },
  });

  const medication = await prisma.medication.create({
    data: {
      userId: user.id,
      name: "Test treatment",
      dosage: "10 mg",
      frequency: "daily",
      scheduleTimes: ["08:00", "20:00"],
    },
  });
  await prisma.medIntake.create({
    data: {
      medicationId: medication.id,
      scheduledForDate: "2026-07-16",
      doseIndex: 0,
      doseKey: `${medication.id}:2026-07-16:0`,
    },
  });
  await prisma.moodEntry.create({
    data: {
      userId: user.id,
      value: 6,
      energy: 4,
      note: "Private test note",
    },
  });
  await prisma.therapySession.create({
    data: {
      userId: user.id,
      notes: "Private therapy test note",
      benefitRating: 3,
    },
  });
  const exercise = await prisma.exercise.create({
    data: {
      userId: user.id,
      name: "Breathing test",
    },
  });
  await prisma.exerciseLog.create({
    data: {
      exerciseId: exercise.id,
      note: "Completed",
    },
  });

  await page.goto("/settings/privacy");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Privacy|Confidentialité/i,
    }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Export JSON|Exporter JSON/i })
    .click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawExport = Buffer.concat(chunks).toString("utf8");
  const exported = JSON.parse(rawExport) as {
    exportMetadata: { dataVersion: string; excludedSecurityData: string[] };
    preferences: unknown;
    moodEntries: unknown[];
    medications: { intakes: unknown[] }[];
    therapySessions: unknown[];
    exercises: { logs: unknown[] }[];
    caregiverCircle: {
      relationships: unknown[];
      observations: unknown[];
      events: unknown[];
      accessLog: unknown[];
    };
  };

  expect(download.suggestedFilename()).toMatch(/^moodday-export-.*\.json$/);
  expect(exported.exportMetadata).toMatchObject({ dataVersion: "2.1" });
  expect(exported.exportMetadata.excludedSecurityData).toContain(
    "authentication sessions and credentials",
  );
  expect(exported.preferences).not.toBeNull();
  expect(exported.moodEntries).toHaveLength(1);
  expect(exported.medications[0]?.intakes).toHaveLength(1);
  expect(exported.therapySessions).toHaveLength(1);
  expect(exported.exercises[0]?.logs).toHaveLength(1);
  expect(exported.caregiverCircle).toEqual({
    relationships: [],
    observations: [],
    events: [],
    accessLog: [],
  });
  expect(rawExport).not.toContain("clientOperationId");
  expect(rawExport).not.toContain("inviteToken");
  expect(rawExport).not.toContain("p256dh");

  await page.goto("/export");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Personal export|Export personnel/i,
    }),
  ).toBeVisible();

  const csvButton = page.getByRole("button", {
    name: /Download CSV|Télécharger CSV/i,
  });
  await expect(csvButton).toBeEnabled({ timeout: 15000 });
  const csvDownloadPromise = page.waitForEvent("download");
  await csvButton.click();
  const csvDownload = await csvDownloadPromise;
  const csvStream = await csvDownload.createReadStream();
  const csvChunks: Buffer[] = [];
  for await (const chunk of csvStream) {
    csvChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const csv = Buffer.concat(csvChunks).toString("utf8");

  expect(csvDownload.suggestedFilename()).toMatch(
    /^moodday-export-.*-.*\.csv$/,
  );
  expect(csv.startsWith("\uFEFFrecord_type,")).toBe(true);
  expect(csv).toContain("mood");
  expect(csv).toContain("medication_intake");
  expect(csv).toContain("therapy_session");
  expect(csv).toContain("exercise");
  expect(csv).toContain("Europe/Paris");

  const pdfButton = page.getByRole("button", {
    name: /Download PDF|Télécharger PDF/i,
  });
  await expect(pdfButton).toBeEnabled({ timeout: 15000 });
  const pdfDownloadPromise = page.waitForEvent("download");
  await pdfButton.click();
  const pdfDownload = await pdfDownloadPromise;
  const pdfStream = await pdfDownload.createReadStream();
  const pdfChunks: Buffer[] = [];
  for await (const chunk of pdfStream) {
    pdfChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  expect(pdfDownload.suggestedFilename()).toMatch(
    /^moodday-export-.*-.*\.pdf$/,
  );
  expect(Buffer.concat(pdfChunks).subarray(0, 4).toString("ascii")).toBe(
    "%PDF",
  );
});
