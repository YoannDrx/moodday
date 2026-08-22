import type { NavigationGroup } from "@/features/navigation/navigation.type";
import {
  Bell,
  Compass,
  CreditCard,
  CloudCog,
  Globe,
  HeartPulse,
  Home,
  Lock,
  Palette,
  Shield,
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
          label: t("nav.today"),
        },
        {
          href: "/trends",
          Icon: Compass,
          label: t("nav.landmarks"),
        },
        {
          href: "/consultation",
          Icon: HeartPulse,
          label: t("nav.care"),
        },
        ...(features.caregiverSharing
          ? [
              {
                href: "/circle",
                Icon: Users,
                label: t("nav.circle"),
              },
            ]
          : []),
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
      label: t("nav.today"),
    },
    {
      href: "/trends",
      Icon: Compass,
      label: t("nav.landmarks"),
    },
    {
      href: "/consultation",
      Icon: HeartPulse,
      label: t("nav.care"),
    },
    {
      href: "/circle",
      Icon: Users,
      label: t("nav.circle"),
    },
  ];
};
