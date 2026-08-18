/* eslint-disable no-await-in-loop -- Stripe pagination is deliberately sequential */
import { validateCronRequest } from "@/lib/cron";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { runOperationalJob } from "@/lib/operations/job-runner";
import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { auditSubscriptionReconciliation } from "@/lib/billing/reconciliation";
import type Stripe from "stripe";

export const maxDuration = 300;

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;
  if (!env.BILLING_ENABLED) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  const job = await runOperationalJob({
    jobName: "stripe-reconciliation",
    intervalMs: 24 * 60 * 60 * 1000,
    task: async () => reconcileStripeSubscriptions({ requestId, startedAt }),
  });

  if (job.skipped) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  return NextResponse.json({ ok: true, ...job.result });
}

async function reconcileStripeSubscriptions(requestContext: {
  requestId: string;
  startedAt: number;
}) {
  const subscriptions = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: {
      stripeSubscriptionId: true,
      status: true,
      priceId: true,
      periodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  const remoteSubscriptions: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await getStripe().subscriptions.list({
      status: "all",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    remoteSubscriptions.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
    if (page.has_more && !startingAfter) {
      throw new Error("stripe_reconciliation_pagination_failed");
    }
  } while (startingAfter);

  const audit = auditSubscriptionReconciliation({
    local: subscriptions,
    remote: remoteSubscriptions,
  });
  const divergenceCount =
    audit.mismatches +
    audit.missingRemote +
    audit.missingLocal +
    audit.ambiguousRemote;
  const ok = divergenceCount === 0;
  logger[ok ? "info" : "error"]("Stripe reconciliation completed", {
    eventName: "stripe_reconciliation_completed",
    status: ok ? "succeeded" : "failed",
    ...audit,
    divergenceCount,
    ...getRequestLogFields({
      ...requestContext,
      route: "/api/cron/stripe-reconciliation",
    }),
  });

  if (!ok) {
    const error = new Error("stripe_reconciliation_mismatch");
    error.name = "stripe_reconciliation_mismatch";
    throw error;
  }
  return audit;
}
