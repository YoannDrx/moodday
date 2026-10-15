import Link from "next/link";

type CrisisNumber = { number: string; href: string; label: string };

const copy = {
  fr: {
    aria: "Numéros d’urgence",
    intro: "Besoin d’aide maintenant ?",
    numbers: [
      { number: "3114", href: "tel:3114", label: "prévention du suicide" },
      { number: "15", href: "tel:15", label: "SAMU" },
      { number: "112", href: "tel:112", label: "urgences" },
      { number: "114", href: "sms:114", label: "SMS, sourds et malentendants" },
    ],
    more: "Toutes les ressources",
    disclaimer: "Moodday n’est pas un service d’urgence.",
  },
  en: {
    aria: "Emergency numbers",
    intro: "Need help now?",
    numbers: [
      { number: "3114", href: "tel:3114", label: "suicide prevention" },
      { number: "15", href: "tel:15", label: "medical emergency" },
      { number: "112", href: "tel:112", label: "emergency" },
      {
        number: "114",
        href: "sms:114",
        label: "text, deaf or hard of hearing",
      },
    ],
    more: "All resources",
    disclaimer: "Moodday is not an emergency service.",
  },
} satisfies Record<
  "fr" | "en",
  {
    aria: string;
    intro: string;
    numbers: CrisisNumber[];
    more: string;
    disclaimer: string;
  }
>;

/**
 * French crisis numbers rendered on every page by the root layout, so they
 * stay reachable from public, auth and logged-in screens alike.
 */
export function CrisisNumbersBar({ locale }: { locale: string }) {
  const t = copy[locale === "en" ? "en" : "fr"];

  return (
    <aside
      aria-label={t.aria}
      className="border-border bg-muted/60 text-muted-foreground border-t px-5 py-3 text-xs leading-5 print:hidden"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span className="text-foreground font-semibold">{t.intro}</span>
        {t.numbers.map((item) => (
          <a
            key={item.number}
            href={item.href}
            className="hover:text-foreground whitespace-nowrap underline-offset-2 hover:underline"
          >
            <span className="text-foreground font-bold">{item.number}</span>{" "}
            {item.label}
          </a>
        ))}
        <Link
          href="/crisis"
          className="hover:text-foreground font-semibold underline underline-offset-2"
        >
          {t.more}
        </Link>
        <span>{t.disclaimer}</span>
      </div>
    </aside>
  );
}
