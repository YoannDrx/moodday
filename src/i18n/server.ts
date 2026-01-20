import "server-only";

import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  localeCookieName,
  locales,
  type Locale,
} from "./config";
import { getMessages } from "./messages";
import { createTranslator, getMessage } from "./translator";

const normalizeLocale = (value: string) => value.toLowerCase().split("-")[0];

export const isLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale);
};

const getLocaleFromHeader = async () => {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (!acceptLanguage) {
    return undefined;
  }

  const localesFromHeader = acceptLanguage
    .split(",")
    .map((entry) => entry.trim().split(";")[0])
    .map(normalizeLocale);

  return localesFromHeader.find(isLocale);
};

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return (await getLocaleFromHeader()) ?? defaultLocale;
};

export const getI18n = async () => {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = createTranslator(messages);
  const tm = <T>(key: string): T | undefined => getMessage<T>(messages, key);

  return {
    locale,
    messages,
    t,
    tm,
  };
};
