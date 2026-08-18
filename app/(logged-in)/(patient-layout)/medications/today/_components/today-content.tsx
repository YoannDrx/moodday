"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pill,
  CheckCircle2,
  ArrowLeft,
  Plus,
  AlertCircle,
  Clock,
  Check,
  WifiOff,
  Undo2,
  CircleSlash,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { cn } from "@/lib/utils";
import {
  getTodayIntakes,
  getPRNMedications,
  logMedIntake,
  logPRNIntake,
  skipMedIntake,
  deleteMedIntake,
} from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";
import { getOfflineStorageErrorMessage } from "@/features/pwa/offline-store";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import type { DoseSlotStatus } from "@/features/medication/schedule";

type DoseSlot = {
  id: string;
  doseIndex: number;
  scheduledForDate: string;
  scheduledTime: string | null;
  labelKey: string;
  status: DoseSlotStatus;
  intake: {
    id: string;
    takenAt: Date;
    skipped: boolean;
    doseIndex: number | null;
    scheduledForDate: string | null;
  } | null;
};

type TodayIntake = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  intakes: { id: string; takenAt: Date; skipped: boolean }[];
  doseSlots: DoseSlot[];
};

type PRNMedication = {
  id: string;
  name: string;
  dosage: string;
  intakes: { id: string; takenAt: Date }[];
};

