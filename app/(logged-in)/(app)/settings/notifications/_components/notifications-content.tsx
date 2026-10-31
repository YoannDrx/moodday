"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Clock, Moon } from "lucide-react";

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

export function NotificationsContent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

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
      quietHoursStart?: string;
      quietHoursEnd?: string;
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
            <GlassCardTitle icon={<Bell className="text-foreground size-5" />}>
              {t("settings.notifications.title")}
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent className="space-y-6">
            {/* Global toggle */}
            <div className="bg-card flex items-center justify-between rounded-2xl border border-[var(--ink)]/25 p-4">
              <div className="flex items-center gap-4">
                <div className="bg-honey-soft text-foreground flex size-12 items-center justify-center rounded-xl">
                  <Bell className="size-6" />
                </div>
                <div>
                  <p className="text-foreground font-bold">
                    {t("settings.notifications.enabled")}
                  </p>
                  <p className="text-muted-foreground text-sm">
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
                <div className="bg-card flex items-center justify-between rounded-2xl border border-[var(--ink)]/25 p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-mint-soft text-foreground flex size-12 items-center justify-center rounded-xl">
                      <Clock className="size-6" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">
                        {t("settings.notifications.dailyCheckIn")}
                      </p>
                      <p className="text-muted-foreground text-sm">
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
                    <Label className="text-muted-foreground">
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
                      className="w-32 rounded-xl border-[var(--ink)]/25"
                    />
                  </div>
                )}

                <div className="bg-card flex flex-col gap-3 rounded-2xl border-2 border-[var(--ink)] p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-plum-soft/50 flex size-12 items-center justify-center rounded-xl">
                      <Moon className="size-6" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">Heures calmes</p>
                      <p className="text-muted-foreground text-sm">
                        Aucune notification de ton duo pendant ce créneau. Ce
                        qui arrive est livré à la fin.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-16">
                    <Label htmlFor="quiet-start">De</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) =>
                        notificationMutation.mutate({
                          quietHoursStart: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                    <Label htmlFor="quiet-end">à</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) =>
                        notificationMutation.mutate({
                          quietHoursEnd: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                  </div>
                </div>

                {emailPreferences?.available ? (
                  <div className="bg-card rounded-2xl border border-[var(--ink)]/25 p-4">
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
