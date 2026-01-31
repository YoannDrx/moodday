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
import { cn } from "@/lib/utils";
import {
  getTodayIntakes,
  getPRNMedications,
  logMedIntake,
  logPRNIntake,
} from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";

type TodayIntake = {
  id: string;
  name: string;
  dosage: string;
  intakes: { id: string; takenAt: Date; skipped: boolean }[];
};

type PRNMedication = {
  id: string;
  name: string;
  dosage: string;
  intakes: { id: string; takenAt: Date }[];
};

export function TodayContent() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();

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
    mutationFn: async ({ medicationId }: { medicationId: string }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueAction({ type: "med_intake", medicationId });
        return { queued: true };
      }
      const result = await logMedIntake({ medicationId });
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
      toast.error(error.message);
    },
  });

  const prnMutation = useMutation({
    mutationFn: async ({ medicationId }: { medicationId: string }) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueAction({ type: "med_prn_intake", medicationId });
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
      toast.error(error.message);
    },
  });

  const isLoading = regularLoading || prnLoading;
  const isError = regularError || prnError;

  const medications = (regularData ?? []) as TodayIntake[];
  const prnMedications = (prnData ?? []) as PRNMedication[];

  const takenCount = medications.filter(
    (m) => m.intakes.length > 0 && !m.intakes[0].skipped,
  ).length;
  const totalCount = medications.length;
  const allDone = takenCount === totalCount && totalCount > 0;
  const progressPercent =
    totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

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
      <div className="mx-auto max-w-2xl px-4 pb-8">
        <GlassCard padding="lg" className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-400" />
          <p className="text-gray-500">{t("common.error")}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-sage -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <Link
          href="/medications"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="size-4" />
          {t("medication.today.backToList")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          {t("medication.today.title")}
        </h1>
        <p className="text-gray-500">{today}</p>
      </header>

      {/* Loading state */}
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
                        taken: takenCount,
                        total: totalCount,
                      })}
                </p>
                <p className="text-sm text-gray-500">
                  {allDone
                    ? t("medication.today.allDoneSubtext")
                    : t(
                        totalCount - takenCount === 1
                          ? "medication.today.remainingSingular"
                          : "medication.today.remainingPlural",
                        { count: totalCount - takenCount },
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
                  const hasTaken =
                    medication.intakes.length > 0 &&
                    !medication.intakes[0].skipped;

                  return (
                    <div
                      key={medication.id}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                        hasTaken
                          ? "border-[var(--sage)]/20 bg-[var(--sage)]/5"
                          : "border-gray-100 bg-white",
                      )}
                    >
                      <button
                        onClick={() =>
                          !hasTaken &&
                          intakeMutation.mutate({
                            medicationId: medication.id,
                          })
                        }
                        disabled={hasTaken || intakeMutation.isPending}
                        className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-xl transition-all",
                          hasTaken
                            ? "bg-[var(--sage)] text-white"
                            : "bg-gray-50 text-gray-300 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]",
                          intakeMutation.isPending &&
                            "cursor-not-allowed opacity-50",
                        )}
                      >
                        {hasTaken ? (
                          <Check className="size-6" />
                        ) : (
                          <Clock className="size-6" />
                        )}
                      </button>

                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-bold",
                            hasTaken
                              ? "text-[var(--sage-dark)]"
                              : "text-gray-800",
                          )}
                        >
                          {medication.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {medication.dosage}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "text-xs font-medium",
                          hasTaken ? "text-[var(--sage)]" : "text-gray-400",
                        )}
                      >
                        {hasTaken
                          ? t("medication.status.taken")
                          : t("medication.status.pending")}
                      </span>
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
                        <p className="text-sm text-gray-400">
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
    </div>
  );
}
