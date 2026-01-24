"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Pill, Archive, Check, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getMedications } from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "medication.frequency.daily",
  twice_daily: "medication.frequency.twiceDaily",
  weekly: "medication.frequency.weekly",
  prn: "medication.frequency.prn",
};

export function MedicationList() {
  const { t } = useI18n();
  const [showArchived, setShowArchived] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["medications", showArchived],
    queryFn: async () => {
      const result = await getMedications({ includeArchived: showArchived });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const medications = data ?? [];
  const activeMedications = medications.filter((m) => !m.isArchived);
  const archivedMedications = medications.filter((m) => m.isArchived);

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/medications/new">
            <Plus className="mr-2 size-4" />
            {t("medication.list.addNew")}
          </Link>
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeMedications.length === 0 && !showArchived && (
        <Card className="p-8 text-center">
          <Pill className="text-muted-foreground mx-auto mb-4 size-12" />
          <p className="text-muted-foreground">{t("medication.list.empty")}</p>
        </Card>
      )}

      {/* Active medications */}
      {activeMedications.length > 0 && (
        <div className="space-y-3">
          {activeMedications.map((medication) => (
            <MedicationCard key={medication.id} medication={medication} />
          ))}
        </div>
      )}

      {/* Show archived toggle */}
      {(archivedMedications.length > 0 || showArchived) && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {showArchived
              ? t("medication.list.hideArchived")
              : t("medication.list.showArchived")}
          </span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </div>
      )}

      {/* Archived medications */}
      {showArchived && archivedMedications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-lg font-semibold">
            <Archive className="mr-2 inline size-4" />
            {t("medication.list.archived")}
          </h2>
          {archivedMedications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              isArchived
            />
          ))}
        </div>
      )}
    </div>
  );
}

type MedicationWithIntakes = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isPRN: boolean;
  isArchived: boolean;
  intakes: { id: string; takenAt: Date; skipped: boolean }[];
};

function MedicationCard({
  medication,
  isArchived = false,
}: {
  medication: MedicationWithIntakes;
  isArchived?: boolean;
}) {
  const { t } = useI18n();

  const hasTakenToday = medication.intakes.some((intake) => !intake.skipped);

  const frequencyKey =
    FREQUENCY_LABELS[medication.frequency] ?? "medication.frequency.daily";

  return (
    <Link href={`/medications/${medication.id}`}>
      <Card
        className={cn(
          "cursor-pointer p-4 transition-all hover:shadow-md",
          "hover:border-primary/30",
          isArchived && "opacity-60",
        )}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full",
              hasTakenToday
                ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                : "bg-muted text-muted-foreground",
            )}
          >
            {hasTakenToday ? (
              <Check className="size-5" />
            ) : (
              <Pill className="size-5" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{medication.name}</span>
              {medication.isPRN && (
                <Badge variant="outline" className="text-xs">
                  {t("medication.prn.badge")}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {medication.dosage} • {t(frequencyKey)}
            </p>
          </div>

          {/* Status */}
          <div className="shrink-0 text-right">
            {!isArchived && !medication.isPRN && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  hasTakenToday ? "text-green-600" : "text-muted-foreground",
                )}
              >
                {hasTakenToday ? (
                  <>
                    <Check className="size-3" />
                    {t("medication.list.takenToday")}
                  </>
                ) : (
                  <>
                    <Clock className="size-3" />
                    {t("medication.list.notTaken")}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
