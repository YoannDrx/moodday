"use client";

import { ScrollReveal } from "../shared";
import { BentoItem } from "./bento-item";
import {
  TrendingUp,
  Pill,
  Users,
  FileText,
  Shield,
  LineChart,
  CheckCircle2,
  Star,
} from "lucide-react";

export function BentoGrid() {
  return (
    <section id="features" className="bg-[#F8F7F3] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="bento-grid">
          {/* Large - Mood Tracking */}
          <ScrollReveal className="bento-span-2 bento-row-2">
            <BentoItem variant="primary" className="h-full" hover>
              <div className="flex h-full flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20">
                    <TrendingUp className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Suivi d&apos;humeur
                    </h3>
                    <p className="text-sm text-white/70">
                      Visualisez vos tendances
                    </p>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="mt-auto flex h-32 items-end gap-2 rounded-xl bg-white/10 p-4">
                  {[40, 55, 45, 70, 65, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg bg-white/30 transition-all hover:bg-white/50"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl">😊</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
                    7.5/10 aujourd&apos;hui
                  </span>
                </div>
              </div>
            </BentoItem>
          </ScrollReveal>

          {/* Medium - Medications */}
          <ScrollReveal delay={100} className="bento-span-2">
            <BentoItem variant="sage" hover className="h-full">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                  <Pill className="size-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Médicaments</h3>
              </div>

              <div className="mt-4 space-y-2">
                {["Lithium 400mg", "Lamotrigine 100mg"].map((med, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/10 p-3"
                  >
                    <span className="text-sm text-white">{med}</span>
                    <CheckCircle2 className="size-4 text-white/70" />
                  </div>
                ))}
              </div>

              <div className="mt-4 text-right">
                <span className="text-2xl font-bold text-white">98%</span>
                <span className="text-sm text-white/70"> adhérence</span>
              </div>
            </BentoItem>
          </ScrollReveal>

          {/* Small - Stats */}
          <ScrollReveal delay={200}>
            <BentoItem variant="light" hover className="h-full">
              <LineChart className="mb-2 size-8 text-[#2BA09F]" />
              <p className="text-3xl font-bold text-gray-900">+40%</p>
              <p className="text-sm text-gray-500">Amélioration moyenne</p>
            </BentoItem>
          </ScrollReveal>

          {/* Large - Insights Graph */}
          <ScrollReveal delay={300} className="bento-span-2">
            <BentoItem variant="gradient" hover className="h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Insights intelligents
                </h3>
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white">
                  IA
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-sm text-white/90">
                    📈 Votre humeur est meilleure les jours où vous dormez 7h+
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-sm text-white/90">
                    🌙 Pattern détecté : les lundis sont plus difficiles
                  </p>
                </div>
              </div>
            </BentoItem>
          </ScrollReveal>

          {/* Medium - Caregivers */}
          <ScrollReveal delay={400} className="bento-span-2">
            <BentoItem variant="lavender" hover className="h-full">
              <div className="flex items-center gap-3">
                <Users className="size-6 text-[#8B7BA8]" />
                <h3 className="text-lg font-bold text-gray-800">
                  Cercle d&apos;aidants
                </h3>
              </div>

              <div className="mt-4 flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="size-10 rounded-full border-2 border-white bg-gradient-to-br from-[#2BA09F] to-[#48A878]"
                  />
                ))}
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-white text-xs font-medium text-gray-500">
                  +2
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                5 personnes ont accès à vos rapports
              </p>
            </BentoItem>
          </ScrollReveal>

          {/* Small - Export */}
          <ScrollReveal delay={500}>
            <BentoItem variant="light" hover className="h-full">
              <FileText className="mb-2 size-8 text-[#48A878]" />
              <p className="font-bold text-gray-900">Export PDF</p>
              <p className="text-xs text-gray-500">Pour vos consultations</p>
            </BentoItem>
          </ScrollReveal>

          {/* Large - Testimonial */}
          <ScrollReveal delay={600} className="bento-span-2">
            <BentoItem variant="dark" hover className="h-full">
              <div className="flex items-start gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>

              <blockquote className="mt-4">
                <p className="text-lg text-white/90">
                  &ldquo;Moodday a transformé ma relation avec ma santé mentale.
                  Je comprends enfin mes patterns.&rdquo;
                </p>
              </blockquote>

              <footer className="mt-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#2BA09F] to-[#48A878]" />
                <div>
                  <p className="font-medium text-white">Marie L.</p>
                  <p className="text-sm text-white/50">Utilisatrice Pro</p>
                </div>
              </footer>
            </BentoItem>
          </ScrollReveal>

          {/* Medium - Security */}
          <ScrollReveal delay={700} className="bento-span-2">
            <BentoItem variant="light" hover className="h-full">
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-[#2BA09F]" />
                <h3 className="text-lg font-bold text-gray-800">
                  Sécurité maximale
                </h3>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["RGPD", "Chiffré", "EU Hosted", "Open Source"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-[#2BA09F]/10 px-3 py-1 text-xs font-medium text-[#2BA09F]"
                    >
                      {badge}
                    </span>
                  ),
                )}
              </div>
            </BentoItem>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
