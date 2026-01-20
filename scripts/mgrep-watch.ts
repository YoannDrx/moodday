#!/usr/bin/env tsx
/**
 * Script wrapper pour mgrep watch
 * Utilise automatiquement le nom du dossier courant comme store
 *
 * Usage: pnpm mgrep
 */

import { execSync } from "child_process";
import * as path from "path";

const storeName = path.basename(process.cwd());

console.log(
  `\x1b[34m[mgrep]\x1b[0m Lancement du watcher pour le store "${storeName}"...\n`,
);

try {
  execSync(`mgrep watch --store "${storeName}"`, {
    stdio: "inherit",
  });
} catch {
  // Le process est interrompu par Ctrl+C, c'est normal
  process.exit(0);
}
