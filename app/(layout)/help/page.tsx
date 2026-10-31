import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  Eye,
  GraduationCap,
  HardDriveDownload,
  KeyRound,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type HelpSection = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
};

const copy = {
  fr: {
    metadataTitle: "Aide | Moodday",
    metadataDescription:
      "Aide Moodday : faire ton point, inviter ton ou ta partenaire, régler le partage, suivre le Programme Allié, gérer tes données.",
    kicker: "Aide",
    title: "Aide Moodday",
    introduction:
      "Les réponses aux questions les plus fréquentes, en version courte. Si tu bloques, écris-nous.",
    sections: [
      {
        id: "point",
        icon: Sparkles,
        title: "Faire mon point",
        description:
          "Depuis Aujourd’hui, choisis un état (Ça va, Fragile, Difficile, Très dur), ajoute des symptômes si tu veux et jusqu’à deux besoins. Ta note reste privée : elle n’est jamais partagée.",
        href: "/today",
        linkLabel: "Aller à Aujourd’hui",
      },
      {
        id: "invite",
        icon: UserPlus,
        title: "Inviter mon ou ma partenaire",
        description:
          "Dans Duo, crée un code d’invitation et transmets-le par le canal de ton choix. Le partage commence quand l’autre compte l’accepte. Chacun peut quitter le duo à tout moment.",
        href: "/duo",
        linkLabel: "Ouvrir Duo",
      },
      {
        id: "sharing",
        icon: Eye,
        title: "Choisir ce que voit mon duo",
        description:
          "C’est toi qui règles le niveau de partage, avec un aperçu exact de ce que voit l’autre. Tu peux mettre en pause ou arrêter quand tu veux, sans te justifier. Ton ou ta partenaire ne saisit jamais rien sur toi.",
        href: "/duo",
        linkLabel: "Régler le partage",
      },
      {
        id: "ally",
        icon: GraduationCap,
        title: "Le Programme Allié",
        description:
          "Sept leçons de deux minutes pour celui ou celle qui soutient : ce qui se passe pendant le cycle, les phrases à éviter, comment aider sans tout prendre en charge. Gratuit, et sans aucune donnée sur elle.",
        href: "/ally",
        linkLabel: "Commencer le programme",
      },
      {
        id: "data",
        icon: HardDriveDownload,
        title: "Exporter ou supprimer mes données",
        description:
          "Dans Réglages, puis Confidentialité, tu peux télécharger une copie de tes données ou supprimer ton compte. Une connexion récente est demandée. La suppression arrête immédiatement le partage avec ton duo.",
        href: "/settings/privacy",
        linkLabel: "Mes données",
      },
      {
        id: "security",
        icon: KeyRound,
        title: "Compte et appareils",
        description:
          "La page Sécurité permet de fermer des sessions, d’activer une passkey ou une application d’authentification et de régénérer tes codes de récupération.",
        href: "/settings/security",
        linkLabel: "Sécurité du compte",
      },
    ] satisfies HelpSection[],
    supportTitle: "Toujours bloqué·e ?",
    supportPrefix:
      "On répond les jours ouvrés. N’inclus pas le contenu de tes points ni d’information médicale dans ton message. Tu peux aussi consulter la",
    statusLink: "page d’état du service",
    supportEmailPrefix: "ou écrire à",
    emergencyTitle: "Besoin d’aide maintenant ?",
    emergency:
      "Moodday n’est pas un service d’urgence. En France : 3114 (prévention du suicide, 24 h/24) ; danger immédiat : 15 ou 112 ; SMS : 114.",
    emergencyLink: "Toutes les ressources d’aide",
  },
  en: {
    metadataTitle: "Help | Moodday",
    metadataDescription:
      "Moodday help: daily check-in, inviting your partner, sharing settings, the Ally Program and your data.",
    kicker: "Help",
    title: "Moodday help",
    introduction:
      "Short answers to the most common questions. If you get stuck, write to us.",
    sections: [
      {
        id: "point",
        icon: Sparkles,
        title: "Doing my check-in",
        description:
          "From Today, pick a state (Fine, Fragile, Hard, Very hard), add symptoms if you want and up to two needs. Your note stays private: it is never shared.",
        href: "/today",
        linkLabel: "Go to Today",
      },
      {
        id: "invite",
        icon: UserPlus,
        title: "Inviting my partner",
        description:
          "In Duo, create an invitation code and share it however you like. Sharing starts once the other account accepts. Either of you can leave the duo at any time.",
        href: "/duo",
        linkLabel: "Open Duo",
      },
      {
        id: "sharing",
        icon: Eye,
        title: "Choosing what my duo sees",
        description:
          "You set the sharing level, with an exact preview of what the other person sees. Pause or stop whenever you want, no explanation needed. Your partner never enters anything about you.",
        href: "/duo",
        linkLabel: "Sharing settings",
      },
      {
        id: "ally",
        icon: GraduationCap,
        title: "The Ally Program",
        description:
          "Seven two-minute lessons for the supporting partner: what happens during the cycle, phrases to avoid, how to help without taking over. Free, and without any data about her.",
        href: "/ally",
        linkLabel: "Start the program",
      },
      {
        id: "data",
        icon: HardDriveDownload,
        title: "Exporting or deleting my data",
        description:
          "In Settings, then Privacy, you can download a copy of your data or delete your account. A recent sign-in is required. Deletion immediately stops sharing with your duo.",
        href: "/settings/privacy",
        linkLabel: "My data",
      },
      {
        id: "security",
        icon: KeyRound,
        title: "Account and devices",
        description:
          "The Security page lets you close sessions, enable a passkey or authenticator app, and regenerate recovery codes.",
        href: "/settings/security",
        linkLabel: "Account security",
      },
    ] satisfies HelpSection[],
    supportTitle: "Still stuck?",
    supportPrefix:
      "We reply on business days. Do not include the content of your check-ins or medical information in your message. You can also review the",
    statusLink: "service status page",
    supportEmailPrefix: "or write to",
    emergencyTitle: "Need help now?",
    emergency:
      "Moodday is not an emergency service. In France: 3114 (suicide prevention, 24/7); immediate danger: 15 or 112; text: 114.",
    emergencyLink: "All help resources",
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

const tones = ["bg-honey", "bg-mint", "bg-apricot-soft", "bg-plum-soft"];

export default async function HelpPage() {
  const { locale } = await getI18n();
  const text = copy[locale === "en" ? "en" : "fr"];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-14 sm:px-6 lg:py-20">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="bg-mint inline-flex w-fit items-center rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold tracking-wide uppercase">
          {text.kicker}
        </p>
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          {text.title}
        </h1>
        <p className="text-muted-foreground text-lg">{text.introduction}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {text.sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              className="sticker flex scroll-mt-24 flex-col gap-3 p-6"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-2 border-[var(--ink)]",
                  tones[index % tones.length],
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="font-display text-xl font-extrabold">
                {section.title}
              </h2>
              <p className="text-muted-foreground">{section.description}</p>
              {section.href && (
                <Link
                  href={section.href}
                  className="mt-auto w-fit font-bold underline decoration-2 underline-offset-4 hover:decoration-[var(--honey)]"
                >
                  {section.linkLabel}
                </Link>
              )}
            </section>
          );
        })}
      </div>

      <section className="sticker bg-honey-soft flex flex-col gap-3 p-6">
        <h2 className="font-display text-xl font-extrabold">
          {text.supportTitle}
        </h2>
        <p>
          {text.supportPrefix}{" "}
          <Link className="font-bold underline" href="/status">
            {text.statusLink}
          </Link>{" "}
          {text.supportEmailPrefix}{" "}
          <a
            className="font-bold underline"
            href={`mailto:${SiteConfig.company.email}`}
          >
            {SiteConfig.company.email}
          </a>
          .
        </p>
      </section>

      <aside className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--crisis)] p-5">
        <h2 className="text-crisis font-bold">{text.emergencyTitle}</h2>
        <p className="text-sm">{text.emergency}</p>
        <Link href="/crisis" className="text-sm font-bold underline">
          {text.emergencyLink}
        </Link>
      </aside>
    </div>
  );
}
