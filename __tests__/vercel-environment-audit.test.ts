import fs from "node:fs";

import { describe, expect, it } from "vitest";
import {
  auditVercelDatabaseTopology,
  requiredEnvironmentKeysFor,
  auditVercelEnvironmentEntries,
  auditVercelSensitiveValueIsolation,
  REQUIRED_RELEASE_ENVIRONMENT_KEYS,
  type VercelEnvironmentEntry,
} from "@/lib/operations/vercel-environment-audit";

const completeEnvironment = (target: "production" | "preview") =>
  REQUIRED_RELEASE_ENVIRONMENT_KEYS.map((key) => ({
    key,
    target: [target],
    type: "sensitive",
  }));

describe("Vercel release environment audit", () => {
  it("keeps redacted values unverified without inventing shared secrets or broken URLs", () => {
    expect(
      auditVercelSensitiveValueIsolation(
        { DATABASE_URL: "[SENSITIVE]", CRON_SECRET: "[SENSITIVE]" },
        { DATABASE_URL: "[SENSITIVE]", CRON_SECRET: "different-secret" },
      ),
    ).toEqual([
      {
        code: "sensitive_value_unavailable",
        key: "CRON_SECRET",
        severity: "error",
      },
      {
        code: "sensitive_value_unavailable",
        key: "DATABASE_URL",
        severity: "error",
      },
    ]);
    expect(
      auditVercelDatabaseTopology({
        DATABASE_URL: "[SENSITIVE]",
        DATABASE_URL_UNPOOLED: "[SENSITIVE]",
      }),
    ).toEqual([
      {
        code: "sensitive_value_unavailable",
        key: "DATABASE_URL",
        severity: "error",
      },
      {
        code: "sensitive_value_unavailable",
        key: "DATABASE_URL_UNPOOLED",
        severity: "error",
      },
    ]);
  });
  it("documents every required release key in the environment template", () => {
    const template = fs.readFileSync(".env-template", "utf8");
    const documentedKeys = new Set(
      [...template.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]),
    );

    expect(
      REQUIRED_RELEASE_ENVIRONMENT_KEYS.filter(
        (key) => !documentedKeys.has(key),
      ),
    ).toEqual([]);
  });

  it("accepts a complete environment with separately scoped secrets", () => {
    expect(
      auditVercelEnvironmentEntries(
        completeEnvironment("production"),
        "production",
      ),
    ).toMatchObject({ findings: [] });
  });

  it("reports missing and duplicate keys without inspecting values", () => {
    const entries = completeEnvironment("preview").filter(
      ({ key }) => key !== "DATABASE_URL",
    );
    entries.push({
      key: "EMAIL_FROM",
      target: ["preview"],
      type: "sensitive",
    });

    expect(auditVercelEnvironmentEntries(entries, "preview").findings).toEqual(
      expect.arrayContaining([
        { code: "missing_key", key: "DATABASE_URL", severity: "error" },
        { code: "duplicate_key", key: "EMAIL_FROM", severity: "error" },
      ]),
    );
  });

  it("rejects a sensitive credential shared by Preview and Production", () => {
    const entries: VercelEnvironmentEntry[] = [
      ...completeEnvironment("production"),
      {
        key: "CRON_SECRET",
        target: ["production", "preview"],
        type: "sensitive",
      },
    ].filter(
      ({ key, target }) => key !== "CRON_SECRET" || target.includes("preview"),
    );

    expect(
      auditVercelEnvironmentEntries(entries, "production").findings,
    ).toContainEqual({
      code: "shared_sensitive_key",
      key: "CRON_SECRET",
      severity: "error",
    });
  });

  it("warns when a secret is stored as a plain variable", () => {
    const entries = completeEnvironment("production").map((entry) =>
      entry.key === "BETTER_AUTH_SECRET" ? { ...entry, type: "plain" } : entry,
    );

    expect(
      auditVercelEnvironmentEntries(entries, "production").findings,
    ).toContainEqual({
      code: "weak_secret_storage",
      key: "BETTER_AUTH_SECRET",
      severity: "warning",
    });
  });

  it("detects equal sensitive values even when their Vercel entries are separate", () => {
    expect(
      auditVercelSensitiveValueIsolation(
        {
          DATABASE_URL: "same-secret",
          CRON_SECRET: "production-secret",
          GOOGLE_CLIENT_ID: "production-google-client",
        },
        {
          DATABASE_URL: "same-secret",
          CRON_SECRET: "preview-secret",
          GOOGLE_CLIENT_ID: "preview-google-client",
        },
      ),
    ).toEqual([
      {
        code: "same_sensitive_value",
        key: "DATABASE_URL",
        severity: "error",
      },
    ]);
  });

  it("keeps the Google OAuth application isolated per release environment", () => {
    expect(
      auditVercelSensitiveValueIsolation(
        {
          GOOGLE_CLIENT_ID: "shared-client",
          GOOGLE_CLIENT_SECRET: "shared-secret",
        },
        {
          GOOGLE_CLIENT_ID: "shared-client",
          GOOGLE_CLIENT_SECRET: "shared-secret",
        },
      ),
    ).toEqual([
      {
        code: "same_sensitive_value",
        key: "GOOGLE_CLIENT_ID",
        severity: "error",
      },
      {
        code: "same_sensitive_value",
        key: "GOOGLE_CLIENT_SECRET",
        severity: "error",
      },
    ]);
  });

  it("accepts a pooled Neon runtime URL paired with its TLS direct URL", () => {
    expect(
      auditVercelDatabaseTopology({
        DATABASE_URL:
          "postgresql://role:secret@ep-moodday-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
        DATABASE_URL_UNPOOLED:
          "postgresql://role:secret@ep-moodday.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full",
      }),
    ).toEqual([]);
  });

  it("rejects invalid or unsafe database topologies without returning a URL", () => {
    expect(
      auditVercelDatabaseTopology({
        DATABASE_URL: "not-a-url",
        DATABASE_URL_UNPOOLED: "also-invalid",
      }),
    ).toEqual([
      {
        code: "invalid_database_runtime_url",
        key: "DATABASE_URL",
        severity: "error",
      },
      {
        code: "invalid_database_direct_url",
        key: "DATABASE_URL_UNPOOLED",
        severity: "error",
      },
    ]);

    expect(
      auditVercelDatabaseTopology({
        DATABASE_URL: "https://example.com/neondb?sslmode=require",
        DATABASE_URL_UNPOOLED:
          "postgresql://role:secret@ep-moodday.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toEqual([
      {
        code: "invalid_database_runtime_url",
        key: "DATABASE_URL",
        severity: "error",
      },
    ]);

    expect(
      auditVercelDatabaseTopology({
        DATABASE_URL:
          "postgresql://role:secret@example.com/neondb?sslmode=disable",
        DATABASE_URL_UNPOOLED:
          "postgresql://role:secret@ep-other-pooler.c-2.eu-central-1.aws.neon.tech/neondb",
      }).map(({ code }) => code),
    ).toEqual([
      "database_direct_url_pooled",
      "database_endpoint_mismatch",
      "database_not_neon",
      "database_pooler_missing",
      "database_tls_missing",
    ]);
  });
});

