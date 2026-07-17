"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Archive,
  ArchiveRestore,
  Pill,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DosageTimeline } from "@/components/nowts/dosage-timeline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getMedicationById,
  archiveMedication,
  unarchiveMedication,
} from "@/features/medication/medication.action";
import { normalizeScheduleTimesForFrequency } from "@/features/medication/schedule";
import { useI18n } from "@/i18n/provider";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "medication.frequency.daily",
  twice_daily: "medication.frequency.twiceDaily",
  weekly: "medication.frequency.weekly",
  prn: "medication.frequency.prn",
};

const WEEKDAY_KEYS = [
  "medication.weekDay.sunday",
  "medication.weekDay.monday",
  "medication.weekDay.tuesday",
  "medication.weekDay.wednesday",
  "medication.weekDay.thursday",
  "medication.weekDay.friday",
  "medication.weekDay.saturday",
] as const;

export function MedicationDetail({ medicationId }: { medicationId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["medication", medicationId],
    queryFn: async () => {
      const result = await getMedicationById({ id: medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const result = await archiveMedication({ id: medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.archive.success"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      router.push("/medications");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async () => {
      const result = await unarchiveMedication({ id: medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.unarchive.success"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      void queryClient.invalidateQueries({
        queryKey: ["medication", medicationId],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/medications">
            <ArrowLeft className="mr-2 size-4" />
            {t("medication.detail.back")}
          </Link>
        </Button>
      </Card>
    );
  }

  const medication = data;
  const frequencyKey =
    FREQUENCY_LABELS[medication.frequency] ?? "medication.frequency.daily";
  const scheduleTimes = normalizeScheduleTimesForFrequency(
    medication.frequency,
    medication.scheduleTimes,
  );
  const weeklyDay =
    medication.weeklyDay ?? new Date(medication.createdAt).getDay();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/medications">
          <ArrowLeft className="mr-2 size-4" />
          {t("medication.detail.back")}
        </Link>
      </Button>

      {/* Medication info card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
            <Pill className="text-primary size-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{medication.name}</CardTitle>
              {medication.isPRN && (
                <Badge variant="outline">{t("medication.prn.badge")}</Badge>
              )}
              {medication.isArchived && (
                <Badge variant="secondary">
                  {t("medication.detail.archived")}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{medication.dosage}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="text-muted-foreground size-4" />
            <span>{t(frequencyKey)}</span>
          </div>
          {!medication.isPRN && scheduleTimes.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="text-muted-foreground size-4" />
              <span>
                {medication.frequency === "weekly"
                  ? `${t(WEEKDAY_KEYS[weeklyDay] ?? WEEKDAY_KEYS[0])} · `
                  : null}
                {scheduleTimes.join(" · ")}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            <Button asChild>
              <Link href={`/medications/${medicationId}/edit`}>
                <Edit className="mr-2 size-4" />
                {t("medication.detail.edit")}
              </Link>
            </Button>

            {medication.isArchived ? (
              <Button
                variant="outline"
                onClick={() => unarchiveMutation.mutate()}
                disabled={unarchiveMutation.isPending}
              >
                <ArchiveRestore className="mr-2 size-4" />
                {t("medication.detail.restore")}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Archive className="mr-2 size-4" />
                    {t("medication.archive.confirm")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("medication.archive.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("medication.archive.description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => archiveMutation.mutate()}
                      disabled={archiveMutation.isPending}
                    >
                      {t("medication.archive.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dosage History */}
      {medication.history.length > 0 && (
        <DosageTimeline history={medication.history} />
      )}
    </div>
  );
}
