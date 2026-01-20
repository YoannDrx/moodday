"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useI18n } from "@/i18n/provider";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, XAxis } from "recharts";
import type { UserGrowthDataPoint } from "./admin-charts-data";

type UserGrowthChartProps = {
  data: UserGrowthDataPoint[];
};

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const { locale, t } = useI18n();
  const chartConfig = {
    total: {
      label: t("admin.stats.totalUsers"),
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    return data.map((item) => {
      const [year, month] = item.date.split("-");
      const date = new Date(Number(year), Number(month) - 1);
      return {
        ...item,
        formattedDate: date.toLocaleDateString(locale, {
          month: "short",
        }),
      };
    });
  }, [data, locale]);

  const totalUsers =
    chartData.length > 0 ? chartData[chartData.length - 1].total : 0;
  const previousTotal =
    chartData.length > 1 ? chartData[chartData.length - 2].total : 0;
  const newUsersThisMonth =
    chartData.length > 0 ? chartData[chartData.length - 1].count : 0;
  const growth =
    previousTotal > 0
      ? ((totalUsers - previousTotal) / previousTotal) * 100
      : 0;
  const isPositive = growth >= 0;

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              {t("admin.stats.totalUsers")}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight">
                {totalUsers.toLocaleString(locale)}
              </p>
              <span className="text-muted-foreground text-sm">
                {t("admin.stats.newUsersThisMonth", {
                  count: newUsersThisMonth.toLocaleString(locale),
                })}
              </span>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {isPositive ? "+" : ""}
            {growth.toFixed(1)}%
          </div>
        </div>

        <div className="mt-6">
          <ChartContainer className="h-[120px] w-full" config={chartConfig}>
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-total)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={<ChartTooltipContent />}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                fill="url(#usersGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
