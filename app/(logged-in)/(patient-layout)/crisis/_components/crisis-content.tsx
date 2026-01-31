"use client";

import {
  Phone,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  Heart,
  Wind,
  Shield,
  Sparkles,
  ChevronRight,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { BreathingWidget } from "@/components/nowts/breathing-widget";
import { cn } from "@/lib/utils";
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
  hotlines: CrisisResource[];
  emergency: CrisisResource[];
  support: CrisisResource[];
};

export function CrisisContent({
  hotlines,
  emergency,
  support,
}: CrisisContentProps) {
  const { t, tm } = useI18n();
  const tips = tm<{ title: string; description: string }[]>(
    "crisis.tips.items",
  ) ?? [];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          {t("crisis.title")}
        </h1>
        <p className="text-gray-500">
          {t("crisis.subtitle")}
        </p>
      </header>

      {/* Emergency Banner */}
      <GlassCard
        padding="lg"
        variant="elevated"
        className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white">
            <AlertTriangle className="size-8" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="mb-1 text-xl font-bold text-red-800">
              {t("crisis.emergency.title")}
            </h2>
            <p className="text-red-700">
              {t("crisis.emergency.call")}
              <strong>{t("crisis.emergency.samu")}</strong>{" "}
              {t("crisis.emergency.or")}{" "}
              <strong>{t("crisis.emergency.eu")}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="tel:15"
              className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 font-bold text-white transition-all hover:bg-red-600"
            >
              <PhoneCall className="size-5" />
              15
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-2 rounded-2xl border-2 border-red-500 bg-white px-6 py-3 font-bold text-red-500 transition-all hover:bg-red-50"
            >
              <PhoneCall className="size-5" />
              112
            </a>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-8 lg:col-span-7">
          {/* Breathing Exercise */}
          <GlassCard padding="lg" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Wind className="size-5 text-[var(--primary)]" />}
              >
                {t("crisis.breathing.title")}
              </GlassCardTitle>
              <span className="rounded-lg bg-[var(--primary)]/10 px-2 py-1 text-xs font-bold text-[var(--primary)]">
                {t("crisis.breathing.badge")}
              </span>
            </GlassCardHeader>

            <GlassCardContent>
              <BreathingWidget />
            </GlassCardContent>
          </GlassCard>

          {/* Main Hotlines */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle icon={<Phone className="size-5 text-red-500" />}>
                {t("crisis.sections.hotlines")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-3">
              {hotlines.map((resource, index) => (
                <ResourceCard
                  key={index}
                  resource={resource}
                  variant="hotline"
                />
              ))}
            </GlassCardContent>
          </GlassCard>

          {/* Emergency Services */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<AlertTriangle className="size-5 text-orange-500" />}
              >
                {t("crisis.sections.emergency")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-3">
              {emergency.map((resource, index) => (
                <ResourceCard
                  key={index}
                  resource={resource}
                  variant="emergency"
                />
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Side Column */}
        <div className="space-y-6 lg:col-span-5">
          {/* Support Organizations */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<MessageCircle className="size-5 text-[var(--sage)]" />}
              >
                {t("crisis.sections.support")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-3">
              {support.map((resource, index) => (
                <ResourceCard
                  key={index}
                  resource={resource}
                  variant="support"
                  compact
                />
              ))}
            </GlassCardContent>
          </GlassCard>

          {/* Safety Plan Quick Access */}
          <GlassCard
            padding="md"
            variant="elevated"
            className="border-[var(--lavender)]/30 bg-[var(--lavender)]/10"
          >
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Shield className="size-5 text-[var(--lavender-dark)]" />}
              >
                {t("crisis.safety.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent>
              <p className="mb-4 text-sm text-gray-600">
                {t("crisis.safety.description")}
              </p>
              <Link
                href="/settings?tab=safety"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--lavender-dark)] bg-white py-3 text-sm font-bold text-[var(--lavender-dark)] transition-all hover:bg-[var(--lavender)]/20"
              >
                {t("crisis.safety.cta")}
                <ChevronRight className="size-4" />
              </Link>
            </GlassCardContent>
          </GlassCard>

          {/* Reassurance Card */}
          <GlassCard
            padding="md"
            variant="elevated"
            className="border-[var(--sage)]/30 bg-[var(--sage)]/5"
          >
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Heart className="size-5 text-[var(--sage)]" />}
              >
                {t("crisis.reassurance.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent>
              <p className="text-sm leading-relaxed text-gray-700">
                <span className="font-bold text-[var(--sage-dark)]">
                  {t("crisis.reassurance.emphasis")}
                </span>{" "}
                {t("crisis.reassurance.body")}
              </p>
            </GlassCardContent>
          </GlassCard>

          {/* Tips */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Sparkles className="size-5 text-[var(--primary)]" />}
              >
                {t("crisis.tips.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-3">
              {tips.map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <p className="mb-1 font-bold text-gray-800">{tip.title}</p>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({
  resource,
  variant,
  compact = false,
}: {
  resource: CrisisResource;
  variant: "hotline" | "emergency" | "support";
  compact?: boolean;
}) {
  const { t } = useI18n();
  const variantStyles = {
    hotline: {
      bg: "bg-red-50 hover:bg-red-100/80",
      border: "border-red-200",
      iconBg: "bg-red-500",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    emergency: {
      bg: "bg-orange-50 hover:bg-orange-100/80",
      border: "border-orange-200",
      iconBg: "bg-orange-500",
      button: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    support: {
      bg: "bg-[var(--sage)]/5 hover:bg-[var(--sage)]/10",
      border: "border-[var(--sage)]/20",
      iconBg: "bg-[var(--sage)]",
      button: "bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        style.bg,
        style.border,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-white",
            style.iconBg,
          )}
        >
          <Phone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">{resource.name}</span>
            {resource.available && (
              <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                {resource.available}
              </span>
            )}
          </div>
          {!compact && resource.description && (
            <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {resource.phone && (
          <Button asChild size="sm" className={cn("rounded-xl", style.button)}>
            <a href={`tel:${resource.phone}`}>
              <Phone className="mr-1.5 size-4" />
              {resource.phone}
            </a>
          </Button>
        )}
        {resource.sms && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-xl border-gray-200 bg-white"
          >
            <a href={`sms:${resource.sms}`}>
              <MessageCircle className="mr-1.5 size-4" />
              {t("crisis.actions.sms")}
            </a>
          </Button>
        )}
        {resource.url && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="rounded-xl border-gray-200 bg-white"
          >
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 size-4" />
              {t("crisis.actions.website")}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
