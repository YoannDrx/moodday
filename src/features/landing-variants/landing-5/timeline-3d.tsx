"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "../shared";
import { Sun, Coffee, Moon, TrendingUp } from "lucide-react";

export function Timeline3D() {
  const timelineItems = [
    {
      time: "Matin",
      icon: <Sun className="size-5" />,
      title: "Check-in rapide",
      description:
        "Commencez votre journée en 30 secondes avec un enregistrement d'humeur.",
      color: "from-amber-400 to-orange-400",
    },
    {
      time: "Journée",
      icon: <Coffee className="size-5" />,
      title: "Rappels intelligents",
      description:
        "Recevez des notifications discrètes pour vos médicaments et notes.",
      color: "from-[#2BA09F] to-[#3DA5B8]",
    },
    {
      time: "Soir",
      icon: <Moon className="size-5" />,
      title: "Revue quotidienne",
      description:
        "Analysez votre journée et découvrez vos patterns émotionnels.",
      color: "from-[#B8A5D6] to-[#D4C5E8]",
    },
    {
      time: "Mensuel",
      icon: <TrendingUp className="size-5" />,
      title: "Insights profonds",
      description:
        "Obtenez des analyses détaillées et des recommandations personnalisées.",
      color: "from-[#48A878] to-[#6FBD94]",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F7F3] py-24">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#2BA09F]/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Une journée avec Moodday
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Découvrez comment Moodday s&apos;intègre naturellement dans votre
              quotidien.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Central line */}
          <div className="absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#2BA09F]/50 via-[#48A878]/50 to-[#B8A5D6]/50 lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {timelineItems.map((item, idx) => (
              <ScrollReveal
                key={idx}
                delay={idx * 150}
                direction={idx % 2 === 0 ? "left" : "right"}
              >
                <div
                  className={cn(
                    "relative lg:grid lg:grid-cols-2 lg:gap-8",
                    idx % 2 === 0 ? "" : "lg:direction-rtl",
                  )}
                >
                  {/* Content */}
                  <div
                    className={cn(
                      "perspective-1000 lg:text-right",
                      idx % 2 === 1 && "lg:col-start-2 lg:text-left",
                    )}
                  >
                    <div className="preserve-3d hover-tilt inline-block rounded-3xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-xl lg:max-w-md">
                      <div
                        className={cn(
                          "mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-medium text-white",
                          item.color,
                        )}
                      >
                        {item.icon}
                        {item.time}
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div
                      className={cn(
                        "size-4 rounded-full bg-gradient-to-br shadow-lg",
                        item.color,
                      )}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
