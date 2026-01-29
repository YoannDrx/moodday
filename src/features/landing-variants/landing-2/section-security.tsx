"use client";

import { useI18n } from "@/i18n/provider";
import { Eye, FileCheck, Key, Lock, Server, Shield } from "lucide-react";
import { ScrollReveal } from "../shared";

export function SectionSecurity() {
  const { t } = useI18n();

  const securityFeatures = [
    {
      icon: <Lock className="size-5" />,
      title: t("landing2.security.features.encryption.title"),
      description: t("landing2.security.features.encryption.description"),
    },
    {
      icon: <Eye className="size-5" />,
      title: t("landing2.security.features.zeroKnowledge.title"),
      description: t("landing2.security.features.zeroKnowledge.description"),
    },
    {
      icon: <FileCheck className="size-5" />,
      title: t("landing2.security.features.gdpr.title"),
      description: t("landing2.security.features.gdpr.description"),
    },
    {
      icon: <Server className="size-5" />,
      title: t("landing2.security.features.euHosting.title"),
      description: t("landing2.security.features.euHosting.description"),
    },
    {
      icon: <Key className="size-5" />,
      title: t("landing2.security.features.secureAuth.title"),
      description: t("landing2.security.features.secureAuth.description"),
    },
    {
      icon: <Shield className="size-5" />,
      title: t("landing2.security.features.audits.title"),
      description: t("landing2.security.features.audits.description"),
    },
  ];

  return (
    <section id="security" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Visual */}
          <ScrollReveal direction="left">
            <div className="relative">
              {/* Central shield */}
              <div className="relative mx-auto flex size-64 items-center justify-center">
                {/* Animated rings */}
                <div className="border-primary/20 absolute inset-0 animate-ping rounded-full border" />
                <div
                  className="border-primary/30 absolute inset-4 animate-ping rounded-full border"
                  style={{ animationDelay: "0.5s" }}
                />
                <div
                  className="border-primary/40 absolute inset-8 animate-ping rounded-full border"
                  style={{ animationDelay: "1s" }}
                />

                {/* Shield icon */}
                <div className="from-primary shadow-primary/30 relative z-10 flex size-32 items-center justify-center rounded-full bg-gradient-to-br to-emerald-500 shadow-lg">
                  <Shield className="size-16 text-white" />
                </div>
              </div>

              {/* Floating badges */}
              <div className="bg-card absolute top-0 left-0 rounded-lg px-3 py-2 text-xs font-medium text-emerald-600 shadow-lg dark:text-emerald-400">
                {t("landing2.security.badges.ssl")}
              </div>
              <div className="bg-card text-primary absolute top-1/4 right-0 rounded-lg px-3 py-2 text-xs font-medium shadow-lg">
                {t("landing2.security.badges.rgpd")}
              </div>
              <div className="bg-card absolute bottom-0 left-1/4 rounded-lg px-3 py-2 text-xs font-medium text-purple-500 shadow-lg">
                {t("landing2.security.badges.hds")}
              </div>
            </div>
          </ScrollReveal>

          {/* Right - Content */}
          <div className="space-y-8">
            <ScrollReveal direction="right">
              <div>
                <p className="text-primary mb-4 text-sm font-medium tracking-widest uppercase">
                  {t("landing2.security.badge")}
                </p>
                <h2 className="text-foreground mb-6 text-3xl font-bold md:text-4xl">
                  {t("landing2.security.title")}
                </h2>
                <p className="text-muted-foreground">
                  {t("landing2.security.subtitle")}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {securityFeatures.map((feature, idx) => (
                <ScrollReveal key={idx} direction="right" delay={idx * 50}>
                  <div className="bg-card hover:bg-muted flex items-start gap-3 rounded-xl p-4 transition-all">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {feature.title}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
