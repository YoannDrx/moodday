"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { subscribeToNewsletterAction } from "@/features/newsletter/newsletter.action";
import { ArrowRight, CalendarHeart, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollReveal } from "../shared";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";

const emailSchema = z.object({
  email: z.string().email(),
});

type EmailForm = z.infer<typeof emailSchema>;

export function SectionCtaHybrid() {
  const { t, locale } = useI18n();
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    <section className="bg-background py-24">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal>
          <div className="border-border bg-card relative overflow-hidden rounded-3xl border p-8 shadow-xl lg:p-16">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1D7680]/10 via-transparent to-[#2BA09F]/10" />

            {/* Floating Elements */}
            <div className="absolute -top-8 -right-8 size-32 rounded-full bg-[#1D7680]/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-[#2BA09F]/10 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              {/* Icon */}
              <div className="bg-primary/10 mb-6 flex size-16 items-center justify-center rounded-2xl">
                <CalendarHeart className="text-primary size-8" />
              </div>

              {/* Title */}
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("moodday.cta.title")}{" "}
                <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                  {t("moodday.cta.titleHighlight")}
                </span>{" "}
                {t("moodday.cta.titleSuffix")}
              </h2>

              {/* Subtitle */}
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
                {t("moodday.cta.subtitle")}
              </p>

              {/* Email Form or CTA Buttons */}
              <div className="w-full max-w-md">
                {isSubmitted ? (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500">
                      <Check className="size-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground font-semibold">
                        {t("moodday.newsletter.subscribed")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div
                      className={cn(
                        "bg-muted/50 flex gap-2 rounded-xl border p-2",
                        errors.email ? "border-red-500" : "border-border",
                      )}
                    >
                      <input
                        type="email"
                        placeholder={t("moodday.newsletter.placeholder")}
                        {...register("email")}
                        className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent px-4 py-2 focus:outline-none"
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1D7680] to-[#2BA09F] px-6 py-2 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            {t("moodday.newsletter.cta")}
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-left text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </form>
                )}

                {/* Alternative CTA */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Link
                    href="/auth/signup"
                    className={cn(
                      buttonVariants({ variant: "link", size: "sm" }),
                      "text-primary",
                    )}
                  >
                    {t("moodday.cta.ctaPrimary")}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href="/contact"
                    className={cn(
                      buttonVariants({ variant: "link", size: "sm" }),
                      "text-muted-foreground",
                    )}
                  >
                    {t("moodday.cta.ctaSecondary")}
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div className="my-8 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />

              {/* App Coming Soon - Subtle */}
              <div className="opacity-70">
                <p className="text-muted-foreground mb-4 text-sm">
                  {t("landing2.appComing.title")}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* App Store badge */}
                  <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-2">
                    <svg
                      className="text-foreground size-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-foreground text-sm font-medium">
                      App Store
                    </span>
                  </div>

                  {/* Play Store badge */}
                  <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-2">
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
                      Google Play
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Text */}
              <p className="text-muted-foreground mt-8 text-sm">
                {t("moodday.cta.trust")}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
