"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const colorClasses = {
  default: "text-muted-foreground",
  success: "text-green-500",
  warning: "text-yellow-500",
  danger: "text-red-500",
  info: "text-blue-500",
};

const bgColorClasses = {
  default: "bg-muted/50",
  success: "bg-green-500/10",
  warning: "bg-yellow-500/10",
  danger: "bg-red-500/10",
  info: "bg-blue-500/10",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              {trend && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.value >= 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-full p-3", bgColorClasses[color])}>
            <Icon className={cn("size-5", colorClasses[color])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
