"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { subscribeToNewsletterAction } from "@/features/newsletter/newsletter.action";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { MooddayLogo } from "@/components/nowts/moodday-logo";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollReveal } from "./shared";
import { toast } from "sonner";

export function SectionCtaHybrid() {
  const { t, locale } = useI18n();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const emailSchema = useMemo(
    () => z.object({ email: z.string().email(t("email.invalid")) }),
    [t],
  );
  type EmailForm = z.infer<typeof emailSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailForm) => {
    const result = await resolveActionResult(
      subscribeToNewsletterAction({
        email: data.email,
        locale,
        source: "cta-hybrid",
      }),
    );

    if (result.alreadySubscribed) {
      toast.info(t("moodday.newsletter.alreadySubscribed"));
    } else {
      toast.success(t("moodday.newsletter.subscribed"));
    }
    setIsSubmitted(true);
  };

  return (
    <section className="bg-muted/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - Branding & Text */}
          <ScrollReveal direction="left">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Logo */}
              <div className="mb-8">
                <MooddayLogo size="xl" href={undefined} />
              </div>

              {/* Title */}
              <h2 className="text-foreground mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("moodday.cta.title")}{" "}
                <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                  {t("moodday.cta.titleHighlight")}
                </span>
                {t("moodday.cta.titleSuffix")}
              </h2>

              {/* Subtitle */}
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("moodday.cta.subtitle")}
              </p>

              {/* Trust badges - Desktop only */}
              <div className="mt-8 hidden flex-wrap gap-6 lg:flex">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-muted-foreground">
                    {t("moodday.cta.trustBadges.freeTrial")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-muted-foreground">
                    {t("moodday.cta.trustBadges.noCreditCard")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-muted-foreground">
                    {t("moodday.cta.trustBadges.easyCancellation")}
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right - Newsletter Form Card */}
          <ScrollReveal direction="right">
            <div className="border-border bg-card rounded-3xl border p-8 shadow-lg lg:p-10">
              {/* Card Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                  <Mail className="text-primary size-6" />
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-bold">
                    {t("moodday.newsletter.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("moodday.newsletter.subtitle")}
                  </p>
                </div>
              </div>

              {/* Email Form */}
              {isSubmitted ? (
                <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="size-6 text-white" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">
                      {t("moodday.newsletter.subscribed")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("moodday.newsletter.subscribedSubtitle")}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder={t("moodday.newsletter.placeholder")}
                      {...register("email")}
                      className={cn(
                        "text-foreground placeholder:text-muted-foreground bg-muted/50 w-full rounded-xl border px-5 py-4 text-lg focus:ring-2 focus:ring-[#2BA09F] focus:outline-none",
                        errors.email ? "border-red-500" : "border-border",
                      )}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#1D7680] to-[#2BA09F] px-6 py-4 text-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        {t("moodday.newsletter.cta")}
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Privacy note */}
              <p className="text-muted-foreground mt-4 text-center text-xs">
                {t("moodday.newsletter.privacy")}
              </p>

              {/* Separator */}
              <div className="my-6 flex items-center gap-4">
                <div className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs tracking-wider uppercase">
                  {t("landing2.appComing.title")}
                </span>
                <div className="bg-border h-px flex-1" />
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* App Store badge */}
                <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-2.5">
                  <svg
                    className="text-foreground size-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <span className="text-foreground text-sm font-medium">
                    {t("moodday.mobileApp.appStore")}
                  </span>
                </div>

                {/* Play Store badge */}
                <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-2.5">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.4 0 .77.16 1.04.42l11.5 7.5c.5.32.82.89.82 1.53 0 .65-.32 1.22-.82 1.53l-11.5 7.5c-.27.26-.65.42-1.04.42-.83 0-1.5-.67-1.5-1.5z"
                      fill="#48A878"
                    />
                    <path
                      d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.4 0 .77.16 1.04.42l7.46 4.86L3 12.5v8z"
                      fill="#3DA5B8"
                    />
                    <path
                      d="M3 12.5l9-5.22 2.5 1.63-9.5 6.18V12.5z"
                      fill="#FFD700"
                    />
                    <path d="M3 4.5l10 6.5-3 1.5L3 8v-3.5z" fill="#FF5252" />
                  </svg>
                  <span className="text-foreground text-sm font-medium">
                    {t("moodday.mobileApp.googlePlay")}
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Mobile trust badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm lg:hidden">
          <span className="text-muted-foreground">
            ✓ {t("moodday.cta.trustBadges.freeTrial")}
          </span>
          <span className="text-muted-foreground">
            ✓ {t("moodday.cta.trustBadges.noCreditCard")}
          </span>
          <span className="text-muted-foreground">
            ✓ {t("moodday.cta.trustBadges.easyCancellation")}
          </span>
        </div>
      </div>
    </section>
  );
}
