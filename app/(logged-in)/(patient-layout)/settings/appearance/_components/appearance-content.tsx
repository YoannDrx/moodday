"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Palette, Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { cn } from "@/lib/utils";
import {
  getUserPreferences,
  updateDisplayPreferences,
} from "@/features/preferences/preferences.action";
import { useI18n } from "@/i18n/provider";

export function AppearanceContent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { theme: activeTheme, setTheme } = useTheme();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const result = await getUserPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  useEffect(() => {
    if (preferences?.theme && preferences.theme !== activeTheme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme, activeTheme, setTheme]);

  const selectedTheme = preferences?.theme ?? activeTheme ?? "light";

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

  return (
    <PageLayout
      title={t("settings.appearance.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Palette className="size-5 text-[var(--primary)]" />}
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
    </PageLayout>
  );
}
