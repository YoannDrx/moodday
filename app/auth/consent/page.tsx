import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { getRequiredVerifiedUser } from "@/lib/auth/auth-user";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  await getRequiredVerifiedUser();
  const { locale } = await getI18n();
  const isEnglish = locale === "en";

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="items-center text-center">
        <MooddayLogo size="lg" href={undefined} className="mb-3" />
        <CardTitle>
          {isEnglish ? "Before continuing" : "Avant de continuer"}
        </CardTitle>
        <CardDescription>
          {isEnglish
            ? "Moodday is launching in France for adults. Please confirm the current legal terms."
            : "Moodday est lancé en France pour les personnes majeures. Confirmez les textes légaux en vigueur."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConsentForm />
      </CardContent>
    </Card>
  );
}
