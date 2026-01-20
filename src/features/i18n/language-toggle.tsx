"use client";

import { Switch } from "@/components/ui/switch";
import { localeCookieName, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { useRouter } from "next/navigation";

const setLocaleCookie = (locale: Locale) => {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  document.documentElement.lang = locale;
};

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const router = useRouter();

  const isEnglish = locale === "en";

  return (
    <div className="flex items-center gap-2">
      <span
        className={
          !isEnglish
            ? "text-foreground text-xs font-semibold"
            : "text-muted-foreground text-xs"
        }
        aria-hidden="true"
      >
        FR
      </span>
      <Switch
        checked={isEnglish}
        onCheckedChange={(checked) => {
          const nextLocale: Locale = checked ? "en" : "fr";
          setLocaleCookie(nextLocale);
          router.refresh();
        }}
        aria-label={t("language.toggleLabel")}
      />
      <span
        className={
          isEnglish
            ? "text-foreground text-xs font-semibold"
            : "text-muted-foreground text-xs"
        }
        aria-hidden="true"
      >
        EN
      </span>
    </div>
  );
}
