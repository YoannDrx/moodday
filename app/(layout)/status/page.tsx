import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

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
      "Moodday n’est pas un service d’urgence. En France : 3114 ; danger immédiat : 15 ou 112.",
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
      "Moodday is not an emergency service. In France: 3114; for immediate danger, call 15 or 112.",
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
  const [{ locale }, status] = await Promise.all([getI18n(), getPublicStatus()]);
  const text = copy[locale === "en" ? "en" : "fr"];
  const healthy = status === "ok";

  return (
    <main className="mx-auto min-h-[60vh] w-full max-w-3xl px-5 py-20">
      <h1 className="text-3xl font-semibold">{text.title}</h1>
      <p className="text-muted-foreground mt-3">{text.description}</p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{healthy ? text.available : text.degraded}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {healthy ? text.availableDescription : text.degradedDescription}
          </p>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm">{text.emergency}</p>
    </main>
  );
}
