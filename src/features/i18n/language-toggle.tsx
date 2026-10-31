"use client";

import { Button } from "@/components/ui/button";
import { localeCookieName, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { updateDisplayPreferences } from "@/features/preferences/preferences.action";

const setLocaleCookie = (locale: Locale) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  document.documentElement.lang = locale;
};

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const router = useRouter();

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocaleCookie(nextLocale);
      void updateDisplayPreferences({ locale: nextLocale });
      router.refresh();
    }
  };

  return (
    <div
      className="bg-muted flex items-center rounded-lg p-0.5"
      role="group"
      aria-label={t("language.toggleLabel")}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleChange("fr")}
        className={cn(
          "h-7 px-2.5 text-xs font-medium",
          locale === "fr"
            ? "bg-card text-foreground shadow-sm dark:text-white"
            : "text-muted-foreground hover:text-foreground dark:hover:text-white",
        )}
      >
        FR
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleChange("en")}
        className={cn(
          "h-7 px-2.5 text-xs font-medium",
          locale === "en"
            ? "bg-card text-foreground shadow-sm dark:text-white"
            : "text-muted-foreground hover:text-foreground dark:hover:text-white",
        )}
      >
        EN
      </Button>
    </div>
  );
}
