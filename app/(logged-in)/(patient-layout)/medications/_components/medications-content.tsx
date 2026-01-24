"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Pill,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { cn } from "@/lib/utils";
import {
  getMedications,
  logMedIntake,
} from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "1x/jour",
  twice_daily: "2x/jour",
  weekly: "1x/semaine",
  prn: "Si besoin",
};

type MedicationWithIntakes = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isPRN: boolean;
  isArchived: boolean;
  intakes: { id: string; takenAt: Date; skipped: boolean }[];
};

export function MedicationsContent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
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
        toast.success("Prise enregistrée hors ligne.");
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Prise enregistrée !");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const medications = data ?? [];
  const activeMedications = medications.filter(
    (m: MedicationWithIntakes) => !m.isArchived,
  );
  const archivedMedications = medications.filter(
    (m: MedicationWithIntakes) => m.isArchived,
  );

  // Calculate stats
  const regularMeds = activeMedications.filter(
    (m: MedicationWithIntakes) => !m.isPRN,
  );
  const takenToday = regularMeds.filter((m: MedicationWithIntakes) =>
    m.intakes.some((i) => !i.skipped),
  ).length;
  const totalRegular = regularMeds.length;
  const adherenceRate =
    totalRegular > 0 ? Math.round((takenToday / totalRegular) * 100) : 0;

  // Today's date
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isError) {
    return (
      <GlassCard padding="lg" className="text-center">
        <AlertCircle className="mx-auto mb-4 size-12 text-red-400" />
        <p className="text-gray-500">{t("common.error")}</p>
      </GlassCard>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
              {t("medication.list.title")}
            </h1>
            <p className="text-gray-500">{today}</p>
          </div>
          <Button
            asChild
            className="shadow-soft rounded-2xl bg-[var(--primary)] px-6 font-bold text-white transition-all hover:bg-[var(--primary-dark)]"
          >
            <Link href="/medications/new">
              <Plus className="mr-2 size-4" />
              {t("medication.list.addNew")}
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {/* Adherence Card */}
        <GlassCard padding="md" variant="elevated">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl",
                adherenceRate >= 80
                  ? "bg-[var(--sage)]/10 text-[var(--sage)]"
                  : adherenceRate >= 50
                    ? "bg-orange-100 text-orange-500"
                    : "bg-red-100 text-red-500",
              )}
            >
              <TrendingUp className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Adhérence
              </p>
              <p className="text-2xl font-bold">{adherenceRate}%</p>
            </div>
          </div>
        </GlassCard>

        {/* Today Progress Card */}
        <GlassCard padding="md" variant="elevated">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Calendar className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Aujourd&apos;hui
              </p>
              <p className="text-2xl font-bold">
                {takenToday}/{totalRegular}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Total Medications Card */}
        <GlassCard padding="md" variant="elevated">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
              <Pill className="size-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Traitements
              </p>
              <p className="text-2xl font-bold">{activeMedications.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <Link
          href="/medications/today"
          className="glass-card flex flex-1 items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold text-gray-600 transition-all hover:bg-white hover:text-[var(--primary)]"
        >
          <Clock className="size-5" />
          Prises du jour
        </Link>
        <Link
          href="/medications"
          className="glass-card flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-[var(--primary)] transition-all hover:bg-white"
        >
          <History className="size-5" />
          Historique
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeMedications.length === 0 && !showArchived && (
        <GlassCard padding="lg" className="py-16 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
            <Pill className="size-10 text-[var(--primary)]" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            Aucun traitement
          </h3>
          <p className="mb-6 text-gray-500">{t("medication.list.empty")}</p>
          <Button
            asChild
            className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 py-3 font-bold text-white"
          >
            <Link href="/medications/new">
              <Plus className="mr-2 size-4" />
              Ajouter un traitement
            </Link>
          </Button>
        </GlassCard>
      )}

      {/* Medication List */}
      {!isLoading && activeMedications.length > 0 && (
        <GlassCard padding="md" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Pill className="size-5 text-[var(--primary)]" />}
            >
              Mes traitements
            </GlassCardTitle>
            <GlassCardBadge>{activeMedications.length} actifs</GlassCardBadge>
          </GlassCardHeader>

          <GlassCardContent className="space-y-3">
            {activeMedications.map((medication: MedicationWithIntakes) => (
              <MedicationRow
                key={medication.id}
                medication={medication}
                onTake={() =>
                  intakeMutation.mutate({ medicationId: medication.id })
                }
                isPending={intakeMutation.isPending}
              />
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Show archived toggle */}
      {(archivedMedications.length > 0 || showArchived) && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white/50 px-4 py-3">
          <span className="text-sm text-gray-500">
            {showArchived
              ? t("medication.list.hideArchived")
              : t("medication.list.showArchived")}
          </span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </div>
      )}

      {/* Archived medications */}
      {showArchived && archivedMedications.length > 0 && (
        <GlassCard padding="md" variant="default" className="mt-6 opacity-75">
          <GlassCardHeader>
            <GlassCardTitle icon={<Archive className="size-5 text-gray-400" />}>
              {t("medication.list.archived")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {archivedMedications.map((medication: MedicationWithIntakes) => (
              <MedicationRow
                key={medication.id}
                medication={medication}
                isArchived
              />
            ))}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

function MedicationRow({
  medication,
  onTake,
  isPending = false,
  isArchived = false,
}: {
  medication: MedicationWithIntakes;
  onTake?: () => void;
  isPending?: boolean;
  isArchived?: boolean;
}) {
  const { t } = useI18n();
  const hasTakenToday = medication.intakes.some((intake) => !intake.skipped);
  const frequencyLabel =
    FREQUENCY_LABELS[medication.frequency] ?? FREQUENCY_LABELS.daily;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasTakenToday && onTake && !isArchived) {
      onTake();
    }
  };

  return (
    <Link href={`/medications/${medication.id}`}>
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
          hasTakenToday
            ? "border-[var(--sage)]/20 bg-[var(--sage)]/5"
            : "border-gray-100 bg-white hover:border-[var(--primary)]/30 hover:shadow-sm",
          isArchived && "opacity-60",
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={hasTakenToday || isPending || isArchived}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl transition-all",
            hasTakenToday
              ? "bg-[var(--sage)] text-white"
              : "bg-gray-50 text-gray-300 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]",
            (isPending || isArchived) && "cursor-not-allowed opacity-50",
          )}
        >
          {hasTakenToday ? (
            <Check className="size-6" />
          ) : (
            <Circle className="size-6" />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold",
                hasTakenToday ? "text-[var(--sage-dark)]" : "text-gray-800",
              )}
            >
              {medication.name}
            </span>
            {medication.isPRN && (
              <Badge
                variant="outline"
                className="rounded-lg border-[var(--lavender)]/30 bg-[var(--lavender)]/10 text-[10px] font-bold text-[var(--lavender-dark)]"
              >
                {t("medication.prn.badge")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {medication.dosage} • {frequencyLabel}
          </p>
        </div>

        {/* Status & Arrow */}
        <div className="flex items-center gap-3">
          {!isArchived && !medication.isPRN && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                hasTakenToday ? "text-[var(--sage)]" : "text-gray-400",
              )}
            >
              {hasTakenToday ? (
                <>
                  <Check className="size-3" />
                  Pris
                </>
              ) : (
                <>
                  <Clock className="size-3" />
                  En attente
                </>
              )}
            </span>
          )}
          <ChevronRight className="size-5 text-gray-300 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
