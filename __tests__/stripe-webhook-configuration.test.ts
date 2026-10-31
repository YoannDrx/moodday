import { expect, it } from "vitest";
import {
  auditStripeWebhookConfiguration,
  requiredStripeEvents,
} from "@/lib/billing/webhook-configuration";
const origin = "https://www.moodday.app";
const endpoint = {
  url: `${origin}/api/webhooks/stripe`,
  status: "enabled",
  enabled_events: [...requiredStripeEvents],
};
it("requires exactly one active canonical destination and the lifecycle events", () => {
  expect(auditStripeWebhookConfiguration([endpoint], origin)).toEqual([]);
  expect(
    auditStripeWebhookConfiguration(
      [{ ...endpoint, url: "https://moodday.app/api/webhooks/stripe" }],
      origin,
    ),
  ).toContain("redirecting_or_duplicate_webhook");
  expect(
    auditStripeWebhookConfiguration([endpoint, endpoint], origin),
  ).toContain("canonical_webhook_count");
  expect(
    auditStripeWebhookConfiguration(
      [{ ...endpoint, enabled_events: [] }],
      origin,
    ),
  ).toContain("webhook_event_missing:invoice.paid");
});
