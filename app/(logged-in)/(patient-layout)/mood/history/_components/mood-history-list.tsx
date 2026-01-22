"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Calendar, MessageSquare, Smile } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMoodEntries } from "@/features/mood/mood.action";
import { useQuickEntryStore } from "@/features/mood/quick-entry-store";
import { useI18n } from "@/i18n/provider";

type FilterPeriod = "all" | "week" | "month" | "quarter";

const FILTER_DAYS: Record<FilterPeriod, number | undefined> = {
  all: undefined,
  week: 7,
  month: 30,
  quarter: 90,
};

/**
 * Get color based on mood value (0-10)
 */
function getMoodColor(value: number): string {
  if (value <= 2) return "rgb(239, 68, 68)"; // red-500
  if (value <= 4) return "rgb(249, 115, 22)"; // orange-500
  if (value <= 6) return "rgb(234, 179, 8)"; // yellow-500
  if (value <= 8) return "rgb(132, 204, 22)"; // lime-500
  return "rgb(34, 197, 94)"; // green-500
}

/**
 * Get emoji based on mood value
 */
function getMoodEmoji(value: number): string {
  if (value <= 1) return "😢";
  if (value <= 3) return "😔";
  if (value <= 5) return "😐";
  if (value <= 7) return "🙂";
  if (value <= 9) return "😊";
  return "😄";
}

type MoodHistoryListProps = {
  limit?: number; // If set, limits entries and hides filter/load more
};

export function MoodHistoryList({ limit }: MoodHistoryListProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [filter, setFilter] = useState<FilterPeriod>("month");
  const { openForEdit } = useQuickEntryStore();
  const isCompact = typeof limit === "number";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["moodEntries", filter],
    queryFn: async ({ pageParam }) => {
      const result = await getMoodEntries({
        days: FILTER_DAYS[filter],
        limit: 20,
        cursor: pageParam,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });

  const allEntries = data?.pages.flatMap((page) => page?.entries ?? []) ?? [];
  const entries = isCompact ? allEntries.slice(0, limit) : allEntries;

  const handleEntryClick = useCallback(
    (entry: (typeof entries)[0]) => {
      openForEdit({
        id: entry.id,
        value: entry.value,
        note: entry.note,
        createdAt: entry.createdAt,
      });
    },
    [openForEdit],
  );

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter - only show in full mode */}
      {!isCompact && (
        <div className="flex justify-end">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as FilterPeriod)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">
                {t("mood.history.filter.week")}
              </SelectItem>
              <SelectItem value="month">
                {t("mood.history.filter.month")}
              </SelectItem>
              <SelectItem value="quarter">
                {t("mood.history.filter.quarter")}
              </SelectItem>
              <SelectItem value="all">
                {t("mood.history.filter.all")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <Card className="p-8 text-center">
          <Smile className="text-muted-foreground mx-auto mb-4 size-12" />
          <p className="text-muted-foreground">{t("mood.history.empty")}</p>
        </Card>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={cn(
                "cursor-pointer p-4 transition-all hover:shadow-md",
                "hover:border-primary/30",
              )}
              onClick={() => handleEntryClick(entry)}
            >
              <div className="flex items-center gap-4">
                {/* Mood indicator */}
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: `${getMoodColor(entry.value)}20` }}
                >
                  {getMoodEmoji(entry.value)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg font-bold"
                      style={{ color: getMoodColor(entry.value) }}
                    >
                      {entry.value}/10
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Calendar className="size-3" />
                      {format(new Date(entry.createdAt), "PPp", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>

                  {entry.note && (
                    <p className="text-muted-foreground mt-1 flex items-start gap-1 truncate text-sm">
                      <MessageSquare className="mt-0.5 size-3 shrink-0" />
                      <span className="truncate">{entry.note}</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load more - only show in full mode */}
      {!isCompact && hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={async () => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? t("common.saving") : t("pagination.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
