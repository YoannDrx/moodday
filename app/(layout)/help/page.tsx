import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";

const copy = {
  fr: {
    metadataTitle: "Aide | Moodday",
    metadataDescription:
      "Aide pour exporter, supprimer et sécuriser un compte Moodday.",
    title: "Aide Moodday",
    introduction:
      "Guides essentiels pour garder le contrôle de votre compte et de vos données.",
    exportTitle: "Exporter mes données",
    exportDescription:
      "Ouvrez Paramètres puis Confidentialité. Une authentification récente est exigée avant de générer l’export complet. Ne partagez le téléchargement qu’après avoir vérifié son destinataire.",
    deletionTitle: "Supprimer mon compte",
    deletionDescription:
      "Depuis Confidentialité, choisissez Supprimer le compte puis confirmez le lien reçu par e-mail. Les données actives sont supprimées et les ressources externes sont placées dans une file de suppression contrôlée.",
    devicesTitle: "Compte et appareils",
    devicesDescription:
      "La page Sécurité permet de révoquer des sessions, d’activer une passkey ou une application d’authentification et de régénérer les codes de récupération.",
    supportTitle: "Support",
    supportPrefix:
      "Les demandes sont traitées les jours ouvrés. N’incluez pas de notes de journal ou d’informations médicales dans votre message. Consultez aussi la",
    statusLink: "page d’état",
    supportEmailPrefix: "ou écrivez à",
    emergency:
      "Moodday n’est pas un service d’urgence. En France : 3114 ; danger immédiat : 15 ou 112.",
  },
  en: {
    metadataTitle: "Help | Moodday",
    metadataDescription:
      "Help for exporting, deleting, and securing a Moodday account.",
    title: "Moodday help",
    introduction:
      "Essential guides for keeping control of your account and data.",
    exportTitle: "Export my data",
    exportDescription:
      "Open Settings, then Privacy. Recent authentication is required before generating the complete export. Share the download only after checking its intended recipient.",
    deletionTitle: "Delete my account",
    deletionDescription:
      "From Privacy, choose Delete account and confirm the link received by email. Active data is deleted and external resources enter a controlled deletion queue.",
    devicesTitle: "Account and devices",
    devicesDescription:
      "The Security page lets you revoke sessions, enable a passkey or authenticator app, and regenerate recovery codes.",
    supportTitle: "Support",
    supportPrefix:
      "Requests are handled on business days. Do not include journal notes or medical information in your message. You can also review the",
    statusLink: "service status page",
    supportEmailPrefix: "or write to",
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

export default async function HelpPage() {
  const { locale } = await getI18n();
  const text = copy[locale === "en" ? "en" : "fr"];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-5 py-20">
      <div>
        <h1 className="text-3xl font-semibold">{text.title}</h1>
        <p className="text-muted-foreground mt-3">{text.introduction}</p>
      </div>
      <section>
        <h2 className="text-xl font-semibold">{text.exportTitle}</h2>
        <p className="text-muted-foreground mt-2">{text.exportDescription}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{text.deletionTitle}</h2>
        <p className="text-muted-foreground mt-2">{text.deletionDescription}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{text.devicesTitle}</h2>
        <p className="text-muted-foreground mt-2">{text.devicesDescription}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{text.supportTitle}</h2>
        <p className="text-muted-foreground mt-2">
          {text.supportPrefix}{" "}
          <Link className="underline" href="/status">
            {text.statusLink}
          </Link>{" "}
          {text.supportEmailPrefix}{" "}
          <a className="underline" href={`mailto:${SiteConfig.company.email}`}>
            {SiteConfig.company.email}
          </a>
          .
        </p>
      </section>
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        {text.emergency}
      </p>
    </main>
  );
}
