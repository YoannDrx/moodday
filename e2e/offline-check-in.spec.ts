import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

type BrowserOfflineOperation = {
  id: string;
  kind: string;
  payload: {
    value?: number;
    energy?: number;
  };
  status: string;
};

const readMoodOperations = async (page: Page) =>
  page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("moodday-offline", 1);
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

const seedSevenDailyMoodOperations = async (page: Page) =>
  page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("moodday-offline", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("operations", {
          keyPath: "id",
        });
        store.createIndex("kind", "kind", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const firstDay = new Date("2026-07-01T08:00:00.000Z");
    const transaction = database.transaction("operations", "readwrite");
    const store = transaction.objectStore("operations");

    for (let day = 0; day < 7; day += 1) {
      const createdAt = new Date(
        firstDay.getTime() + day * 24 * 60 * 60 * 1000,
      ).toISOString();
      store.add({
        id: `mood:seven-day-${day}`,
        kind: "mood",
        payload: { value: day + 2, energy: day + 1 },
        status: "pending",
        retryCount: 0,
        createdAt,
        updatedAt: createdAt,
      });
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
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
        kind: "mood",
        status: "pending",
        payload: expect.objectContaining({
          value: 7,
          energy: 4,
        }),
      }),
    ]);

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

  await context.setOffline(true);
  await seedSevenDailyMoodOperations(page);
  await expect
    .poll(async () => (await readMoodOperations(page)).length)
    .toBe(7);

  await page.close();
  await context.setOffline(false);
  const resumedPage = await context.newPage();
  await resumedPage.goto("/dashboard");

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
      clientOperationId: { startsWith: "mood:seven-day-" },
    },
    orderBy: { clientOperationId: "asc" },
    select: { clientOperationId: true, value: true, energy: true },
  });

  expect(syncedEntries).toHaveLength(7);
  expect(syncedEntries.map((entry) => entry.value)).toEqual([
    2, 3, 4, 5, 6, 7, 8,
  ]);

  await resumedPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect
    .poll(async () =>
      prisma.moodEntry.count({
        where: {
          userId: user.id,
          clientOperationId: { startsWith: "mood:seven-day-" },
        },
      }),
    )
    .toBe(7);
});
