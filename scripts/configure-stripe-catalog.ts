#!/usr/bin/env tsx
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import Stripe from "stripe";

for (const filename of [".env.local", ".env"]) {
  const candidate = path.join(process.cwd(), filename);
  if (fs.existsSync(candidate)) {
    config({ path: candidate, override: false, quiet: true });
  }
}

const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_ACCOUNT_ID",
  "STRIPE_PLUS_MONTHLY_PRICE_ID",
  "STRIPE_PLUS_YEARLY_PRICE_ID",
  "STRIPE_PORTAL_CONFIGURATION_ID",
] as const;

for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const secretKey = process.env.STRIPE_SECRET_KEY as string;
const liveMode =
  secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
const expectedAcknowledgement = liveMode
  ? "reviewed-live-mode"
  : "isolated-test-mode";

if (process.env.STRIPE_CATALOG_CONFIGURATION_ACK !== expectedAcknowledgement) {
  throw new Error(
    `Set STRIPE_CATALOG_CONFIGURATION_ACK=${expectedAcknowledgement} to update this Stripe catalog`,
  );
}

const stripe = new Stripe(secretKey);
const specs = [
  {
    label: "monthly",
    id: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID as string,
    amount: 799,
    interval: "month",
    lookupKey: "moodday_plus_monthly_eur_v1",
  },
  {
    label: "yearly",
    id: process.env.STRIPE_PLUS_YEARLY_PRICE_ID as string,
    amount: 5999,
    interval: "year",
    lookupKey: "moodday_plus_yearly_eur_v1",
  },
] as const;

function assertPriceMatchesImmutableCatalog(
  price: Stripe.Price,
  spec: (typeof specs)[number],
) {
  if (price.livemode !== liveMode)
    throw new Error(`${spec.label}_mode_mismatch`);
  if (!price.active) throw new Error(`${spec.label}_price_inactive`);
  if (price.currency !== "eur")
    throw new Error(`${spec.label}_currency_mismatch`);
  if (price.unit_amount !== spec.amount)
    throw new Error(`${spec.label}_amount_mismatch`);
  if (price.recurring?.interval !== spec.interval)
    throw new Error(`${spec.label}_interval_mismatch`);
  if (price.tax_behavior !== "inclusive")
    throw new Error(`${spec.label}_tax_behavior_mismatch`);
  if (price.lookup_key !== spec.lookupKey)
    throw new Error(`${spec.label}_lookup_key_mismatch`);
}

async function main() {
  const [account, portal, ...prices] = await Promise.all([
    stripe.accounts.retrieveCurrent(),
    stripe.billingPortal.configurations.retrieve(
      process.env.STRIPE_PORTAL_CONFIGURATION_ID as string,
    ),
    ...specs.map(async (spec) => stripe.prices.retrieve(spec.id)),
  ]);

  if (account.id !== process.env.STRIPE_ACCOUNT_ID) {
    throw new Error("stripe_account_mismatch");
  }
  if (portal.livemode !== liveMode) throw new Error("portal_mode_mismatch");
  prices.forEach((price, index) =>
    assertPriceMatchesImmutableCatalog(price, specs[index]),
  );

  const productIds = new Set(
    prices.map((price) =>
      typeof price.product === "string" ? price.product : price.product.id,
    ),
  );
  if (productIds.size !== 1) throw new Error("prices_do_not_share_product");
  const productId = [...productIds][0];
  if (!productId) throw new Error("product_missing");

  const product = await stripe.products.retrieve(productId);
  if (process.env.STRIPE_TAX_ENABLED === "true") {
    const expectedTaxCode = process.env.STRIPE_PRODUCT_TAX_CODE;
    if (!expectedTaxCode || product.tax_code !== expectedTaxCode) {
      throw new Error("tax_code_requires_accountant_review");
    }
  }

  await Promise.all([
    stripe.products.update(productId, {
      name: "Moodday Plus",
      description:
        "Continuité Mood Day sur le web et le mobile, avec les fonctionnalités Plus.",
      metadata: {
        app: "moodday",
        plan: "plus",
        catalog_version: "1",
        lifecycle: "public",
      },
    }),
    ...prices.map(async (price) =>
      stripe.prices.update(price.id, {
        metadata: {
          app: "moodday",
          plan: "plus",
          catalog_version: "1",
        },
      }),
    ),
    stripe.billingPortal.configurations.update(portal.id, {
      business_profile: {
        headline: "Gère ton abonnement Mood Day Plus en toute autonomie.",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["address", "name"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "other",
            ],
          },
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price"],
          proration_behavior: "none",
        },
      },
      metadata: {
        app: "moodday",
        catalog_version: "1",
      },
    }),
  ]);

  console.log(
    JSON.stringify({
      configured: true,
      mode: liveMode ? "live" : "test",
      accountId: account.id,
      productId,
      prices: specs.map(({ label, id }) => ({ label, id })),
      portalConfigurationId: portal.id,
      accountReady: account.charges_enabled && account.payouts_enabled,
    }),
  );
}

void main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      configured: false,
      errorCode:
        error instanceof Error ? error.message : "configuration_failed",
    }),
  );
  process.exitCode = 1;
});
