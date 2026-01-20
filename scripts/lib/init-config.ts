/* eslint-disable no-console */
/**
 * Configuration types and input collection for init script
 */

import * as readline from "readline";

export type ProjectConfig = {
  // Project info
  slug: string;
  displayName: string;
  description: string;
  domain: string;
  contactEmail: string;

  // Company info
  companyName: string;
  companyAddress: string;

  // Options
  setupStripe: boolean;
  reinitGit: boolean;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const question = async (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

export const closeReadline = () => rl.close();

export const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
};

export const log = {
  info: (msg: string) =>
    console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg: string) =>
    console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg: string) =>
    console.log(`${colors.red}[ERREUR]${colors.reset} ${msg}`),
  step: (n: number, total: number, msg: string) =>
    console.log(`\n${colors.cyan}[${n}/${total}]${colors.reset} ${msg}`),
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function collectProjectConfig(): Promise<ProjectConfig> {
  console.log("\n");
  console.log(
    `${colors.bold}${colors.cyan}Configuration du projet${colors.reset}`,
  );
  console.log("");

  // Project name
  const displayName = await question("Nom du projet (ex: My SaaS): ");
  const defaultSlug = toSlug(displayName);
  const slugInput = await question(`Slug [${defaultSlug}]: `);
  const slug = slugInput || defaultSlug;

  // Description
  const description = await question("Description courte: ");

  // Domain
  const defaultDomain = `${slug}.com`;
  const domainInput = await question(
    `Domaine de production [${defaultDomain}]: `,
  );
  const domain = domainInput || defaultDomain;

  // Contact email
  const defaultEmail = `contact@${domain}`;
  const emailInput = await question(`Email de contact [${defaultEmail}]: `);
  const contactEmail = emailInput || defaultEmail;

  console.log("\n");
  console.log(
    `${colors.bold}${colors.cyan}Configuration entreprise${colors.reset}`,
  );
  console.log("");

  // Company
  const companyNameInput = await question(
    `Nom de l'entreprise [${displayName}]: `,
  );
  const companyName = companyNameInput || displayName;
  const companyAddress = await question("Adresse (optionnel): ");

  console.log("\n");
  console.log(`${colors.bold}${colors.cyan}Options${colors.reset}`);
  console.log("");

  // Options
  const stripeInput = await question(
    "Configurer Stripe et créer les produits ? (o/n) [o]: ",
  );
  const setupStripe = stripeInput.toLowerCase() !== "n";

  const gitInput = await question(
    "Réinitialiser Git (supprimer .git et recommencer) ? (o/n) [o]: ",
  );
  const reinitGit = gitInput.toLowerCase() !== "n";

  return {
    slug,
    displayName,
    description,
    domain,
    contactEmail,
    companyName,
    companyAddress,
    setupStripe,
    reinitGit,
  };
}

export function displayConfigSummary(config: ProjectConfig): void {
  console.log("\n");
  console.log(`${colors.bold}${colors.cyan}Récapitulatif${colors.reset}`);
  console.log("");
  console.log(`  Nom:          ${config.displayName}`);
  console.log(`  Slug:         ${config.slug}`);
  console.log(`  Description:  ${config.description}`);
  console.log(`  Domaine:      ${config.domain}`);
  console.log(`  Email:        ${config.contactEmail}`);
  console.log(`  Entreprise:   ${config.companyName}`);
  console.log(`  Stripe:       ${config.setupStripe ? "Oui" : "Non"}`);
  console.log(`  Réinit Git:   ${config.reinitGit ? "Oui" : "Non"}`);
  console.log("");
}
