"use client";

import { useQuery } from "@tanstack/react-query";
import { Pill, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MedCheckbox } from "@/components/nowts/med-checkbox";
import { PRNMedicationCard } from "@/components/nowts/prn-medication-card";
import {
  getTodayIntakes,
  getPRNMedications,
} from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";

export function TodayMedications() {
  const { t } = useI18n();

  const {
    data: regularData,
    isLoading: regularLoading,
    isError: regularError,
  } = useQuery({
    queryKey: ["todayIntakes"],
    queryFn: async () => {
      const result = await getTodayIntakes({});
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const {
    data: prnData,
    isLoading: prnLoading,
    isError: prnError,
  } = useQuery({
    queryKey: ["prnMedications"],
    queryFn: async () => {
      const result = await getPRNMedications({});
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const isLoading = regularLoading || prnLoading;
  const isError = regularError || prnError;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </Card>
    );
  }

  const medications = regularData ?? [];
  const prnMedications = prnData ?? [];

  if (medications.length === 0 && prnMedications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Pill className="text-muted-foreground mx-auto mb-4 size-12" />
        <p className="text-muted-foreground mb-4">
          {t("medication.today.empty")}
        </p>
        <Button asChild>
          <Link href="/medications/new">{t("medication.list.addNew")}</Link>
        </Button>
      </Card>
    );
  }

  const takenCount = medications.filter(
    (m) => m.intakes.length > 0 && !m.intakes[0].skipped,
  ).length;
  const totalCount = medications.length;
  const allDone = takenCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex size-12 items-center justify-center rounded-full ${
              allDone
                ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                : "bg-primary/10 text-primary"
            }`}
          >
            {allDone ? (
              <CheckCircle2 className="size-6" />
            ) : (
              <span className="text-lg font-bold">
                {takenCount}/{totalCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">
              {allDone
                ? t("medication.today.allDone")
                : t("medication.today.progress", {
                    taken: takenCount,
                    total: totalCount,
                  })}
            </p>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Regular medication list */}
      {medications.length > 0 && (
        <div className="space-y-3">
          {medications.map((medication) => (
            <MedCheckbox
              key={medication.id}
              medicationId={medication.id}
              name={medication.name}
              dosage={medication.dosage}
              intake={medication.intakes[0] ?? null}
            />
          ))}
        </div>
      )}

      {/* PRN medications section */}
      {prnMedications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-lg font-semibold">
            {t("medication.prn.section")}
          </h2>
          {prnMedications.map((medication) => (
            <PRNMedicationCard
              key={medication.id}
              medicationId={medication.id}
              name={medication.name}
              dosage={medication.dosage}
              todayIntakes={medication.intakes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
