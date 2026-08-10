/* eslint-disable no-await-in-loop -- reconciliation intentionally limits Stripe concurrency */
import { getPlanFromPriceId } from "@/lib/billing/catalog";
import { validateCronRequest } from "@/lib/cron";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const unixToTime = (value?: number | null) =>
  value ? new Date(value * 1000).getTime() : null;

export async function GET(request: Request) {
  const unauthorizedResponse = validateCronRequest(request);
  if (unauthorizedResponse) return unauthorizedResponse;
  if (!env.BILLING_ENABLED) {
    return NextResponse.json({ ok: true, disabled: true });
  }

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

  let mismatches = 0;
  let retrievalFailures = 0;
  for (const local of subscriptions) {
    if (!local.stripeSubscriptionId) continue;
    try {
      const remote = await getStripe().subscriptions.retrieve(
        local.stripeSubscriptionId,
      );
      const item = remote.items.data[0];
      const priceId = item.price.id;
      const approved = Boolean(getPlanFromPriceId(priceId));
      const matches =
        approved &&
        local.status === remote.status &&
        local.priceId === priceId &&
        local.periodEnd?.getTime() === unixToTime(item.current_period_end) &&
        local.cancelAtPeriodEnd === remote.cancel_at_period_end;
      if (!matches) mismatches += 1;
    } catch {
      retrievalFailures += 1;
    }
  }

  const ok = mismatches === 0 && retrievalFailures === 0;
  logger[ok ? "info" : "error"]("Stripe reconciliation completed", {
    checked: subscriptions.length,
    mismatches,
    retrievalFailures,
  });

  return NextResponse.json(
    { ok, checked: subscriptions.length, mismatches, retrievalFailures },
    { status: ok ? 200 : 409 },
  );
}
