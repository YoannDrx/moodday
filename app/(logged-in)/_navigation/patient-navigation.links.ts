import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  BarChart3,
  Bell,
  CreditCard,
  CloudCog,
  ClipboardList,
  Dumbbell,
  FileText,
  Globe,
  Heart,
  HeartHandshake,
  Home,
  Lock,
  MessageSquare,
  Palette,
  Pill,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type PatientNavigationFeatures = {
  billing: boolean;
  caregiverSharing: boolean;
  pushNotifications: boolean;
};

export const getPatientNavigation = (
  t: Translator,
  features: PatientNavigationFeatures,
): NavigationGroup[] => {
  const groups: NavigationGroup[] = [
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
      ],
    },
    {
      title: t("patient.nav.support"),
      defaultOpenStartPath: "/caregiver",
      links: [
        ...(features.caregiverSharing
          ? [
              {
                href: "/caregiver",
                Icon: Users,
                label: t("patient.nav.caregiver"),
              },
            ]
          : []),
        {
          href: "/crisis",
          Icon: HeartHandshake,
          label: t("patient.nav.crisis"),
        },
        {
          href: "/safety-plan",
          Icon: ShieldCheck,
          label: t("patient.nav.safetyPlan"),
        },
        {
          href: "/consultation",
          Icon: ClipboardList,
          label: t("patient.nav.consultation"),
        },
        {
          href: "/export",
          Icon: FileText,
          label: t("patient.nav.export"),
        },
      ],
    },
    {
      title: t("settings.title"),
      defaultOpenStartPath: "/settings",
      links: [
        {
          href: "/settings/profile",
          Icon: User,
          label: t("settings.sidebar.profile"),
        },
        ...(features.pushNotifications
          ? [
              {
                href: "/settings/notifications",
                Icon: Bell,
                label: t("settings.sidebar.notifications"),
              },
            ]
          : []),
        {
          href: "/settings/appearance",
          Icon: Palette,
          label: t("settings.sidebar.appearance"),
        },
        {
          href: "/settings/privacy",
          Icon: Shield,
          label: t("settings.sidebar.privacy"),
        },
        {
          href: "/settings/offline",
          Icon: CloudCog,
          label: t("settings.sidebar.offline"),
        },
        ...(features.billing
          ? [
              {
                href: "/settings/subscription",
                Icon: CreditCard,
                label: t("settings.sidebar.subscription"),
              },
            ]
          : []),
        {
          href: "/settings/security",
          Icon: Lock,
          label: t("settings.sidebar.security"),
        },
        {
          href: "/settings/language",
          Icon: Globe,
          label: t("settings.sidebar.language"),
        },
      ],
    },
  ];

  return groups;
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
      href: "/mood",
      Icon: Heart,
      label: t("patient.nav.mood"),
    },
    {
      href: "/medications/today",
      Icon: Pill,
      label: t("patient.nav.medications"),
    },
    {
      href: "/trends",
      Icon: BarChart3,
      label: t("patient.nav.trends"),
    },
    {
      href: "/settings/profile",
      Icon: User,
      label: t("settings.sidebar.profile"),
    },
  ];
};
