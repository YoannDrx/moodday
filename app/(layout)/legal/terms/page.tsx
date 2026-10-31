import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  Gavel,
  HeartHandshake,
  PhoneCall,
  Scale,
  Shield,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type TermsSection = {
  icon: LucideIcon;
  title: string;
  content?: string;
  items?: string[];
  highlight?: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("legal.terms.metaTitle", { app: SiteConfig.title }),
    description: t("legal.terms.metaDescription"),
  };
}

export default async function TermsPage() {
  const { t } = await getI18n();
  const sections: TermsSection[] = [
    {
      icon: Building2,
      title: t("legal.terms.sections.publisher.title"),
      content: t("legal.terms.sections.publisher.content", {
        publisher: SiteConfig.company.name,
        legalForm: SiteConfig.company.legalForm,
        siren: SiteConfig.company.siren,
      }),
    },
    {
      icon: BookOpen,
      title: t("legal.terms.sections.service.title"),
      content: t("legal.terms.sections.service.content"),
      highlight: t("legal.terms.sections.service.highlight"),
    },
    {
      icon: UserCheck,
      title: t("legal.terms.sections.account.title"),
      items: [
        t("legal.terms.sections.account.items.age"),
        t("legal.terms.sections.account.items.accurateInfo"),
        t("legal.terms.sections.account.items.credentials"),
        t("legal.terms.sections.account.items.responsibility"),
      ],
    },
    {
      icon: Shield,
      title: t("legal.terms.sections.acceptableUse.title"),
      items: [
        t("legal.terms.sections.acceptableUse.items.personalTracking"),
        t("legal.terms.sections.acceptableUse.items.noSharing"),
        t("legal.terms.sections.acceptableUse.items.noBypass"),
        t("legal.terms.sections.acceptableUse.items.respect"),
      ],
    },
    {
      icon: HeartHandshake,
      title: t("legal.terms.sections.partner.title"),
      content: t("legal.terms.sections.partner.content"),
    },
    {
      icon: CreditCard,
      title: t("legal.terms.sections.subscription.title"),
      content: t("legal.terms.sections.subscription.content"),
    },
    {
      icon: FileText,
      title: t("legal.terms.sections.ip.title"),
      content: t("legal.terms.sections.ip.content"),
    },
    {
      icon: Scale,
      title: t("legal.terms.sections.liability.title"),
      items: [
        t("legal.terms.sections.liability.items.decisions"),
        t("legal.terms.sections.liability.items.interruptions"),
        t("legal.terms.sections.liability.items.losses"),
      ],
      highlight: t("legal.terms.sections.liability.highlight"),
    },
    {
      icon: XCircle,
      title: t("legal.terms.sections.termination.title"),
      content: t("legal.terms.sections.termination.content"),
    },
    {
      icon: Gavel,
      title: t("legal.terms.sections.law.title"),
      content: t("legal.terms.sections.law.content"),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-14 sm:px-6 lg:py-20">
      <header className="flex flex-col gap-4">
        <span className="bg-honey shadow-sticker flex size-14 items-center justify-center rounded-2xl border-2 border-[var(--ink)]">
          <FileText className="size-7" aria-hidden />
        </span>
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          {t("legal.terms.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {t("legal.terms.subtitle")}
        </p>
        <p className="text-muted-foreground text-sm">
          {t("legal.terms.lastUpdated")}
        </p>
      </header>

      {/* Emergency: sober, always first */}
      <aside className="flex items-start gap-4 rounded-2xl border-2 border-[var(--crisis)] p-5">
        <PhoneCall className="text-crisis mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="text-crisis font-bold">
            {t("legal.terms.emergency.title")}
          </h2>
          <p>
            {t("legal.terms.emergency.descriptionPrefix")}
            <a href="tel:3114" className="font-bold underline">
              {t("legal.terms.emergency.phone")}
            </a>
            {t("legal.terms.emergency.descriptionSuffix")}
          </p>
        </div>
      </aside>

      <ol className="flex flex-col gap-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <li key={section.title} className="sticker flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className="bg-paper font-display flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] text-sm font-extrabold">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)]",
                    index % 2 === 0 ? "bg-mint" : "bg-honey",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <h2 className="font-display text-lg font-extrabold sm:text-xl">
                  {section.title}
                </h2>
              </div>

              {section.content && (
                <p className="text-muted-foreground">{section.content}</p>
              )}

              {section.items && (
                <ul className="text-muted-foreground flex flex-col gap-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ink)]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.highlight && (
                <p className="bg-honey-soft rounded-2xl border-2 border-dashed border-[var(--ink)] p-3 text-sm font-semibold">
                  {section.highlight}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <section className="sticker bg-paper flex flex-col items-center gap-2 p-6 text-center">
        <h2 className="font-display text-lg font-extrabold">
          {t("legal.terms.contact.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("legal.terms.contact.descriptionPrefix")}{" "}
          <a
            href={`mailto:${SiteConfig.company.email}`}
            className="font-bold underline"
          >
            {SiteConfig.company.email}
          </a>
        </p>
      </section>
    </div>
  );
}
