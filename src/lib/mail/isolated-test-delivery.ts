/** Test transport is opt-in, loopback-only and restricted to reserved domains. */
export function usesIsolatedTestDelivery(
  environment: Record<string, string | undefined>,
  recipients: string[],
) {
  if (
    environment.MOODDAY_TEST_MAIL_TRANSPORT !== "isolated" ||
    environment.PLAYWRIGHT_DATABASE_GUARD_CONFIGURED !== "true" ||
    environment.VERCEL ||
    recipients.length === 0
  )
    return false;
  try {
    const database = new URL(environment.DATABASE_URL ?? "");
    const origin = new URL(environment.BETTER_AUTH_URL ?? "");
    if (
      ![database.hostname, origin.hostname].every((host) =>
        ["localhost", "127.0.0.1", "[::1]"].includes(host),
      )
    )
      return false;
  } catch {
    return false;
  }
  return recipients.every((recipient) =>
    /^playwright-test-[^@\s]+@(?:example\.test|example\.invalid)$/i.test(
      recipient,
    ),
  );
}
