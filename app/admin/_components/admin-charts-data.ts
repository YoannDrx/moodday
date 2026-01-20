import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type MrrDataPoint = {
  date: string;
  mrr: number;
};

export type UserGrowthDataPoint = {
  date: string;
  count: number;
  total: number;
};

export async function getMrrHistory(): Promise<MrrDataPoint[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const invoices = await getStripe().invoices.list({
    created: {
      gte: Math.floor(sixMonthsAgo.getTime() / 1000),
    },
    status: "paid",
    limit: 100,
    expand: ["data.subscription"],
  });

  const monthlyMrr: Record<string, number> = {};

  for (let i = 0; i < 6; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMrr[key] = 0;
  }

  for (const invoice of invoices.data) {
    if (!invoice.amount_paid || !invoice.created) continue;

    const date = new Date(invoice.created * 1000);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (key in monthlyMrr) {
      monthlyMrr[key] += invoice.amount_paid;
    }
  }

  return Object.entries(monthlyMrr)
    .map(([date, mrr]) => ({
      date,
      mrr: mrr / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserGrowth(): Promise<UserGrowthDataPoint[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const existingUsersCount = await prisma.user.count({
    where: {
      createdAt: {
        lt: sixMonthsAgo,
      },
    },
  });

  const monthlyData: Record<string, number> = {};

  for (let i = 0; i < 6; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }

  for (const user of users) {
    const date = user.createdAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyData) {
      monthlyData[key]++;
    }
  }

  const sortedKeys = Object.keys(monthlyData).sort();
  let runningTotal = existingUsersCount;

  return sortedKeys.map((date) => {
    const count = monthlyData[date];
    runningTotal += count;
    return {
      date,
      count,
      total: runningTotal,
    };
  });
}
