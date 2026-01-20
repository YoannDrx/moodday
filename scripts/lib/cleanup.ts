/**
 * Cleanup template content for new projects
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type { ProjectConfig } from "./init-config";
import { log } from "./init-config";

const CONTENT_DIRS_TO_CLEAN = ["content/changelog", "content/posts"];

export async function cleanupTemplate(_config: ProjectConfig): Promise<void> {
  log.info("Nettoyage du contenu template...");

  const cwd = process.cwd();

  // Clean content directories (keep one example file)
  for (const dir of CONTENT_DIRS_TO_CLEAN) {
    const dirPath = path.join(cwd, dir);
    if (fs.existsSync(dirPath)) {
      try {
        const files = fs.readdirSync(dirPath);
        // Keep first file as example, delete the rest
        const filesToDelete = files.slice(1);
        for (const file of filesToDelete) {
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
        if (filesToDelete.length > 0) {
          log.success(
            `Nettoyé ${dir}: supprimé ${filesToDelete.length} fichiers`,
          );
        }
      } catch (err) {
        log.warn(`Impossible de nettoyer ${dir}: ${err}`);
      }
    }
  }
}

export async function reinitializeGit(config: ProjectConfig): Promise<void> {
  if (!config.reinitGit) {
    log.info("Réinitialisation Git ignorée");
    return;
  }

  log.info("Réinitialisation de Git...");

  const cwd = process.cwd();
  const gitDir = path.join(cwd, ".git");

  try {
    // Remove existing .git directory
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
      log.success("Ancien .git supprimé");
    }

    // Initialize new git repo
    execSync("git init", { cwd, stdio: "ignore" });
    log.success("Nouveau dépôt Git initialisé");

    // Create initial commit
    execSync("git add -A", { cwd, stdio: "ignore" });
    execSync(
      `git commit -m "Initial commit: ${config.displayName} boilerplate"`,
      { cwd, stdio: "ignore" },
    );
    log.success("Commit initial créé");
  } catch (err) {
    log.error(`Erreur lors de la réinitialisation Git: ${err}`);
  }
}

export function generateReadme(config: ProjectConfig): void {
  log.info("Génération du README.md...");

  const readme = `# ${config.displayName}

${config.description}

## Quick Start

### 1. Install dependencies
\`\`\`bash
pnpm install
\`\`\`

### 2. Configure environment
\`\`\`bash
pnpm setup
\`\`\`

### 3. Start developing
\`\`\`bash
pnpm dev
\`\`\`

## Features

- Authentication (GitHub, Google, Magic Links)
- Stripe Subscriptions (Free, Pro, Ultra)
- PostgreSQL with Prisma
- Transactional Emails (Resend)
- Admin Dashboard
- i18n (EN/FR)
- Tests (Vitest + Playwright)

## Commands

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start development server |
| \`pnpm setup\` | Configure cloud services |
| \`pnpm doctor\` | Check project health |
| \`pnpm build\` | Build for production |
| \`pnpm test:ci\` | Run unit tests |
| \`pnpm test:e2e:ci\` | Run E2E tests |

## Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth
- **Payments**: Stripe
- **Emails**: React Email + Resend

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed project documentation.

## License

MIT
`;

  const readmePath = path.join(process.cwd(), "README.md");
  fs.writeFileSync(readmePath, readme);
  log.success("README.md généré");
}