it("requires core production safeguards and only the secrets of explicitly enabled modules", () => {
  const values = Object.fromEntries(
    [
      "BILLING_ENABLED",
      "AI_INSIGHTS_ENABLED",
      "PUSH_NOTIFICATIONS_ENABLED",
      "GOOGLE_CALENDAR_ENABLED",
      "OAUTH_GOOGLE_ENABLED",
      "OAUTH_APPLE_ENABLED",
      "OAUTH_GITHUB_ENABLED",
    ].map((key) => [key, "false"]),
  );
  const keys = requiredEnvironmentKeysFor(values);
  expect(keys).toContain("DSAR_EXPORT_ENCRYPTION_KEY");
  expect(keys).toContain("HEALTH_DATA_CONSENT_VERSION");
  expect(keys).not.toContain("STRIPE_SECRET_KEY");
  expect(keys).not.toContain("OPENAI_API_KEY");
  expect(keys).not.toContain("GOOGLE_CLIENT_SECRET");
  expect(keys).not.toContain("APPLE_PRIVATE_KEY");
  const enabled = requiredEnvironmentKeysFor({
    ...values,
    OAUTH_GOOGLE_ENABLED: "true",
    OAUTH_GITHUB_ENABLED: "true",
    AI_INSIGHTS_ENABLED: "true",
    BILLING_ENABLED: "true",
  });
  expect(enabled).toContain("GITHUB_CLIENT_SECRET");
  expect(enabled).toContain("GOOGLE_CLIENT_SECRET");
  expect(enabled).toContain("OPENAI_API_KEY");
  expect(enabled).toContain("STRIPE_SECRET_KEY");
  const entries = keys.map((key) => ({
    key,
    target: ["production"],
    type: "sensitive",
  }));
  expect(
    auditVercelEnvironmentEntries(entries, "production", values).findings,
  ).toEqual([]);
  expect(
    auditVercelEnvironmentEntries(entries, "production", {
      ...values,
      AI_INSIGHTS_ENABLED: "[SENSITIVE]",
    }).findings,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "invalid_feature_flag",
        key: "AI_INSIGHTS_ENABLED",
      }),
    ]),
  );
});
