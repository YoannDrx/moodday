export const requiredStripeEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export function auditStripeWebhookConfiguration(
  endpoints: { url: string; status: string; enabled_events: string[] }[],
  canonicalOrigin: string,
) {
  const url = new URL("/api/webhooks/stripe", canonicalOrigin).toString();
  const active = endpoints.filter(
    (endpoint) => endpoint.url === url && endpoint.status === "enabled",
  );
  const findings: string[] = [];
  if (active.length !== 1) findings.push("canonical_webhook_count");
  const endpoint = active.at(0);
  if (endpoint && !endpoint.enabled_events.includes("*")) {
    for (const event of requiredStripeEvents) {
      if (!endpoint.enabled_events.includes(event))
        findings.push(`webhook_event_missing:${event}`);
    }
  }
  if (
    endpoints.some(
      (endpoint) =>
        endpoint.status === "enabled" &&
        endpoint.url !== url &&
        new URL(endpoint.url).hostname.replace(/^www\./, "") ===
          new URL(url).hostname.replace(/^www\./, "") &&
        new URL(endpoint.url).pathname === "/api/webhooks/stripe",
    )
  )
    findings.push("redirecting_or_duplicate_webhook");
  return findings;
}
