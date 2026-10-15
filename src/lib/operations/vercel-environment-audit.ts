export type VercelEnvironment = "production" | "preview";

export type VercelEnvironmentEntry = {
  key: string;
  target: string[];
  type?: string;
};

export type VercelEnvironmentFinding = {
  code:
    | "invalid_feature_flag"
    | "duplicate_key"
    | "missing_key"
    | "shared_sensitive_key"
    | "weak_secret_storage"
    | "same_sensitive_value"
    | "sensitive_value_unavailable"
    | "invalid_database_runtime_url"
    | "invalid_database_direct_url"
    | "database_not_neon"
    | "database_pooler_missing"
    | "database_direct_url_pooled"
    | "database_endpoint_mismatch"
    | "database_tls_missing";
  key: string;
  severity: "error" | "warning";
};

export const REQUIRED_RELEASE_ENVIRONMENT_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "APPLE_CLIENT_ID",
  "APPLE_TEAM_ID",
  "APPLE_KEY_ID",
  "APPLE_PRIVATE_KEY",
  "APPLE_APP_BUNDLE_IDENTIFIER",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "EMAIL_FROM",
  "NEXT_PUBLIC_EMAIL_CONTACT",
  "BLOB_READ_WRITE_TOKEN",
  "BILLING_ENABLED",
  "GOOGLE_CALENDAR_ENABLED",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_ACCOUNT_ID",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PLUS_MONTHLY_PRICE_ID",
  "STRIPE_PLUS_YEARLY_PRICE_ID",
  "STRIPE_PORTAL_CONFIGURATION_ID",
  "REVENUECAT_SECRET_API_KEY",
  "REVENUECAT_WEBHOOK_AUTH_TOKEN",
  "REVENUECAT_WEBHOOK_SIGNING_SECRET",
  "REVENUECAT_ENTITLEMENT_ID",
  "REVENUECAT_PLUS_PRODUCT_IDS",
  "REVENUECAT_ALLOWED_APP_IDS",
  "REVENUECAT_WEBHOOK_ENVIRONMENTS",
  "STRIPE_TAX_ENABLED",
  "AI_INSIGHTS_ENABLED",
  "AI_ROLLOUT_MODE",
  "OPENAI_API_KEY",
  "AI_SAFETY_HMAC_SECRET",
  "AI_CONSENT_VERSION",
  "AI_MONTHLY_REQUEST_BUDGET",
  "AI_MAX_CONCURRENCY",
  "AI_TIMEOUT_MS",
  "CAREGIVER_SHARING_ENABLED",
  "PUSH_NOTIFICATIONS_ENABLED",
  "ACCOUNT_IMPORT_ENABLED",
  "ADMIN_ENABLED",
  "MAINTENANCE_MODE",
  "PUBLIC_SIGNUP_MODE",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
  "OPERATIONAL_ALERT_EMAIL",
  "DSAR_EXPORT_ENCRYPTION_KEY",
  "DSAR_DOWNLOAD_BASE_URL",
  "LEGAL_TERMS_VERSION",
  "LEGAL_PRIVACY_VERSION",
  "HEALTH_DATA_CONSENT_VERSION",
  "LAUNCH_COUNTRY",
  "MINIMUM_AGE",
] as const;

export const SENSITIVE_ISOLATED_ENVIRONMENT_KEYS = new Set([
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "APPLE_CLIENT_ID",
  "APPLE_TEAM_ID",
  "APPLE_KEY_ID",
  "APPLE_PRIVATE_KEY",
  "APPLE_APP_BUNDLE_IDENTIFIER",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "RESEND_AUDIENCE_ID",
  "BLOB_READ_WRITE_TOKEN",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_ACCOUNT_ID",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PLUS_MONTHLY_PRICE_ID",
  "STRIPE_PLUS_YEARLY_PRICE_ID",
  "STRIPE_PORTAL_CONFIGURATION_ID",
  "REVENUECAT_SECRET_API_KEY",
  "REVENUECAT_WEBHOOK_AUTH_TOKEN",
  "REVENUECAT_WEBHOOK_SIGNING_SECRET",
  "REVENUECAT_ALLOWED_APP_IDS",
  "OPENAI_API_KEY",
  "AI_SAFETY_HMAC_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "CRON_SECRET",
  "DSAR_EXPORT_ENCRYPTION_KEY",
  "PUBLIC_SIGNUP_INVITE_EMAILS",
]);

