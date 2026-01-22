"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle,
  FileText,
  Heart,
  Pill,
  Shield,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

const roles = {
  patient: {
    title: "Je suis patient(e)",
    subtitle: "Je souhaite suivre mon parcours de santé mentale",
    icon: User,
    color: "primary",
    features: [
      {
        icon: BarChart3,
        title: "Suivi quotidien",
        description:
          "Enregistrez humeur, sommeil et traitements en 30 secondes",
      },
      {
        icon: FileText,
        title: "Export consultations",
        description: "Générez un PDF complet pour votre psychiatre",
      },
      {
        icon: Heart,
        title: "Sans pression",
        description: "Pas de streak ni de notifications culpabilisantes",
      },
      {
        icon: Shield,
        title: "Données privées",
        description: "Chiffrement de bout en bout, conforme RGPD",
      },
    ],
    cta: "Créer mon compte patient",
    ctaLink: "/auth/signup?role=patient",
  },
  caregiver: {
    title: "Je suis aidant(e)",
    subtitle: "Je souhaite accompagner un proche",
    icon: Users,
    color: "sage",
    features: [
      {
        icon: Bell,
        title: "Alertes optionnelles",
        description: "Soyez notifié uniquement si votre proche le souhaite",
      },
      {
        icon: BarChart3,
        title: "Vue d'ensemble",
        description: "Consultez les tendances partagées par votre proche",
      },
      {
        icon: Pill,
        title: "Suivi médicaments",
        description: "Aidez à la gestion des traitements si autorisé",
      },
      {
        icon: Heart,
        title: "Respect de l'autonomie",
        description: "Le patient contrôle ce qu'il partage avec vous",
      },
    ],
    cta: "Rejoindre un cercle d'aidants",
    ctaLink: "/auth/signup?role=caregiver",
  },
};

export function MooddayRoles() {
  const [selectedRole, setSelectedRole] = useState<"patient" | "caregiver">(
    "patient",
  );

  return (
    <section className="relative py-20 lg:py-32">
      {/* Background */}
      <div className="via-sage/5 absolute inset-0 bg-gradient-to-b from-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="bg-sage/10 text-sage mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Pour qui ?
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            Que vous soyez{" "}
            <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
              patient ou aidant
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Moodday s&apos;adapte à votre situation pour vous accompagner au
            mieux dans votre parcours.
          </p>
        </motion.div>

        {/* Role Selector Tabs */}
        <div className="mx-auto mb-12 flex max-w-md justify-center gap-4">
          {(Object.keys(roles) as ("patient" | "caregiver")[]).map((role) => {
            const roleData = roles[role];
            const isSelected = selectedRole === role;
            const Icon = roleData.icon;

            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "glass-card flex flex-1 flex-col items-center gap-2 rounded-2xl p-4 transition-all",
                  isSelected
                    ? role === "patient"
                      ? "bg-primary/10 ring-primary ring-2"
                      : "bg-sage/10 ring-sage ring-2"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl",
                    isSelected
                      ? role === "patient"
                        ? "bg-primary text-white"
                        : "bg-sage text-white"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800",
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <span
                  className={cn(
                    "text-sm font-bold",
                    isSelected
                      ? role === "patient"
                        ? "text-primary"
                        : "text-sage"
                      : "text-gray-600 dark:text-gray-400",
                  )}
                >
                  {role === "patient" ? "Patient(e)" : "Aidant(e)"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Content */}
        <motion.div
          key={selectedRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card shadow-soft mx-auto max-w-4xl rounded-3xl p-8 lg:p-12"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left - Info */}
            <div>
              <div
                className={cn(
                  "mb-4 inline-flex size-16 items-center justify-center rounded-2xl",
                  selectedRole === "patient"
                    ? "bg-primary/10 text-primary"
                    : "bg-sage/10 text-sage",
                )}
              >
                {selectedRole === "patient" ? (
                  <User className="size-8" />
                ) : (
                  <Users className="size-8" />
                )}
              </div>

              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {roles[selectedRole].title}
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {roles[selectedRole].subtitle}
              </p>

              <Link
                href={roles[selectedRole].ctaLink}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 rounded-2xl px-8",
                  selectedRole === "patient"
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-sage hover:bg-sage/90",
                )}
              >
                {roles[selectedRole].cta}
                <ArrowRight className="size-5" />
              </Link>
            </div>

            {/* Right - Features */}
            <div className="grid gap-4 sm:grid-cols-2">
              {roles[selectedRole].features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-2xl bg-white/50 p-4 dark:bg-gray-800/50"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      selectedRole === "patient"
                        ? "bg-primary/10 text-primary"
                        : "bg-sage/10 text-sage",
                    )}
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="text-sage size-5" />
            <span>Conçu avec des psychiatres</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-sage size-5" />
            <span>+5000 utilisateurs actifs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-sage size-5" />
            <span>Note 4.8/5 sur l&apos;App Store</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
