"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

export function LanguageContent() {
  const { locale, t } = useI18n();
  const router = useRouter();

  const setLocaleCookie = (newLocale: "fr" | "en") => {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${maxAge}; samesite=lax`;
    document.documentElement.lang = newLocale;
    router.refresh();
  };

  return (
    <PageLayout
      title={t("settings.tabs.language")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      <GlassCard padding="lg" variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle
            icon={<Globe className="size-5 text-[var(--primary)]" />}
          >
            {t("settings.tabs.language")}
          </GlassCardTitle>
        </GlassCardHeader>

        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setLocaleCookie("fr")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all",
                locale === "fr"
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <span className="text-3xl">🇫🇷</span>
              <span className="font-medium text-gray-800">
                {t("language.fr")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLocaleCookie("en")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all",
                locale === "en"
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <span className="text-3xl">🇬🇧</span>
              <span className="font-medium text-gray-800">
                {t("language.en")}
              </span>
            </button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </PageLayout>
  );
}
