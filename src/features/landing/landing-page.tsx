import { Bouyotte } from "@/components/brand/bouyotte";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import type { PublicSignupMode } from "@/lib/auth/signup-access";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BellRing,
  HeartHandshake,
  Lock,
  MessageCircleHeart,
  PauseCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { WaitlistSection } from "./waitlist-form";

type LandingProps = {
  signupMode: PublicSignupMode;
  billingEnabled: boolean;
};

// The chosen door follows the visitor through signup to the onboarding.
const doorHref = (mode: PublicSignupMode, door: "cycle" | "partner") =>
  mode === "closed"
    ? `/?porte=${door}#liste-attente`
    : `/auth/signup?callbackUrl=${encodeURIComponent(`/onboarding?porte=${door}`)}`;

const problems = [
  {
    title: "Tous les mois, la même dispute.",
    text: "Même scénario, mêmes répliques. Personne n'a envie de jouer la saison 12.",
    mood: "hard" as const,
  },
  {
    title: "Elle ne veut pas avoir à le dire.",
    text: "Expliquer, justifier, se sentir « trop ». Épuisant, en plus du reste.",
    mood: "fragile" as const,
  },
  {
    title: "Il veut aider. Il ne sait pas comment.",
    text: "Résultat : trop, pas assez, ou pile la phrase à ne pas dire.",
    mood: "wink" as const,
  },
];

const steps = [
  {
    title: "Elle fait son point",
    text: "Dix secondes : comment ça va, et ce qui l'aiderait. Une note privée si elle veut, jamais partagée.",
    icon: Sparkles,
  },
  {
    title: "Son duo est prévenu",
    text: "Une notification discrète, avec deux ou trois idées concrètes. Pas d'alerte, pas de drame.",
    icon: BellRing,
  },
  {
    title: "Il répond par un geste",
    text: "« Je m'occupe du dîner », « Bouillotte en préparation ». Un tap, et elle le voit.",
    icon: HeartHandshake,
  },
];

const faqs = [
  {
    question: "Est-ce qu'il peut voir mes symptômes ?",
    answer:
      "Non, sauf si tu l'autorises. Par défaut, ton ou ta partenaire voit ton cycle, ton état du jour et tes besoins. Les symptômes se partagent à part, et ta note reste privée, toujours.",
  },
  {
    question: "Et si on se sépare ?",
    answer:
      "Chacun peut arrêter le partage à tout moment, sans donner de raison. L'autre perd l'accès immédiatement et l'historique partagé disparaît de son côté.",
  },
  {
    question: "Est-ce que c'est médical ?",
    answer:
      "Non. Moodday est un journal de bien-être et un outil de communication de couple. Il ne pose aucun diagnostic et ne remplace pas un ou une professionnelle de santé.",
  },
  {
    question: "Ça marche pour un couple de femmes ?",
    answer:
      "Oui. L'interface parle de « partenaire » partout. Chaque compte choisit son côté : « c'est mon cycle » ou « je soutiens ».",
  },
  {
    question: "Je peux l'utiliser seule ?",
    answer:
      "Bien sûr. Le point du jour, le calendrier et les repères sur ton cycle fonctionnent sans partenaire. Tu invites quelqu'un quand tu veux, ou jamais.",
  },
  {
    question: "Mon partenaire peut-il renseigner mes dates à ma place ?",
    answer:
      "Jamais. Tu es la seule source de tes données. Lui ne saisit rien sur toi, et on ne déduit jamais ton humeur à partir du calendrier.",
  },
];

function PhoneMock({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "sticker bg-paper w-[230px] rounded-[34px] p-3 sm:w-[250px]",
        className,
      )}
    >
      <div className="bg-background flex min-h-[300px] flex-col gap-3 rounded-[26px] border-2 border-[var(--ink)] p-4">
        {children}
      </div>
      <figcaption className="mt-2 text-center text-xs font-bold">
        {label}
      </figcaption>
    </figure>
  );
}

