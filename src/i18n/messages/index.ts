import type { Locale } from "../config";
import en from "./en";
import fr from "./fr";

export type Messages = typeof en;

export const messagesByLocale: Record<Locale, Messages> = {
  en,
  fr,
};

export const getMessages = (locale: Locale): Messages => {
  return messagesByLocale[locale];
};
