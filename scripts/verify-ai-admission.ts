/* eslint-disable no-console -- standalone verification emits one JSON result */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  claimAiInsightUsage,
  markAiUsageBlockedForCrisis,
} from "@/features/insights/ai-usage-admission";
import { prisma } from "@/lib/prisma";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const hostname = new URL(databaseUrl).hostname;
if (hostname !== "localhost" && hostname !== "127.0.0.1") {
  throw new Error("AI admission verification requires a local database");
}

const suffix = randomUUID();
const userId = `ai-admission-${suffix}`;
const requestKey = `journal:${userId}:2099-01-01`;
const periodKey = `proof-${suffix}`;

const claim = async () => {
  return claimAiInsightUsage({
    userId,
    requestKey,
    periodKey,
    monthlyUserLimit: 8,
    model: "synthetic-model",
    promptVersion: "synthetic-prompt",
    now: new Date("2099-01-01T12:00:00.000Z"),
  });
};

const main = async () => {
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: "Synthetic AI admission proof",
        email: `${userId}@example.invalid`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const concurrent = await Promise.all([claim(), claim()]);
    const admitted = concurrent.filter((result) => result.admitted);
    const rejected = concurrent.filter((result) => !result.admitted);
    assert.equal(admitted.length, 1);
    assert.deepEqual(rejected, [{ admitted: false, reason: "daily_limit" }]);

    const firstUsage = admitted[0];
    assert(firstUsage.admitted);
    await markAiUsageBlockedForCrisis({
      usageId: firstUsage.usageId,
      requestKey,
      latencyMs: 1,
    });
    const afterCrisis = await claim();
    assert.equal(afterCrisis.admitted, true);

    console.log(
      JSON.stringify({
        ok: true,
        concurrentDailyAdmissionExactlyOnce: true,
        crisisReleasedDailyQuota: true,
        noSensitiveContentPersisted: true,
      }),
    );
  } finally {
    await prisma.aIUsage.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
});
