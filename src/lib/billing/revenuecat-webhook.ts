import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";

export const revenueCatWebhookSchema = z.object({
  api_version: z.string().max(20),
  event: z
    .object({
      id: z.string().min(1).max(255),
      type: z.string().min(1).max(100),
      event_timestamp_ms: z.number().int().nonnegative(),
      app_id: z.string().max(255).nullable().optional(),
      app_user_id: z.string().max(255).nullable().optional(),
      original_app_user_id: z.string().max(255).nullable().optional(),
      aliases: z.array(z.string().max(255)).max(100).optional(),
      transferred_to: z.array(z.string().max(255)).max(100).optional(),
      environment: z.string().max(40).nullable().optional(),
      store: z.string().max(40).nullable().optional(),
    })
    .passthrough(),
});

export type RevenueCatWebhook = z.infer<typeof revenueCatWebhookSchema>;

const matches = (provided: string, expected: string) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export function verifyRevenueCatAuthorization(header: string | null) {
  return Boolean(
    header &&
      env.REVENUECAT_WEBHOOK_AUTH_TOKEN &&
      matches(header, `Bearer ${env.REVENUECAT_WEBHOOK_AUTH_TOKEN}`),
  );
}

export function verifyRevenueCatSignature(params: {
  header: string | null;
  rawBody: string;
  now?: Date;
}) {
  if (!params.header || !env.REVENUECAT_WEBHOOK_SIGNING_SECRET) return false;
  const parts = Object.fromEntries(
    params.header.split(",").map((part) => {
      const separator = part.indexOf("=");
      return [part.slice(0, separator), part.slice(separator + 1)];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const ageSeconds = Math.abs(
    (params.now?.getTime() ?? Date.now()) / 1000 - Number(timestamp),
  );
  if (!Number.isFinite(ageSeconds) || ageSeconds > 5 * 60) return false;
  const expected = createHmac("sha256", env.REVENUECAT_WEBHOOK_SIGNING_SECRET)
    .update(`${timestamp}.${params.rawBody}`)
    .digest("hex");
  return matches(signature, expected);
}

const configuredValues = (value?: string) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

export function isRevenueCatWebhookInScope(event: RevenueCatWebhook["event"]) {
  const appIds = configuredValues(env.REVENUECAT_ALLOWED_APP_IDS);
  if (appIds.size > 0 && (!event.app_id || !appIds.has(event.app_id))) {
    return false;
  }
  const environments = configuredValues(
    env.REVENUECAT_WEBHOOK_ENVIRONMENTS.toUpperCase(),
  );
  return (
    !event.environment || environments.has(event.environment.toUpperCase())
  );
}

export function getRevenueCatCandidateUserIds(
  event: RevenueCatWebhook["event"],
) {
  return Array.from(
    new Set(
      [
        event.app_user_id,
        event.original_app_user_id,
        ...(event.aliases ?? []),
        ...(event.transferred_to ?? []),
      ].filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length > 0 &&
          !value.startsWith("$RCAnonymousID:"),
      ),
    ),
  );
}
