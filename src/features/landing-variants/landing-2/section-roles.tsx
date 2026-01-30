"use client";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle,
  FileText,
  Heart,
  type LucideIcon,
  Pill,
  Shield,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "../shared";

const patientFeatureIcons: LucideIcon[] = [BarChart3, FileText, Heart, Shield];
const caregiverFeatureIcons: LucideIcon[] = [Bell, BarChart3, Pill, Heart];

export function SectionRoles() {
  const { t, tm } = useI18n();
  const [selectedRole, setSelectedRole] = useState<"patient" | "caregiver">(
    "patient",
  );

  type FeatureItem = { title: string; description: string };

  const patientFeatures = (
    tm<FeatureItem[]>("moodday.roles.patient.features") ?? []
  ).map((item, index) => ({
    icon: patientFeatureIcons[index],
    title: item.title,
    description: item.description,
  }));

  const caregiverFeatures = (
    tm<FeatureItem[]>("moodday.roles.caregiver.features") ?? []
  ).map((item, index) => ({
    icon: caregiverFeatureIcons[index],
    title: item.title,
    description: item.description,
  }));

  const roles = {
    patient: {
      title: t("moodday.roles.patient.title"),
      subtitle: t("moodday.roles.patient.subtitle"),
      icon: User,
      features: patientFeatures,
      cta: t("moodday.roles.patient.cta"),
      ctaLink: "/auth/signup?role=patient",
    },
    caregiver: {
      title: t("moodday.roles.caregiver.title"),
      subtitle: t("moodday.roles.caregiver.subtitle"),
      icon: Users,
      features: caregiverFeatures,
      cta: t("moodday.roles.caregiver.cta"),
      ctaLink: "/auth/signup?role=caregiver",
    },
  };

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-primary mb-4 text-sm font-medium tracking-widest uppercase">
              {t("moodday.roles.badge")}
            </p>
            <h2 className="text-foreground mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
              {t("moodday.roles.title")}{" "}
              <span className="bg-gradient-to-r from-[#1D7680] to-[#2BA09F] bg-clip-text text-transparent">
                {t("moodday.roles.titleHighlight")}
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("moodday.roles.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* Role Selector Tabs */}
        <ScrollReveal delay={100}>
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
                    "border-border bg-card flex flex-1 flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-300",
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary ring-2"
                      : "hover:border-muted-foreground/30 hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl transition-colors",
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {role === "patient"
                      ? t("moodday.roles.patient.tab")
                      : t("moodday.roles.caregiver.tab")}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Role Content */}
        <ScrollReveal delay={200}>
          <div
            key={selectedRole}
            className="border-border bg-card mx-auto max-w-5xl rounded-3xl border p-8 shadow-lg lg:p-14"
          >
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left - Info */}
              <div>
                <div
                  className={cn(
                    "bg-primary/10 text-primary mb-4 inline-flex size-16 items-center justify-center rounded-2xl",
                  )}
                >
                  {selectedRole === "patient" ? (
                    <User className="size-8" />
                  ) : (
                    <Users className="size-8" />
                  )}
                </div>

                <h3 className="text-foreground mb-2 text-2xl font-bold">
                  {roles[selectedRole].title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {roles[selectedRole].subtitle}
                </p>

                <Link
                  href={roles[selectedRole].ctaLink}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-primary hover:bg-primary/90 gap-2 rounded-2xl px-8",
                  )}
                >
                  {roles[selectedRole].cta}
                  <ArrowRight className="size-5" />
                </Link>
              </div>

              {/* Right - Features */}
              <div className="grid gap-5 sm:grid-cols-2">
                {roles[selectedRole].features.map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-muted/50 flex items-start gap-3 rounded-2xl p-5"
                  >
                    <div
                      className={cn(
                        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl",
                      )}
                    >
                      <feature.icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Trust Badge */}
        <ScrollReveal delay={300}>
          <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              <span>{t("moodday.roles.trust.designedWith")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              <span>{t("moodday.roles.trust.activeUsers")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              <span>{t("moodday.roles.trust.rating")}</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
