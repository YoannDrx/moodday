"use client";

import { ScrollReveal } from "../shared";
import { Heart, Shield, FileText } from "lucide-react";

export function FeaturesZen() {
  const features = [
    {
      icon: <Heart className="size-6 text-[#3C8D7C]" />,
      title: "Suivi bienveillant",
      description: "Enregistrez votre humeur en toute simplicité",
    },
    {
      icon: <Shield className="size-6 text-[#5C8B6B]" />,
      title: "Données protégées",
      description: "Chiffrement et respect de votre vie privée",
    },
    {
      icon: <FileText className="size-6 text-[#7FA98D]" />,
      title: "Rapports clairs",
      description: "Export pour vos rendez-vous médicaux",
    },
  ];

  return (
    <section className="zen bg-[#EFE7DB] py-24">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal duration={1500}>
          <div className="flex justify-center gap-8 md:gap-16">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/50">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-serif text-lg font-light text-[#2F3B33]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#7A8075]">{feature.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
