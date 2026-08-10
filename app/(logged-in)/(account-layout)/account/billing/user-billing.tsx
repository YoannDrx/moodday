"use client";

import { Typography } from "@/components/nowts/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LoadingButton } from "@/features/form/submit-button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { LIMITS_CONFIG, getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { normalizePlanCode } from "@/lib/billing/entitlements";
import type { UserActiveSubscription } from "@/lib/user/get-user-subscription";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelSubscriptionAction,
  openStripePortalAction,
} from "./billing.action";

export function UserBilling(props: { subscription: UserActiveSubscription }) {
  const subscription = props.subscription;
  const router = useRouter();
  const { locale, t } = useI18n();
  const dateLocale = locale === "fr" ? fr : enUS;

  // Get plan limits
  const planCode = normalizePlanCode(subscription.plan);
  const planLimits = getPlanLimits(planCode);

  const manageSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const stripeCustomerId = subscription.stripeCustomerId;

      if (!stripeCustomerId) {
        throw new Error(t("account.billing.noStripeCustomer"));
      }

      const stripeBilling = await resolveActionResult(
        openStripePortalAction({ returnUrl: "/pricing" }),
      );

      router.push(stripeBilling.url);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(
        cancelSubscriptionAction({ returnUrl: "/pricing" }),
      );
      return result;
    },
    onSuccess: (data) => {
      if (!data.url) return;
      router.push(data.url);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const statusConfig =
    STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  // Calculate days remaining in trial if applicable
  const daysRemaining =
    subscription.status === "trialing"
      ? differenceInDays(
          new Date(subscription.periodEnd ?? new Date()),
          new Date(),
        )
      : 0;

  const trialProgress =
    subscription.status === "trialing" ? 100 - (daysRemaining / 14) * 100 : 0;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("account.billing.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <LoadingButton
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => manageSubscriptionMutation.mutate()}
          loading={manageSubscriptionMutation.isPending}
        >
          <ArrowUpCircle className="mr-2 size-4" />
          {t("account.billing.manage")}
        </LoadingButton>

        {subscription.status === "trialing" ? (
          <></>
        ) : subscription.status === "active" ? (
          <>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => cancelSubscriptionMutation.mutate()}
              >
                <XCircle className="mr-2 size-4" />
                {t("account.billing.cancel")}
              </Button>
            )}
          </>
        ) : (
          <Button className="w-full sm:w-auto">
            <CreditCard className="mr-2 size-4" />
            {t("account.billing.reactivate")}
          </Button>
        )}
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4">
        {/* Status Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <StatusIcon className={cn("size-5", statusConfig.textColor)} />
            <CardTitle>{t(statusConfig.descriptionKey)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription.status === "trialing" && (
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Typography>
                    {t("account.billing.trialRemaining", {
                      days: daysRemaining,
                    })}
                  </Typography>
                </div>
                <Progress value={trialProgress} className="h-2" />
              </div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <Typography variant="muted">
                {t("account.billing.endsOn")}{" "}
                {format(
                  new Date(subscription.periodEnd ?? new Date()),
                  "MMMM d, yyyy",
                  { locale: dateLocale },
                )}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("account.billing.detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Typography variant="muted">
                {t("account.billing.plan")}
              </Typography>
              <Typography className="capitalize">
                {t(`plans.names.${planCode}`)}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">
                {t("account.billing.startDate")}
              </Typography>
              <Typography>
                {format(
                  new Date(subscription.periodStart ?? new Date()),
                  "MMMM d, yyyy",
                  { locale: dateLocale },
                )}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">
                {t("account.billing.renewAt")}
              </Typography>
              <Typography>
                {format(
                  new Date(subscription.periodEnd ?? new Date()),
                  "MMMM d, yyyy",
                  { locale: dateLocale },
                )}
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>{t("account.billing.limitsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.entries(planLimits).map(([key, value]) => {
              const limitConfig =
                LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];

              const Icon = limitConfig.icon;

              // Determine the label based on the value
              const getLimitLabel = () => {
                if (value === -1) {
                  return t(`plans.limits.${key}.labelUnlimited`);
                }
                if (value === 0 && key === "caregivers") {
                  return t(`plans.limits.${key}.labelNone`);
                }
                return t(`plans.limits.${key}.label`, { value });
              };

              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="text-primary size-4" />
                    <Typography className="text-sm">
                      {getLimitLabel()}
                    </Typography>
                  </div>
                  <Typography variant="muted" className="text-xs">
                    {t(`plans.limits.${key}.description`)}
                  </Typography>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}

// Status configuration with colors and descriptions
const STATUS_CONFIG = {
  trialing: {
    labelKey: "account.billing.status.trialing",
    descriptionKey: "account.billing.status.trialingDescription",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: Clock,
  },
  active: {
    labelKey: "account.billing.status.active",
    descriptionKey: "account.billing.status.activeDescription",
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: CheckCircle2,
  },
  canceled: {
    labelKey: "account.billing.status.canceled",
    descriptionKey: "account.billing.status.canceledDescription",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    icon: XCircle,
  },
  past_due: {
    labelKey: "account.billing.status.pastDue",
    descriptionKey: "account.billing.status.pastDueDescription",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  unpaid: {
    labelKey: "account.billing.status.unpaid",
    descriptionKey: "account.billing.status.unpaidDescription",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  incomplete: {
    labelKey: "account.billing.status.incomplete",
    descriptionKey: "account.billing.status.incompleteDescription",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: AlertCircle,
  },
};
