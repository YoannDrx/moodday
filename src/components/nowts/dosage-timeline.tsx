"use client";

import { ArrowRight, History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";

type HistoryEntry = {
  id: string;
  dosage: string;
  previousDosage?: string | null;
  reason?: string | null;
  changedAt: Date;
};

type DosageTimelineProps = {
  history: HistoryEntry[];
  showTitle?: boolean;
};

export function DosageTimeline({
  history,
  showTitle = true,
}: DosageTimelineProps) {
  const { t } = useI18n();

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="size-5" />
            {t("medication.dosageHistory.title")}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "" : "pt-6"}>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="border-primary/20 absolute top-0 bottom-0 left-[7px] w-0.5 border-l-2 border-dashed" />

          {history.map((entry, index) => (
            <div key={entry.id} className="relative flex gap-4 pl-6">
              {/* Timeline dot */}
              <div
                className={`absolute top-1 left-0 size-4 rounded-full ${
                  index === 0
                    ? "bg-primary"
                    : "border-primary/50 bg-background border-2"
                }`}
              />

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.previousDosage ? (
                    <>
                      <span className="text-muted-foreground line-through">
                        {entry.previousDosage}
                      </span>
                      <ArrowRight className="text-primary size-4" />
                      <span className="font-semibold">{entry.dosage}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{entry.dosage}</span>
                  )}
                </div>
                {entry.reason && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {entry.reason}
                  </p>
                )}
                <time className="text-muted-foreground mt-1 block text-xs">
                  {new Date(entry.changedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
