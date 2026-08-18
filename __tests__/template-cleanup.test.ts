import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy template cleanup", () => {
  it("keeps developer guidance aligned with the current PostgreSQL architecture", () => {
    const doctor = readFileSync(resolve("scripts/doctor.ts"), "utf8");
    const projectGuidance = readFileSync(resolve(".claude/CLAUDE.md"), "utf8");

    expect(doctor).not.toMatch(/upstash/iu);
    expect(projectGuidance).not.toMatch(/upstash|template boilerplate/iu);
    expect(projectGuidance).not.toContain("pnpm setup");
    expect(projectGuidance).not.toContain("src/lib/up-fetch.ts");
  });

  it("does not retain obsolete setup, direct-deploy, or generic Stripe commands", () => {
    const obsoleteFiles = [
      ".claude/commands/setup.md",
      ".claude/commands/deploy.md",
      ".claude/skills/stripe-setup/SKILL.md",
      "app/(layout)/careers/page.tsx",
      "app/(layout)/payment/cancel/page.tsx",
      "app/(layout)/payment/success/page.tsx",
      "app/(layout)/not-found/page.tsx",
      "app/(layout)/changelog/page.tsx",
      "app/(layout)/changelog/[slug]/page.tsx",
      "app/@modal/(.)changelog/[slug]/page.tsx",
      "src/features/changelog/changelog-dialog.tsx",
      "src/features/changelog/changelog-manager.ts",
      "src/features/changelog/changelog-timeline.tsx",
      "app/(logged-in)/(account-layout)/account/billing/cancel/cancel-form.tsx",
      "CHANGELOG.md",
      ".claude/analysis/light-ts-organization-removal.md",
      ".claude/commands/nowts/add-debug-panel.md",
      ".claude/commands/nowts/add-missing-metadata.md",
      ".claude/commands/nowts/changelog.md",
      ".claude/commands/nowts/migration-rename.md",
      ".claude/commands/nowts/tdd-integration.md",
      ".claude/commands/nowts/tdd-unit.md",
      ".claude/commands/nowts/test-playwright.md",
      ".claude/commands/nowts/test-vitest.md",
    ];

    for (const obsoleteFile of obsoleteFiles) {
      expect(existsSync(resolve(obsoleteFile)), obsoleteFile).toBe(false);
    }
  });

  it("does not retain unused Imgur test configuration", () => {
    const vitestConfig = readFileSync(resolve("vitest.config.mjs"), "utf8");
    expect(vitestConfig).not.toMatch(/imgur/iu);
  });

  it("keeps fallback navigation scoped to real Moodday destinations", () => {
    const navigation = readFileSync(
      resolve("src/features/navigation/base-navigation.tsx"),
      "utf8",
    );
    const userDropdown = readFileSync(
      resolve("src/features/auth/user-dropdown.tsx"),
      "utf8",
    );

    expect(navigation).toContain('href="/dashboard"');
    expect(navigation).toContain('href="/settings/profile"');
    expect(navigation).not.toMatch(/\/orgs|href="\/home"|settings\?tab=/u);
    expect(userDropdown).not.toContain("settings?tab=");
  });

  it("does not ship translations for retired generic public surfaces", () => {
    for (const locale of ["en", "fr"]) {
      const messages = readFileSync(
        resolve(`src/i18n/messages/${locale}.ts`),
        "utf8",
      );
      expect(messages).not.toMatch(/^ {2}(?:changelog|payment): \{/mu);
    }
  });

  it("redirects the retired cancellation questionnaire to the canonical billing screen", () => {
    const legacyCancellationPage = readFileSync(
      resolve(
        "app/(logged-in)/(account-layout)/account/billing/cancel/page.tsx",
      ),
      "utf8",
    );

    expect(legacyCancellationPage).toContain(
      'redirect("/settings/subscription")',
    );
    expect(legacyCancellationPage).not.toMatch(/reason|feedback/iu);
  });
});
