#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Setup interactif pour Moodday
 * Usage: pnpm setup
 *
 * Guide l'utilisateur pour configurer:
 * 1. Vérifier les CLIs (gh, vercel, neon, stripe)
 * 2. Configurer Vercel
 * 3. Configurer NeonDB (PostgreSQL)
 * 4. Configurer Stripe (optionnel)
 * 5. Générer .env.local
 * 6. Migrer la DB
 * 7. Configurer BMAD-METHOD (optionnel)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = async (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};

const log = {
  info: (msg: string) =>
    console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg: string) =>
    console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg: string) =>
    console.log(`${colors.red}[ERREUR]${colors.reset} ${msg}`),
  step: (n: number, msg: string) =>
    console.log(`\n${colors.blue}[${n}/7]${colors.reset} ${msg}`),
};

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isLoggedIn(cmd: string): boolean {
  try {
    switch (cmd) {
      case "gh":
        execSync("gh auth status", { stdio: "ignore" });
        return true;
      case "vercel":
        execSync("vercel whoami", { stdio: "ignore" });
        return true;
      case "neon":
        execSync("neon me", { stdio: "ignore" });
        return true;
      case "stripe":
        execSync("stripe config --list", { stdio: "ignore" });
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function runCommand(
  cmd: string,
  options?: { stdio?: "inherit" | "ignore" },
): boolean {
  try {
    execSync(cmd, { stdio: options?.stdio ?? "inherit" });
    return true;
  } catch {
    return false;
  }
}

async function checkCLIs(): Promise<void> {
  log.step(1, "Vérification des CLIs...");

  const clis = [
    { name: "gh", label: "GitHub CLI", required: true, pkg: "gh" },
    { name: "vercel", label: "Vercel CLI", required: true, pkg: "@vercel/cli" },
    { name: "neon", label: "NeonDB CLI", required: true, pkg: "neonctl" },
    { name: "stripe", label: "Stripe CLI", required: false, pkg: "stripe" },
    { name: "pnpm", label: "pnpm", required: true, pkg: "pnpm" },
  ];

  for (const cli of clis) {
    if (!commandExists(cli.name)) {
      if (cli.required) {
        log.error(
          `${cli.label} n'est pas installé. Installe-le avec: npm i -g ${cli.pkg}`,
        );
        process.exit(1);
      } else {
        log.warn(`${cli.label} n'est pas installé (optionnel)`);
      }
    } else if (!isLoggedIn(cli.name) && cli.name !== "pnpm") {
      log.warn(`${cli.label} n'est pas connecté. Lance: ${cli.name} login`);
    } else {
      log.success(`${cli.label} OK`);
    }
  }
}

async function setupVercel(): Promise<Record<string, string>> {
  log.step(2, "Configuration Vercel...");

  const envVars: Record<string, string> = {};

  if (fs.existsSync(".vercel/project.json")) {
    log.info("Projet Vercel déjà lié");
    const pullEnv = await question(
      "Veux-tu synchroniser les variables d'environnement ? (o/n) ",
    );
    if (pullEnv.toLowerCase() === "o") {
      runCommand("vercel env pull .env.local");
      log.success("Variables synchronisées dans .env.local");
    }
  } else {
    const link = await question("Veux-tu lier ce projet à Vercel ? (o/n) ");
    if (link.toLowerCase() === "o") {
      runCommand("vercel link");
      runCommand("vercel env pull .env.local");
      log.success("Projet lié et variables synchronisées");
    }
  }

  return envVars;
}

async function setupNeonDB(): Promise<Record<string, string>> {
  log.step(3, "Configuration NeonDB...");

  const envVars: Record<string, string> = {};

  const hasDbUrl = process.env.DATABASE_URL ?? "";
  if (hasDbUrl) {
    log.info("DATABASE_URL déjà configuré");
    return envVars;
  }

  const create = await question(
    "Veux-tu créer un nouveau projet NeonDB ? (o/n) ",
  );
  if (create.toLowerCase() === "o") {
    const projectName = await question("Nom du projet NeonDB: ");
    try {
      const result = execSync(
        `neon projects create --name "${projectName}" --output json`,
        {
          encoding: "utf-8",
        },
      );
      const project = JSON.parse(result);
      log.success(`Projet NeonDB créé: ${project.project.name}`);

      // Récupérer la connection string
      const connResult = execSync(
        `neon connection-string --project-id ${project.project.id} --output json`,
        { encoding: "utf-8" },
      );
      const conn = JSON.parse(connResult);
      envVars.DATABASE_URL = conn.connection_string;
      envVars.DATABASE_URL_UNPOOLED = conn.connection_string.replace(
        "-pooler",
        "",
      );
      log.success("Connection strings récupérées");
    } catch {
      log.error("Erreur lors de la création du projet NeonDB");
      log.info("Tu peux créer le projet manuellement sur https://neon.tech");
    }
  }

  return envVars;
}

async function setupStripe(): Promise<Record<string, string>> {
  log.step(4, "Configuration Stripe (optionnel)...");

  const envVars: Record<string, string> = {};

  if (!commandExists("stripe")) {
    log.warn("Stripe CLI non installé, skip cette étape");
    return envVars;
  }

  const setup = await question("Veux-tu configurer Stripe ? (o/n) ");
  if (setup.toLowerCase() !== "o") {
    log.info("Configuration Stripe ignorée");
    return envVars;
  }

  log.info(
    "Utilise uniquement le compte Stripe test dédié à Moodday : https://dashboard.stripe.com/test/apikeys",
  );
  const sk = await question("STRIPE_SECRET_KEY (sk_test_...): ");
  const pk = await question(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...): ",
  );

  if (!sk.startsWith("sk_test_") || !pk.startsWith("pk_test_")) {
    log.error("Cette configuration initiale refuse les clés Stripe live.");
    return envVars;
  }

  if (sk) envVars.STRIPE_SECRET_KEY = sk;
  if (pk) envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk;
  envVars.BILLING_ENABLED = "false";

  log.info("Pour le webhook secret, lance: pnpm stripe-webhooks");

  return envVars;
}

async function generateEnvFile(envVars: Record<string, string>): Promise<void> {
  log.step(5, "Génération du fichier .env.local...");

  const envPath = path.join(process.cwd(), ".env.local");
  const templatePath = path.join(process.cwd(), ".env-template");

  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      ".env.local existe déjà. Écraser ? (o/n) ",
    );
    if (overwrite.toLowerCase() !== "o") {
      log.info("Conservation du .env.local existant");
      return;
    }
  }

  if (fs.existsSync(templatePath)) {
    let template = fs.readFileSync(templatePath, "utf-8");

    // Remplacer les valeurs connues
    for (const [key, value] of Object.entries(envVars)) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      template = template.replace(regex, `${key}="${value}"`);
    }

    // Générer BETTER_AUTH_SECRET si vide
    if (
      !template.includes('BETTER_AUTH_SECRET="') ||
      template.includes('BETTER_AUTH_SECRET=""')
    ) {
      const secret = execSync("openssl rand -base64 32", {
        encoding: "utf-8",
      }).trim();
      template = template.replace(
        /BETTER_AUTH_SECRET=.*/,
        `BETTER_AUTH_SECRET="${secret}"`,
      );
    }

    fs.writeFileSync(envPath, template);
    log.success(".env.local généré depuis le template");
  } else {
    log.warn(".env-template non trouvé, création d'un .env.local minimal");
    const minimal = Object.entries(envVars)
      .map(([k, v]) => `${k}="${v}"`)
      .join("\n");
    fs.writeFileSync(envPath, minimal);
  }
}

