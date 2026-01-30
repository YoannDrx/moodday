"use client";

import { Clock, Pill, Bell, CheckCircle2 } from "lucide-react";
import { ScrollReveal, GlassCardVariant } from "../shared";

export function SectionDay() {
  const medications = [
    { name: "Lithium 400mg", time: "08h00", taken: true },
    { name: "Lamotrigine 100mg", time: "12h00", taken: true },
    { name: "Quétiapine 25mg", time: "20h00", taken: false },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#FEF9E7] to-[#F0F9F4] py-24">
      {/* Time indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full bg-white/60 px-6 py-3 shadow-sm backdrop-blur-sm">
          <Clock className="size-5 text-[#2BA09F]" />
          <span className="font-medium text-gray-700">12h30 - La Journée</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Medication Card */}
          <ScrollReveal direction="left" delay={200}>
            <GlassCardVariant variant="light" blur="lg" className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#48A878]/10">
                    <Pill className="size-5 text-[#48A878]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Mes médicaments
                    </h3>
                    <p className="text-sm text-gray-500">Aujourd&apos;hui</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#48A878]/10 px-3 py-1 text-sm font-medium text-[#48A878]">
                  2/3 pris
                </span>
              </div>

              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                      med.taken
                        ? "border border-[#48A878]/20 bg-[#48A878]/5"
                        : "border border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {med.taken ? (
                        <CheckCircle2 className="size-5 text-[#48A878]" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <p
                          className={`font-medium ${med.taken ? "text-[#48A878]" : "text-gray-700"}`}
                        >
                          {med.name}
                        </p>
                        <p className="text-sm text-gray-400">{med.time}</p>
                      </div>
                    </div>
                    {!med.taken && (
                      <Bell className="size-4 animate-pulse text-amber-500" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#2BA09F]/5 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-[#2BA09F]">
                    Rappel intelligent :
                  </span>{" "}
                  Votre prochaine prise est dans 7h30. Une notification vous
                  sera envoyée.
                </p>
              </div>
            </GlassCardVariant>
          </ScrollReveal>

          {/* Right - Story */}
          <div className="space-y-8">
            <ScrollReveal direction="right">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#48A878]/10">
                  <CheckCircle2 className="size-6 text-[#48A878]" />
                </div>
                <div>
                  <h2 className="mb-3 font-serif text-3xl font-light text-gray-800 md:text-4xl">
                    L&apos;adhérence simplifiée
                  </h2>
                  <p className="text-lg leading-relaxed text-gray-600">
                    Au bureau, entre deux réunions, je reçois un rappel discret.
                    Un tap, c&apos;est validé. Moodday a transformé ma gestion
                    des médicaments.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={200}>
              <blockquote className="border-l-4 border-[#48A878] pl-6 font-serif text-xl text-gray-500 italic">
                &ldquo;Je n&apos;ai pas oublié une seule prise depuis 3 mois.
                Mon psychiatre est impressionné.&rdquo;
              </blockquote>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={400}>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/60 p-4 text-center shadow-sm backdrop-blur-sm">
                  <p className="text-3xl font-bold text-[#2BA09F]">98%</p>
                  <p className="text-sm text-gray-500">Adhérence</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4 text-center shadow-sm backdrop-blur-sm">
                  <p className="text-3xl font-bold text-[#48A878]">90</p>
                  <p className="text-sm text-gray-500">Jours de suite</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4 text-center shadow-sm backdrop-blur-sm">
                  <p className="text-3xl font-bold text-[#B8A5D6]">3</p>
                  <p className="text-sm text-gray-500">Médicaments</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
