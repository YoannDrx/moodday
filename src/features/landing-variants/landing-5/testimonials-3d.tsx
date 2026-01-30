"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "../shared";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Testimonials3D() {
  const [activeIndex, setActiveIndex] = useState(1);

  const testimonials = [
    {
      name: "Marie L.",
      role: "Utilisatrice Pro",
      content:
        "Moodday a transformé ma relation avec ma santé mentale. Je comprends enfin mes patterns et je peux en parler avec mon psychiatre.",
      avatar: "from-[#2BA09F] to-[#48A878]",
    },
    {
      name: "Thomas D.",
      role: "Utilisateur depuis 8 mois",
      content:
        "L'interface est incroyablement intuitive. En quelques secondes chaque jour, j'ai une vision claire de mon état émotionnel.",
      avatar: "from-[#48A878] to-[#6FBD94]",
    },
    {
      name: "Sophie M.",
      role: "Aidante",
      content:
        "En tant que proche d'une personne bipolaire, le cercle d'aidants me permet de suivre son évolution tout en respectant son intimité.",
      avatar: "from-[#B8A5D6] to-[#D4C5E8]",
    },
  ];

  const prev = () =>
    setActiveIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () =>
    setActiveIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Ce qu&apos;ils en pensent
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Des milliers d&apos;utilisateurs ont transformé leur relation avec
              leur santé mentale.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* 3D Carousel */}
          <div className="carousel-3d relative flex h-[400px] items-center justify-center">
            {testimonials.map((testimonial, idx) => {
              const isActive = idx === activeIndex;
              const isPrev =
                idx ===
                (activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1);
              const isNext =
                idx ===
                (activeIndex === testimonials.length - 1 ? 0 : activeIndex + 1);

              return (
                <div
                  key={idx}
                  className={cn(
                    "carousel-3d-item absolute w-full max-w-lg rounded-3xl border bg-white p-8 shadow-xl",
                    isActive && "z-30 scale-100 opacity-100",
                    isPrev && "z-20 -translate-x-[60%] scale-90 opacity-60",
                    isNext && "z-20 translate-x-[60%] scale-90 opacity-60",
                    !isActive && !isPrev && !isNext && "scale-75 opacity-0",
                  )}
                  style={{
                    transform: isActive
                      ? "translateX(0) rotateY(0) scale(1)"
                      : isPrev
                        ? "translateX(-60%) rotateY(20deg) scale(0.9)"
                        : isNext
                          ? "translateX(60%) rotateY(-20deg) scale(0.9)"
                          : "scale(0.75)",
                  }}
                >
                  {/* Stars */}
                  <div className="mb-4 flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-5 fill-current" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="mb-6 text-lg text-gray-700">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "size-12 rounded-full bg-gradient-to-br",
                        testimonial.avatar,
                      )}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={prev}
              className="flex size-12 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:border-[#2BA09F] hover:text-[#2BA09F]"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              className="flex size-12 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:border-[#2BA09F] hover:text-[#2BA09F]"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "size-2 rounded-full transition-all",
                  idx === activeIndex
                    ? "w-8 bg-[#2BA09F]"
                    : "bg-gray-300 hover:bg-gray-400",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
