"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Clock, Pill } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import {
  getUserPreferences,
  updateNotificationPreferences,
} from "@/features/preferences/preferences.action";
import { useI18n } from "@/i18n/provider";
import { ToggleEmailCheckbox } from "@app/(logged-in)/(account-layout)/account/email/toggle-email-checkbox";
import { getEmailPreferencesAction } from "@app/(logged-in)/(account-layout)/account/email/mail-account.action";
import { useSession } from "@/lib/auth-client";
import {
  getPushContentMode,
  setPushContentMode,
} from "@/features/pwa/push-content-mode";
import { useEffect, useState } from "react";

export function NotificationsContent() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [detailedOnThisDevice, setDetailedOnThisDevice] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const ownerId = session?.user.id;
    setDetailedOnThisDevice(
      ownerId ? getPushContentMode(ownerId) === "detailed" : false,
    );
  }, [session?.user.id]);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: emailPreferences } = useQuery({
    queryKey: ["email-preferences"],
    queryFn: async () => {
      const result = await getEmailPreferencesAction();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
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

  const updatePushPermission = async (checked: boolean) => {
    if (checked && "Notification" in window) {
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (permission !== "granted") {
        toast.error(t("settings.notifications.permissionDenied"));
        return;
      }
    }
    notificationMutation.mutate({ notificationsEnabled: checked });
  };

  return (
    <PageLayout
      title={t("settings.notifications.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
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
                checked={preferences?.notificationsEnabled ?? false}
                onCheckedChange={(checked) =>
                  void updatePushPermission(checked)
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
                        {t("settings.notifications.medicationReminders")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("settings.notifications.medicationRemindersHint")}
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
                      {t("settings.notifications.medicationReminderTime")}
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
                      {t("settings.notifications.medicationReminderTimeHint")}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="pr-4">
                    <p className="font-bold text-gray-800">
                      Afficher le nom du traitement sur cet appareil
                    </p>
                    <p className="text-sm text-gray-500">
                      Désactivé par défaut. Activez-le uniquement sur un
                      appareil personnel et de confiance.
                    </p>
                  </div>
                  <Switch
                    checked={detailedOnThisDevice}
                    onCheckedChange={(checked) => {
                      const ownerId = session?.user.id;
                      if (!ownerId) return;
                      setDetailedOnThisDevice(checked);
                      setPushContentMode(
                        ownerId,
                        checked ? "detailed" : "generic",
                      );
                    }}
                  />
                </div>

                {emailPreferences?.available ? (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <ToggleEmailCheckbox
                      unsubscribed={emailPreferences.unsubscribed}
                    />
                  </div>
                ) : null}
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </PageLayout>
  );
}
