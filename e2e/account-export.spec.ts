import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("exports her cycle, check-ins and duo without secrets", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const userData = await createTestAccount({ page, callbackURL: "/today" });
  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
        select: { id: true },
      }),
    { maxAttempts: 5, delayMs: 250, backoff: true },
  );

  await prisma.period.create({
    data: { userId: user.id, startDate: new Date("2026-10-01T00:00:00.000Z") },
  });
  await prisma.dailyCheckIn.create({
    data: {
      userId: user.id,
      operationId: `e2e-export-check-in-${user.id}`,
      localDate: new Date("2026-10-26T00:00:00.000Z"),
      timezone: "Europe/Paris",
      state: "fragile",
      needs: ["calm"],
      privateNote: "Private portability note",
    },
  });
  await prisma.coupleLink.create({
    data: {
      ownerId: user.id,
      invitedByRole: "cycle_owner",
      inviteCodeDigest: `e2e-digest-${user.id}`,
      inviteExpiresAt: new Date(Date.now() + 60_000),
    },
  });

  await page.goto("/settings/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tes données" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page
    .getByRole("link", { name: /Exporter toutes mes données/i })
    .click();
  const download = await downloadPromise;
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawExport = Buffer.concat(chunks).toString("utf8");
  const exported = JSON.parse(rawExport) as {
    exportMetadata: { dataVersion: string };
    profile: { role: string };
    cycle: { periods: unknown[] };
    checkIns: { privateNote: string | null }[];
    couple: { links: unknown[] };
  };

  expect(download.suggestedFilename()).toMatch(/^moodday-export-.*\.json$/);
  expect(exported.exportMetadata.dataVersion).toBe("3.0");
  expect(exported.profile.role).toBe("cycle_owner");
  expect(exported.cycle.periods).toHaveLength(1);
  // Portability includes her own private note; partners never receive it.
  expect(exported.checkIns).toEqual([
    expect.objectContaining({ privateNote: "Private portability note" }),
  ]);
  expect(exported.couple.links).toHaveLength(1);
  expect(rawExport).not.toContain(`e2e-export-check-in-${user.id}`);
  expect(rawExport).not.toContain(`e2e-digest-${user.id}`);
  expect(rawExport).not.toContain("p256dh");
});
