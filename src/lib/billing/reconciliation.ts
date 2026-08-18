import "server-only";

import type Stripe from "stripe";

import { getPlanFromPriceId } from "./catalog";

export type LocalSubscriptionSnapshot = {
  stripeSubscriptionId: string | null;
  status: string | null;
  priceId: string | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
};

const unixToTime = (value?: number | null) =>
  value === null || value === undefined ? null : value * 1000;

const getRemotePriceId = (subscription: Stripe.Subscription) =>
  subscription.items.data[0]?.price.id ?? null;

const isMooddaySubscription = (subscription: Stripe.Subscription) => {
  const priceId = getRemotePriceId(subscription);
  return Boolean(getPlanFromPriceId(priceId));
};

const isAmbiguousMooddaySubscription = (subscription: Stripe.Subscription) =>
  !isMooddaySubscription(subscription) &&
  (subscription.metadata.app === "moodday" ||
    subscription.metadata.plan === "plus");

export function auditSubscriptionReconciliation(params: {
  local: LocalSubscriptionSnapshot[];
  remote: Stripe.Subscription[];
}) {
  const approvedRemote = new Map(
    params.remote
      .filter(isMooddaySubscription)
      .map((subscription) => [subscription.id, subscription] as const),
  );
  let mismatches = 0;
  let missingRemote = 0;

  for (const local of params.local) {
    if (!local.stripeSubscriptionId) continue;
    const remote = approvedRemote.get(local.stripeSubscriptionId);
    if (!remote) {
      missingRemote += 1;
      continue;
    }
    approvedRemote.delete(local.stripeSubscriptionId);
    const item = remote.items.data[0];
    const matches =
      local.status === remote.status &&
      local.priceId === item.price.id &&
      local.periodEnd?.getTime() === unixToTime(item.current_period_end) &&
      local.cancelAtPeriodEnd === remote.cancel_at_period_end;
    if (!matches) mismatches += 1;
  }

  return {
    checkedLocal: params.local.length,
    checkedRemote: params.remote.length,
    mismatches,
    missingRemote,
    missingLocal: approvedRemote.size,
    ambiguousRemote: params.remote.filter(isAmbiguousMooddaySubscription)
      .length,
  };
}
