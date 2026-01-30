"use client";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "../shared";
import { TrendingUp, Pill, Users, FileText, Shield, Zap } from "lucide-react";
import { useState } from "react";

export function FeatureCards3D() {
  const features = [
    {
      icon: <TrendingUp className="size-7" />,
      title: "Suivi d'humeur",
      description:
        "Enregistrez vos émotions et découvrez vos patterns grâce à nos visualisations interactives.",
      gradient: "from-[#2BA09F] to-[#3DA5B8]",
    },
    {
      icon: <Pill className="size-7" />,
      title: "Gestion des médicaments",
      description:
        "Rappels intelligents et suivi d'adhérence pour ne jamais oublier une prise.",
      gradient: "from-[#48A878] to-[#6FBD94]",
    },
    {
      icon: <Users className="size-7" />,
      title: "Cercle d'aidants",
      description:
        "Partagez vos données avec votre médecin ou vos proches de confiance.",
      gradient: "from-[#B8A5D6] to-[#D4C5E8]",
    },
    {
      icon: <FileText className="size-7" />,
      title: "Export PDF",
      description:
        "Générez des rapports professionnels pour vos consultations médicales.",
      gradient: "from-[#2BA09F] to-[#48A878]",
    },
    {
      icon: <Shield className="size-7" />,
      title: "Sécurité maximale",
      description:
        "Chiffrement de bout en bout, conforme RGPD, hébergé en Europe.",
      gradient: "from-[#6B7280] to-[#9CA3AF]",
    },
    {
      icon: <Zap className="size-7" />,
      title: "Insights IA",
      description:
        "Notre intelligence artificielle détecte des patterns invisibles à l'œil nu.",
      gradient: "from-[#F59E0B] to-[#FBBF24]",
    },
  ];

  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Une suite complète d&apos;outils pour prendre soin de votre santé
              mentale au quotidien.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <ScrollReveal key={idx} delay={idx * 100}>
              <FeatureCard3D {...feature} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard3D({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="perspective-1000 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "preserve-3d relative h-full rounded-3xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-500",
          isHovered && "shadow-2xl",
        )}
        style={{
          transform: isHovered
            ? "rotateY(-5deg) rotateX(5deg) translateZ(20px)"
            : "rotateY(0) rotateX(0) translateZ(0)",
        }}
      >
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 transition-opacity duration-500",
            gradient,
            isHovered && "opacity-5",
          )}
        />

        <div
          className={cn(
            "relative z-10 mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white transition-transform duration-500",
            gradient,
            isHovered && "scale-110",
          )}
        >
          {icon}
        </div>

        <h3 className="relative z-10 mb-3 text-xl font-bold text-gray-900">
          {title}
        </h3>
        <p className="relative z-10 text-gray-600">{description}</p>
      </div>
    </div>
  );
}
