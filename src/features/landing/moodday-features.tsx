"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Brain,
  FileText,
  Heart,
  Moon,
  Pill,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Brain,
    title: "Suivi d'humeur intelligent",
    description:
      "Enregistrez votre humeur en quelques secondes avec notre échelle intuitive. Visualisez vos tendances et identifiez les patterns.",
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Pill,
    title: "Gestion des traitements",
    description:
      "Suivez vos médicaments, dosages et prises quotidiennes. Recevez des rappels et voyez les corrélations avec votre humeur.",
    color: "bg-sage/10 text-sage",
    gradient: "from-sage/20 to-sage/5",
  },
  {
    icon: Moon,
    title: "Journal du sommeil",
    description:
      "Notez vos heures de sommeil et leur qualité. Comprenez l'impact du repos sur votre bien-être mental.",
    color: "bg-lavender/30 text-primary",
    gradient: "from-lavender/30 to-lavender/10",
  },
  {
    icon: BarChart3,
    title: "Analyses & tendances",
    description:
      "Visualisez vos données sur des graphiques clairs. Identifiez les facteurs qui influencent votre état mental.",
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: FileText,
    title: "Export PDF médical",
    description:
      "Générez un rapport complet pour vos consultations. Facilitez la communication avec votre psychiatre ou thérapeute.",
    color: "bg-sage/10 text-sage",
    gradient: "from-sage/20 to-sage/5",
  },
  {
    icon: Users,
    title: "Cercle d'aidants",
    description:
      "Invitez un proche de confiance à suivre votre parcours. Partagez uniquement ce que vous souhaitez.",
    color: "bg-lavender/30 text-primary",
    gradient: "from-lavender/30 to-lavender/10",
  },
  {
    icon: Heart,
    title: "Zéro culpabilité",
    description:
      "Pas de streak, pas de gamification agressive. Votre bien-être passe avant tout, à votre rythme.",
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Shield,
    title: "Confidentialité totale",
    description:
      "Vos données sont chiffrées et vous appartiennent. Exportez ou supprimez tout à tout moment (RGPD).",
    color: "bg-sage/10 text-sage",
    gradient: "from-sage/20 to-sage/5",
  },
];

export function MooddayFeatures() {
  return (
    <section id="features" className="relative py-20 lg:py-32">
      {/* Background */}
      <div className="via-primary/5 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Fonctionnalités
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            Tout ce dont vous avez besoin pour{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              prendre soin de vous
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Des outils pensés avec des professionnels de santé pour vous
            accompagner au quotidien dans votre parcours de santé mentale.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  gradient,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  color: string;
  gradient: string;
}) {
  return (
    <div className="glass-card group shadow-soft relative h-full overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
      {/* Gradient Background on Hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
          gradient,
        )}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 inline-flex size-12 items-center justify-center rounded-2xl",
            color,
          )}
        >
          <Icon className="size-6" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
