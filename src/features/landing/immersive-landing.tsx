"use client";

import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { buttonVariants } from "@/components/ui/button";
import { LanguageToggle } from "@/features/i18n/language-toggle";
import { Pricing } from "@/features/plans/pricing-section";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { useI18n } from "@/i18n/provider";
import { getActivePublicClaims } from "@/lib/public-claims";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BellRing,
  BookHeart,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartHandshake,
  LockKeyhole,
  Menu,
  MoonStar,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const copy = {
  fr: {
    nav: {
      product: "Produit",
      consultation: "Bilans",
      pricing: "Tarifs",
      signin: "Se connecter",
      start: "Commencer gratuitement",
      aria: "Navigation principale",
      menu: "Menu principal",
    },
    hero: {
      eyebrow: "Votre quotidien, avec plus de repères",
      title: "Comprendre vos journées. Préparer vos consultations.",
      description:
        "Moodday vous aide à suivre votre humeur, votre sommeil et vos traitements dans un espace calme, conçu pour rester utile même les jours difficiles.",
      primary: "Commencer gratuitement",
      secondary: "Voir une journée avec Moodday",
      disclaimer:
        "Compagnon de suivi personnel — sans diagnostic ni recommandation médicale.",
      imageAlt:
        "Une personne consulte calmement son téléphone près d'une fenêtre, dans un intérieur lumineux.",
    },
    today: {
      eyebrow: "Une journée avec Moodday",
      title: "Quelques secondes pour noter. Des repères qui restent.",
      description:
        "Chaque interaction va à l'essentiel. Vous pouvez détailler lorsque vous en avez l'énergie, ou simplement enregistrer l'instant.",
      steps: [
        {
          time: "08:10",
          title: "Check-in rapide",
          description: "Humeur, énergie et sommeil en quinze secondes.",
        },
        {
          time: "12:30",
          title: "Rappel de traitement",
          description:
            "Confirmez une prise sans ouvrir un formulaire complexe.",
        },
        {
          time: "20:45",
          title: "Réflexion factuelle",
          description:
            "Relisez ce que vous avez noté, sans jugement ni score culpabilisant.",
        },
      ],
    },
    consultation: {
      eyebrow: "Mode Consultation",
      title: "Arriver avec les faits importants déjà organisés.",
      description:
        "Choisissez une période et retrouvez les évolutions, changements de traitement et questions que vous souhaitez aborder. Les observations restent séparées des interprétations.",
      items: [
        "Chronologie humeur, sommeil et anxiété",
        "Changements de dosage replacés dans le temps",
        "Questions à préparer, sans conseil médical",
        "Rapport PDF lisible et contrôlé par vous",
      ],
      evidence:
        "Chaque observation renvoie à ses dates et métriques d'origine.",
    },
    caregivers: {
      eyebrow: "Cercle aidant",
      title: "Partager moins, mais partager juste.",
      description:
        "Vous choisissez qui peut voir une information et vous pouvez révoquer cet accès. Les notes personnelles ne sont jamais partagées par défaut.",
      permissions: [
        "Tendances d'humeur",
        "Suivi des prises",
        "Ajouter une observation",
      ],
      revoked: "Accès révocable à tout moment",
      personRole: "Aidant·e de confiance",
      allowed: "Autorisé",
      private: "Non partagé",
      action: "Créer mon cercle",
    },
    trust: {
      eyebrow: "Confidentialité vérifiable",
      title: "Des garanties factuelles, pas des slogans.",
      description:
        "Moodday documente ses traitements, limite les journaux techniques et ne publie une garantie que lorsqu'elle possède une preuve et une date de revue.",
    },
    cta: {
      title: "Commencez avec un seul repère aujourd'hui.",
      description:
        "Le suivi essentiel reste gratuit. Plus ajoute les bilans avancés et le Mode Consultation.",
      primary: "Créer mon espace",
      secondary: "Découvrir les tarifs",
    },
    footer: "Compagnon de suivi personnel non médical.",
    footerLinks: {
      privacy: "Confidentialité",
      terms: "CGU",
      contact: "Contact",
    },
    preview: {
      today: "Aujourd'hui",
      hint: "Un repère suffit. Vous pourrez détailler plus tard.",
      report: "Bilan personnel",
      period: "4 dernières semaines",
      observation: "Observation",
      observationText:
        "Le sommeil déclaré varie sur la période. Aucune cause n'est déduite.",
      evidenceOne: "12 juil. · sommeil",
      evidenceTwo: "19 juil. · sommeil",
      question: "Question à apporter",
      questionText:
        "Quels changements souhaitez-vous signaler depuis la dernière consultation ?",
    },
  },
  en: {
    nav: {
      product: "Product",
      consultation: "Summaries",
      pricing: "Pricing",
      signin: "Sign in",
      start: "Start for free",
      aria: "Main navigation",
      menu: "Main menu",
    },
    hero: {
      eyebrow: "More reference points for everyday life",
      title: "Understand your days. Prepare your appointments.",
      description:
        "Moodday helps you track mood, sleep, and treatments in a calm space designed to remain useful even on difficult days.",
      primary: "Start for free",
      secondary: "See a day with Moodday",
      disclaimer:
        "A personal tracking companion — no diagnosis or medical recommendation.",
      imageAlt:
        "A person calmly checks their phone by a window in a bright home.",
    },
    today: {
      eyebrow: "A day with Moodday",
      title: "Seconds to record. Reference points that remain.",
      description:
        "Every interaction stays focused. Add detail when you have the energy, or simply record the moment.",
      steps: [
        {
          time: "08:10",
          title: "Quick check-in",
          description: "Mood, energy, and sleep in fifteen seconds.",
        },
        {
          time: "12:30",
          title: "Treatment reminder",
          description: "Confirm an intake without opening a complex form.",
        },
        {
          time: "20:45",
          title: "Factual reflection",
          description:
            "Review what you recorded, without judgment or guilt-inducing scores.",
        },
      ],
    },
    consultation: {
      eyebrow: "Consultation Mode",
      title: "Arrive with the important facts already organized.",
      description:
        "Choose a period and review changes, treatment updates, and the questions you want to discuss. Observations stay separate from interpretations.",
      items: [
        "Mood, sleep, and anxiety timeline",
        "Dosage changes placed in context",
        "Questions to prepare, without medical advice",
        "A readable PDF report controlled by you",
      ],
      evidence:
        "Every observation links back to its original dates and metrics.",
    },
    caregivers: {
      eyebrow: "Caregiver circle",
      title: "Share less, but share what matters.",
      description:
        "You choose who can see information and can revoke access. Personal notes are never shared by default.",
      permissions: ["Mood trends", "Intake tracking", "Add an observation"],
      revoked: "Access can be revoked at any time",
      personRole: "Trusted caregiver",
      allowed: "Allowed",
      private: "Not shared",
      action: "Create my circle",
    },
    trust: {
      eyebrow: "Verifiable privacy",
      title: "Factual guarantees, not slogans.",
      description:
        "Moodday documents its processing, minimizes technical logs, and only publishes a guarantee when it has evidence and a review date.",
    },
    cta: {
      title: "Start with one reference point today.",
      description:
        "Essential tracking stays free. Plus adds advanced summaries and Consultation Mode.",
      primary: "Create my space",
      secondary: "See pricing",
    },
    footer: "A non-medical personal tracking companion.",
    footerLinks: { privacy: "Privacy", terms: "Terms", contact: "Contact" },
    preview: {
      today: "Today",
      hint: "One reference point is enough. You can add detail later.",
      report: "Personal summary",
      period: "Last 4 weeks",
      observation: "Observation",
      observationText:
        "Reported sleep varies over the period. No cause is inferred.",
      evidenceOne: "Jul 12 · sleep",
      evidenceTwo: "Jul 19 · sleep",
      question: "Question to bring",
      questionText:
        "What changes would you like to mention since your last appointment?",
    },
  },
} as const;

