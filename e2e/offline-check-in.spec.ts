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

const readMoodOperations = async (page: Page) =>
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
            (operation) => operation.kind === "mood",
          ),
        );
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
  });

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

  await page.locator("#quick-check-in-energy").fill("4");
  await page
    .getByRole("button", { name: /Save check-in|Enregistrer/i })
    .click();

  await expect(
    page.getByText(/Saved offline|Enregistré hors ligne/i),
  ).toBeVisible();

  await expect
    .poll(async () => readMoodOperations(page))
    .toEqual([
      expect.objectContaining({
        ownerId: expect.any(String),
        schemaVersion: 2,
        kind: "mood",
        status: "pending",
        ciphertext: expect.any(String),
        iv: expect.any(String),
      }),
    ]);
  const [persistedOperation] = await readMoodOperations(page);
  expect(persistedOperation).not.toHaveProperty("payload");
  expect(persistedOperation.ciphertext).not.toContain('"value":7');

  await context.setOffline(false);

  await expect
    .poll(async () => (await readMoodOperations(page)).length, {
      timeout: 20_000,
    })
    .toBe(0);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
    select: { id: true },
  });
  const entry = await prisma.moodEntry.findFirst({
    where: {
      userId: user.id,
      clientOperationId: { startsWith: "mood:" },
    },
    orderBy: { createdAt: "desc" },
  });

  expect(entry).toMatchObject({
    value: 7,
    energy: 4,
    syncStatus: "synced",
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
  const saveButton = page.getByRole("button", {
    name: /Save check-in|Enregistrer/i,
  });
  for (let entry = 1; entry <= 7; entry += 1) {
    // Each click exercises the production encryption/key path before the page
    // is closed, including WebKit's IndexedDB CryptoKey persistence.
    // eslint-disable-next-line no-await-in-loop
    await saveButton.click();
    // eslint-disable-next-line no-await-in-loop
    await expect
      .poll(async () => (await readMoodOperations(page)).length)
      .toBe(entry);
  }
  await expect
    .poll(async () => (await readMoodOperations(page)).length)
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
    .poll(async () => (await readMoodOperations(resumedPage)).length, {
      timeout: 30_000,
    })
    .toBe(0);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
    select: { id: true },
  });

  const syncedEntries = await prisma.moodEntry.findMany({
    where: {
      userId: user.id,
      clientOperationId: { startsWith: "mood:" },
    },
    orderBy: { clientOperationId: "asc" },
    select: { clientOperationId: true, value: true, energy: true },
  });

  expect(syncedEntries).toHaveLength(7);
  expect(syncedEntries.map((entry) => entry.value)).toEqual([
    7, 7, 7, 7, 7, 7, 7,
  ]);

  await resumedPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect
    .poll(async () =>
      prisma.moodEntry.count({
        where: {
          userId: user.id,
          clientOperationId: { startsWith: "mood:" },
        },
      }),
    )
    .toBe(7);
});
