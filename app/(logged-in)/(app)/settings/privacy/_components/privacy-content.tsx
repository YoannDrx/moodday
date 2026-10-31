import { DeleteAccountForm } from "@app/(logged-in)/(account-layout)/account/danger/delete-account-form";
import { ChevronRight, Download, ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PrivacyContent({
  emailSettings,
}: {
  emailSettings?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Tes données</h1>
        <p className="text-muted-foreground mt-1 font-semibold">
          Elles sont à toi. Tu les emportes ou tu les effaces quand tu veux.
        </p>
      </header>

      <section className="sticker flex flex-col gap-3 p-6">
        <h2 className="flex items-center gap-2 text-xl font-extrabold">
          <Lock className="size-5" aria-hidden /> Ce qui reste privé, toujours
        </h2>
        <ul className="list-disc pl-5">
          <li>Ta note du jour n'est jamais partagée, avec personne.</li>
          <li>
            Ton ou ta partenaire ne voit que ce que ton niveau de partage
            autorise.
          </li>
          <li>
            Aucune donnée de santé dans les e-mails, les outils d'analyse ou les
            adresses web.
          </li>
          <li>Chaque consultation de ton duo est journalisée, sans contenu.</li>
        </ul>
      </section>

      <a
        href="/api/export/json"
        download
        className="sticker sticker-hover flex items-center justify-between gap-4 p-5"
      >
        <span className="flex items-center gap-4">
          <span className="bg-mint flex size-12 items-center justify-center rounded-2xl border-2 border-[var(--ink)]">
            <Download className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block font-bold">Exporter toutes mes données</span>
            <span className="text-muted-foreground text-sm">
              Un fichier JSON lisible : cycle, points, gestes, consentements.
            </span>
          </span>
        </span>
        <ChevronRight className="size-5" aria-hidden />
      </a>

      {emailSettings}

      <DeleteAccountForm />

      <Link
        href="/legal/privacy"
        className="sticker sticker-hover flex items-center justify-between gap-4 p-5"
      >
        <span className="flex items-center gap-4">
          <ExternalLink className="size-6" aria-hidden />
          <span className="font-bold">
            Lire la politique de confidentialité
          </span>
        </span>
        <ChevronRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