const SECRET_KEYS = new Set(SENSITIVE_ISOLATED_ENVIRONMENT_KEYS);

// Vercel does not disclose sensitive variables through `env pull`. Comparing
// these markers would falsely report shared credentials and malformed DB URLs.
const isRedactedValue = (value: string | undefined) =>
  value === "[SENSITIVE]" || value === "[REDACTED]";

const moduleFlags = [
  "BILLING_ENABLED",
  "AI_INSIGHTS_ENABLED",
  "PUSH_NOTIFICATIONS_ENABLED",
  "GOOGLE_CALENDAR_ENABLED",
  "OAUTH_GOOGLE_ENABLED",
  "OAUTH_APPLE_ENABLED",
  "OAUTH_GITHUB_ENABLED",
] as const;

export function requiredEnvironmentKeysFor(
  values: Record<string, string>,
): string[] {
  const disabled = (flag: string) => values[flag] === "false";
  const keys: string[] = REQUIRED_RELEASE_ENVIRONMENT_KEYS.filter((key) => {
    if (
      disabled("BILLING_ENABLED") &&
      /^(STRIPE_|NEXT_PUBLIC_STRIPE_|REVENUECAT_)/.test(key)
    )
      return false;
    if (
      disabled("AI_INSIGHTS_ENABLED") &&
      key !== "AI_INSIGHTS_ENABLED" &&
      /^(AI_|OPENAI_)/.test(key)
    )
      return false;
    if (
      disabled("PUSH_NOTIFICATIONS_ENABLED") &&
      /^(VAPID_|NEXT_PUBLIC_VAPID_)/.test(key)
    )
      return false;
    if (disabled("OAUTH_APPLE_ENABLED") && key.startsWith("APPLE_"))
      return false;
    if (
      disabled("OAUTH_GOOGLE_ENABLED") &&
      disabled("GOOGLE_CALENDAR_ENABLED") &&
      key.startsWith("GOOGLE_CLIENT_")
    )
      return false;
    return true;
  });
  keys.push(...moduleFlags);
  if (!disabled("OAUTH_GITHUB_ENABLED"))
    keys.push("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET");
  return [...new Set(keys)];
}

export function auditVercelEnvironmentEntries(
  entries: VercelEnvironmentEntry[],
  environment: VercelEnvironment,
  values?: Record<string, string>,
) {
  const applicable = entries.filter(({ target }) =>
    target.includes(environment),
  );
  const findings: VercelEnvironmentFinding[] = [];
  const byKey = new Map<string, VercelEnvironmentEntry[]>();

  for (const entry of applicable) {
    const existing = byKey.get(entry.key) ?? [];
    existing.push(entry);
    byKey.set(entry.key, existing);
  }

  if (values)
    for (const flag of moduleFlags) {
      if (!["true", "false"].includes(values[flag]))
        findings.push({
          code: "invalid_feature_flag",
          key: flag,
          severity: "error",
        });
    }
  for (const key of values
    ? requiredEnvironmentKeysFor(values)
    : REQUIRED_RELEASE_ENVIRONMENT_KEYS) {
    if (!byKey.has(key)) {
      findings.push({ code: "missing_key", key, severity: "error" });
    }
  }

  for (const [key, matchingEntries] of byKey) {
    if (matchingEntries.length > 1) {
      findings.push({ code: "duplicate_key", key, severity: "error" });
    }
    if (
      SENSITIVE_ISOLATED_ENVIRONMENT_KEYS.has(key) &&
      matchingEntries.some(
        ({ target }) =>
          target.includes("production") && target.includes("preview"),
      )
    ) {
      findings.push({
        code: "shared_sensitive_key",
        key,
        severity: "error",
      });
    }
    if (
      SECRET_KEYS.has(key) &&
      matchingEntries.some(({ type }) => type === "plain")
    ) {
      findings.push({
        code: "weak_secret_storage",
        key,
        severity: "warning",
      });
    }
  }

  return {
    environment,
    configuredKeys: byKey.size,
    findings: findings.sort((left, right) =>
      `${left.severity}:${left.code}:${left.key}`.localeCompare(
        `${right.severity}:${right.code}:${right.key}`,
      ),
    ),
  };
}

