"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronRight,
  Circle,
  History,
  Moon,
  MessageSquare,
  Pill,
  Plus,
  PlusCircle,
  Share,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { MoodSlider } from "@/components/nowts/mood-slider";
import { StreakCard } from "@/components/nowts/streak-card";
import { MoodChart } from "@/components/nowts/mood-chart";
import { saveMoodEntry } from "@/features/mood/mood.action";
import {
  getDashboardSummary,
  getMoodChartData,
  getPatternInsights,
} from "@/features/insights/insights.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DashboardContentProps = {
  userName: string;
};

export function DashboardContent({ userName }: DashboardContentProps) {
  const [currentMood, setCurrentMood] = useState(7);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch dashboard data
  const { data: _summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const result = await getDashboardSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["mood-chart", 7],
    queryFn: async () => {
      const result = await getMoodChartData({ days: 7 });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: insights } = useQuery({
    queryKey: ["pattern-insights"],
    queryFn: async () => {
      const result = await getPatternInsights();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  // Get today's date formatted
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Handle mood save
  const handleSaveMood = async () => {
    setIsSaving(true);
    try {
      const result = await saveMoodEntry({ value: currentMood });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Humeur enregistrée !");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  // Mock medications data (would come from API)
  const medications = [
    { id: 1, name: "Lamictal", dose: "200mg", taken: true, time: "08:00" },
    { id: 2, name: "Vitamine D", dose: "1000UI", taken: false, time: "12:00" },
    { id: 3, name: "Quétiapine", dose: "50mg", taken: false, time: "21:00" },
  ];

  const takenCount = medications.filter((m) => m.taken).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 lg:px-6">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            Bonjour {userName.split(" ")[0]} !
          </h1>
          <p className="text-gray-500">
            Aujourd&apos;hui, nous sommes le {today}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="glass-card relative flex size-12 items-center justify-center rounded-2xl text-gray-600 transition-all hover:text-[var(--primary)]">
            <Bell className="size-6" />
            <span className="absolute top-3 right-3 size-2 rounded-full bg-[var(--destructive)] ring-2 ring-white" />
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Core Tracking */}
        <div className="space-y-8 lg:col-span-8">
          {/* Quick Mood Section */}
          <GlassCard
            padding="lg"
            variant="elevated"
            className="group relative overflow-hidden"
          >
            <div className="relative z-10">
              <GlassCardHeader>
                <div>
                  <h2 className="mb-1 text-xl font-bold">
                    Comment vous sentez-vous ?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Prenez un instant pour vous écouter.
                  </p>
                </div>
                <GlassCardBadge>Saisie rapide</GlassCardBadge>
              </GlassCardHeader>

              <div className="my-8">
                <MoodSlider value={currentMood} onChange={setCurrentMood} />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveMood}
                  disabled={isSaving}
                  className="shadow-soft flex-grow rounded-2xl bg-[var(--primary)] py-6 text-lg font-bold text-white transition-all hover:bg-[var(--primary-dark)] active:scale-[0.98]"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer l'humeur"}
                </Button>
                <Link
                  href="/mood"
                  className="glass-card flex items-center justify-center rounded-2xl px-6 font-bold text-[var(--primary)] transition-all hover:bg-white"
                >
                  <Plus className="size-6" />
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Grid: Meds & Sleep */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Medication Card */}
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Pill className="size-5 text-[var(--primary)]" />}
                >
                  Traitements
                </GlassCardTitle>
                <GlassCardBadge>
                  {takenCount}/{medications.length}
                </GlassCardBadge>
              </GlassCardHeader>

              <GlassCardContent className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all",
                      med.taken
                        ? "border-[var(--sage)]/20 bg-[var(--sage)]/10"
                        : "border-gray-100 bg-white hover:border-[var(--primary)]/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition-all",
                        med.taken
                          ? "bg-[var(--sage)] text-white"
                          : "bg-gray-50 text-gray-300 group-hover:text-[var(--primary)]",
                      )}
                    >
                      {med.taken ? (
                        <Check className="size-6" />
                      ) : (
                        <Circle className="size-6" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          med.taken
                            ? "text-[var(--sage-dark)]"
                            : "text-gray-700",
                        )}
                      >
                        {med.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {med.dose} • {med.time}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-gray-300" />
                  </div>
                ))}
              </GlassCardContent>

              <Link
                href="/medications/today"
                className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-500 transition-colors hover:text-[var(--primary)]"
              >
                <History className="size-4" /> Voir l&apos;historique
              </Link>
            </GlassCard>

            {/* Sleep & Energy Card */}
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Moon className="size-5 text-[var(--lavender-dark)]" />}
                >
                  Sommeil
                </GlassCardTitle>
                <span className="rounded-lg bg-[var(--lavender)]/20 px-2 py-1 text-xs font-bold text-[var(--lavender-dark)]">
                  Moy. 7.5h
                </span>
              </GlassCardHeader>

              <div className="mb-4 rounded-2xl border border-gray-50 bg-white p-5 text-center">
                <p className="text-4xl font-bold text-gray-800">7h 45m</p>
                <p className="mt-1 text-xs font-bold tracking-wider text-[var(--sage)] uppercase">
                  Qualité excellente
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-4">
                  <p className="text-[10px] font-bold text-[var(--primary-dark)] uppercase">
                    Énergie
                  </p>
                  <p className="text-lg font-bold">6/10</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-[10px] font-bold text-orange-600 uppercase">
                    Réveils
                  </p>
                  <p className="text-lg font-bold">1 seul</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold text-gray-400">
                  Tendance de la semaine
                </p>
                <div className="flex h-12 items-end justify-between gap-1 px-1">
                  {[60, 40, 80, 70, 50, 90, 75].map((height, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full rounded-t-sm",
                        i === 6
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--lavender)]/30",
                      )}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* 7-Day Mood Trend */}
          <GlassCard padding="lg" variant="elevated">
            <GlassCardHeader>
              <div>
                <h3 className="text-xl font-bold">Tendance de l&apos;humeur</h3>
                <p className="text-sm text-gray-500">7 derniers jours</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--sage)]/10 px-3 py-1 text-xs font-bold text-[var(--sage-dark)]">
                  <TrendingUp className="size-3" /> +12%
                </div>
              </div>
            </GlassCardHeader>

            {chartLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <MoodChart
                moodEntries={chartData?.moodEntries ?? []}
                dosageChanges={[]}
                height={200}
                compact
              />
            )}
          </GlassCard>
        </div>

        {/* Right Column: Sidebar Stats & Caregivers */}
        <div className="space-y-8 lg:col-span-4">
          {/* Streak Card */}
          {summaryLoading ? (
            <Skeleton className="h-48 w-full rounded-[32px]" />
          ) : (
            <StreakCard
              streakDays={23}
              weekProgress={[1, 1, 1, 1, 1, 1, 0]}
              subtitle="Excellent rythme ! Votre suivi est complet depuis 3 semaines."
            />
          )}

          {/* Insights Section */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={
                  <Sparkles className="size-5 text-[var(--lavender-dark)]" />
                }
              >
                IA Insights
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              {insights && insights.length > 0 ? (
                insights.slice(0, 2).map((insight, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-2xl border p-4",
                      index === 0
                        ? "border-[var(--lavender)]/20 bg-[var(--lavender)]/10"
                        : "border-[var(--sage)]/10 bg-[var(--sage)]/5",
                    )}
                  >
                    <p className="text-sm leading-relaxed text-gray-700">
                      {insight.message}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="rounded-2xl border border-[var(--lavender)]/20 bg-[var(--lavender)]/10 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      <span className="font-bold text-[var(--lavender-dark)]">
                        Pattern détecté :
                      </span>{" "}
                      Vos baisses d&apos;énergie semblent corrélées à un sommeil
                      inférieur à 6h les deux nuits précédentes.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--sage)]/10 bg-[var(--sage)]/5 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      L&apos;augmentation du{" "}
                      <span className="font-bold">Lamictal</span> montre une
                      stabilisation de l&apos;humeur sur les 14 derniers jours.
                    </p>
                  </div>
                </>
              )}
            </GlassCardContent>

            <Link
              href="/trends"
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-dashed border-gray-200 py-3 text-xs font-bold text-gray-400 uppercase transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              Voir l&apos;analyse complète
            </Link>
          </GlassCard>

          {/* Caregivers Quick View */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Users className="size-5 text-[var(--primary)]" />}
              >
                Mes Aidants
              </GlassCardTitle>
              <Link
                href="/caregiver"
                className="text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)]"
              >
                <PlusCircle className="size-5" />
              </Link>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-10 rounded-full border border-white bg-gray-200 shadow-sm" />
                  <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-[var(--sage)]" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold">Marie (Maman)</p>
                  <p className="text-[10px] font-medium text-gray-400">
                    Connectée il y a 2h
                  </p>
                </div>
                <button className="flex size-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-all hover:text-[var(--primary)]">
                  <MessageSquare className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-10 rounded-full border border-white bg-gray-200 shadow-sm" />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold">Dr. Dupont (Psy)</p>
                  <p className="text-[10px] font-medium text-gray-400">
                    A consulté le rapport hier
                  </p>
                </div>
                <button className="flex size-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-all hover:text-[var(--primary)]">
                  <Share className="size-4" />
                </button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
