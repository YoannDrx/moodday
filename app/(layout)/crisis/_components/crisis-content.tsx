"use client";

import {
  ExternalLink,
  Heart,
  MessageCircle,
  Phone,
  PhoneCall,
  Users,
  Wind,
} from "lucide-react";

import { BreathingWidget } from "@/components/nowts/breathing-widget";
import { useI18n } from "@/i18n/provider";

type CrisisResource = {
  name: string;
  description?: string;
  phone?: string;
  url?: string;
  sms?: string;
  available?: string;
  category?: "hotline" | "chat" | "emergency" | "support";
};

type CrisisContentProps = {
  featured?: CrisisResource;
  hotlines: CrisisResource[];
  emergency: CrisisResource[];
  support: CrisisResource[];
};

/**
 * Public crisis page. Deliberately sober: no mascot, no humour, no
 * decorative rotation. The 3114 is always shown first.
 */
export function CrisisContent({
  featured,
  hotlines,
  emergency,
  support,
}: CrisisContentProps) {
  const { t, tm } = useI18n();
  const partnerItems = tm<string[]>("crisis.partner.items") ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          {t("crisis.title")}
        </h1>
        <p className="text-lg">{t("crisis.subtitle")}</p>
      </header>

      {/* 3114 first */}
      {featured?.phone && (
        <section
          aria-labelledby="crisis-primary"
          className="bg-card flex flex-col gap-4 rounded-[28px] border-4 border-[var(--crisis)] p-6 sm:p-8"
        >
          <p className="text-crisis text-xs font-bold tracking-wide uppercase">
            {t("crisis.primary.kicker")}
          </p>
          <h2
            id="crisis-primary"
            className="font-display text-2xl font-extrabold sm:text-3xl"
          >
            {t("crisis.primary.title")}
          </h2>
          <p className="max-w-2xl text-base sm:text-lg">
            {t("crisis.primary.description")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={`tel:${featured.phone}`}
              className="bg-crisis text-crisis-foreground inline-flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-[var(--ink)] px-7 text-lg font-extrabold"
            >
              <PhoneCall className="size-6" aria-hidden />
              {t("crisis.primary.cta")}
            </a>
            {featured.url && (
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold underline underline-offset-4"
              >
                <ExternalLink className="size-4" aria-hidden />
                {featured.url.replace(/^https?:\/\//u, "")}
              </a>
            )}
            {featured.available && (
              <span className="text-muted-foreground text-sm font-semibold">
                {featured.available}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Immediate danger */}
      <section
        aria-labelledby="crisis-emergency"
        className="sticker flex flex-col gap-4 p-6"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="crisis-emergency"
            className="font-display text-xl font-extrabold"
          >
            {t("crisis.emergency.title")}
          </h2>
          <p>{t("crisis.emergency.description")}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {emergency.map((resource) => (
            <li key={resource.name}>
              <EmergencyButton resource={resource} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-7">
          {/* Breathing */}
          <section
            aria-labelledby="crisis-breathing"
            className="sticker flex flex-col gap-4 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="crisis-breathing"
                className="font-display flex items-center gap-2 text-xl font-extrabold"
              >
                <Wind className="size-5" aria-hidden />
                {t("crisis.breathing.title")}
              </h2>
              <span className="bg-mint-soft rounded-full border-2 border-[var(--ink)] px-3 py-0.5 text-xs font-bold">
                {t("crisis.breathing.badge")}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("crisis.breathing.description")}
            </p>
            <BreathingWidget />
          </section>

          {/* Other listening lines */}
          {hotlines.length > 0 && (
            <ResourceList
              id="crisis-hotlines"
              title={t("crisis.sections.hotlines")}
              resources={hotlines}
            />
          )}
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          {/* Worried about a partner */}
          <section
            aria-labelledby="crisis-partner"
            className="sticker flex flex-col gap-3 p-6"
          >
            <h2
              id="crisis-partner"
              className="font-display flex items-center gap-2 text-xl font-extrabold"
            >
              <Users className="size-5" aria-hidden />
              {t("crisis.partner.title")}
            </h2>
            <ul className="flex flex-col gap-2">
              {partnerItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--ink)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {support.length > 0 && (
            <ResourceList
              id="crisis-support"
              title={t("crisis.sections.support")}
              resources={support}
            />
          )}

          <section
            aria-labelledby="crisis-reassurance"
            className="bg-mint-soft flex flex-col gap-2 rounded-[28px] border-2 border-[var(--ink)] p-6"
          >
            <h2
              id="crisis-reassurance"
              className="font-display flex items-center gap-2 text-lg font-extrabold"
            >
              <Heart className="size-5" aria-hidden />
              {t("crisis.reassurance.title")}
            </h2>
            <p>
              <span className="font-bold">
                {t("crisis.reassurance.emphasis")}
              </span>{" "}
              {t("crisis.reassurance.body")}
            </p>
          </section>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">{t("crisis.disclaimer")}</p>
    </div>
  );
}

function EmergencyButton({ resource }: { resource: CrisisResource }) {
  const { t } = useI18n();
  const number = resource.phone ?? resource.sms;
  if (!number) return null;
  const href = resource.phone ? `tel:${resource.phone}` : `sms:${resource.sms}`;
  const Icon = resource.phone ? Phone : MessageCircle;

  return (
    <a
      href={href}
      className="bg-card flex h-full items-center gap-3 rounded-2xl border-2 border-[var(--crisis)] p-4"
    >
      <span className="bg-crisis text-crisis-foreground flex size-11 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-2xl leading-none font-extrabold">
          {number}
          {resource.sms && (
            <span className="ml-2 align-middle text-xs font-bold uppercase">
              {t("crisis.actions.sms")}
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-sm">
          {resource.description}
        </span>
      </span>
    </a>
  );
}

function ResourceList({
  id,
  title,
  resources,
}: {
  id: string;
  title: string;
  resources: CrisisResource[];
}) {
  return (
    <section aria-labelledby={id} className="sticker flex flex-col gap-4 p-6">
      <h2 id={id} className="font-display text-xl font-extrabold">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {resources.map((resource) => (
          <li key={resource.name}>
            <ResourceCard resource={resource} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceCard({ resource }: { resource: CrisisResource }) {
  const { t } = useI18n();

  return (
    <div className="bg-background flex flex-col gap-3 rounded-2xl border-2 border-[var(--ink)] p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{resource.name}</span>
          {resource.available && (
            <span className="bg-paper rounded-full border border-[var(--ink)] px-2 py-0.5 text-[11px] font-bold">
              {resource.available}
            </span>
          )}
        </div>
        {resource.description && (
          <p className="text-muted-foreground text-sm">
            {resource.description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/\s/g, "")}`}
            className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[var(--ink)] px-4 text-sm font-bold"
          >
            <Phone className="size-4" aria-hidden />
            {resource.phone}
          </a>
        )}
        {resource.sms && (
          <a
            href={`sms:${resource.sms}`}
            className="bg-card inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[var(--ink)] px-4 text-sm font-bold"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("crisis.actions.sms")}
          </a>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[var(--ink)] px-4 text-sm font-bold"
          >
            <ExternalLink className="size-4" aria-hidden />
            {t("crisis.actions.website")}
          </a>
        )}
      </div>
    </div>
  );
}
