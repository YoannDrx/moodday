import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const { locale } = await getI18n();
  const isEnglish = locale === "en";

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl text-center">
        <div className="mb-8 flex justify-center">
          <MooddayLogo />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {isEnglish ? "Maintenance in progress" : "Maintenance en cours"}
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          {isEnglish
            ? "Moodday is temporarily unavailable while we perform a planned update. Your existing data remains stored and no action is required."
            : "Moodday est temporairement indisponible pendant une mise à jour planifiée. Vos données existantes restent conservées et aucune action n’est nécessaire."}
        </p>
        <p className="text-muted-foreground mt-3 text-sm">
          {isEnglish
            ? "Moodday is not an emergency service. In France, call 3114, 15 or 112 if needed."
            : "Moodday n’est pas un service d’urgence. En France, appelez le 3114, le 15 ou le 112 si nécessaire."}
        </p>
      </section>
    </main>
  );
}
