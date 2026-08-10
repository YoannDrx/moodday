#!/usr/bin/env tsx
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";

import { config } from "dotenv";

const root = process.cwd();
for (const filename of [".env.local", ".env"]) {
  const candidate = path.join(root, filename);
  if (fs.existsSync(candidate))
    config({ path: candidate, override: false, quiet: true });
}

const strict = process.argv.includes("--strict");
let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  const state = ok ? "OK" : strict ? "ERROR" : "WARN";
  console.log(`[${state}] ${label}: ${detail}`);
  if (!ok && strict) failures += 1;
}

function safeHost(name: string) {
  const value = process.env[name];
  if (!value) return "non configuré";
  try {
    return new URL(value).hostname;
  } catch {
    return "format URL invalide";
  }
}

function hasPrefix(name: string, prefixes: string[]) {
  const value = process.env[name];
  return Boolean(value && prefixes.some((prefix) => value.startsWith(prefix)));
}

console.log("Audit d'environnement Moodday (aucun secret n'est affiché)\n");
check("Postgres", Boolean(process.env.DATABASE_URL), safeHost("DATABASE_URL"));
check(
  "Stripe secret",
  hasPrefix("STRIPE_SECRET_KEY", ["sk_test_", "sk_live_"]),
  process.env.STRIPE_SECRET_KEY ? "préfixe reconnu" : "non configuré",
);
check(
  "Stripe mensuel",
  hasPrefix("STRIPE_PLUS_MONTHLY_PRICE_ID", ["price_"]),
  process.env.STRIPE_PLUS_MONTHLY_PRICE_ID
    ? "Price ID présent"
    : "non configuré",
);
check(
  "Stripe annuel",
  hasPrefix("STRIPE_PLUS_YEARLY_PRICE_ID", ["price_"]),
  process.env.STRIPE_PLUS_YEARLY_PRICE_ID
    ? "Price ID présent"
    : "non configuré",
);
check(
  "Portail Stripe dédié",
  hasPrefix("STRIPE_PORTAL_CONFIGURATION_ID", ["bpc_"]),
  process.env.STRIPE_PORTAL_CONFIGURATION_ID
    ? "configuration présente"
    : "non configuré",
);
check(
  "OpenAI",
  hasPrefix("OPENAI_API_KEY", ["sk-", "sk-proj-"]),
  process.env.OPENAI_API_KEY ? "clé projet présente" : "non configuré",
);
check(
  "HMAC IA",
  (process.env.AI_SAFETY_HMAC_SECRET?.length ?? 0) >= 32,
  process.env.AI_SAFETY_HMAC_SECRET ? "longueur suffisante" : "non configuré",
);

const vercelConfig = JSON.parse(
  fs.readFileSync(path.join(root, "vercel.json"), "utf8"),
) as { regions?: string[]; crons?: { path: string; schedule: string }[] };
check(
  "Région Vercel",
  vercelConfig.regions?.length === 1 && vercelConfig.regions[0] === "fra1",
  vercelConfig.regions?.join(", ") ?? "non configurée",
);
check(
  "Cron notifications",
  Boolean(
    vercelConfig.crons?.some(
      (cron) =>
        cron.path === "/api/cron/notifications" &&
        cron.schedule === "*/5 * * * *",
    ),
  ),
  "fréquence attendue : toutes les 5 minutes",
);

if (process.env.BILLING_ENABLED === "true") {
  check(
    "Activation billing",
    Boolean(
      process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.STRIPE_PORTAL_CONFIGURATION_ID &&
        process.env.STRIPE_PLUS_MONTHLY_PRICE_ID &&
        process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
    ),
    "webhook, portail et deux Price IDs requis",
  );
}
if (process.env.AI_INSIGHTS_ENABLED === "true") {
  check(
    "Activation IA",
    Boolean(
      process.env.OPENAI_API_KEY &&
        (process.env.AI_SAFETY_HMAC_SECRET?.length ?? 0) >= 32,
    ),
    "clé projet et HMAC requis",
  );
}

if (failures > 0) process.exitCode = 1;
