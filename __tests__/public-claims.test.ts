import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getActivePublicClaims } from "../src/lib/public-claims";

describe("public claims registry", () => {
  it("only exposes claims allowed on the requested surface", () => {
    const landing = getActivePublicClaims(
      "landing",
      new Date("2026-08-07T00:00:00.000Z"),
    );
    expect(landing.length).toBeGreaterThan(0);
    expect(
      landing.every((claim) => claim.allowedSurfaces.includes("landing")),
    ).toBe(true);
  });

  it("hides all expired claims", () => {
    expect(
      getActivePublicClaims("landing", new Date("2030-01-01T00:00:00.000Z")),
    ).toEqual([]);
  });

  it("publishes the processor register on public navigation surfaces", () => {
    const subprocessors = readFileSync(
      resolve("app/(layout)/legal/subprocessors/page.tsx"),
      "utf8",
    );
    const footer = readFileSync(
      resolve("src/features/landing/footer-dark.tsx"),
      "utf8",
    );
    const sitemap = readFileSync(resolve("app/sitemap.tsx"), "utf8");

    expect(subprocessors).toContain("OpenAI");
    expect(subprocessors).toContain("Stripe");
    expect(subprocessors).toContain("PostHog explicitly absent");
    expect(footer).toContain("/legal/subprocessors");
    expect(sitemap).toContain("/legal/subprocessors");
  });

  it("states the separate health-data consent and how it can be withdrawn", () => {
    const privacy = readFileSync(
      resolve("app/(layout)/legal/privacy/page.tsx"),
      "utf8",
    );

    expect(privacy).toContain("article 9.2.a");
    expect(privacy).toContain(
      "consentement aux données de santé est demandé séparément",
    );
    expect(privacy).toContain("retirer tout consentement à tout moment");
    expect(privacy).toContain("suppression du compte ou en nous contactant");
    expect(privacy).toContain("does not affect processing performed before it");
  });

  it("keeps published editorial content free of unproved product promises", () => {
    const publishedArticles = [
      readFileSync(resolve("content/posts/fr/bienvenue-moodday.mdx"), "utf8"),
      readFileSync(resolve("content/posts/en/welcome-moodday.mdx"), "utf8"),
    ];
    const forbiddenClaims = [
      /scientifiquement fondé|scientifically[- ]grounded/iu,
      /rappels intelligents|smart reminders/iu,
      /données chiffrées en Europe|encrypted data in Europe/iu,
      /Apple Health|Google Fit/iu,
      /analyses IA|AI analysis/iu,
      /mode hors-ligne complet|full offline mode/iu,
      /application mobile.*bientôt|mobile app.*coming soon/iu,
    ];

    for (const article of publishedArticles) {
      expect(article).toContain("status: published");
      for (const forbiddenClaim of forbiddenClaims) {
        expect(article).not.toMatch(forbiddenClaim);
      }
    }

    expect(publishedArticles[0]).toContain("personnes de 18 ans ou plus");
    expect(publishedArticles[0]).toContain("3114");
    expect(publishedArticles[0]).toContain("15 ou le 112");
    expect(publishedArticles[1]).toContain("people aged 18 or over");
    expect(publishedArticles[1]).toContain(
      "Moodday is not an emergency service",
    );
  });

  it("does not publish the legacy boilerplate changelog or demo posts", () => {
    const legacyFiles = [
      "content/changelog/en/2025-08-13-v100.mdx",
      "content/changelog/en/2025-08-23-v150.mdx",
      "content/changelog/en/2025-12-15-v200.mdx",
      "content/changelog/en/2025-12-27-v210.mdx",
      "content/changelog/fr/2025-08-13-v100.mdx",
      "content/changelog/fr/2025-08-23-v150.mdx",
      "content/changelog/fr/2025-12-15-v200.mdx",
      "content/changelog/fr/2025-12-27-v210.mdx",
      "content/posts/en/demo.mdx",
      "content/posts/fr/demo.mdx",
    ];

    for (const legacyFile of legacyFiles) {
      expect(existsSync(resolve(legacyFile)), legacyFile).toBe(false);
    }
  });

  it("keeps the client translation payload free of retired template promises", () => {
    const translationPayload = [
      readFileSync(resolve("src/i18n/messages/fr.ts"), "utf8"),
      readFileSync(resolve("src/i18n/messages/en.ts"), "utf8"),
    ].join("\n");

    for (const retiredClaim of [
      /Apple Watch|Wear OS|Google Play|App Store rating/iu,
      /Bientôt sur mobile|Mobile app/iu,
      /Essai gratuit 14 jours|14-day free trial/iu,
      /name: "Ultra"|name: "Pro"/u,
      /Marie L\.|Utilisatrice depuis|User for 1 year/iu,
      /support prioritaire|priority support/iu,
      /Pic d'efficacité|Peak effectiveness/iu,
    ]) {
      expect(translationPayload).not.toMatch(retiredClaim);
    }

    expect(translationPayload).not.toContain("careers: {");
    expect(translationPayload).not.toContain("moodday: {");
  });
});