export function ImmersiveLanding() {
  const { locale } = useI18n();
  const t = copy[locale === "en" ? "en" : "fr"];
  const [menuOpen, setMenuOpen] = useState(false);
  const claims = getActivePublicClaims("landing");

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F7F5F0] text-[#183432] dark:bg-[#102523] dark:text-[#F7F5F0]">
      <header className="sticky top-0 z-50 border-b border-[#183432]/8 bg-[#F7F5F0]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#102523]/90">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <MooddayLogo />
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label={t.nav.aria}
          >
            <Link
              href="#product"
              className="text-sm font-semibold hover:text-[#1E7775]"
            >
              {t.nav.product}
            </Link>
            <Link
              href="#consultation"
              className="text-sm font-semibold hover:text-[#1E7775]"
            >
              {t.nav.consultation}
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-semibold hover:text-[#1E7775]"
            >
              {t.nav.pricing}
            </Link>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="px-3 py-2 text-sm font-semibold"
            >
              {t.nav.signin}
            </Link>
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants(),
                "rounded-full bg-[#1E7775] px-5 text-white hover:bg-[#175f5d]",
              )}
            >
              {t.nav.start}
            </Link>
          </div>
          <button
            className="flex size-11 items-center justify-center rounded-full border border-[#183432]/15 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t.nav.menu}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="space-y-2 border-t border-[#183432]/10 px-5 py-5 md:hidden">
            {[
              { href: "#product", label: t.nav.product },
              { href: "#consultation", label: t.nav.consultation },
              { href: "#pricing", label: t.nav.pricing },
              { href: "/auth/signin", label: t.nav.signin },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/70"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants(),
                "mt-2 w-full rounded-full bg-[#1E7775] text-white",
              )}
            >
              {t.nav.start}
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden px-5 py-16 lg:px-8 lg:py-24">
          <div className="absolute -top-24 right-0 size-96 rounded-full bg-[#8DDDE0]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-[#C7B8EA]/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1E7775]/20 bg-white/65 px-4 py-2 text-sm font-bold text-[#1E7775] dark:bg-white/5">
                <BookHeart className="size-4" /> {t.hero.eyebrow}
              </div>
              <h1 className="max-w-3xl font-[family-name:var(--font-caption)] text-5xl leading-[1.02] font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {t.hero.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#51625F] dark:text-white/70">
                {t.hero.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group rounded-full bg-[#1E7775] px-7 text-white hover:bg-[#175f5d]",
                  )}
                >
                  {t.hero.primary}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#product"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full border-[#183432]/20 bg-white/40 px-7",
                  )}
                >
                  {t.hero.secondary}
                </Link>
              </div>
              <p className="mt-6 flex max-w-xl items-start gap-2 text-sm leading-6 text-[#667673] dark:text-white/60">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1E7775]" />
                {t.hero.disclaimer}
              </p>
            </div>
            <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] border border-white/70 bg-white shadow-[0_30px_100px_rgba(24,52,50,0.15)] lg:min-h-[610px]">
              <Image
                src="/images/moodday-hero-v1.webp"
                alt={t.hero.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute right-5 bottom-5 left-5 rounded-3xl border border-white/70 bg-white/88 p-4 shadow-xl backdrop-blur-lg sm:right-auto sm:w-72">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#183432]">
                    {t.preview.today}
                  </span>
                  <span className="rounded-full bg-[#D9F1EE] px-2.5 py-1 text-xs font-bold text-[#1E7775]">
                    15 sec
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {[3, 5, 7, 9].map((value) => (
                    <span
                      key={value}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        value === 7 ? "bg-[#1E7775]" : "bg-[#D8E5E2]",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#667673]">{t.preview.hint}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold tracking-[0.18em] text-[#1E7775] uppercase">
                {t.today.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                {t.today.title}
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#667673] dark:text-white/70">
                {t.today.description}
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {t.today.steps.map((step, index) => {
                const Icon =
                  [CalendarCheck, BellRing, MoonStar][index] ?? CalendarCheck;
                return (
                  <article
                    key={step.time}
                    className="rounded-[2rem] border border-[#183432]/8 bg-white p-7 shadow-[0_16px_50px_rgba(24,52,50,0.06)] dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#D9F1EE] text-[#1E7775]">
                        <Icon className="size-6" />
                      </span>
                      <span className="font-mono text-sm text-[#667673]">
                        {step.time}
                      </span>
                    </div>
                    <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
                    <p className="mt-3 leading-7 text-[#667673] dark:text-white/65">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="consultation"
          className="bg-[#183432] px-5 py-20 text-white lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-[#8DDDE0] uppercase">
                {t.consultation.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                {t.consultation.title}
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/70">
                {t.consultation.description}
              </p>
              <ul className="mt-8 space-y-4">
                {t.consultation.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-[#8DDDE0]" />
                    <span className="text-white/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2.5rem] bg-[#F7F5F0] p-5 text-[#183432] shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-[#183432]/10 pb-5">
                <div>
                  <p className="text-xs font-bold tracking-widest text-[#1E7775] uppercase">
                    {t.preview.report}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{t.preview.period}</h3>
                </div>
                <FileText className="size-7 text-[#1E7775]" />
              </div>
              <div className="mt-7 space-y-5">
                <div className="rounded-2xl bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-[#1E7775]" />
                    <p className="font-bold">{t.preview.observation}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#667673]">
                    {t.preview.observationText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#D9F1EE] px-3 py-1 text-xs font-bold text-[#1E7775]">
                      {t.preview.evidenceOne}
                    </span>
                    <span className="rounded-full bg-[#E9E1F4] px-3 py-1 text-xs font-bold text-[#66558D]">
                      {t.preview.evidenceTwo}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#1E7775]/15 p-5">
                  <p className="text-sm font-bold">{t.preview.question}</p>
                  <p className="mt-2 text-sm text-[#667673]">
                    {t.preview.questionText}
                  </p>
                </div>
              </div>
              <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#1E7775]">
                <ClipboardList className="size-4" />
                {t.consultation.evidence}
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2.5rem] bg-[#E9E1F4] p-6 sm:p-10">
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full bg-[#D9F1EE]">
                    <HeartHandshake className="size-6 text-[#1E7775]" />
                  </span>
                  <div>
                    <p className="font-bold">Camille</p>
                    <p className="text-sm text-[#667673]">
                      {t.caregivers.personRole}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {t.caregivers.permissions.map((permission, index) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between rounded-xl border border-[#183432]/8 p-3"
                    >
                      <span className="text-sm font-semibold">
                        {permission}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          index < 2
                            ? "bg-[#D9F1EE] text-[#1E7775]"
                            : "bg-[#F1ECE3] text-[#667673]",
                        )}
                      >
                        {index < 2
                          ? t.caregivers.allowed
                          : t.caregivers.private}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#667673]">
                  <LockKeyhole className="size-4" />
                  {t.caregivers.revoked}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-[#1E7775] uppercase">
                {t.caregivers.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                {t.caregivers.title}
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#667673] dark:text-white/70">
                {t.caregivers.description}
              </p>
              <Link
                href="/auth/signup"
                className="mt-8 inline-flex items-center gap-2 font-bold text-[#1E7775]"
              >
                {t.caregivers.action} <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          id="security"
          className="bg-[#E7F3F1] px-5 py-20 text-[#183432] lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold tracking-[0.18em] text-[#1E7775] uppercase">
                {t.trust.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
                {t.trust.title}
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#51625F]">
                {t.trust.description}
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {claims.map((claim, index) => {
                const Icon =
                  [ShieldCheck, FileText, LockKeyhole][index] ?? ShieldCheck;
                return (
                  <article key={claim.id} className="rounded-3xl bg-white p-6">
                    <Icon className="size-6 text-[#1E7775]" />
                    <p className="mt-5 leading-7 font-semibold">
                      {locale === "en" ? claim.claimEn : claim.claim}
                    </p>
                    <p className="mt-4 text-xs text-[#667673]">
                      {locale === "en" ? "Reviewed" : "Revu le"}{" "}
                      {new Intl.DateTimeFormat(locale).format(
                        new Date(claim.reviewedAt),
                      )}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <div id="pricing">
          <Pricing mode="landing" />
        </div>

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[3rem] bg-[#1E7775] px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            <Sparkles className="mx-auto size-8 text-[#8DDDE0]" />
            <h2 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-caption)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
              {t.cta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
              {t.cta.description}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full bg-white px-7 text-[#1E7775] hover:bg-[#F7F5F0]",
                )}
              >
                {t.cta.primary}
              </Link>
              <Link
                href="#pricing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-white/30 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                {t.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#183432]/10 px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <MooddayLogo />
            <p className="mt-2 text-sm text-[#667673] dark:text-white/60">
              {t.footer}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm font-semibold">
            <Link href="/legal/privacy">{t.footerLinks.privacy}</Link>
            <Link href="/legal/terms">{t.footerLinks.terms}</Link>
            <Link href="/contact">{t.footerLinks.contact}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
