import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { Phone, MessageCircle, AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/nowts/layout-components";
import { CrisisCardList } from "@/components/nowts/crisis-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { crisisResources } from "@/lib/design-tokens";

export const generateMetadata = combineWithParentMetadata(async () => {
  return {
    title: "Ressources de crise",
    description: "Numéros et ressources d'aide en cas de détresse",
  };
});

export default async function CrisisPage() {
  const { locale } = await getI18n();
  const lang = locale === "fr" ? "fr" : "en";

  // Map resources with localized descriptions
  const localizedResources = crisisResources.map((r) => ({
    ...r,
    description: r.description?.[lang],
  }));

  const hotlines = localizedResources.filter((r) => r.category === "hotline");
  const emergency = localizedResources.filter(
    (r) => r.category === "emergency",
  );
  const support = localizedResources.filter((r) => r.category === "support");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Ressources de crise"
        description="Numéros et ressources d'aide disponibles 24h/24"
      />

      {/* Emergency Banner */}
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="size-4" />
        <AlertTitle>En cas d'urgence vitale</AlertTitle>
        <AlertDescription>
          Appelle immédiatement le <strong>15 (SAMU)</strong> ou le{" "}
          <strong>112 (numéro d'urgence européen)</strong>
        </AlertDescription>
      </Alert>

      {/* Main Hotlines */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5 text-red-500" />
              Lignes d'écoute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrisisCardList resources={hotlines} />
          </CardContent>
        </Card>
      </section>

      {/* Emergency Services */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              Urgences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrisisCardList resources={emergency} />
          </CardContent>
        </Card>
      </section>

      {/* Support Organizations */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-green-500" />
              Associations de soutien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrisisCardList resources={support} />
          </CardContent>
        </Card>
      </section>

      {/* Self-Care Reminder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="mb-2 font-semibold">Rappel bienveillant</h3>
          <p className="text-muted-foreground text-sm">
            Demander de l'aide est un signe de force, pas de faiblesse. Tu
            mérites d'être soutenu(e) dans les moments difficiles. Ces
            ressources sont là pour toi, n'hésite pas à les utiliser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
