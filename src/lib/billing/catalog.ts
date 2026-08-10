import "server-only";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { ActionError } from "@/lib/errors/action-error";
import type Stripe from "stripe";

export const BILLING_CATALOG_VERSION = "1";
export const MOODDAY_PLUS_PRODUCT_NAME = "Moodday Plus";

export const PLUS_PRICE_SPECS = {
  monthly: {
    amount: 799,
    currency: "eur",
    interval: "month",
    lookupKey: "moodday_plus_monthly_eur_v1",
  },
  yearly: {
    amount: 5999,
    currency: "eur",
    interval: "year",
    lookupKey: "moodday_plus_yearly_eur_v1",
  },
} as const;

export type BillingInterval = keyof typeof PLUS_PRICE_SPECS;

export function getConfiguredPlusPriceId(interval: BillingInterval) {
  return interval === "yearly"
    ? env.STRIPE_PLUS_YEARLY_PRICE_ID
    : env.STRIPE_PLUS_MONTHLY_PRICE_ID;
}

export function getPlanFromPriceId(priceId?: string | null) {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PLUS_MONTHLY_PRICE_ID) {
    return { plan: "plus" as const, interval: "monthly" as const };
  }
  if (priceId === env.STRIPE_PLUS_YEARLY_PRICE_ID) {
    return { plan: "plus" as const, interval: "yearly" as const };
  }
  return null;
}

export function isExpectedMooddayPlusPrice(
  price: Stripe.Price,
  interval: BillingInterval,
) {
  const expected = PLUS_PRICE_SPECS[interval];
  const product =
    typeof price.product === "string" || price.product.deleted
      ? null
      : price.product;

  return Boolean(
    price.active &&
      price.currency === expected.currency &&
      price.unit_amount === expected.amount &&
      price.recurring?.interval === expected.interval &&
      price.tax_behavior === "inclusive" &&
      price.lookup_key === expected.lookupKey &&
      price.metadata.app === "moodday" &&
      price.metadata.plan === "plus" &&
      price.metadata.catalog_version === BILLING_CATALOG_VERSION &&
      product?.active &&
      product.name === MOODDAY_PLUS_PRODUCT_NAME &&
      product.metadata.app === "moodday" &&
      product.metadata.plan === "plus" &&
      product.metadata.catalog_version === BILLING_CATALOG_VERSION &&
      product.metadata.lifecycle === "public",
  );
}

export async function assertConfiguredStripePrice(interval: BillingInterval) {
  const priceId = getConfiguredPlusPriceId(interval);
  if (!priceId || !env.STRIPE_ACCOUNT_ID) {
    throw new ActionError("Moodday Plus is not configured for this interval");
  }

  const stripe = getStripe();
  const [account, price] = await Promise.all([
    stripe.accounts.retrieve(),
    stripe.prices.retrieve(priceId, { expand: ["product"] }),
  ]);

  if (
    account.id !== env.STRIPE_ACCOUNT_ID ||
    !isExpectedMooddayPlusPrice(price, interval)
  ) {
    throw new ActionError("The Stripe catalog does not match Moodday Plus");
  }

  return price;
}
