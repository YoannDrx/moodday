"use client";

import { ScrollReveal, AnimatedCounter } from "../shared";
import { Heart, Award, TrendingUp, Calendar } from "lucide-react";

export function SectionResult() {
  const stats = [
    {
      icon: <Calendar className="size-8 text-[#2BA09F]" />,
      value: 365,
      suffix: "",
      label: "jours de suivi",
      description: "Sans interruption",
    },
    {
      icon: <TrendingUp className="size-8 text-[#48A878]" />,
      value: 40,
      suffix: "%",
      label: "amélioration",
      description: "De la stabilité émotionnelle",
    },
    {
      icon: <Award className="size-8 text-[#B8A5D6]" />,
      value: 98,
      suffix: "%",
      label: "adhérence",
      description: "Aux médicaments",
    },
    {
      icon: <Heart className="size-8 text-rose-400" />,
      value: 3,
      suffix: "",
      label: "aidants connectés",
      description: "Famille et médecin",
    },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#E8E4F0] to-[#F8F7F3] py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium tracking-widest text-[#B8A5D6] uppercase">
              Un an plus tard
            </p>
            <h2 className="mb-6 font-serif text-4xl font-light text-gray-800 md:text-5xl lg:text-6xl">
              Ma transformation avec{" "}
              <span className="bg-gradient-to-r from-[#2BA09F] to-[#48A878] bg-clip-text font-medium text-transparent">
                Moodday
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-500">
              Ce qui a commencé comme un simple outil de suivi est devenu un
              véritable compagnon de ma santé mentale.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats grid */}
        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx * 100} direction="up">
              <div className="group rounded-3xl bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex justify-center">{stat.icon}</div>
                <p className="text-4xl font-bold text-gray-900 md:text-5xl">
                  <AnimatedCounter
                    end={stat.value}
                    duration={2000}
                    suffix={stat.suffix}
                  />
                </p>
                <p className="mt-2 text-lg font-medium text-gray-700">
                  {stat.label}
                </p>
                <p className="mt-1 text-sm text-gray-400">{stat.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonial */}
        <ScrollReveal delay={400}>
          <div className="relative rounded-3xl bg-gradient-to-br from-[#2BA09F]/10 to-[#D4C5E8]/20 p-8 md:p-12">
            <div className="absolute -top-4 left-8 text-6xl text-[#2BA09F]/20">
              &ldquo;
            </div>
            <blockquote className="relative z-10 text-center">
              <p className="mb-6 font-serif text-xl leading-relaxed text-gray-700 md:text-2xl">
                Moodday m&apos;a donné quelque chose d&apos;inestimable : la
                capacité de comprendre mes propres cycles émotionnels. Je ne
                subis plus mes hauts et mes bas – je les anticipe, je les
                comprends, et je m&apos;y prépare. C&apos;est un outil, mais
                c&apos;est surtout un allié.
              </p>
              <footer className="flex items-center justify-center gap-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#2BA09F] to-[#48A878]" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Marie L.</p>
                  <p className="text-sm text-gray-500">
                    Utilisatrice depuis 1 an
                  </p>
                </div>
              </footer>
            </blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
