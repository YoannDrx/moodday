import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { AlertCircle, LayoutDashboard, Mail, User2 } from "lucide-react";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getAccountNavigation = (t: Translator): NavigationGroup[] => {
  return [
    {
      title: t("account.profile.section"),
      links: [
        {
          href: "/settings/profile",
          Icon: User2,
          label: t("account.profile.profile"),
        },
        {
          href: "/settings/notifications",
          Icon: Mail,
          label: t("account.profile.mail"),
        },
        {
          href: "/settings/privacy",
          Icon: AlertCircle,
          label: t("account.profile.danger"),
        },
      ],
    },
    {
      title: t("nav.app"),
      links: [
        {
          href: "/dashboard",
          Icon: LayoutDashboard,
          label: t("nav.dashboard"),
        },
      ],
    },
  ];
};