export function TodayContent({ ownerId: initialOwnerId }: { ownerId: string }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const { isOnline, queuedCount, ownerId } = useOfflineStatus(initialOwnerId);

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

  const intakeMutation = useMutation({
    mutationFn: async ({
      medicationId,
      doseIndex,
      scheduledForDate,
    }: {
      medicationId: string;
      doseIndex: number;
      scheduledForDate: string;
    }) => {
      const takenAt = new Date().toISOString();

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueAction(ownerId ?? "", {
          type: "med_intake",
          medicationId,
          doseIndex,
          scheduledForDate,
          takenAt,
        });
        return { queued: true };
      }
      const result = await logMedIntake({
        medicationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: (result) => {
      if ((result as { queued?: boolean }).queued) {
        toast.success(t("medication.intake.loggedOffline"));
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
      toast.success(t("medication.intake.logged"));
    },
    onError: (error) => {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("common.error"),
        }),
      );
    },
  });

  const skipMutation = useMutation({
    mutationFn: async ({
      medicationId,
      doseIndex,
      scheduledForDate,
    }: {
      medicationId: string;
      doseIndex: number;
      scheduledForDate: string;
    }) => {
      const takenAt = new Date().toISOString();

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueAction(ownerId ?? "", {
          type: "med_skip",
          medicationId,
          doseIndex,
          scheduledForDate,
          takenAt,
        });
        return { queued: true };
      }

      const result = await skipMedIntake({
        medicationId,
        doseIndex,
        scheduledForDate,
        takenAt,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: (result) => {
      if ((result as { queued?: boolean }).queued) {
        toast.success(t("medication.intake.skippedOffline"));
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
      toast.success(t("medication.intake.skipped"));
    },
    onError: (error) => {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("common.error"),
        }),
      );
    },
  });

  const undoMutation = useMutation({
    mutationFn: async ({ intakeId }: { intakeId: string }) => {
      const result = await deleteMedIntake({ intakeId });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
      toast.success(t("medication.intake.undone"));
    },
    onError: (error) => {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("common.error"),
        }),
      );
    },
  });

  const prnMutation = useMutation({
    mutationFn: async ({ medicationId }: { medicationId: string }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueAction(ownerId ?? "", {
          type: "med_prn_intake",
          medicationId,
        });
        return { queued: true };
      }
      const result = await logPRNIntake({ medicationId });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: (result) => {
      if ((result as { queued?: boolean }).queued) {
        toast.success(t("medication.intake.loggedOffline"));
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["prnMedications"] });
      toast.success(t("medication.intake.logged"));
    },
    onError: (error) => {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("common.error"),
        }),
      );
    },
  });

  const isLoading = regularLoading || prnLoading;
  const isError = regularError || prnError;

  const medications = (regularData ?? []) as TodayIntake[];
  const prnMedications = (prnData ?? []) as PRNMedication[];

  const scheduledDoseSlots = medications.flatMap((medication) =>
    medication.doseSlots.map((slot) => ({ medication, slot })),
  );
  const takenCount = scheduledDoseSlots.filter(
    ({ slot }) => slot.status === "taken",
  ).length;
  const completedCount = scheduledDoseSlots.filter(
    ({ slot }) => slot.status !== "pending",
  ).length;
  const totalCount = scheduledDoseSlots.length;
  const pendingCount = scheduledDoseSlots.filter(
    ({ slot }) => slot.status === "pending",
  ).length;
  const allDone = pendingCount === 0 && totalCount > 0;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Today's date
  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );

  if (isError) {
    return (
      <PageLayout
        title={t("medication.today.title")}
        subtitle={today}
        maxWidth="4xl"
        blobVariant="sage"
      >
        <GlassCard padding="lg" className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-400" />
          <p className="text-gray-500">{t("common.error")}</p>
        </GlassCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("medication.today.title")}
      subtitle={today}
      maxWidth="4xl"
      blobVariant="sage"
      headerRight={
        <Link
          href="/medications"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="size-4" />
          {t("medication.today.backToList")}
        </Link>
      }
    >
      {/* Loading state */}
      {(!isOnline || queuedCount > 0) && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <WifiOff className="size-5 shrink-0" />
          <span>
            {!isOnline
              ? t("common.offlineMode")
              : t("common.pendingSync", { count: queuedCount })}
            {!isOnline && queuedCount > 0
              ? ` ${t("common.pendingSync", { count: queuedCount })}`
              : null}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        medications.length === 0 &&
        prnMedications.length === 0 && (
          <GlassCard padding="lg" className="py-16 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Pill className="size-10 text-[var(--primary)]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              {t("medication.today.emptyTitle")}
            </h3>
            <p className="mb-6 text-gray-500">{t("medication.today.empty")}</p>
            <Button
              asChild
              className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 py-3 font-bold text-white"
            >
              <Link href="/medications/new">
                <Plus className="mr-2 size-4" />
                {t("medication.today.addMedication")}
              </Link>
            </Button>
          </GlassCard>
        )}

      {/* Content */}
      {!isLoading && (medications.length > 0 || prnMedications.length > 0) && (
        <div className="space-y-6">
          {/* Progress Card */}
          <GlassCard
            padding="lg"
            variant="elevated"
            className={cn(
              "relative overflow-hidden",
              allDone && "border-[var(--sage)]/30 bg-[var(--sage)]/5",
            )}
          >
            <div className="flex items-center gap-5">
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-2xl",
                  allDone
                    ? "bg-[var(--sage)] text-white"
                    : "bg-[var(--primary)]/10 text-[var(--primary)]",
                )}
              >
                {allDone ? (
                  <CheckCircle2 className="size-8" />
                ) : (
                  <span className="text-xl font-bold">
                    {takenCount}/{totalCount}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800">
                  {allDone
                    ? t("medication.today.allDone")
                    : t("medication.today.progress", {
                        taken: completedCount,
                        total: totalCount,
                      })}
                </p>
                <p className="text-sm text-gray-500">
                  {allDone
                    ? t("medication.today.allDoneSubtext")
                    : t(
                        pendingCount === 1
                          ? "medication.today.remainingSingular"
                          : "medication.today.remainingPlural",
                        { count: pendingCount },
                      )}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {!allDone && totalCount > 0 && (
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* Regular Medications */}
          {medications.length > 0 && (
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Pill className="size-5 text-[var(--primary)]" />}
                >
                  {t("medication.today.regularTitle")}
                </GlassCardTitle>
                <GlassCardBadge>
                  {takenCount}/{totalCount}
                </GlassCardBadge>
              </GlassCardHeader>

              <GlassCardContent className="space-y-3">
                {medications.map((medication) => {
                  const hasPendingSlot = medication.doseSlots.some(
                    (slot) => slot.status === "pending",
                  );

                  return (
                    <div
                      key={medication.id}
                      className={cn(
                        "rounded-2xl border p-4 transition-all",
                        !hasPendingSlot
                          ? "border-[var(--sage)]/20 bg-[var(--sage)]/5"
                          : "border-gray-100 bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-800">
                            {medication.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {medication.dosage}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-lg px-2 py-1 text-xs font-medium",
                            hasPendingSlot
                              ? "bg-gray-50 text-gray-600"
                              : "bg-[var(--sage)]/10 text-[var(--sage-dark)]",
                          )}
                        >
                          {hasPendingSlot
                            ? t("medication.status.pending")
                            : t("medication.status.taken")}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {medication.doseSlots.map((slot) => {
                          const isTaken = slot.status === "taken";
                          const isSkipped = slot.status === "skipped";
                          const isPending = slot.status === "pending";
                          const intakeId = slot.intake?.id;

                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2",
                                isTaken
                                  ? "border-[var(--sage)]/20 bg-white"
                                  : isSkipped
                                    ? "border-orange-200 bg-orange-50"
                                    : "border-gray-100 bg-gray-50",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  isPending &&
                                  intakeMutation.mutate({
                                    medicationId: medication.id,
                                    doseIndex: slot.doseIndex,
                                    scheduledForDate: slot.scheduledForDate,
                                  })
                                }
                                disabled={
                                  !isPending || intakeMutation.isPending
                                }
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
                                  isTaken
                                    ? "bg-[var(--sage)] text-white"
                                    : isSkipped
                                      ? "bg-orange-400 text-white"
                                      : "bg-white text-gray-300 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]",
                                  intakeMutation.isPending &&
                                    "cursor-not-allowed opacity-50",
                                )}
                                aria-label={t("medication.intake.logged")}
                              >
                                {isTaken ? (
                                  <Check className="size-5" />
                                ) : isSkipped ? (
                                  <CircleSlash className="size-5" />
                                ) : (
                                  <Clock className="size-5" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-700">
                                  {t(slot.labelKey)}
                                  {slot.scheduledTime ? (
                                    <span className="ml-2 text-xs font-medium text-gray-600">
                                      {slot.scheduledTime}
                                    </span>
                                  ) : null}
                                </p>
                                <p
                                  className={cn(
                                    "text-xs font-medium",
                                    isTaken
                                      ? "text-[var(--sage-dark)]"
                                      : isSkipped
                                        ? "text-orange-600"
                                        : "text-gray-600",
                                  )}
                                >
                                  {isTaken
                                    ? t("medication.status.taken")
                                    : isSkipped
                                      ? t("medication.status.skipped")
                                      : t("medication.status.pending")}
                                </p>
                              </div>

                              {isPending ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    skipMutation.mutate({
                                      medicationId: medication.id,
                                      doseIndex: slot.doseIndex,
                                      scheduledForDate: slot.scheduledForDate,
                                    })
                                  }
                                  disabled={skipMutation.isPending}
                                  className="h-9 rounded-xl px-3 text-xs text-gray-500 hover:bg-white hover:text-gray-700"
                                >
                                  {t("medication.intake.skipDose")}
                                </Button>
                              ) : (
                                intakeId && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      undoMutation.mutate({
                                        intakeId,
                                      })
                                    }
                                    disabled={
                                      undoMutation.isPending || !isOnline
                                    }
                                    className="h-9 rounded-xl px-3 text-xs text-gray-500 hover:bg-white hover:text-gray-700"
                                  >
                                    <Undo2 className="mr-1 size-3.5" />
                                    {t("medication.intake.undo")}
                                  </Button>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </GlassCardContent>
            </GlassCard>
          )}

          {/* PRN Medications */}
          {prnMedications.length > 0 && (
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Pill className="size-5 text-[var(--lavender-dark)]" />}
                >
                  {t("medication.prn.section")}
                </GlassCardTitle>
                <span className="rounded-lg bg-[var(--lavender)]/20 px-2 py-1 text-xs font-bold text-[var(--lavender-dark)]">
                  {t("medication.prn.section")}
                </span>
              </GlassCardHeader>

              <GlassCardContent className="space-y-3">
                {prnMedications.map((medication) => {
                  const todayIntakesCount = medication.intakes.length;

                  return (
                    <div
                      key={medication.id}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
                        <Pill className="size-6" />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-gray-800">
                          {medication.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {medication.dosage}
                          {todayIntakesCount > 0 && (
                            <span className="ml-2 text-[var(--lavender-dark)]">
                              {t(
                                todayIntakesCount === 1
                                  ? "medication.prn.takenTodaySingular"
                                  : "medication.prn.takenTodayPlural",
                                { count: todayIntakesCount },
                              )}
                            </span>
                          )}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          prnMutation.mutate({ medicationId: medication.id })
                        }
                        disabled={prnMutation.isPending}
                        className="rounded-xl border-[var(--lavender)]/30 text-[var(--lavender-dark)] hover:bg-[var(--lavender)]/10"
                      >
                        <Plus className="mr-1 size-4" />
                        {t("medication.prn.logButton")}
                      </Button>
                    </div>
                  );
                })}
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      )}
    </PageLayout>
  );
}
