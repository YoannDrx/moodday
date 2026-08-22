const toHttpsOrigin = (hostname: string | undefined) => {
  const normalized = hostname
    ?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return normalized ? `https://${normalized}` : undefined;
};

const uniqueOrigins = (origins: (string | undefined)[]) => [
  ...new Set(origins.filter((origin): origin is string => Boolean(origin))),
];

/** Return the canonical public URL used in emails and provider callbacks. */
export const getServerUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return process.env.PLAYWRIGHT_TEST_BASE_URL;
  }

  // Better Auth is the canonical public application URL in every deployed
  // environment. Reuse it for emails, redirects and server-side callbacks so
  // preview aliases do not drift from the trusted authentication origin.
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  }

  // If we are in production, we return the production URL.
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // If we are in "stage" environment, we return the staging URL.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // If we are in development, we return the localhost URL
  return "http://localhost:3000";
};

/**
 * Return only exact origins controlled by this deployment. Deliberately avoid
 * trusting a wildcard Vercel domain: an unrelated deployment must never become
 * an accepted Better Auth origin.
 */
export const getTrustedAuthOrigins = () =>
  uniqueOrigins([
    getServerUrl(),
    process.env.PLAYWRIGHT_TEST_BASE_URL?.replace(/\/$/, ""),
    toHttpsOrigin(process.env.VERCEL_URL),
    toHttpsOrigin(process.env.VERCEL_BRANCH_URL),
    toHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    ...(process.env.VERCEL_ENV === "production"
      ? ["moodday://", "moodday://*"]
      : process.env.VERCEL_ENV === "preview"
        ? ["moodday-preview://", "moodday-preview://*"]
        : [
            "moodday-dev://",
            "moodday-dev://*",
            "exp://",
            "exp://**",
            "exp://192.168.*.*:*/**",
          ]),
  ]);

/**
 * WebAuthn credentials are scoped to one relying-party host. In Preview, bind
 * them to the exact current deployment instead of the Production domain.
 */
export const getPasskeyOrigin = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return process.env.PLAYWRIGHT_TEST_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "preview") {
    return (
      toHttpsOrigin(process.env.VERCEL_URL) ??
      toHttpsOrigin(process.env.VERCEL_BRANCH_URL) ??
      getServerUrl()
    );
  }
  return getServerUrl();
};
