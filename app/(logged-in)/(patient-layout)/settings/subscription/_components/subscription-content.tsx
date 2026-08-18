"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { getSubscriptionSummary } from "@/features/profile/profile.action";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  cancelSubscriptionAction,
  openStripePortalAction,
} from "@app/(logged-in)/(account-layout)/account/billing/billing.action";

export function SubscriptionContent({
  billingEnabled = true,
}: {
  billingEnabled?: boolean;
}) {
  const { t, tm, locale } = useI18n();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription-summary"],
    enabled: billingEnabled,
    queryFn: async () => {
      const result = await getSubscriptionSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const subscriptionLabel = subscription?.plan
    ? t("settings.subscription.planLabel", { plan: subscription.plan })
    : t("settings.subscription.planFree");

  const statusLabels: Record<string, string> = {
    active: t("settings.subscription.status.active"),
    trialing: t("settings.subscription.status.trialing"),
    past_due: t("settings.subscription.status.pastDue"),
    canceled: t("settings.subscription.status.canceled"),
    incomplete: t("settings.subscription.status.incomplete"),
  };

  const subscriptionStatusLabel = subscription?.status
    ? (statusLabels[subscription.status] ?? subscription.status)
    : t("settings.subscription.status.inactive");

  const renewalDate = subscription?.periodEnd
    ? new Date(subscription.periodEnd)
    : null;

  const renewalText = renewalDate
    ? t("settings.subscription.renewal", {
        date: renewalDate.toLocaleDateString(
          locale === "fr" ? "fr-FR" : "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        ),
      })
    : t("settings.subscription.noActive");

  const subscriptionFeatures =
    tm<string[]>("settings.subscription.features") ?? [];

  const portalMutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(
        openStripePortalAction({ returnUrl: "/settings/subscription" }),
      );
      return result;
    },
    onSuccess: (data) => {
      if (!data.url) return;
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(
        cancelSubscriptionAction({ returnUrl: "/settings/subscription" }),
      );
      return result;
    },
    onSuccess: (data) => {
      if (!data.url) return;
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!billingEnabled) {
    return (
      <PageLayout
        title={t("settings.subscription.title")}
        subtitle={t("settings.subtitle")}
        maxWidth="3xl"
      >
        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<CreditCard className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.subscription.unavailableTitle")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-muted-foreground text-sm">
              {t("settings.subscription.unavailableDescription")}
            </p>
          </GlassCardContent>
        </GlassCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("settings.subscription.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <GlassCard
          padding="lg"
          variant="elevated"
          className="border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--lavender)]/10"
        >
          <GlassCardHeader>
            <GlassCardTitle
              icon={<CreditCard className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.subscription.title")}
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent className="space-y-6">
            <div className="rounded-2xl border border-[var(--primary)]/20 bg-white p-6 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-bold text-[var(--primary)]">
                <Sparkles className="size-4" />
                {subscriptionLabel}
              </div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {t("settings.subscription.statusLabel")}{" "}
                <span className="capitalize">{subscriptionStatusLabel}</span>
              </p>
              <p className="text-sm text-gray-500">{renewalText}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600">
                {t("settings.subscription.includedTitle")}
              </p>
              <ul className="space-y-2">
                {subscriptionFeatures.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-[var(--sage)]/20 text-[var(--sage)]">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-gray-200"
                onClick={() => portalMutation.mutate()}
                disabled={!subscription || portalMutation.isPending}
              >
                {portalMutation.isPending
                  ? t("common.redirecting")
                  : t("settings.subscription.changePlan")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => cancelMutation.mutate()}
                disabled={!subscription || cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? t("common.redirecting")
                  : t("actions.cancel")}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </PageLayout>
  );
}
