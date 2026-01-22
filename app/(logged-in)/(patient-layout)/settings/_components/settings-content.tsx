"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  ChevronRight,
  Moon,
  Sun,
  Sparkles,
  Clock,
  Pill,
  Download,
  Trash2,
  LogOut,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { cn } from "@/lib/utils";
import {
  getUserPreferences,
  updateDisplayPreferences,
  updateNotificationPreferences,
} from "@/features/preferences/preferences.action";
import { useI18n } from "@/i18n/provider";
import { useSession } from "@/lib/auth-client";

type TabKey =
  | "profile"
  | "notifications"
  | "appearance"
  | "privacy"
  | "subscription";

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Apparence", icon: Palette },
  { key: "privacy", label: "Confidentialité", icon: Shield },
  { key: "subscription", label: "Abonnement", icon: CreditCard },
];

export function SettingsContent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const displayMutation = useMutation({
    mutationFn: async (data: { defaultChartPeriod?: number }) => {
      const result = await updateDisplayPreferences(data);
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("settings.saved"));
      void queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const notificationMutation = useMutation({
    mutationFn: async (data: {
      notificationsEnabled?: boolean;
      dailyCheckInReminder?: boolean;
      dailyCheckInTime?: string;
      medicationReminders?: boolean;
    }) => {
      const result = await updateNotificationPreferences(data);
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("settings.saved"));
      void queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const user = session?.user;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          {t("settings.title")}
        </h1>
        <p className="text-gray-500">Personnalisez votre expérience Moodday</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <GlassCard padding="sm" variant="elevated">
            <nav className="space-y-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                      activeTab === tab.key
                        ? "bg-[var(--primary)] text-white"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="size-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </GlassCard>

          {/* Account Link */}
          <Link
            href="/account"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-4 text-sm font-medium text-gray-600 transition-all hover:bg-white hover:shadow-sm"
          >
            <LogOut className="size-5" />
            Gérer mon compte
            <ChevronRight className="ml-auto size-4" />
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-9">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <GlassCard padding="lg" variant="elevated">
                  <GlassCardHeader>
                    <GlassCardTitle
                      icon={<User className="size-5 text-[var(--primary)]" />}
                    >
                      Mon profil
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="size-20 border-4 border-white shadow-lg">
                        <AvatarImage src={user?.image ?? undefined} />
                        <AvatarFallback className="bg-[var(--primary)]/10 text-2xl text-[var(--primary)]">
                          {(user?.name ?? "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {user?.name ?? "Utilisateur"}
                        </h3>
                        <p className="text-gray-500">{user?.email}</p>
                        <button className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline">
                          Modifier la photo
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-gray-600">Prénom</Label>
                        <Input
                          value={(user?.name ?? "").split(" ")[0]}
                          className="rounded-xl border-gray-200"
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-600">Nom</Label>
                        <Input
                          value={(user?.name ?? "")
                            .split(" ")
                            .slice(1)
                            .join(" ")}
                          className="rounded-xl border-gray-200"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600">Fuseau horaire</Label>
                      <Select defaultValue="Europe/Paris">
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">
                            Europe/Paris (UTC+1)
                          </SelectItem>
                          <SelectItem value="Europe/London">
                            Europe/London (UTC)
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            America/New_York (UTC-5)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 font-bold text-white hover:bg-[var(--primary-dark)]">
                      Enregistrer les modifications
                    </Button>
                  </GlassCardContent>
                </GlassCard>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <GlassCard padding="lg" variant="elevated">
                  <GlassCardHeader>
                    <GlassCardTitle
                      icon={<Bell className="size-5 text-[var(--primary)]" />}
                    >
                      {t("settings.notifications.title")}
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    {/* Global toggle */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                          <Bell className="size-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {t("settings.notifications.enabled")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t("settings.notifications.enabledHint")}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences?.notificationsEnabled ?? true}
                        onCheckedChange={(checked) =>
                          notificationMutation.mutate({
                            notificationsEnabled: checked,
                          })
                        }
                      />
                    </div>

                    {preferences?.notificationsEnabled && (
                      <>
                        {/* Daily check-in */}
                        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--sage)]/10 text-[var(--sage)]">
                              <Clock className="size-6" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {t("settings.notifications.dailyCheckIn")}
                              </p>
                              <p className="text-sm text-gray-500">
                                {t("settings.notifications.dailyCheckInHint")}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.dailyCheckInReminder}
                            onCheckedChange={(checked) =>
                              notificationMutation.mutate({
                                dailyCheckInReminder: checked,
                              })
                            }
                          />
                        </div>

                        {preferences.dailyCheckInReminder && (
                          <div className="ml-16 space-y-2">
                            <Label className="text-gray-600">
                              {t("settings.notifications.checkInTime")}
                            </Label>
                            <Input
                              type="time"
                              value={preferences.dailyCheckInTime}
                              onChange={(e) =>
                                notificationMutation.mutate({
                                  dailyCheckInTime: e.target.value,
                                })
                              }
                              className="w-32 rounded-xl border-gray-200"
                            />
                          </div>
                        )}

                        {/* Medication reminders */}
                        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)]">
                              <Pill className="size-6" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {t(
                                  "settings.notifications.medicationReminders",
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {t(
                                  "settings.notifications.medicationRemindersHint",
                                )}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.medicationReminders}
                            onCheckedChange={(checked) =>
                              notificationMutation.mutate({
                                medicationReminders: checked,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </GlassCardContent>
                </GlassCard>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <GlassCard padding="lg" variant="elevated">
                  <GlassCardHeader>
                    <GlassCardTitle
                      icon={
                        <Palette className="size-5 text-[var(--primary)]" />
                      }
                    >
                      Apparence
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-gray-600">Thème</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          {
                            id: "light",
                            icon: Sun,
                            label: "Clair",
                            bg: "bg-white",
                          },
                          {
                            id: "dark",
                            icon: Moon,
                            label: "Sombre",
                            bg: "bg-gray-900",
                          },
                          {
                            id: "zen",
                            icon: Sparkles,
                            label: "Zen",
                            bg: "bg-[var(--warm-bg)]",
                          },
                        ].map((theme) => {
                          const Icon = theme.icon;
                          return (
                            <button
                              key={theme.id}
                              className={cn(
                                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all",
                                theme.id === "light"
                                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                  : "border-gray-200 hover:border-gray-300",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex size-12 items-center justify-center rounded-xl",
                                  theme.bg,
                                  theme.id === "dark" && "text-white",
                                )}
                              >
                                <Icon className="size-6" />
                              </div>
                              <span className="font-medium text-gray-800">
                                {theme.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600">
                        {t("settings.display.chartPeriod")}
                      </Label>
                      <Select
                        value={String(preferences?.defaultChartPeriod ?? 30)}
                        onValueChange={(value) =>
                          displayMutation.mutate({
                            defaultChartPeriod: Number(value),
                          })
                        }
                      >
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">
                            {t("settings.display.days7")}
                          </SelectItem>
                          <SelectItem value="30">
                            {t("settings.display.days30")}
                          </SelectItem>
                          <SelectItem value="90">
                            {t("settings.display.days90")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {t("settings.display.chartPeriodHint")}
                      </p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <GlassCard padding="lg" variant="elevated">
                    <GlassCardHeader>
                      <GlassCardTitle
                        icon={
                          <Shield className="size-5 text-[var(--primary)]" />
                        }
                      >
                        Confidentialité & Données
                      </GlassCardTitle>
                    </GlassCardHeader>

                    <GlassCardContent className="space-y-4">
                      <Link
                        href="/export"
                        className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--sage)]/10 text-[var(--sage)]">
                            <Download className="size-6" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              Exporter mes données
                            </p>
                            <p className="text-sm text-gray-500">
                              Téléchargez toutes vos données au format JSON/PDF
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-gray-400" />
                      </Link>

                      <button className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-red-50/50 p-4 transition-all hover:bg-red-100/50">
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
                            <Trash2 className="size-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-red-700">
                              Supprimer mon compte
                            </p>
                            <p className="text-sm text-red-600">
                              Cette action est irréversible
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-red-400" />
                      </button>
                    </GlassCardContent>
                  </GlassCard>

                  <GlassCard padding="md" variant="elevated">
                    <GlassCardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                          <ExternalLink className="size-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">
                            Politique de confidentialité
                          </p>
                          <p className="text-sm text-gray-500">
                            Vos données sont protégées conformément au RGPD
                          </p>
                        </div>
                        <Link
                          href="/privacy"
                          className="text-sm font-medium text-[var(--primary)] hover:underline"
                        >
                          Lire
                        </Link>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === "subscription" && (
                <GlassCard
                  padding="lg"
                  variant="elevated"
                  className="border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--lavender)]/10"
                >
                  <GlassCardHeader>
                    <GlassCardTitle
                      icon={
                        <CreditCard className="size-5 text-[var(--primary)]" />
                      }
                    >
                      Mon abonnement
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-white p-6 text-center">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-bold text-[var(--primary)]">
                        <Sparkles className="size-4" />
                        Plan Pro
                      </div>
                      <p className="mb-2 text-4xl font-bold text-gray-800">
                        9,99€
                        <span className="text-lg font-normal text-gray-500">
                          /mois
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Prochain renouvellement : 15 février 2026
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-600">
                        Inclus dans votre plan :
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Historique illimité",
                          "Analyses IA avancées",
                          "Export PDF clinique",
                          "Jusqu'à 5 aidants",
                          "Support prioritaire",
                        ].map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <span className="flex size-5 items-center justify-center rounded-full bg-[var(--sage)]/20 text-[var(--sage)]">
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-gray-200"
                      >
                        Changer de plan
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Annuler
                      </Button>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
