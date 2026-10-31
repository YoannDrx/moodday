import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";

const copy = {
  fr: {
    metadataTitle: "État du service | Moodday",
    metadataDescription: "État public minimal du service Moodday.",
    title: "État du service",
    description:
      "Cette page publie un état minimal et ne révèle aucune information d’infrastructure ou donnée utilisateur.",
    available: "Service disponible",
    degraded: "Service dégradé",
    availableDescription: "Les contrôles essentiels répondent normalement.",
    degradedDescription:
      "Une dégradation est en cours d’analyse. Réessayez plus tard.",
    emergency:
      "Moodday n’est pas un service d’urgence. En France : 3114 (prévention du suicide) ; danger immédiat : 15 ou 112 ; SMS : 114.",
    emergencyLink: "Ressources d’aide",
  },
  en: {
    metadataTitle: "Service status | Moodday",
    metadataDescription: "Minimal public status for the Moodday service.",
    title: "Service status",
    description:
      "This page publishes a minimal status and reveals no infrastructure detail or user data.",
    available: "Service available",
    degraded: "Service degraded",
    availableDescription: "Essential checks are responding normally.",
    degradedDescription:
      "A degradation is being investigated. Please try again later.",
    emergency:
      "Moodday is not an emergency service. In France: 3114 (suicide prevention); immediate danger: 15 or 112; text: 114.",
    emergencyLink: "Help resources",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const text = copy[locale === "en" ? "en" : "fr"];

  return {
    title: text.metadataTitle,
    description: text.metadataDescription,
  };
}

const getPublicStatus = unstable_cache(
  async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return "ok" as const;
    } catch {
      return "degraded" as const;
    }
  },
  ["public-service-status"],
  { revalidate: 30 },
);

export default async function StatusPage() {
  const [{ locale }, status] = await Promise.all([
    getI18n(),
    getPublicStatus(),
  ]);
  const text = copy[locale === "en" ? "en" : "fr"];
  const healthy = status === "ok";

  const StatusIcon = healthy ? CircleCheck : CircleAlert;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-8 px-4 py-14 sm:px-6 lg:py-20">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          {text.title}
        </h1>
        <p className="text-muted-foreground text-lg">{text.description}</p>
      </header>
      <section
        className={cn(
          "sticker flex items-start gap-4 p-6",
          healthy ? "bg-mint-soft" : "bg-apricot-soft",
        )}
      >
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)]",
            healthy ? "bg-mint" : "bg-apricot",
          )}
        >
          <StatusIcon className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-extrabold">
            {healthy ? text.available : text.degraded}
          </h2>
          <p>
            {healthy ? text.availableDescription : text.degradedDescription}
          </p>
        </div>
      </section>
      <p className="text-sm">
        {text.emergency}{" "}
        <Link href="/crisis" className="font-bold underline">
          {text.emergencyLink}
        </Link>
      </p>
    </div>
  );
}
