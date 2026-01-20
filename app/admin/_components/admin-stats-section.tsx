import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { Crown, DollarSign, Users } from "lucide-react";
import { cacheLife } from "next/dist/server/use-cache/cache-life";

async function calculateTotalMRR() {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "trialing", "past_due"] },
      stripeSubscriptionId: { not: null },
    },
    select: {
      stripeSubscriptionId: true,
    },
  });

  if (subscriptions.length === 0) {
    return 0;
  }

  const stripeSubscriptions = (
    await Promise.all(
      subscriptions.map(async (sub) => {
        if (!sub.stripeSubscriptionId) return null;

        try {
          const stripeSub = await getStripe().subscriptions.retrieve(
            sub.stripeSubscriptionId,
          );
          return stripeSub;
        } catch {
          return null;
        }
      }),
    )
  ).filter((sub) => sub !== null);

  let totalMRR = 0;

  for (const stripeSub of stripeSubscriptions) {
    for (const item of stripeSub.items.data) {
      const price = item.price;
      if (!price.unit_amount || !price.recurring) continue;

      const { unit_amount } = price;
      const { interval, interval_count } = price.recurring;

      let monthlyAmount = 0;
      switch (interval) {
        case "month":
          monthlyAmount = unit_amount / interval_count;
          break;
        case "year":
          monthlyAmount = unit_amount / (12 * interval_count);
          break;
        case "week":
          monthlyAmount = (unit_amount * 4.33) / interval_count;
          break;
        case "day":
          monthlyAmount = (unit_amount * 30) / interval_count;
          break;
      }

      totalMRR += monthlyAmount * (item.quantity ?? 1);
    }
  }

  return totalMRR;
}

export async function AdminStatsSection() {
  cacheLife("hours");
  const { locale, t } = await getI18n();

  const premiumPlanNames = AUTH_PLANS.filter((p) => p.price > 0).map(
    (p) => p.name,
  );

  const [totalUsers, premiumUsers, mrrInCents] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: {
        plan: { in: premiumPlanNames },
        status: { in: ["active", "trialing", "past_due"] },
      },
    }),
    calculateTotalMRR(),
  ]);

  const mrrFormatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(mrrInCents / 100);

  const stats = [
    {
      title: t("admin.stats.totalUsers"),
      value: totalUsers.toLocaleString(locale),
      description: t("admin.stats.totalUsersDescription"),
      icon: Users,
    },
    {
      title: t("admin.stats.premiumUsers"),
      value: premiumUsers.toLocaleString(locale),
      description: t("admin.stats.premiumUsersDescription"),
      icon: Crown,
    },
    {
      title: t("admin.stats.mrr"),
      value: mrrFormatted,
      description: t("admin.stats.mrrDescription"),
      icon: DollarSign,
    },
  ];

  return (
    <>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
