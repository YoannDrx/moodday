"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { subscribeToNewsletterAction } from "@/features/newsletter/newsletter.action";
import {
  Check,
  Loader2,
  Smartphone,
  Watch,
  Wifi,
  Fingerprint,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollReveal } from "../shared";
import { toast } from "sonner";

const waitlistSchema = z.object({
  email: z.string().email(),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

export function SectionAppComing() {
  const { t, locale } = useI18n();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistForm) => {
    const result = await resolveActionResult(
      subscribeToNewsletterAction({
        email: data.email,
        locale,
        source: "mobile-app-waitlist",
      }),
    );

    if (result.alreadySubscribed) {
      toast.info(t("landing2.appComing.alreadySubscribed"));
    } else {
      toast.success(t("landing2.appComing.successTitle"), {
        description: t("landing2.appComing.successMessage"),
      });
    }
    setIsSubmitted(true);
  };

  const features = [
    {
      icon: <Wifi className="size-4" />,
      label: t("landing2.appComing.features.offline"),
    },
    {
      icon: <Watch className="size-4" />,
      label: t("landing2.appComing.features.watch"),
    },
    {
      icon: <Smartphone className="size-4" />,
      label: t("landing2.appComing.features.widgets"),
    },
    {
      icon: <Fingerprint className="size-4" />,
      label: t("landing2.appComing.features.biometric"),
    },
  ];

  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            {t("landing2.appComing.title")}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {t("landing2.appComing.subtitle")}
          </p>
        </ScrollReveal>

        {/* Store badges */}
        <ScrollReveal delay={100}>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-6">
            {/* App Store badge */}
            <div className="border-border bg-card hover:border-primary/30 flex items-center gap-3 rounded-xl border px-5 py-3 opacity-80 transition-all hover:opacity-100 hover:shadow-lg">
              <div className="flex size-10 items-center justify-center rounded-lg bg-black">
                <svg
                  className="size-6 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-muted-foreground text-xs">
                  {t("landing2.appComing.comingSoon")}
                </p>
                <p className="text-foreground font-semibold">App Store</p>
              </div>
            </div>

            {/* Play Store badge */}
            <div className="border-border bg-card hover:border-primary/30 flex items-center gap-3 rounded-xl border px-5 py-3 opacity-80 transition-all hover:opacity-100 hover:shadow-lg">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white dark:bg-gray-800">
                <svg className="size-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 3.5v17c0 .55.45 1 1 1 .28 0 .53-.11.71-.29L14 12 5.71 2.79A1 1 0 005 2.5c-.55 0-1 .45-1 1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M14 12l4.59-4.59c.55-.55.55-1.44 0-1.99l-.01-.01a1.4 1.4 0 00-1.98 0L14 8v4z"
                    fill="#EA4335"
                  />
                  <path
                    d="M14 12v4l2.6 2.59a1.4 1.4 0 001.98 0l.01-.01c.55-.55.55-1.44 0-1.99L14 12z"
                    fill="#34A853"
                  />
                  <path
                    d="M14 12L5.71 21.21A1 1 0 005 20.5v1c0 .28.11.53.29.71L14 14v-2z"
                    fill="#FBBC05"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-muted-foreground text-xs">
                  {t("landing2.appComing.comingSoon")}
                </p>
                <p className="text-foreground font-semibold">Google Play</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Waitlist form */}
        <ScrollReveal delay={200}>
          <div className="mx-auto max-w-md">
            {isSubmitted ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-semibold">
                    {t("landing2.appComing.successTitle")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("landing2.appComing.successMessage")}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div
                  className={cn(
                    "bg-card flex gap-2 rounded-xl border p-2",
                    errors.email ? "border-red-500" : "border-border",
                  )}
                >
                  <input
                    type="email"
                    placeholder={t("landing2.appComing.emailPlaceholder")}
                    {...register("email")}
                    className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent px-4 py-2 focus:outline-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-2 font-semibold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t("landing2.appComing.submitting")}
                      </>
                    ) : (
                      t("landing2.appComing.submitButton")
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

            <p className="text-muted-foreground mt-4 text-sm">
              {t("landing2.appComing.privacyNote")}
            </p>
          </div>
        </ScrollReveal>

        {/* Features */}
        <ScrollReveal delay={300}>
          <div className="mt-12">
            <p className="text-muted-foreground mb-4 text-sm font-medium">
              {t("landing2.appComing.features.title")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="border-border bg-card flex items-center gap-2 rounded-full border px-4 py-2"
                >
                  <span className="text-primary">{feature.icon}</span>
                  <span className="text-foreground text-sm">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
