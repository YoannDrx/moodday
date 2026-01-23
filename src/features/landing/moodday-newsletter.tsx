"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, Mail, Smartphone, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { subscribeToNewsletterAction } from "../newsletter/newsletter.action";

export function MooddayNewsletter() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsLoading(true);

    try {
      const result = await resolveActionResult(
        subscribeToNewsletterAction({
          email,
          locale,
          source: "landing",
        }),
      );

      if (result.ok) {
        setIsSubscribed(true);
        if (result.alreadySubscribed) {
          toast.info(t("moodday.newsletter.alreadySubscribed"));
        } else {
          toast.success(t("moodday.newsletter.success"));
        }
      }
    } catch {
      toast.error(t("moodday.newsletter.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="bg-primary absolute top-0 left-0 size-64 rounded-full blur-3xl" />
            <div className="bg-lavender absolute right-0 bottom-0 size-64 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            {/* Grid layout */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
              {/* Left: Newsletter */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="bg-primary/20 mb-4 flex size-12 items-center justify-center rounded-xl">
                  <Mail className="size-6 text-white" />
                </div>

                <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
                  {t("moodday.newsletter.title")}
                </h2>

                <p className="mb-6 text-gray-300">
                  {t("moodday.newsletter.subtitle")}
                </p>

                {isSubscribed ? (
                  <div className="animate-in fade-in zoom-in-95 flex items-center gap-3 rounded-xl bg-green-500/20 px-5 py-3 text-green-400 duration-300">
                    <CheckCircle className="size-5" />
                    <span className="font-medium">
                      {t("moodday.newsletter.subscribed")}
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Input
                        type="email"
                        placeholder={t("moodday.newsletter.placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "h-11 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-gray-400",
                          "focus:border-primary focus:ring-primary",
                        )}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 gap-2 rounded-xl px-5 font-semibold"
                      disabled={isLoading || !email}
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          {t("moodday.newsletter.cta")}
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  {t("moodday.newsletter.privacy")}
                </p>
              </div>

              {/* Right: Mobile App */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10">
                  <Smartphone className="size-6 text-white" />
                </div>

                <span className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  {t("moodday.mobileApp.badge")}
                </span>

                <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
                  {t("moodday.mobileApp.title")}
                </h2>

                <p className="mb-6 text-gray-300">
                  {t("moodday.mobileApp.subtitle")}
                </p>

                {/* App Store Badges */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* App Store */}
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4">
                    <svg
                      className="size-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400">
                        {t("moodday.mobileApp.comingSoon")}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        App Store
                      </p>
                    </div>
                  </div>

                  {/* Play Store */}
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4">
                    <svg
                      className="size-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.31 0 .61.1.86.27L20.5 12l-15.14 9.73c-.25.17-.55.27-.86.27-.83 0-1.5-.67-1.5-1.5z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400">
                        {t("moodday.mobileApp.comingSoon")}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        Google Play
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-gray-400 lg:justify-start">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-green-400" />
                    {t("moodday.mobileApp.features.offline")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-blue-400" />
                    {t("moodday.mobileApp.features.notifications")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-purple-400" />
                    {t("moodday.mobileApp.features.sync")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
