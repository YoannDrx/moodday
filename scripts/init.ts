#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Project initialization script for LightS boilerplate
 * Usage: pnpm init-project
 *
 * Guides the user to:
 * 1. Configure project name and details
 * 2. Rename all template files
 * 3. Clean up template content
 * 4. Reinitialize Git
 * 5. Setup Stripe products (optional)
 * 6. Delegate to setup.ts for cloud services
 */

import {
  closeReadline,
  collectProjectConfig,
  colors,
  displayConfigSummary,
  log,
  question,
} from "./lib/init-config";
import { renameProject } from "./lib/rename";
import {
  cleanupTemplate,
  generateReadme,
  reinitializeGit,
} from "./lib/cleanup";
import { setupStripe } from "./lib/stripe-setup";

const TOTAL_STEPS = 7;

async function main(): Promise<void> {
  console.log("\n");
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║               LightS Init - Nouveau Projet                   ║",
  );
  console.log(
    "║          Initialisation de votre nouveau SaaS                ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log("\n");

  try {
    // Step 1: Collect project configuration
    log.step(1, TOTAL_STEPS, "Configuration du projet");
    const config = await collectProjectConfig();
    displayConfigSummary(config);

    const confirm = await question("Confirmer et continuer ? (o/n) ");
    if (confirm.toLowerCase() !== "o") {
      log.warn("Initialisation annulée");
      closeReadline();
      process.exit(0);
    }

    // Step 2: Rename project files
    log.step(2, TOTAL_STEPS, "Renommage des fichiers");
    await renameProject(config);

    // Step 3: Generate new README
    log.step(3, TOTAL_STEPS, "Génération du README");
    generateReadme(config);

    // Step 4: Clean up template content
    log.step(4, TOTAL_STEPS, "Nettoyage du contenu template");
    await cleanupTemplate(config);

    // Step 5: Reinitialize Git
    log.step(5, TOTAL_STEPS, "Réinitialisation Git");
    await reinitializeGit(config);

    // Step 6: Setup Stripe (optional)
    log.step(6, TOTAL_STEPS, "Configuration Stripe");
    const stripeEnv = await setupStripe(config);

    // Display Stripe env vars if created
    if (Object.keys(stripeEnv).length > 0) {
      console.log("\n");
      log.info("Variables Stripe à ajouter dans .env.local:");
      for (const [key, value] of Object.entries(stripeEnv)) {
        console.log(`  ${key}="${value}"`);
      }
    }

    // Step 7: Delegate to setup.ts
    log.step(7, TOTAL_STEPS, "Configuration des services cloud");
    const runSetup = await question(
      "Voulez-vous configurer les services cloud maintenant ? (o/n) [o]: ",
    );

    if (runSetup.toLowerCase() !== "n") {
      console.log("\n");
      log.info("Lancement de pnpm setup...");
      console.log(
        `${colors.dim}(Vous pouvez aussi le faire plus tard avec: pnpm setup)${colors.reset}`,
      );
      console.log("\n");

      // Import and run setup
      const { execSync } = await import("child_process");
      try {
        execSync("pnpm setup", { stdio: "inherit" });
      } catch {
        log.warn(
          "Le setup a rencontré des erreurs. Vous pouvez le relancer avec: pnpm setup",
        );
      }
    }

    // Final message
    console.log("\n");
    console.log(
      "╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  Initialisation terminée !                   ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝",
    );
    console.log("\n");

    log.success(`Votre projet "${config.displayName}" est prêt !`);
    console.log("\n");
    log.info("Prochaines étapes:");
    console.log(
      "  1. Vérifiez votre .env.local et complétez les valeurs manquantes",
    );
    console.log("  2. Lancez: pnpm dev");
    console.log("  3. Ouvrez http://localhost:3000");
    console.log("\n");
  } catch (error) {
    log.error(`Erreur inattendue: ${error}`);
    process.exit(1);
  } finally {
    closeReadline();
  }
}

void main();