export function LandingPage({ signupMode, billingEnabled }: LandingProps) {
  return (
    <>
      {/* 1. Hero: two doors */}
      <section className="knit relative overflow-hidden border-b-2 border-[var(--ink)]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <p className="bg-mint inline-flex w-fit items-center gap-2 rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold tracking-wide uppercase">
              Pour les couples · SPM & TDPM
            </p>
            <h1 className="text-5xl leading-[0.95] font-extrabold sm:text-6xl lg:text-7xl">
              Le SPM, ça se traverse{" "}
              <span className="bg-honey shadow-sticker inline-block -rotate-2 rounded-2xl border-2 border-[var(--ink)] px-3">
                à deux.
              </span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg sm:text-xl">
              Elle n'a plus à tout expliquer. Son ou sa partenaire sait enfin
              quoi faire. Un point de dix secondes, un geste en retour, et
              personne n'a à deviner.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={doorHref(signupMode, "cycle")}
                className={buttonVariants({ size: "lg", variant: "honey" })}
              >
                C'est mon cycle
                <ArrowRight />
              </Link>
              <Link
                href={doorHref(signupMode, "partner")}
                className={buttonVariants({ size: "lg" })}
              >
                C'est le cycle de ma ou mon partenaire
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Gratuit pour l'essentiel. Sans diagnostic. Données hébergées en
              Europe, jamais vendues.
            </p>
          </div>

          <div className="relative flex justify-center gap-4 sm:gap-6">
            <PhoneMock label="Côté Léa" className="mt-10 -rotate-3">
              <p className="text-muted-foreground text-xs font-bold uppercase">
                Jour 24 · règles dans ~4 jours
              </p>
              <p className="font-display text-lg font-extrabold">Mon point</p>
              <div className="bg-honey flex items-center gap-2 rounded-2xl border-2 border-[var(--ink)] p-2">
                <Bouyotte mood="fragile" className="size-10" />
                <div>
                  <p className="font-bold">Fragile</p>
                  <p className="text-xs">Besoin : du calme</p>
                </div>
              </div>
              <div className="bg-mint-soft rounded-2xl border-2 border-dashed border-[var(--ink)] p-2 text-xs">
                <p className="font-bold">Tom a répondu</p>
                <p>« Je m'occupe du dîner »</p>
              </div>
            </PhoneMock>
            <PhoneMock label="Côté Tom" className="hidden rotate-3 sm:block">
              <div className="bg-card rounded-2xl border-2 border-[var(--ink)] p-2 text-xs">
                <p className="font-bold">Moodday</p>
                <p>Léa a partagé son point du jour.</p>
              </div>
              <p className="font-display text-lg font-extrabold">
                Ce que tu peux faire
              </p>
              {[
                "Je m'occupe du dîner",
                "Je te laisse ta soirée",
                "Bouillotte en préparation",
              ].map((gesture, index) => (
                <span
                  key={gesture}
                  className={cn(
                    "rounded-full border-2 border-[var(--ink)] px-3 py-2 text-xs font-bold",
                    index === 0 ? "bg-honey" : "bg-card",
                  )}
                >
                  {gesture}
                </span>
              ))}
            </PhoneMock>
            <Bouyotte
              mood="happy"
              steam
              className="animate-float absolute -bottom-8 -left-2 size-24 sm:left-4 lg:-left-10"
            />
          </div>
        </div>
      </section>

      {/* 2. The problem */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">
          Ce n'est pas « dans ta tête ». C'est dans le calendrier.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {problems.map((problem, index) => (
            <article
              key={problem.title}
              className={cn(
                "sticker flex flex-col gap-3 p-6",
                index === 1 ? "md:-rotate-1" : "md:rotate-1",
              )}
            >
              <Bouyotte mood={problem.mood} className="size-14" />
              <h3 className="text-xl font-extrabold">{problem.title}</h3>
              <p className="text-muted-foreground">{problem.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. How it works */}
      <section
        id="comment"
        className="bg-paper scroll-mt-20 border-y-2 border-[var(--ink)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-bold tracking-wide uppercase">
            Comment ça marche
          </p>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            Dix secondes pour elle. Un tap pour lui.
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="bg-honey font-display shadow-sticker flex size-12 items-center justify-center rounded-full border-2 border-[var(--ink)] text-xl font-extrabold">
                  {index + 1}
                </span>
                <h3 className="flex items-center gap-2 text-xl font-extrabold">
                  <step.icon className="size-5" aria-hidden />
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Partner block */}
      <section
        id="partenaires"
        className="scroll-mt-20 bg-[#2b1b30] text-[#fbf4ea]"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <p className="text-honey text-sm font-bold tracking-wide uppercase">
              Pour les partenaires
            </p>
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Personne ne t'a appris le SPM. On s'en occupe.
            </h2>
            <p className="text-lg text-[#e8dcea]">
              Le Programme Allié : 7 jours, 2 minutes par jour. Ce qui se passe
              vraiment, les phrases qui blessent, comment aider sans tout
              prendre en charge. Gratuit, et sans aucune donnée sur elle.
            </p>
            <Link
              href={doorHref(signupMode, "partner")}
              className={cn(
                buttonVariants({ size: "lg", variant: "honey" }),
                "w-fit",
              )}
            >
              Commencer le Programme Allié
              <ArrowRight />
            </Link>
          </div>
          <article className="rounded-[28px] border-2 border-[#fbf4ea] bg-[#3d2843] p-6 shadow-[6px_6px_0_0_var(--honey)]">
            <p className="text-honey text-xs font-bold uppercase">
              Jour 3 · 2 min
            </p>
            <h3 className="mt-2 text-2xl font-extrabold">
              Les phrases qui blessent (et quoi dire à la place)
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl border-2 border-dashed border-[#fbf4ea]/60 p-3 text-sm">
                <span className="block text-xs font-bold uppercase opacity-70">
                  À éviter
                </span>
                « T'as tes règles ou quoi ? »
              </p>
              <p className="bg-mint rounded-2xl border-2 border-[#fbf4ea] p-3 text-sm text-[#2b1b30]">
                <span className="block text-xs font-bold uppercase">
                  Plutôt
                </span>
                « Tu as l'air crevée. Je peux faire quelque chose ? »
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* 5. Her block: control */}
      <section
        id="confiance"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-bold tracking-wide uppercase">
              Pour elle
            </p>
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Ton cycle, <span className="squiggle">tes règles</span> du jeu.
            </h2>
            <p className="text-muted-foreground text-lg">
              Tu choisis ce qu'il voit, avec un aperçu exact. Tu mets en pause
              48 h quand tu veux souffler. Tu coupes quand tu veux. Et lui ne
              saisit jamais rien sur toi.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { icon: Lock, text: "Ta note du jour reste privée. Toujours." },
                {
                  icon: PauseCircle,
                  text: "Pause du partage en un tap, sans explication.",
                },
                {
                  icon: MessageCircleHeart,
                  text: "Notifications neutres sur l'écran verrouillé.",
                },
                {
                  icon: Trash2,
                  text: "Export et suppression de tes données en un clic.",
                },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3 font-semibold"
                >
                  <span className="bg-mint flex size-9 items-center justify-center rounded-full border-2 border-[var(--ink)]">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="sticker flex flex-col gap-3 p-6">
            <p className="font-display text-lg font-extrabold">
              Ce que Tom voit
            </p>
            {[
              {
                label: "Le cycle seulement",
                hint: "Phase et date approximative des règles",
              },
              {
                label: "Cycle + mon point",
                hint: "Plus ton état du jour, quand tu le dis",
              },
              {
                label: "Cycle + point + besoins",
                hint: "Plus ce qui t'aiderait. Recommandé.",
              },
            ].map((level, index) => (
              <div
                key={level.label}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--ink)] p-3",
                  index === 2 ? "bg-honey" : "bg-card",
                )}
              >
                <div>
                  <p className="font-bold">{level.label}</p>
                  <p className="text-sm">{level.hint}</p>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "size-5 rounded-full border-2 border-[var(--ink)]",
                    index === 2 && "bg-[var(--ink)]",
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Mental health: sober on purpose */}
      <section className="bg-plum-soft/40 border-y-2 border-[var(--ink)]">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Si ton SPM est vraiment lourd, tu n'es pas seule.
          </h2>
          <p className="text-lg">
            Le trouble dysphorique prémenstruel (TDPM) touche environ 3 à 5 %
            des personnes qui ont des règles. Moodday t'aide à garder une trace
            claire, jour après jour, à montrer à un ou une professionnelle. Et
            si ça devient trop lourd, le 3114 répond, 24 h/24, gratuitement.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/posts/tdpm-trouble-dysphorique-premenstruel"
              className={buttonVariants({ variant: "outline" })}
            >
              Comprendre le TDPM
            </Link>
            <Link
              href="/crisis"
              className={buttonVariants({ variant: "outline" })}
            >
              Ressources d'aide
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Trust */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-4xl font-extrabold">
          Promis, juré, protégé.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Hébergé en Europe",
              text: "Base de données en Europe, accès journalisés.",
            },
            {
              title: "Zéro publicité",
              text: "Ni pub, ni revente, ni « partenaires commerciaux ».",
            },
            {
              title: "Zéro diagnostic",
              text: "Un journal descriptif. Le diagnostic, c'est le job des soignants.",
            },
            {
              title: "Toi aux commandes",
              text: "Consentement séparé, retrait aussi simple que l'accord.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="sticker flex flex-col gap-2 p-5"
            >
              <ShieldCheck className="size-6" aria-hidden />
              <h3 className="text-lg font-extrabold">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 8. Pricing */}
      <section
        id="tarifs"
        className="bg-paper scroll-mt-20 border-y-2 border-[var(--ink)]"
      >
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-4xl font-extrabold">
            L'essentiel est gratuit. Pour toujours.
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center">
            Le partage, la crise et la suppression de tes données ne seront
            jamais payants. Duo ajoute du confort, pour deux.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="sticker flex flex-col gap-4 p-6">
              <h3 className="text-2xl font-extrabold">Gratuit</h3>
              <p className="font-display text-4xl font-extrabold">0 €</p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>✔ Point du jour et calendrier du cycle</li>
                <li>✔ Lien de couple et notifications</li>
                <li>✔ Gestes illimités</li>
                <li>✔ Programme Allié 7 jours</li>
                <li>✔ Ressources de crise</li>
              </ul>
            </article>
            <article className="sticker bg-honey-soft relative flex flex-col gap-4 p-6">
              <span className="bg-mint absolute -top-4 right-6 rotate-3 rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold">
                Un abonnement pour deux
              </span>
              <h3 className="text-2xl font-extrabold">Duo</h3>
              <p className="font-display text-4xl font-extrabold">
                4,99 € <span className="text-base font-bold">/mois</span>
              </p>
              <p className="text-sm font-bold">
                ou 34,99 € par an, pour vous deux
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>✔ Tout le gratuit</li>
                <li>✔ Repères sur tes derniers cycles</li>
                <li>✔ Bilan à deux après les règles</li>
                <li>✔ Programme Allié avancé</li>
              </ul>
              {!billingEnabled && (
                <p className="text-muted-foreground text-xs">
                  Duo ouvre après la bêta. En attendant, tout est gratuit.
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-4xl font-extrabold">
          Les vraies questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mt-8 flex flex-col gap-3"
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="sticker px-5"
            >
              <AccordionTrigger className="text-left text-base font-bold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 10. Final call */}
      {signupMode === "closed" ? (
        <WaitlistSection />
      ) : (
        <section className="knit border-t-2 border-[var(--ink)]">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
            <Bouyotte mood="wink" steam className="size-24" />
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Prêts pour le prochain cycle ?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={doorHref(signupMode, "cycle")}
                className={buttonVariants({ size: "lg", variant: "honey" })}
              >
                C'est mon cycle
              </Link>
              <Link
                href={doorHref(signupMode, "partner")}
                className={buttonVariants({ size: "lg" })}
              >
                Je soutiens ma ou mon partenaire
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
