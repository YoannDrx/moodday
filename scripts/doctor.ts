#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Diagnostic de santé pour Moodday
 * Usage: pnpm doctor
 *
 * Vérifie:
 * - Versions Node/pnpm/bun
 * - Login CLIs (gh, vercel, neon, stripe)
 * - Cohérence .env vs src/lib/env.ts
 * - Accès à la base de données
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

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
  section: (msg: string) =>
    console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
};

function getVersion(cmd: string): string | null {
  try {
    return execSync(`${cmd} --version`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function isLoggedIn(cmd: string): { ok: boolean; info?: string } {
  try {
    switch (cmd) {
      case "gh": {
        const result = execSync("gh auth status 2>&1", { encoding: "utf-8" });
        const match = result.match(/Logged in to .* as (\S+)/);
        return { ok: true, info: match ? match[1] : "connecté" };
      }
      case "vercel": {
        const result = execSync("vercel whoami", { encoding: "utf-8" }).trim();
        return { ok: true, info: result };
      }
      case "neon": {
        execSync("neon me", { stdio: "ignore" });
        return { ok: true };
      }
      case "stripe": {
        execSync("stripe config --list", { stdio: "ignore" });
        return { ok: true };
      }
      case "upstash": {
        execSync("upstash team list", { stdio: "ignore" });
        return { ok: true };
      }
      default:
        return { ok: false };
    }
  } catch {
    return { ok: false };
  }
}

function checkVersions(): void {
  log.section("Versions");

  const tools = [
    { cmd: "node", name: "Node.js", minVersion: "18" },
    { cmd: "pnpm", name: "pnpm", minVersion: "8" },
    { cmd: "bun", name: "Bun", minVersion: null },
  ];

  for (const tool of tools) {
    const version = getVersion(tool.cmd);
    if (version) {
      const versionNum = version.match(/\d+/)?.[0];
      if (
        tool.minVersion &&
        versionNum &&
        parseInt(versionNum) < parseInt(tool.minVersion)
      ) {
        log.warn(
          `${tool.name}: ${version} (min recommandé: ${tool.minVersion})`,
        );
      } else {
        log.success(`${tool.name}: ${version}`);
      }
    } else if (tool.cmd === "bun") {
      log.info(`${tool.name}: non installé (optionnel)`);
    } else {
      log.error(`${tool.name}: non installé`);
    }
  }
}

function checkCLIs(): void {
  log.section("CLIs");

  const clis = [
    { cmd: "gh", name: "GitHub CLI" },
    { cmd: "vercel", name: "Vercel CLI" },
    { cmd: "neon", name: "NeonDB CLI" },
    { cmd: "upstash", name: "Upstash CLI" },
    { cmd: "stripe", name: "Stripe CLI" },
  ];

  for (const cli of clis) {
    const version = getVersion(cli.cmd);
    if (!version) {
      log.warn(`${cli.name}: non installé`);
      continue;
    }

    const auth = isLoggedIn(cli.cmd);
    if (auth.ok) {
      const info = auth.info ? ` (${auth.info})` : "";
      log.success(`${cli.name}: connecté${info}`);
    } else {
      log.warn(`${cli.name}: non connecté → lance: ${cli.cmd} login`);
    }
  }
}

function checkEnvFile(): void {
  log.section("Variables d'environnement");

  const envPath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");

  const envFile = fs.existsSync(envLocalPath)
    ? envLocalPath
    : fs.existsSync(envPath)
      ? envPath
      : null;

  if (!envFile) {
    log.error("Aucun fichier .env ou .env.local trouvé");
    log.info("Lance: pnpm setup pour configurer le projet");
    return;
  }

  log.success(`Fichier trouvé: ${path.basename(envFile)}`);

  const envContent = fs.readFileSync(envFile, "utf-8");

  // Variables critiques
  const criticalVars = [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
  ];

  // Variables optionnelles par feature
  const optionalGroups = {
    "GitHub OAuth": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    "Google OAuth": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    Stripe: [
      "STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_PLUS_MONTHLY_PRICE_ID",
      "STRIPE_PLUS_YEARLY_PRICE_ID",
    ],
    "OpenAI bêta": ["OPENAI_API_KEY", "AI_SAFETY_HMAC_SECRET"],
    "Web Push": ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "CRON_SECRET"],
    Resend: ["RESEND_API_KEY"],
    Redis: ["REDIS_URL"],
    PostHog: ["NEXT_PUBLIC_POSTHOG_KEY"],
  };

  // Vérifier les variables critiques
  for (const varName of criticalVars) {
    const regex = new RegExp(`^${varName}=["']?(.+?)["']?$`, "m");
    const match = envContent.match(regex);
    if (match?.[1]) {
      log.success(`${varName}: configuré`);
    } else {
      log.error(`${varName}: MANQUANT (requis)`);
    }
  }

  // Vérifier les features optionnelles
  for (const [feature, vars] of Object.entries(optionalGroups)) {
    const configured = vars.every((varName) => {
      const regex = new RegExp(`^${varName}=["']?(.+?)["']?$`, "m");
      return envContent.match(regex)?.[1];
    });

    if (configured) {
      log.success(`${feature}: activé`);
    } else {
      log.info(`${feature}: non configuré (optionnel)`);
    }
  }
}

function checkDatabase(): void {
  log.section("Base de données");

  try {
    execSync("pnpm prisma db execute --stdin <<< 'SELECT 1'", {
      stdio: "ignore",
      shell: "/bin/bash",
    });
    log.success("Connexion à la base de données: OK");
  } catch {
    log.warn("Impossible de vérifier la connexion DB");
    log.info("La DB sera testée au premier lancement de l'app");
  }

  // Vérifier si les migrations sont à jour
  try {
    const result = execSync("pnpm prisma migrate status 2>&1", {
      encoding: "utf-8",
    });
    if (result.includes("Database schema is up to date")) {
      log.success("Migrations: à jour");
    } else if (result.includes("Following migration")) {
      log.warn("Migrations en attente → lance: pnpm prisma migrate dev");
    }
  } catch {
    log.info("Statut des migrations non disponible");
  }
}

function checkProject(): void {
  log.section("Projet");

  // Vérifier package.json
  const pkgPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    log.success(`Nom: ${pkg.name}`);
    log.success(`Version: ${pkg.version}`);
  }

  // Vérifier .vercel
  if (fs.existsSync(path.join(process.cwd(), ".vercel/project.json"))) {
    log.success("Vercel: projet lié");
  } else {
    log.info("Vercel: non lié → lance: vercel link");
  }

  // Vérifier node_modules
  if (fs.existsSync(path.join(process.cwd(), "node_modules"))) {
    log.success("Dépendances: installées");
  } else {
    log.error("Dépendances: non installées → lance: pnpm install");
  }

  // Vérifier .next (build)
  if (fs.existsSync(path.join(process.cwd(), ".next"))) {
    log.success("Build: présent");
  } else {
    log.info("Build: non présent (normal en dev)");
  }
}

function main(): void {
  console.log("\n");
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                     Moodday Doctor                            ║",
  );
  console.log(
    "║                  Diagnostic du projet                        ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );

  checkVersions();
  checkCLIs();
  checkEnvFile();
  checkDatabase();
  checkProject();

  console.log("\n");
  log.info("Diagnostic terminé !");
  console.log("\n");
}

main();
