export const supportedLocales = ["fr", "en"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "fr";

export const commonMessages = {
  fr: {
    navigation: {
      today: "Aujourd’hui",
      landmarks: "Repères",
      care: "Soin",
      circle: "Cercle",
    },
    sessionLoading: "Chargement de la session",
  },
  en: {
    navigation: {
      today: "Today",
      landmarks: "Patterns",
      care: "Care",
      circle: "Circle",
    },
    sessionLoading: "Loading your session",
  },
} as const;

export const getCommonMessages = (locale: SupportedLocale) =>
  commonMessages[locale];

export const createDateTimeFormat = (
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions,
) => new Intl.DateTimeFormat(locale, options);

export const createNumberFormat = (
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(locale, options);