export function auditVercelSensitiveValueIsolation(
  production: Record<string, string>,
  preview: Record<string, string>,
) {
  const findings: VercelEnvironmentFinding[] = [];

  for (const key of SENSITIVE_ISOLATED_ENVIRONMENT_KEYS) {
    const productionValue = production[key];
    const previewValue = preview[key];
    if (isRedactedValue(productionValue) || isRedactedValue(previewValue)) {
      findings.push({
        code: "sensitive_value_unavailable",
        key,
        severity: "error",
      });
      continue;
    }
    if (productionValue && previewValue && productionValue === previewValue) {
      findings.push({
        code: "same_sensitive_value",
        key,
        severity: "error",
      });
    }
  }

  return findings.sort((left, right) => left.key.localeCompare(right.key));
}

function hasRequiredTls(url: URL) {
  return ["require", "verify-full"].includes(
    url.searchParams.get("sslmode") ?? "",
  );
}

export function auditVercelDatabaseTopology(
  values: Record<string, string>,
): VercelEnvironmentFinding[] {
  const findings: VercelEnvironmentFinding[] = [];
  const parseDatabaseUrl = (
    value: string | undefined,
    key: "DATABASE_URL" | "DATABASE_URL_UNPOOLED",
  ) => {
    if (isRedactedValue(value)) {
      findings.push({
        code: "sensitive_value_unavailable",
        key,
        severity: "error",
      });
      return null;
    }
    try {
      const url = new URL(value ?? "");
      if (!["postgres:", "postgresql:"].includes(url.protocol)) {
        throw new Error("unsupported protocol");
      }
      return url;
    } catch {
      findings.push({
        code:
          key === "DATABASE_URL"
            ? "invalid_database_runtime_url"
            : "invalid_database_direct_url",
        key,
        severity: "error",
      });
      return null;
    }
  };

  const runtimeUrl = parseDatabaseUrl(values.DATABASE_URL, "DATABASE_URL");
  const directUrl = parseDatabaseUrl(
    values.DATABASE_URL_UNPOOLED,
    "DATABASE_URL_UNPOOLED",
  );
  if (!runtimeUrl || !directUrl) return findings;

  if (
    !runtimeUrl.hostname.endsWith(".neon.tech") ||
    !directUrl.hostname.endsWith(".neon.tech")
  ) {
    findings.push({
      code: "database_not_neon",
      key: "DATABASE_URL",
      severity: "error",
    });
  }
  if (!runtimeUrl.hostname.includes("-pooler.")) {
    findings.push({
      code: "database_pooler_missing",
      key: "DATABASE_URL",
      severity: "error",
    });
  }
  if (directUrl.hostname.includes("-pooler.")) {
    findings.push({
      code: "database_direct_url_pooled",
      key: "DATABASE_URL_UNPOOLED",
      severity: "error",
    });
  }

  const normalizedRuntimeHost = runtimeUrl.hostname.replace("-pooler.", ".");
  if (normalizedRuntimeHost !== directUrl.hostname) {
    findings.push({
      code: "database_endpoint_mismatch",
      key: "DATABASE_URL_UNPOOLED",
      severity: "error",
    });
  }
  if (!hasRequiredTls(runtimeUrl) || !hasRequiredTls(directUrl)) {
    findings.push({
      code: "database_tls_missing",
      key: "DATABASE_URL",
      severity: "error",
    });
  }

  return findings.sort((left, right) =>
    `${left.key}:${left.code}`.localeCompare(`${right.key}:${right.code}`),
  );
}
