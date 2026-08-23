import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Download,
  HeartHandshake,
  ShieldCheck,
  Trash2,
} from "lucide-react";

const copy = {
  fr: {
    metadataTitle: "Tes choix de confidentialité | Moodday",
    metadataDescription:
      "Comprendre et gérer les choix de confidentialité de ton compte Moodday.",
    eyebrow: "Tes données, tes choix",
    title: "Garde le contrôle de tes données",
    introduction:
      "Cette page résume les réglages disponibles dans Moodday. Les connexions et partages sont facultatifs : tu peux les refuser, les mettre en pause ou les révoquer sans perdre l’accès au reste de l’application.",
    settingsCta: "Ouvrir mes réglages de confidentialité",
    signInCta: "Me connecter",
    cards: [
      {
        icon: ShieldCheck,
        title: "Consentements et connexions",
        description:
          "Dans Paramètres > Confidentialité, tu peux activer ou désactiver séparément les fonctions facultatives. Les autorisations Santé et calendrier se gèrent aussi dans les réglages de ton appareil.",
      },
      {
        icon: Download,
        title: "Accès et export",
        description:
          "Tu peux demander un export de tes données depuis les réglages. Une authentification récente est exigée avant de préparer le téléchargement.",
      },
      {
        icon: CalendarDays,
        title: "Santé et calendrier",
        description:
          "Tu choisis les sources connectées. Tu peux interrompre une connexion et supprimer les agrégats Santé importés pour une période ou définitivement.",
      },
      {
        icon: HeartHandshake,
        title: "Partage avec un proche",
        description:
          "Chaque contrat indique ce que la personne peut voir, sa durée et ses permissions. Tu peux révoquer l’accès ; la révocation s’applique dès la requête suivante.",
      },
      {
        icon: Trash2,
        title: "Suppression du compte",
        description:
          "Depuis les réglages de confidentialité, choisis Supprimer le compte puis confirme le lien envoyé par e-mail. Tu peux aussi contacter notre équipe confidentialité.",
      },
    ],
    policyPrefix:
      "Pour le détail des finalités, bases légales et durées, consulte notre",
    policyLink: "politique de confidentialité",
    contactPrefix: "Pour exercer un droit ou demander de l’aide, écris à",
    safety:
      "N’envoie pas de note de journal, de diagnostic ou d’autre donnée de santé dans ton e-mail.",
  },
  en: {
    metadataTitle: "Your privacy choices | Moodday",
    metadataDescription:
      "Understand and manage the privacy choices available for your Moodday account.",
    eyebrow: "Your data, your choices",
    title: "Stay in control of your data",
    introduction:
      "This page summarizes the settings available in Moodday. Connections and sharing are optional: you can decline, pause or revoke them without losing access to the rest of the app.",
    settingsCta: "Open my privacy settings",
    signInCta: "Sign in",
    cards: [
      {
        icon: ShieldCheck,
        title: "Consent and connections",
        description:
          "In Settings > Privacy, you can enable or disable optional features separately. Health and calendar permissions can also be managed in your device settings.",
      },
      {
        icon: Download,
        title: "Access and export",
        description:
          "You can request an export of your data from Settings. Recent authentication is required before the download is prepared.",
      },
      {
        icon: CalendarDays,
        title: "Health and calendar",
        description:
          "You choose which sources are connected. You can stop a connection and delete imported Health aggregates for a period or permanently.",
      },
      {
        icon: HeartHandshake,
        title: "Sharing with someone you trust",
        description:
          "Each sharing contract states what the person can see, its duration and permissions. You can revoke access; revocation applies from the next request.",
      },
      {
        icon: Trash2,
        title: "Account deletion",
        description:
          "From Privacy settings, choose Delete account and confirm the link sent by email. You can also contact our privacy team.",
      },
    ],
    policyPrefix:
      "For details about purposes, legal bases and retention, read our",
    policyLink: "privacy policy",
    contactPrefix: "To exercise a right or ask for help, email",
    safety:
      "Do not include journal notes, diagnoses or other health data in your email.",
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

export default async function PrivacyChoicesPage() {
  const { locale } = await getI18n();
  const text = copy[locale === "en" ? "en" : "fr"];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-5 py-20">
      <header className="max-w-3xl">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">
          {text.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          {text.title}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          {text.introduction}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2.5 text-sm font-medium"
            href="/settings/privacy"
          >
            {text.settingsCta}
          </Link>
          <Link
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2.5 text-sm font-medium"
            href="/auth/signin"
          >
            {text.signInCta}
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {text.cards.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="bg-primary/10 text-primary rounded-xl p-2.5">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-muted/50 space-y-3 rounded-2xl border p-6">
        <p>
          {text.policyPrefix}{" "}
          <Link className="font-medium underline" href="/legal/privacy">
            {text.policyLink}
          </Link>
          .
        </p>
        <p>
          {text.contactPrefix}{" "}
          <a
            className="font-medium underline"
            href="mailto:privacy@moodday.app"
          >
            privacy@moodday.app
          </a>
          .
        </p>
        <p className="text-muted-foreground text-sm">{text.safety}</p>
      </section>
    </main>
  );
}
