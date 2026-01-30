"use client";

import { Moon, TrendingUp, Users, LineChart } from "lucide-react";
import { ScrollReveal, GlassCardVariant } from "../shared";

export function SectionEvening() {
  const weekData = [
    { day: "Lun", value: 65 },
    { day: "Mar", value: 72 },
    { day: "Mer", value: 58 },
    { day: "Jeu", value: 80 },
    { day: "Ven", value: 75 },
    { day: "Sam", value: 82 },
    { day: "Dim", value: 78 },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#F0F9F4] to-[#E8E4F0] py-24">
      {/* Time indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full bg-white/60 px-6 py-3 shadow-sm backdrop-blur-sm">
          <Moon className="size-5 text-[#8B7BA8]" />
          <span className="font-medium text-gray-700">21h00 - Le Soir</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Story */}
          <div className="space-y-8">
            <ScrollReveal direction="left">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4C5E8]/30">
                  <LineChart className="size-6 text-[#8B7BA8]" />
                </div>
                <div>
                  <h2 className="mb-3 font-serif text-3xl font-light text-gray-800 md:text-4xl">
                    Comprendre mes patterns
                  </h2>
                  <p className="text-lg leading-relaxed text-gray-600">
                    Le soir, je prends quelques minutes pour regarder mes
                    tendances. Moodday m&apos;a aidée à identifier que mes
                    lundis sont souvent difficiles, mais que je remonte
                    naturellement en fin de semaine.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={200}>
              <blockquote className="border-l-4 border-[#D4C5E8] pl-6 font-serif text-xl text-gray-500 italic">
                &ldquo;Pour la première fois, je peux expliquer à mon médecin
                exactement comment je me suis sentie, données à
                l&apos;appui.&rdquo;
              </blockquote>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={400}>
              {/* Caregivers notification */}
              <GlassCardVariant
                variant="colored"
                color="lavender"
                className="p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#D4C5E8]/30">
                    <Users className="size-6 text-[#8B7BA8]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      Cercle d&apos;aidants notifié
                    </p>
                    <p className="text-sm text-gray-500">
                      Votre mère et votre psychiatre ont reçu un résumé
                      hebdomadaire.
                    </p>
                  </div>
                </div>
              </GlassCardVariant>
            </ScrollReveal>
          </div>

          {/* Right - Insights Card */}
          <ScrollReveal direction="right" delay={300}>
            <GlassCardVariant variant="light" blur="lg" className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="size-6 text-[#2BA09F]" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Tendances de la semaine
                  </h3>
                </div>
                <span className="rounded-full bg-[#48A878]/10 px-3 py-1 text-sm font-medium text-[#48A878]">
                  +12% vs sem. dernière
                </span>
              </div>

              {/* Mini chart */}
              <div className="mb-6 flex h-40 items-end justify-between gap-2 rounded-xl bg-gray-50 p-4">
                {weekData.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#2BA09F] to-[#48A878] transition-all duration-500"
                      style={{ height: `${day.value}%` }}
                    />
                    <span className="text-xs text-gray-400">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-[#2BA09F]/5 p-3">
                  <div className="mt-0.5 size-2 shrink-0 rounded-full bg-[#2BA09F]" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-[#2BA09F]">
                      Pattern détecté :
                    </span>{" "}
                    Votre humeur s&apos;améliore les jours où vous notez
                    &ldquo;bien dormi&rdquo;.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-[#48A878]/5 p-3">
                  <div className="mt-0.5 size-2 shrink-0 rounded-full bg-[#48A878]" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-[#48A878]">
                      Recommandation :
                    </span>{" "}
                    Continuez votre routine de sommeil régulière.
                  </p>
                </div>
              </div>
            </GlassCardVariant>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
