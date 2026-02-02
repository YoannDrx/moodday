"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { PageLayout } from "@/components/nowts/page-layout";
import { getUserPreferences } from "@/features/preferences/preferences.action";
import { updateProfile } from "@/features/profile/profile.action";
import { useI18n } from "@/i18n/provider";
import { useSession } from "@/lib/auth-client";

export function ProfileContent() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const user = session?.user;

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

  const timezoneOptions = ["Europe/Paris", "Europe/London", "America/New_York"];
  const timezoneLabels: Record<string, string> = {
    "Europe/Paris": t("settings.timezones.paris"),
    "Europe/London": t("settings.timezones.london"),
    "America/New_York": t("settings.timezones.newYork"),
  };
  const resolvedTimezoneOptions = timezoneOptions.includes(timezone)
    ? timezoneOptions
    : [timezone, ...timezoneOptions];

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
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <PageLayout
      title={t("settings.profile.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      {isLoading ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<User className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.profile.title")}
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label className="text-gray-600">
                {t("settings.profile.fullName")}
              </Label>
              <Input
                value={
                  profileName.length > 0 ? profileName : (user?.name ?? "")
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
                    profileName.length > 0 ? profileName : (user?.name ?? ""),
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
    </PageLayout>
  );
}
