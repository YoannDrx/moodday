"use client";

import { Toaster } from "@/components/ui/sonner";
import { DialogManagerRenderer } from "@/features/dialog-manager/dialog-manager-renderer";
import { GlobalDialogLazy } from "@/features/global-dialog/global-dialog-lazy";
import { PwaManager } from "@/features/pwa/pwa-manager";
import { I18nProvider } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

const queryClient = new QueryClient();

type ProvidersProps = PropsWithChildren<{
  locale: Locale;
  messages: Messages;
  nonce?: string;
  pushNotificationsEnabled: boolean;
  vapidPublicKey?: string;
}>;

export const Providers = ({
  children,
  locale,
  messages,
  nonce,
  pushNotificationsEnabled,
  vapidPublicKey,
}: ProvidersProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      nonce={nonce}
    >
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={locale} messages={messages}>
          <Toaster />
          <DialogManagerRenderer />
          <GlobalDialogLazy />
          <PwaManager
            pushNotificationsEnabled={pushNotificationsEnabled}
            vapidPublicKey={vapidPublicKey}
          />
          {children}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
