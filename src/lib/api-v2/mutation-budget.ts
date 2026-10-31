import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ZodRouteError } from "@/lib/errors/zod-route-error";

export class MutationRateLimitError extends ZodRouteError {
  constructor(readonly retryAfter: number) {
    super("Too many requests. Please try again later.", 429);
  }
}

export async function enforceMutationBudget(userId: string, now = Date.now()) {
  const windowSeconds = 60;
  const windowStart = Math.floor(now / 60_000) * 60_000;
  const key = `mutation:${createHash("sha256").update(userId).digest("hex")}`;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${BigInt(windowStart)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rateLimit"."lastRequest" < ${BigInt(windowStart)} THEN 1 ELSE "rateLimit"."count" + 1 END,
      "lastRequest" = ${BigInt(windowStart)}
    RETURNING "count"
  `;
  // Shared across devices; one sync request can carry the bounded offline batch.
  if ((rows[0]?.count ?? 601) > 600) {
    throw new MutationRateLimitError(
      Math.max(1, windowSeconds - Math.floor((now - windowStart) / 1000)),
    );
  }
}

export async function isBodyWithinBudget(
  request: Request,
  maximum = 1024 * 1024,
) {
  if (!request.body) return true;
  if (Number(request.headers.get("content-length")) > maximum) return false;
  const body = request.clone().body;
  if (!body) return true;
  const reader = body.getReader();
  let bytes = 0;
  try {
    // Each read must finish before enforcing the cumulative byte limit.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const chunk = await reader.read();
      if (chunk.done) return true;
      bytes += chunk.value.byteLength;
      if (bytes > maximum) return false;
    }
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}
