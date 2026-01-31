import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  Dumbbell,
  FileText,
  Heart,
  HeartHandshake,
  Home,
  MessageSquare,
  Pill,
  Settings,
  Users,
} from "lucide-react";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getPatientNavigation = (t: Translator): NavigationGroup[] => {
  return [
    {
      title: t("patient.nav.main"),
      defaultOpenStartPath: "/dashboard",
      links: [
        {
          href: "/dashboard",
          Icon: Home,
          label: t("nav.dashboard"),
        },
        {
          href: "/mood",
          Icon: Heart,
          label: t("patient.nav.mood"),
        },
        {
          href: "/trends",
          Icon: BarChart3,
          label: t("patient.nav.trends"),
        },
      ],
    },
    {
      title: t("patient.nav.tracking"),
      defaultOpenStartPath: "/medications",
      links: [
        {
          href: "/medications",
          Icon: Pill,
          label: t("patient.nav.medications"),
        },
        {
          href: "/exercises",
          Icon: Dumbbell,
          label: t("patient.nav.exercises"),
        },
        {
          href: "/therapy",
          Icon: MessageSquare,
          label: t("patient.nav.therapy"),
        },
        {
          href: "/caregiver",
          Icon: Users,
          label: t("patient.nav.caregiver"),
        },
      ],
    },
    {
      title: t("patient.nav.tools"),
      defaultOpenStartPath: "/export",
      links: [
        {
          href: "/crisis",
          Icon: HeartHandshake,
          label: t("patient.nav.crisis"),
        },
        {
          href: "/export",
          Icon: FileText,
          label: t("patient.nav.export"),
        },
        {
          href: "/settings",
          Icon: Settings,
          label: t("settings.title"),
        },
      ],
    },
  ];
};

export type PatientMobileLink = {
  href: string;
  Icon: typeof Home;
  label: string;
};

export const getPatientMobileNavigation = (
  t: Translator,
): PatientMobileLink[] => {
  return [
    {
      href: "/dashboard",
      Icon: Home,
      label: t("nav.dashboard"),
    },
    {
      href: "/trends",
      Icon: BarChart3,
      label: t("patient.nav.trends"),
    },
    // Note: the center "+" button links to /mood
    {
      href: "/caregiver",
      Icon: Users,
      label: t("patient.nav.caregiver"),
    },
    {
      href: "/settings",
      Icon: Settings,
      label: t("settings.title"),
    },
  ];
};
