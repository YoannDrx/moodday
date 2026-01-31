"use client";

import * as React from "react";
import { Plus, Edit2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoodSlider } from "@/components/nowts/mood-slider";
import { getMoodColor, getMoodEmoji } from "@/lib/design-tokens";
import { useI18n } from "@/i18n/provider";
import { saveMoodEntry, getTodayMoodEntry } from "@/features/mood/mood.action";
import { toast } from "sonner";

type TodayMoodCardProps = {
  className?: string;
};

export function TodayMoodCard({ className }: TodayMoodCardProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [moodValue, setMoodValue] = React.useState(5);
  const [existingEntry, setExistingEntry] = React.useState<{
    id: string;
    value: number;
    createdAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch today's mood entry on mount
  React.useEffect(() => {
    async function fetchTodayMood() {
      try {
        const result = await getTodayMoodEntry();
        if (result.data) {
          setExistingEntry(result.data);
          setMoodValue(result.data.value);
        }
      } catch {
        // No entry for today, that's fine
      } finally {
        setIsLoading(false);
      }
    }
    void fetchTodayMood();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveMoodEntry({ value: moodValue });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result.data) {
        setExistingEntry(result.data);
        setIsEditing(false);
        toast.success(t("mood.entry.saved"));

        // Invalidate dashboard queries
        void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        void queryClient.invalidateQueries({ queryKey: ["mood-chart"] });
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t("mood.entry.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-32 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // If editing or no entry exists, show the slider
  if (isEditing || !existingEntry) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t("mood.entry.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <MoodSlider value={moodValue} onChange={setMoodValue} />

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? t("common.saving") : t("mood.entry.save")}
            </Button>
            {existingEntry && (
              <Button
                variant="outline"
                onClick={() => {
                  setMoodValue(existingEntry.value);
                  setIsEditing(false);
                }}
              >
                {t("actions.cancel")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show the saved entry
  const color = getMoodColor(existingEntry.value);
  const emoji = getMoodEmoji(existingEntry.value);
  const time = new Date(existingEntry.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("mood.entry.title")}</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
          <Edit2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className="flex size-16 items-center justify-center rounded-full text-3xl"
            style={{ backgroundColor: `${color}20` }}
          >
            {emoji}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color }}
              >
                {existingEntry.value}
              </span>
              <span className="text-muted-foreground text-sm">/10</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("mood.entry.savedAt", { time })}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setIsEditing(true)}
        >
          <Plus className="mr-2 size-4" />
          {t("mood.entry.addNew")}
        </Button>
      </CardContent>
    </Card>
  );
}
