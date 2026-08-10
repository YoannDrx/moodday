import { TailwindIndicator } from "@/components/utils/tailwind-indicator";
import { NextTopLoader } from "@/features/page/next-top-loader";
import { ServerToaster } from "@/features/server-sonner/server-toaster";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import type { LayoutParams } from "@/types/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: {
      default: t("meta.title"),
      template: `%s · Moodday`,
    },
    description: t("meta.description"),
    metadataBase: new URL(SiteConfig.prodUrl),
    alternates: { canonical: "/" },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/logo.svg",
      apple: "/icons/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: "Moodday",
      title: t("meta.title"),
      description: t("meta.description"),
      url: "/",
      images: [
        {
          url: "/images/moodday-og.png",
          width: 1200,
          height: 630,
          alt: "Moodday — comprendre ses journées et préparer ses consultations",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.description"),
      images: ["/images/moodday-og.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1E7775",
};

const CaptionFont = Manrope({
  subsets: ["latin"],
  variable: "--font-caption",
});

const GeistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const GeistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout({
  children,
  modal,
}: LayoutParams & { modal?: ReactNode }) {
  const { locale, messages } = await getI18n();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "bg-background h-full font-sans antialiased",
          GeistMono.variable,
          GeistSans.variable,
          CaptionFont.variable,
        )}
      >
        <NuqsAdapter>
          <Providers locale={locale} messages={messages}>
            <NextTopLoader
              delay={100}
              showSpinner={false}
              color="var(--primary)"
            />
            {children}
            {modal}
            <TailwindIndicator />
            <Suspense>
              <ServerToaster />
            </Suspense>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
