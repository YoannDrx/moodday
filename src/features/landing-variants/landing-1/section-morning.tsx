"use client";

import { cn } from "@/lib/utils";
import { Sun, Coffee, Smile } from "lucide-react";
import { ScrollReveal, GlassCardVariant } from "../shared";
import { useState } from "react";

export function SectionMorning() {
  const [sliderValue, setSliderValue] = useState(65);

  const getMoodEmoji = (value: number) => {
    if (value < 20) return "😢";
    if (value < 40) return "😕";
    if (value < 60) return "😐";
    if (value < 80) return "😊";
    return "😄";
  };

  return (
    <section
      id="section-morning"
      className="relative min-h-screen bg-gradient-to-b from-[#EDE8F5] to-[#FEF9E7] py-24"
    >
      {/* Time indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full bg-white/60 px-6 py-3 shadow-sm backdrop-blur-sm">
          <Sun className="size-5 text-amber-500" />
          <span className="font-medium text-gray-700">7h00 - Le Réveil</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Story */}
          <div className="space-y-8">
            <ScrollReveal direction="left">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                  <Coffee className="size-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="mb-3 font-serif text-3xl font-light text-gray-800 md:text-4xl">
                    Ma routine commence
                  </h2>
                  <p className="text-lg leading-relaxed text-gray-600">
                    Chaque matin, avant même mon café, je prends 30 secondes
                    pour noter mon humeur dans Moodday. C&apos;est devenu aussi
                    naturel que de me brosser les dents.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={200}>
              <blockquote className="border-l-4 border-[#D4C5E8] pl-6 font-serif text-xl text-gray-500 italic">
                &ldquo;Avant Moodday, je ne réalisais pas à quel point mes
                matins influençaient toute ma journée.&rdquo;
              </blockquote>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={400}>
              <div className="flex flex-wrap gap-3">
                {["Rapide", "Non-intrusif", "Perspicace"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#D4C5E8]/30 px-4 py-2 text-sm font-medium text-[#8B7BA8]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right - Interactive Mood Slider */}
          <ScrollReveal direction="right" delay={300}>
            <GlassCardVariant variant="light" blur="lg" className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smile className="size-6 text-[#2BA09F]" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Check-in du matin
                  </h3>
                </div>
                <span className="text-4xl">{getMoodEmoji(sliderValue)}</span>
              </div>

              <div className="mb-6">
                <p className="mb-4 text-center text-gray-600">
                  Comment vous sentez-vous ce matin ?
                </p>

                {/* Slider */}
                <div className="relative mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#D4C5E8] via-[#2BA09F] to-[#48A878]"
                    style={{
                      background: `linear-gradient(to right, #D4C5E8 0%, #2BA09F 50%, #48A878 100%)`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 size-6 -translate-y-1/2 rounded-full border-4 border-white bg-[#2BA09F] shadow-lg transition-all"
                    style={{ left: `calc(${sliderValue}% - 12px)` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Très bas</span>
                  <span>Neutre</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Quick notes */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                  Facteurs du matin :
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Bien dormi", active: true },
                    { label: "Rêves agités", active: false },
                    { label: "Énergie ok", active: true },
                    { label: "Anxieux", active: false },
                  ].map((factor) => (
                    <button
                      key={factor.label}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm transition-all",
                        factor.active
                          ? "bg-[#2BA09F] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      )}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCardVariant>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
