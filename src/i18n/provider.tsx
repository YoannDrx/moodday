"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Messages } from "./messages";
import { createTranslator, getMessage } from "./translator";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, values?: Record<string, string | number>) => string;
  tm: <T>(key: string) => T | undefined;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: PropsWithChildren<{ locale: Locale; messages: Messages }>) {
  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      messages,
      t: createTranslator(messages),
      tm: <T,>(key: string) => getMessage<T>(messages, key),
    };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
