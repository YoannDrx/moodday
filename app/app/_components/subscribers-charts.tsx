"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useI18n } from "@/i18n/provider";

const chartConfig = {
  2023: {
    label: "2023",
    color: "var(--chart-1)",
  },
  2024: {
    label: "2024",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function SubscribersChart() {
  const { t } = useI18n();
  const chartData = [
    { month: t("months.january"), 2023: 186, 2024: 80 },
    { month: t("months.february"), 2023: 305, 2024: 200 },
    { month: t("months.march"), 2023: 237, 2024: 120 },
    { month: t("months.april"), 2023: 73, 2024: 190 },
    { month: t("months.may"), 2023: 209, 2024: 130 },
    { month: t("months.june"), 2023: 214, 2024: 140 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("app.subscribers.title")}</CardTitle>
        <CardDescription>{t("app.subscribers.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-64 w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="2023" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-2023)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-2023)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fill2024" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-2024)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-2024)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="2024"
              type="natural"
              fill="url(#fill2024)"
              fillOpacity={0.4}
              stroke="var(--color-2024)"
              stackId="a"
            />
            <Area
              dataKey="2023"
              type="natural"
              fill="url(#2023)"
              fillOpacity={0.4}
              stroke="var(--color-2023)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {t("app.subscribers.trending", { value: "5.2%" })}{" "}
              <TrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {t("app.subscribers.range", { year: "2024" })}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
