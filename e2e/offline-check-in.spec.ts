import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

type BrowserOfflineOperation = {
  id: string;
  ownerId: string;
  schemaVersion: number;
  kind: string;
  ciphertext: string;
  iv: string;
  status: string;
};

const readCheckInOperations = async (page: Page) =>
  page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("moodday-offline");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return new Promise<BrowserOfflineOperation[]>((resolve, reject) => {
      const transaction = database.transaction("operations", "readonly");
      const request = transaction.objectStore("operations").getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as BrowserOfflineOperation[]).filter(
            (operation) => operation.kind === "action",
          ),
        );
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
  });

const fillQuickCheckIn = async (page: Page) => {
  await page
    .getByRole("button", { name: /Do a quick check-in|Faire un point rapide/i })
    .click();
  await page.getByRole("button", { name: /Mood: 8|Moral: 8/i }).click();
  await page.getByRole("button", { name: /Energy: 4|Énergie: 4/i }).click();
  await page
    .getByRole("button", { name: /Irritability: 6|Irritabilité: 6/i })
    .click();
};

test("queues a quick check-in offline and syncs it once online", async ({
  context,
  page,
}) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });

  await page.waitForURL(/\/dashboard/);
  await context.setOffline(true);

  await fillQuickCheckIn(page);
  await page
    .getByRole("button", { name: /Save my check-in|Enregistrer mon point/i })
    .click();

  await expect(
    page.getByText(/Saved offline|Enregistré hors ligne/i).first(),
  ).toBeVisible();

  await expect
    .poll(async () => readCheckInOperations(page))
    .toEqual([
      expect.objectContaining({
        ownerId: expect.any(String),
        schemaVersion: 2,
        kind: "action",
        status: "pending",
        ciphertext: expect.any(String),
        iv: expect.any(String),
      }),
    ]);
  const [persistedOperation] = await readCheckInOperations(page);
  expect(persistedOperation).not.toHaveProperty("payload");
  expect(persistedOperation.ciphertext).not.toContain('"valence":8');

  await context.setOffline(false);

  await expect
    .poll(async () => (await readCheckInOperations(page)).length, {
      timeout: 20_000,
    })
    .toBe(0);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
    select: { id: true },
  });
  const entry = await prisma.checkIn.findFirst({
    where: {
      userId: user.id,
      operationId: { startsWith: "action:" },
    },
    orderBy: { createdAt: "desc" },
  });

  expect(entry).toMatchObject({
    valence: 8,
    activation: 4,
    irritability: 6,
  });
});

test("syncs seven persisted daily check-ins after the page is closed", async ({
  context,
  page,
}) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });

  // This scenario verifies encrypted IndexedDB persistence across page
  // lifecycles. The service-worker fallback is covered separately and is
  // unregistered here because WebKit's offline emulation can keep its worker
  // offline after the browser context itself has returned online.
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(async (item) => item.unregister()));
  });

  await context.setOffline(true);
  for (let entry = 1; entry <= 7; entry += 1) {
    if (entry > 1) {
      // eslint-disable-next-line no-await-in-loop
      await page
        .getByRole("button", {
          name: /Add another check-in|Faire un autre point/i,
        })
        .click();
    }
    // eslint-disable-next-line no-await-in-loop
    await fillQuickCheckIn(page);
    // Each click exercises the production encryption/key path before the page
    // is closed, including WebKit's IndexedDB CryptoKey persistence.
    // eslint-disable-next-line no-await-in-loop
    await page
      .getByRole("button", {
        name: /Save my check-in|Enregistrer mon point/i,
      })
      .click();
    // eslint-disable-next-line no-await-in-loop
    await expect
      .poll(async () => (await readCheckInOperations(page)).length)
      .toBe(entry);
  }
  await expect
    .poll(async () => (await readCheckInOperations(page)).length)
    .toBe(7);

  await page.close();
  await context.setOffline(false);
  const resumedPage = await context.newPage();
  await resumedPage.goto("/dashboard");
  // WebKit may serve one offline fallback after connectivity is restored while
  // no page is open. Reapply the transition with a controlled page and reload;
  // this is an emulation quirk rather than an application retry path.
  await context.setOffline(false);
  await expect
    .poll(async () => resumedPage.evaluate(() => navigator.onLine))
    .toBe(true);
  if (
    await resumedPage
      .getByRole("heading", { name: /You're offline|Vous êtes hors ligne/i })
      .isVisible()
  ) {
    await resumedPage.evaluate(() => window.dispatchEvent(new Event("online")));
    await resumedPage.reload();
  }

  await expect
    .poll(async () => (await readCheckInOperations(resumedPage)).length, {
      timeout: 30_000,
    })
    .toBe(0);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
    select: { id: true },
  });

  const syncedEntries = await prisma.checkIn.findMany({
    where: {
      userId: user.id,
      operationId: { startsWith: "action:" },
    },
    orderBy: { operationId: "asc" },
    select: {
      operationId: true,
      valence: true,
      activation: true,
      irritability: true,
    },
  });

  expect(syncedEntries).toHaveLength(7);
  expect(syncedEntries.map((entry) => entry.valence)).toEqual([
    8, 8, 8, 8, 8, 8, 8,
  ]);
  expect(syncedEntries.every((entry) => entry.activation === 4)).toBe(true);
  expect(syncedEntries.every((entry) => entry.irritability === 6)).toBe(true);

  await resumedPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect
    .poll(async () =>
      prisma.checkIn.count({
        where: {
          userId: user.id,
          operationId: { startsWith: "action:" },
        },
      }),
    )
    .toBe(7);
});
