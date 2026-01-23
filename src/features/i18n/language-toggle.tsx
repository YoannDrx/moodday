"use client";

import { Button } from "@/components/ui/button";
import { localeCookieName, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
      router.refresh();
    }
  };

  return (
    <div
      className="flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800"
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
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
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
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        )}
      >
        EN
      </Button>
    </div>
  );
}
