import "server-only";

import { Prisma } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const CLAIM_PREFIX = "moodday-email-verification:";
const MAX_TOKEN_LENGTH = 4_096;

const getVerifiedExpiry = (token: string, now: Date) => {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  try {
    const header = JSON.parse(
      Buffer.from(encodedHeader, "base64url").toString("utf8"),
    ) as { alg?: unknown; typ?: unknown };
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { email?: unknown; exp?: unknown };
    if (
      header.alg !== "HS256" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    const providedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = createHmac("sha256", env.BETTER_AUTH_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    if (
      providedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(providedSignature, expectedSignature)
    ) {
      return null;
    }

    const expiresAt = new Date(payload.exp * 1000);
    return expiresAt.getTime() > now.getTime() ? expiresAt : null;
  } catch {
    return null;
  }
};

export const claimEmailVerificationToken = async (
  token: string,
  now = new Date(),
) => {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;
  const expiresAt = getVerifiedExpiry(token, now);
  if (!expiresAt) return false;

  const digest = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(token)
    .digest("hex");

  try {
    await prisma.verification.create({
      data: {
        id: `${CLAIM_PREFIX}${digest}`,
        identifier: "moodday-email-verification-consumed",
        value: "consumed",
        expiresAt,
        createdAt: now,
        updatedAt: now,
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
};
