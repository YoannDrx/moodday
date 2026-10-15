import "server-only";
/* eslint-disable no-await-in-loop -- provider sources are reconciled serially in one transaction */

import type {
  SubscriptionProvider,
  SubscriptionSourceStatus,
} from "@prisma/client";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { refreshUnifiedEntitlementProjection } from "@/lib/billing/unified-entitlement";

const revenueCatSubscriptionSchema = z.object({
  auto_resume_date: z.string().datetime().nullable().optional(),
  billing_issues_detected_at: z.string().datetime().nullable().optional(),
  expires_date: z.string().datetime().nullable(),
  grace_period_expires_date: z.string().datetime().nullable().optional(),
  period_type: z.string().optional(),
  refunded_at: z.string().datetime().nullable().optional(),
  store: z.string(),
});

const revenueCatEntitlementSchema = z.object({
  expires_date: z.string().datetime().nullable(),
  grace_period_expires_date: z.string().datetime().nullable().optional(),
  product_identifier: z.string(),
});

const revenueCatSubscriberSchema = z.object({
  subscriber: z.object({
    entitlements: z.record(z.string(), revenueCatEntitlementSchema),
    subscriptions: z.record(z.string(), revenueCatSubscriptionSchema),
  }),
});

const mobileProviders: SubscriptionProvider[] = ["app_store", "play_store"];

const listFromEnvironment = (value?: string) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const parseDate = (value?: string | null) => (value ? new Date(value) : null);

const toProvider = (store: string): SubscriptionProvider | null => {
  if (store === "app_store" || store === "mac_app_store") return "app_store";
  if (store === "play_store") return "play_store";
  return null;
};

const getStatus = (
  subscription: z.infer<typeof revenueCatSubscriptionSchema>,
  now: Date,
): { status: SubscriptionSourceStatus; validUntil: Date | null } => {
  const expiration = parseDate(subscription.expires_date);
  const graceExpiration = parseDate(subscription.grace_period_expires_date);
  if (subscription.refunded_at)
    return { status: "refunded", validUntil: expiration };
  if (graceExpiration && graceExpiration > now) {
    return { status: "grace", validUntil: graceExpiration };
  }
  if (expiration === null || expiration > now) {
    return {
      status:
        subscription.period_type?.toLowerCase() === "trial"
          ? "trialing"
          : "active",
      validUntil: expiration,
    };
  }
  if (subscription.auto_resume_date) {
    return { status: "paused", validUntil: expiration };
  }
  return { status: "expired", validUntil: expiration };
};

export class RevenueCatConfigurationError extends Error {
  constructor() {
    super("revenuecat_configuration_incomplete");
    this.name = "RevenueCatConfigurationError";
  }
}

export class RevenueCatSubscriberError extends Error {
  constructor(
    code:
      | "unknown_user"
      | "subscriber_request_failed"
      | "subscriber_response_invalid",
  ) {
    super(code);
    this.name = "RevenueCatSubscriberError";
  }
}

export function isRevenueCatConfigured() {
  return Boolean(
    env.REVENUECAT_SECRET_API_KEY && env.REVENUECAT_PLUS_PRODUCT_IDS,
  );
}

async function fetchRevenueCatSubscriber(appUserId: string) {
  if (!env.REVENUECAT_SECRET_API_KEY) {
    throw new RevenueCatConfigurationError();
  }
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok)
    throw new RevenueCatSubscriberError("subscriber_request_failed");
  const parsed = revenueCatSubscriberSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new RevenueCatSubscriberError("subscriber_response_invalid");
  }
  return parsed.data.subscriber;
}

export async function syncRevenueCatCustomer(userId: string, now = new Date()) {
  if (!isRevenueCatConfigured()) throw new RevenueCatConfigurationError();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new RevenueCatSubscriberError("unknown_user");

  const subscriber = await fetchRevenueCatSubscriber(userId);
  const configuredProducts = listFromEnvironment(
    env.REVENUECAT_PLUS_PRODUCT_IDS,
  );
  const selectedEntitlement = subscriber.entitlements[
    env.REVENUECAT_ENTITLEMENT_ID
  ] as z.infer<typeof revenueCatEntitlementSchema> | undefined;
  const entitlementProduct = selectedEntitlement?.product_identifier;
  if (entitlementProduct) configuredProducts.add(entitlementProduct);

  const observedSourceIds: string[] = [];
  await prisma.$transaction(async (transaction) => {
    for (const [productId, subscription] of Object.entries(
      subscriber.subscriptions,
    )) {
      if (!configuredProducts.has(productId)) continue;
      const provider = toProvider(subscription.store);
      if (!provider) continue;
      const externalSubscriptionId = `${provider}:${userId}:${productId}`;
      observedSourceIds.push(externalSubscriptionId);
      const state = getStatus(subscription, now);
      await transaction.subscriptionSource.upsert({
        where: {
          provider_externalSubscriptionId: {
            provider,
            externalSubscriptionId,
          },
        },
        create: {
          userId,
          provider,
          externalCustomerId: userId,
          externalSubscriptionId,
          productId,
          status: state.status,
          currentPeriodEndsAt: state.validUntil,
          lastVerifiedAt: now,
        },
        update: {
          userId,
          externalCustomerId: userId,
          productId,
          status: state.status,
          currentPeriodEndsAt: state.validUntil,
          lastVerifiedAt: now,
        },
      });
    }

    await transaction.subscriptionSource.updateMany({
      where: {
        userId,
        provider: { in: mobileProviders },
        ...(observedSourceIds.length > 0
          ? { externalSubscriptionId: { notIn: observedSourceIds } }
          : {}),
      },
      data: { status: "expired", lastVerifiedAt: now },
    });
  });
  return refreshUnifiedEntitlementProjection(userId, now);
}

export function getSafeRevenueCatErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "unknown_error";
  const allowed = new Set([
    "revenuecat_configuration_incomplete",
    "subscriber_request_failed",
    "subscriber_response_invalid",
    "unknown_user",
  ]);
  return allowed.has(error.message)
    ? error.message
    : "revenuecat_handler_failed";
}
