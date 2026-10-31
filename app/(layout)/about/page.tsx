import { Bouyotte } from "@/components/brand/bouyotte";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import {
  Ban,
  HandHeart,
  HeartHandshake,
  Lock,
  MessageCircleHeart,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("about.metaTitle", { app: SiteConfig.title }),
    description: t("about.metaDescription"),
    keywords: [
      "SPM",
      "TDPM",
      "syndrome prémenstruel",
      "couple",
      "partenaire",
      "Moodday",
    ],
    openGraph: {
      title: t("about.metaTitle", { app: SiteConfig.title }),
      description: t("about.metaDescription"),
      url: `${SiteConfig.prodUrl}/about`,
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const values = [
    {
      icon: Lock,
      title: t("about.values.items.control.title"),
      description: t("about.values.items.control.description"),
      tone: "bg-mint",
    },
    {
      icon: HandHeart,
      title: t("about.values.items.together.title"),
      description: t("about.values.items.together.description"),
      tone: "bg-honey",
    },
    {
      icon: Stethoscope,
      title: t("about.values.items.sober.title"),
      description: t("about.values.items.sober.description"),
      tone: "bg-apricot-soft",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="knit border-b-2 border-[var(--ink)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:py-20">
          <div className="flex flex-col gap-5">
            <p className="bg-mint inline-flex w-fit items-center rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold tracking-wide uppercase">
              {t("about.hero.kicker")}
            </p>
            <h1 className="font-display text-4xl leading-[1.02] font-extrabold sm:text-5xl lg:text-6xl">
              {t("about.hero.titlePrefix")}{" "}
              <span className="bg-honey shadow-sticker inline-block -rotate-1 rounded-2xl border-2 border-[var(--ink)] px-3">
                {t("about.hero.titleHighlight")}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              {t("about.hero.description")}
            </p>
          </div>
          <div className="flex justify-center">
            <Bouyotte mood="happy" steam className="animate-float size-40" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
        {/* Mission & limits */}
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="sticker flex flex-col gap-4 p-6 sm:p-8">
            <span className="bg-honey flex size-12 items-center justify-center rounded-full border-2 border-[var(--ink)]">
              <HeartHandshake className="size-6" aria-hidden />
            </span>
            <h2 className="font-display text-2xl font-extrabold">
              {t("about.mission.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("about.mission.paragraphOne")}
            </p>
            <p className="text-muted-foreground">
              {t("about.mission.paragraphTwo")}
            </p>
          </article>
          <article className="sticker bg-plum-soft/40 flex flex-col gap-4 p-6 sm:p-8">
            <span className="bg-paper flex size-12 items-center justify-center rounded-full border-2 border-[var(--ink)]">
              <Ban className="size-6" aria-hidden />
            </span>
            <h2 className="font-display text-2xl font-extrabold">
              {t("about.vision.title")}
            </h2>
            <p>{t("about.vision.paragraphOne")}</p>
            <p>{t("about.vision.paragraphTwo")}</p>
          </article>
        </section>

        {/* Values */}
        <section className="flex flex-col gap-8">
          <h2 className="font-display text-center text-3xl font-extrabold sm:text-4xl">
            {t("about.values.title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <article
                  key={value.title}
                  className={cn(
                    "sticker flex flex-col gap-3 p-6",
                    index === 1 ? "md:-rotate-1" : "md:rotate-1",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border-2 border-[var(--ink)]",
                      value.tone,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-display text-xl font-extrabold">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Free promise */}
        <section className="sticker bg-honey-soft flex flex-col gap-3 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold">
            {t("about.privacyPromise.title")}
          </h2>
          <p>{t("about.privacyPromise.description")}</p>
        </section>

        {/* Team */}
        <section className="flex flex-col items-center gap-4 text-center">
          <span className="bg-mint flex size-12 items-center justify-center rounded-full border-2 border-[var(--ink)]">
            <MessageCircleHeart className="size-6" aria-hidden />
          </span>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            {t("about.team.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            {t("about.team.description")}
          </p>
          <Link
            href="/contact"
            className={buttonVariants({ variant: "honey" })}
          >
            {t("about.team.contactCta")}
          </Link>
        </section>
      </div>
    </div>
  );
}
