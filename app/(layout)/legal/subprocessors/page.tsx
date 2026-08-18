import type { Metadata } from "next";
import Link from "next/link";

import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "@/features/landing/section-layout";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return {
    title:
      locale === "fr"
        ? "Sous-traitants et destinataires — Moodday"
        : "Processors and recipients — Moodday",
    description:
      locale === "fr"
        ? "Liste factuelle des services externes utilisés par Moodday."
        : "Factual list of external services used by Moodday.",
  };
}

const processors = [
  {
    name: "Vercel",
    purposeFr:
      "Hébergement de l’application, fonctions, CDN et logs techniques",
    purposeEn: "Application hosting, functions, CDN, and technical logs",
    dataFr:
      "Requêtes, identifiants pseudonymisés et données nécessaires au service",
    dataEn:
      "Requests, pseudonymous identifiers, and data required by the service",
    conditionFr:
      "Permanent — région des fonctions configurée sur fra1, CDN mondial",
    conditionEn: "Always — function region configured as fra1, global CDN",
  },
  {
    name: "Neon",
    purposeFr: "Base de données PostgreSQL",
    purposeEn: "PostgreSQL database",
    dataFr: "Compte et données saisies dans Moodday",
    dataEn: "Account and data entered in Moodday",
    conditionFr:
      "Permanent — région et sauvegardes à confirmer contractuellement",
    conditionEn: "Always — region and backups pending contractual confirmation",
  },
  {
    name: "Resend",
    purposeFr: "E-mails transactionnels et de sécurité",
    purposeEn: "Transactional and security emails",
    dataFr: "Adresse e-mail et contenu du message envoyé",
    dataEn: "Email address and delivered message content",
    conditionFr: "Selon les événements du compte",
    conditionEn: "When account events require email",
  },
  {
    name: "Stripe",
    purposeFr: "Paiement, abonnement, factures et portail client",
    purposeEn: "Payments, subscriptions, invoices, and customer portal",
    dataFr:
      "Identifiant client, facturation et données de paiement collectées par Stripe",
    dataEn:
      "Customer identifier, billing, and payment data collected by Stripe",
    conditionFr:
      "Uniquement pour Moodday Plus lorsque la facturation est ouverte",
    conditionEn: "Only for Moodday Plus when billing is open",
  },
  {
    name: "OpenAI",
    purposeFr: "Bilan IA factuel facultatif",
    purposeEn: "Optional factual AI summary",
    dataFr: "Métriques minimisées ; note uniquement avec accord séparé",
    dataEn: "Minimized metrics; journal note only with separate consent",
    conditionFr: "Plus, opt-in explicite, stockage de réponse API désactivé",
    conditionEn: "Plus, explicit opt-in, API response storage disabled",
  },
  {
    name: "Vercel Blob",
    purposeFr:
      "Fichiers gérés par l’utilisateur et suppressions externes différées",
    purposeEn: "User-managed files and deferred external deletion",
    dataFr:
      "Fichiers explicitement téléversés lorsque cette fonction est active",
    dataEn: "Files explicitly uploaded when this feature is active",
    conditionFr:
      "Fonction conditionnelle ; aucune pièce jointe de santé dans cette version",
    conditionEn: "Conditional feature; no health attachments in this release",
  },
  {
    name: "Google / GitHub",
    purposeFr: "Connexion OAuth choisie par l’utilisateur",
    purposeEn: "OAuth sign-in selected by the user",
    dataFr:
      "Identifiant, e-mail vérifié et profil minimal fourni par le service",
    dataEn:
      "Identifier, verified email, and minimal profile supplied by the service",
    conditionFr: "Uniquement si l’utilisateur choisit ce moyen de connexion",
    conditionEn: "Only when the user selects that sign-in method",
  },
] as const;

export default async function SubprocessorsPage() {
  const { locale } = await getI18n();
  const fr = locale === "fr";

  return (
    <SectionLayout size="lg">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Typography variant="h1" className="text-4xl font-bold">
            {fr
              ? "Sous-traitants et destinataires"
              : "Processors and recipients"}
          </Typography>
          <Typography variant="p" className="text-muted-foreground mt-4">
            {fr
              ? "Cette liste décrit les services externes réellement prévus par Moodday. Une mention « à confirmer » signifie que la preuve contractuelle reste une porte de lancement, pas qu’une garantie est acquise."
              : "This list describes the external services actually planned by Moodday. “Pending confirmation” means contractual evidence remains a launch gate, not that a guarantee has been established."}
          </Typography>
          <Typography
            variant="p"
            className="text-muted-foreground mt-2 text-sm"
          >
            {fr
              ? "Dernière mise à jour : 13 août 2026"
              : "Last updated: 13 August 2026"}
          </Typography>
        </div>

        <div
          className="overflow-x-auto rounded-2xl border"
          role="region"
          aria-label={
            fr
              ? "Tableau des sous-traitants et destinataires"
              : "Processors and recipients table"
          }
          tabIndex={0}
        >
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/60">
              <tr>
                {[
                  fr ? "Service" : "Service",
                  fr ? "Finalité" : "Purpose",
                  fr ? "Données" : "Data",
                  fr ? "Condition" : "Condition",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processors.map((processor) => (
                <tr key={processor.name} className="border-t align-top">
                  <th className="px-4 py-4 font-semibold">{processor.name}</th>
                  <td className="px-4 py-4">
                    {fr ? processor.purposeFr : processor.purposeEn}
                  </td>
                  <td className="px-4 py-4">
                    {fr ? processor.dataFr : processor.dataEn}
                  </td>
                  <td className="px-4 py-4">
                    {fr ? processor.conditionFr : processor.conditionEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border p-6">
          <Typography variant="h2" className="text-xl font-bold">
            {fr ? "Historique des changements" : "Change history"}
          </Typography>
          <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm">
            <li>
              {fr
                ? "13 août 2026 — publication initiale ; OpenAI indiqué comme facultatif et PostHog explicitement absent de cette version."
                : "13 August 2026 — initial publication; OpenAI marked optional and PostHog explicitly absent from this release."}
            </li>
          </ul>
        </div>

        <p className="text-muted-foreground text-sm">
          {fr
            ? "Pour exercer vos droits ou poser une question : hello@moodday.app."
            : "For rights requests or questions: hello@moodday.app."}{" "}
          <Link href="/legal/privacy" className="text-primary underline">
            {fr ? "Politique de confidentialité" : "Privacy policy"}
          </Link>
        </p>
      </div>
    </SectionLayout>
  );
}
