"use client";

import { useEffect, useState } from "react";
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
import { ImageFormItem } from "@/features/images/image-form-item";
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
import {
  updateProfile,
  deleteAccount,
  exportUserData,
  getSubscriptionSummary,
} from "@/features/profile/profile.action";
import { useI18n } from "@/i18n/provider";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  cancelSubscriptionAction,
  openStripePortalAction,
} from "@app/(logged-in)/(account-layout)/account/billing/billing.action";
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

type TabKey =
  | "profile"
  | "notifications"
  | "appearance"
  | "privacy"
  | "subscription";

export function SettingsContent() {
  const { t, tm, locale } = useI18n();
  const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: "profile", label: t("settings.tabs.profile"), icon: User },
    { key: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { key: "appearance", label: t("settings.tabs.appearance"), icon: Palette },
    { key: "privacy", label: t("settings.tabs.privacy"), icon: Shield },
    { key: "subscription", label: t("settings.tabs.subscription"), icon: CreditCard },
  ];
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { theme: activeTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription-summary"],
    queryFn: async () => {
      const result = await getSubscriptionSummary();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  // Initialize profile data from session/preferences
  const user = session?.user;
  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (user?.image !== undefined) {
      setProfileImage(user.image ?? null);
    }
  }, [user?.image]);

  useEffect(() => {
    if (preferences?.timezone) {
      setTimezone(preferences.timezone);
    }
  }, [preferences?.timezone]);

  useEffect(() => {
    if (preferences?.theme && preferences.theme !== activeTheme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme, activeTheme, setTheme]);

  const selectedTheme = preferences?.theme ?? activeTheme ?? "light";
  const timezoneOptions = ["Europe/Paris", "Europe/London", "America/New_York"];
  const timezoneLabels: Record<string, string> = {
    "Europe/Paris": t("settings.timezones.paris"),
    "Europe/London": t("settings.timezones.london"),
    "America/New_York": t("settings.timezones.newYork"),
  };
  const resolvedTimezoneOptions = timezoneOptions.includes(timezone)
    ? timezoneOptions
    : [timezone, ...timezoneOptions];

  const subscriptionLabel = subscription?.plan
    ? t("settings.subscription.planLabel", { plan: subscription.plan })
    : t("settings.subscription.planFree");
  const statusLabels: Record<string, string> = {
    active: t("settings.subscription.status.active"),
    trialing: t("settings.subscription.status.trialing"),
    past_due: t("settings.subscription.status.pastDue"),
    canceled: t("settings.subscription.status.canceled"),
    incomplete: t("settings.subscription.status.incomplete"),
  };
  const subscriptionStatusLabel = subscription?.status
    ? (statusLabels[subscription.status] ?? subscription.status)
    : t("settings.subscription.status.inactive");
  const renewalDate = subscription?.periodEnd
    ? new Date(subscription.periodEnd)
    : null;
  const renewalText = renewalDate
    ? t("settings.subscription.renewal", {
        date: renewalDate.toLocaleDateString(
          locale === "fr" ? "fr-FR" : "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        ),
      })
    : t("settings.subscription.noActive");
  const subscriptionFeatures =
    tm<string[]>("settings.subscription.features") ?? [];

  const displayMutation = useMutation({
    mutationFn: async (data: {
      defaultChartPeriod?: number;
      theme?: "light" | "dark" | "system" | "zen";
    }) => {
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
      medicationReminderTime?: string;
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

  const profileMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      timezone?: string;
      image?: string;
    }) => {
      const result = await updateProfile(data);
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("settings.saved"));
      // Reload session to get updated user data
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteAccount();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: async () => {
      toast.success(t("settings.privacy.accountDeleted"));
      await signOut();
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(openStripePortalAction());
      return result;
    },
    onSuccess: (data) => {
      if (!data.url) return;
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}/account/billing`;
      const result = await resolveActionResult(
        cancelSubscriptionAction({ returnUrl }),
      );
      return result;
    },
    onSuccess: (data) => {
      if (!data.url) return;
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const result = await exportUserData();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moodday-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("settings.privacy.exportSuccess"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
        <p className="text-gray-500">{t("settings.subtitle")}</p>
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
            {t("settings.manageAccount")}
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
                      {t("settings.profile.title")}
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    {/* Avatar Section */}
                    {(() => {
                      const displayName =
                        profileName.length > 0
                          ? profileName
                          : (user?.name ?? t("settings.profile.defaultName"));
                      return (
                        <div className="flex items-center gap-6">
                          <ImageFormItem
                            className="size-20 rounded-full border-4 border-white shadow-lg"
                            imageUrl={profileImage ?? user?.image ?? null}
                            onChange={(url) => setProfileImage(url)}
                          />
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {displayName}
                            </h3>
                            <p className="text-gray-500">{user?.email}</p>
                            <p className="mt-2 text-sm text-gray-400">
                              {t("settings.profile.changePhoto")}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Form Fields */}
                    <div className="space-y-2">
                      <Label className="text-gray-600">
                        {t("settings.profile.fullName")}
                      </Label>
                      <Input
                        value={
                          profileName.length > 0
                            ? profileName
                            : (user?.name ?? "")
                        }
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder={t("settings.profile.fullNamePlaceholder")}
                        className="rounded-xl border-gray-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600">
                        {t("settings.profile.timezone")}
                      </Label>
                      <Select
                        value={timezone}
                        onValueChange={(value) => setTimezone(value)}
                      >
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resolvedTimezoneOptions.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {timezoneLabels[tz] ?? tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() =>
                        profileMutation.mutate({
                          name:
                            profileName.length > 0
                              ? profileName
                              : (user?.name ?? ""),
                          timezone,
                          image: profileImage ?? undefined,
                        })
                      }
                      disabled={profileMutation.isPending}
                      className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 font-bold text-white hover:bg-[var(--primary-dark)]"
                    >
                      {profileMutation.isPending
                        ? t("common.saving")
                        : t("settings.profile.save")}
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
                        {preferences.medicationReminders && (
                          <div className="ml-16 space-y-2">
                            <Label className="text-gray-600">
                              {t(
                                "settings.notifications.medicationReminderTime",
                              )}
                            </Label>
                            <Input
                              type="time"
                              value={preferences.medicationReminderTime}
                              onChange={(e) =>
                                notificationMutation.mutate({
                                  medicationReminderTime: e.target.value,
                                })
                              }
                              className="w-32 rounded-xl border-gray-200"
                            />
                            <p className="text-sm text-gray-400">
                              {t(
                                "settings.notifications.medicationReminderTimeHint",
                              )}
                            </p>
                          </div>
                        )}
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
                      {t("settings.appearance.title")}
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-gray-600">
                        {t("settings.appearance.themeLabel")}
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          {
                            id: "light",
                            icon: Sun,
                            label: t("theme.light"),
                            bg: "bg-white",
                          },
                          {
                            id: "dark",
                            icon: Moon,
                            label: t("theme.dark"),
                            bg: "bg-gray-900",
                          },
                          {
                            id: "zen",
                            icon: Sparkles,
                            label: t("theme.zen"),
                            bg: "bg-[var(--warm-bg)]",
                          },
                        ].map((theme) => {
                          const Icon = theme.icon;
                          const isActive = selectedTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => {
                                setTheme(theme.id);
                                displayMutation.mutate({
                                  theme: theme.id as
                                    | "light"
                                    | "dark"
                                    | "system"
                                    | "zen",
                                });
                              }}
                              className={cn(
                                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all",
                                isActive
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
                        {t("settings.privacy.title")}
                      </GlassCardTitle>
                    </GlassCardHeader>

                    <GlassCardContent className="space-y-4">
                      <button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                        className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--sage)]/10 text-[var(--sage)]">
                            <Download className="size-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-800">
                              {exportMutation.isPending
                                ? t("settings.privacy.exporting")
                                : t("settings.privacy.exportJson")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {t("settings.privacy.exportJsonDescription")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-gray-400" />
                      </button>

                      <Link
                        href="/export"
                        className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Download className="size-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-800">
                              {t("settings.privacy.exportPdf")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {t("settings.privacy.exportPdfDescription")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-gray-400" />
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-red-50/50 p-4 transition-all hover:bg-red-100/50">
                            <div className="flex items-center gap-4">
                              <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
                                <Trash2 className="size-6" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-red-700">
                                  {t("settings.privacy.deleteTitle")}
                                </p>
                                <p className="text-sm text-red-600">
                                  {t("settings.privacy.deleteWarning")}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="size-5 text-red-400" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("settings.privacy.deleteDialogTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("settings.privacy.deleteDialogDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("actions.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate()}
                              disabled={deleteMutation.isPending}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteMutation.isPending
                                ? t("settings.privacy.deleting")
                                : t("settings.privacy.deleteConfirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                            {t("settings.privacy.policyTitle")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t("settings.privacy.policyDescription")}
                          </p>
                        </div>
                        <Link
                          href="/privacy"
                          className="text-sm font-medium text-[var(--primary)] hover:underline"
                        >
                          {t("settings.privacy.policyCta")}
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
                      {t("settings.subscription.title")}
                    </GlassCardTitle>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-6">
                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-white p-6 text-center">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-bold text-[var(--primary)]">
                        <Sparkles className="size-4" />
                        {subscriptionLabel}
                      </div>
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        {t("settings.subscription.statusLabel")}{" "}
                        <span className="capitalize">
                          {subscriptionStatusLabel}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{renewalText}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-600">
                        {t("settings.subscription.includedTitle")}
                      </p>
                      <ul className="space-y-2">
                        {subscriptionFeatures.map((feature, i) => (
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
                        onClick={() => portalMutation.mutate()}
                        disabled={!subscription || portalMutation.isPending}
                      >
                        {portalMutation.isPending
                          ? t("common.redirecting")
                          : t("settings.subscription.changePlan")}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => cancelMutation.mutate()}
                        disabled={!subscription || cancelMutation.isPending}
                      >
                        {cancelMutation.isPending
                          ? t("common.redirecting")
                          : t("actions.cancel")}
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
