import "server-only";

import { getPlanFromPriceId } from "@/lib/billing/catalog";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { refreshUnifiedEntitlementProjection } from "@/lib/billing/unified-entitlement";
import type Stripe from "stripe";

const SUPPORTED_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
]);

const asId = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;

const toDate = (unixSeconds?: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000) : null;

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const fromLegacy = asId(legacy.subscription);
  if (fromLegacy) return fromLegacy;

  const parent = invoice.parent;
  if (parent?.type !== "subscription_details") return null;
  return asId(parent.subscription_details?.subscription);
}

function getSubscriptionId(object: Stripe.Event.Data.Object) {
  const stripeObject = object as unknown as {
    object?: string;
    id?: string;
    subscription?: string | { id: string } | null;
  };
  if (stripeObject.object === "subscription") return stripeObject.id ?? null;
  if (stripeObject.object === "checkout.session") {
    return asId(stripeObject.subscription);
  }
  if (stripeObject.object === "invoice") {
    return getInvoiceSubscriptionId(object as Stripe.Invoice);
  }
  return null;
}

async function findSubscriptionUser(subscription: Stripe.Subscription) {
  const customerId = asId(subscription.customer);
  if (!customerId) throw new Error("missing_customer");

  const userByCustomer = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, stripeCustomerId: true },
  });
  if (userByCustomer) return userByCustomer;

  const userId = subscription.metadata.userId;
  if (!userId) throw new Error("missing_user_mapping");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, stripeCustomerId: true },
  });
  if (!user) throw new Error("unknown_user");
  if (user.stripeCustomerId && user.stripeCustomerId !== customerId) {
    throw new Error("customer_account_mismatch");
  }

  if (!user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  return { ...user, stripeCustomerId: customerId };
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const mappedPrice = getPlanFromPriceId(item.price.id);
  if (!mappedPrice) throw new Error("unapproved_price");

  const user = await findSubscriptionUser(subscription);
  const previous = await prisma.subscription.findUnique({
    where: { referenceId: user.id },
    select: { graceEndsAt: true, trialUsedAt: true },
  });
  const customerId = asId(subscription.customer);
  if (!customerId) throw new Error("missing_customer");

  const canceled = ["canceled", "unpaid", "incomplete_expired"].includes(
    subscription.status,
  );
  const graceEndsAt =
    subscription.status === "past_due"
      ? (previous?.graceEndsAt ??
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      : null;
  const trialUsedAt =
    previous?.trialUsedAt ??
    toDate(subscription.trial_start) ??
    (subscription.status === "trialing" ? new Date() : null);

  await prisma.subscription.upsert({
    where: { referenceId: user.id },
    create: {
      id: subscription.id,
      referenceId: user.id,
      plan: canceled ? "free" : mappedPrice.plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: item.price.id,
      billingInterval: mappedPrice.interval,
      periodStart: toDate(item.current_period_start),
      periodEnd: toDate(item.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialUsedAt,
      graceEndsAt,
      lastSyncedAt: new Date(),
    },
    update: {
      plan: canceled ? "free" : mappedPrice.plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: item.price.id,
      billingInterval: mappedPrice.interval,
      periodStart: toDate(item.current_period_start),
      periodEnd: toDate(item.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialUsedAt,
      graceEndsAt,
      lastSyncedAt: new Date(),
    },
  });

  const currentPeriodEndsAt = toDate(item.current_period_end);
  const sourceStatus =
    subscription.status === "trialing"
      ? "trialing"
      : subscription.status === "past_due" &&
          graceEndsAt &&
          graceEndsAt > new Date()
        ? "grace"
        : subscription.status === "active"
          ? "active"
          : subscription.status === "paused"
            ? "paused"
            : "expired";
  await prisma.subscriptionSource.upsert({
    where: {
      provider_externalSubscriptionId: {
        provider: "stripe",
        externalSubscriptionId: subscription.id,
      },
    },
    create: {
      userId: user.id,
      provider: "stripe",
      externalCustomerId: customerId,
      externalSubscriptionId: subscription.id,
      productId: item.price.id,
      status: sourceStatus,
      currentPeriodEndsAt:
        sourceStatus === "grace" ? graceEndsAt : currentPeriodEndsAt,
      lastVerifiedAt: new Date(),
    },
    update: {
      userId: user.id,
      externalCustomerId: customerId,
      productId: item.price.id,
      status: sourceStatus,
      currentPeriodEndsAt:
        sourceStatus === "grace" ? graceEndsAt : currentPeriodEndsAt,
      lastVerifiedAt: new Date(),
    },
  });
  return refreshUnifiedEntitlementProjection(user.id);
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  if (!SUPPORTED_EVENTS.has(event.type)) return { ignored: true as const };
  if (event.type === "checkout.session.expired") {
    return { ignored: true as const };
  }

  const subscriptionId = getSubscriptionId(event.data.object);
  if (!subscriptionId) {
    if (event.type === "checkout.session.completed") {
      throw new Error("checkout_missing_subscription");
    }
    return { ignored: true as const };
  }

  // Always read Stripe's current state. Delayed or out-of-order event payloads
  // must never overwrite a newer subscription state stored locally.
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
  return { ignored: false as const };
}

export function getSafeStripeWebhookErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "unknown_error";
  const allowed = new Set([
    "checkout_missing_subscription",
    "customer_account_mismatch",
    "missing_customer",
    "missing_user_mapping",
    "unknown_user",
    "unapproved_price",
  ]);
  return allowed.has(error.message) ? error.message : "stripe_handler_failed";
}
