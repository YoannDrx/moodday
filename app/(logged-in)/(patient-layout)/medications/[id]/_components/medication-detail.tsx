"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Archive,
  ArchiveRestore,
  Pill,
  Clock,
  PackageOpen,
  History,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  adjustMedicationStock,
} from "@/features/medication/medication.action";
import { normalizeScheduleTimesForFrequency } from "@/features/medication/schedule";
import { useI18n } from "@/i18n/provider";
import {
  getCivilWeekday,
  getDateKeyForTimeZone,
} from "@/lib/temporal/civil-date";

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
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState<
    "refill" | "correction" | "manual"
  >("refill");
  const stockOperationId = useRef(crypto.randomUUID());

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

  const stockMutation = useMutation({
    mutationFn: async () => {
      const quantityDelta = Number(stockDelta);
      if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
        throw new Error(t("medication.detail.inventoryDeltaInvalid"));
      }
      const result = await adjustMedicationStock({
        medicationId,
        quantityDelta,
        reason: stockReason,
        operationId: stockOperationId.current,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      stockOperationId.current = crypto.randomUUID();
      setStockDelta("");
      toast.success(t("medication.detail.inventoryUpdated"));
      void queryClient.invalidateQueries({
        queryKey: ["medication", medicationId],
      });
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
    onError: (error) => toast.error(error.message),
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
    medication.weeklyDay ??
    getCivilWeekday(getDateKeyForTimeZone(new Date(medication.createdAt)));
  const stockQuantity =
    medication.stockQuantity === null ? null : Number(medication.stockQuantity);
  const lowStockThreshold =
    medication.lowStockThreshold === null
      ? null
      : Number(medication.lowStockThreshold);
  const lowStock =
    stockQuantity !== null &&
    lowStockThreshold !== null &&
    stockQuantity <= lowStockThreshold;

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
          {medication.startDate ? (
            <p className="text-muted-foreground text-sm">
              {t("medication.detail.treatmentPeriod", {
                start: medication.startDate,
                end: medication.endDate ?? t("medication.detail.ongoing"),
              })}
            </p>
          ) : null}

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="size-5" />
            {t("medication.detail.inventory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {stockQuantity === null
                ? t("medication.detail.inventoryNotConfigured")
                : t("medication.detail.currentStock", {
                    count: stockQuantity,
                  })}
            </span>
            {lowStock ? (
              <Badge variant="destructive">
                {t("medication.detail.lowStock")}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <label htmlFor="stock-delta" className="text-sm font-medium">
                {t("medication.detail.inventoryDelta")}
              </label>
              <Input
                id="stock-delta"
                type="number"
                step="0.001"
                value={stockDelta}
                onChange={(event) => setStockDelta(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="stock-reason" className="text-sm font-medium">
                {t("medication.detail.inventoryReason")}
              </label>
              <select
                id="stock-reason"
                value={stockReason}
                onChange={(event) =>
                  setStockReason(
                    event.target.value as "refill" | "correction" | "manual",
                  )
                }
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="refill">{t("medication.detail.refill")}</option>
                <option value="correction">
                  {t("medication.detail.correction")}
                </option>
                <option value="manual">{t("medication.detail.manual")}</option>
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={stockMutation.isPending || stockDelta === ""}
              onClick={() => stockMutation.mutate()}
            >
              {t("medication.detail.applyInventory")}
            </Button>
          </div>
          {medication.inventoryEvents.length > 0 ||
          medication.intakeRevisions.length > 0 ? (
            <div className="space-y-2 border-t pt-4">
              {[...medication.inventoryEvents].slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="text-muted-foreground flex items-center justify-between gap-3 text-sm"
                >
                  <span>
                    {t("medication.detail.inventoryEvent", {
                      delta: Number(event.quantityDelta),
                    })}
                  </span>
                  <time dateTime={new Date(event.occurredAt).toISOString()}>
                    {new Date(event.occurredAt).toLocaleDateString()}
                  </time>
                </div>
              ))}
              {medication.intakeRevisions.slice(0, 10).map((revision) => (
                <div
                  key={revision.id}
                  className="text-muted-foreground flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <History className="size-4" />
                    {t("medication.detail.intakeRevision", {
                      action: t(
                        revision.action === "cancelled"
                          ? "medication.detail.cancelled"
                          : "medication.detail.corrected",
                      ),
                    })}
                  </span>
                  <time dateTime={new Date(revision.createdAt).toISOString()}>
                    {new Date(revision.createdAt).toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Dosage History */}
      {medication.history.length > 0 && (
        <DosageTimeline history={medication.history} />
      )}
      {medication.scheduleRevisions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("medication.detail.scheduleHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {medication.scheduleRevisions.map((revision) => (
              <div key={revision.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {revision.effectiveDate} · {revision.dosage}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    FREQUENCY_LABELS[revision.frequency] ??
                      "medication.frequency.daily",
                  )}
                  {revision.scheduleTimes.length > 0
                    ? ` · ${revision.scheduleTimes.join(" · ")}`
                    : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
