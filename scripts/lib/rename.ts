/* eslint-disable no-console */
/**
 * Automatic renaming of project files
 */

import * as fs from "fs";
import * as path from "path";
import type { ProjectConfig } from "./init-config";
import { colors, log } from "./init-config";

const FILES_TO_UPDATE = [
  "package.json",
  "src/site-config.ts",
  "src/i18n/messages/en.ts",
  "src/i18n/messages/fr.ts",
  "CLAUDE.md",
  "scripts/setup.ts",
  "scripts/doctor.ts",
];

export async function renameProject(config: ProjectConfig): Promise<void> {
  log.info("Renommage des fichiers du projet...");

  const cwd = process.cwd();

  for (const file of FILES_TO_UPDATE) {
    const filePath = path.join(cwd, file);

    if (!fs.existsSync(filePath)) {
      log.warn(`Fichier non trouvé: ${file}`);
      continue;
    }

    try {
      let content = fs.readFileSync(filePath, "utf-8");
      const originalContent = content;

      // Apply replacements based on file type
      if (file === "package.json") {
        content = updatePackageJson(content, config);
      } else if (file === "src/site-config.ts") {
        content = updateSiteConfig(content, config);
      } else if (file.includes("i18n/messages")) {
        content = updateI18nMessages(content, config);
      } else if (file === "CLAUDE.md") {
        content = updateClaudeMd(content, config);
      } else if (file.includes("scripts/")) {
        content = updateScripts(content, config);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        log.success(`Mis à jour: ${file}`);
      } else {
        console.log(`${colors.dim}  Aucun changement: ${file}${colors.reset}`);
      }
    } catch (err) {
      log.error(`Erreur lors de la mise à jour de ${file}: ${err}`);
    }
  }
}

function updatePackageJson(content: string, config: ProjectConfig): string {
  const pkg = JSON.parse(content);
  pkg.name = config.slug;
  return `${JSON.stringify(pkg, null, 2)  }\n`;
}

function updateSiteConfig(content: string, config: ProjectConfig): string {
  // Replace title
  content = content.replace(
    /title:\s*["'].*?["']/,
    `title: "${config.displayName}"`,
  );

  // Replace description
  content = content.replace(
    /description:\s*["'].*?["']/,
    `description: "${config.description}"`,
  );

  // Replace prodUrl
  content = content.replace(
    /prodUrl:\s*["'].*?["']/,
    `prodUrl: "https://${config.domain}"`,
  );

  // Replace appId
  content = content.replace(/appId:\s*["'].*?["']/, `appId: "${config.slug}"`);

  // Replace domain
  content = content.replace(
    /domain:\s*["'].*?["']/,
    `domain: "${config.domain}"`,
  );

  // Replace company name
  content = content.replace(
    /company:\s*\{[\s\S]*?name:\s*["'].*?["']/,
    `company: {\n    name: "${config.companyName}"`,
  );

  // Replace company address if provided
  if (config.companyAddress) {
    content = content.replace(
      /address:\s*["'].*?["']/,
      `address: "${config.companyAddress}"`,
    );
  }

  return content;
}

function updateI18nMessages(content: string, config: ProjectConfig): string {
  // Replace LightS with project name
  content = content.replace(/LightS/g, config.displayName);
  return content;
}

function updateClaudeMd(content: string, config: ProjectConfig): string {
  // Replace LightS with project name
  content = content.replace(/LightS/g, config.displayName);

  // Update the "À propos" section
  content = content.replace(
    /## À propos de .*?\n\n\*\*.*?\*\* est un template/,
    `## À propos de ${config.displayName}\n\n**${config.displayName}** est un template`,
  );

  return content;
}

function updateScripts(content: string, config: ProjectConfig): string {
  // Replace LightS in banners
  content = content.replace(/LightS Setup/g, `${config.displayName} Setup`);
  content = content.replace(/LightS Doctor/g, `${config.displayName} Doctor`);
  content = content.replace(
    /Setup interactif pour LightS/g,
    `Setup interactif pour ${config.displayName}`,
  );
  content = content.replace(
    /Diagnostic de santé pour LightS/g,
    `Diagnostic de santé pour ${config.displayName}`,
  );
  return content;
}
