import { format } from "date-fns";
import { enUS, fr, type Locale as DateLocale } from "date-fns/locale";
import { defaultLocale, type Locale as AppLocale } from "@/i18n/config";

const dateLocales: Record<AppLocale, DateLocale> = {
  en: enUS,
  fr,
};

export const formatDate = (date: Date, locale: AppLocale = defaultLocale) => {
  return format(date, "MMMM d, yyyy", {
    locale: dateLocales[locale],
  });
};
