"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  getUserPreferences,
  updateDisplayPreferences,
  updateNotificationPreferences,
} from "@/features/preferences/preferences.action";
import { useI18n } from "@/i18n/provider";

export function SettingsForm() {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.display.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("settings.display.chartPeriod")}</Label>
            <Select
              value={String(preferences?.defaultChartPeriod ?? 30)}
              onValueChange={(value) =>
                displayMutation.mutate({ defaultChartPeriod: Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t("settings.display.days7")}</SelectItem>
                <SelectItem value="30">
                  {t("settings.display.days30")}
                </SelectItem>
                <SelectItem value="90">
                  {t("settings.display.days90")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              {t("settings.display.chartPeriodHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t("settings.notifications.enabled")}</Label>
              <p className="text-muted-foreground text-sm">
                {t("settings.notifications.enabledHint")}
              </p>
            </div>
            <Switch
              checked={preferences?.notificationsEnabled ?? true}
              onCheckedChange={(checked) =>
                notificationMutation.mutate({ notificationsEnabled: checked })
              }
            />
          </div>

          {preferences?.notificationsEnabled && (
            <>
              {/* Daily check-in */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.notifications.dailyCheckIn")}</Label>
                  <p className="text-muted-foreground text-sm">
                    {t("settings.notifications.dailyCheckInHint")}
                  </p>
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
                <div className="ml-4 space-y-2">
                  <Label>{t("settings.notifications.checkInTime")}</Label>
                  <Input
                    type="time"
                    value={preferences.dailyCheckInTime}
                    onChange={(e) =>
                      notificationMutation.mutate({
                        dailyCheckInTime: e.target.value,
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}

              {/* Medication reminders */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    {t("settings.notifications.medicationReminders")}
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    {t("settings.notifications.medicationRemindersHint")}
                  </p>
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
                <div className="ml-4 space-y-2">
                  <Label>
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
                    className="w-32"
                  />
                  <p className="text-muted-foreground text-sm">
                    {t("settings.notifications.medicationReminderTimeHint")}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Account link */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" asChild className="w-full">
            <Link href="/settings?tab=profile">{t("nav.account")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
