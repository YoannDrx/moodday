/* eslint-disable no-console -- isolated verification prints no credentials */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit-storage";

const databaseUrl = process.env.DATABASE_URL;
if (
  !databaseUrl ||
  !["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname)
) {
  throw new Error("This verification requires an isolated local database");
}
const key = `auth-concurrency-proof:${randomUUID()}`;
const now = Date.now();
const rule = { max: 5, window: 60 };

async function main() {
  try {
    const results = await Promise.all(
      Array.from({ length: 24 }, async () =>
        consumeAuthRateLimit(key, rule, now),
      ),
    );
    assert.equal(results.filter((result) => result.allowed).length, 5);
    assert.equal(results.filter((result) => !result.allowed).length, 19);
    assert.ok(
      results
        .filter((result) => !result.allowed)
        .every((result) => result.retryAfter === 60),
    );
    assert.equal(
      (await consumeAuthRateLimit(key, rule, now + 30_000)).allowed,
      false,
    );
    const denied = await prisma.rateLimit.findUniqueOrThrow({ where: { key } });
    assert.equal(denied.lastRequest, BigInt(now));
    assert.equal(denied.count, 6);
    assert.equal(
      (await consumeAuthRateLimit(key, rule, now + 60_000)).allowed,
      false,
    );
    assert.equal(
      (await consumeAuthRateLimit(key, rule, now + 60_001)).allowed,
      true,
    );
    // An existing row from the default adapter must not be reset at rollout.
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 5, lastRequest: BigInt(now) },
    });
    assert.equal(
      (await consumeAuthRateLimit(key, rule, now + 100)).allowed,
      false,
    );
    console.log(
      JSON.stringify({
        ok: true,
        concurrentRequests: 24,
        admitted: 5,
        denied: 19,
        resetAndLegacyRow: true,
      }),
    );
  } finally {
    await prisma.rateLimit.deleteMany({ where: { key } });
    await prisma.$disconnect();
  }
}
void main().catch(() => {
  console.error("Auth rate limit verification failed");
  process.exitCode = 1;
});
