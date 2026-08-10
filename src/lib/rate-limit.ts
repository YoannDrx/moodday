import "server-only";

import { createHash } from "node:crypto";

import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";

type CounterRow = { count: number };

function hashedKey(scope: string, identifier: string) {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
}

export async function enforceRateLimit(params: {
  scope: string;
  identifier: string;
  max: number;
  windowSeconds: number;
}) {
  const key = `app:${hashedKey(params.scope, params.identifier)}`;
  const now = Date.now();
  const windowStart = now - params.windowSeconds * 1000;
  const rows = await prisma.$queryRaw<CounterRow[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${key}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${BigInt(windowStart)} THEN 1
        ELSE "rateLimit"."count" + 1
      END,
      "lastRequest" = ${BigInt(now)}
    RETURNING "count"
  `;

  if ((rows[0]?.count ?? params.max + 1) > params.max) {
    throw new ActionError("Too many requests. Please try again later.");
  }
}
