import { MooddayLogo } from "@/components/brand/moodday-logo";
import Link from "next/link";

const columns = [
  {
    title: "Moodday",
    links: [
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Pour les partenaires", href: "/#partenaires" },
      { label: "Tarifs", href: "/#tarifs" },
      { label: "À propos", href: "/about" },
    ],
  },
  {
    title: "Comprendre",
    links: [
      {
        label: "Le syndrome prémenstruel",
        href: "/posts/syndrome-premenstruel",
      },
      {
        label: "TDPM : quand c'est plus que le SPM",
        href: "/posts/tdpm-trouble-dysphorique-premenstruel",
      },
      {
        label: "Aider sa partenaire pendant le SPM",
        href: "/posts/aider-sa-partenaire-pendant-le-spm",
      },
      { label: "Tous les guides", href: "/posts" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "Conditions", href: "/legal/terms" },
      { label: "Sous-traitants", href: "/legal/subprocessors" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Aide et contact", href: "/help" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-paper border-t-2 border-[var(--ink)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <MooddayLogo />
          <p className="text-muted-foreground max-w-xs text-sm">
            Le SPM, ça se traverse à deux. Journal de bien-être, sans diagnostic
            ni conseil médical. Fait en France, hébergé en Europe.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="font-display text-sm font-extrabold tracking-wide uppercase">
              {column.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground border-t border-[var(--ink)]/20 px-4 py-4 text-center text-xs">
        © {new Date().getFullYear()} Moodday · Aucune donnée vendue, aucune
        publicité, jamais.
      </p>
    </footer>
  );
}