async function setupDatabase(): Promise<void> {
  log.step(6, "Initialisation de la base de données...");

  const migrate = await question(
    "Veux-tu exécuter les migrations Prisma ? (o/n) ",
  );
  if (migrate.toLowerCase() === "o") {
    log.info("Exécution de prisma migrate dev...");
    if (runCommand("pnpm prisma migrate dev")) {
      log.success("Migrations appliquées");

      const seed = await question("Veux-tu seeder la base de données ? (o/n) ");
      if (seed.toLowerCase() === "o") {
        if (runCommand("pnpm prisma:seed")) {
          log.success("Base de données seedée");
        }
      }
    } else {
      log.error("Erreur lors des migrations. Vérifie ta DATABASE_URL");
    }
  }
}

async function setupBMAD(): Promise<void> {
  log.step(7, "Configuration BMAD-METHOD (optionnel)...");

  log.info("BMAD = Breakthrough Method for Agile AI Driven Development");
  log.info("Framework d'agents IA spécialisés pour le développement agile");

  const install = await question("Veux-tu installer BMAD-METHOD ? (o/n) ");
  if (install.toLowerCase() !== "o") {
    log.info("Installation BMAD ignorée");
    return;
  }

  log.info("Installation de BMAD-METHOD v6...");
  log.info("Quand demandé, sélectionne 'Claude Code' comme IDE");
  console.log("");

  try {
    // Exécuter npx bmad-method@alpha install de manière interactive
    execSync("npx bmad-method@alpha install", {
      stdio: "inherit",
    });
    log.success("BMAD-METHOD installé avec succès");
    log.info("Utilise *workflow-init dans un nouveau chat pour commencer");
  } catch {
    log.error("Erreur lors de l'installation de BMAD-METHOD");
    log.info("Tu peux l'installer manuellement: npx bmad-method@alpha install");
  }
}

async function main(): Promise<void> {
  console.log("\n");
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                       Moodday Setup                           ║",
  );
  console.log(
    "║              Configuration interactive du projet             ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log("\n");

  try {
    await checkCLIs();

    const vercelEnv = await setupVercel();
    const neonEnv = await setupNeonDB();
    const stripeEnv = await setupStripe();

    const allEnv = { ...vercelEnv, ...neonEnv, ...stripeEnv };
    await generateEnvFile(allEnv);

    await setupDatabase();

    await setupBMAD();

    console.log("\n");
    console.log(
      "╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                      Setup terminé !                         ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝",
    );
    console.log("\n");
    log.info("Prochaines étapes:");
    console.log(
      "  1. Vérifie ton .env.local et complète les valeurs manquantes",
    );
    console.log("  2. Lance: pnpm dev");
    console.log("\n");
  } catch (error) {
    log.error(`Erreur inattendue: ${error}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

void main();
