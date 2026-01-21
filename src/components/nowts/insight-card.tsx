"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightCardProps = {
  type: "mood" | "medication" | "therapy" | "exercise";
  message: string;
  trend: "up" | "down" | "neutral";
};

const typeColors = {
  mood: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  medication: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  therapy: "bg-green-500/10 text-green-600 dark:text-green-400",
  exercise: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: "text-green-500",
  down: "text-muted-foreground",
  neutral: "text-muted-foreground",
};

export function InsightCard({ type, message, trend }: InsightCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg p-4", typeColors[type])}
    >
      <TrendIcon className={cn("mt-0.5 size-5 shrink-0", trendColors[trend])} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
