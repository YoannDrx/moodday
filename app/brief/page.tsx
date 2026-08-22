import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { SharedBriefViewer } from "./shared-brief-viewer";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const english = locale === "en";
  return {
    title: english ? "Shared brief" : "Brief partagé",
    description: english
      ? "An appointment brief shared temporarily with Mood Day."
      : "Un brief de consultation partagé temporairement avec Mood Day.",
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default async function SharedBriefPage() {
  const { locale } = await getI18n();
  return <SharedBriefViewer locale={locale === "en" ? "en" : "fr"} />;
}
