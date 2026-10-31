import "server-only";
import { randomUUID } from "node:crypto";
import type { BetterAuthOptions } from "better-auth";
import { prisma } from "@/lib/prisma";

type Storage = NonNullable<
  NonNullable<BetterAuthOptions["rateLimit"]>["customStorage"]
>;
type Rule = { window: number; max: number };

/** Same database-window semantics as Better Auth, without an interactive transaction. */
export async function consumeAuthRateLimit(
  key: string,
  rule: Rule,
  now = Date.now(),
) {
  if (
    !Number.isInteger(rule.max) ||
    rule.max < 1 ||
    rule.max >= 2147483647 ||
    !Number.isFinite(rule.window) ||
    rule.window <= 0
  )
    throw new Error("Invalid rate limit rule");
  const cutoff = BigInt(Math.floor(now - rule.window * 1000));
  // Keep the original key to preserve existing active limits during rollout.
  // A denied request neither slides the window nor increments without bound.
  // max+1 is the denied sentinel; no process-local or get/set admission race.
  const rows = await prisma.$queryRaw<{ count: number; lastRequest: bigint }[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${`auth:${randomUUID()}`}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${cutoff} THEN 1
        ELSE LEAST("rateLimit"."count" + 1, ${rule.max + 1})
      END,
      "lastRequest" = CASE
        WHEN "rateLimit"."lastRequest" < ${cutoff} OR "rateLimit"."count" < ${rule.max}
          THEN ${BigInt(now)}
        ELSE "rateLimit"."lastRequest"
      END
    RETURNING "count", "lastRequest"
  `;
  const row = rows.at(0);
  if (!row) throw new Error("Rate limit storage unavailable");
  const allowed = row.count <= rule.max;
  return {
    allowed,
    retryAfter: allowed
      ? null
      : Math.max(
          1,
          Math.ceil(
            (Number(row.lastRequest) + rule.window * 1000 - now) / 1000,
          ),
        ),
  };
}

export const authRateLimitStorage: Storage = {
  consume: consumeAuthRateLimit,
};
