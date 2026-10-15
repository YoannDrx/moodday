/* eslint-disable no-console */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(
    ["localhost", "127.0.0.1"].includes(url.hostname),
    "Requires a disposable local database",
  );
  const { prisma } = await import("../src/lib/prisma");
  const { createCheckIn } = await import(
    "../src/features/v2/check-ins/service"
  );
  const { pushSyncOperations } = await import(
    "../src/features/v2/sync/service"
  );
  const { searchJournalEntries } = await import(
    "../src/features/mood/journal-query"
  );
  const userId = `integrity-${randomUUID()}`;
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: "Synthetic integrity fixture",
        email: `${userId}@example.invalid`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const input = {
      operationId: randomUUID(),
      depth: "quick" as const,
      localDate: "2026-10-02",
      timezone: "Europe/Paris",
      valence: 5,
      activation: 3,
      irritability: 2,
      contexts: ["work"],
      note: "Synthetic private note",
    };
    const results = await Promise.all(
      Array.from({ length: 12 }, async () => createCheckIn(userId, input)),
    );
    assert.equal(new Set(results.map((result) => result.id)).size, 1);
    assert.equal(await prisma.checkIn.count({ where: { userId } }), 1);
    assert.equal(await prisma.syncOperation.count({ where: { userId } }), 1);
    await assert.rejects(createCheckIn(userId, { ...input, valence: 9 }), {
      name: "OperationConflictError",
    });
    const operation = {
      operationId: input.operationId,
      entityId: randomUUID(),
      entityType: "check_in" as const,
      mutation: "create" as const,
      payload: input,
    };
    const sync = async (payload = input) =>
      pushSyncOperations(userId, {
        deviceId: "synthetic-device",
        platform: "ios",
        operations: [{ ...operation, payload }],
      });
    assert.equal((await sync()).results[0].status, "duplicate");
    assert.equal(
      (await sync({ ...input, valence: 1 })).results[0].code,
      "operation_id_conflict",
    );
    const concurrentInput = { ...input, operationId: randomUUID() };
    const mixed = await Promise.all([
      createCheckIn(userId, concurrentInput),
      pushSyncOperations(userId, {
        deviceId: "synthetic-device",
        platform: "ios",
        operations: [
          {
            ...operation,
            operationId: concurrentInput.operationId,
            entityId: randomUUID(),
            payload: concurrentInput,
          },
        ],
      }),
    ]);
    assert.ok(["applied", "duplicate"].includes(mixed[1].results[0].status));
    await createCheckIn(userId, {
      operationId: randomUUID(),
      depth: "presence",
      localDate: "2026-10-03",
      timezone: "Europe/Paris",
      contexts: [],
    });
    await prisma.moodEntry.create({
      data: {
        userId,
        value: 0,
        note: "Legacy note",
        createdAt: new Date("2026-10-01T23:00:00Z"),
      },
    });
    const filters = { query: "", tags: [], page: 1, pageSize: 2 };
    const first = await searchJournalEntries(userId, "Europe/Paris", filters);
    const second = await searchJournalEntries(userId, "Europe/Paris", {
      ...filters,
      page: 2,
    });
    assert.equal(first[0].depth, "presence");
    assert.equal(first[0].value, null);
    assert.equal(new Set([...first, ...second].map((row) => row.id)).size, 4);
    assert.equal(
      [...first, ...second].find((row) => row.source === "legacy")?.localDate,
      "2026-10-02",
    );
    assert.equal(
      (await searchJournalEntries("another-user", "Europe/Paris", filters))
        .length,
      0,
    );
    assert.equal(
      (
        await searchJournalEntries(userId, "Europe/Paris", {
          ...filters,
          query: "private",
          tags: ["work"],
        })
      ).length,
      2,
    );
    assert.equal(
      (
        await searchJournalEntries(userId, "Europe/Paris", {
          ...filters,
          moodMax: 0,
        })
      )[0].value,
      0,
    );
    await prisma.device.createMany({
      data: Array.from({ length: 48 }, (_, index) => ({
        userId,
        publicId: `quota-${index}`,
        platform: "ios",
      })),
    });
    const admissions = await Promise.allSettled(
      Array.from({ length: 8 }, async (_, index) =>
        pushSyncOperations(userId, {
          deviceId: `last-slot-${index}`,
          platform: "ios",
          operations: [],
        }),
      ),
    );
    assert.equal(
      admissions.filter((item) => item.status === "fulfilled").length,
      1,
    );
    assert.equal(await prisma.device.count({ where: { userId } }), 50);
    console.log(
      JSON.stringify({
        concurrentRetries: 12,
        deviceAdmissionQuota: true,
        identicalEntity: true,
        divergentRetryRejected: true,
        directAndSyncSerialized: true,
        unifiedJournal: true,
        ownershipAndFilters: true,
      }),
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "integrity_failed");
  process.exitCode = 1;
});
