#!/usr/bin/env tsx
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import Stripe from "stripe";

for (const filename of [".env.local", ".env"]) {
  const candidate = path.join(process.cwd(), filename);
  if (fs.existsSync(candidate))
    config({ path: candidate, override: false, quiet: true });
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
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

async function main() {
  const [account, portal, ...prices] = await Promise.all([
    stripe.accounts.retrieveCurrent(),
    stripe.billingPortal.configurations.retrieve(
      process.env.STRIPE_PORTAL_CONFIGURATION_ID as string,
    ),
    ...specs.map(async (spec) =>
      stripe.prices.retrieve(spec.id, { expand: ["product"] }),
    ),
  ]);

  const readinessFailures: string[] = [];
  const configurationFailures: string[] = [];
  if (account.id !== process.env.STRIPE_ACCOUNT_ID)
    configurationFailures.push("account_mismatch");
  if (!account.charges_enabled) readinessFailures.push("charges_disabled");
  if (!account.payouts_enabled) readinessFailures.push("payouts_disabled");
  if (account.requirements?.currently_due?.length)
    readinessFailures.push("requirements_currently_due");
  if (!portal.active) configurationFailures.push("portal_inactive");
  if (!portal.features.customer_update.enabled)
    configurationFailures.push("portal_customer_update_disabled");
  if (!portal.features.invoice_history.enabled)
    configurationFailures.push("portal_invoice_history_disabled");
  if (!portal.features.payment_method_update.enabled)
    configurationFailures.push("portal_payment_method_disabled");
  if (!portal.features.subscription_cancel.enabled)
    configurationFailures.push("portal_cancel_disabled");
  if (portal.features.subscription_cancel.mode !== "at_period_end")
    configurationFailures.push("portal_cancel_mode");
  if (!portal.features.subscription_update.enabled)
    configurationFailures.push("portal_subscription_update_disabled");
  if (
    !portal.features.subscription_update.default_allowed_updates.includes(
      "price",
    )
  )
    configurationFailures.push("portal_price_update_disabled");

  prices.forEach((price, index) => {
    const spec = specs[index];
    const product =
      typeof price.product === "string" || price.product.deleted
        ? null
        : price.product;
    if (!price.active)
      configurationFailures.push(`${spec.label}_price_inactive`);
    if (price.currency !== "eur")
      configurationFailures.push(`${spec.label}_currency`);
    if (price.unit_amount !== spec.amount)
      configurationFailures.push(`${spec.label}_amount`);
    if (price.recurring?.interval !== spec.interval)
      configurationFailures.push(`${spec.label}_interval`);
    if (price.tax_behavior !== "inclusive")
      configurationFailures.push(`${spec.label}_tax_behavior`);
    if (price.lookup_key !== spec.lookupKey)
      configurationFailures.push(`${spec.label}_lookup_key`);
    if (
      price.metadata.app !== "moodday" ||
      price.metadata.plan !== "plus" ||
      price.metadata.catalog_version !== "1"
    )
      configurationFailures.push(`${spec.label}_metadata`);
    if (
      !product?.active ||
      product.name !== "Moodday Plus" ||
      product.metadata.app !== "moodday" ||
      product.metadata.plan !== "plus" ||
      product.metadata.catalog_version !== "1" ||
      product.metadata.lifecycle !== "public"
    )
      configurationFailures.push(`${spec.label}_product`);
    if (
      process.env.STRIPE_TAX_ENABLED === "true" &&
      (!process.env.STRIPE_PRODUCT_TAX_CODE ||
        product?.tax_code !== process.env.STRIPE_PRODUCT_TAX_CODE)
    ) {
      configurationFailures.push(`${spec.label}_tax_code`);
    }
  });

  console.log(
    JSON.stringify({
      mode: process.env.STRIPE_SECRET_KEY?.includes("_live_") ? "live" : "test",
      accountReady: account.charges_enabled && account.payouts_enabled,
      pricesChecked: prices.length,
      portalChecked: true,
      catalogValid: configurationFailures.length === 0,
      productionReady:
        configurationFailures.length === 0 && readinessFailures.length === 0,
      configurationFailures,
      readinessFailures,
    }),
  );

  if (configurationFailures.length > 0 || readinessFailures.length > 0)
    process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      catalogValid: false,
      failures: [error instanceof Error ? error.name : "validation_failed"],
    }),
  );
  process.exitCode = 1;
});
