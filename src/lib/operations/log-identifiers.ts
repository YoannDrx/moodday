import "server-only";

import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

/** Stable, non-reversible identifier for correlating operational events. */
export const getOperationalSubjectReference = (userId: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`moodday-operational-log:${userId}`)
    .digest("base64url")
    .slice(0, 32);

export const getOperationalIdentifier = (scope: string, value: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`moodday-operational-${scope}:${value}`)
    .digest("base64url")
    .slice(0, 32);

export const getOperationalErrorCode = (error: unknown) =>
  error instanceof Error && error.name ? error.name : "unknown_error";
