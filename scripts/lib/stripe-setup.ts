/* eslint-disable no-console */
/**
 * Provisions the Moodday v1 catalogue in Stripe test mode.
 *
 * Live provisioning is deliberately blocked here: the live account must first
 * be confirmed as Moodday-only and its legal/tax settings reviewed.
 */

import Stripe from "stripe";

import type { ProjectConfig } from "./init-config";
import { colors, log, question } from "./init-config";

const PRODUCT = {
  name: "Moodday Plus",
  description:
    "Le suivi complet de votre humeur, sommeil et traitements, avec bilans IA sourcés, rapports de consultation et cercle aidant — sans diagnostic ni recommandation médicale.",
  taxCode: "txcd_10103000",
  monthly: {
    amount: 799,
    interval: "month" as const,
    lookupKey: "moodday_plus_monthly_eur_v1",
  },
  yearly: {
    amount: 5999,
    interval: "year" as const,
    lookupKey: "moodday_plus_yearly_eur_v1",
  },
};

type StripeEnvVars = {
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_PLUS_MONTHLY_PRICE_ID?: string;
  STRIPE_PLUS_YEARLY_PRICE_ID?: string;
  BILLING_ENABLED?: string;
};

async function findPrice(stripe: Stripe, lookupKey: string) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  return prices.data.at(0);
}

export async function setupStripe(
  config: ProjectConfig,
): Promise<StripeEnvVars> {
  const envVars: StripeEnvVars = {};
  if (!config.setupStripe) {
    log.info("Configuration Stripe ignorée");
    return envVars;
  }

  console.log("\n");
  log.info(
    "Utilisez uniquement les clés du compte Stripe test dédié à Moodday.",
  );
  console.log(
    `${colors.dim}Clés : https://dashboard.stripe.com/test/apikeys${colors.reset}`,
  );

  const secretKey = await question("STRIPE_SECRET_KEY de test (sk_test_...): ");
  const publishableKey = await question(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY de test (pk_test_...): ",
  );

  if (!secretKey.startsWith("sk_test_")) {
    log.error(
      "Provisioning interrompu : ce script refuse les clés live. Validez d'abord le compte, la TVA et le branding Moodday.",
    );
    return envVars;
  }
  if (!publishableKey.startsWith("pk_test_")) {
    log.error("La clé publique doit appartenir au même environnement test.");
    return envVars;
  }

  const stripe = new Stripe(secretKey);
  const existingMonthly = await findPrice(stripe, PRODUCT.monthly.lookupKey);
  const existingYearly = await findPrice(stripe, PRODUCT.yearly.lookupKey);

  if (existingMonthly || existingYearly) {
    if (!existingMonthly || !existingYearly) {
      log.error("Catalogue v1 incomplet : corrigez Stripe avant de relancer.");
      return envVars;
    }
    log.info("Catalogue Moodday v1 existant détecté ; aucun doublon créé.");
    envVars.STRIPE_PLUS_MONTHLY_PRICE_ID = existingMonthly.id;
    envVars.STRIPE_PLUS_YEARLY_PRICE_ID = existingYearly.id;
  } else {
    const product = await stripe.products.create({
      name: PRODUCT.name,
      description: PRODUCT.description,
      tax_code: PRODUCT.taxCode,
      metadata: {
        app: "moodday",
        plan: "plus",
        catalog_version: "1",
        lifecycle: "public",
      },
    });

    const monthly = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: PRODUCT.monthly.amount,
      recurring: { interval: PRODUCT.monthly.interval },
      lookup_key: PRODUCT.monthly.lookupKey,
      tax_behavior: "inclusive",
      metadata: { app: "moodday", plan: "plus", catalog_version: "1" },
    });
    const yearly = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: PRODUCT.yearly.amount,
      recurring: { interval: PRODUCT.yearly.interval },
      lookup_key: PRODUCT.yearly.lookupKey,
      tax_behavior: "inclusive",
      metadata: { app: "moodday", plan: "plus", catalog_version: "1" },
    });
    await stripe.products.update(product.id, { default_price: monthly.id });

    envVars.STRIPE_PLUS_MONTHLY_PRICE_ID = monthly.id;
    envVars.STRIPE_PLUS_YEARLY_PRICE_ID = yearly.id;
    log.success(`Produit test créé : ${PRODUCT.name}`);
    log.success("Prix test créés : 7,99 € / mois et 59,99 € / an TTC");
  }

  envVars.STRIPE_SECRET_KEY = secretKey;
  envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishableKey;
  envVars.BILLING_ENABLED = "false";
  log.warn(
    "BILLING_ENABLED reste désactivé jusqu'à la validation du portail, du webhook et des tests d'abonnement.",
  );
  return envVars;
}
