/* eslint-disable no-console */
/**
 * Automatic Stripe product and price creation
 */

import { execSync } from "child_process";
import type { ProjectConfig } from "./init-config";
import { colors, log, question } from "./init-config";

type StripePlan = {
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  currency: string;
  trialDays: number;
};

const DEFAULT_PLANS: StripePlan[] = [
  {
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 4900, // $49
    yearlyPrice: 40000, // $400
    currency: "usd",
    trialDays: 14,
  },
  {
    name: "Ultra",
    description: "Enterprise-grade solution",
    monthlyPrice: 10000, // $100
    yearlyPrice: 100000, // $1000
    currency: "usd",
    trialDays: 14,
  },
];

type StripeEnvVars = {
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_PRO_MONTHLY_PRICE_ID?: string;
  STRIPE_PRO_YEARLY_PRICE_ID?: string;
  STRIPE_ULTRA_MONTHLY_PRICE_ID?: string;
  STRIPE_ULTRA_YEARLY_PRICE_ID?: string;
};

function stripeCliExists(): boolean {
  try {
    execSync("which stripe", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isStripeLoggedIn(): boolean {
  try {
    execSync("stripe config --list", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function setupStripe(
  config: ProjectConfig,
): Promise<StripeEnvVars> {
  const envVars: StripeEnvVars = {};

  if (!config.setupStripe) {
    log.info("Configuration Stripe ignorée");
    return envVars;
  }

  if (!stripeCliExists()) {
    log.warn(
      "Stripe CLI non installé. Installez-le avec: brew install stripe/stripe-cli/stripe",
    );
    return envVars;
  }

  if (!isStripeLoggedIn()) {
    log.warn("Stripe CLI non connecté. Connectez-vous avec: stripe login");
    const loginNow = await question(
      "Voulez-vous vous connecter maintenant ? (o/n) ",
    );
    if (loginNow.toLowerCase() === "o") {
      try {
        execSync("stripe login", { stdio: "inherit" });
      } catch {
        log.error("Échec de la connexion Stripe");
        return envVars;
      }
    } else {
      return envVars;
    }
  }

  // Get API keys
  console.log("\n");
  log.info("Récupération des clés API Stripe...");
  console.log(
    `${colors.dim}Allez sur https://dashboard.stripe.com/apikeys${colors.reset}`,
  );

  const sk = await question("STRIPE_SECRET_KEY (sk_...): ");
  const pk = await question("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_...): ");

  if (sk) envVars.STRIPE_SECRET_KEY = sk;
  if (pk) envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk;

  if (!sk) {
    log.warn("Clé secrète Stripe non fournie, création des produits ignorée");
    return envVars;
  }

  // Create products and prices
  log.info("Création des produits Stripe...");

  for (const plan of DEFAULT_PLANS) {
    try {
      // Create product
      const productResult = execSync(
        `stripe products create --name="${plan.name}" --description="${plan.description}" --api-key="${sk}" --format=json`,
        { encoding: "utf-8" },
      );
      const product = JSON.parse(productResult);
      log.success(`Produit créé: ${plan.name} (${product.id})`);

      // Create monthly price
      const monthlyPriceResult = execSync(
        `stripe prices create --product="${product.id}" --unit-amount=${plan.monthlyPrice} --currency=${plan.currency} --recurring-interval=month --lookup-key="${plan.name.toLowerCase()}_monthly" --api-key="${sk}" --format=json`,
        { encoding: "utf-8" },
      );
      const monthlyPrice = JSON.parse(monthlyPriceResult);
      log.success(
        `Prix mensuel créé: ${formatPrice(plan.monthlyPrice, plan.currency)}/mois`,
      );

      // Create yearly price
      const yearlyPriceResult = execSync(
        `stripe prices create --product="${product.id}" --unit-amount=${plan.yearlyPrice} --currency=${plan.currency} --recurring-interval=year --lookup-key="${plan.name.toLowerCase()}_yearly" --api-key="${sk}" --format=json`,
        { encoding: "utf-8" },
      );
      const yearlyPrice = JSON.parse(yearlyPriceResult);
      log.success(
        `Prix annuel créé: ${formatPrice(plan.yearlyPrice, plan.currency)}/an`,
      );

      // Store price IDs
      const planKey = plan.name.toUpperCase();
      envVars[`STRIPE_${planKey}_MONTHLY_PRICE_ID` as keyof StripeEnvVars] =
        monthlyPrice.id;
      envVars[`STRIPE_${planKey}_YEARLY_PRICE_ID` as keyof StripeEnvVars] =
        yearlyPrice.id;
    } catch (err) {
      log.error(`Erreur lors de la création du produit ${plan.name}: ${err}`);
    }
  }

  return envVars;
}

function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
